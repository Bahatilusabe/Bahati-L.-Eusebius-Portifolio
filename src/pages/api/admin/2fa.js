import { parse } from 'cookie';
import { verifyToken } from '../../../lib/auth';
import { fileDb } from '../../../lib/fileDb';

export default async function handler(req, res) {
  try {
    const token = req.headers.cookie ? parse(req.headers.cookie || '').token : null;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const user = verifyToken(token);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    if (req.method === 'GET') {
      const users = fileDb.list('users') || [];
      const me = users.find((u) => u.email === user.email) || null;
      return res.json({ tfa: me?.tfa || { enabled: false, secret: null } });
    }

    if (req.method === 'POST') {
      // Parse payload defensively (body may be raw string when using some clients)
      let payload = {};
      try {
        if (typeof req.body === 'string') {
          const t = req.body.trim();
          if (t === '') payload = {};
          else if (t.startsWith('{') || t.startsWith('[')) payload = JSON.parse(req.body);
          else return res.status(400).json({ error: 'Invalid JSON' });
        } else {
          payload = req.body || {};
        }
      } catch (e) {
        console.error('Invalid JSON body for 2fa', e);
        return res.status(400).json({ error: 'Invalid JSON' });
      }

      // support global twoFactor management via { action: 'enable' | 'disable' }
      if (payload.action) {
        const cfgs = fileDb.list('twoFactor') || [];
        const cfg = cfgs[0] || { id: 'local', enabled: false, secret: null };
        if (payload.action === 'enable') {
          cfg.enabled = true;
          cfg.secret = generateSecret();
        } else if (payload.action === 'disable') {
          cfg.enabled = false;
          cfg.secret = null;
        }
        try {
          await fileDb.update('twoFactor', cfg.id, cfg);
        } catch (e) {
          await fileDb.create('twoFactor', cfg);
        }
        return res.json({ enabled: cfg.enabled, qr: cfg.secret });
      }

      // support per-user toggle via { enabled: boolean }
      if (typeof payload.enabled !== 'undefined') {
        const users = fileDb.list('users') || [];
        let me = users.find((u) => u.email === user.email) || null;
        // If running in dev stub mode and the user isn't present, create a minimal record
        if (!me) {
          try {
            me = fileDb.create('users', { email: user.email || 'unknown', name: user.name || 'Admin (offline)', passwordHash: '' });
          } catch (e) {
            console.warn('Failed to create offline user for tfa', e && e.message);
            return res.status(500).json({ error: 'User creation failed' });
          }
        }
        if (payload.enabled) {
          const secret = generateSecret();
          await fileDb.update('users', me.id, { tfa: { enabled: true, secret } });
          return res.json({ ok: true, tfa: { enabled: true, secret } });
        }
        await fileDb.update('users', me.id, { tfa: { enabled: false, secret: null } });
        return res.json({ ok: true, tfa: { enabled: false } });
      }

      return res.status(400).json({ error: 'Invalid payload' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}

function generateSecret() {
  // simple dev secret generator (not production-grade)
  return 'DEV-' + Math.random().toString(36).slice(2, 10).toUpperCase();
}
