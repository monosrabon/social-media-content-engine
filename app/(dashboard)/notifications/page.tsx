'use client';

/**
 * Notifications Page
 */

import { useState, useEffect } from 'react';
import { Notification } from '@prisma/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, CheckCircle, Info, AlertTriangle, AlertCircle, Clock, Loader2 } from 'lucide-react';
import { timeAgo } from '@/lib/utils';
import toast from 'react-hot-toast';

const NOTIFICATION_ICONS: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  INFO: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  SUCCESS: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' },
  WARNING: { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  ERROR: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
  REMINDER: { icon: Clock, color: 'text-purple-500', bg: 'bg-purple-500/10' },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setNotifications(json.data.notifications);
    } catch (e: any) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAllRead = async () => {
    setMarking(true);
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      });
      if (!res.ok) throw new Error();
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to update notifications');
    } finally {
      setMarking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground mt-1">Stay updated on your account activity.</p>
        </div>
        <Button variant="outline" onClick={markAllRead} disabled={marking || notifications.every(n => n.read)}>
          Mark all as read
        </Button>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-0">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <Bell className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="font-medium">You're all caught up!</p>
              <p className="text-sm text-muted-foreground mt-1">No new notifications.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map(notification => {
                const config = NOTIFICATION_ICONS[notification.type] || NOTIFICATION_ICONS.INFO;
                const Icon = config.icon;
                return (
                  <div key={notification.id} className={`p-4 flex gap-4 transition-colors hover:bg-muted/30 ${!notification.read ? 'bg-primary/5' : ''}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${config.bg}`}>
                      <Icon className={`w-5 h-5 ${config.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className={`text-sm font-semibold ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {notification.title}
                        </h4>
                        <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                          {timeAgo(notification.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
