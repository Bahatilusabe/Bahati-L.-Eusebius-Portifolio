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
      const list = fileDb.list('sessions');
      return res.json({ sessions: list || [] });
    }

    if (req.method === 'DELETE') {
      let id = null;
      try {
        const body = req.body || '';
        if (typeof body === 'string') {
          const t = body.trim();
          if (t.startsWith('{') || t.startsWith('[')) {
            const parsed = JSON.parse(body);
            id = parsed.id;
          } else {
            return res.status(400).json({ error: 'Invalid JSON' });
          }
        } else {
          id = body.id;
        }
      } catch (e) {
        console.error('Invalid JSON body for sessions delete', e);
        return res.status(400).json({ error: 'Invalid JSON' });
      }
      if (!id) return res.status(400).json({ error: 'id required' });
      try {
        fileDb.delete('sessions', id);
      } catch (e) {
        // ignore missing
      }
      const list = fileDb.list('sessions');
      return res.json({ sessions: list || [] });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}
