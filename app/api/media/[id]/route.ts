import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase-server';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { data: item } = await supabase.from('media').select('*').eq('id', id).eq('userId', session.user.id).single();
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({ data: item });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { alt, tags } = await req.json();

    const updates: Record<string, unknown> = {};
    if (alt !== undefined) updates.alt = alt;
    if (tags !== undefined) updates.tags = tags;

    await supabase.from('media').update(updates).eq('id', id).eq('userId', session.user.id);
    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    await supabase.from('media').delete().eq('id', id).eq('userId', session.user.id);
    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
