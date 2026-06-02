'use client';

/**
 * Content Calendar Component
 */

import { useState, useMemo } from 'react';
import { Post } from '@prisma/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { STATUS_COLORS } from '@/lib/utils';
import Link from 'next/link';

interface ContentCalendarProps {
  posts: Post[];
}

export function ContentCalendar({ posts }: ContentCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  const calendarDays = useMemo(() => {
    const days = [];
    // Add empty slots for the beginning of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    // Add days with their posts
    for (let i = 1; i <= daysInMonth; i++) {
      const dayDate = new Date(year, month, i);
      const dayDateString = dayDate.toISOString().split('T')[0];
      
      const dayPosts = posts.filter(post => {
        const targetDate = post.scheduledAt || post.publishedAt || post.createdAt;
        return targetDate && new Date(targetDate).toISOString().split('T')[0] === dayDateString;
      });
      
      days.push({ day: i, posts: dayPosts });
    }
    return days;
  }, [year, month, daysInMonth, firstDay, posts]);

  const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Card className="border-border/50">
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">{monthName} {year}</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={prevMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Grid Header */}
        <div className="grid grid-cols-7 border-b border-border">
          {WEEKDAYS.map(day => (
            <div key={day} className="py-2 text-center text-xs font-semibold text-muted-foreground border-r border-border last:border-r-0">
              {day}
            </div>
          ))}
        </div>
        
        {/* Grid Body */}
        <div className="grid grid-cols-7 bg-muted/20">
          {calendarDays.map((dayData, idx) => {
            if (!dayData) {
              return <div key={`empty-${idx}`} className="min-h-[120px] p-2 border-r border-b border-border bg-background/50" />;
            }
            
            const isToday = new Date().toDateString() === new Date(year, month, dayData.day).toDateString();
            
            return (
              <div key={dayData.day} className={`min-h-[120px] p-2 border-r border-b border-border bg-background transition-colors hover:bg-muted/30 ${isToday ? 'bg-primary/5' : ''}`}>
                <div className={`text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
                  {dayData.day}
                </div>
                <div className="space-y-1">
                  {dayData.posts.map(post => (
                    <Link key={post.id} href={`/content/${post.id}/edit`}>
                      <div className={`text-[10px] p-1.5 rounded truncate font-medium cursor-pointer transition-opacity hover:opacity-80 ${STATUS_COLORS[post.status] || STATUS_COLORS.DRAFT}`}>
                        {post.title}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
