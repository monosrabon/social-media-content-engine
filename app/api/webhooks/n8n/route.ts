import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const secret = request.headers.get('x-webhook-secret');
    if (secret !== process.env.N8N_INCOMING_SECRET) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { event, data } = await request.json();
    console.log(`[webhook/n8n] Received event: ${event}`);

    switch (event) {
      case 'ai.caption.result': {
        const { postId, caption, hashtags, contentScore, summary } = data;
        if (postId) await supabase.from('posts').update({ caption, hashtags, contentScore, aiSummary: summary }).eq('id', postId);
        break;
      }
      case 'post.published': {
        const { postId, userId, success, error: pubError } = data;
        if (postId) {
          await supabase.from('posts').update({
            status: success ? 'PUBLISHED' : 'FAILED',
            publishedAt: success ? new Date().toISOString() : null,
          }).eq('id', postId);

          if (userId) {
            await supabase.from('notifications').insert({
              userId,
              title: success ? '✅ Post Published!' : '❌ Publishing Failed',
              message: success ? 'Your scheduled post has been published successfully.' : `Failed to publish: ${pubError || 'Unknown error'}`,
              type: success ? 'SUCCESS' : 'ERROR',
              actionUrl: '/content',
            });
            await supabase.from('activities').insert({
              userId, type: 'POST_PUBLISHED',
              description: success ? 'Scheduled post published' : 'Scheduled post failed',
              metadata: { postId, success },
            });
          }
        }
        break;
      }
      case 'report.weekly.complete': {
        const { userId, reportUrl, summary: reportSummary } = data;
        if (userId) {
          await supabase.from('notifications').insert({ userId, title: '📊 Weekly Report Ready', message: reportSummary || 'Your weekly analytics report is ready.', type: 'INFO', actionUrl: reportUrl || '/analytics' });
          await supabase.from('activities').insert({ userId, type: 'ANALYTICS_REPORT', description: 'Weekly analytics report generated', metadata: { reportUrl } });
        }
        break;
      }
      case 'workflow.triggered': {
        const { userId, workflowName } = data;
        if (userId) await supabase.from('activities').insert({ userId, type: 'WORKFLOW_TRIGGERED', description: `n8n workflow "${workflowName}" triggered`, metadata: data });
        break;
      }
    }

    return Response.json({ data: { received: true, event } });
  } catch (error) {
    console.error('[webhook/n8n]', error);
    return Response.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
