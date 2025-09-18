"use client";
import { useEffect, useState } from 'react';
import { ViewLogger } from '@/components/ViewLogger';

async function fetchUnit(builder: string, project: string, unitId: string) {
  const res = await fetch(`/api/public/unit?builder=${builder}&project=${project}&unit=${unitId}`);
  if (!res.ok) throw new Error('Not found');
  return res.json();
}

export default function UnitPage({ params }: { params: { builder: string; project: string; unitId: string } }) {
  const { builder, project, unitId } = params;
  const [data, setData] = useState<any>(null);
  const [status, setStatus] = useState<string | null>(null);
  useEffect(() => {
    fetchUnit(builder, project, unitId).then(setData).catch((e) => setStatus(e.message));
  }, [builder, project, unitId]);

  const submitLead = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());
    // hCaptcha response token
    const token = (window as any).hcaptcha?.getResponse?.() || '';
    const meta = {
      qs: window.location.search,
      referrer: document.referrer,
    };
    const res = await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      message: payload.message,
      projectId: data.project.id,
      unitId: data.unit.id,
      hcaptchaToken: token,
      meta: JSON.stringify(meta),
    }) });
    if (res.ok) setStatus('Inquiry sent!'); else setStatus(await res.text());
  };

  if (!data) return <main><p>Loading...</p>{status && <p>{status}</p>}</main>;
  const { project: p, unit: u } = data;
  return (
    <main className="grid" style={{ gap: 16 }}>
      <h1>{p.name} — {u.number}</h1>
      <p>{u.sizeSqm} m² · {u.rooms} rooms · floor {u.floor} · {u.status}</p>
      <section className="card">
        <h3>Request Info</h3>
        <form onSubmit={submitLead} className="grid" style={{ gap: 8 }}>
          <input name="name" placeholder="Your name" required />
          <input type="email" name="email" placeholder="Email" required />
          <input name="phone" placeholder="Phone (optional)" />
          <textarea name="message" placeholder="Message (optional)" />
          {/* hCaptcha widget */}
          <div className="h-captcha" data-sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY || '10000000-ffff-ffff-ffff-000000000001'}></div>
          <button className="btn" type="submit">Send</button>
        </form>
        {status && <p>{status}</p>}
      </section>
      <ViewLogger projectId={p.id} unitId={u.id} path={`/${builder}/${project}/units/${unitId}`} />
    </main>
  );
}
