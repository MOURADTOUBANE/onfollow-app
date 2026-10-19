'use client';
import { CenterShell } from '@/components/layout/CenterShell';
import { VerifiedView } from '@/components/features/auth/StandaloneScreens';

/**
 * TODO(API): the link in the verification email should land here (frontend route) after Laravel
 * validated it, e.g. configure the backend to redirect to `${FRONTEND_URL}/verified`.
 * This page intentionally does NOT require a session (the person may open the email on another device);
 * "Continue" goes to /welcome, which does require one and bounces to /login otherwise.
 */
export default function VerifiedPage() {
  return <CenterShell><VerifiedView /></CenterShell>;
}
