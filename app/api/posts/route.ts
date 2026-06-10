import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase-server';
import { n8n } from '@/lib/n8n';
import { z } from 'zod';

const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  caption: z.string().optional(),
  hashtags: z.array(z.string()).optional().default([]),
  platforms: z.array(z.string()).optional().default([]),
  status: z.enum(['DRAFT', 'SCHEDULED', 'PUBLISHED']).optional().default('DRAFT'),
  scheduledAt: z.string().datetime().optional(),
  tags: z.array(z.string()).optional().default([]),
  notes: z.string().optional(),
  imageUrl: z.string().url().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    let query = supabase
      .from('posts')
      .select('*, analytics(*)', { count: 'exact' })
      .eq('userId', session.user.id)
      .order('createdAt', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (status) query = query.eq('status', status);

    const { data: posts, count, error } = await query;
    if (error) throw error;

    return Response.json({
      data: posts,
      pagination: { page, limit, total: count || 0, pages: Math.ceil((count || 0) / limit) },
    });
  } catch (error) {
    console.error('[GET /api/posts]', error);
    return Response.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const result = createPostSchema.safeParse(body);
    if (!result.success) return Response.json({ error: result.error.issues[0].message }, { status: 400 });

    const data = result.data;
    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        userId: session.user.id,
        title: data.title,
        content: data.content,
        caption: data.caption,
        hashtags: data.hashtags,
        platforms: data.platforms,
        status: data.status,
        scheduledAt: data.scheduledAt || null,
        tags: data.tags,
        notes: data.notes,
        imageUrl: data.imageUrl,
      })
      .select()
      .single();

    if (error || !post) throw error;

    await supabase.from('activities').insert({
      userId: session.user.id,
      type: 'POST_CREATED',
      description: `Created post "${post.title}"`,
      metadata: { postId: post.id, status: post.status },
    });

    n8n.onPostCreated({ id: post.id, title: post.title, status: post.status, platforms: post.platforms, userId: session.user.id }).catch(console.warn);

    return Response.json({ data: post }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/posts]', error);
    return Response.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
