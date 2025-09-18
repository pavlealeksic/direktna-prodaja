"use client";
import { OrganizationProfile, OrganizationSwitcher } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

type Member = { id: string; role: string; email?: string; name?: string };
type Assignee = { userId: string; email?: string; name?: string; role: string; eligible: boolean };

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('basic_member');
  const [status, setStatus] = useState<string | null>(null);
  const [assignees, setAssignees] = useState<Assignee[]>([]);

  const load = async () => {
    const res = await fetch('/api/team/members');
    if (res.ok) setMembers((await res.json()).members);
    const a = await fetch('/api/team/assignees');
    if (a.ok) setAssignees((await a.json()).members);
  };
  useEffect(() => { load(); }, []);

  const invite = async () => {
    setStatus('Sending invite...');
    const res = await fetch('/api/team/members', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, role }) });
    setStatus(res.ok ? 'Invitation sent' : await res.text());
    if (res.ok) { setEmail(''); load(); }
  };

  const updateRole = async (id: string, role: string) => {
    await fetch(`/api/team/members/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role }) });
    load();
  };

  const remove = async (id: string) => {
    await fetch(`/api/team/members/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <main className="grid" style={{ gap: 16 }}>
      <h1>Team & Permissions</h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span>Current organization:</span>
        <OrganizationSwitcher hidePersonal={true} afterCreateOrganizationUrl="/team" afterSelectOrganizationUrl="/team" />
      </div>
      <div className="card">
        <h3>Invite Member</h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="org:admin">Owner/Admin</option>
            <option value="manager">Manager</option>
            <option value="basic_member">Member</option>
          </select>
          <button className="btn" onClick={invite}>Invite</button>
        </div>
      </div>
      <div className="card">
        <h3>Members</h3>
        <div className="grid" style={{ gap: 8 }}>
          {members.map((m) => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
              <div>
                <strong>{m.name || m.email}</strong>
                <div style={{ fontSize: 12, opacity: 0.7 }}>{m.email}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <select value={m.role} onChange={(e) => updateRole(m.id, e.target.value)}>
                  <option value="org:admin">Owner/Admin</option>
                  <option value="manager">Manager</option>
                  <option value="basic_member">Member</option>
                </select>
                <button className="btn" onClick={() => remove(m.id)}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <h3>Lead Routing</h3>
        <p>Select who can be assigned new leads (round‑robin).</p>
        <div className="grid" style={{ gap: 8 }}>
          {assignees.map((a) => (
            <label key={a.userId} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 8 }}>
              <div>
                <strong>{a.name || a.email}</strong>
                <div style={{ fontSize: 12, opacity: 0.7 }}>{a.email} — {a.role}</div>
              </div>
              <input type="checkbox" defaultChecked={a.eligible} onChange={async (e) => {
                await fetch('/api/team/assignees', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: a.userId, eligible: e.currentTarget.checked }) });
              }} />
            </label>
          ))}
        </div>
      </div>
      <div className="card">
        <OrganizationProfile routing="hash" />
      </div>
      {status && <p>{status}</p>}
    </main>
  );
}
