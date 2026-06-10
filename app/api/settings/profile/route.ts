import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase-server';
import { z } from 'zod';

const profileSchema = z.object({
  name: z.string().min(1).max(100),
  bio: z.string().max(500).optional(),
  website: z.string().url().or(z.literal('')).optional(),
  timezone: z.string().optional(),
});

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const parsed = profileSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message || 'Invalid input' }, { status: 400 });

    const { name, bio, website, timezone } = parsed.data;
    const updates: Record<string, unknown> = { name };
    if (bio !== undefined) updates.bio = bio;
    if (website !== undefined) updates.website = website;
    if (timezone) updates.timezone = timezone;

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', session.user.id)
      .select('id, name, email, bio, website, timezone')
      .single();

    if (error) throw error;
    return NextResponse.json({ data: updatedUser });
  } catch (error) {
    console.error('[PATCH /api/settings/profile]', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
