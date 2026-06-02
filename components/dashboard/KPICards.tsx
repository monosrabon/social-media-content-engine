'use client';

/**
 * KPI Cards Component
 * Shows 8 key metrics on the dashboard with trend indicators.
 */

import {
  FileText,
  CheckCircle,
  Clock,
  PenLine,
  Eye,
  TrendingUp,
  Users,
  Lightbulb,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatNumber } from '@/lib/utils';

interface Stats {
  totalPosts: number;
  publishedPosts: number;
  scheduledPosts: number;
  draftPosts: number;
  contentIdeas: number;
  totalImpressions: number;
  avgEngagementRate: number;
  followerGrowth: number;
}

interface KPICardsProps {
  stats: Stats;
}

const kpiConfig = (stats: Stats) => [
  {
    label: 'Total Posts',
    value: stats.totalPosts.toString(),
    icon: FileText,
    color: 'text-violet-500',
    bg: 'bg-violet-500/10',
    change: '+12%',
    changePositive: true,
  },
  {
    label: 'Published',
    value: stats.publishedPosts.toString(),
    icon: CheckCircle,
    color: 'text-green-500',
    bg: 'bg-green-500/10',
    change: '+8%',
    changePositive: true,
  },
  {
    label: 'Scheduled',
    value: stats.scheduledPosts.toString(),
    icon: Clock,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    change: '+3',
    changePositive: true,
  },
  {
    label: 'Drafts',
    value: stats.draftPosts.toString(),
    icon: PenLine,
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
    change: '-2',
    changePositive: false,
  },
  {
    label: 'Impressions (30d)',
    value: formatNumber(stats.totalImpressions),
    icon: Eye,
    color: 'text-pink-500',
    bg: 'bg-pink-500/10',
    change: '+23%',
    changePositive: true,
  },
  {
    label: 'Engagement Rate',
    value: `${stats.avgEngagementRate}%`,
    icon: TrendingUp,
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10',
    change: '+1.2%',
    changePositive: true,
  },
  {
    label: 'Follower Growth',
    value: `+${formatNumber(stats.followerGrowth)}`,
    icon: Users,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    change: '+18%',
    changePositive: true,
  },
  {
    label: 'Content Ideas',
    value: stats.contentIdeas.toString(),
    icon: Lightbulb,
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
    change: '+5 new',
    changePositive: true,
  },
];

export function KPICards({ stats }: KPICardsProps) {
  const cards = kpiConfig(stats);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card
            key={card.label}
            className="card-hover kpi-card-glow border-border/50 overflow-hidden"
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    {card.label}
                  </p>
                  <p className="text-2xl font-bold tracking-tight">{card.value}</p>
                  <p
                    className={`text-xs font-medium mt-1 ${
                      card.changePositive ? 'text-green-500' : 'text-red-500'
                    }`}
                  >
                    {card.change} vs last month
                  </p>
                </div>
                <div className={`p-2.5 rounded-xl ${card.bg} flex-shrink-0`}>
                  <Icon className={`w-4.5 h-4.5 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
