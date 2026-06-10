-- ============================================================
-- SOCIAL MEDIA CONTENT ENGINE — DATABASE SCHEMA
-- Paste this entire script into:
--   Supabase Dashboard → SQL Editor → New Query → Run
-- ============================================================

-- ENUMS
CREATE TYPE "PostStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED', 'FAILED');
CREATE TYPE "Platform" AS ENUM ('TWITTER', 'INSTAGRAM', 'FACEBOOK', 'LINKEDIN', 'TIKTOK', 'YOUTUBE');
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO', 'GIF', 'DOCUMENT');
CREATE TYPE "NotificationType" AS ENUM ('INFO', 'SUCCESS', 'WARNING', 'ERROR', 'REMINDER');
CREATE TYPE "ActivityType" AS ENUM ('POST_CREATED', 'POST_PUBLISHED', 'POST_SCHEDULED', 'POST_DELETED', 'POST_EDITED', 'AI_GENERATED', 'MEDIA_UPLOADED', 'ANALYTICS_REPORT', 'USER_LOGIN', 'WORKFLOW_TRIGGERED');

-- USERS
CREATE TABLE IF NOT EXISTS "users" (
  "id"            TEXT NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
  "name"          TEXT,
  "email"         TEXT NOT NULL UNIQUE,
  "emailVerified" TIMESTAMP(3),
  "image"         TEXT,
  "password"      TEXT,
  "bio"           TEXT,
  "website"       TEXT,
  "timezone"      TEXT NOT NULL DEFAULT 'UTC',
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT NOW()
);

-- NEXTAUTH ACCOUNTS
CREATE TABLE IF NOT EXISTS "accounts" (
  "id"                TEXT NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
  "userId"            TEXT NOT NULL,
  "type"              TEXT NOT NULL,
  "provider"          TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "refresh_token"     TEXT,
  "access_token"      TEXT,
  "expires_at"        INTEGER,
  "token_type"        TEXT,
  "scope"             TEXT,
  "id_token"          TEXT,
  "session_state"     TEXT,
  CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
  UNIQUE ("provider", "providerAccountId")
);

-- NEXTAUTH SESSIONS
CREATE TABLE IF NOT EXISTS "sessions" (
  "id"           TEXT NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
  "sessionToken" TEXT NOT NULL UNIQUE,
  "userId"       TEXT NOT NULL,
  "expires"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);

-- NEXTAUTH VERIFICATION TOKENS
CREATE TABLE IF NOT EXISTS "verification_tokens" (
  "identifier" TEXT NOT NULL,
  "token"      TEXT NOT NULL UNIQUE,
  "expires"    TIMESTAMP(3) NOT NULL,
  UNIQUE ("identifier", "token")
);

