import prisma, { PRISMA_STUB } from '../../../../lib/prisma';
import { verifyToken } from '../../../../lib/auth';
import { fileDb } from '../../../../lib/fileDb';
import cookie from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const parsed = cookie.parse(req.headers.cookie || '');
  const token = parsed.token;
  try {
    if (!token) throw new Error('Unauthorized');
    verifyToken(token);
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const ids = req.body && Array.isArray(req.body.ids) ? req.body.ids : null;
  if (!ids || !Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: 'Missing ids' });

  try {
    if (PRISMA_STUB) {
      // delete sequentially in stub mode using async helpers
      for (const id of ids) {
        // fileDb.deleteAsync returns true
        // ignore missing ids
        await fileDb.deleteAsync('projects', id);
      }
      return res.json({ ok: true, deleted: ids.length });
    }

    const result = await prisma.project.deleteMany({ where: { id: { in: ids } } });
    return res.json({ ok: true, deleted: result.count });
  } catch (err) {
    console.error('batch-delete error', err && err.message);
    return res.status(500).json({ error: 'Server error' });
  }
}
