import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getDomainSlugFromCache, setDomainSlugInCache } from './lib/domainCache';
import { get as edgeGet } from '@vercel/edge-config';

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/projects(.*)',
  '/leads(.*)',
  '/settings(.*)',
  '/team(.*)',
  '/api/(?!public)(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) await auth.protect();

  const host = req.headers.get('host')?.toLowerCase() || '';
  const baseHost = (process.env.NEXT_PUBLIC_APP_URL || '').split('://').pop()?.toLowerCase() || '';
  const url = req.nextUrl.clone();
  const pathname = url.pathname;

  const isStatic = pathname.startsWith('/_next') || /\.[a-zA-Z0-9]+$/.test(pathname);
  if (isStatic) return NextResponse.next();

  const reserved = new Set(['api','sign-in','sign-up','dashboard','projects','leads','settings','billing','team','explore','robots.txt','sitemap.xml']);
  if (host && baseHost && host !== baseHost) {
    if (pathname.startsWith('/api')) return NextResponse.next();
    if (pathname === '/api/domains/resolve') return NextResponse.next();

    const nakedHost = host.replace(/^www\./, '');
    let slug = getDomainSlugFromCache(nakedHost);
    if (!slug) {
      try {
        const val = await edgeGet<string>(`domains:${nakedHost}`);
        if (val) {
          slug = val;
          setDomainSlugInCache(nakedHost, val);
        }
      } catch {}
    }
    if (!slug) {
      const resolveUrl = new URL(`${url.protocol}//${host}/api/domains/resolve`);
      resolveUrl.searchParams.set('host', nakedHost);
      try {
        const res = await fetch(resolveUrl.toString(), { headers: { 'x-middleware': '1' } });
        if (res.ok) {
          const data = await res.json();
          slug = data.slug;
          setDomainSlugInCache(nakedHost, slug);
        }
      } catch {}
    }
    if (slug) {
        const parts = pathname.split('/').filter(Boolean);
        if (parts.length === 0) {
          url.pathname = `/${slug}`;
          return NextResponse.rewrite(url);
        } else if (parts.length === 1 && !reserved.has(parts[0])) {
          url.pathname = `/${slug}/${parts[0]}`;
          return NextResponse.rewrite(url);
        }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)'],
};
