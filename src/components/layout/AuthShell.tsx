import type { ReactNode } from 'react';
import { BrandLink } from './BrandLink';
import { Illustration } from '../graphics/Illustration';

/** Wrapper for /login and /register: form on the left, violet hero illustration on the right. */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="auth">
      <section className="auth-l">
        <BrandLink />
        {children}
      </section>
      <aside className="auth-r">
        <Illustration name="hero" />
        <div className="tag">
          <h2>Never lose the next action.</h2>
          <p>Every application, every follow-up, and the one thing to do next, in one calm place.</p>
        </div>
      </aside>
    </div>
  );
}
