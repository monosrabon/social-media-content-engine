'use client';

/**
 * Analytics Page — Full implementation with:
 *  - KPI summary cards
 *  - Platform filter
 *  - Date range picker
 *  - Engagement area chart
 *  - Platform breakdown bar chart
 *  - Per-metric stat cards with trend indicators
 */

import { useState, useEffect, useCallback } from 'react';
import { EngagementChart } from '@/components/analytics/EngagementChart';
import { PlatformBreakdownChart } from '@/components/analytics/PlatformBreakdownChart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatNumber } from '@/lib/utils';
import {
  Loader2, TrendingUp, Users, Eye, Heart, MessageSquare, Share2,
  Bookmark, UserPlus, RefreshCw, ArrowUpRight, ArrowDownRight, Minus,
} from 'lucide-react';
import toast from 'react-hot-toast';

const PLATFORMS = ['ALL', 'TWITTER', 'INSTAGRAM', 'FACEBOOK', 'LINKEDIN', 'TIKTOK', 'YOUTUBE'];
const DATE_RANGES = [
  { label: '7 days', value: '7' },
  { label: '30 days', value: '30' },
  { label: '90 days', value: '90' },
];

interface Summary {
  totalImpressions: number;
  totalReach: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalSaves: number;
  avgEngagementRate: number;
  totalFollowerGrowth: number;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState('30');
  const [platform, setPlatform] = useState('ALL');

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ days });
      if (platform !== 'ALL') params.append('platform', platform);
      const res = await fetch(`/api/analytics?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData(json.data);
    } catch {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [days, platform]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  const summary: Summary = data?.summary ?? {
    totalImpressions: 0, totalReach: 0, totalLikes: 0,
    totalComments: 0, totalShares: 0, totalSaves: 0,
    avgEngagementRate: 0, totalFollowerGrowth: 0,
  };

  const kpis = [
    { label: 'Impressions', value: summary.totalImpressions, icon: Eye, color: 'text-blue-500', bg: 'bg-blue-500/10', fmt: formatNumber, trend: 'up' },
    { label: 'Reach', value: summary.totalReach, icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-500/10', fmt: formatNumber, trend: 'up' },
    { label: 'Engagement', value: summary.avgEngagementRate, icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-500/10', fmt: (v: number) => `${v}%`, trend: summary.avgEngagementRate > 3 ? 'up' : 'down' },
    { label: 'Likes', value: summary.totalLikes, icon: Heart, color: 'text-pink-500', bg: 'bg-pink-500/10', fmt: formatNumber, trend: 'up' },
    { label: 'Comments', value: summary.totalComments, icon: MessageSquare, color: 'text-yellow-500', bg: 'bg-yellow-500/10', fmt: formatNumber, trend: 'neutral' },
    { label: 'Shares', value: summary.totalShares, icon: Share2, color: 'text-purple-500', bg: 'bg-purple-500/10', fmt: formatNumber, trend: 'up' },
    { label: 'Saves', value: summary.totalSaves, icon: Bookmark, color: 'text-orange-500', bg: 'bg-orange-500/10', fmt: formatNumber, trend: 'neutral' },
    { label: 'Follower Growth', value: summary.totalFollowerGrowth, icon: UserPlus, color: 'text-teal-500', bg: 'bg-teal-500/10', fmt: (v: number) => `+${formatNumber(v)}`, trend: summary.totalFollowerGrowth > 0 ? 'up' : 'down' },
  ];

  return (
    <div className="max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-1">Track your content performance across all platforms.</p>
        </div>
        <div className="flex gap-2">
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_RANGES.map(r => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={platform} onValueChange={setPlatform}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PLATFORMS.map(p => (
                <SelectItem key={p} value={p}>{p === 'ALL' ? 'All Platforms' : p.charAt(0) + p.slice(1).toLowerCase()}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchAnalytics} disabled={loading} title="Refresh">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {kpis.map(kpi => {
              const Icon = kpi.icon;
              const TrendIcon = kpi.trend === 'up' ? ArrowUpRight : kpi.trend === 'down' ? ArrowDownRight : Minus;
              const trendColor = kpi.trend === 'up' ? 'text-green-500' : kpi.trend === 'down' ? 'text-red-500' : 'text-muted-foreground';
              return (
                <Card key={kpi.label} className="border-border/50 hover:border-primary/30 transition-colors">
                  <CardContent className="p-3 flex flex-col items-center text-center gap-1">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${kpi.bg} mb-1`}>
                      <Icon className={`w-4 h-4 ${kpi.color}`} />
                    </div>
                    <p className="text-lg font-bold leading-none">
                      {kpi.fmt(kpi.value as number)}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-medium leading-none">{kpi.label}</p>
                    <TrendIcon className={`w-3 h-3 ${trendColor}`} />
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <EngagementChart data={data?.chartData ?? []} />
            </div>
            <div>
              <PlatformBreakdownChart data={data?.chartData ?? []} />
            </div>
          </div>

          {/* Post Stats */}
          {data?.dashboardStats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Total Posts', value: data.dashboardStats.totalPosts },
                { label: 'Published', value: data.dashboardStats.publishedPosts },
                { label: 'Scheduled', value: data.dashboardStats.scheduledPosts },
                { label: 'Drafts', value: data.dashboardStats.draftPosts },
              ].map(s => (
                <Card key={s.label} className="border-border/50">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold">{s.value}</p>
                    <p className="text-xs text-muted-foreground font-medium mt-0.5">{s.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Empty state */}
          {(!data?.chartData || data.chartData.length === 0) && (
            <Card className="border-border/50">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <TrendingUp className="w-12 h-12 text-muted-foreground/40 mb-4" />
                <p className="font-medium">No analytics data yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Publish some posts and run the database seed to populate analytics.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
