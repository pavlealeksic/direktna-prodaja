import { prisma } from '@/lib/db';
import { getAuthContext } from '@/lib/clerk';
import Link from 'next/link';

export default async function SalesDashboard({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const ctx = await getAuthContext();
  const status = (searchParams?.status as string) || '';
  const projectId = (searchParams?.project as string) || '';
  const mine = (searchParams?.mine as string) === '1';

  const builder = await prisma.builder.findUnique({ where: { slug: ctx.builderSlug } });
  const projects = await prisma.project.findMany({ where: { builderId: builder!.id } });

  const where: any = { project: { builderId: builder!.id } };
  if (status) where.status = status;
  if (projectId) where.projectId = projectId;
  if (mine) where.assignedToUserId = ctx.userId;

  const leads = await prisma.lead.findMany({ where, include: { project: true, unit: true }, orderBy: { createdAt: 'desc' } });

  return (
    <main className="grid" style={{ gap: 16 }}>
      <h1>Sales Dashboard</h1>
      <form style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <select name="status" defaultValue={status}>
          <option value="">Any status</option>
          <option value="NEW">NEW</option>
          <option value="CONTACTED">CONTACTED</option>
          <option value="SCHEDULED">SCHEDULED</option>
          <option value="CLOSED">CLOSED</option>
        </select>
        <select name="project" defaultValue={projectId}>
          <option value="">All projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <label><input type="checkbox" name="mine" value="1" defaultChecked={mine} /> Assigned to me</label>
        <button className="btn" type="submit">Filter</button>
      </form>
      <div className="grid" style={{ gap: 8 }}>
        {leads.map((l) => (
          <div key={l.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>{l.name}</strong> — {l.email} {l.phone && `— ${l.phone}`}
              <div style={{ fontSize: 12, opacity: 0.8 }}>{l.project.name}{l.unit ? ` · ${l.unit.number}` : ''} — {l.status}</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>Created {l.createdAt.toISOString()}</div>
              {l.assignedToUserId && <div style={{ fontSize: 12 }}>Assigned</div>}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {!l.assignedToUserId && (
                <form action={`/api/leads/${l.id}/assign`} method="post"><button className="btn">Assign to me</button></form>
              )}
              <form action={`/api/leads/${l.id}/status`} method="post" style={{ display: 'flex', gap: 6 }}>
                <select name="status" defaultValue={l.status}>
                  <option value="NEW">NEW</option>
                  <option value="CONTACTED">CONTACTED</option>
                  <option value="SCHEDULED">SCHEDULED</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
                <button className="btn">Update</button>
              </form>
            </div>
          </div>
        ))}
      </div>
      <div>
        <Link className="btn" href="/leads">Go to Leads</Link>
      </div>
    </main>
  );
}

