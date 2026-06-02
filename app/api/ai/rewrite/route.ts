/**
 * AI Content Rewrite API
 * POST /api/ai/rewrite
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const rewriteSchema = z.object({
  content: z.string().min(10, 'Content too short'),
  tone: z.enum(['professional', 'casual', 'funny', 'inspirational', 'educational']),
  platform: z.string().optional().default('INSTAGRAM'),
});

async function rewriteWithAI(content: string, tone: string, platform: string) {
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
          content: `Rewrite content for ${platform} with a ${tone} tone. Improve clarity, engagement, and impact.
Return JSON: {"rewritten": "improved version", "improvements": ["What was improved 1", "What was improved 2"]}`,
        },
        { role: 'user', content: `Rewrite this:\n\n${content}` },
      ],
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) throw new Error('OpenAI error');
  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

function templateRewrite(content: string, tone: string) {
  const toneTransformations: Record<string, (text: string) => string> = {
    professional: (t) => `In today's landscape, ${t.toLowerCase()} This insight is crucial for professionals navigating this space.`,
    casual: (t) => `Okay so here's the deal... ${t} No cap, this is actually really important! 😊`,
    funny: (t) => `Plot twist: ${t} Who knew? 😂 (Apparently everyone except me!)`,
    inspirational: (t) => `Every journey starts with a single step. ${t} Remember: your consistency today builds your tomorrow. 💪`,
    educational: (t) => `Here's what the data shows: ${t} Understanding this concept is fundamental to mastery in this field.`,
  };

  const transform = toneTransformations[tone] || toneTransformations.casual;

  return {
    rewritten: transform(content),
    improvements: [
      `Adjusted tone to be more ${tone}`,
      'Improved engagement with stronger opening',
      'Added emotional resonance for the target audience',
    ],
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const result = rewriteSchema.safeParse(body);
    if (!result.success) return Response.json({ error: result.error.issues[0].message }, { status: 400 });

    const { content, tone, platform } = result.data;

    let data;
    if (process.env.OPENAI_API_KEY?.startsWith('sk-')) {
      data = await rewriteWithAI(content, tone, platform);
    } else {
      data = templateRewrite(content, tone);
    }

    return Response.json({ data });
  } catch (error) {
    console.error('[POST /api/ai/rewrite] Error:', error);
    return Response.json({ error: 'Rewrite failed' }, { status: 500 });
  }
}
