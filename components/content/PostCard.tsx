'use client';

/**
 * PostCard — compact card for post listings
 */

import Link from 'next/link';
import { Post } from '@prisma/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate, truncate, STATUS_COLORS, PLATFORM_COLORS } from '@/lib/utils';
import { Edit3, Trash2, MoreHorizontal, ExternalLink } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface PostCardProps {
  post: Post;
  onDelete?: (id: string) => void;
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  SCHEDULED: 'Scheduled',
  PUBLISHED: 'Published',
  ARCHIVED: 'Archived',
  FAILED: 'Failed',
};

export function PostCard({ post, onDelete }: PostCardProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Delete this post? This cannot be undone.')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      toast.success('Post deleted');
      onDelete?.(post.id);
      router.refresh();
    } catch {
      toast.error('Failed to delete post');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card className="card-hover border-border/50 group">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{post.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {post.status === 'SCHEDULED' && post.scheduledAt
                ? `Scheduled: ${formatDate(post.scheduledAt)}`
                : post.status === 'PUBLISHED' && post.publishedAt
                ? `Published: ${formatDate(post.publishedAt)}`
                : `Created: ${formatDate(post.createdAt)}`}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[post.status]}`}>
              {STATUS_LABELS[post.status]}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/content/${post.id}/edit`}>
                    <Edit3 className="w-4 h-4 mr-2" /> Edit
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
          {truncate(post.content, 120)}
        </p>

        <div className="flex items-center justify-between">
          {/* Platforms */}
          <div className="flex gap-1 flex-wrap">
            {post.platforms.slice(0, 4).map((platform) => (
              <span
                key={platform}
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded text-white"
                style={{ backgroundColor: PLATFORM_COLORS[platform] || '#666' }}
              >
                {platform.charAt(0) + platform.slice(1).toLowerCase()}
              </span>
            ))}
          </div>

          {/* Content Score */}
          {post.contentScore !== null && (
            <span className={`text-xs font-bold ${
              post.contentScore >= 80 ? 'text-green-500' :
              post.contentScore >= 60 ? 'text-yellow-500' : 'text-red-500'
            }`}>
              ★ {post.contentScore}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
