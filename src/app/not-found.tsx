import { CenterShell } from '@/components/layout/CenterShell';
import { NotFoundView } from '@/components/features/auth/StandaloneScreens';

/** Next's catch-all for any unmatched route. */
export default function NotFound() {
  return <CenterShell><NotFoundView /></CenterShell>;
}
