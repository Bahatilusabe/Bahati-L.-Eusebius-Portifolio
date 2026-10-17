import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import bcrypt from 'bcryptjs';
import prisma, { PRISMA_STUB } from './prisma';
import { fileDb } from './fileDb';
import { getJwtSecret } from './jwtSecret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export function signToken(payload) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token) {
  return jwt.verify(token, getJwtSecret());
}

export function setAuthCookie(res, token) {
  const cookieStr = cookie.serialize('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7 // 7 days
  });
  res.setHeader('Set-Cookie', cookieStr);
}

export function clearAuthCookie(res) {
  res.setHeader('Set-Cookie', cookie.serialize('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0
  }));
}

export async function validateCredentials(email, plainPassword) {
  // If running in offline stub mode, use the persisted fileDB admin user first.
  if (PRISMA_STUB) {
    const normalizedEmail = String(email || '').toLowerCase();
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminEmail || !adminPassword || adminPassword.length < 12) {
      throw new Error('Offline admin authentication requires ADMIN_EMAIL and an ADMIN_PASSWORD of at least 12 characters.');
    }
    const users = fileDb.list('users') || [];
    const existing = users.find((u) => String(u.email).toLowerCase() === normalizedEmail) || null;

    if (existing && existing.passwordHash) {
      const ok = await bcrypt.compare(plainPassword, existing.passwordHash);
      if (ok) {
        return { id: existing.id, email: existing.email, name: existing.name, role: existing.role || 'ADMIN' };
      }

      // Allow the offline admin env password to work when the stored hash is stale.
      if (normalizedEmail === adminEmail && plainPassword === adminPassword) {
        const passwordHash = await bcrypt.hash(adminPassword, 10);
        if (fileDb.updateAsync) {
          await fileDb.updateAsync('users', existing.id, { passwordHash });
        } else {
          fileDb.update('users', existing.id, { passwordHash });
        }
        return { id: existing.id, email: existing.email, name: existing.name, role: existing.role || 'ADMIN' };
      }

      return null;
    }

    if (normalizedEmail === adminEmail && plainPassword === adminPassword) {
      const user = {
        id: existing?.id || 'offline-admin',
        email: adminEmail,
        name: existing?.name || 'Admin (offline)',
        role: existing?.role || 'ADMIN',
      };

      const passwordHash = await bcrypt.hash(adminPassword, 10);
      if (!existing) {
        fileDb.create('users', { id: user.id, email: user.email, name: user.name, role: user.role, passwordHash });
      }

      return user;
    }

    return null;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;
  const ok = await bcrypt.compare(plainPassword, user.password);
  if (!ok) return null;
  return user;
}
