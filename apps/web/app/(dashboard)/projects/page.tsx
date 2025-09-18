import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getAuthContext } from '@/lib/clerk';

export default async function ProjectsPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const { builderSlug } = await getAuthContext();
  const builder = await prisma.builder.findUnique({ where: { slug: builderSlug } });
  if (!builder) return <main><h1>No builder found</h1></main>;
  const q = (searchParams?.q as string) || '';
  const page = Number((searchParams?.page as string) || '1');
  const take = 12;
  const skip = (Math.max(page, 1) - 1) * take;
  const where: any = { builderId: builder.id };
  if (q) where.OR = [{ name: { contains: q, mode: 'insensitive' } }, { location: { contains: q, mode: 'insensitive' } }];
  const [projects, total] = await Promise.all([
    prisma.project.findMany({ where, include: { _count: { select: { leads: true, units: true } } }, orderBy: { updatedAt: 'desc' }, skip, take }),
    prisma.project.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / take));

  return (
    <main className="grid" style={{ gap: 16 }}>
      <h1>Your Projects</h1>
      <form style={{ display: 'flex', gap: 8 }}>
        <input name="q" placeholder="Search by name or location" defaultValue={q} />
        <button className="btn" type="submit">Search</button>
      </form>
      <div className="grid" style={{ gap: 12 }}>
        {projects.map((p) => (
          <div className="card" key={p.id}>
            <h3>{p.name}</h3>
            <p>{p.location} · {p._count.units} units · {p._count.leads} leads</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <Link className="btn" href={`/${builder.slug}/${p.micrositeSlug}`}>View Microsite</Link>
              <Link className="btn" href={`/projects/${p.id}`}>Manage</Link>
            </div>
          </div>
        ))}
        {projects.length === 0 && <div style={{ opacity: 0.7 }}>No projects found.</div>}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {Array.from({ length: totalPages }).map((_, i) => {
          const pnum = i + 1;
          const href = `?q=${encodeURIComponent(q)}&page=${pnum}`;
          return <a key={pnum} href={href} className="btn" style={{ background: pnum === page ? '#0ea5e9' : undefined }}>{pnum}</a>;
        })}
      </div>
    </main>
  );
}
