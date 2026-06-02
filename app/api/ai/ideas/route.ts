/**
 * AI Content Ideas API
 * POST /api/ai/ideas
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const ideasSchema = z.object({
  niche: z.string().min(2).default('social media'),
  platform: z.string().default('INSTAGRAM'),
  count: z.number().min(1).max(10).default(5),
});

const IDEA_TEMPLATES = [
  { template: 'Top {num} tools for {niche} in 2025', type: 'List', engagement: 'High' },
  { template: 'How I grew my {niche} following by 300% in 3 months', type: 'Story', engagement: 'Very High' },
  { template: 'The biggest {niche} mistake beginners make', type: 'Educational', engagement: 'High' },
  { template: 'Day in the life of a {niche} professional', type: 'Documentary', engagement: 'Medium' },
  { template: '{niche} trends you need to know about right now', type: 'Trending', engagement: 'High' },
  { template: 'Why {niche} is harder than it looks (honest take)', type: 'Opinion', engagement: 'Very High' },
  { template: 'I tried every {niche} strategy so you don\'t have to', type: 'Review', engagement: 'High' },
  { template: 'The {niche} guide nobody else is sharing', type: 'Tutorial', engagement: 'High' },
  { template: 'Behind the scenes: my {niche} workflow', type: 'BTS', engagement: 'Medium' },
  { template: 'Answering your {niche} questions', type: 'Q&A', engagement: 'High' },
];

async function generateIdeasWithAI(niche: string, platform: string, count: number) {
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
          content: `Generate ${count} engaging content ideas for ${platform} in the "${niche}" niche. Return JSON: {"ideas": [{"title": "...", "description": "...", "contentType": "...", "estimatedEngagement": "High|Medium|Very High"}]}`,
        },
        {
          role: 'user',
          content: `Create ${count} creative, scroll-stopping content ideas for ${platform} about ${niche}`,
        },
      ],
      temperature: 0.9,
      max_tokens: 600,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) throw new Error('OpenAI error');
  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

function generateTemplateIdeas(niche: string, platform: string, count: number) {
  const ideas = IDEA_TEMPLATES.slice(0, count).map((template) => ({
    title: template.template.replace(/{niche}/g, niche).replace(/{num}/g, '5'),
    description: `Create a ${template.type.toLowerCase()} post about ${niche} for ${platform}. This type of content typically performs well with your audience.`,
    contentType: template.type,
    estimatedEngagement: template.engagement,
  }));
  return { ideas };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const result = ideasSchema.safeParse(body);
    if (!result.success) return Response.json({ error: result.error.issues[0].message }, { status: 400 });

    const { niche, platform, count } = result.data;

    let data;
    if (process.env.OPENAI_API_KEY?.startsWith('sk-')) {
      data = await generateIdeasWithAI(niche, platform, count);
    } else {
      data = generateTemplateIdeas(niche, platform, count);
    }

    // Save ideas to database
    if (data.ideas?.length > 0) {
      await prisma.contentIdea.createMany({
        data: data.ideas.map((idea: { title: string; description: string; contentType: string }) => ({
          userId: session.user.id,
          title: idea.title,
          description: idea.description,
          platform: platform as any,
          category: idea.contentType,
          tags: [niche.toLowerCase().replace(/\s+/g, '')],
        })),
      });
    }

    return Response.json({ data });
  } catch (error) {
    console.error('[POST /api/ai/ideas] Error:', error);
    return Response.json({ error: 'Idea generation failed' }, { status: 500 });
  }
}
