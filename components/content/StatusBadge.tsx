'use client';

/**
 * StatusBadge — shows post status with colored dot indicator
 */

import { STATUS_COLORS } from '@/lib/utils';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  SCHEDULED: 'Scheduled',
  PUBLISHED: 'Published',
  ARCHIVED: 'Archived',
  FAILED: 'Failed',
};

const STATUS_DOTS: Record<string, string> = {
  DRAFT: 'bg-gray-400',
  SCHEDULED: 'bg-blue-400',
  PUBLISHED: 'bg-green-400 status-live',
  ARCHIVED: 'bg-orange-400',
  FAILED: 'bg-red-400',
};

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[status] || STATUS_COLORS.DRAFT}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOTS[status] || STATUS_DOTS.DRAFT}`} />
      {STATUS_LABELS[status] || status}
    </span>
  );
}
