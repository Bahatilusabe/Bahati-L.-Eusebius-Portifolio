import { useState } from 'react';
import { useRouter } from 'next/router';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Login failed');
        setLoading(false);
        return;
      }

      // cookie is set by server; verify /api/admin/me can see it before redirecting
      try {
        const meRes = await fetch('/api/admin/me', { credentials: 'same-origin' });
        if (meRes.ok) {
          // Use a full navigation so the browser includes cookies in the initial
          // request and the server-side `getServerSideProps` can read the cookie.
          window.location.href = '/secure-console/dashboard';
        } else {
          setError('Login succeeded but verification failed. Please refresh and try again.');
        }
      } catch (err) {
        setError('Login succeeded but verification failed. Please refresh and try again.');
      }
    } catch (err) {
      console.error(err);
      setError('Unexpected error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="w-full max-w-md p-8 bg-white/5 rounded-lg backdrop-blur">
        <h1 className="text-2xl mb-4">Admin Login</h1>
        {error && <div className="mb-2 text-red-400">{error}</div>}
        <form onSubmit={handleSubmit}>
          <label className="block mb-2">
            <span className="text-sm text-gray-200">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full p-2 rounded bg-black/20"
            />
          </label>

          <label className="block mb-4">
            <span className="text-sm text-gray-200">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full p-2 rounded bg-black/20"
            />
          </label>

          <button
            type="submit"
            className="w-full py-2 px-4 rounded bg-blue-600 hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        {/* quick dev login removed */}
      </div>
    </div>
  );
}
