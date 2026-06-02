'use client';

/**
 * Content List Page
 */

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Post } from '@prisma/client';
import { PostCard } from '@/components/content/PostCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

function ContentList() {
  const searchParams = useSearchParams();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchPosts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      let url = '/api/posts?limit=50';
      if (activeTab !== 'all') {
        url += `&status=${activeTab.toUpperCase()}`;
      }
      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setPosts(json.data);
    } catch (e: any) {
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(search.toLowerCase()) ||
    post.content.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (id: string) => {
    setPosts(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="max-w-7xl space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Content Manager</h1>
          <p className="text-muted-foreground mt-1">Manage all your social media posts in one place.</p>
        </div>
        <Button asChild>
          <Link href="/content/new">
            <Plus className="w-4 h-4 mr-2" />
            Create Post
          </Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
          <TabsList>
            <TabsTrigger value="all">All Posts</TabsTrigger>
            <TabsTrigger value="draft">Drafts</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
            <TabsTrigger value="published">Published</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search posts..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="text-center py-20 border border-dashed rounded-xl border-border">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
            <Search className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No posts found</h3>
          <p className="text-muted-foreground mt-1 mb-4">Try adjusting your filters or create a new post.</p>
          <Button asChild variant="outline">
            <Link href="/content/new">Create New Post</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPosts.map(post => (
            <PostCard key={post.id} post={post} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ContentPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <ContentList />
    </Suspense>
  );
}
