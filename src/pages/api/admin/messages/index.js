import prisma from '../../../../lib/prisma';
import { verifyToken } from '../../../../lib/auth';
import cookie from 'cookie';

export default async function handler(req, res) {
  // auth
  try {
    const cookies = cookie.parse(req.headers.cookie || '');
    const token = cookies.token;
    if (!token) throw new Error('Unauthorized');
    verifyToken(token);
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    // if id provided, return single message
    if (req.query.id) {
      const msg = await prisma.message.findUnique({ where: { id: req.query.id } });
      return res.json(msg);
    }

    const { search = '', page = '1', limit = '10' } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const take = Math.max(1, parseInt(limit));
    const where = search
      ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }, { subject: { contains: search, mode: 'insensitive' } }, { body: { contains: search, mode: 'insensitive' } }] }
      : {};

    const [items, total] = await Promise.all([
      prisma.message.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (pageNum - 1) * take, take }),
      prisma.message.count({ where }),
    ]);
    return res.json({ items, total, page: pageNum, limit: take });
  }

  if (req.method === 'PUT') {
    try {
      let body = '';
      for await (const chunk of req) body += chunk;
      let json = {};
      if (body && typeof body === 'string') {
        const t = body.trim();
        if (t.startsWith('{') || t.startsWith('[')) {
          try { json = JSON.parse(body); } catch (e) { console.error('Invalid JSON body', e); return res.status(400).json({ error: 'Invalid JSON' }); }
        } else if (t.length > 0) { console.error('Unexpected non-JSON body', t.slice(0,200)); return res.status(400).json({ error: 'Invalid JSON' }); }
      }
      const { id, read } = json;
      if (!id) return res.status(400).json({ error: 'Missing id' });
      const updated = await prisma.message.update({ where: { id }, data: { read: !!read } });
      return res.json(updated);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'Missing id' });
      await prisma.message.delete({ where: { id } });
      return res.json({ ok: true });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  res.setHeader('Allow', 'GET,PUT,DELETE');
  res.status(405).end('Method Not Allowed');
}
