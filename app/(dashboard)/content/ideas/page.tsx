'use client';

/**
 * Content Ideas Page
 * Displays AI-generated content ideas, allows generating new ones, and converting to posts.
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Lightbulb, Sparkles, Loader2, Trash2, Check,
  ArrowRight, RefreshCw, Filter, Plus,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Idea {
  id: string;
  title: string;
  description: string;
  platform: string | null;
  category: string | null;
  tags: string[];
  used: boolean;
  createdAt: string;
  estimatedEngagement?: string;
}

const PLATFORMS = ['INSTAGRAM', 'TWITTER', 'LINKEDIN', 'FACEBOOK', 'TIKTOK', 'YOUTUBE'];

const PLATFORM_COLORS: Record<string, string> = {
  INSTAGRAM: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  TWITTER: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  LINKEDIN: 'bg-blue-600/10 text-blue-400 border-blue-600/20',
  FACEBOOK: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  TIKTOK: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
  YOUTUBE: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const ENGAGEMENT_COLORS: Record<string, string> = {
  'Very High': 'text-green-400',
  High: 'text-emerald-400',
  Medium: 'text-yellow-400',
  Low: 'text-muted-foreground',
};

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [tab, setTab] = useState('all');

  // Generate form state
  const [niche, setNiche] = useState('');
  const [platform, setPlatform] = useState('INSTAGRAM');
  const [count, setCount] = useState('5');

  const fetchIdeas = useCallback(async () => {
    setLoading(true);
    try {
      const url = tab === 'used'
        ? '/api/content-ideas?used=true'
        : tab === 'unused'
        ? '/api/content-ideas?used=false'
        : '/api/content-ideas';
      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setIdeas(json.data);
    } catch {
      toast.error('Failed to load ideas');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { fetchIdeas(); }, [fetchIdeas]);

  const generateIdeas = async () => {
    if (!niche.trim()) { toast.error('Enter a niche/topic first'); return; }
    setGenerating(true);
    try {
      const res = await fetch('/api/ai/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche, platform, count: parseInt(count) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success(`${json.data.ideas?.length || 0} ideas generated!`);
      fetchIdeas();
    } catch (e: any) {
      toast.error(e.message || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const markUsed = async (id: string, used: boolean) => {
    try {
      await fetch('/api/content-ideas', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, used }),
      });
      setIdeas(prev => prev.map(i => i.id === id ? { ...i, used } : i));
      toast.success(used ? 'Marked as used' : 'Marked as unused');
    } catch {
      toast.error('Failed to update idea');
    }
  };

  const deleteIdea = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/content-ideas?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setIdeas(prev => prev.filter(i => i.id !== id));
      toast.success('Idea deleted');
    } catch {
      toast.error('Failed to delete idea');
    } finally {
      setDeletingId(null);
    }
  };

  const useIdeaAsPost = (idea: Idea) => {
    const params = new URLSearchParams({
      title: idea.title,
      content: idea.description,
      platform: idea.platform || 'INSTAGRAM',
    });
    markUsed(idea.id, true);
    window.location.href = `/content/new?${params.toString()}`;
  };

  const filteredIdeas = ideas;

  return (
    <div className="max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-yellow-400" />
            Content Ideas
          </h1>
          <p className="text-muted-foreground mt-1">
            AI-generated content ideas for your platforms. Click to use any idea as a post.
          </p>
        </div>
        <Button variant="outline" onClick={fetchIdeas} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Generator Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <p className="text-sm font-semibold">Generate New Ideas with AI</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Enter your niche or topic (e.g. fitness, cooking, tech)…"
              value={niche}
              onChange={e => setNiche(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && generateIdeas()}
              className="flex-1"
            />
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLATFORMS.map(p => (
                  <SelectItem key={p} value={p}>
                    {p.charAt(0) + p.slice(1).toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={count} onValueChange={setCount}>
              <SelectTrigger className="w-full sm:w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['3', '5', '7', '10'].map(n => (
                  <SelectItem key={n} value={n}>{n} ideas</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={generateIdeas} disabled={generating} className="w-full sm:w-auto">
              {generating
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating…</>
                : <><Sparkles className="w-4 h-4 mr-2" /> Generate</>
              }
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="all">All Ideas</TabsTrigger>
            <TabsTrigger value="unused">Unused</TabsTrigger>
            <TabsTrigger value="used">Used</TabsTrigger>
          </TabsList>
        </Tabs>
        <span className="text-sm text-muted-foreground">{filteredIdeas.length} ideas</span>
      </div>

      {/* Ideas Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredIdeas.length === 0 ? (
        <div className="text-center py-20 border border-dashed rounded-xl border-border">
          <Lightbulb className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-medium">No ideas yet</h3>
          <p className="text-muted-foreground mt-1 mb-4">
            Enter your niche above and click Generate to get AI-powered content ideas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredIdeas.map(idea => (
            <Card
              key={idea.id}
              className={`border-border/50 transition-all hover:border-primary/40 hover:shadow-lg group ${
                idea.used ? 'opacity-60' : ''
              }`}
            >
              <CardContent className="p-4 space-y-3">
                {/* Badges row */}
                <div className="flex items-center gap-2 flex-wrap">
                  {idea.platform && (
                    <Badge
                      variant="outline"
                      className={`text-[10px] h-5 ${PLATFORM_COLORS[idea.platform] || ''}`}
                    >
                      {idea.platform.charAt(0) + idea.platform.slice(1).toLowerCase()}
                    </Badge>
                  )}
                  {idea.category && (
                    <Badge variant="secondary" className="text-[10px] h-5">
                      {idea.category}
                    </Badge>
                  )}
                  {idea.used && (
                    <Badge variant="outline" className="text-[10px] h-5 text-green-500 border-green-500/30">
                      <Check className="w-2.5 h-2.5 mr-1" /> Used
                    </Badge>
                  )}
                </div>

                {/* Title */}
                <h3 className="font-semibold text-sm leading-snug">{idea.title}</h3>

                {/* Description */}
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                  {idea.description}
                </p>

                {/* Tags */}
                {idea.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {idea.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1 border-t border-border/40">
                  <Button
                    size="sm"
                    className="flex-1 h-7 text-xs"
                    onClick={() => useIdeaAsPost(idea)}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Create Post
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7"
                    onClick={() => markUsed(idea.id, !idea.used)}
                    title={idea.used ? 'Mark as unused' : 'Mark as used'}
                  >
                    <Check className={`w-3.5 h-3.5 ${idea.used ? 'text-green-500' : 'text-muted-foreground'}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7 text-destructive hover:text-destructive"
                    onClick={() => deleteIdea(idea.id)}
                    disabled={deletingId === idea.id}
                  >
                    {deletingId === idea.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Trash2 className="w-3.5 h-3.5" />
                    }
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
