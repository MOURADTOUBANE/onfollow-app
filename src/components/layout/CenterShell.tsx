import type { ReactNode } from 'react';
import { BrandLink } from './BrandLink';

/** Wrapper for standalone screens: verify, verified, welcome, 404, error. */
export function CenterShell({ children }: { children: ReactNode }) {
  return (
    <div className="center-screen">
      <BrandLink />
      {children}
    </div>
  );
}
