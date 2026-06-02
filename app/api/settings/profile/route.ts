/**
 * Profile Settings API
 * PATCH /api/settings/profile — Update user profile (name, bio, website, timezone)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  bio: z.string().max(500).optional(),
  website: z.string().url('Invalid URL').or(z.literal('')).optional(),
  timezone: z.string().optional(),
});

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = profileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    const { name, bio, website, timezone } = parsed.data;

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        ...(bio !== undefined ? { bio } : {}),
        ...(website !== undefined ? { website } : {}),
        ...(timezone ? { timezone } : {}),
      },
      select: { id: true, name: true, email: true, bio: true, website: true, timezone: true },
    });

    return NextResponse.json({ data: updatedUser });
  } catch (error) {
    console.error('[PATCH /api/settings/profile] Error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
