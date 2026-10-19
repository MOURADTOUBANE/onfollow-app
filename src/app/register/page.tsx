'use client';
import { AuthShell } from '@/components/layout/AuthShell';
import { RegisterView } from '@/components/features/auth/RegisterView';
import { RequireGuest } from '@/components/providers/RouteGuard';

export default function RegisterPage() {
  return (
    <RequireGuest>
      <AuthShell><div className="auth-card"><RegisterView /></div></AuthShell>
    </RequireGuest>
  );
}
