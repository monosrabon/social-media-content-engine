import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind classes without conflicts.
 * Example: cn('px-2 py-1', 'px-4') → 'py-1 px-4'
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date to a human-readable string
 */
export function formatDate(date: Date | string | null): string {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a date with time
 */
export function formatDateTime(date: Date | string | null): string {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format a number as a compact string (e.g. 1234 → "1.2K")
 */
export function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

/**
 * Format bytes to human-readable file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(0)} KB`;
  return `${bytes} B`;
}

/**
 * Time ago string (e.g. "2 hours ago")
 */
export function timeAgo(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return formatDate(date);
}

/**
 * Truncate a string to a max length
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

/**
 * Get initials from a name (e.g. "Alex Demo" → "AD")
 */
export function getInitials(name: string | null | undefined): string {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Create a standard API error response
 */
export function apiError(message: string, status: number = 500) {
  return Response.json({ error: message }, { status });
}

/**
 * Create a standard API success response
 */
export function apiSuccess<T>(data: T, status: number = 200) {
  return Response.json({ data }, { status });
}

/**
 * Generate a content score color based on score value
 */
export function getScoreColor(score: number | null): string {
  if (!score) return 'text-muted-foreground';
  if (score >= 80) return 'text-green-500';
  if (score >= 60) return 'text-yellow-500';
  return 'text-red-500';
}

/**
 * Platform color map
 */
export const PLATFORM_COLORS: Record<string, string> = {
  TWITTER: '#1DA1F2',
  INSTAGRAM: '#E1306C',
  FACEBOOK: '#1877F2',
  LINKEDIN: '#0A66C2',
  TIKTOK: '#010101',
  YOUTUBE: '#FF0000',
};

/**
 * Status color map
 */
export const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  SCHEDULED: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  PUBLISHED: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  ARCHIVED: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  FAILED: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};
