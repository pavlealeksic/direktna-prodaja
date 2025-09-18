import { NextRequest } from 'next/server';
import { LeadSchema } from '@moji/core';
import { prisma } from '@/lib/db';
import { sendLeadNotification, sendLeadConfirmation } from '@/lib/email';
import { clerkClient } from '@clerk/nextjs/server';
import { rateLimit } from '@/lib/ratelimit';

export async function POST(req: NextRequest) {
  try {
    // Rate limit per IP
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'ip:unknown';
    if (!rateLimit.allow(ip)) return new Response('Too many requests', { status: 429 });
    const json = await req.json();
    // hCaptcha verify
    if (process.env.HCAPTCHA_SECRET) {
      const token = json.hcaptchaToken;
      if (!token) return new Response('Captcha required', { status: 400 });
      const res = await fetch('https://hcaptcha.com/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ secret: process.env.HCAPTCHA_SECRET, response: token }),
      });
      const out = await res.json();
      if (!out.success) return new Response('Captcha failed', { status: 400 });
    }

    const lead = LeadSchema.parse(json);
    const meta = json.meta && typeof json.meta === 'string' ? JSON.parse(json.meta) : undefined;
    const created = await prisma.lead.create({ data: { ...lead, meta } });
    // Email the builder if contactEmail is set
    const proj = await prisma.project.findUnique({ where: { id: created.projectId }, include: { builder: true, units: { where: { id: created.unitId ?? undefined } } } });
    const toBuilder = proj?.builder.contactEmail;
    if (toBuilder) {
      await sendLeadNotification(toBuilder, {
        project: proj!.name,
        unit: proj?.units?.[0]?.number,
        name: created.name,
        email: created.email,
        phone: created.phone,
        message: created.message,
      });
    }
    // Round-robin assignment among org members (if linked)
    if (proj?.builder.clerkOrgId) {
      try {
        const orgId = proj.builder.clerkOrgId;
        const list = await clerkClient.organizations.getOrganizationMembershipList({ organizationId: orgId });
        // Filter eligible assignees if any are configured; otherwise include default roles
        const eligible = await prisma.eligibleAssignee.findMany({ where: { builderId: proj.builder.id } });
        let memberRecords = list.data;
        if (eligible.length > 0) {
          const allow = new Set(eligible.map((e) => e.userId));
          memberRecords = memberRecords.filter((m) => allow.has(m.publicUserData?.userId as string));
        } else {
          const allowedRoles = new Set(['manager', 'basic_member']);
          memberRecords = memberRecords.filter((m) => allowedRoles.has(m.role));
        }
        const members = memberRecords.map((m) => m.publicUserData?.userId).filter(Boolean) as string[];
        if (members.length > 0) {
          const cursor = await prisma.assignmentCursor.upsert({ where: { builderId: proj.builder.id }, update: {}, create: { builderId: proj.builder.id } });
          const idx = cursor.lastUserId ? Math.max(0, members.indexOf(cursor.lastUserId)) : -1;
          const next = members[(idx + 1) % members.length];
          await prisma.lead.update({ where: { id: created.id }, data: { assignedToUserId: next, assignedAt: new Date() } });
          await prisma.assignmentCursor.update({ where: { builderId: proj.builder.id }, data: { lastUserId: next } });
        }
      } catch {}
    } else {
      // fallback assign to owner
      if (proj?.builder.ownerUserId) {
        await prisma.lead.update({ where: { id: created.id }, data: { assignedToUserId: proj.builder.ownerUserId, assignedAt: new Date() } });
      }
    }
    // Confirmation to inquirer
    await sendLeadConfirmation(created.email, { project: proj!.name, unit: proj?.units?.[0]?.number, builderEmail: toBuilder || null });
    return new Response(JSON.stringify({ ok: true, lead: created }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(e.message || 'Invalid', { status: 400 });
  }
}
