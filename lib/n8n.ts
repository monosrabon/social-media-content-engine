/**
 * n8n Integration Helper
 *
 * WHY: This module provides typed functions to trigger n8n webhooks.
 * n8n handles automation like publishing, notifications, and AI enrichment.
 *
 * HOW IT WORKS:
 * Our app sends HTTP POST to n8n webhook URL with event data.
 * n8n processes the event and optionally calls back our /api/webhooks/n8n endpoint.
 */

const N8N_BASE_URL = process.env.N8N_BASE_URL || 'http://localhost:5678';
const N8N_WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET || '';

// ============================================================
// Webhook event types
// ============================================================

export type N8NEvent =
  | 'post.created'
  | 'post.scheduled'
  | 'post.deleted'
  | 'ai.caption.request'
  | 'ai.hashtags.request'
  | 'analytics.weekly.report'
  | 'notification.send'
  | 'reminder.schedule';

interface N8NPayload {
  event: N8NEvent;
  timestamp: string;
  data: Record<string, unknown>;
}

// ============================================================
// Core webhook trigger function
// ============================================================

async function triggerN8NWebhook(
  webhookPath: string,
  payload: N8NPayload
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  const url = `${N8N_BASE_URL}/webhook/${webhookPath}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': N8N_WEBHOOK_SECRET,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[n8n] Webhook failed: ${response.status} - ${errorText}`);
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }

    const data = await response.json().catch(() => null);
    return { success: true, data };
  } catch (error) {
    // Don't crash the app if n8n is unavailable
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.warn(`[n8n] Webhook unavailable (${url}): ${message}`);
    return { success: false, error: message };
  }
}

// ============================================================
// Typed event trigger functions
// ============================================================

export const n8n = {
  /**
   * Trigger when a new post is created
   * n8n will: log the event, potentially enrich with AI, send notifications
   */
  async onPostCreated(post: {
    id: string;
    title: string;
    status: string;
    platforms: string[];
    userId: string;
  }) {
    return triggerN8NWebhook('content/post-created', {
      event: 'post.created',
      timestamp: new Date().toISOString(),
      data: post,
    });
  },

  /**
   * Trigger when a post is scheduled for publishing
   * n8n will: queue the post for publishing at the scheduled time
   */
  async onPostScheduled(post: {
    id: string;
    title: string;
    scheduledAt: string;
    platforms: string[];
    userId: string;
  }) {
    return triggerN8NWebhook('content/post-scheduled', {
      event: 'post.scheduled',
      timestamp: new Date().toISOString(),
      data: post,
    });
  },

  /**
   * Trigger AI caption generation
   * n8n will: call OpenAI, return caption to our callback endpoint
   */
  async requestAICaption(params: {
    postId: string;
    content: string;
    platform: string;
    tone: string;
    userId: string;
  }) {
    return triggerN8NWebhook('ai/caption', {
      event: 'ai.caption.request',
      timestamp: new Date().toISOString(),
      data: params,
    });
  },

  /**
   * Trigger AI hashtag generation
   */
  async requestAIHashtags(params: {
    postId: string;
    content: string;
    platform: string;
    userId: string;
  }) {
    return triggerN8NWebhook('ai/hashtags', {
      event: 'ai.hashtags.request',
      timestamp: new Date().toISOString(),
      data: params,
    });
  },

  /**
   * Trigger weekly analytics report
   */
  async triggerWeeklyReport(params: { userId: string; email: string }) {
    return triggerN8NWebhook('reports/weekly', {
      event: 'analytics.weekly.report',
      timestamp: new Date().toISOString(),
      data: params,
    });
  },

  /**
   * Send a notification via Telegram or email
   */
  async sendNotification(params: {
    channel: 'telegram' | 'email';
    userId: string;
    title: string;
    message: string;
  }) {
    return triggerN8NWebhook('notifications/send', {
      event: 'notification.send',
      timestamp: new Date().toISOString(),
      data: params,
    });
  },
};
