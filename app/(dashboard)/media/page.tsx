'use client';

/**
 * Media Library Page — Full implementation with upload, filter, delete, and copy URL.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  UploadCloud, Image as ImageIcon, Video, FileText, Search,
  Trash2, Copy, Check, Grid3x3, List, X, Loader2,
  Film, File, SortAsc, SortDesc, RefreshCw,
} from 'lucide-react';
import { formatFileSize, timeAgo } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface MediaItem {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl: string | null;
  mediaType: 'IMAGE' | 'VIDEO' | 'GIF' | 'DOCUMENT';
  alt: string | null;
  tags: string[];
  createdAt: string;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  IMAGE: ImageIcon,
  VIDEO: Film,
  GIF: Video,
  DOCUMENT: File,
};

const TYPE_COLORS: Record<string, string> = {
  IMAGE: 'bg-blue-500/10 text-blue-400',
  VIDEO: 'bg-purple-500/10 text-purple-400',
  GIF: 'bg-green-500/10 text-green-400',
  DOCUMENT: 'bg-orange-500/10 text-orange-400',
};

export default function MediaPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMedia = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/media');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setItems(json.data);
    } catch {
      toast.error('Failed to load media');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMedia(); }, [fetchMedia]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const formData = new FormData();
    Array.from(files).forEach(f => formData.append('files', f));
    try {
      const res = await fetch('/api/media', { method: 'POST', body: formData });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Upload failed');
      toast.success(`${json.data.length} file(s) uploaded`);
      fetchMedia();
    } catch (e: any) {
      toast.error(e.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const res = await fetch(`/api/media/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setItems(prev => prev.filter(i => i.id !== id));
      if (selectedItem?.id === id) setSelectedItem(null);
      toast.success('Deleted');
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleting(null);
    }
  };

  const copyUrl = (item: MediaItem) => {
    navigator.clipboard.writeText(item.url);
    setCopiedId(item.id);
    toast.success('URL copied');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleUpload(e.dataTransfer.files);
  };

  const filtered = items
    .filter(i => {
      const matchSearch = i.originalName.toLowerCase().includes(search.toLowerCase()) ||
        i.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
      const matchType = typeFilter === 'ALL' || i.mediaType === typeFilter;
      return matchSearch && matchType;
    })
    .sort((a, b) => {
      const da = new Date(a.createdAt).getTime();
      const db = new Date(b.createdAt).getTime();
      return sortDir === 'desc' ? db - da : da - db;
    });

  const counts = { ALL: items.length, IMAGE: 0, VIDEO: 0, GIF: 0, DOCUMENT: 0 };
  items.forEach(i => { counts[i.mediaType] = (counts[i.mediaType] || 0) + 1; });

  return (
    <div className="max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Media Library</h1>
          <p className="text-muted-foreground mt-1">
            {items.length} file{items.length !== 1 ? 's' : ''} · Manage your images, videos, and documents.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchMedia} title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UploadCloud className="w-4 h-4 mr-2" />}
            {uploading ? 'Uploading…' : 'Upload Media'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,.pdf,.doc,.docx"
            className="hidden"
            onChange={e => handleUpload(e.target.files)}
          />
        </div>
      </div>

      {/* Drop Zone Banner (shown when empty) */}
      {!loading && items.length === 0 && (
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          className="border-2 border-dashed border-border rounded-xl p-20 text-center cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadCloud className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium">Drop files here or click to upload</p>
          <p className="text-sm text-muted-foreground mt-1">Supports images, videos, GIFs, PDFs</p>
        </div>
      )}

      {/* Filters + Controls */}
      {!loading && items.length > 0 && (
        <>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Type filter tabs */}
            <div className="flex gap-2 flex-wrap">
              {(['ALL', 'IMAGE', 'VIDEO', 'GIF', 'DOCUMENT'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    typeFilter === t
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t} <span className="opacity-70">({counts[t]})</span>
                </button>
              ))}
            </div>
            {/* Search + view controls */}
            <div className="flex gap-2 items-center w-full sm:w-auto">
              <div className="relative flex-1 sm:w-52">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search media…"
                  className="pl-9"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <Button
                variant="outline" size="icon"
                onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
                title={sortDir === 'desc' ? 'Newest first' : 'Oldest first'}
              >
                {sortDir === 'desc' ? <SortDesc className="w-4 h-4" /> : <SortAsc className="w-4 h-4" />}
              </Button>
              <Button variant="outline" size="icon" onClick={() => setViewMode(m => m === 'grid' ? 'list' : 'grid')}>
                {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid3x3 className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Drag-drop overlay hint */}
          <div
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            className="border border-dashed border-border/40 rounded-xl p-3 text-center text-xs text-muted-foreground"
          >
            <UploadCloud className="w-4 h-4 inline mr-1" /> Drop more files anywhere here to upload
          </div>
        </>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* No results */}
      {!loading && items.length > 0 && filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Search className="w-8 h-8 mx-auto mb-2" />
          <p>No media matches your filters.</p>
        </div>
      )}

      {/* Grid View */}
      {!loading && viewMode === 'grid' && filtered.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filtered.map(item => {
            const Icon = TYPE_ICONS[item.mediaType] || File;
            return (
              <Card
                key={item.id}
                className="overflow-hidden group cursor-pointer border-border/50 hover:border-primary/50 transition-all hover:shadow-lg"
                onClick={() => setSelectedItem(item)}
              >
                <div className="aspect-square bg-muted relative flex items-center justify-center overflow-hidden">
                  {item.mediaType === 'IMAGE' || item.mediaType === 'GIF' ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.thumbnailUrl || item.url}
                      alt={item.alt || item.originalName}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <Icon className="w-10 h-10 text-muted-foreground/60" />
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                    <Button
                      variant="secondary" size="sm" className="h-7 text-xs w-full"
                      onClick={e => { e.stopPropagation(); copyUrl(item); }}
                    >
                      {copiedId === item.id ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                      Copy URL
                    </Button>
                    <Button
                      variant="destructive" size="sm" className="h-7 text-xs w-full"
                      onClick={e => { e.stopPropagation(); handleDelete(item.id); }}
                      disabled={deleting === item.id}
                    >
                      {deleting === item.id ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Trash2 className="w-3 h-3 mr-1" />}
                      Delete
                    </Button>
                  </div>
                </div>
                <CardContent className="p-2">
                  <p className="text-xs font-medium truncate" title={item.originalName}>{item.originalName}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{formatFileSize(item.size)}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* List View */}
      {!loading && viewMode === 'list' && filtered.length > 0 && (
        <Card className="border-border/50">
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {filtered.map(item => {
                const Icon = TYPE_ICONS[item.mediaType] || File;
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedItem(item)}
                  >
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {item.mediaType === 'IMAGE' || item.mediaType === 'GIF' ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.thumbnailUrl || item.url}
                          alt={item.alt || item.originalName}
                          className="w-full h-full object-cover rounded-lg"
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <Icon className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.originalName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className={`text-[10px] h-4 ${TYPE_COLORS[item.mediaType]}`}>
                          {item.mediaType}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{formatFileSize(item.size)}</span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">{timeAgo(item.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost" size="icon" className="w-8 h-8"
                        onClick={e => { e.stopPropagation(); copyUrl(item); }}
                        title="Copy URL"
                      >
                        {copiedId === item.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="ghost" size="icon" className="w-8 h-8 text-destructive hover:text-destructive"
                        onClick={e => { e.stopPropagation(); handleDelete(item.id); }}
                        disabled={deleting === item.id}
                      >
                        {deleting === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="truncate">{selectedItem?.originalName}</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              {/* Preview */}
              {(selectedItem.mediaType === 'IMAGE' || selectedItem.mediaType === 'GIF') && (
                <div className="rounded-lg overflow-hidden bg-muted max-h-80 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedItem.url}
                    alt={selectedItem.alt || selectedItem.originalName}
                    className="max-h-80 object-contain"
                  />
                </div>
              )}
              {selectedItem.mediaType === 'VIDEO' && (
                <video controls className="w-full rounded-lg max-h-72 bg-black">
                  <source src={selectedItem.url} type={selectedItem.mimeType} />
                </video>
              )}
              {/* Metadata */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide mb-1">Type</p>
                  <Badge variant="outline" className={TYPE_COLORS[selectedItem.mediaType]}>
                    {selectedItem.mediaType}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide mb-1">Size</p>
                  <p className="font-medium">{formatFileSize(selectedItem.size)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide mb-1">MIME</p>
                  <p className="font-medium text-xs break-all">{selectedItem.mimeType}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide mb-1">Uploaded</p>
                  <p className="font-medium">{timeAgo(selectedItem.createdAt)}</p>
                </div>
              </div>
              {/* URL */}
              <div>
                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide mb-1">URL</p>
                <div className="flex gap-2">
                  <Input value={selectedItem.url} readOnly className="text-xs font-mono" />
                  <Button
                    variant="outline" size="icon"
                    onClick={() => copyUrl(selectedItem)}
                  >
                    {copiedId === selectedItem.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              {/* Tags */}
              {selectedItem.tags.length > 0 && (
                <div>
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide mb-1">Tags</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedItem.tags.map(t => (
                      <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(selectedItem.id)}
                  disabled={deleting === selectedItem.id}
                >
                  {deleting === selectedItem.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                  Delete
                </Button>
                <Button variant="outline" onClick={() => setSelectedItem(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
