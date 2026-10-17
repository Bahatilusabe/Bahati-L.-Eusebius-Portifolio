import prisma from '../../../../lib/prisma';
import { verifyToken } from '../../../../lib/auth';
import formidable from 'formidable';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

function parseForm(req) {
  const form = formidable({ multiples: false, uploadDir: path.join(process.cwd(), 'public', 'uploads'), keepExtensions: true });
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
}

function makeSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default async function handler(req, res) {
  // auth via cookie token
  const cookieHeader = req.headers.cookie || '';
  const parsed = cookieHeader.split(';').reduce((acc, cur) => {
    const [k, v] = cur.split('=');
    if (k && v) acc[k.trim()] = v.trim();
    return acc;
  }, {});
  const token = parsed.token || null;
  try {
    if (!token) throw new Error('Unauthorized');
    verifyToken(token);
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    if (req.query.id) {
      const video = await prisma.video.findUnique({ where: { id: req.query.id } });
      return res.json(video);
    }

    const { search = '', page = '1', limit = '10' } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const take = Math.max(1, parseInt(limit));
    const where = search
      ? { OR: [{ title: { contains: search, mode: 'insensitive' } }, { description: { contains: search, mode: 'insensitive' } }] }
      : {};
    const [items, total] = await Promise.all([
      prisma.video.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (pageNum - 1) * take, take }),
      prisma.video.count({ where }),
    ]);
    return res.json({ items, total, page: pageNum, limit: take });
  }

  if (req.method === 'POST') {
    try {
      const { fields, files } = await parseForm(req);

      const data = {
        title: fields.title,
        description: fields.description || '',
        url: fields.url || '',
        // youtube url optional
        thumbnail: null,
        slug: fields.slug || makeSlug(fields.title || '') || String(Date.now()),
        published: fields.published === 'true' || false,
      };

      if (!data.title || data.title.length < 3) return res.status(400).json({ error: 'Title required' });
      if (!data.url) return res.status(400).json({ error: 'Video URL required' });

      if (files && files.thumbnail) {
        const file = files.thumbnail;
        const rel = path.relative(path.join(process.cwd(), 'public'), file.filepath || file.path);
        data.thumbnail = '/' + rel.replace(/\\/g, '/');
      }

      // ensure unique slug
      let slug = data.slug;
      const exists = await prisma.video.findUnique({ where: { slug } });
      if (exists) slug = `${slug}-${Date.now()}`;
      data.slug = slug;

      const created = await prisma.video.create({ data });
      return res.status(201).json(created);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  if (req.method === 'PUT') {
    try {
      // support JSON body updates
      let body = '';
      for await (const chunk of req) body += chunk;
      let json = {};
      if (body && typeof body === 'string') {
        const t = body.trim();
        if (t.startsWith('{') || t.startsWith('[')) {
          try { json = JSON.parse(body); } catch (e) { console.error('Invalid JSON body', e); return res.status(400).json({ error: 'Invalid JSON' }); }
        } else if (t.length > 0) { console.error('Unexpected non-JSON body', t.slice(0,200)); return res.status(400).json({ error: 'Invalid JSON' }); }
      }
      const { id, ...updates } = json;
      if (!id) return res.status(400).json({ error: 'Missing id' });
      // protect slug uniqueness if updating slug or title
      if (updates.title && !updates.slug) {
        updates.slug = makeSlug(updates.title);
      }
      const updated = await prisma.video.update({ where: { id }, data: updates });
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
      await prisma.video.delete({ where: { id } });
      return res.json({ ok: true });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  res.setHeader('Allow', 'GET,POST,PUT,DELETE');
  res.status(405).end('Method Not Allowed');
}
