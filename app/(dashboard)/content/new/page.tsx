'use client';

/**
 * Create New Post Page
 */

import { PostEditor } from '@/components/content/PostEditor';

export default function NewPostPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create New Post</h1>
        <p className="text-muted-foreground mt-1">Draft, generate AI captions, and schedule your content.</p>
      </div>
      <PostEditor mode="create" />
    </div>
  );
}
