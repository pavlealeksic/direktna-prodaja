import Link from 'next/link';
import { prisma } from '@/lib/db';
import Image from 'next/image';

export default async function ExplorePage() {
  const projects = await prisma.project.findMany({ where: { boosted: true }, include: { builder: true } });
  return (
    <main className="grid" style={{ gap: 16 }}>
      <h1>Explore Projects</h1>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
        {projects.map((p) => (
          <div className="card" key={p.id}>
            {p.heroImageUrl && <Image src={p.heroImageUrl} alt="hero" width={480} height={240} style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 6 }} />}
            <h3>{p.name}</h3>
            <p>{p.location}</p>
            <Link className="btn" href={`/${p.builder.slug}/${p.micrositeSlug}`}>Open</Link>
          </div>
        ))}
      </div>
    </main>
  );
}
