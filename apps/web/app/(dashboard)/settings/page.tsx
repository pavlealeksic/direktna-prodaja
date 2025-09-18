"use client";
import { useEffect, useState } from 'react';

export default function SettingsPage() {
  const [data, setData] = useState<any>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/builders/me').then((r) => r.json()).then(setData).catch((e) => setStatus(e.message));
  }, []);

  const save = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());
    const res = await fetch('/api/builders/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    setStatus(res.ok ? 'Saved' : await res.text());
  };

  const connectDomain = async () => {
    setStatus('Connecting domain...');
    const res = await fetch('/api/domains/connect', { method: 'POST' });
    const text = await res.text();
    setStatus(res.ok ? `Domain connected/queued: ${text}` : text);
  };

  const checkDomain = async () => {
    setStatus('Checking domain status...');
    const res = await fetch('/api/domains/status');
    const json = await res.json();
    if (res.ok) setStatus(JSON.stringify(json)); else setStatus(JSON.stringify(json));
  };

  const uploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('keyPrefix', `builders/${data.slug}`);
    const up = await fetch('/api/uploads', { method: 'POST', body: fd }).then((r) => r.json());
    await fetch('/api/builders/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ logoUrl: up.url }) });
    setData((d: any) => ({ ...d, logoUrl: up.url }));
    setStatus('Logo updated');
  };

  if (!data) return <main><p>Loading…</p>{status && <p>{status}</p>}</main>;

  return (
    <main className="grid" style={{ gap: 16 }}>
      <h1>Builder Settings</h1>
      <form onSubmit={save} className="grid" style={{ gap: 8, maxWidth: 640 }}>
        <input name="name" defaultValue={data.name} placeholder="Builder name" />
        <input name="contactEmail" defaultValue={data.contactEmail || ''} placeholder="Contact email" />
        <input name="contactPhone" defaultValue={data.contactPhone || ''} placeholder="Contact phone" />
        <input name="website" defaultValue={data.website || ''} placeholder="Website" />
        <input name="calendlyUrl" defaultValue={data.calendlyUrl || ''} placeholder="Calendly link (optional)" />
        <input name="customDomain" defaultValue={data.customDomain || ''} placeholder="Custom domain (e.g., homes.yourbrand.com)" />
        <textarea name="companyInfo" defaultValue={data.companyInfo || ''} placeholder="Company info" />
        <button className="btn">Save</button>
      </form>
      <div className="card">
        <h3>Logo</h3>
        {data.logoUrl && <img src={data.logoUrl} alt="logo" style={{ height: 64 }} />}
        <input type="file" accept="image/*" onChange={uploadLogo} />
      </div>
      <div className="card">
        <h3>Custom Domain</h3>
        <p>After saving your custom domain, click to connect it in Vercel.</p>
        <button className="btn" onClick={connectDomain}>Connect on Vercel</button>
        <button className="btn" onClick={checkDomain}>Check Status</button>
        <p style={{ fontSize: 12, opacity: 0.7 }}>Make sure your DNS has a CNAME to cname.vercel-dns.com or the A/AAAA records per Vercel instructions. Use “Check Status” to see required verification records.</p>
      </div>
      {status && <p>{status}</p>}
    </main>
  );
}
