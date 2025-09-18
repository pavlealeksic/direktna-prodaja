import { prisma } from '@/lib/db';
import { getAuthContext } from '@/lib/clerk';

export default async function AnalyticsPage({ params }: { params: { id: string } }) {
  const { builderSlug } = await getAuthContext();
  const project = await prisma.project.findFirst({ where: { id: params.id, builder: { slug: builderSlug } } });
  if (!project) return <main><h1>Not found</h1></main>;

  const views = await prisma.viewEvent.count({ where: { projectId: project.id } });
  const leads = await prisma.lead.count({ where: { projectId: project.id } });
  const byStatus = await prisma.lead.groupBy({ by: ['status'], where: { projectId: project.id }, _count: { _all: true } });

  return (
    <main className="grid" style={{ gap: 16 }}>
      <h1>Analytics — {project.name}</h1>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <div className="card"><strong>Views</strong><div style={{ fontSize: 28 }}>{views}</div></div>
        <div className="card"><strong>Leads</strong><div style={{ fontSize: 28 }}>{leads}</div></div>
        <div className="card"><strong>Conversion</strong><div style={{ fontSize: 28 }}>{views ? Math.round((leads / views) * 100) : 0}%</div></div>
      </div>
      <div className="card">
        <strong>Leads by status</strong>
        <ul>
          {byStatus.map((r) => (
            <li key={r.status}>{r.status}: {r._count._all}</li>
          ))}
        </ul>
      </div>
    </main>
  );
}

