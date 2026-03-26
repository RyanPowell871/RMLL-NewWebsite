import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Search, X, Newspaper, FileText, Trophy, ArrowRight, Loader2, FolderOpen } from 'lucide-react';
import { fetchNews, fetchPages, fetchDocuments, type NewsArticle, type Page, type Document as CMSDocument } from '../services/cms-api';
import { allPossibleDivisions } from '../contexts/DivisionContext';

// ============================================
// Types
// ============================================

type ResultType = 'news' | 'page' | 'division' | 'document';

interface SearchResult {
  id: string;
  type: ResultType;
  title: string;
  description: string;
  meta?: string;
  navigateAction: () => void;
}

interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigateTo: (page: string, params?: Record<string, any>) => void;
  onNavigateToPath: (path: string) => void;
}

// ============================================
// Helpers
// ============================================

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim();
}

function excerptAround(text: string, query: string, chars = 100): string {
  const lower = text.toLowerCase();
  const qLower = query.toLowerCase();
  const idx = lower.indexOf(qLower);
  if (idx === -1) return text.slice(0, chars * 2) + (text.length > chars * 2 ? '...' : '');
  const start = Math.max(0, idx - chars);
  const end = Math.min(text.length, idx + query.length + chars);
  let excerpt = '';
  if (start > 0) excerpt += '...';
  excerpt += text.slice(start, end);
  if (end < text.length) excerpt += '...';
  return excerpt;
}

function matchScore(text: string, query: string): number {
  const lower = text.toLowerCase();
  const qLower = query.toLowerCase();
  if (lower === qLower) return 100;
  if (lower.startsWith(qLower)) return 80;
  if (lower.includes(qLower)) return 60;
  // Word-level matching
  const words = qLower.split(/\s+/).filter(Boolean);
  const matched = words.filter(w => lower.includes(w)).length;
  return matched > 0 ? (matched / words.length) * 40 : 0;
}

// ============================================
// Component
// ============================================

