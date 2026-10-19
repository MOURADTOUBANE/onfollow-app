'use client';
import { CenterShell } from '@/components/layout/CenterShell';
import { WelcomeView } from '@/components/features/auth/StandaloneScreens';
import { RequireVerified } from '@/components/providers/RouteGuard';
import { useAppActions } from '@/components/modals/useAppActions';

export default function WelcomePage() {
  const { openAppForm } = useAppActions();
  return <RequireVerified><CenterShell><WelcomeView onAddFirst={() => openAppForm()} /></CenterShell></RequireVerified>;
}
