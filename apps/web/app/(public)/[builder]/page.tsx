import { prisma } from '@/lib/db';
import Link from 'next/link';
import Image from 'next/image';

export default async function BuilderPublicPage({ params }: { params: { builder: string } }) {
  const builder = await prisma.builder.findUnique({ where: { slug: params.builder } });
  if (!builder) return <main><h1>Builder not found</h1></main>;
  const projects = await prisma.project.findMany({ where: { builderId: builder.id } });
  return (
    <main className="grid" style={{ gap: 16 }}>
      <h1>{builder.name}</h1>
      {builder.logoUrl && <Image src={builder.logoUrl} alt="logo" width={160} height={48} />}
      {builder.companyInfo && <p>{builder.companyInfo}</p>}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
        {projects.map((p) => (
          <div className="card" key={p.id}>
            {p.heroImageUrl && <Image src={p.heroImageUrl} alt="hero" width={480} height={240} style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 6 }} />}
            <h3>{p.name}</h3>
            <p>{p.location}</p>
            <Link className="btn" href={`/${builder.slug}/${p.micrositeSlug}`}>Open</Link>
          </div>
        ))}
      </div>
    </main>
  );
}

