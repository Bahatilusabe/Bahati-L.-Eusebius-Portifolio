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
    if (req.query.id) {
      const skill = await prisma.skill.findUnique({ where: { id: req.query.id } });
      return res.json(skill);
    }

    const { search = '', page = '1', limit = '10' } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const take = Math.max(1, parseInt(limit));
    const where = search
      ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { category: { contains: search, mode: 'insensitive' } }] }
      : {};

    const [items, total] = await Promise.all([
      prisma.skill.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (pageNum - 1) * take, take }),
      prisma.skill.count({ where }),
    ]);
    return res.json({ items, total, page: pageNum, limit: take });
  }

  if (req.method === 'POST') {
    try {
      const { name, category, level } = req.body;
      if (!name || name.length < 1) return res.status(400).json({ error: 'Name required' });
      const levelNum = parseInt(level || 0);
      if (isNaN(levelNum) || levelNum < 0 || levelNum > 100) return res.status(400).json({ error: 'Level must be 0-100' });

      const created = await prisma.skill.create({ data: { name, category: category || null, level: levelNum } });
      return res.status(201).json(created);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
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
      const { id, name, category, level } = json;
      if (!id) return res.status(400).json({ error: 'Missing id' });
      const updates = {};
      if (name) updates.name = name;
      if (category !== undefined) updates.category = category || null;
      if (level !== undefined) {
        const levelNum = parseInt(level || 0);
        if (isNaN(levelNum) || levelNum < 0 || levelNum > 100) return res.status(400).json({ error: 'Level must be 0-100' });
        updates.level = levelNum;
      }
      const updated = await prisma.skill.update({ where: { id }, data: updates });
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
      await prisma.skill.delete({ where: { id } });
      return res.json({ ok: true });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  res.setHeader('Allow', 'GET,POST,PUT,DELETE');
  res.status(405).end('Method Not Allowed');
}
