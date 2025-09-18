import { NextRequest } from 'next/server';
import { ProjectSchema } from '@moji/core';
import { prisma } from '@/lib/db';
import { getAuthContext, hasActiveSubscription } from '@/lib/clerk';
import { requireRole, Roles } from '@/lib/rbac';
import { revalidatePath } from 'next/cache';

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = ProjectSchema.parse(json);
    const { userId, builderSlug, role } = await getAuthContext();
    requireRole({ userId, builderSlug, orgId: null, role }, Roles.OwnerOrManager as any);

    if (!(await hasActiveSubscription())) {
      return new Response('Subscription required', { status: 402 });
    }

    // Ensure a builder exists for this user (owner)
    const builder = await prisma.builder.upsert({
      where: { slug: builderSlug },
      update: {},
      create: {
        slug: builderSlug,
        name: builderSlug,
        ownerUserId: userId,
      },
    });

    // Enforce plan limits: Starter → 1 active project
    const existingCount = await prisma.project.count({ where: { builderId: builder.id } });
    const subscribed = await hasActiveSubscription();
    if (!subscribed && existingCount >= 1) {
      return new Response('Starter plan allows 1 project. Upgrade to add more.', { status: 402 });
    }

    const project = await prisma.project.create({
      data: {
        name: parsed.name,
        location: parsed.location,
        micrositeSlug: parsed.micrositeSlug,
        brandColor: parsed.brandColor,
        description: parsed.description,
        builderId: builder.id,
        units: {
          create: parsed.units.map((u) => ({
            number: u.number,
            sizeSqm: u.sizeSqm,
            floor: u.floor,
            rooms: u.rooms,
            ...(u.price != null ? { price: u.price } : {}),
            orientation: u.orientation,
            status: u.status as any,
          })),
        },
      },
      include: { units: true },
    });

    const url = `${process.env.NEXT_PUBLIC_APP_URL}/${encodeURIComponent(builder.slug)}/${encodeURIComponent(project.micrositeSlug)}`;
    revalidatePath(url);
    revalidatePath('/explore');
    return new Response(JSON.stringify({ project, url }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(e.message || 'Invalid request', { status: 400 });
  }
}
