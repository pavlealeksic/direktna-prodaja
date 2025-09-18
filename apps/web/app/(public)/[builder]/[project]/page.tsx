import { AvailabilityMap } from '@/components/AvailabilityMap';
import { prisma } from '@/lib/db';
import Link from 'next/link';
import Image from 'next/image';
import { Suspense } from 'react';
import { ViewLogger } from '@/components/ViewLogger';
import { SocialShare } from '@/components/SocialShare';
import React from 'react';
import { t } from '@/lib/i18n';

type Props = { params: { builder: string; project: string }, searchParams?: Record<string, string | string[] | undefined> };

export async function generateMetadata({ params }: { params: { builder: string; project: string } }) {
  const { builder, project } = params;
  const data = await prisma.project.findFirst({ where: { micrositeSlug: project, builder: { slug: builder } } });
  if (!data) return { title: 'Project not found' };
  return {
    title: `${data.name} — ${data.location}`,
    description: data.description || `${data.name} in ${data.location}`,
    openGraph: {
      title: data.name,
      description: data.description || `${data.name} in ${data.location}`,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/${builder}/${project}`,
      images: data.heroImageUrl ? [{ url: data.heroImageUrl }] : [],
    },
  };
}

export default async function MicrositePage({ params, searchParams }: Props) {
  const { builder, project } = params;
  const locale = (searchParams?.lang === 'sr' ? 'sr' : 'en') as 'en' | 'sr';
  const data = await prisma.project.findFirst({
    where: { micrositeSlug: project, builder: { slug: builder } },
    include: { units: true, builder: true, floorPlans: true },
  });
  if (!data) return <main><h1>{t('projectNotFound', locale)}</h1></main>;
  const minRooms = searchParams?.rooms ? Number(searchParams.rooms) : undefined;
  const minSize = searchParams?.minSize ? Number(searchParams.minSize) : undefined;
  const maxSize = searchParams?.maxSize ? Number(searchParams.maxSize) : undefined;
  const floor = searchParams?.floor ? Number(searchParams.floor) : undefined;
  const orientation = searchParams?.orientation ? String(searchParams.orientation) : undefined;
  const status = searchParams?.status ? String(searchParams.status) : undefined;
  const unitsFiltered = data.units.filter((u) =>
    (minRooms ? u.rooms >= minRooms : true)
    && (minSize ? u.sizeSqm >= minSize : true)
    && (maxSize ? u.sizeSqm <= maxSize : true)
    && (floor ? u.floor === floor : true)
    && (orientation ? u.orientation === orientation : true)
    && (status ? u.status === status : true)
  );
  const units = unitsFiltered.map((u) => ({ id: u.id, number: u.number, status: u.status as any, floor: u.floor }));

  return (
    <main className="grid" style={{ gap: 16 }}>
      <style>{`:root { --brand: ${data.brandColor || '#0ea5e9'}; }`}</style>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'ApartmentComplex',
        name: data.name,
        address: { '@type': 'PostalAddress', addressLocality: data.location },
        url: `${process.env.NEXT_PUBLIC_APP_URL}/${builder}/${project}`,
        numberOfRooms: [...new Set(data.units.map(u => u.rooms))],
      }) }} />
      <h1>{data.name} <span style={{ fontSize: 14, background: '#e2e8f0', padding: '2px 6px', borderRadius: 6, marginLeft: 8 }}>{data.phase.replace('_', ' ').toLowerCase()}</span></h1>
      {data.builder.logoUrl && (
        <Image src={data.builder.logoUrl} alt="logo" width={120} height={36} style={{ height: 36, width: 'auto' }} />
      )}
      <p>{data.location}</p>
      {data.builder.calendlyUrl && (
        <p><a className="btn" href={data.builder.calendlyUrl} target="_blank" rel="noreferrer">{t('scheduleVisit', locale)}</a></p>
      )}
      {data.builder.contactEmail && (
        <p>{t('contact', locale)}: <a href={`mailto:${data.builder.contactEmail}`}>{data.builder.contactEmail}</a> {data.builder.contactPhone ? ` · ${data.builder.contactPhone}` : ''}</p>
      )}
      {data.heroImageUrl && (
        <Image src={data.heroImageUrl} alt="hero" width={1200} height={600} style={{ width: '100%', height: 'auto', maxHeight: 280, objectFit: 'cover', borderRadius: 8 }} />
      )}
      <form style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <input type="number" name="rooms" placeholder={t('minRooms', locale)} defaultValue={minRooms} />
        <input type="number" name="minSize" placeholder={t('minSize', locale)} defaultValue={minSize} />
        <input type="number" name="maxSize" placeholder={t('maxSize', locale)} defaultValue={maxSize} />
        <input type="number" name="floor" placeholder={t('floor', locale)} defaultValue={floor} />
        <input name="orientation" placeholder={t('orientation', locale)} defaultValue={orientation} />
        <select name="status" defaultValue={status || ''}>
          <option value="">{t('anyStatus', locale)}</option>
          <option value="AVAILABLE">{t('AVAILABLE', locale)}</option>
          <option value="RESERVED">{t('RESERVED', locale)}</option>
          <option value="SOLD">{t('SOLD', locale)}</option>
        </select>
        <button className="btn" type="submit">{t('filter', locale)}</button>
      </form>
      {Array.isArray(data.amenities) && (data.amenities as any[]).length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(data.amenities as any[]).map((a, i) => (<span key={i} style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: 999 }}>{String(a)}</span>))}
        </div>
      )}
      <AvailabilityMap units={units} hrefForUnit={(u) => `/${builder}/${project}/units/${u.id}`} />
      {typeof floor === 'number' && data.floorPlans?.some(fp => fp.floor === floor) && (
        <div>
          <h3>Floor {floor} Plan</h3>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={data.floorPlans.find(fp => fp.floor === floor)!.imageUrl} alt={`Floor ${floor} plan`} style={{ width: '100%', borderRadius: 8 }} />
        </div>
      )}
      <ViewLogger projectId={data.id} path={`/${builder}/${project}`} />
      <SocialShare url={`${process.env.NEXT_PUBLIC_APP_URL}/${builder}/${project}`} text={`${data.name} — ${data.location}`} />
      <Suspense>
        <div>
          <h3>{t('allUnits', locale)}</h3>
          <ul>
            {unitsFiltered.map((u) => (
              <li key={u.id}><Link href={`/${builder}/${project}/units/${u.id}`}>{u.number} — {u.sizeSqm}m² — {u.status}</Link></li>
            ))}
          </ul>
        </div>
      </Suspense>
    </main>
  );
}
