import { prisma } from '@/lib/db';
import { getAuthContext, hasActiveSubscription } from '@/lib/clerk';
import Link from 'next/link';
import { AdCardGenerator } from '@/components/AdCardGenerator';
import Image from 'next/image';

export default async function ManageProject({ params }: { params: { id: string } }) {
  const { builderSlug } = await getAuthContext();
  const project = await prisma.project.findFirst({ where: { id: params.id, builder: { slug: builderSlug } }, include: { units: true } });
  if (!project) return <main><h1>Project not found</h1></main>;
  const subscribed = await hasActiveSubscription();

  return (
    <main className="grid" style={{ gap: 16 }}>
      <h1>Manage: {project.name}</h1>
      <div style={{ display: 'flex', gap: 8 }}>
        <Link className="btn" href={`/projects/${project.id}/edit`}>Edit details</Link>
        <Link className="btn" href={`/projects/${project.id}/analytics`}>View analytics</Link>
        <Link className="btn" href={`/projects/${project.id}/leads/board`}>Open lead board</Link>
      </div>
      <div className="card">
        <form action={`/api/projects/${project.id}/boost`} method="post" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label><input type="checkbox" name="boosted" defaultChecked={project.boosted} disabled={!subscribed} /> Boost this project</label>
          {!subscribed && <Link href="/billing">Upgrade to enable</Link>}
          <button className="btn" disabled={!subscribed}>Save</button>
        </form>
      </div>
      <h2>Units</h2>
      <form id="bulkForm" action={`/api/projects/${project.id}/units/bulk-status`} method="post" className="card" style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
        <strong>Bulk update</strong>
        <select name="status" required>
          <option value="">Select status…</option>
          <option value="AVAILABLE">AVAILABLE</option>
          <option value="RESERVED">RESERVED</option>
          <option value="SOLD">SOLD</option>
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" onClick={(e) => {
            const checked = (e.currentTarget as HTMLInputElement).checked;
            document.querySelectorAll<HTMLInputElement>('input[name="unitId"][form="bulkForm"]').forEach(cb => { cb.checked = checked; });
          }} /> Select all
        </label>
        <button className="btn">Apply to selected</button>
      </form>
      <div className="grid" style={{ gap: 8 }}>
        {project.units.map((u) => (
          <div key={u.id} className="card" style={{ display: 'grid', gap: 8 }}>
            <form action={`/api/units/${u.id}/status`} method="post" style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <label style={{ marginRight: 8 }}>
                  <input type="checkbox" name="unitId" value={u.id} form="bulkForm" />
                </label>
                <strong>{u.number}</strong> · {u.sizeSqm} m² · {u.rooms} rooms · floor {u.floor}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <select name="status" defaultValue={u.status}>
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="RESERVED">RESERVED</option>
                  <option value="SOLD">SOLD</option>
                </select>
                <button className="btn">Update</button>
              </div>
            </form>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <form onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                {(u.images as any[] | null)?.map((url) => (
                  <label key={url} className="card" style={{ padding: 4 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="unit" style={{ width: 96, height: 64, objectFit: 'cover', borderRadius: 6 }} />
                    <input type="checkbox" name="remove" value={url as string} /> Remove
                  </label>
                ))}
                <button className="btn" onClick={async (e) => {
                  e.preventDefault();
                  const form = (e.currentTarget.parentElement as HTMLFormElement);
                  const urls = Array.from(new FormData(form).getAll('remove')).map(String);
                  if (urls.length === 0) return;
                  await fetch(`/api/units/${u.id}/images/remove`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ urls }) });
                  location.reload();
                }}>Remove selected</button>
              </form>
              <form onSubmit={(e) => e.preventDefault()}>
                <input type="file" accept="image/*" multiple onChange={async (e) => {
                  const files = Array.from(e.target.files || []);
                  if (!files.length) return;
                  for (const file of files) {
                    const fd = new FormData();
                    fd.append('file', file);
                    fd.append('keyPrefix', `projects/${project.id}/units/${u.id}`);
                    const up = await fetch('/api/uploads', { method: 'POST', body: fd }).then((r) => r.json());
                    await fetch(`/api/units/${u.id}/images`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: up.url }) });
                  }
                  location.reload();
                }} />
              </form>
            </div>
          </div>
        ))}
      </div>
      <div className="card" style={{ display: 'grid', gap: 8 }}>
        <h3>Floor Plans</h3>
        <form onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="number" placeholder="Floor" id="fp-floor" />
          <input type="file" accept="image/*" onChange={async (e) => {
            const file = e.target.files?.[0];
            const floor = Number((document.getElementById('fp-floor') as HTMLInputElement)?.value || '');
            if (!file || (!floor && floor !== 0)) return;
            const fd = new FormData();
            fd.append('file', file);
            fd.append('keyPrefix', `projects/${project.id}/floorplans/${floor}`);
            const up = await fetch('/api/uploads', { method: 'POST', body: fd }).then((r) => r.json());
            await fetch(`/api/projects/${project.id}/floorplans`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ floor, imageUrl: up.url }) });
            location.reload();
          }} />
        </form>
        {/* Existing plans (if any) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {(project as any).floorPlans?.length ? (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(project as any).floorPlans.map((fp: any) => (
              <div key={fp.floor} className="card" style={{ padding: 8 }}>
                <div>Floor {fp.floor}</div>
                <img src={fp.imageUrl} alt="floor" style={{ width: 240, height: 160, objectFit: 'cover', borderRadius: 6 }} />
                <form action={`/api/projects/${project.id}/floorplans?floor=${fp.floor}`} method="post" onSubmit={(e) => { e.preventDefault(); fetch(e.currentTarget.action, { method: 'DELETE' }).then(() => location.reload()); }}>
                  <button className="btn">Remove</button>
                </form>
              </div>
            ))}
          </div>
        ) : <div style={{ opacity: 0.7 }}>No floor plans yet.</div>}
      </div>
      <AdCardGenerator title={project.name} subtitle={project.location} imageUrl={project.heroImageUrl || undefined} />
    </main>
  );
}
