import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread') === 'true';

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('userId', session.user.id)
      .order('createdAt', { ascending: false })
      .limit(50);

    if (unreadOnly) query = query.eq('read', false);

    const [{ data: notifications }, { count: unreadCount }] = await Promise.all([
      query,
      supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('userId', session.user.id).eq('read', false),
    ]);

    return Response.json({ data: { notifications: notifications || [], unreadCount: unreadCount || 0 } });
  } catch (error) {
    console.error('[GET /api/notifications]', error);
    return Response.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, markAllRead } = await request.json();

    if (markAllRead) {
      await supabase.from('notifications').update({ read: true }).eq('userId', session.user.id).eq('read', false);
    } else if (id) {
      await supabase.from('notifications').update({ read: true }).eq('id', id);
    }

    return Response.json({ data: { success: true } });
  } catch (error) {
    console.error('[PATCH /api/notifications]', error);
    return Response.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}
