'use client';

/**
 * Engagement Chart — Recharts area chart for impressions, reach, engagement
 */

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatNumber } from '@/lib/utils';

interface ChartDataPoint {
  date: string;
  impressions: number;
  reach: number;
  engagement: number;
  likes: number;
}

interface EngagementChartProps {
  data: ChartDataPoint[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-xl p-3 shadow-xl text-xs">
        <p className="font-semibold text-foreground mb-2">{label}</p>
        {payload.map((entry: any) => (
          <div key={entry.name} className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
            <span className="text-muted-foreground capitalize">{entry.name}:</span>
            <span className="font-medium">{typeof entry.value === 'number' && entry.name !== 'engagement' ? formatNumber(entry.value) : `${entry.value}${entry.name === 'engagement' ? '%' : ''}`}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function EngagementChart({ data }: EngagementChartProps) {
  const chartData = data.map(d => ({
    ...d,
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Engagement Overview</CardTitle>
        <CardDescription>Impressions, reach & engagement over the last 30 days</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
            No analytics data yet. Publish some posts to see metrics.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="impressionsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(258,90%,57%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(258,90%,57%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="reachGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(199,89%,48%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(199,89%,48%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="likesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(330,81%,60%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(330,81%,60%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tickFormatter={formatNumber}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                width={45}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                iconType="circle"
                iconSize={8}
              />
              <Area
                type="monotone"
                dataKey="impressions"
                stroke="hsl(258,90%,57%)"
                strokeWidth={2}
                fill="url(#impressionsGrad)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
              <Area
                type="monotone"
                dataKey="reach"
                stroke="hsl(199,89%,48%)"
                strokeWidth={2}
                fill="url(#reachGrad)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
              <Area
                type="monotone"
                dataKey="likes"
                stroke="hsl(330,81%,60%)"
                strokeWidth={2}
                fill="url(#likesGrad)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
