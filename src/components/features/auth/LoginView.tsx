'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState, type FormEvent } from 'react';
import { Icon } from '@/components/graphics/Icon';
import { Illustration } from '@/components/graphics/Illustration';
import { IconInput, PasswordInput, Field } from '@/components/ui/forms';
import { BusyDots } from '@/components/ui/atoms';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { api, ApiError, tokenStore } from '@/lib/api';
import { EMAIL_RE } from '@/lib/validation';
import { firstName } from '@/lib/utils';

export function LoginView() {
  return (
    <>
      <Suspense fallback={null}>
        <VerificationNotice />
      </Suspense>
      <LoginViewInner />
    </>
  );
}

function VerificationNotice() {
  const params = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const { setUser } = useAuth();
  const shown = useRef(false);

  useEffect(() => {
    if (shown.current) return;
    const status = params.get('verified');
    if (!status) return;
    shown.current = true;
    tokenStore.clear();
    setUser(null);
    if (status === '1') {
      toast('Your email is verified. You can log in now.');
    } else if (status === 'expired') {
      toast('That verification link has expired. Request a new one from the login page.', { type: 'err' });
    } else {
      toast('That verification link is invalid.', { type: 'err' });
    }
    router.replace('/login');
  }, [params, router, setUser, toast]);

  return null;
}

function LoginViewInner() {
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  if (unverifiedEmail) return <UnverifiedState email={unverifiedEmail} onBack={() => setUnverifiedEmail(null)} />;
  return <LoginForm onUnverified={setUnverifiedEmail} />;
}

function LoginForm({ onUnverified }: { onUnverified: (email: string) => void }) {
  const { setUser } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errs, setErrs] = useState<{ email?: string; password?: string }>({});
  const [formErr, setFormErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const err: typeof errs = {};
    if (!email) err.email = 'Enter your email.'; else if (!EMAIL_RE.test(email)) err.email = 'Enter a valid email address.';
    if (!password) err.password = 'Enter your password.';
    setErrs(err); setFormErr('');
    if (Object.keys(err).length) return;
    setBusy(true);
    try {
      const user = await api.auth.login({ email, password });
      setUser(user);
      toast(`Welcome back, ${firstName(user.name)}`);
      router.push(user.verified ? '/overview' : '/verify');
    } catch (ex) {
      setBusy(false);
      if (ex instanceof ApiError && ex.code === 'email_not_verified') onUnverified(email);
      else if (ex instanceof ApiError && (ex.status === 401 || ex.status === 422)) setFormErr("That email and password don't match. Check both and try again.");
      else setFormErr('Something went wrong. Try again.');
    }
  }

  return (
    <>
      <div><h1>Welcome back</h1><p className="lead">Log in to pick up where you left off.</p></div>
      <form className="auth-form" onSubmit={submit} noValidate>
        <Field id="l-email" label="Email" error={errs.email}>
          <IconInput icon="mail" id="l-email" type="email" autoComplete="email" inputMode="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field id="l-pw" label="Password" error={errs.password}>
          <PasswordInput id="l-pw" autoComplete="current-password" placeholder="Your password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <div className={`form-err${formErr ? ' on' : ''}`} role="alert"><Icon name="alert" size={18} /><span>{formErr}</span></div>
        <button className="btn primary lg block" type="submit" disabled={busy}>{busy ? <BusyDots /> : 'Log in'}</button>
      </form>
      <p className="auth-alt">New here? <Link className="link" href="/register">Create an account</Link></p>
    </>
  );
}

function UnverifiedState({ email, onBack }: { email: string; onBack: () => void }) {
  const toast = useToast();
  const [cooldown, setCooldown] = useState(0);
  async function resend() {
    toast(<>Verification link sent to <b>{email}</b></>);
    await api.auth.resendVerification(email);
    setCooldown(30);
    const tick = () => setCooldown((c) => { if (c <= 1) return 0; setTimeout(tick, 1000); return c - 1; });
    setTimeout(tick, 1000);
  }
  return (
    <div className="state-card">
      <Illustration name="mail" />
      <div><h1>Check your inbox</h1><p className="lead">Verify <strong>{email}</strong> before you log in. We sent you a link when you signed up.</p></div>
      <div className="row-btn">
        <button className="btn primary" disabled={cooldown > 0} onClick={resend}>{cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend the link'}</button>
        <button className="btn plain" onClick={onBack}>Use another account</button>
      </div>
      <p className="lock-note">Nothing there? Check your spam folder, then resend.</p>
    </div>
  );
}