export function SearchModal({ open, onOpenChange, onNavigateTo, onNavigateToPath }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Cached content
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [documents, setDocuments] = useState<CMSDocument[]>([]);

  // Load data when modal opens
  useEffect(() => {
    if (!open) return;
    if (dataLoaded) return;

    let cancelled = false;
    setLoading(true);

    Promise.allSettled([
      fetchNews({ limit: 200 }),
      fetchPages(),
      fetchDocuments(),
    ]).then(([newsRes, pagesRes, docsRes]) => {
      if (cancelled) return;
      if (newsRes.status === 'fulfilled') setNewsArticles(newsRes.value);
      if (pagesRes.status === 'fulfilled') setPages(pagesRes.value.filter(p => p.is_published));
      if (docsRes.status === 'fulfilled') setDocuments(docsRes.value.filter(d => d.is_public));
      setDataLoaded(true);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [open, dataLoaded]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [open]);

  // Focus input on open
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Build search results
  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim();
    if (q.length < 2) return [];

    const all: (SearchResult & { score: number })[] = [];

    // Search news articles
    for (const article of newsArticles) {
      const titleScore = matchScore(article.title, q);
      const contentText = stripHtml(article.content);
      const contentScore = matchScore(contentText, q) * 0.7;
      const tagScore = article.tags?.some(t => t.toLowerCase().includes(q.toLowerCase())) ? 50 : 0;
      const score = Math.max(titleScore, contentScore, tagScore);

      if (score > 0) {
        all.push({
          id: `news-${article.slug}`,
          type: 'news',
          title: article.title,
          description: titleScore >= contentScore
            ? (article.category ? article.category.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '')
            : excerptAround(contentText, q, 60),
          meta: new Date(article.published_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          score,
          navigateAction: () => {
            onNavigateTo('news', { slug: article.slug });
            onOpenChange(false);
          },
        });
      }
    }

    // Search CMS pages
    for (const page of pages) {
      const titleScore = matchScore(page.title, q);
      const contentText = stripHtml(page.content);
      const contentScore = matchScore(contentText, q) * 0.7;
      const score = Math.max(titleScore, contentScore);

      if (score > 0) {
        all.push({
          id: `page-${page.slug}`,
          type: 'page',
          title: page.title,
          description: titleScore >= contentScore
            ? (page.meta_description || '')
            : excerptAround(contentText, q, 60),
          score,
          navigateAction: () => {
            onNavigateTo('home'); // Pages may not have direct navigation, link to home for now
            onOpenChange(false);
          },
        });
      }
    }

    // Search divisions
    const divisionsToSearch = allPossibleDivisions.filter(d => d !== 'All Divisions');
    for (const division of divisionsToSearch) {
      const score = matchScore(division, q);
      if (score > 0) {
        all.push({
          id: `division-${division}`,
          type: 'division',
          title: division,
          description: 'View division standings, schedule, and teams',
          score,
          navigateAction: () => {
            onNavigateTo('division-info', { divisionName: division });
            onOpenChange(false);
          },
        });
      }
    }

    // Search quick-nav items (common pages)
    const quickNavItems = [
      { label: 'Schedule', page: 'schedule', desc: 'View game schedule and results' },
      { label: 'Standings', page: 'standings', desc: 'View league standings' },
      { label: 'Statistics', page: 'stats', desc: 'View player and team statistics' },
      { label: 'Stats', page: 'stats', desc: 'Player and goalie stats' },
      { label: 'Teams', page: 'teams', desc: 'View all teams in the league' },
      { label: 'News', page: 'news', desc: 'Latest news and articles' },
      { label: 'League Info', path: '/league-info', desc: 'League information, history, and contacts' },
      { label: 'Contact', path: '/contact', desc: 'Contact the RMLL' },
    ];

    const seenPages = new Set<string>();
    for (const item of quickNavItems) {
      const key = item.page || item.path || '';
      if (seenPages.has(key)) continue;
      const score = matchScore(item.label, q);
      if (score > 20) {
        seenPages.add(key);
        all.push({
          id: `nav-${key}`,
          type: 'page',
          title: item.label,
          description: item.desc,
          score: score * 0.9, // Slight de-prioritization vs real content
          navigateAction: () => {
            if (item.path) {
              onNavigateToPath(item.path);
            } else if (item.page) {
              onNavigateTo(item.page as any);
            }
            onOpenChange(false);
          },
        });
      }
    }

    // Search documents
    for (const doc of documents) {
      const titleScore = matchScore(doc.title, q);
      const descScore = doc.description ? matchScore(doc.description, q) * 0.7 : 0;
      const score = Math.max(titleScore, descScore);

      if (score > 0) {
        all.push({
          id: `doc-${doc.id}`,
          type: 'document',
          title: doc.title,
          description: doc.description || `${doc.file_type?.toUpperCase() || 'Document'}`,
          meta: doc.category?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          score,
          navigateAction: () => {
            // Open document URL directly if available, otherwise navigate to documents page
            if (doc.file_url) {
              window.open(doc.file_url, '_blank');
            } else {
              onNavigateTo('documents' as any);
            }
            onOpenChange(false);
          },
        });
      }
    }

    // Sort by score and limit
    all.sort((a, b) => b.score - a.score);
    return all.slice(0, 20);
  }, [query, newsArticles, pages, documents, onNavigateTo, onNavigateToPath, onOpenChange]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  // Scroll selected result into view
  useEffect(() => {
    if (!resultsRef.current) return;
    const selectedEl = resultsRef.current.querySelector(`[data-index="${selectedIndex}"]`);
    if (selectedEl) {
      selectedEl.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        results[selectedIndex].navigateAction();
      }
    }
  }, [results, selectedIndex]);

  const getTypeIcon = (type: ResultType) => {
    switch (type) {
      case 'news': return <Newspaper className="w-4 h-4 text-blue-500 shrink-0" />;
      case 'page': return <FileText className="w-4 h-4 text-green-500 shrink-0" />;
      case 'division': return <Trophy className="w-4 h-4 text-amber-500 shrink-0" />;
      case 'document': return <FolderOpen className="w-4 h-4 text-purple-500 shrink-0" />;
    }
  };

  const getTypeLabel = (type: ResultType) => {
    switch (type) {
      case 'news': return 'News';
      case 'page': return 'Page';
      case 'division': return 'Division';
      case 'document': return 'Document';
    }
  };

  // Highlight matching text
  const highlightMatch = (text: string, q: string) => {
    if (!q || q.length < 2) return text;
    const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? <mark key={i} className="bg-yellow-200 text-yellow-900 rounded-sm px-0.5">{part}</mark> : part
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden bg-white border-gray-200 shadow-2xl [&>button]:hidden" aria-describedby={undefined}>
        <VisuallyHidden>
          <DialogTitle>Search</DialogTitle>
        </VisuallyHidden>
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
          <Search className="w-5 h-5 text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search news, teams, divisions, documents..."
            className="flex-1 text-base outline-none bg-transparent placeholder:text-gray-400"
            autoComplete="off"
            spellCheck={false}
          />
          {query && (
            <button
              onClick={() => { setQuery(''); inputRef.current?.focus(); }}
              className="p-1 hover:bg-gray-100 rounded-md transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-gray-400 bg-gray-100 rounded border border-gray-200">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={resultsRef} className="max-h-[400px] overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              <span className="text-sm">Loading content...</span>
            </div>
          )}

          {!loading && query.length >= 2 && results.length === 0 && (
            <div className="py-12 text-center">
              <Search className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No results found for "<strong>{query}</strong>"</p>
              <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
            </div>
          )}

          {!loading && query.length < 2 && (
            <div className="py-10 text-center">
              <Search className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Start typing to search</p>
              <p className="text-xs text-gray-400 mt-1">Search across news, divisions, documents, and more</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="py-2">
              {results.map((result, index) => (
                <button
                  key={result.id}
                  data-index={index}
                  onClick={result.navigateAction}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors ${
                    index === selectedIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="mt-0.5">{getTypeIcon(result.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium text-sm truncate ${index === selectedIndex ? 'text-blue-900' : 'text-gray-900'}`}>
                        {highlightMatch(result.title, query)}
                      </span>
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider shrink-0">
                        {getTypeLabel(result.type)}
                      </span>
                    </div>
                    {result.description && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                        {highlightMatch(result.description, query)}
                      </p>
                    )}
                    {result.meta && (
                      <p className="text-[11px] text-gray-400 mt-0.5">{result.meta}</p>
                    )}
                  </div>
                  <ArrowRight className={`w-4 h-4 shrink-0 mt-1 transition-opacity ${
                    index === selectedIndex ? 'opacity-100 text-blue-500' : 'opacity-0'
                  }`} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {results.length > 0 && (
          <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-400">
            <span>{results.length} result{results.length !== 1 ? 's' : ''}</span>
            <div className="hidden sm:flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-mono">↑↓</kbd>
                navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-mono">↵</kbd>
                select
              </span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}