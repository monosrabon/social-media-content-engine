'use client';

/**
 * AI Toolbar — AI features panel inside the post editor
 * Handles: caption gen, hashtag gen, rewrite, ideas, content score
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Hash, RefreshCw, Lightbulb, Loader2, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface AIToolbarProps {
  content: string;
  platform: string;
  onCaptionGenerated: (caption: string, hashtags: string[], score: number, summary: string) => void;
  onHashtagsGenerated: (hashtags: string[]) => void;
  onRewrite: (rewritten: string) => void;
}

type Tone = 'professional' | 'casual' | 'funny' | 'inspirational' | 'educational';

export function AIToolbar({
  content,
  platform,
  onCaptionGenerated,
  onHashtagsGenerated,
  onRewrite,
}: AIToolbarProps) {
  const [tone, setTone] = useState<Tone>('casual');
  const [loadingCaption, setLoadingCaption] = useState(false);
  const [loadingHashtags, setLoadingHashtags] = useState(false);
  const [loadingRewrite, setLoadingRewrite] = useState(false);
  const [loadingIdeas, setLoadingIdeas] = useState(false);
  const [contentScore, setContentScore] = useState<number | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [generatedHashtags, setGeneratedHashtags] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const validateContent = () => {
    if (!content || content.trim().length < 10) {
      toast.error('Please write at least 10 characters first');
      return false;
    }
    return true;
  };

  const generateCaption = async () => {
    if (!validateContent()) return;
    setLoadingCaption(true);
    try {
      const res = await fetch('/api/ai/caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, platform, tone }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      const { caption, hashtags, contentScore: score, summary } = json.data;
      onCaptionGenerated(caption, hashtags, score, summary);
      setContentScore(score);
      setAiSummary(summary);
      setGeneratedHashtags(hashtags);
      toast.success('Caption generated!');
    } catch (e: any) {
      toast.error(e.message || 'Caption generation failed');
    } finally {
      setLoadingCaption(false);
    }
  };

  const generateHashtags = async () => {
    if (!validateContent()) return;
    setLoadingHashtags(true);
    try {
      const res = await fetch('/api/ai/hashtags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, platform, count: 15 }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setGeneratedHashtags(json.data.hashtags);
      onHashtagsGenerated(json.data.hashtags);
      toast.success('Hashtags generated!');
    } catch (e: any) {
      toast.error(e.message || 'Hashtag generation failed');
    } finally {
      setLoadingHashtags(false);
    }
  };

  const rewriteContent = async () => {
    if (!validateContent()) return;
    setLoadingRewrite(true);
    try {
      const res = await fetch('/api/ai/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, tone, platform }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      onRewrite(json.data.rewritten);
      toast.success('Content rewritten!');
    } catch (e: any) {
      toast.error(e.message || 'Rewrite failed');
    } finally {
      setLoadingRewrite(false);
    }
  };

  const copyHashtags = () => {
    navigator.clipboard.writeText(generatedHashtags.join(' '));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Hashtags copied!');
  };

  return (
    <div className="space-y-4">
      {/* Tone selector */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">AI Tools</span>
        </div>
        <Select value={tone} onValueChange={(v) => setTone(v as Tone)}>
          <SelectTrigger className="h-8 w-40 text-xs">
            <SelectValue placeholder="Tone" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="casual">😊 Casual</SelectItem>
            <SelectItem value="professional">💼 Professional</SelectItem>
            <SelectItem value="funny">😂 Funny</SelectItem>
            <SelectItem value="inspirational">✨ Inspirational</SelectItem>
            <SelectItem value="educational">📚 Educational</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={generateCaption}
          disabled={loadingCaption}
          className="text-xs h-8"
        >
          {loadingCaption ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          Generate Caption
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={generateHashtags}
          disabled={loadingHashtags}
          className="text-xs h-8"
        >
          {loadingHashtags ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Hash className="w-3.5 h-3.5" />}
          Get Hashtags
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={rewriteContent}
          disabled={loadingRewrite}
          className="text-xs h-8"
        >
          {loadingRewrite ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Rewrite
        </Button>
      </div>

      {/* Content Score */}
      {contentScore !== null && (
        <Card className="border-border/50 bg-muted/30">
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Content Score</span>
              <span className={`text-sm font-bold ${
                contentScore >= 80 ? 'text-green-500' :
                contentScore >= 60 ? 'text-yellow-500' : 'text-red-500'
              }`}>
                {contentScore}/100
              </span>
            </div>
            <Progress value={contentScore} className="h-1.5" />
            {aiSummary && (
              <p className="text-xs text-muted-foreground">{aiSummary}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Generated Hashtags */}
      {generatedHashtags.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Generated Hashtags</span>
            <Button variant="ghost" size="sm" onClick={copyHashtags} className="h-6 text-xs gap-1">
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied!' : 'Copy all'}
            </Button>
          </div>
          <div className="flex flex-wrap gap-1">
            {generatedHashtags.map((tag) => (
              <span
                key={tag}
                className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium cursor-pointer hover:bg-primary/20 transition-colors"
                onClick={() => {
                  navigator.clipboard.writeText(tag);
                  toast.success(`${tag} copied`);
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
