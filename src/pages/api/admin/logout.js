import { clearAuthCookie } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, message: 'Method Not Allowed' });
  }

  try {
    clearAuthCookie(res);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[admin/logout] error', err);
    return res.status(500).json({ ok: false, message: 'Server error' });
  }
}
