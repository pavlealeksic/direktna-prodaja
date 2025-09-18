"use client";
import { useEffect, useState } from 'react';

async function fetchProject(id: string) {
  const res = await fetch(`/api/projects/${id}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export default function EditProject({ params }: { params: { id: string } }) {
  const { id } = params;
  const [data, setData] = useState<any>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchProject(id).then(setData).catch((e) => setStatus(e.message));
  }, [id]);

  const save = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());
    if (payload.amenities) {
      try { (payload as any).amenities = JSON.parse(String(payload.amenities)); } catch { /* ignore */ }
    }
    const res = await fetch(`/api/projects/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    setStatus(res.ok ? 'Saved' : await res.text());
  };

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('keyPrefix', `projects/${id}`);
    const up = await fetch('/api/uploads', { method: 'POST', body: fd }).then((r) => r.json());
    await fetch(`/api/projects/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ heroImageUrl: up.url }) });
    setStatus('Image uploaded');
    setData((d: any) => ({ ...d, heroImageUrl: up.url }));
  };

  if (!data) return <main><p>Loading…</p>{status && <p>{status}</p>}</main>;

  return (
    <main className="grid" style={{ gap: 16 }}>
      <h1>Edit Project</h1>
      <form onSubmit={save} className="grid" style={{ gap: 8, maxWidth: 640 }}>
        <input name="name" defaultValue={data.name} placeholder="Name" required />
        <input name="location" defaultValue={data.location} placeholder="Location" required />
        <input name="brandColor" defaultValue={data.brandColor || ''} placeholder="#00aaff" />
        <textarea name="description" defaultValue={data.description || ''} placeholder="Description" />
        <label>Phase
          <select name="phase" defaultValue={data.phase}>
            <option value="PLANNING">Planning</option>
            <option value="UNDER_CONSTRUCTION">Under construction</option>
            <option value="READY">Ready</option>
          </select>
        </label>
        <textarea name="amenities" defaultValue={JSON.stringify(data.amenities || [], null, 0)} placeholder='Amenities JSON array, e.g. ["Parking","Elevator","Garden"]' />
        <button className="btn">Save</button>
      </form>
      <div className="card">
        <h3>Hero Image</h3>
        {data.heroImageUrl && <img src={data.heroImageUrl} alt="hero" style={{ maxWidth: 480, borderRadius: 8 }} />}
        <input type="file" accept="image/*" onChange={upload} />
      </div>
      {status && <p>{status}</p>}
    </main>
  );
}
