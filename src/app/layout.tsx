import type { Metadata, Viewport } from 'next';
import { Providers } from '@/components/providers/Providers';
import './globals.css';

export const metadata: Metadata = { title: 'JobTracker', description: 'Track every job application in one calm place.' };
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };

/**
 * Sets <html data-theme> before first paint (light/dark/system, saved in localStorage under "jt-theme"),
 * so the page never flashes the wrong theme. See src/components/providers/ThemeProvider.tsx.
 */
const THEME_INIT = `
try {
  var t = localStorage.getItem('jt-theme');
  if (t && t !== 'system') document.documentElement.setAttribute('data-theme', t);
} catch (e) {}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500..700&family=Instrument+Sans:wght@400..700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
