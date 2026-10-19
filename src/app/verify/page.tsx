'use client';
import { CenterShell } from '@/components/layout/CenterShell';
import { VerifyView } from '@/components/features/auth/StandaloneScreens';
import { RequireUnverified } from '@/components/providers/RouteGuard';

export default function VerifyPage() {
  return <RequireUnverified><CenterShell><VerifyView /></CenterShell></RequireUnverified>;
}
