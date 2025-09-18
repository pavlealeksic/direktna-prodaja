import './globals.css';
import { ReactNode } from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import { SiteHeader } from '@/components/SiteHeader';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <script src="https://js.hcaptcha.com/1/api.js" async defer></script>
          <div className="container">
            <SiteHeader />
            {children}
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
