import Link from 'next/link';
import { getAuthContext, hasActiveSubscription } from '@/lib/clerk';
import { prisma } from '@/lib/db';

export default async function DashboardPage() {
  const ctx = await getAuthContext();
  const subscribed = await hasActiveSubscription();
  const builder = await prisma.builder.findUnique({ where: { slug: ctx.builderSlug } });
  const projects = builder ? await prisma.project.findMany({ where: { builderId: builder.id } }) : [];
  const checklist = [
    { label: 'Add contact email', done: !!builder?.contactEmail, href: '/settings' },
    { label: 'Upload a logo', done: !!builder?.logoUrl, href: '/settings' },
    { label: 'Create your first project', done: projects.length > 0, href: '/projects/new' },
    { label: 'Set a hero image', done: projects.some(p => !!p.heroImageUrl), href: projects[0] ? `/projects/${projects[0].id}/edit` : '/projects' },
  ];
  return (
    <main className="grid" style={{ gap: 16 }}>
      <h1>Builder Dashboard</h1>
      {!subscribed && (
        <div className="card" style={{ borderColor: '#f59e0b' }}>
          <strong>No active plan</strong>
          <p>Please activate a plan to create projects.</p>
          <Link className="btn" href="/billing">Manage Billing</Link>
        </div>
      )}
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {(ctx.role === 'owner' || ctx.role === 'manager') && (
          <div className="card">
            <h3>Create Project</h3>
            <p>Add apartments manually with detailed attributes.</p>
            <Link className="btn" href="/projects/new">New Project</Link>
          </div>
        )}
        <div className="card">
          <h3>Your Projects</h3>
          <p>Manage availability, leads, and boosts.</p>
          <Link className="btn" href="/projects">View Projects</Link>
        </div>
        <div className="card">
          <h3>Leads</h3>
          <p>Track inquiries and update statuses.</p>
          <Link className="btn" href="/leads">Open Leads</Link>
        </div>
        {(ctx.role === 'owner' || ctx.role === 'manager') && (
          <div className="card">
            <h3>Settings</h3>
            <p>Update builder profile, logo, and domain.</p>
            <Link className="btn" href="/settings">Open Settings</Link>
          </div>
        )}
      </div>
      {(ctx.role === 'owner' || ctx.role === 'manager') && (
        <div className="card">
          <h3>Setup Checklist</h3>
          <ul>
            {checklist.map((item) => (
              <li key={item.label} style={{ opacity: item.done ? 0.6 : 1 }}>
                {item.done ? '✅' : '⬜'} {item.label} {!item.done && <a className="btn" href={item.href} style={{ marginLeft: 8 }}>Go</a>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
