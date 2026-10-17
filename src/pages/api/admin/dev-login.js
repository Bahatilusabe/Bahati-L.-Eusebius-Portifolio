import { signToken, setAuthCookie } from '../../../lib/auth';

export default function handler(req, res) {
  // Only enable this endpoint in development to avoid accidental exposure.
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ ok: false, message: 'Forbidden' });
  }

  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  if (!adminEmail) {
    return res.status(503).json({ ok: false, message: 'ADMIN_EMAIL is not configured' });
  }
  const email = (req.body && req.body.email) || adminEmail;

  const user = { id: 'dev-admin', email, name: 'Dev Admin', role: 'ADMIN' };
  const token = signToken({ sub: user.id, role: user.role, email: user.email });

  setAuthCookie(res, token);

  return res.status(200).json({ ok: true, user });
}
