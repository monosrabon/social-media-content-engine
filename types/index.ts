/**
 * TypeScript Types & Interfaces
 * Central type definitions used throughout the app.
 */

import { Post, User, Analytics, Notification, Activity, Media, ContentIdea } from '@prisma/client';

// ============================================================
// Extended types with relations
// ============================================================

export type PostWithAnalytics = Post & {
  analytics: Analytics[];
  user?: Pick<User, 'id' | 'name' | 'image'>;
};

// ============================================================
// API Request/Response types
// ============================================================

export interface ApiResponse<T> {
  data: T;
}

export interface ApiError {
  error: string;
}

// Post CRUD
export interface CreatePostInput {
  title: string;
  content: string;
  caption?: string;
  hashtags?: string[];
  platforms?: string[];
  status?: string;
  scheduledAt?: string;
  tags?: string[];
  notes?: string;
  imageUrl?: string;
}

export interface UpdatePostInput extends Partial<CreatePostInput> {
  contentScore?: number;
  aiSummary?: string;
}

// AI Features
export interface AICaptionRequest {
  content: string;
  platform: string;
  tone?: 'professional' | 'casual' | 'funny' | 'inspirational' | 'educational';
  maxLength?: number;
}

export interface AICaptionResponse {
  caption: string;
  hashtags: string[];
  contentScore: number;
  summary: string;
}

export interface AIHashtagsRequest {
  content: string;
  platform: string;
  count?: number;
}

export interface AIHashtagsResponse {
  hashtags: string[];
}

export interface AIIdeasRequest {
  niche: string;
  platform: string;
  count?: number;
}

export interface AIIdeasResponse {
  ideas: {
    title: string;
    description: string;
    contentType: string;
    estimatedEngagement: string;
  }[];
}

export interface AIRewriteRequest {
  content: string;
  tone: string;
  platform?: string;
}

export interface AIRewriteResponse {
  rewritten: string;
  improvements: string[];
}

// Analytics
export interface AnalyticsSummary {
  totalImpressions: number;
  totalReach: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  avgEngagementRate: number;
  totalFollowerGrowth: number;
  chartData: {
    date: string;
    impressions: number;
    reach: number;
    engagement: number;
    likes: number;
  }[];
}

// Dashboard KPIs
export interface DashboardStats {
  totalPosts: number;
  publishedPosts: number;
  scheduledPosts: number;
  draftPosts: number;
  totalImpressions: number;
  avgEngagementRate: number;
  followerGrowth: number;
  contentIdeas: number;
}

// Notification
export type NotificationItem = Notification;

// Activity feed
export type ActivityItem = Activity;

// Media library
export type MediaItem = Media;

// Content ideas
export type ContentIdeaItem = ContentIdea;

// Session extension
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
    };
  }
}
