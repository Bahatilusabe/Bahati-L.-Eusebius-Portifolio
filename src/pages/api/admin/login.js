import { validateCredentials, signToken, setAuthCookie } from '../../../lib/auth';
import { getJwtSecret } from '../../../lib/jwtSecret';

function getAuthConfigurationError() {
  try {
    getJwtSecret();
  } catch {
    return 'Admin sign-in is not configured: set a random JWT_SECRET of at least 32 characters.';
  }

  if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
    return 'Admin sign-in is not configured: DATABASE_URL is missing.';
  }

  if (process.env.NODE_ENV !== 'production' && !process.env.DATABASE_URL) {
    const adminEmail = process.env.ADMIN_EMAIL?.trim();
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminEmail || !adminPassword || adminPassword.length < 12) {
      return 'Local admin sign-in requires ADMIN_EMAIL and an ADMIN_PASSWORD of at least 12 characters.';
    }
  }

  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, message: 'Method Not Allowed' });
  }

  try {
    const configurationError = getAuthConfigurationError();
    if (configurationError) {
      return res.status(503).json({ ok: false, message: configurationError });
    }

    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ ok: false, message: 'Missing credentials' });

    const user = await validateCredentials(String(email).toLowerCase(), String(password));
    if (!user) return res.status(401).json({ ok: false, message: 'Invalid credentials' });

    const token = signToken({ sub: user.id, role: user.role, email: user.email });

    setAuthCookie(res, token);

    return res.status(200).json({ ok: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    console.error('[admin/login] request failed', {
      name: err instanceof Error ? err.name : 'UnknownError',
      code: err && typeof err === 'object' && 'code' in err ? err.code : undefined,
    });
    return res.status(500).json({ ok: false, message: 'Server error' });
  }
}
