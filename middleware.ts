import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt, { TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';
import cookie from 'cookie';
import { getJwtSecret } from './src/lib/jwtSecret';

// Contract / behavior
// - Protect all routes under /secure-console/*
// - If no valid JWT is present, redirect to /secure-console/login
// - If the token is expired, redirect with ?expired=1 and clear the cookie
// - Support token in cookie named `token` or in Authorization: Bearer <token>

function clearTokenCookieOnResponse(res: NextResponse) {
  // Overwrite the token cookie to expire it immediately
  const serialized = cookie.serialize('token', '', {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,
  });
  // Note: set header directly to ensure cookie is cleared in the browser
  res.headers.set('set-cookie', serialized);
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only protect pages under /secure-console
  if (!pathname.startsWith('/secure-console')) {
    return NextResponse.next();
  }

  // Allow the login page and static assets under secure-console/login
  if (pathname === '/secure-console/login') {
    return NextResponse.next();
  }

  // Extract token from cookie OR Authorization header
  const cookieHeader = req.headers.get('cookie') || '';
  const parsed = cookie.parse(cookieHeader || '');
  let token = parsed.token;

  if (!token) {
    const authHeader = req.headers.get('authorization') || '';
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }
  }

  const redirectToLogin = (opts?: { expired?: boolean }) => {
    const url = req.nextUrl.clone();
    url.pathname = '/secure-console/login';
    if (opts?.expired) url.searchParams.set('expired', '1');
    const res = NextResponse.redirect(url);
    // clear token cookie for safety
    clearTokenCookieOnResponse(res);
    return res;
  };

  if (!token) {
    return redirectToLogin();
  }

  try {
    // This will throw if token is invalid or expired
    jwt.verify(token, getJwtSecret());
    // token is valid — allow the request
    return NextResponse.next();
  } catch (err) {
    if (!(err instanceof JsonWebTokenError) && !(err instanceof TokenExpiredError)) {
      console.error('[middleware] Authentication configuration error:', err instanceof Error ? err.message : 'Unknown error');
    }
    if (err instanceof TokenExpiredError) {
      return redirectToLogin({ expired: true });
    }
    if (err instanceof JsonWebTokenError) {
      return redirectToLogin();
    }
    // Unknown error — block access and redirect to login
    return redirectToLogin();
  }
}

export const config = {
  matcher: ['/secure-console/:path*'],
};
