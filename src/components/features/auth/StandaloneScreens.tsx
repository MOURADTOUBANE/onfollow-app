'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Icon } from '@/components/graphics/Icon';
import { Illustration } from '@/components/graphics/Illustration';
import { Pill } from '@/components/ui/atoms';
import { useAuth } from '@/components/providers/AuthProvider';
import { api } from '@/lib/api';
import { firstName } from '@/lib/utils';
import type { Status } from '@/lib/types';

export function VerifyView() {
  const { user } = useAuth();
  const email = user?.email ?? 'you@example.com';
  const [cooldown, setCooldown] = useState(0);

  async function resend() {
    await api.auth.resendVerification(email);
    setCooldown(30);
    const tick = () => setCooldown((c) => { if (c <= 1) return 0; setTimeout(tick, 1000); return c - 1; });
    setTimeout(tick, 1000);
  }

  return (
    <div className="empty">
      <Illustration name="mail" />
      <h2>Check your email</h2>
      <p>We sent a verification link to <strong>{email}</strong>. Open it to activate your account.</p>
      <div className="row-btn">
        <button className="btn primary" disabled={cooldown > 0} onClick={resend}>{cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend link'}</button>
        <Link className="btn plain" href="/register">Wrong email?</Link>
      </div>
    </div>
  );
}

export function VerifiedView() {
  return (
    <div className="empty">
      <Illustration name="verified" />
      <h2>Email verified</h2>
      <p>You&apos;re all set. Let&apos;s get your pipeline going.</p>
      <div className="row-btn"><Link className="btn primary lg" href="/welcome">Continue</Link></div>
    </div>
  );
}

export function WelcomeView({ onAddFirst }: { onAddFirst: () => void }) {
  const { user } = useAuth();
  const router = useRouter();
  const steps: Status[] = ['saved', 'applied', 'interview', 'offer'];
  return (
    <div className="empty" style={{ maxWidth: 540 }}>
      <Illustration name="welcome" />
      <h2>Welcome, {firstName(user?.name)}.</h2>
      <p>Every role you&apos;re chasing lives on one board, and each one carries its next step.</p>
      <div className="steps-path">
        {steps.map((k, i) => (
          <span key={k} style={{ display: 'contents' }}>
            {i > 0 && <span className="ar"><Icon name="arrowR" size={16} /></span>}
            <Pill k={k} />
          </span>
        ))}
      </div>
      <div className="row-btn">
        <button className="btn primary lg" onClick={() => { router.push('/board'); setTimeout(onAddFirst, 600); }}>Add my first application</button>
      </div>
    </div>
  );
}

export function NotFoundView() {
  const { user } = useAuth();
  return (
    <div className="empty">
      <Illustration name="notfound" />
      <h2>We can&apos;t find that page</h2>
      <p>The link may be old, or the application was deleted.</p>
      <div className="row-btn"><Link className="btn primary" href={user ? '/overview' : '/login'}>{user ? 'Back to your overview' : 'Back to log in'}</Link></div>
    </div>
  );
}

export function ErrorView({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="empty">
      <Illustration name="error" />
      <h2>Something went wrong on our side</h2>
      <p>Your applications are safe. Try again in a moment.</p>
      <div className="row-btn">
        <button className="btn primary" onClick={onRetry ?? (() => location.reload())}><Icon name="refresh" size={18} />Try again</button>
        <Link className="btn ghost" href="/overview">Back to your overview</Link>
      </div>
    </div>
  );
}
