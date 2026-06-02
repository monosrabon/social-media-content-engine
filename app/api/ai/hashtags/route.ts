/**
 * AI Hashtag Generation API
 * POST /api/ai/hashtags
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const hashtagSchema = z.object({
  content: z.string().min(5),
  platform: z.string().default('INSTAGRAM'),
  count: z.number().min(1).max(30).default(15),
});

async function generateHashtagsWithAI(content: string, platform: string, count: number) {
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
          content: `Generate exactly ${count} relevant hashtags for ${platform} content. Mix of popular and niche tags. Return as JSON: {"hashtags": ["#tag1", "#tag2"]}`,
        },
        { role: 'user', content },
      ],
      temperature: 0.8,
      max_tokens: 300,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) throw new Error('OpenAI error');
  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

function generateTemplateHashtags(content: string, platform: string, count: number) {
  const platformTags: Record<string, string[]> = {
    INSTAGRAM: ['#instadaily', '#instagood', '#photooftheday', '#instagram', '#love', '#follow', '#like', '#photography'],
    TWITTER: ['#trending', '#viral', '#thread', '#news'],
    LINKEDIN: ['#leadership', '#business', '#entrepreneur', '#networking', '#career', '#innovation'],
    FACEBOOK: ['#facebook', '#community', '#share', '#viral'],
    TIKTOK: ['#fyp', '#foryoupage', '#viral', '#trending', '#tiktok', '#foryou'],
    YOUTUBE: ['#youtube', '#subscribe', '#video', '#viral', '#trending'],
  };

  const words = content.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
  const contentTags = [...new Set(words)].slice(0, 5).map(w => `#${w}`);
  const baseTags = platformTags[platform] || platformTags.INSTAGRAM;
  const combined = [...contentTags, ...baseTags].slice(0, count);

  return { hashtags: combined };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const result = hashtagSchema.safeParse(body);
    if (!result.success) {
      return Response.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { content, platform, count } = result.data;

    let data;
    if (process.env.OPENAI_API_KEY?.startsWith('sk-')) {
      data = await generateHashtagsWithAI(content, platform, count);
    } else {
      data = generateTemplateHashtags(content, platform, count);
    }

    return Response.json({ data });
  } catch (error) {
    console.error('[POST /api/ai/hashtags] Error:', error);
    return Response.json({ error: 'Hashtag generation failed' }, { status: 500 });
  }
}
