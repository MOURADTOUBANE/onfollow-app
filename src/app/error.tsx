'use client';
import { CenterShell } from '@/components/layout/CenterShell';
import { ErrorView } from '@/components/features/auth/StandaloneScreens';

/**
 * Next's error boundary for uncaught render/runtime errors below the root layout.
 * (A separate app/global-error.tsx would be needed to catch errors IN the root layout itself;
 * this app is small enough that this single boundary covers it.)
 */
export default function ErrorBoundary({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <CenterShell><ErrorView onRetry={reset} /></CenterShell>;
}
