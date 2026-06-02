'use client';

/**
 * Recent Activity Feed Component
 */

import { Activity } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { timeAgo } from '@/lib/utils';
import {
  FileText,
  CheckCircle,
  Clock,
  Trash2,
  Edit3,
  Sparkles,
  Image,
  BarChart3,
  LogIn,
  Zap,
} from 'lucide-react';

const ACTIVITY_ICONS: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  POST_CREATED:      { icon: FileText,   color: 'text-violet-500', bg: 'bg-violet-500/10' },
  POST_PUBLISHED:    { icon: CheckCircle, color: 'text-green-500',  bg: 'bg-green-500/10' },
  POST_SCHEDULED:    { icon: Clock,       color: 'text-blue-500',   bg: 'bg-blue-500/10' },
  POST_DELETED:      { icon: Trash2,      color: 'text-red-500',    bg: 'bg-red-500/10' },
  POST_EDITED:       { icon: Edit3,       color: 'text-orange-500', bg: 'bg-orange-500/10' },
  AI_GENERATED:      { icon: Sparkles,    color: 'text-pink-500',   bg: 'bg-pink-500/10' },
  MEDIA_UPLOADED:    { icon: Image,       color: 'text-cyan-500',   bg: 'bg-cyan-500/10' },
  ANALYTICS_REPORT:  { icon: BarChart3,   color: 'text-emerald-500',bg: 'bg-emerald-500/10' },
  USER_LOGIN:        { icon: LogIn,       color: 'text-gray-500',   bg: 'bg-gray-500/10' },
  WORKFLOW_TRIGGERED:{ icon: Zap,         color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
};

interface RecentActivityProps {
  activities: Activity[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No activity yet
          </p>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => {
              const config = ACTIVITY_ICONS[activity.type] || ACTIVITY_ICONS.POST_CREATED;
              const Icon = config.icon;
              return (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className={`p-1.5 rounded-lg ${config.bg} flex-shrink-0 mt-0.5`}>
                    <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground leading-snug">
                      {activity.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {timeAgo(activity.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
