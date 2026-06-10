import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase-server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const parsed = passwordSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message || 'Invalid input' }, { status: 400 });

    const { currentPassword, newPassword } = parsed.data;

    const { data: user } = await supabase.from('users').select('password').eq('id', session.user.id).single();
    if (!user?.password) return NextResponse.json({ error: 'Password change not available for OAuth accounts' }, { status: 400 });

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });

    const hashed = await bcrypt.hash(newPassword, 12);
    await supabase.from('users').update({ password: hashed }).eq('id', session.user.id);

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error('[PATCH /api/settings/password]', error);
    return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
  }
}
