const base = 'https://api.vercel.com';

function headers() {
  const token = process.env.VERCEL_TOKEN!;
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

export async function addDomainToProject(domain: string) {
  if (!process.env.VERCEL_TOKEN || !process.env.VERCEL_PROJECT_ID) throw new Error('Missing Vercel env vars');
  const teamId = process.env.VERCEL_TEAM_ID;
  const url = new URL(`${base}/v9/projects/${process.env.VERCEL_PROJECT_ID}/domains`);
  if (teamId) url.searchParams.set('teamId', teamId);
  const res = await fetch(url.toString(), { method: 'POST', headers: headers(), body: JSON.stringify({ name: domain }) });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || 'Failed to add domain');
  return data; // contains verification info if needed
}

export async function getDomainStatus(domain: string) {
  if (!process.env.VERCEL_TOKEN) throw new Error('Missing Vercel token');
  const teamId = process.env.VERCEL_TEAM_ID;
  const url = new URL(`${base}/v6/domains/${domain}`);
  if (teamId) url.searchParams.set('teamId', teamId);
  const res = await fetch(url.toString(), { headers: headers() });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || 'Failed to fetch domain');
  return data;
}

