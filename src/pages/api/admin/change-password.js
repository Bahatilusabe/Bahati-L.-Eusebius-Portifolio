import { parse } from 'cookie';
import bcrypt from 'bcryptjs';
import { verifyToken } from '../../../lib/auth';
import prisma, { PRISMA_STUB } from '../../../lib/prisma';
import { fileDb } from '../../../lib/fileDb';

export default async function handler(req, res) {
  console.time('change-password:total');
  try {
    const token = req.headers.cookie ? parse(req.headers.cookie || '').token : null;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const user = verifyToken(token);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    // Prefer Next.js parsed body when available, otherwise read raw stream
    let currentPassword = null;
    let newPassword = null;
    if (req.body && typeof req.body === 'object') {
      currentPassword = req.body.currentPassword;
      newPassword = req.body.newPassword;
    } else {
      const body = await new Promise((resolve) => {
        let s = '';
        req.on('data', (c) => (s += c));
        req.on('end', () => resolve(s));
      });
      if (body && typeof body === 'string') {
        const t = body.trim();
        if (t.startsWith('{') || t.startsWith('[')) {
          try {
            const parsed = JSON.parse(body);
            currentPassword = parsed.currentPassword;
            newPassword = parsed.newPassword;
          } catch {
            console.error('Invalid JSON body for change-password');
            return res.status(400).json({ error: 'Invalid JSON' });
          }
        } else if (t.length > 0) {
          console.error('Unexpected non-JSON body for change-password');
          return res.status(400).json({ error: 'Invalid JSON' });
        }
      }
    }
    if (!newPassword) return res.status(400).json({ error: 'newPassword required' });

    const email = String(user.email || '').toLowerCase();
    let storedHash = '';
    let userId = null;

    if (PRISMA_STUB) {
      const users = fileDb.list('users') || [];
      const me = users.find((u) => String(u.email || '').toLowerCase() === email) || null;
      if (!me) return res.status(404).json({ error: 'User not found' });
      storedHash = me.passwordHash || '';
      userId = me.id;

      if (storedHash) {
        if (!currentPassword) return res.status(403).json({ error: 'Current password required' });
        console.time('change-password:compare');
        const ok = await bcrypt.compare(currentPassword, storedHash);
        console.timeEnd('change-password:compare');
        if (!ok) return res.status(403).json({ error: 'Current password incorrect' });
      }

      console.time('change-password:hash');
      const newHash = await bcrypt.hash(newPassword, 10);
      console.timeEnd('change-password:hash');
      if (fileDb.updateAsync) {
        await fileDb.updateAsync('users', userId, { passwordHash: newHash });
      } else {
        fileDb.update('users', userId, { passwordHash: newHash });
      }
    } else {
      const me = await prisma.user.findUnique({ where: { email } });
      if (!me) return res.status(404).json({ error: 'User not found' });
      storedHash = me.password || '';
      userId = me.id;

      if (storedHash) {
        if (!currentPassword) return res.status(403).json({ error: 'Current password required' });
        console.time('change-password:compare');
        const ok = await bcrypt.compare(currentPassword, storedHash);
        console.timeEnd('change-password:compare');
        if (!ok) return res.status(403).json({ error: 'Current password incorrect' });
      }

      console.time('change-password:hash');
      const newHash = await bcrypt.hash(newPassword, 10);
      console.timeEnd('change-password:hash');
      await prisma.user.update({ where: { id: userId }, data: { password: newHash } });
    }

    console.timeEnd('change-password:total');
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}
