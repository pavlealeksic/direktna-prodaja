import { prisma } from '@/lib/db';
import { getAuthContext } from '@/lib/clerk';

export default async function LeadsPage() {
  const { builderSlug } = await getAuthContext();
  const builder = await prisma.builder.findUnique({ where: { slug: builderSlug } });
  if (!builder) return <main><h1>No builder</h1></main>;
  const leads = await prisma.lead.findMany({ where: { project: { builderId: builder.id } }, include: { project: true, unit: true }, orderBy: { createdAt: 'desc' } });

  return (
    <main className="grid" style={{ gap: 16 }}>
      <h1>Leads</h1>
      <div>
        <form action="/api/leads/export" method="get" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input type="date" name="from" />
          <input type="date" name="to" />
          <select name="status" defaultValue="">
            <option value="">All</option>
            <option value="NEW">NEW</option>
            <option value="CONTACTED">CONTACTED</option>
            <option value="SCHEDULED">SCHEDULED</option>
            <option value="CLOSED">CLOSED</option>
          </select>
          <button className="btn">Export CSV</button>
        </form>
      </div>
      <div className="grid" style={{ gap: 8 }}>
        {leads.map(async (l) => {
          const builder = await prisma.builder.findUnique({ where: { id: l.project.builderId } });
          const stale = isStale(l);
          return (
            <div key={l.id} className="card">
              <form action={`/api/leads/${l.id}/status`} method="post" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{l.name}</strong> — {l.email} — {l.phone || 'n/a'} {stale && <span style={{ color: '#ef4444', marginLeft: 6 }}>(Stale)</span>}
                  <div style={{ fontSize: 12 }}>{l.project.name}{l.unit ? ` · ${l.unit.number}` : ''}</div>
                  {l.message && <div style={{ fontSize: 12, opacity: 0.8 }}>{l.message}</div>}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <select name="status" defaultValue={l.status}>
                    <option value="NEW">NEW</option>
                    <option value="CONTACTED">CONTACTED</option>
                    <option value="SCHEDULEED">SCHEDULED</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                  <button className="btn">Update</button>
                </div>
              </form>
              <LeadQuickReply leadId={l.id} projectName={l.project.name} calendlyUrl={builder?.calendlyUrl || ''} />
              <form onSubmit={async (e) => { e.preventDefault(); await fetch(`/api/leads/${l.id}/reminder`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) }); alert('Reminder set'); }}>
                <button className="btn" type="submit">Remind in 2 days</button>
              </form>
              <LeadNotes leadId={l.id} />
            </div>
          );
        })}
      </div>
    </main>
  );
}

async function LeadNotes({ leadId }: { leadId: string }) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/leads/${leadId}/notes`, { cache: 'no-store' });
  const data = await res.json();
  const notes = (data.notes || []) as Array<{ id: string; content: string; createdAt: string }>;
  return (
    <div style={{ marginTop: 8 }}>
      <details>
        <summary>Notes ({notes.length})</summary>
        <div className="grid" style={{ gap: 6, marginTop: 8 }}>
          {notes.map((n) => (
            <div key={n.id} className="card" style={{ padding: 8 }}>
              <div style={{ fontSize: 12, opacity: 0.7 }}>{new Date(n.createdAt).toLocaleString()}</div>
              <div>{n.content}</div>
              <form action={`/api/leads/${leadId}/notes?noteId=${n.id}`} method="post" onSubmit={(e) => { e.preventDefault(); fetch(e.currentTarget.action, { method: 'DELETE' }).then(() => location.reload()); }}>
                <button className="btn" style={{ fontSize: 12 }}>Delete</button>
              </form>
            </div>
          ))}
          <form action={`/api/leads/${leadId}/notes`} method="post" onSubmit={async (e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget as HTMLFormElement);
            const content = String(form.get('content') || '');
            await fetch(e.currentTarget.action, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content }) });
            location.reload();
          }}>
            <textarea name="content" rows={3} placeholder="Add note..."></textarea>
            <button className="btn">Add Note</button>
          </form>
        </div>
      </details>
    </div>
  );
}

function LeadQuickReply({ leadId, projectName, calendlyUrl }: { leadId: string; projectName: string; calendlyUrl?: string }) {
  return (
    <details style={{ marginTop: 6 }}>
      <summary>Reply</summary>
      <div className="grid" style={{ gap: 6, marginTop: 6 }}>
        <form onSubmit={async (e) => {
          e.preventDefault();
          const payload = { subject: `Thanks for your interest in ${projectName}`, message: `Hello,\n\nThank you for your inquiry about {{project}}. We will get back to you shortly.\n\nBest regards,\nSales Team`, ccBuilder: true };
          await fetch(`/api/leads/${leadId}/reply`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
          alert('Reply sent');
        }}>
          <button className="btn">Send Thank You</button>
        </form>
        {calendlyUrl && (
          <form onSubmit={async (e) => {
            e.preventDefault();
            const payload = { subject: `Schedule a visit for ${projectName}`, message: `Hello,\n\nWe would love to schedule a visit for {{project}}. Please pick a time: ${calendlyUrl}\n\nBest regards,\nSales Team`, ccBuilder: true };
            await fetch(`/api/leads/${leadId}/reply`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            alert('Reply sent');
          }}>
            <button className="btn">Send Scheduling Link</button>
          </form>
        )}
        <form onSubmit={async (e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget as HTMLFormElement);
          const subject = String(form.get('subject') || '');
          const message = String(form.get('message') || '');
          await fetch(`/api/leads/${leadId}/reply`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subject, message, ccBuilder: true }) });
          alert('Reply sent');
        }}>
          <input name="subject" placeholder="Subject" />
          <textarea name="message" placeholder="Message ({{project}} and {{unit}} placeholders supported)" rows={3} />
          <button className="btn">Send Custom Reply</button>
        </form>
      </div>
    </details>
  );
}
