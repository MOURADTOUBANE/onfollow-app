'use client';
import { CenterShell } from '@/components/layout/CenterShell';
import { ErrorView } from '@/components/features/auth/StandaloneScreens';

/** Demo target for the "Demo: error screen" menu item. Safe to delete. */
export default function OopsPage() {
  return <CenterShell><ErrorView /></CenterShell>;
}
