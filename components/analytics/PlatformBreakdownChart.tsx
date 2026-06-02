'use client';

/**
 * Platform Breakdown Chart — Bar chart comparing metrics per platform
 */

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PLATFORM_COLORS } from '@/lib/utils';

interface ChartDataPoint {
  date: string;
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
}

interface PlatformBreakdownChartProps {
  data: ChartDataPoint[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-xl p-3 shadow-xl text-xs">
        <p className="font-semibold mb-2">{label}</p>
        {payload.map((entry: any) => (
          <div key={entry.name} className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full" style={{ background: entry.fill }} />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium">{entry.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function PlatformBreakdownChart({ data }: PlatformBreakdownChartProps) {
  // Aggregate total impressions per "day bucket" to show trend
  // For platform breakdown we show the last N days as summary bars
  const totals = data.reduce(
    (acc, d) => ({
      Impressions: acc.Impressions + d.impressions,
      Reach: acc.Reach + d.reach,
      Likes: acc.Likes + d.likes,
      Comments: acc.Comments + d.comments,
      Shares: acc.Shares + d.shares,
    }),
    { Impressions: 0, Reach: 0, Likes: 0, Comments: 0, Shares: 0 }
  );

  const chartData = Object.entries(totals).map(([name, value]) => ({ name, value }));

  const COLORS = [
    'hsl(258,90%,57%)',
    'hsl(199,89%,48%)',
    'hsl(330,81%,60%)',
    'hsl(43,96%,56%)',
    'hsl(142,71%,45%)',
  ];

  return (
    <Card className="border-border/50 h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Metric Totals</CardTitle>
        <CardDescription>Aggregate for selected period</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.every(d => d.value === 0) ? (
          <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
            No data for this period.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                width={40}
                tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