-- POSTS
CREATE TABLE IF NOT EXISTS "posts" (
  "id"            TEXT NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
  "title"         TEXT NOT NULL,
  "content"       TEXT NOT NULL,
  "caption"       TEXT,
  "hashtags"      TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "platforms"     "Platform"[] NOT NULL DEFAULT ARRAY[]::"Platform"[],
  "status"        "PostStatus" NOT NULL DEFAULT 'DRAFT',
  "scheduledAt"   TIMESTAMP(3),
  "publishedAt"   TIMESTAMP(3),
  "contentScore"  INTEGER,
  "aiSummary"     TEXT,
  "imageUrl"      TEXT,
  "mediaIds"      TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "tags"          TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "notes"         TEXT,
  "n8nWorkflowId" TEXT,
  "userId"        TEXT NOT NULL,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  CONSTRAINT "posts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "posts_userId_idx" ON "posts"("userId");
CREATE INDEX IF NOT EXISTS "posts_status_idx" ON "posts"("status");
CREATE INDEX IF NOT EXISTS "posts_scheduledAt_idx" ON "posts"("scheduledAt");

-- CONTENT IDEAS
CREATE TABLE IF NOT EXISTS "content_ideas" (
  "id"          TEXT NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
  "title"       TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "platform"    "Platform",
  "category"    TEXT,
  "tags"        TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "used"        BOOLEAN NOT NULL DEFAULT FALSE,
  "userId"      TEXT NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  CONSTRAINT "content_ideas_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "content_ideas_userId_idx" ON "content_ideas"("userId");

-- MEDIA
CREATE TABLE IF NOT EXISTS "media" (
  "id"           TEXT NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
  "filename"     TEXT NOT NULL,
  "originalName" TEXT NOT NULL,
  "mimeType"     TEXT NOT NULL,
  "size"         INTEGER NOT NULL,
  "url"          TEXT NOT NULL,
  "thumbnailUrl" TEXT,
  "mediaType"    "MediaType" NOT NULL,
  "alt"          TEXT,
  "tags"         TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "userId"       TEXT NOT NULL,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  CONSTRAINT "media_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "media_userId_idx" ON "media"("userId");

-- ANALYTICS
CREATE TABLE IF NOT EXISTS "analytics" (
  "id"              TEXT NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
  "postId"          TEXT,
  "userId"          TEXT NOT NULL,
  "platform"        "Platform" NOT NULL,
  "date"            TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "impressions"     INTEGER NOT NULL DEFAULT 0,
  "reach"           INTEGER NOT NULL DEFAULT 0,
  "clicks"          INTEGER NOT NULL DEFAULT 0,
  "likes"           INTEGER NOT NULL DEFAULT 0,
  "comments"        INTEGER NOT NULL DEFAULT 0,
  "shares"          INTEGER NOT NULL DEFAULT 0,
  "saves"           INTEGER NOT NULL DEFAULT 0,
  "engagementRate"  DOUBLE PRECISION NOT NULL DEFAULT 0,
  "followerGrowth"  INTEGER NOT NULL DEFAULT 0,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  CONSTRAINT "analytics_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE SET NULL,
  CONSTRAINT "analytics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "analytics_userId_idx" ON "analytics"("userId");
CREATE INDEX IF NOT EXISTS "analytics_postId_idx" ON "analytics"("postId");
CREATE INDEX IF NOT EXISTS "analytics_date_idx" ON "analytics"("date");

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS "notifications" (
  "id"        TEXT NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
  "title"     TEXT NOT NULL,
  "message"   TEXT NOT NULL,
  "type"      "NotificationType" NOT NULL DEFAULT 'INFO',
  "read"      BOOLEAN NOT NULL DEFAULT FALSE,
  "actionUrl" TEXT,
  "userId"    TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "notifications_userId_idx" ON "notifications"("userId");
CREATE INDEX IF NOT EXISTS "notifications_read_idx" ON "notifications"("read");

-- ACTIVITIES
CREATE TABLE IF NOT EXISTS "activities" (
  "id"          TEXT NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
  "type"        "ActivityType" NOT NULL,
  "description" TEXT NOT NULL,
  "metadata"    JSONB,
  "userId"      TEXT NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  CONSTRAINT "activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "activities_userId_idx" ON "activities"("userId");

-- DEMO USER (password: Demo1234!)
INSERT INTO "users" ("id", "name", "email", "password", "bio", "timezone", "createdAt", "updatedAt")
VALUES (
  'demo-user-001',
  'Demo User',
  'demo@contentengine.ai',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXig1oxlEfuq',
  'Social media manager and content creator.',
  'UTC',
  NOW(),
  NOW()
)
ON CONFLICT ("email") DO NOTHING;

-- DEMO NOTIFICATIONS
INSERT INTO "notifications" ("id", "title", "message", "type", "userId", "createdAt")
VALUES
  (gen_random_uuid()::text, '👋 Welcome to ContentEngine!', 'Your AI-powered social media platform is ready. Start by creating your first post.', 'INFO', 'demo-user-001', NOW()),
  (gen_random_uuid()::text, '✅ Platform Connected', 'Your account is set up and ready to use. Add your OpenAI key in .env.local to enable AI features.', 'SUCCESS', 'demo-user-001', NOW() - INTERVAL '1 hour')
ON CONFLICT DO NOTHING;

-- DEMO ACTIVITIES
INSERT INTO "activities" ("id", "type", "description", "userId", "createdAt")
VALUES
  (gen_random_uuid()::text, 'USER_LOGIN', 'Demo account created', 'demo-user-001', NOW())
ON CONFLICT DO NOTHING;
