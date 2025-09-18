import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthContext } from '@/lib/clerk';

function toCsv(rows: any[]) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const esc = (v: any) => (v == null ? '' : String(v).replace(/"/g, '""'));
  const lines = [headers.join(',')].concat(rows.map((r) => headers.map((h) => `"${esc(r[h])}"`).join(',')));
  return lines.join('\n');
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await getAuthContext();
  const url = new URL(req.url);
  const status = url.searchParams.get('status') || undefined;
  const from = url.searchParams.get('from') ? new Date(url.searchParams.get('from')!) : undefined;
  const to = url.searchParams.get('to') ? new Date(url.searchParams.get('to')!) : undefined;
  const where: any = { projectId: params.id };
  if (status) where.status = status;
  if (from || to) where.createdAt = { gte: from, lte: to };
  const leads = await prisma.lead.findMany({ where, include: { unit: true, project: true }, orderBy: { createdAt: 'desc' } });
  const rows = leads.map((l) => ({
    id: l.id,
    createdAt: l.createdAt.toISOString(),
    project: l.project.name,
    unit: l.unit?.number ?? '',
    name: l.name,
    email: l.email,
    phone: l.phone ?? '',
    status: l.status,
    assignedTo: l.assignedToUserId ?? '',
  }));
  const csv = toCsv(rows);
  return new Response(csv, { headers: { 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename="project-${params.id}-leads.csv"` } });
}

