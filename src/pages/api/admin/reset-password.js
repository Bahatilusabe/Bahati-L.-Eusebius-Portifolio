import { parse } from 'cookie';
import bcrypt from 'bcryptjs';
import { verifyToken } from '../../../lib/auth';
import prisma, { PRISMA_STUB } from '../../../lib/prisma';
import { fileDb } from '../../../lib/fileDb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = req.headers.cookie ? parse(req.headers.cookie || '').token : null;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    let payload;
    try {
      payload = verifyToken(token);
    } catch (err) {
      console.error('reset-password: invalid token', err && err.message);
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Require admin role (or treat known admin email as admin)
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    if (!payload || !(payload.role === 'ADMIN' || (adminEmail && String(payload.email).toLowerCase() === adminEmail))) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { newPassword } = req.body || {};
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({ error: 'newPassword required and must be >= 6 chars' });
    }

    const email = String(payload.email || '').toLowerCase();
    const newHash = await bcrypt.hash(newPassword, 10);

    if (PRISMA_STUB) {
      const users = await (fileDb.listAsync ? fileDb.listAsync('users') : Promise.resolve(fileDb.list('users')));
      const me = users.find((u) => String(u.email).toLowerCase() === email);
      if (!me) return res.status(404).json({ error: 'User not found' });
      if (fileDb.updateAsync) {
        await fileDb.updateAsync('users', me.id, { passwordHash: newHash, lastResetBy: payload.email || 'admin', lastResetAt: new Date().toISOString() });
      } else {
        fileDb.update('users', me.id, { passwordHash: newHash, lastResetBy: payload.email || 'admin', lastResetAt: new Date().toISOString() });
      }
      console.log(`reset-password: password for ${me.email} reset by ${payload.email || 'admin'}`);
    } else {
      const me = await prisma.user.findUnique({ where: { email } });
      if (!me) return res.status(404).json({ error: 'User not found' });
      await prisma.user.update({ where: { id: me.id }, data: { password: newHash, lastResetBy: payload.email || 'admin', lastResetAt: new Date().toISOString() } });
      console.log(`reset-password: password for ${me.email} reset by ${payload.email || 'admin'}`);
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error('reset-password error', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
