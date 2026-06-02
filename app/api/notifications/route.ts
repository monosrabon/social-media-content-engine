/**
 * Notifications API
 *
 * GET   /api/notifications  — List notifications
 * PATCH /api/notifications  — Mark all as read
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread') === 'true';

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: {
          userId: session.user.id,
          ...(unreadOnly ? { read: false } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.notification.count({
        where: { userId: session.user.id, read: false },
      }),
    ]);

    return Response.json({ data: { notifications, unreadCount } });
  } catch (error) {
    console.error('[GET /api/notifications] Error:', error);
    return Response.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { id, markAllRead } = body;

    if (markAllRead) {
      await prisma.notification.updateMany({
        where: { userId: session.user.id, read: false },
        data: { read: true },
      });
    } else if (id) {
      await prisma.notification.update({
        where: { id },
        data: { read: true },
      });
    }

    return Response.json({ data: { success: true } });
  } catch (error) {
    console.error('[PATCH /api/notifications] Error:', error);
    return Response.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}
