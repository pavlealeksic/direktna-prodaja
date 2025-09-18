import { prisma } from '@/lib/db';
import type { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const items: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/explore`, changeFrequency: 'daily', priority: 0.8 },
  ];
  const projects = await prisma.project.findMany({ include: { builder: true } });
  for (const p of projects) {
    items.push({ url: `${base}/${p.builder.slug}/${p.micrositeSlug}`, changeFrequency: 'daily', priority: 0.9 });
  }
  return items;
}

