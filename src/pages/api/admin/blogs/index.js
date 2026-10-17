import prisma, { PRISMA_STUB } from '../../../../lib/prisma';
import { verifyToken } from '../../../../lib/auth';
import { fileDb } from '../../../../lib/fileDb';
import { invalidateBlogsCache } from '../../../../lib/serverData';

export default async function handler(req, res) {
  // auth (token in cookie)
  const cookie = req.headers.cookie || '';
  let token = null;
  cookie.split(';').forEach((c) => {
    const [k, v] = c.split('=');
    if (k && k.trim() === 'token') token = v;
  });
  try {
    if (!token) throw new Error('Unauthorized');
    verifyToken(token);
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    if (req.query.id) {
      const id = req.query.id;
      if (PRISMA_STUB) {
        const blog = fileDb.get('blogs', id);
        return blog ? res.json({ item: blog }) : res.status(404).json({ error: 'Not found' });
      }
      const blog = await prisma.blog.findUnique({ where: { id } });
      return blog ? res.json({ item: blog }) : res.status(404).json({ error: 'Not found' });
    }

    const { search = '', status = 'all', page = '1', limit = '10' } = req.query;
    const pageNum = Math.max(1, Number.parseInt(page, 10) || 1);
    const take = Math.max(1, Number.parseInt(limit, 10) || 10);
    const where = {};
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { summary: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status === 'published') where.published = true;
    if (status === 'draft') where.published = false;

    if (PRISMA_STUB) {
      const all = fileDb.list('blogs');
      const query = String(search || '').toLowerCase();
      const items = all.filter((blog) => {
        const matchesSearch = !query
          || [blog.title, blog.summary, blog.category].some((value) => String(value || '').toLowerCase().includes(query));
        const matchesStatus = status === 'published'
          ? blog.published === true
          : status === 'draft'
            ? blog.published !== true
            : true;
        return matchesSearch && matchesStatus;
      });
      const total = items.length;
      const pageItems = items.slice((pageNum - 1) * take, (pageNum - 1) * take + take);
      return res.json({ items: pageItems, total, page: pageNum, limit: take });
    }

    const [items, total] = await Promise.all([
      prisma.blog.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (pageNum - 1) * take, take }),
      prisma.blog.count({ where }),
    ]);
    return res.json({ items, total, page: pageNum, limit: take });
  }

  if (req.method === 'POST') {
    try {
      let body = '';
      for await (const chunk of req) body += chunk;
      // guard against invalid (HTML) payloads causing JSON.parse to throw
      let json = {};
      if (body && typeof body === 'string') {
        const trimmed = body.trim();
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
          try { json = JSON.parse(body); } catch (e) {
            console.error('Invalid JSON body', e);
            return res.status(400).json({ error: 'Invalid JSON' });
          }
        } else if (trimmed.length > 0) {
          console.error('Unexpected non-JSON body', trimmed.slice(0, 200));
          return res.status(400).json({ error: 'Invalid JSON' });
        }
      }
      
      const data = {
        title: json.title,
        slug: json.slug || (json.title ? json.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : undefined),
        summary: json.summary || null,
        content: json.content || '',
        coverImage: json.coverImage || null,
        category: String(json.category || 'General').trim() || 'General',
        tags: Array.isArray(json.tags)
          ? Array.from(new Set(json.tags.filter((tag) => typeof tag === 'string').map((tag) => tag.trim()).filter(Boolean)))
          : [],
        published: !!json.published,
      };

      if (!data.title || data.title.length < 3) return res.status(400).json({ error: 'Title too short' });
      if (PRISMA_STUB) {
        const created = fileDb.create('blogs', data);
        invalidateBlogsCache();
        return res.status(201).json(created);
      }
      const created = await prisma.blog.create({ data });
      invalidateBlogsCache();
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
      const json = JSON.parse(body || '{}');
      const { id } = json;
      if (!id) return res.status(400).json({ error: 'Missing id' });
      const updates = {};
      if (json.title !== undefined) updates.title = String(json.title).trim();
      if (json.slug !== undefined) updates.slug = String(json.slug).trim();
      if (json.summary !== undefined) updates.summary = String(json.summary).trim() || null;
      if (json.content !== undefined) updates.content = String(json.content);
      if (json.coverImage !== undefined) updates.coverImage = String(json.coverImage).trim() || null;
      if (json.category !== undefined) updates.category = String(json.category).trim() || 'General';
      if (json.tags !== undefined) {
        updates.tags = Array.isArray(json.tags)
          ? Array.from(new Set(json.tags.filter((tag) => typeof tag === 'string').map((tag) => tag.trim()).filter(Boolean)))
          : [];
      }
      if (json.published !== undefined) updates.published = Boolean(json.published);
      if (updates.title !== undefined && updates.title.length < 3) return res.status(400).json({ error: 'Title too short' });
      if (PRISMA_STUB) {
        const blog = fileDb.update('blogs', id, updates);
        if (!blog) return res.status(404).json({ error: 'Not found' });
        invalidateBlogsCache();
        return res.json(blog);
      }
      const blog = await prisma.blog.update({ where: { id }, data: updates });
      invalidateBlogsCache();
      return res.json(blog);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'Missing id' });
      if (PRISMA_STUB) {
        fileDb.delete('blogs', id);
        invalidateBlogsCache();
        return res.json({ ok: true });
      }
      await prisma.blog.delete({ where: { id } });
      invalidateBlogsCache();
      return res.json({ ok: true });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  res.setHeader('Allow', 'GET,POST,PUT,DELETE');
  res.status(405).end('Method Not Allowed');
}
