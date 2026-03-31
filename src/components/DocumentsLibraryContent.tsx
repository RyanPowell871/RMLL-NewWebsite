import { 
  Search, FileText, Download, Calendar, X, ChevronRight, FolderOpen,
  Scale, BookOpen, ClipboardList, ShieldCheck, Users, DollarSign,
  BarChart3, Mail, Clock, Folder, ArrowLeftRight, ListChecks
} from 'lucide-react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { fetchDocuments, type Document } from '../services/cms-api';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';
import { 
  DOCUMENT_CATEGORIES, 
  getCategoryLabel, 
  getSubcategoryLabel,
  getCategoryPath 
} from '../utils/document-analyzer';

// Icon mapping for categories
const CATEGORY_ICONS: Record<string, any> = {
  'Scale': Scale,
  'BookOpen': BookOpen,
  'Whistle': FileText, // No whistle in lucide, use FileText with label
  'ClipboardList': ClipboardList,
  'ShieldCheck': ShieldCheck,
  'Users': Users,
  'DollarSign': DollarSign,
  'Calendar': Calendar,
  'ListChecks': ListChecks,
  'ArrowLeftRight': ArrowLeftRight,
  'BarChart3': BarChart3,
  'Mail': Mail,
  'Clock': Clock,
  'Folder': Folder,
};

