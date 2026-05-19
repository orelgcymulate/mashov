'use client';

import { Suspense, useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, ApiError } from '@/lib/api-client';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') ?? '/today';
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const result = await api.post<{ token: string }>('/api/auth/login', { password });
      // Stash the JWT for the cross-origin Socket.io handshake (cookies don't
      // cross *.up.railway.app subdomains, so the WS connection takes the
      // token as `auth.token` in the handshake instead).
      try {
        if (result?.token) localStorage.setItem('mashov_token', result.token);
      } catch {
        /* ignore Safari private-mode quota errors */
      }
      router.push(next);
      router.refresh();
    } catch (err) {
      const message =
        err instanceof ApiError && err.status === 401 ? 'סיסמה שגויה' : 'משהו השתבש, נסה שוב';
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="card p-8 w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold text-center">דשבורד משפחתי</h1>
        <p className="text-sm text-center" style={{ color: 'var(--muted)' }}>
          הזן סיסמה כדי להיכנס
        </p>
        <div>
          <label className="label" htmlFor="password">
            סיסמה
          </label>
          <input
            id="password"
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            required
          />
        </div>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <button className="btn w-full justify-center" disabled={busy}>
          {busy ? 'מתחבר…' : 'כניסה'}
        </button>
      </form>
    </main>
  );
}
