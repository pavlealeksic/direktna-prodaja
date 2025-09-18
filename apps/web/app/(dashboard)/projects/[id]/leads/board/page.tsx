import { prisma } from '@/lib/db';
import { getAuthContext } from '@/lib/clerk';

const STATUSES = ['NEW','CONTACTED','SCHEDULED','CLOSED'] as const;

export default async function LeadsBoard({ params, searchParams }: { params: { id: string }, searchParams?: Record<string, string | string[] | undefined> }) {
  const ctx = await getAuthContext();
  const project = await prisma.project.findFirst({ where: { id: params.id, builder: { slug: ctx.builderSlug } } });
  if (!project) return <main><h1>Project not found</h1></main>;
  const leads = await prisma.lead.findMany({ where: { projectId: project.id }, orderBy: { createdAt: 'desc' } });
  const grouped: Record<string, typeof leads> = { NEW: [], CONTACTED: [], SCHEDULED: [], CLOSED: [] } as any;
  leads.forEach((l) => { (grouped as any)[l.status].push(l); });

  return (
    <main className="grid" style={{ gap: 16 }}>
      <h1>Lead Pipeline — {project.name}</h1>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {STATUSES.map((status) => (
          <div key={status} className="card" style={{ minHeight: 200 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>{status}</div>
            <div className="grid" style={{ gap: 8 }}>
              {grouped[status].map((l) => (
                <div key={l.id} className="card" style={{ padding: 8 }}>
                  <div><strong>{l.name}</strong> — {l.email}</div>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>{l.phone || ''}</div>
                  <form action={`/api/leads/${l.id}/status`} method="post" style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                    <select name="status" defaultValue={l.status}>
                      {STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}
                    </select>
                    <button className="btn">Move</button>
                  </form>
                  {!l.assignedToUserId && (
                    <form action={`/api/leads/${l.id}/assign`} method="post" style={{ marginTop: 6 }}>
                      <button className="btn">Assign to me</button>
                    </form>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

