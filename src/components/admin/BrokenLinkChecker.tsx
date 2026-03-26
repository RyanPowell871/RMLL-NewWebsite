import { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import {
  Search,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRightLeft,
  Clock,
  LinkIcon,
  Filter,
  Globe,
  FileText,
  Newspaper,
  Settings,
  Loader2,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  Megaphone,
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import {
  fetchNews,
  fetchPages,
  fetchSettings,
  fetchDocuments,
  fetchAnnouncements,
  updateNewsArticle,
  updatePage,
  updateSettings,
  updateAnnouncement,
  type SiteSettings,
} from '../../services/cms-api';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

// ============================================
// Types
// ============================================

type LinkStatus = 'pending' | 'checking' | 'ok' | 'redirect' | 'broken' | 'error';
type StatusFilter = 'all' | 'broken' | 'redirect' | 'ok' | 'error';

interface DiscoveredLink {
  id: string;
  url: string;
  sourceType: 'news' | 'page' | 'settings' | 'document' | 'announcement';
  sourceLabel: string;
  sourceId: string; // slug or id for updates
  context: string; // surrounding text or field name
  status: LinkStatus;
  statusCode: number | null;
  statusText: string;
  redirectUrl: string | null;
  responseTimeMs: number | null;
  error: string | null;
}

// ============================================
// URL extraction helpers
// ============================================

function extractUrlsFromHtml(html: string): { url: string; context: string }[] {
  const results: { url: string; context: string }[] = [];
  if (!html) return results;

  // Match href and src attributes
  const attrRegex = /(?:href|src)\s*=\s*["']([^"']+)["']/gi;
  let match;
  while ((match = attrRegex.exec(html)) !== null) {
    const url = match[1];
    if (isExternalUrl(url)) {
      // Get surrounding text for context
      const start = Math.max(0, match.index - 40);
      const end = Math.min(html.length, match.index + match[0].length + 40);
      const context = html.slice(start, end).replace(/<[^>]+>/g, '').trim();
      results.push({ url, context });
    }
  }

  return results;
}

function extractUrlsFromText(text: string): { url: string; context: string }[] {
  const results: { url: string; context: string }[] = [];
  if (!text) return results;

  const urlRegex = /https?:\/\/[^\s<>"',;)}\]]+/gi;
  let match;
  while ((match = urlRegex.exec(text)) !== null) {
    const url = match[0].replace(/[.,;:!?)}\]]+$/, ''); // trim trailing punctuation
    if (isExternalUrl(url)) {
      const start = Math.max(0, match.index - 30);
      const end = Math.min(text.length, match.index + url.length + 30);
      results.push({ url, context: text.slice(start, end).trim() });
    }
  }

  return results;
}

function isExternalUrl(url: string): boolean {
  if (!url) return false;
  // Skip anchors, mailto, tel, javascript, and relative URLs
  if (url.startsWith('#') || url.startsWith('mailto:') || url.startsWith('tel:') || url.startsWith('javascript:')) return false;
  if (!url.startsWith('http://') && !url.startsWith('https://')) return false;
  return true;
}

function deduplicateLinks(links: DiscoveredLink[]): DiscoveredLink[] {
  const seen = new Map<string, DiscoveredLink>();
  for (const link of links) {
    const key = `${link.url}::${link.sourceType}::${link.sourceId}`;
    if (!seen.has(key)) {
      seen.set(key, link);
    }
  }
  return Array.from(seen.values());
}

// ============================================
// Component
// ============================================

