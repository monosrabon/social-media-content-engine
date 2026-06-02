/**
 * AI Caption Generation API
 * POST /api/ai/caption
 *
 * HOW IT WORKS:
 * 1. Receive post content + tone + platform
 * 2. Try OpenAI GPT-4o-mini (if API key configured)
 * 3. If no API key, use smart template-based generation
 * 4. Return caption, hashtags, score, summary
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const captionSchema = z.object({
  content: z.string().min(10, 'Content too short for AI analysis'),
  platform: z.string().default('INSTAGRAM'),
  tone: z.enum(['professional', 'casual', 'funny', 'inspirational', 'educational']).default('casual'),
  maxLength: z.number().optional().default(300),
});

// Platform-specific caption styles
const platformGuidelines: Record<string, string> = {
  INSTAGRAM: 'engaging with emojis, strong hook in first line, save-worthy content',
  TWITTER: 'concise under 280 chars, punchy, with a question or strong opinion',
  LINKEDIN: 'professional tone, storytelling format, thought leadership angle',
  FACEBOOK: 'conversational, community-focused, ask for engagement',
  TIKTOK: 'trendy, youth-friendly, hook-first, very short',
  YOUTUBE: 'descriptive, keyword-rich, clear value proposition',
};

async function generateWithOpenAI(content: string, platform: string, tone: string): Promise<{
  caption: string;
  hashtags: string[];
  contentScore: number;
  summary: string;
}> {
  const platformGuide = platformGuidelines[platform] || platformGuidelines.INSTAGRAM;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert social media copywriter. Generate captions for ${platform}.
Style: ${platformGuide}. Tone: ${tone}.
Always respond in this exact JSON format:
{
  "caption": "the caption text here",
  "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"],
  "contentScore": 85,
  "summary": "Brief analysis of why this caption works"
}`,
        },
        {
          role: 'user',
          content: `Generate a ${tone} ${platform} caption for this content:\n\n${content}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

// Fallback: template-based generation (no API key required)
function generateTemplateCaption(content: string, platform: string, tone: string) {
  const words = content.split(' ').slice(0, 8).join(' ');
  const platformEmojis: Record<string, string[]> = {
    INSTAGRAM: ['✨', '🔥', '💡', '🎯', '🚀'],
    TWITTER: ['🧵', '💬', '📢', '🔑'],
    LINKEDIN: ['💼', '📈', '🤝', '💡'],
    FACEBOOK: ['👋', '💙', '🙌', '❤️'],
    TIKTOK: ['🔥', '✨', '💫', '🎵'],
    YOUTUBE: ['▶️', '📺', '🎬', '👆'],
  };

  const emojis = platformEmojis[platform] || platformEmojis.INSTAGRAM;
  const emoji = emojis[Math.floor(Math.random() * emojis.length)];

  const toneOpeners: Record<string, string> = {
    professional: 'Insights worth sharing:',
    casual: `${emoji} Okay, this is important:`,
    funny: '😂 Plot twist:',
    inspirational: `${emoji} Here\'s something that changed my perspective:`,
    educational: `💡 Did you know:`,
  };

  const opener = toneOpeners[tone] || toneOpeners.casual;

  const caption = `${opener}\n\n${content}\n\n💬 What do you think? Drop your thoughts below!\n\n${emojis.join(' ')}`;

  const keywords = content.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
  const hashtags = [
    '#contentcreator',
    '#socialmedia',
    '#digitalmarketing',
    ...keywords.slice(0, 3).map(w => `#${w}`),
    `#${platform.toLowerCase()}`,
  ].slice(0, 8);

  return {
    caption,
    hashtags,
    contentScore: 65 + Math.floor(Math.random() * 20),
    summary: `Template-generated caption for ${platform} with ${tone} tone. Add your OpenAI API key for AI-powered captions.`,
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const result = captionSchema.safeParse(body);
    if (!result.success) {
      return Response.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { content, platform, tone } = result.data;

    let captionData;

    // Try OpenAI first, fall back to template
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-')) {
      captionData = await generateWithOpenAI(content, platform, tone);
    } else {
      captionData = generateTemplateCaption(content, platform, tone);
    }

    return Response.json({ data: captionData });
  } catch (error) {
    console.error('[POST /api/ai/caption] Error:', error);
    return Response.json({ error: 'Caption generation failed' }, { status: 500 });
  }
}
