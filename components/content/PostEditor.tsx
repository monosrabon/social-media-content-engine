'use client';

/**
 * PostEditor — Full post creation/editing form
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Post } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AIToolbar } from './AIToolbar';
import { StatusBadge } from './StatusBadge';
import { Save, Send, Clock, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';

const PLATFORMS = ['TWITTER', 'INSTAGRAM', 'FACEBOOK', 'LINKEDIN', 'TIKTOK', 'YOUTUBE'];

interface PostEditorProps {
  initialPost?: Partial<Post>;
  mode: 'create' | 'edit';
}

export function PostEditor({ initialPost, mode }: PostEditorProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState(initialPost?.title || '');
  const [content, setContent] = useState(initialPost?.content || '');
  const [caption, setCaption] = useState(initialPost?.caption || '');
  const [hashtags, setHashtags] = useState<string[]>(initialPost?.hashtags || []);
  const [platforms, setPlatforms] = useState<string[]>(initialPost?.platforms || ['INSTAGRAM']);
  const [status, setStatus] = useState(initialPost?.status || 'DRAFT');
  const [scheduledAt, setScheduledAt] = useState(
    initialPost?.scheduledAt
      ? new Date(initialPost.scheduledAt).toISOString().slice(0, 16)
      : ''
  );
  const [tags, setTags] = useState<string[]>(initialPost?.tags || []);
  const [notes, setNotes] = useState(initialPost?.notes || '');
  const [tagInput, setTagInput] = useState('');
  const [contentScore, setContentScore] = useState(initialPost?.contentScore || null);
  const [aiSummary, setAiSummary] = useState(initialPost?.aiSummary || '');

  const togglePlatform = (platform: string) => {
    setPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  const addTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (!tags.includes(newTag)) setTags((prev) => [...prev, newTag]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => setTags((prev) => prev.filter((t) => t !== tag));

  const handleSave = async (saveStatus?: string) => {
    if (!title.trim()) { toast.error('Title is required'); return; }
    if (!content.trim()) { toast.error('Content is required'); return; }
    if (platforms.length === 0) { toast.error('Select at least one platform'); return; }

    setSaving(true);
    try {
      const body = {
        title, content, caption, hashtags, platforms,
        status: saveStatus || status,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
        tags, notes,
        ...(contentScore !== null && { contentScore }),
        ...(aiSummary && { aiSummary }),
      };

      const url = mode === 'edit' && initialPost?.id ? `/api/posts/${initialPost.id}` : '/api/posts';
      const method = mode === 'edit' ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success(mode === 'edit' ? 'Post updated!' : 'Post created!');
      router.push('/content');
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || 'Failed to save post');
    } finally {
      setSaving(false);
    }
  };

  const primaryPlatform = platforms[0] || 'INSTAGRAM';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl">
      {/* ── Main Editor ── */}
      <div className="lg:col-span-2 space-y-5">
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Post Content</CardTitle>
              <StatusBadge status={status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your post a clear title..."
                maxLength={200}
              />
            </div>

            {/* Content */}
            <div className="space-y-1.5">
              <Label htmlFor="content">Content <span className="text-destructive">*</span></Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your post content here. This is the raw content you want to share..."
                className="min-h-[140px] post-editor-textarea"
              />
              <p className="text-xs text-muted-foreground text-right">{content.length} chars</p>
            </div>

            <Separator />

            {/* AI Toolbar */}
            <AIToolbar
              content={content}
              platform={primaryPlatform}
              onCaptionGenerated={(cap, tags, score, summary) => {
                setCaption(cap);
                setHashtags(tags);
                setContentScore(score as any);
                setAiSummary(summary);
              }}
              onHashtagsGenerated={setHashtags}
              onRewrite={setContent}
            />

            <Separator />

            {/* Caption */}
            <div className="space-y-1.5">
              <Label htmlFor="caption">Caption (AI or manual)</Label>
              <Textarea
                id="caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Social media caption — generated by AI or write your own..."
                className="min-h-[100px]"
              />
            </div>

            {/* Hashtags */}
            <div className="space-y-1.5">
              <Label>Hashtags</Label>
              <div className="flex flex-wrap gap-1.5 p-3 border border-input rounded-lg bg-background min-h-[44px]">
                {hashtags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-primary/10 text-primary"
                  >
                    {tag}
                    <button onClick={() => setHashtags(h => h.filter(t => t !== tag))} className="hover:text-destructive">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
                  className="flex-1 min-w-[120px] text-xs bg-transparent outline-none placeholder:text-muted-foreground"
                  placeholder="Type and press Enter..."
                  value={hashtags.length > 0 ? '' : ''}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const val = (e.target as HTMLInputElement).value.trim();
                      if (val) {
                        const tag = val.startsWith('#') ? val : `#${val}`;
                        if (!hashtags.includes(tag)) setHashtags(h => [...h, tag]);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">{hashtags.length} hashtags</p>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="notes">Internal Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Private notes (not published)..."
                className="min-h-[60px]"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Sidebar Settings ── */}
      <div className="space-y-5">
        {/* Publish Settings */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Publish Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status */}
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">📝 Draft</SelectItem>
                  <SelectItem value="SCHEDULED">⏰ Scheduled</SelectItem>
                  <SelectItem value="PUBLISHED">✅ Published</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Schedule date */}
            {status === 'SCHEDULED' && (
              <div className="space-y-1.5">
                <Label htmlFor="scheduledAt">Schedule Date & Time</Label>
                <Input
                  id="scheduledAt"
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="h-9"
                />
              </div>
            )}

            <Separator />

            {/* Action buttons */}
            <div className="space-y-2">
              <Button
                className="w-full"
                onClick={() => handleSave()}
                disabled={saving}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {mode === 'edit' ? 'Update Post' : 'Save Post'}
              </Button>
              {status !== 'PUBLISHED' && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleSave('PUBLISHED')}
                  disabled={saving}
                >
                  <Send className="w-4 h-4" />
                  Publish Now
                </Button>
              )}
              {status !== 'SCHEDULED' && (
                <Button
                  variant="ghost"
                  className="w-full text-xs"
                  onClick={() => handleSave('DRAFT')}
                  disabled={saving}
                >
                  Save as Draft
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Platforms */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Platforms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {PLATFORMS.map((platform) => {
                const selected = platforms.includes(platform);
                const COLORS: Record<string, string> = {
                  TWITTER: '#1DA1F2', INSTAGRAM: '#E1306C', FACEBOOK: '#1877F2',
                  LINKEDIN: '#0A66C2', TIKTOK: '#010101', YOUTUBE: '#FF0000',
                };
                return (
                  <button
                    key={platform}
                    onClick={() => togglePlatform(platform)}
                    className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border text-xs font-medium transition-all ${
                      selected
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: COLORS[platform] }}
                    />
                    {platform.charAt(0) + platform.slice(1).toLowerCase()}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-2">{platforms.length} selected</p>
          </CardContent>
        </Card>

        {/* Tags */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Tags</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Input
              placeholder="Add tag, press Enter..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={addTag}
              className="h-8 text-xs"
            />
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground"
                >
                  {tag}
                  <button onClick={() => removeTag(tag)} className="hover:text-destructive">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
