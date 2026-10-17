import cloudinary from '../../../../lib/cloudinary';
import prisma, { PRISMA_STUB } from '../../../../lib/prisma';
import cookie from 'cookie';
import { verifyToken } from '../../../../lib/auth';
import { fileDb } from '../../../../lib/fileDb';

export default async function handler(req, res) {
  try {
    const cookies = cookie.parse(req.headers.cookie || '');
    const token = cookies.token;
    if (!token) throw new Error('Unauthorized');
    verifyToken(token);
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    // return current settings cvUrl
    if (PRISMA_STUB) {
      const s = fileDb.list('settings')[0] || null;
      return res.json({ cv: s?.cvUrl || null });
    }
    const settings = await prisma.settings.findFirst();
    return res.json({ cv: settings?.cvUrl || null });
  }

  if (req.method === 'POST') {
    // set/replace CV: expects JSON body { url, public_id }
    try {
      // prefer parsed body if available (Next.js bodyParser), otherwise stream the raw body
      let json = {};
      if (req.body && Object.keys(req.body).length > 0) {
        json = req.body;
      } else {
        let body = '';
        for await (const chunk of req) body += chunk;
        if (body && typeof body === 'string') {
          const t = body.trim();
          if (t.startsWith('{') || t.startsWith('[')) {
            try { json = JSON.parse(body); } catch (e) { console.error('Invalid JSON body', e); return res.status(400).json({ error: 'Invalid JSON' }); }
          } else if (t.length > 0) { console.error('Unexpected non-JSON body', t.slice(0,200)); return res.status(400).json({ error: 'Invalid JSON' }); }
        }
      }
      const { url, public_id } = json || {};
      if (!url) return res.status(400).json({ error: 'Missing url' });

      // store in settings (create if none)
      if (PRISMA_STUB) {
        const existing = fileDb.list('settings')[0] || null;
        if (existing) {
          const updated = fileDb.update('settings', existing.id, { cvUrl: url });
          return res.json({ ok: true, cv: updated.cvUrl });
        }
        const created = fileDb.create('settings', { id: 'default', cvUrl: url });
        return res.json({ ok: true, cv: created.cvUrl });
      }

      const settings = await prisma.settings.upsert({ where: { id: 'default' }, update: { cvUrl: url }, create: { id: 'default', cvUrl: url } });
      // Note: we don't delete old cloudinary file here automatically; caller can manage deletion if needed
      return res.json({ ok: true, cv: settings.cvUrl });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      // delete the stored CV (we won't delete cloudinary asset automatically unless public_id provided)
      let json = {};
      if (req.body && Object.keys(req.body).length > 0) json = req.body;
      else {
        let body = '';
        for await (const chunk of req) body += chunk;
        if (body && typeof body === 'string') {
          const t = body.trim();
          if (t.startsWith('{') || t.startsWith('[')) {
            try { json = JSON.parse(body); } catch (e) { console.error('Invalid JSON body', e); return res.status(400).json({ error: 'Invalid JSON' }); }
          } else if (t.length > 0) { console.error('Unexpected non-JSON body', t.slice(0,200)); return res.status(400).json({ error: 'Invalid JSON' }); }
        }
      }
      const { public_id } = json;

      if (public_id) {
        try { await cloudinary.uploader.destroy(public_id, { resource_type: 'raw' }); } catch (e) { console.error('cloudinary delete failed', e); }
      }

      // clear cvUrl in settings
      if (PRISMA_STUB) {
        const s = fileDb.list('settings')[0] || null;
        if (s) fileDb.update('settings', s.id, { cvUrl: null });
        return res.json({ ok: true });
      }
      const s = await prisma.settings.findFirst();
      if (s) await prisma.settings.update({ where: { id: s.id }, data: { cvUrl: null } });
      return res.json({ ok: true });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  res.setHeader('Allow', 'GET,POST,DELETE');
  res.status(405).end('Method Not Allowed');
}