export function BrokenLinkChecker() {
  const [links, setLinks] = useState<DiscoveredLink[]>([]);
  const [scanning, setScanning] = useState(false);
  const [checking, setChecking] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [checkProgress, setCheckProgress] = useState(0);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [replaceUrl, setReplaceUrl] = useState('');
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());
  const abortRef = useRef(false);

  // ------------------------------------------
  // Step 1: Scan all content for links
  // ------------------------------------------
  const scanForLinks = useCallback(async () => {
    setScanning(true);
    setScanProgress(0);
    setLinks([]);
    abortRef.current = false;

    const discovered: DiscoveredLink[] = [];
    let idCounter = 0;

    const addLink = (
      url: string,
      sourceType: DiscoveredLink['sourceType'],
      sourceLabel: string,
      sourceId: string,
      context: string,
    ) => {
      discovered.push({
        id: `link-${idCounter++}`,
        url,
        sourceType,
        sourceLabel,
        sourceId,
        context,
        status: 'pending',
        statusCode: null,
        statusText: '',
        redirectUrl: null,
        responseTimeMs: null,
        error: null,
      });
    };

    try {
      // 1. Scan news articles
      setScanProgress(10);
      try {
        const news = await fetchNews({ limit: 500 });
        for (const article of news) {
          const htmlLinks = extractUrlsFromHtml(article.content);
          for (const { url, context } of htmlLinks) {
            addLink(url, 'news', `News: ${article.title}`, article.slug, context);
          }
          // Check featured image
          if (article.featured_image_url && isExternalUrl(article.featured_image_url)) {
            addLink(article.featured_image_url, 'news', `News: ${article.title}`, article.slug, 'Featured image URL');
          }
        }
      } catch {
        // Non-critical
      }

      // 2. Scan CMS pages
      setScanProgress(30);
      try {
        const pages = await fetchPages();
        for (const page of pages) {
          const htmlLinks = extractUrlsFromHtml(page.content);
          for (const { url, context } of htmlLinks) {
            addLink(url, 'page', `Page: ${page.title}`, page.slug, context);
          }
          if (page.featured_image_url && isExternalUrl(page.featured_image_url)) {
            addLink(page.featured_image_url, 'page', `Page: ${page.title}`, page.slug, 'Featured image URL');
          }
        }
      } catch {
        // Non-critical
      }

      // 3. Scan settings
      setScanProgress(50);
      try {
        const settings = await fetchSettings();
        const settingsUrls = [
          { url: settings.social_facebook, field: 'Social: Facebook' },
          { url: settings.social_twitter, field: 'Social: Twitter/X' },
          { url: settings.social_instagram, field: 'Social: Instagram' },
          { url: settings.social_youtube, field: 'Social: YouTube' },
          { url: settings.logo_url, field: 'Logo URL' },
        ];
        for (const { url, field } of settingsUrls) {
          if (url && isExternalUrl(url)) {
            addLink(url, 'settings', 'Site Settings', 'settings', field);
          }
        }
        // Check footer links
        if (settings.footer_links) {
          for (const link of settings.footer_links) {
            if (link.url && isExternalUrl(link.url)) {
              addLink(link.url, 'settings', 'Site Settings', 'settings', `Footer link: ${link.label}`);
            }
          }
        }
      } catch {
        // Non-critical
      }

      // 4. Scan documents
      setScanProgress(70);
      try {
        const documents = await fetchDocuments({ limit: 500 });
        for (const doc of documents) {
          if (doc.file_url && isExternalUrl(doc.file_url)) {
            addLink(doc.file_url, 'document', `Doc: ${doc.title}`, doc.id, 'File URL');
          }
        }
      } catch {
        // Non-critical
      }

      // 5. Scan announcements
      setScanProgress(85);
      try {
        const announcements = await fetchAnnouncements({ limit: 500 });
        for (const ann of announcements) {
          const textLinks = extractUrlsFromText(ann.content);
          for (const { url, context } of textLinks) {
            addLink(url, 'announcement', `Announcement: ${ann.title}`, ann.id, context);
          }
        }
      } catch {
        // Non-critical
      }

      setScanProgress(100);
      const deduped = deduplicateLinks(discovered);
      setLinks(deduped);
      toast.success(`Found ${deduped.length} link${deduped.length !== 1 ? 's' : ''} across all content`);
    } catch (error) {
      console.error('Error scanning for links:', error);
      toast.error('Failed to complete link scan');
    } finally {
      setScanning(false);
    }
  }, []);

  // ------------------------------------------
  // Step 2: Check discovered links via server
  // ------------------------------------------
  const checkLinks = useCallback(async () => {
    if (links.length === 0) return;

    setChecking(true);
    setCheckProgress(0);
    abortRef.current = false;

    const BATCH_SIZE = 25;
    const pendingLinks = links.filter((l) => l.status === 'pending' || l.status === 'error');
    const totalToCheck = pendingLinks.length;

    // Get unique URLs to avoid checking the same URL multiple times
    const uniqueUrls = [...new Set(pendingLinks.map((l) => l.url))];
    const urlResults = new Map<string, any>();
    let checked = 0;

    try {
      for (let i = 0; i < uniqueUrls.length; i += BATCH_SIZE) {
        if (abortRef.current) break;

        const batch = uniqueUrls.slice(i, i + BATCH_SIZE);
        const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-9a1ba23f/link-checker/check`;

        const res = await fetch(serverUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ urls: batch }),
        });

        if (!res.ok) {
          throw new Error(`Server returned ${res.status}`);
        }

        const data = await res.json();
        if (data.success && data.data?.results) {
          for (const result of data.data.results) {
            urlResults.set(result.url, result);
          }
        }

        checked += batch.length;
        setCheckProgress(Math.round((checked / uniqueUrls.length) * 100));
      }

      // Apply results to all links
      setLinks((prev) =>
        prev.map((link) => {
          const result = urlResults.get(link.url);
          if (!result) return link;

          let status: LinkStatus = 'ok';
          if (result.error) {
            status = 'error';
          } else if (!result.ok) {
            status = 'broken';
          } else if (result.redirected) {
            status = 'redirect';
          }

          return {
            ...link,
            status,
            statusCode: result.status,
            statusText: result.statusText,
            redirectUrl: result.finalUrl,
            responseTimeMs: result.responseTimeMs,
            error: result.error,
          };
        }),
      );

      const broken = [...urlResults.values()].filter((r) => !r.ok && !r.error).length;
      const errors = [...urlResults.values()].filter((r) => r.error).length;
      const redirects = [...urlResults.values()].filter((r) => r.redirected).length;

      if (broken > 0 || errors > 0) {
        toast.error(`Found ${broken} broken link${broken !== 1 ? 's' : ''} and ${errors} error${errors !== 1 ? 's' : ''}`);
      } else if (redirects > 0) {
        toast.success(`All links reachable! ${redirects} redirect${redirects !== 1 ? 's' : ''} detected.`);
      } else {
        toast.success('All links are healthy!');
      }
    } catch (error) {
      console.error('Error checking links:', error);
      toast.error('Failed to check links. Please try again.');
    } finally {
      setChecking(false);
    }
  }, [links]);

  // ------------------------------------------
  // Step 3: Replace a broken link
  // ------------------------------------------
  const handleReplace = useCallback(
    async (link: DiscoveredLink, newUrl: string) => {
      if (!newUrl.trim()) {
        toast.error('Please enter a replacement URL');
        return;
      }

      try {
        const oldUrl = link.url;

        switch (link.sourceType) {
          case 'news': {
            const news = await fetchNews({ limit: 500 });
            const article = news.find((a) => a.slug === link.sourceId);
            if (!article) throw new Error('Article not found');
            const updatedContent = article.content.replaceAll(oldUrl, newUrl);
            const updatedImage = article.featured_image_url === oldUrl ? newUrl : article.featured_image_url;
            await updateNewsArticle(link.sourceId, {
              content: updatedContent,
              featured_image_url: updatedImage,
            });
            break;
          }
          case 'page': {
            const pages = await fetchPages();
            const page = pages.find((p) => p.slug === link.sourceId);
            if (!page) throw new Error('Page not found');
            const updatedContent = page.content.replaceAll(oldUrl, newUrl);
            const updatedImage = page.featured_image_url === oldUrl ? newUrl : page.featured_image_url;
            await updatePage(link.sourceId, {
              content: updatedContent,
              featured_image_url: updatedImage,
            });
            break;
          }
          case 'settings': {
            const settings = await fetchSettings();
            const updated: Partial<SiteSettings> = {};
            if (settings.social_facebook === oldUrl) updated.social_facebook = newUrl;
            if (settings.social_twitter === oldUrl) updated.social_twitter = newUrl;
            if (settings.social_instagram === oldUrl) updated.social_instagram = newUrl;
            if (settings.social_youtube === oldUrl) updated.social_youtube = newUrl;
            if (settings.logo_url === oldUrl) updated.logo_url = newUrl;
            if (settings.footer_links) {
              updated.footer_links = settings.footer_links.map((fl) =>
                fl.url === oldUrl ? { ...fl, url: newUrl } : fl,
              );
            }
            await updateSettings(updated);
            break;
          }
          case 'announcement': {
            const announcements = await fetchAnnouncements({ limit: 500 });
            const ann = announcements.find((a) => a.id === link.sourceId);
            if (!ann) throw new Error('Announcement not found');
            const updatedContent = ann.content.replaceAll(oldUrl, newUrl);
            await updateAnnouncement(link.sourceId, {
              content: updatedContent,
            });
            break;
          }
          default:
            throw new Error(`Cannot update source type: ${link.sourceType}`);
        }

        // Update local state
        setLinks((prev) =>
          prev.map((l) =>
            l.id === link.id
              ? { ...l, url: newUrl, status: 'pending', statusCode: null, statusText: '', error: null }
              : l.sourceId === link.sourceId && l.url === oldUrl
                ? { ...l, url: newUrl, status: 'pending', statusCode: null, statusText: '', error: null }
                : l,
          ),
        );

        setReplacingId(null);
        setReplaceUrl('');
        toast.success(`Link replaced successfully in ${link.sourceType}`);
      } catch (error: any) {
        console.error('Error replacing link:', error);
        toast.error(`Failed to replace link: ${error.message}`);
      }
    },
    [],
  );

  const stopChecking = useCallback(() => {
    abortRef.current = true;
    setChecking(false);
  }, []);

  // ------------------------------------------
  // Filtering & stats
  // ------------------------------------------
  const filteredLinks =
    statusFilter === 'all' ? links : links.filter((l) => l.status === statusFilter);

  const stats = {
    total: links.length,
    ok: links.filter((l) => l.status === 'ok').length,
    broken: links.filter((l) => l.status === 'broken').length,
    redirect: links.filter((l) => l.status === 'redirect').length,
    error: links.filter((l) => l.status === 'error').length,
    pending: links.filter((l) => l.status === 'pending').length,
  };

  // Group links by source for organized display
  const groupedLinks = filteredLinks.reduce<Record<string, DiscoveredLink[]>>((acc, link) => {
    const key = link.sourceLabel;
    if (!acc[key]) acc[key] = [];
    acc[key].push(link);
    return acc;
  }, {});

  const toggleSource = (source: string) => {
    setExpandedSources((prev) => {
      const next = new Set(prev);
      if (next.has(source)) next.delete(source);
      else next.add(source);
      return next;
    });
  };

  // Auto-expand all on first load
  const expandAll = () => setExpandedSources(new Set(Object.keys(groupedLinks)));
  const collapseAll = () => setExpandedSources(new Set());

  const getSourceIcon = (type: DiscoveredLink['sourceType']) => {
    switch (type) {
      case 'news': return <Newspaper className="w-4 h-4" />;
      case 'page': return <FileText className="w-4 h-4" />;
      case 'settings': return <Settings className="w-4 h-4" />;
      case 'document': return <FileText className="w-4 h-4" />;
      case 'announcement': return <Megaphone className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (link: DiscoveredLink) => {
    switch (link.status) {
      case 'pending':
        return <Badge variant="outline" className="text-gray-500 border-gray-300"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'checking':
        return <Badge variant="outline" className="text-blue-500 border-blue-300"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Checking</Badge>;
      case 'ok':
        return <Badge className="bg-green-100 text-green-700 border-green-300"><CheckCircle2 className="w-3 h-3 mr-1" />{link.statusCode}</Badge>;
      case 'redirect':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300"><ArrowRightLeft className="w-3 h-3 mr-1" />{link.statusCode} Redirect</Badge>;
      case 'broken':
        return <Badge className="bg-red-100 text-red-700 border-red-300"><XCircle className="w-3 h-3 mr-1" />{link.statusCode || 'Broken'}</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-700 border-red-300"><AlertTriangle className="w-3 h-3 mr-1" />Error</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="w-5 h-5" />
            Broken Link Checker
          </CardTitle>
          <CardDescription>
            Scan all site content for links, verify they're working, and replace broken ones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={scanForLinks}
              disabled={scanning || checking}
              className="flex items-center gap-2"
            >
              {scanning ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              {scanning ? 'Scanning...' : 'Scan for Links'}
            </Button>

            {links.length > 0 && (
              <Button
                onClick={checkLinks}
                disabled={scanning || checking || stats.pending === 0}
                variant="outline"
                className="flex items-center gap-2"
              >
                {checking ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Globe className="w-4 h-4" />
                )}
                {checking ? 'Checking...' : `Check ${stats.pending > 0 ? stats.pending : 'All'} Links`}
              </Button>
            )}

            {checking && (
              <Button onClick={stopChecking} variant="destructive" size="sm" className="flex items-center gap-2">
                <X className="w-4 h-4" />
                Stop
              </Button>
            )}

            {links.length > 0 && !scanning && !checking && stats.pending === 0 && (
              <Button
                onClick={() => {
                  setLinks((prev) => prev.map((l) => ({ ...l, status: 'pending' as LinkStatus, statusCode: null, statusText: '', redirectUrl: null, responseTimeMs: null, error: null })));
                }}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Re-check All
              </Button>
            )}
          </div>

          {/* Progress bars */}
          {scanning && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-muted-foreground mb-1">
                <span>Scanning content...</span>
                <span>{scanProgress}%</span>
              </div>
              <Progress value={scanProgress} className="h-2" />
            </div>
          )}

          {checking && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-muted-foreground mb-1">
                <span>Checking URLs...</span>
                <span>{checkProgress}%</span>
              </div>
              <Progress value={checkProgress} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      {links.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            onClick={() => setStatusFilter('all')}
            className={`p-3 rounded-lg border text-center transition-colors ${statusFilter === 'all' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
          >
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total Links</div>
          </button>
          <button
            onClick={() => setStatusFilter('ok')}
            className={`p-3 rounded-lg border text-center transition-colors ${statusFilter === 'ok' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}
          >
            <div className="text-2xl font-bold text-green-600">{stats.ok}</div>
            <div className="text-xs text-muted-foreground">OK</div>
          </button>
          <button
            onClick={() => setStatusFilter('broken')}
            className={`p-3 rounded-lg border text-center transition-colors ${statusFilter === 'broken' ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}
          >
            <div className="text-2xl font-bold text-red-600">{stats.broken}</div>
            <div className="text-xs text-muted-foreground">Broken</div>
          </button>
          <button
            onClick={() => setStatusFilter('redirect')}
            className={`p-3 rounded-lg border text-center transition-colors ${statusFilter === 'redirect' ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200 hover:border-gray-300'}`}
          >
            <div className="text-2xl font-bold text-yellow-600">{stats.redirect}</div>
            <div className="text-xs text-muted-foreground">Redirects</div>
          </button>
          <button
            onClick={() => setStatusFilter('error')}
            className={`p-3 rounded-lg border text-center transition-colors ${statusFilter === 'error' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}
          >
            <div className="text-2xl font-bold text-orange-600">{stats.error}</div>
            <div className="text-xs text-muted-foreground">Errors</div>
          </button>
          <div className="p-3 rounded-lg border text-center border-gray-200">
            <div className="text-2xl font-bold text-gray-400">{stats.pending}</div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </div>
        </div>
      )}

      {/* Results */}
      {links.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Filter className="w-4 h-4" />
                {statusFilter === 'all' ? 'All Links' : `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Links`}
                <Badge variant="outline">{filteredLinks.length}</Badge>
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={expandAll}>Expand All</Button>
                <Button variant="ghost" size="sm" onClick={collapseAll}>Collapse All</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredLinks.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No links match the selected filter.
              </p>
            ) : (
              <div className="space-y-2">
                {Object.entries(groupedLinks).map(([sourceLabel, sourceLinks]) => {
                  const isExpanded = expandedSources.has(sourceLabel);
                  const brokenCount = sourceLinks.filter((l) => l.status === 'broken' || l.status === 'error').length;
                  const sourceType = sourceLinks[0]?.sourceType;

                  return (
                    <div key={sourceLabel} className="border rounded-lg overflow-hidden">
                      {/* Source Header */}
                      <button
                        onClick={() => toggleSource(sourceLabel)}
                        className="w-full flex items-center gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                        )}
                        {sourceType && getSourceIcon(sourceType)}
                        <span className="font-medium text-sm truncate flex-1">
                          {sourceLabel}
                        </span>
                        <Badge variant="outline" className="ml-auto shrink-0">
                          {sourceLinks.length} link{sourceLinks.length !== 1 ? 's' : ''}
                        </Badge>
                        {brokenCount > 0 && (
                          <Badge className="bg-red-100 text-red-700 shrink-0">
                            {brokenCount} broken
                          </Badge>
                        )}
                      </button>

                      {/* Links */}
                      {isExpanded && (
                        <div className="divide-y">
                          {sourceLinks.map((link) => (
                            <div key={link.id} className="px-4 py-3">
                              <div className="flex items-start gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {getStatusBadge(link)}
                                    {link.responseTimeMs != null && (
                                      <span className="text-xs text-muted-foreground">
                                        {link.responseTimeMs}ms
                                      </span>
                                    )}
                                  </div>

                                  <a
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:underline break-all mt-1 inline-flex items-center gap-1"
                                  >
                                    {link.url}
                                    <ExternalLink className="w-3 h-3 shrink-0" />
                                  </a>

                                  {link.context && (
                                    <p className="text-xs text-muted-foreground mt-1 truncate max-w-xl">
                                      {link.context}
                                    </p>
                                  )}

                                  {link.redirectUrl && (
                                    <p className="text-xs text-yellow-600 mt-1">
                                      Redirects to: <span className="break-all">{link.redirectUrl}</span>
                                    </p>
                                  )}

                                  {link.error && (
                                    <p className="text-xs text-red-600 mt-1">{link.error}</p>
                                  )}
                                </div>

                                {/* Actions */}
                                {(link.status === 'broken' || link.status === 'error' || link.status === 'redirect') && link.sourceType !== 'document' && (
                                  <div className="shrink-0">
                                    {replacingId === link.id ? (
                                      <div className="flex items-center gap-2">
                                        <Input
                                          value={replaceUrl}
                                          onChange={(e) => setReplaceUrl(e.target.value)}
                                          placeholder="New URL..."
                                          className="h-8 text-sm w-48 sm:w-64"
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleReplace(link, replaceUrl);
                                            if (e.key === 'Escape') { setReplacingId(null); setReplaceUrl(''); }
                                          }}
                                          autoFocus
                                        />
                                        <Button
                                          size="sm"
                                          className="h-8 px-2"
                                          onClick={() => handleReplace(link, replaceUrl)}
                                        >
                                          <Check className="w-4 h-4" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-8 px-2"
                                          onClick={() => { setReplacingId(null); setReplaceUrl(''); }}
                                        >
                                          <X className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 text-xs"
                                        onClick={() => {
                                          setReplacingId(link.id);
                                          setReplaceUrl(link.redirectUrl || '');
                                        }}
                                      >
                                        <ArrowRightLeft className="w-3 h-3 mr-1" />
                                        Replace
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {links.length === 0 && !scanning && (
        <Card>
          <CardContent className="py-12 text-center">
            <LinkIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Links Scanned Yet</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Click "Scan for Links" to discover all URLs across news articles, pages, settings,
              documents, and announcements. Then check them for broken links.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}