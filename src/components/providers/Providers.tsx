'use client';
import type { ReactNode } from 'react';
import { ThemeProvider } from './ThemeProvider';
import { ToastProvider } from './ToastProvider';
import { PopProvider } from './PopProvider';
import { ModalProvider } from './ModalProvider';
import { AuthProvider } from './AuthProvider';
import { DataProvider } from './DataProvider';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        {/* Order matters: menus/modals render in portals, so Auth + Data must sit ABOVE them
            for the components inside a modal to use useData()/useAuth(). */}
        <AuthProvider>
          <DataProvider>
            <PopProvider>
              <ModalProvider>{children}</ModalProvider>
            </PopProvider>
          </DataProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
