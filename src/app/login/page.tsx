'use client';
import { AuthShell } from '@/components/layout/AuthShell';
import { LoginView } from '@/components/features/auth/LoginView';
import { RequireGuest } from '@/components/providers/RouteGuard';

export default function LoginPage() {
  return (
    <RequireGuest>
      <AuthShell><div className="auth-card"><LoginView /></div></AuthShell>
    </RequireGuest>
  );
}
