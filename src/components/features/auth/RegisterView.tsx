'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Icon } from '@/components/graphics/Icon';
import { IconInput, PasswordInput, Field } from '@/components/ui/forms';
import { BusyDots } from '@/components/ui/atoms';
import { useAuth } from '@/components/providers/AuthProvider';
import { api, ApiError } from '@/lib/api';
import { EMAIL_RE } from '@/lib/validation';

export function RegisterView() {
  const { setUser } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!name.trim()) err.name = 'Enter your name.';
    if (!email) err.email = 'Enter your email.'; else if (!EMAIL_RE.test(email)) err.email = 'Enter a valid email address.';
    if (!pw) err.password = 'Choose a password.'; else if (pw.length < 8) err.password = 'Use at least 8 characters.';
    if (!pw2) err.password_confirmation = 'Type the password again.'; else if (pw2 !== pw) err.password_confirmation = "The two passwords don't match.";
    setErrs(err);
    if (Object.keys(err).length) return;
    setBusy(true);
    try {
      const user = await api.auth.register({ name: name.trim(), email, password: pw, password_confirmation: pw2 }); // TODO(API): POST /register
      setUser(user);
      router.push('/verify');
    } catch (ex) {
      setBusy(false);
      // TODO(API): 422 -> ApiError.errors, e.g. { email: ['That email is already registered.'] }
      if (ex instanceof ApiError && ex.errors) setErrs(Object.fromEntries(Object.entries(ex.errors).map(([k, m]) => [k, m[0]])));
      else setErrs({ email: 'Something went wrong. Try again.' });
    }
  }

  return (
    <>
      <div><h1>Create your account</h1><p className="lead">Free while you search. It takes under a minute.</p></div>
      <form className="auth-form" onSubmit={submit} noValidate>
        <Field id="r-name" label="Name" error={errs.name}>
          <IconInput icon="user" id="r-name" autoComplete="name" placeholder="Your full name" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field id="r-email" label="Email" error={errs.email}>
          <IconInput icon="mail" id="r-email" type="email" autoComplete="email" inputMode="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field id="r-pw" label="Password" error={errs.password}>
          <PasswordInput id="r-pw" autoComplete="new-password" placeholder="At least 8 characters" value={pw} onChange={(e) => setPw(e.target.value)} />
        </Field>
        <Field id="r-pw2" label="Confirm password" error={errs.password_confirmation}>
          <PasswordInput id="r-pw2" autoComplete="new-password" placeholder="Type it again" value={pw2} onChange={(e) => setPw2(e.target.value)} />
        </Field>
        <div className="form-err" role="alert"><Icon name="alert" size={18} /><span /></div>
        <button className="btn primary lg block" type="submit" disabled={busy}>{busy ? <BusyDots /> : 'Create account'}</button>
      </form>
      <p className="auth-alt">Already have an account? <Link className="link" href="/login">Log in</Link></p>
    </>
  );
}
