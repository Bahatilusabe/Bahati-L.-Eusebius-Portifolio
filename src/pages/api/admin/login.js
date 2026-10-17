import { validateCredentials, signToken, setAuthCookie } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, message: 'Method Not Allowed' });
  }

  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ ok: false, message: 'Missing credentials' });

    const user = await validateCredentials(String(email).toLowerCase(), String(password));
    if (!user) return res.status(401).json({ ok: false, message: 'Invalid credentials' });

    const token = signToken({ sub: user.id, role: user.role, email: user.email });

    setAuthCookie(res, token);

    return res.status(200).json({ ok: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    console.error('[admin/login] error', err);
    return res.status(500).json({ ok: false, message: 'Server error' });
  }
}
