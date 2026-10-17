import { verifyToken } from '../../../lib/auth';
import cookie from 'cookie';

export default function handler(req, res) {
  const cookieHeader = req.headers.cookie || '';
  const parsed = cookie.parse(cookieHeader || '');
  const token = parsed.token;
  if (!token) return res.status(401).json({ ok: false, user: null });

  try {
    const payload = verifyToken(token);
    return res.status(200).json({ ok: true, user: payload });
  } catch (err) {
    return res.status(401).json({ ok: false, user: null });
  }
}
