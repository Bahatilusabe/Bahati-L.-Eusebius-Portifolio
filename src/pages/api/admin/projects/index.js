import prisma, { PRISMA_STUB } from '../../../../lib/prisma';
import { verifyToken } from '../../../../lib/auth';
import formidable from 'formidable';
import cookie from 'cookie';
import fs from 'fs';
import path from 'path';
import { fileDb } from '../../../../lib/fileDb';
import { invalidateProjectsCache as invalidateServerProjectsCache } from '../../../../lib/serverData';

export const config = {
  api: {
    bodyParser: false,
  },
};

function parseForm(req) {
  const form = formidable({ multiples: true, uploadDir: path.join(process.cwd(), 'public', 'uploads'), keepExtensions: true });
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
}

function fieldValue(fields, name) {
  const value = fields[name];
  return Array.isArray(value) ? value[0] : value;
}

function invalidateProjectsCache() {
  const cache = globalThis.__DATA_CACHE;
  if (cache) {
    for (const key of cache.keys()) {
      if (key.startsWith('projects:')) cache.delete(key);
    }
  }
  invalidateServerProjectsCache();
}

export default async function handler(req, res) {
  // simple auth check: ensure valid token
  const rawCookie = req.headers.cookie || '';
  const parsed = cookie.parse(rawCookie || '');
  const token = parsed.token;
  try {
    if (!token) throw new Error('Unauthorized');
    verifyToken(token);
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    // if id provided, return single project
    if (req.query.id) {
      const id = req.query.id;
      if (PRISMA_STUB) {
        const project = fileDb.get('projects', id);
        return res.json(project);
      }
      const project = await prisma.project.findUnique({ where: { id } });
      return res.json(project);
    }

    // if slug provided, return whether a project with that slug exists
    if (req.query.slug) {
      const slug = Array.isArray(req.query.slug) ? req.query.slug[0] : req.query.slug;
      if (!slug) return res.json({ exists: false });
      if (PRISMA_STUB) {
        const all = fileDb.list('projects');
        const found = all.find((p) => p.slug === slug);
        return res.json({ exists: !!found });
      }
      const found = await prisma.project.findFirst({ where: { slug } });
      return res.json({ exists: !!found });
    }

    // query params: search, page, limit
    const { search = '', page = '1', limit = '10', filter = 'all' } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const take = Math.max(1, parseInt(limit));
    const whereSearch = search
      ? { OR: [{ title: { contains: search, mode: 'insensitive' } }, { description: { contains: search, mode: 'insensitive' } }] }
      : {};

    // map filter param to Prisma where clauses
    let whereFilter = {};
    const f = (filter || 'all').toString().toLowerCase();
    if (f === 'published') whereFilter = { published: true };
    else if (f === 'draft') whereFilter = { published: false };
    else if (f === 'featured') whereFilter = { featured: true };
    else whereFilter = {};

    // combine search + filter
    const where = { ...whereSearch, ...whereFilter };

    if (PRISMA_STUB) {
      const all = fileDb.list('projects');
      let items = all;
      if (search) items = items.filter((p) => p.title.toLowerCase().includes((search || '').toLowerCase()) || (p.description || '').toLowerCase().includes((search || '').toLowerCase()));
      if (f === 'published') items = items.filter((p) => !!p.published);
      else if (f === 'draft') items = items.filter((p) => !p.published);
      else if (f === 'featured') items = items.filter((p) => !!p.featured);
      const total = items.length;
      const pageItems = items.slice((pageNum - 1) * take, (pageNum - 1) * take + take);
      return res.json({ items: pageItems, total, page: pageNum, limit: take });
    }

    const [items, total] = await Promise.all([
      prisma.project.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (pageNum - 1) * take, take }),
      prisma.project.count({ where }),
    ]);
    return res.json({ items, total, page: pageNum, limit: take });
  }

  if (req.method === 'POST') {
    // create project (supports multipart with optional image)
    try {
      // Debug: log incoming fields/files for diagnosis
      try {
        console.debug('[projects.POST] headers:', Object.keys(req.headers || {}).slice(0,20));
      } catch (e) {}
      const { fields, files } = await parseForm(req);
      console.debug('[projects.POST] received fields keys:', Object.keys(fields || {}));
      console.debug('[projects.POST] sample fields.status/published:', { status: fields.status, published: fields.published });
      // normalize incoming slug (may be array)
      const rawSlug = (() => {
        const s = Array.isArray(fields.slug) ? fields.slug[0] : fields.slug;
        return s ? String(s).trim() : null;
      })();

      const data = {
        // coerce title to string so numbers or other types are accepted
        id: fieldValue(fields, 'id') ? String(fieldValue(fields, 'id')) : null,
        title: fieldValue(fields, 'title') != null ? String(fieldValue(fields, 'title')) : '',
        slug: rawSlug,
        description: fieldValue(fields, 'description') || '',
        summary: fieldValue(fields, 'summary') || fieldValue(fields, 'shortDescription') || null,
        technologies: fieldValue(fields, 'technologies') ? JSON.parse(fieldValue(fields, 'technologies')) : [],
        githubUrl: fieldValue(fields, 'githubUrl') || null,
        liveUrl: fieldValue(fields, 'liveUrl') || null,
        demoVideoUrl: fieldValue(fields, 'demoVideoUrl') || null,
        repoVisibility: fieldValue(fields, 'repoVisibility') || 'public',
        featured: fieldValue(fields, 'featured') === 'true',
        // normalize status/published which may arrive as arrays or strings
        status: (() => {
          const raw = fieldValue(fields, 'status');
          return raw ? String(raw).toLowerCase().trim() : null;
        })(),
        published: (() => {
          const rawPub = fieldValue(fields, 'published');
          const pubFlag = rawPub === 'true';
          const rawStatus = fieldValue(fields, 'status');
          const statusStr = rawStatus ? String(rawStatus).toLowerCase().trim() : '';
          return !!pubFlag || statusStr === 'published';
        })(),
      };

      if (!['public', 'private'].includes(String(data.repoVisibility).toLowerCase())) {
        return res.status(400).json({ error: 'Repository visibility must be public or private' });
      }
      data.repoVisibility = String(data.repoVisibility).toLowerCase();

      // Accept either `image` or `thumbnail` form field as the uploaded cover
      let file = null;
      if (files) {
        const f = files.image || files.thumbnail || null;
        if (Array.isArray(f)) file = f[0]; else file = f;
      }
      // helper to map an absolute saved path to a public /uploads/... URL, returns null if input invalid
      function savedPathToPublic(saved) {
        if (!saved || typeof saved !== 'string') return null;
        try {
          const rel = path.relative(path.join(process.cwd(), 'public'), saved);
          if (!rel) return null;
          return '/' + rel.replace(/\\/g, '/');
        } catch (e) {
          console.warn('savedPathToPublic error', e && e.message);
          return null;
        }
      }

      if (file) {
        // formidable may provide different props depending on version: filepath, path or newFilename
        const savedPath = file.filepath || file.path || (file.newFilename ? path.join(process.cwd(), 'public', 'uploads', file.newFilename) : null);
        const pub = savedPathToPublic(savedPath);
        if (pub) data.coverImage = pub; else console.warn('Could not determine saved file path for uploaded cover image', file && Object.keys(file));
      }

      // If slug missing, derive a simple slug from the title
      if (!data.slug && !data.id) {
        try {
          data.slug = data.title.toLowerCase().trim().replace(/[^a-z0-9\-\s]/g, '').replace(/\s+/g, '-').replace(/\-+/g, '-').replace(/^\-|\-$/g, '');
        } catch (e) {
          data.slug = null;
        }
      }

      // If gallery files were uploaded (multiple), and running in stub mode, persist their public paths
      let galleryPaths = [];
      if (files && files.gallery) {
        const galleryFiles = Array.isArray(files.gallery) ? files.gallery : [files.gallery];
        galleryPaths = galleryFiles.map((f) => {
          const saved = f.filepath || f.path || (f.newFilename ? path.join(process.cwd(), 'public', 'uploads', f.newFilename) : null);
          return savedPathToPublic(saved);
        }).filter(Boolean);
      }

  // Basic validation: title presence is accepted for any type (coerced to string);
  // remove minimum-length restriction so short or numeric titles are allowed.

      if (PRISMA_STUB) {
        const existing = data.id ? fileDb.get('projects', data.id) : null;
        if (data.id && !existing) return res.status(404).json({ error: 'Project not found' });
        data.slug = data.slug || existing?.slug || undefined;
        data.published = fieldValue(fields, 'published') == null && fieldValue(fields, 'status') == null
          ? !!existing?.published
          : !!data.published;
        const hasCover = data.coverImage || existing?.coverImage || existing?.thumbnail;
        if (data.published && !hasCover) {
          return res.status(400).json({ error: 'Cover image is required when publishing a project' });
        }
        const stubData = {
          ...data,
          thumbnail: data.coverImage || existing?.thumbnail || existing?.coverImage || null,
          ...(galleryPaths.length ? { gallery: [...(existing?.gallery || []), ...galleryPaths] } : {}),
          published: !!data.published,
        };
        delete stubData.id;
        const saved = existing
          ? fileDb.update('projects', existing.id, stubData)
          : fileDb.create('projects', stubData);
        invalidateProjectsCache();
        return res.status(existing ? 200 : 201).json(saved);
      }

      const existing = data.id
        ? await prisma.project.findUnique({ where: { id: data.id } })
        : null;
      if (data.id && !existing) return res.status(404).json({ error: 'Project not found' });
      data.slug = data.slug || existing?.slug || undefined;
      data.published = fieldValue(fields, 'published') == null && fieldValue(fields, 'status') == null
        ? !!existing?.published
        : !!data.published;
      if (data.published && !data.coverImage && !existing?.coverImage) {
        return res.status(400).json({ error: 'Cover image is required when publishing a project' });
      }

      const projectInput = {
        title: data.title,
        slug: data.slug || undefined,
        description: data.description,
        summary: data.summary,
        technologies: data.technologies,
        githubUrl: data.githubUrl,
        liveUrl: data.liveUrl,
        demoVideoUrl: data.demoVideoUrl,
        repoVisibility: data.repoVisibility,
        featured: data.featured,
        ...(data.coverImage ? { coverImage: data.coverImage } : {}),
        published: !!data.published,
      };
      const saved = existing
        ? await prisma.project.update({ where: { id: existing.id }, data: projectInput })
        : await prisma.project.create({ data: { ...projectInput, coverImage: data.coverImage || null } });
      invalidateProjectsCache();
      return res.status(existing ? 200 : 201).json(saved);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  if (req.method === 'PUT') {
    // update: expects JSON body with id and fields
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
      const { id, ...updates } = json;
      if (!id) return res.status(400).json({ error: 'Missing id' });

      // allow toggling featured only
      if (PRISMA_STUB) {
        const project = fileDb.update('projects', id, updates);
        invalidateProjectsCache();
        return res.json(project);
      }
      const project = await prisma.project.update({ where: { id }, data: updates });
      invalidateProjectsCache();
      return res.json(project);
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
        fileDb.delete('projects', id);
        invalidateProjectsCache();
        return res.json({ ok: true });
      }
      await prisma.project.delete({ where: { id } });
      invalidateProjectsCache();
      return res.json({ ok: true });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  res.setHeader('Allow', 'GET,POST,PUT,DELETE');
  res.status(405).end('Method Not Allowed');
}
