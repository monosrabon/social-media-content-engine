/**
 * Prisma Seed Script
 * Run with: npm run db:seed
 *
 * This creates demo data so you can explore the app immediately.
 */

import { PrismaClient, PostStatus, Platform, MediaType, NotificationType, ActivityType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // ============================================================
  // Create demo user
  // ============================================================
  const hashedPassword = await bcrypt.hash('Demo1234!', 12);

  const user = await prisma.user.upsert({
    where: { email: 'demo@contentengine.ai' },
    update: {},
    create: {
      email: 'demo@contentengine.ai',
      name: 'Alex Demo',
      password: hashedPassword,
      bio: 'Content creator & social media strategist',
      website: 'https://contentengine.ai',
      timezone: 'America/New_York',
    },
  });

  console.log(`✅ User created: ${user.email}`);

  // ============================================================
  // Create demo posts
  // ============================================================
  const posts = await Promise.all([
    prisma.post.create({
      data: {
        userId: user.id,
        title: 'Launch Day Announcement',
        content: 'We are thrilled to announce the launch of our revolutionary new product that will change how you create content forever!',
        caption: '🚀 Big news! We just launched something incredible. After months of hard work, our team is beyond excited to share this with you. Link in bio!',
        hashtags: ['#launch', '#product', '#startup', '#contentcreator', '#innovation'],
        platforms: [Platform.INSTAGRAM, Platform.TWITTER, Platform.LINKEDIN],
        status: PostStatus.PUBLISHED,
        publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        contentScore: 92,
        aiSummary: 'High-energy product launch post with strong CTA. Excellent use of emojis and hashtags.',
        tags: ['launch', 'announcement'],
      },
    }),
    prisma.post.create({
      data: {
        userId: user.id,
        title: 'Weekly Tips: Social Media Growth',
        content: 'Here are 5 proven strategies to grow your social media following in 2025. Consistency is key!',
        caption: '5 social media growth hacks that actually work in 2025 🎯\n\n1️⃣ Post consistently\n2️⃣ Engage with your community\n3️⃣ Use trending audio\n4️⃣ Collaborate with creators\n5️⃣ Analyze your data\n\nSave this for later! 💾',
        hashtags: ['#socialmediatips', '#growthhack', '#contentcreator', '#digitalmarketing', '#smm'],
        platforms: [Platform.INSTAGRAM, Platform.TIKTOK],
        status: PostStatus.PUBLISHED,
        publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        contentScore: 88,
        aiSummary: 'Educational carousel-style post. Strong save potential with list format.',
        tags: ['tips', 'education'],
      },
    }),
    prisma.post.create({
      data: {
        userId: user.id,
        title: 'Behind the Scenes: Our Team',
        content: 'A sneak peek into our daily workflow and the amazing team behind the magic.',
        caption: '✨ Ever wonder what goes on behind the scenes? Here\'s a day in the life of our team! From morning stand-ups to late-night brainstorming sessions.',
        hashtags: ['#behindthescenes', '#teamwork', '#worklife', '#company', '#culture'],
        platforms: [Platform.LINKEDIN, Platform.FACEBOOK],
        status: PostStatus.SCHEDULED,
        scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        contentScore: 75,
        tags: ['bts', 'team'],
      },
    }),
    prisma.post.create({
      data: {
        userId: user.id,
        title: 'Product Feature Highlight',
        content: 'Introducing our AI-powered caption generator. Create perfect captions in seconds!',
        caption: null,
        hashtags: [],
        platforms: [Platform.INSTAGRAM],
        status: PostStatus.DRAFT,
        contentScore: null,
        tags: ['product', 'feature'],
      },
    }),
    prisma.post.create({
      data: {
        userId: user.id,
        title: 'Monthly Newsletter Promo',
        content: 'Join 10,000+ creators who get our weekly tips delivered to their inbox.',
        caption: '📧 Join 10,000+ content creators getting weekly growth tips straight to their inbox. No spam, just value! Sign up link in bio.',
        hashtags: ['#newsletter', '#email', '#contentmarketing', '#creator'],
        platforms: [Platform.TWITTER, Platform.LINKEDIN],
        status: PostStatus.PUBLISHED,
        publishedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        contentScore: 82,
        tags: ['newsletter', 'email'],
      },
    }),
  ]);

  console.log(`✅ ${posts.length} posts created`);

  // ============================================================
  // Create content ideas
  // ============================================================
  await prisma.contentIdea.createMany({
    data: [
      {
        userId: user.id,
        title: 'Day in the Life Vlog',
        description: 'A full day documenting my content creation process from ideation to publishing',
        platform: Platform.YOUTUBE,
        category: 'Documentary',
        tags: ['vlog', 'dayinthelife', 'contentcreation'],
        used: false,
      },
      {
        userId: user.id,
        title: 'Myth Busting Series',
        description: 'Debunk top 10 social media myths that beginners believe',
        platform: Platform.INSTAGRAM,
        category: 'Education',
        tags: ['myths', 'education', 'beginners'],
        used: false,
      },
      {
        userId: user.id,
        title: 'Collaboration with Micro Influencers',
        description: 'Partner with 3 micro influencers in our niche for cross-promotion',
        platform: null,
        category: 'Partnership',
        tags: ['collab', 'influencer', 'partnership'],
        used: true,
      },
      {
        userId: user.id,
        title: 'Tool Review: Top 5 AI Writing Tools',
        description: 'Review the best AI writing assistants for content creators in 2025',
        platform: Platform.YOUTUBE,
        category: 'Review',
        tags: ['ai', 'tools', 'review', 'writing'],
        used: false,
      },
    ],
  });

  console.log('✅ Content ideas created');

  // ============================================================
  // Create analytics data (last 30 days)
  // ============================================================
  const analyticsData = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const baseImpressions = 1000 + Math.floor(Math.random() * 5000);
    const reach = Math.floor(baseImpressions * 0.7);
    const likes = Math.floor(reach * 0.05);
    const comments = Math.floor(likes * 0.2);
    const shares = Math.floor(likes * 0.1);

    analyticsData.push({
      userId: user.id,
      platform: Platform.INSTAGRAM,
      date,
      impressions: baseImpressions,
      reach,
      clicks: Math.floor(reach * 0.03),
      likes,
      comments,
      shares,
      saves: Math.floor(likes * 0.15),
      engagementRate: parseFloat(((likes + comments + shares) / reach * 100).toFixed(2)),
      followerGrowth: Math.floor(Math.random() * 50),
    });
  }

  await prisma.analytics.createMany({ data: analyticsData });
  console.log('✅ Analytics data created (30 days)');

  // ============================================================
  // Create notifications
  // ============================================================
  await prisma.notification.createMany({
    data: [
      {
        userId: user.id,
        title: 'Post Published Successfully!',
        message: 'Your post "Launch Day Announcement" has been published to Instagram and Twitter.',
        type: NotificationType.SUCCESS,
        read: false,
        actionUrl: '/content',
      },
      {
        userId: user.id,
        title: 'Scheduled Post Reminder',
        message: '"Behind the Scenes: Our Team" is scheduled to publish in 2 days.',
        type: NotificationType.REMINDER,
        read: false,
        actionUrl: '/calendar',
      },
      {
        userId: user.id,
        title: 'Weekly Analytics Report Ready',
        message: 'Your weekly performance report is ready. Engagement up 23% this week!',
        type: NotificationType.INFO,
        read: true,
        actionUrl: '/analytics',
      },
      {
        userId: user.id,
        title: 'AI Caption Generated',
        message: 'AI has generated a new caption for your draft post. Review and publish!',
        type: NotificationType.INFO,
        read: true,
        actionUrl: '/content',
      },
    ],
  });

  console.log('✅ Notifications created');

  // ============================================================
  // Create activities
  // ============================================================
  await prisma.activity.createMany({
    data: [
      {
        userId: user.id,
        type: ActivityType.POST_PUBLISHED,
        description: 'Published "Launch Day Announcement" to 3 platforms',
        metadata: { platforms: ['INSTAGRAM', 'TWITTER', 'LINKEDIN'], postId: posts[0].id },
      },
      {
        userId: user.id,
        type: ActivityType.AI_GENERATED,
        description: 'AI generated caption for "Weekly Tips: Social Media Growth"',
        metadata: { model: 'gpt-4o-mini', tokens: 156 },
      },
      {
        userId: user.id,
        type: ActivityType.POST_SCHEDULED,
        description: 'Scheduled "Behind the Scenes: Our Team" for publishing',
        metadata: { scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) },
      },
      {
        userId: user.id,
        type: ActivityType.POST_CREATED,
        description: 'Created new draft "Product Feature Highlight"',
        metadata: { postId: posts[3].id },
      },
      {
        userId: user.id,
        type: ActivityType.ANALYTICS_REPORT,
        description: 'Weekly analytics report generated by n8n',
        metadata: { engagementRate: '7.3%', impressions: 45231 },
      },
    ],
  });

  console.log('✅ Activities created');

  // ============================================================
  // Create media entries
  // ============================================================
  await prisma.media.createMany({
    data: [
      {
        userId: user.id,
        filename: 'launch-banner.jpg',
        originalName: 'Launch Banner.jpg',
        mimeType: 'image/jpeg',
        size: 245000,
        url: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800',
        mediaType: MediaType.IMAGE,
        alt: 'Product launch banner',
        tags: ['launch', 'banner'],
      },
      {
        userId: user.id,
        filename: 'team-photo.jpg',
        originalName: 'Team Photo.jpg',
        mimeType: 'image/jpeg',
        size: 320000,
        url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800',
        mediaType: MediaType.IMAGE,
        alt: 'Team collaboration photo',
        tags: ['team', 'office'],
      },
      {
        userId: user.id,
        filename: 'analytics-dashboard.png',
        originalName: 'Analytics Dashboard.png',
        mimeType: 'image/png',
        size: 180000,
        url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800',
        mediaType: MediaType.IMAGE,
        alt: 'Analytics dashboard screenshot',
        tags: ['analytics', 'data'],
      },
    ],
  });

  console.log('✅ Media entries created');
  console.log('\n🎉 Seed complete! You can log in with:');
  console.log('   Email:    demo@contentengine.ai');
  console.log('   Password: Demo1234!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
