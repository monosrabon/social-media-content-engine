'use client';

/**
 * Edit Post Page
 */

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Post } from '@prisma/client';
import { PostEditor } from '@/components/content/PostEditor';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { use } from 'react';

export default function EditPostPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchPost = async () => {
      try {
        const res = await fetch(`/api/posts/${id}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        setPost(json.data);
      } catch (e: any) {
        toast.error('Failed to load post');
        router.push('/content');
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!post) {
    return <div>Post not found</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Post</h1>
        <p className="text-muted-foreground mt-1">Make changes to your post and publish.</p>
      </div>
      <PostEditor initialPost={post} mode="edit" />
    </div>
  );
}
