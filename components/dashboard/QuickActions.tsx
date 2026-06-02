'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sparkles, Plus, Lightbulb } from 'lucide-react';

export function QuickActions() {
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" asChild>
        <Link href="/content?tab=ideas">
          <Lightbulb className="w-4 h-4" />
          Ideas
        </Link>
      </Button>
      <Button variant="outline" size="sm" asChild>
        <Link href="/content/new?ai=true">
          <Sparkles className="w-4 h-4" />
          AI Post
        </Link>
      </Button>
      <Button size="sm" asChild>
        <Link href="/content/new">
          <Plus className="w-4 h-4" />
          New Post
        </Link>
      </Button>
    </div>
  );
}