// Color mapping for categories
const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  'governance': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', badge: 'bg-indigo-100 text-indigo-800' },
  'rules-regulations': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-800' },
  'officiating': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-800' },
  'forms': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-800' },
  'insurance': { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', badge: 'bg-cyan-100 text-cyan-800' },
  'meetings': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-800' },
  'financial': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', badge: 'bg-green-100 text-green-800' },
  'schedules': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-800' },
  'rosters': { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', badge: 'bg-teal-100 text-teal-800' },
  'transactions': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', badge: 'bg-rose-100 text-rose-800' },
  'statistics': { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', badge: 'bg-sky-100 text-sky-800' },
  'communications': { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', badge: 'bg-violet-100 text-violet-800' },
  'historical': { bg: 'bg-stone-50', text: 'text-stone-700', border: 'border-stone-200', badge: 'bg-stone-100 text-stone-800' },
  'other': { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', badge: 'bg-gray-100 text-gray-800' },
};

function getCategoryColor(categoryId: string) {
  return CATEGORY_COLORS[categoryId] || CATEGORY_COLORS['other'];
}

function getCategoryIconComponent(categoryId: string) {
  const cat = DOCUMENT_CATEGORIES.find(c => c.id === categoryId);
  if (!cat) return Folder;
  return CATEGORY_ICONS[cat.icon] || Folder;
}

export function DocumentsLibraryContent() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'preview'>('list');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Handle URL parameter for document selection (e.g., ?doc=123 or #documents?doc=123)
  useEffect(() => {
    const handleHashWithDocId = () => {
      // Check hash (for /league-info#documents?doc=123)
      const hash = window.location.hash.substring(1); // Remove #
      let docId = null;

      if (hash.includes('?')) {
        const params = new URLSearchParams(hash.split('?')[1]);
        docId = params.get('doc');
      }

      // Only proceed if the hash is for documents and has a doc parameter
      if (!hash.startsWith('documents') || !docId) return;

      if (documents.length > 0) {
        const doc = documents.find(d => d.id === docId);
        if (doc) {
          setSelectedDocument(doc);
          setMobileView('preview');
          // Remove the doc parameter from hash using replaceState to avoid triggering hash change
          window.history.replaceState({}, '', '#documents');
        }
      }
    };

    // Check on mount and when documents load
    handleHashWithDocId();

    // Listen for hash changes (e.g., user clicks another document link)
    window.addEventListener('hashchange', handleHashWithDocId);
    return () => window.removeEventListener('hashchange', handleHashWithDocId);
  }, [documents]);

  // Load documents from API
  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      const data = await fetchDocuments();
      setDocuments(data);
      if (data.length > 0 && !selectedDocument) {
        setSelectedDocument(data[0]);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Extract unique years from documents
  const availableYears = useMemo(() => {
    const years = Array.from(
      new Set(
        documents
          .map(doc => {
            if (doc.document_year) return doc.document_year;
            const date = new Date(doc.upload_date);
            return date.getFullYear();
          })
          .filter(year => !isNaN(year))
      )
    ).sort((a, b) => (b as number) - (a as number));
    return ['all', ...years.map(y => y.toString())];
  }, [documents]);

  // Get categories that have documents
  const categoriesWithCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const yearFilteredDocs = selectedYear === 'all'
      ? documents
      : documents.filter(doc => {
          const docYear = doc.document_year
            ? doc.document_year.toString()
            : new Date(doc.upload_date).getFullYear().toString();
          return docYear === selectedYear;
        });

    for (const doc of yearFilteredDocs) {
      const cat = doc.category || 'other';
      counts[cat] = (counts[cat] || 0) + 1;
    }

    return DOCUMENT_CATEGORIES
      .map(cat => ({ ...cat, count: counts[cat.id] || 0 }))
      .filter(cat => cat.count > 0)
      .concat(
        // Include any categories found on documents that aren't in the built-in list
        Object.entries(counts)
          .filter(([catId]) => !DOCUMENT_CATEGORIES.some(c => c.id === catId))
          .map(([catId, count]) => ({
            id: catId,
            label: catId.charAt(0).toUpperCase() + catId.slice(1).replace(/-/g, ' '),
            description: '',
            icon: 'Folder',
            keywords: [],
            count,
          }))
      );
  }, [documents, selectedYear]);

  // Get available subcategories based on selected category
  const availableSubcategories = useMemo(() => {
    const yearFilteredDocs = selectedYear === 'all'
      ? documents
      : documents.filter(doc => {
          const docYear = doc.document_year
            ? doc.document_year.toString()
            : new Date(doc.upload_date).getFullYear().toString();
          return docYear === selectedYear;
        });

    const catFiltered = selectedCategory === 'all'
      ? yearFilteredDocs
      : yearFilteredDocs.filter(doc => doc.category === selectedCategory);

    const subcatCounts: Record<string, number> = {};
    for (const doc of catFiltered) {
      if (doc.subcategory) {
        subcatCounts[doc.subcategory] = (subcatCounts[doc.subcategory] || 0) + 1;
      }
    }

    return Object.entries(subcatCounts)
      .map(([id, count]) => ({ id, count }))
      .sort((a, b) => a.id.localeCompare(b.id));
  }, [documents, selectedCategory, selectedYear]);

  // Reset subcategory filter when category changes
  useEffect(() => {
    setSelectedSubcategory('all');
  }, [selectedCategory]);

  // Filter documents
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = !searchQuery ||
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.file_name?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
      const matchesSubcategory = selectedSubcategory === 'all' || doc.subcategory === selectedSubcategory;

      let matchesYear = true;
      if (selectedYear !== 'all') {
        const docYear = doc.document_year
          ? doc.document_year.toString()
          : new Date(doc.upload_date).getFullYear().toString();
        matchesYear = docYear === selectedYear;
      }

      return matchesSearch && matchesCategory && matchesSubcategory && matchesYear;
    });
  }, [documents, searchQuery, selectedCategory, selectedSubcategory, selectedYear]);

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return 'Unknown';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get file type from mime type or filename
  const getFileType = (doc: Document) => {
    if (doc.file_type) {
      if (doc.file_type.includes('pdf')) return 'PDF';
      if (doc.file_type.includes('word')) return 'DOC';
      if (doc.file_type.includes('sheet') || doc.file_type.includes('excel')) return 'XLS';
      if (doc.file_type.includes('presentation')) return 'PPT';
    }
    const ext = doc.file_name?.split('.').pop()?.toUpperCase();
    return ext || 'FILE';
  };

  const totalDocs = selectedYear === 'all'
    ? documents.length
    : documents.filter(d => {
        const docYear = d.document_year
          ? d.document_year.toString()
          : new Date(d.upload_date).getFullYear().toString();
        return docYear === selectedYear;
      }).length;

  if (isLoading) {
    return (
      <div className="not-prose">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-[#013fac] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading documents...</p>
        </div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="not-prose">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
          <FolderOpen className="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-black text-gray-900 mb-2">No Documents Available</h3>
          <p className="text-gray-600">Check back later for league documents and resources.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="not-prose">
      {/* Mobile Tabs */}
      <div className="md:hidden mb-4">
        <Tabs value={mobileView} onValueChange={(v) => setMobileView(v as 'list' | 'preview')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list">Documents ({filteredDocuments.length})</TabsTrigger>
            <TabsTrigger value="preview" disabled={!selectedDocument}>Preview</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex flex-col md:flex-row gap-4 md:gap-5">
        {/* Left Column - Navigation */}
        <aside className={`${mobileView === 'list' ? 'block' : 'hidden'} md:block w-full md:w-[260px] flex-shrink-0`}>
          <div className="md:sticky md:top-24 space-y-3">
            {/* Search */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10 h-9 text-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Year Filter */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Year</h3>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-full h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {availableYears.filter(y => y !== 'all').map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Categories */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-3 border-b border-gray-100">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Categories</h3>
              </div>
              <div className="overflow-y-auto max-h-[calc(100vh-520px)] min-h-[200px]">
                <div className="p-1.5 space-y-0.5">
                  {/* All Categories */}
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between ${
                      selectedCategory === 'all'
                        ? 'bg-[#013fac] text-white font-bold'
                        : 'text-gray-700 hover:bg-gray-50 font-medium'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <FolderOpen className="w-3.5 h-3.5" />
                      <span>All</span>
                    </span>
                    <span className="text-xs opacity-75">{totalDocs}</span>
                  </button>

                  {categoriesWithCounts.map((cat) => {
                    const IconComp = getCategoryIconComponent(cat.id);
                    const colors = getCategoryColor(cat.id);
                    const isActive = selectedCategory === cat.id;

                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between ${
                          isActive
                            ? 'bg-[#013fac] text-white font-bold'
                            : `text-gray-700 hover:${colors.bg} font-medium`
                        }`}
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <IconComp className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{cat.label}</span>
                        </span>
                        <span className="text-xs opacity-75 flex-shrink-0 ml-1">{cat.count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Subcategories */}
            {availableSubcategories.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-3 border-b border-gray-100">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Subcategories</h3>
                </div>
                <ScrollArea className="max-h-[250px]">
                  <div className="p-1.5 space-y-0.5">
                    <button
                      onClick={() => setSelectedSubcategory('all')}
                      className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${
                        selectedSubcategory === 'all'
                          ? 'bg-[#013fac] text-white font-bold'
                          : 'text-gray-600 hover:bg-gray-50 font-medium'
                      }`}
                    >
                      All
                    </button>
                    {availableSubcategories.map(({ id, count }) => (
                      <button
                        key={id}
                        onClick={() => setSelectedSubcategory(id)}
                        className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors flex items-center justify-between ${
                          selectedSubcategory === id
                            ? 'bg-[#013fac] text-white font-bold'
                            : 'text-gray-600 hover:bg-gray-50 font-medium'
                        }`}
                      >
                        <span className="truncate">
                          {getSubcategoryLabel(selectedCategory === 'all' ? '' : selectedCategory, id)}
                        </span>
                        <span className="text-xs opacity-75 flex-shrink-0 ml-1">{count}</span>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        </aside>

        {/* Middle Column - Document Cards */}
        <div className={`${mobileView === 'list' ? 'block' : 'hidden'} md:block w-full md:w-[340px] flex-shrink-0`}>
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm h-[600px] md:h-[calc(100vh-200px)] max-h-[1200px] flex flex-col overflow-hidden">
            <div className="p-3 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  {filteredDocuments.length} Document{filteredDocuments.length !== 1 ? 's' : ''}
                </h3>
                {selectedCategory !== 'all' && (
                  <button
                    onClick={() => { setSelectedCategory('all'); setSelectedSubcategory('all'); }}
                    className="text-xs text-[#013fac] hover:text-[#0149c9] font-semibold flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    Clear filter
                  </button>
                )}
              </div>
            </div>
            <ScrollArea className="flex-1 overflow-y-auto">
              <div className="p-2 space-y-1.5">
                {filteredDocuments.length === 0 ? (
                  <div className="text-center py-8 px-4">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No documents match your filters</p>
                  </div>
                ) : (
                  filteredDocuments.map((doc) => {
                    const colors = getCategoryColor(doc.category);
                    const isSelected = selectedDocument?.id === doc.id;
                    const IconComp = getCategoryIconComponent(doc.category);
                    
                    return (
                      <button
                        key={doc.id}
                        onClick={() => {
                          setSelectedDocument(doc);
                          setMobileView('preview');
                        }}
                        className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                          isSelected
                            ? 'border-[#013fac] bg-blue-50 shadow-md'
                            : `border-transparent hover:border-gray-200 hover:bg-gray-50`
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className={`p-1.5 rounded flex-shrink-0 ${isSelected ? 'bg-[#013fac]' : colors.bg}`}>
                            <IconComp className={`w-4 h-4 ${isSelected ? 'text-white' : colors.text}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-sm text-gray-900 mb-1 line-clamp-2 leading-tight">
                              {doc.title}
                            </h4>
                            <div className="flex items-center gap-1 mb-1 flex-wrap">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${colors.badge}`}>
                                {getCategoryLabel(doc.category)}
                              </span>
                              {doc.subcategory && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">
                                  {getSubcategoryLabel(doc.category, doc.subcategory)}
                                </span>
                              )}
                              {doc.document_year && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500">
                                  {doc.document_year}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-400">
                              {getFileType(doc)} • {formatFileSize(doc.file_size)}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Right Column - Preview Area */}
        <div className={`${mobileView === 'preview' ? 'block' : 'hidden'} md:block flex-1 min-w-0`}>
          {selectedDocument ? (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm h-[600px] md:h-[calc(100vh-200px)] max-h-[1200px] flex flex-col">
              {/* Document Header */}
              <div className="p-4 md:p-5 border-b border-gray-200 flex-shrink-0">
                <button
                  onClick={() => setMobileView('list')}
                  className="md:hidden mb-3 text-sm font-semibold text-[#013fac] hover:text-[#0149c9] flex items-center gap-1"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                  Back to Documents
                </button>
                <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {(() => {
                        const colors = getCategoryColor(selectedDocument.category);
                        const IconComp = getCategoryIconComponent(selectedDocument.category);
                        return (
                          <>
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold ${colors.badge}`}>
                              <IconComp className="w-3 h-3" />
                              {getCategoryLabel(selectedDocument.category)}
                            </span>
                            {selectedDocument.subcategory && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-700">
                                {getSubcategoryLabel(selectedDocument.category, selectedDocument.subcategory)}
                              </span>
                            )}
                            {selectedDocument.document_year && (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-500">
                                {selectedDocument.document_year}
                              </span>
                            )}
                          </>
                        );
                      })()}
                    </div>
                    <h2 className="text-lg sm:text-xl font-black text-gray-900 mb-1 break-words leading-tight">
                      {selectedDocument.title}
                    </h2>
                    {selectedDocument.description && (
                      <p className="text-sm text-gray-600 mb-2">{selectedDocument.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(selectedDocument.upload_date)}</span>
                      </div>
                      <span>•</span>
                      <span>{getFileType(selectedDocument)}</span>
                      <span>•</span>
                      <span>{formatFileSize(selectedDocument.file_size)}</span>
                    </div>
                  </div>
                  <a
                    href={selectedDocument.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-4 py-2 bg-[#013fac] hover:bg-[#0149c9] text-white rounded-lg flex items-center justify-center gap-2 font-bold transition-colors shadow-md flex-shrink-0 text-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </a>
                </div>
              </div>

              {/* Document Preview */}
              <div className="flex-1 overflow-hidden">
                {selectedDocument.file_type?.includes('pdf') ? (
                  <iframe
                    src={`${selectedDocument.file_url}#view=FitH`}
                    className="w-full h-full border-0"
                    title={selectedDocument.title}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center p-8 text-center">
                    <div>
                      <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="font-bold text-gray-900 mb-2">Preview Not Available</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        This file type cannot be previewed in the browser.
                      </p>
                      <a
                        href={selectedDocument.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#013fac] hover:bg-[#0149c9] text-white rounded-lg font-bold transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Download to View
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm h-[400px] md:h-[calc(100vh-200px)] max-h-[1200px] flex items-center justify-center p-8 md:p-12 text-center">
              <div>
                <FolderOpen className="w-16 h-16 md:w-20 md:h-20 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg md:text-xl font-black text-gray-900 mb-2">No Document Selected</h3>
                <p className="text-sm md:text-base text-gray-600">Select a document from the list to view its contents</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}