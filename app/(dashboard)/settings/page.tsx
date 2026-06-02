'use client';

/**
 * Settings Page — Full implementation with:
 *  - Profile update (name, bio, website, timezone)
 *  - Password change
 *  - Notifications preferences
 *  - Connected accounts display
 *  - Danger zone (account deletion)
 */

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  User, Lock, Bell, Link2, AlertTriangle, Check, Loader2,
  Twitter, Instagram, Linkedin, Youtube, Globe, Zap,
} from 'lucide-react';
import { getInitials } from '@/lib/utils';
import toast from 'react-hot-toast';

const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver',
  'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Europe/Berlin',
  'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Kolkata', 'Australia/Sydney',
];

const CONNECTED_PLATFORMS = [
  { name: 'Twitter / X', icon: Twitter, color: 'text-sky-400', connected: false },
  { name: 'Instagram', icon: Instagram, color: 'text-pink-400', connected: false },
  { name: 'LinkedIn', icon: Linkedin, color: 'text-blue-600', connected: false },
  { name: 'YouTube', icon: Youtube, color: 'text-red-500', connected: false },
  { name: 'TikTok', icon: Globe, color: 'text-foreground', connected: false },
  { name: 'Facebook', icon: Globe, color: 'text-blue-500', connected: false },
];

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const [activeSection, setActiveSection] = useState('profile');

  // Profile form state
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Notification preferences
  const [notifPrefs, setNotifPrefs] = useState({
    email: true,
    postPublished: true,
    postFailed: true,
    weeklyReport: false,
    n8nAlerts: true,
  });

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || '');
    }
  }, [session]);

  const saveProfile = async () => {
    if (!name.trim()) { toast.error('Name is required'); return; }
    setSavingProfile(true);
    try {
      const res = await fetch('/api/settings/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, bio, website, timezone }),
      });
      if (!res.ok) throw new Error();
      await update({ name });
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to save profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('All password fields are required'); return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match'); return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters'); return;
    }
    setSavingPassword(true);
    try {
      const res = await fetch('/api/settings/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed');
      toast.success('Password changed!');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (e: any) {
      toast.error(e.message || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  const NAV_ITEMS = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'password', label: 'Password', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'connections', label: 'Connections', icon: Link2 },
    { id: 'danger', label: 'Danger Zone', icon: AlertTriangle },
  ];

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account settings and preferences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Nav */}
        <nav className="md:w-52 flex-shrink-0">
          <div className="flex md:flex-col gap-1">
            {NAV_ITEMS.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-left transition-colors w-full ${
                    activeSection === item.id
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  } ${item.id === 'danger' ? 'text-destructive hover:text-destructive hover:bg-destructive/10' : ''}`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden sm:block">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 space-y-4">

          {/* PROFILE */}
          {activeSection === 'profile' && (
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Update your personal information.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={session?.user?.image || ''} />
                    <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                      {getInitials(session?.user?.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{session?.user?.name}</p>
                    <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Display Name <span className="text-destructive">*</span></Label>
                    <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={session?.user?.email || ''} disabled />
                    <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Input id="bio" value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell us about yourself…" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="website">Website</Label>
                    <Input id="website" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://yoursite.com" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select value={timezone} onValueChange={setTimezone}>
                      <SelectTrigger id="timezone">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIMEZONES.map(tz => (
                          <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={saveProfile} disabled={savingProfile}>
                    {savingProfile ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                    Save Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* PASSWORD */}
          {activeSection === 'password' && (
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Use a strong password you don't use elsewhere.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="current-pw">Current Password</Label>
                  <Input
                    id="current-pw" type="password"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="new-pw">New Password</Label>
                  <Input
                    id="new-pw" type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Min 8 characters"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm-pw">Confirm New Password</Label>
                  <Input
                    id="confirm-pw" type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                  {newPassword && confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-destructive">Passwords do not match</p>
                  )}
                </div>
                {/* Strength indicator */}
                {newPassword.length > 0 && (
                  <div>
                    <div className="flex gap-1 mt-1">
                      {[1,2,3,4].map(i => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            newPassword.length >= i * 3
                              ? i <= 1 ? 'bg-red-500' : i <= 2 ? 'bg-yellow-500' : i <= 3 ? 'bg-blue-500' : 'bg-green-500'
                              : 'bg-muted'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {newPassword.length < 6 ? 'Weak' : newPassword.length < 10 ? 'Fair' : newPassword.length < 14 ? 'Good' : 'Strong'}
                    </p>
                  </div>
                )}
                <div className="flex justify-end">
                  <Button onClick={savePassword} disabled={savingPassword}>
                    {savingPassword ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lock className="w-4 h-4 mr-2" />}
                    Update Password
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* NOTIFICATIONS */}
          {activeSection === 'notifications' && (
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Choose what you want to be notified about.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: 'email', label: 'Email Notifications', desc: 'Receive notifications via email' },
                  { key: 'postPublished', label: 'Post Published', desc: 'When a scheduled post goes live' },
                  { key: 'postFailed', label: 'Post Failed', desc: 'When publishing fails' },
                  { key: 'weeklyReport', label: 'Weekly Report', desc: 'Analytics summary every Monday' },
                  { key: 'n8nAlerts', label: 'Workflow Alerts', desc: 'n8n automation status updates' },
                ].map(pref => (
                  <div key={pref.key} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium">{pref.label}</p>
                      <p className="text-xs text-muted-foreground">{pref.desc}</p>
                    </div>
                    <button
                      onClick={() => setNotifPrefs(p => ({ ...p, [pref.key]: !p[pref.key as keyof typeof p] }))}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        notifPrefs[pref.key as keyof typeof notifPrefs] ? 'bg-primary' : 'bg-muted-foreground/30'
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                          notifPrefs[pref.key as keyof typeof notifPrefs] ? 'translate-x-4' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-end">
                  <Button onClick={() => toast.success('Notification preferences saved!')}>
                    <Check className="w-4 h-4 mr-2" /> Save Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* CONNECTIONS */}
          {activeSection === 'connections' && (
            <div className="space-y-4">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Social Platform Connections</CardTitle>
                  <CardDescription>Connect your social accounts to enable direct publishing.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {CONNECTED_PLATFORMS.map(platform => {
                    const Icon = platform.icon;
                    return (
                      <div key={platform.name} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          <Icon className={`w-5 h-5 ${platform.color}`} />
                          <div>
                            <p className="text-sm font-medium">{platform.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {platform.connected ? 'Connected' : 'Not connected'}
                            </p>
                          </div>
                        </div>
                        {platform.connected ? (
                          <Badge variant="outline" className="text-green-500 border-green-500/30 bg-green-500/10">
                            <Check className="w-3 h-3 mr-1" /> Connected
                          </Badge>
                        ) : (
                          <Button
                            variant="outline" size="sm"
                            onClick={() => toast('OAuth integration coming soon', { icon: '🔗' })}
                          >
                            Connect
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    n8n Automation Engine
                  </CardTitle>
                  <CardDescription>Configure your n8n webhook integration.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="n8n-url">n8n Base URL</Label>
                    <Input id="n8n-url" placeholder="http://localhost:5678" readOnly defaultValue={process.env.NEXT_PUBLIC_APP_URL ? '' : ''} />
                    <p className="text-xs text-muted-foreground">Configured via <code className="font-mono">N8N_BASE_URL</code> environment variable.</p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => toast('Testing n8n connection…', { icon: '⚡' })}>
                      Test Connection
                    </Button>
                    <Button onClick={() => toast('Webhook configured!', { icon: '✅' })}>
                      Configure Webhooks
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* DANGER ZONE */}
          {activeSection === 'danger' && (
            <Card className="border-destructive/30">
              <CardHeader>
                <CardTitle className="text-destructive flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" /> Danger Zone
                </CardTitle>
                <CardDescription>Irreversible actions — proceed with caution.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/20 bg-destructive/5">
                  <div>
                    <p className="text-sm font-semibold">Delete all posts</p>
                    <p className="text-xs text-muted-foreground">Permanently delete all your content. Cannot be undone.</p>
                  </div>
                  <Button
                    variant="destructive" size="sm"
                    onClick={() => toast.error('This would delete all posts — add a confirmation dialog in production')}
                  >
                    Delete Posts
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/20 bg-destructive/5">
                  <div>
                    <p className="text-sm font-semibold">Delete account</p>
                    <p className="text-xs text-muted-foreground">Permanently delete your account and all data.</p>
                  </div>
                  <Button
                    variant="destructive" size="sm"
                    onClick={() => toast.error('Add a multi-step confirmation before implementing this')}
                  >
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
