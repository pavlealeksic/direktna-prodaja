"use client";
import { SignedIn, SignedOut, SignInButton, UserButton, OrganizationSwitcher } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

export function SiteHeader() {
  const [locale, setLocale] = useState<'en' | 'sr'>(() => (typeof window !== 'undefined' ? ((localStorage.getItem('locale') as any) || 'en') : 'en'));
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('locale', locale); }, [locale]);
  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <a href="/" style={{ fontWeight: 700 }}>Direktna Prodaja</a>
      <nav style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <a href="/dashboard" className="btn">Dashboard</a>
        <a href="/explore">Explore</a>
        <a href="/billing">Billing</a>
        <a href="/team">Team</a>
        <a href="/sales">Sales</a>
        <select value={locale} onChange={(e) => setLocale(e.target.value as any)}>
          <option value="en">EN</option>
          <option value="sr">SR</option>
        </select>
        <SignedIn>
          <OrganizationSwitcher appearance={{ elements: { organizationSwitcherTrigger: { padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: 6 } } }} />
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
        <SignedOut>
          <SignInButton mode="modal">
            <button className="btn">Sign in</button>
          </SignInButton>
        </SignedOut>
      </nav>
    </header>
  );
}

