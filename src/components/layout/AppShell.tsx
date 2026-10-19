import type { ReactNode } from 'react';
import { Dock, Rail } from './Dock';

/**
 * Wrapper for every signed-in page (used by app/(app)/layout.tsx).
 * Matches the .layout-app / .shell / .body classes from the CSS: big rounded panel on a soft page,
 * top pill navigation, left icon rail, page content on the right.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="layout-app">
      <div className="shell">
        <Dock />
        <div className="body">
          <Rail />
          <main id="view" tabIndex={-1}>{children}</main>
        </div>
      </div>
    </div>
  );
}
