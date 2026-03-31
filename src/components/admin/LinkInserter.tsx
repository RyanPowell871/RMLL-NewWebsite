import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { Checkbox } from '../ui/checkbox';
import { FileText, File, Search, ExternalLink, Book, Briefcase, Users, Scale, Menu as MenuIcon } from 'lucide-react';
import { LinkInsertOptions } from './TextareaWithLinkInserter';

// Document types
interface DocumentItem {
  id: string;
  title: string;
  category: string;
  year: number;
}

// Page types
interface PageItem {
  id: string;
  title: string;
  category?: string;
  url: string;
}

// Document library data
const DOCUMENTS: DocumentItem[] = [
  { id: '1', title: 'RMLL Official Rulebook 2025', category: 'Rules & Regulations', year: 2025 },
  { id: '2', title: 'Player Registration Form', category: 'Forms', year: 2025 },
  { id: '3', title: 'Code of Conduct', category: 'Policies', year: 2025 },
  { id: '4', title: 'League Bylaws', category: 'Rules & Regulations', year: 2024 },
  { id: '5', title: 'Referee Guidelines', category: 'Officials', year: 2024 },
  { id: '6', title: 'Safety Protocol', category: 'Policies', year: 2024 },
  { id: '7', title: 'Team Registration Package', category: 'Forms', year: 2024 },
  { id: '8', title: 'Playoff Format Guide', category: 'Rules & Regulations', year: 2024 },
  { id: '9', title: 'Coaching Certification Requirements', category: 'Officials', year: 2024 },
  { id: '10', title: 'Financial Report 2024', category: 'Reports', year: 2024 },
  { id: '11', title: 'Equipment Standards', category: 'Rules & Regulations', year: 2024 },
  { id: '12', title: 'Volunteer Application', category: 'Forms', year: 2024 },
  { id: '13', title: 'RMLL Official Rulebook 2024', category: 'Rules & Regulations', year: 2024 },
  { id: '14', title: 'Annual Report 2023', category: 'Reports', year: 2023 },
  { id: '15', title: 'RMLL Official Rulebook 2023', category: 'Rules & Regulations', year: 2023 },
];

// Site pages
const SITE_PAGES: PageItem[] = [
  { id: 'home', title: 'Home', url: '/', category: 'Main' },
  { id: 'schedule', title: 'Schedule', url: '/schedule', category: 'Main' },
  { id: 'standings', title: 'Standings', url: '/standings', category: 'Main' },
  { id: 'teams', title: 'Teams', url: '/teams', category: 'Main' },
  { id: 'stats', title: 'Stats', url: '/stats', category: 'Main' },
  { id: 'news', title: 'News', url: '/news', category: 'Main' },
  { id: 'documents', title: 'Documents', url: '/documents', category: 'Main' },
  { id: 'store', title: 'Store', url: '/store', category: 'Main' },
  { id: 'contact', title: 'Contact', url: '/contact', category: 'Main' },
  { id: 'division-info', title: 'Division Info', url: '/division-info', category: 'Divisions' },
];

// League info hub pages
const LEAGUE_INFO_PAGES: PageItem[] = [
  { id: 'rmll-executive', title: 'RMLL Executive', url: '/league-info#rmll-executive', category: 'About' },
  { id: 'mission-statement', title: 'Mission Statement', url: '/league-info#mission-statement', category: 'About' },
  { id: 'history', title: 'History', url: '/league-info#history', category: 'About' },
  { id: 'awards', title: 'Awards', url: '/league-info#awards', category: 'About' },
  { id: 'affiliate-links', title: 'Affiliate Links', url: '/league-info#affiliate-links', category: 'About' },
  { id: 'code-of-conduct', title: 'Code of Conduct', url: '/league-info#code-of-conduct', category: 'Governance' },
  { id: 'privacy-policy', title: 'Privacy Policy', url: '/league-info#privacy-policy', category: 'Governance' },
  { id: 'bylaws', title: 'Bylaws', url: '/league-info#bylaws', category: 'Governance' },
  { id: 'regulations', title: 'Regulations', url: '/league-info#regulations', category: 'Governance' },
  { id: 'rules-of-play', title: 'Rules of Play', url: '/league-info#rules-of-play', category: 'Governance' },
  { id: 'planning-meeting-agm', title: 'Planning Meeting & AGM', url: '/league-info#planning-meeting-agm', category: 'Governance' },
  { id: 'brand-guidelines', title: 'Brand Guidelines', url: '/league-info#brand-guidelines', category: 'Governance' },
  { id: 'documents-library', title: 'Documents Library', url: '/league-info#documents', category: 'Resources' },
  { id: 'facilities', title: 'Facilities', url: '/league-info#facilities', category: 'Resources' },
  { id: 'lcala-info', title: 'LC & ALA Info', url: '/league-info#lcala-info', category: 'Resources' },
  { id: 'registration', title: 'Intent-to-Play', url: '/league-info#registration', category: 'Players & Coaches' },
  { id: 'new-player-info', title: 'New Player Info', url: '/league-info#new-player-info', category: 'Players & Coaches' },
  { id: 'new-player-info-female', title: 'New Player Info (Female)', url: '/league-info#new-player-info-female', category: 'Players & Coaches' },
  { id: 'graduating-u17-info', title: 'Graduating U17 Info Sessions', url: '/league-info#graduating-u17-info', category: 'Players & Coaches' },
  { id: 'super-coaching-clinic', title: 'Super Coaching Clinic', url: '/league-info#super-coaching-clinic', category: 'Players & Coaches' },
  { id: 'coaching-requirements', title: 'Coaching Requirements', url: '/league-info#coaching-requirements', category: 'Players & Coaches' },
  { id: 'combines', title: 'Combines', url: '/league-info#combines', category: 'Players & Coaches' },
  { id: 'suspensions', title: 'Suspensions', url: '/league-info#suspensions', category: 'Players & Coaches' },
  { id: 'bad-standing', title: 'Bad Standing', url: '/league-info#bad-standing', category: 'Players & Coaches' },
  { id: 'record-books', title: 'Record Books', url: '/league-info#record-books', category: 'Players & Coaches' },
  { id: 'officiating-rulebook', title: 'Rulebook', url: '/league-info#officiating-rulebook', category: 'Officiating' },
  { id: 'officiating-floor-equipment', title: 'Floor & Equipment', url: '/league-info#officiating-floor-equipment', category: 'Officiating' },
  { id: 'officiating-rule-interpretations', title: 'Rule Interpretations', url: '/league-info#officiating-rule-interpretations', category: 'Officiating' },
  { id: 'officiating-off-floor-officials', title: 'Off-Floor Officials', url: '/league-info#officiating-off-floor-officials', category: 'Officiating' },
  { id: 'officiating-application-form', title: 'Application Form', url: '/league-info#officiating-application-form', category: 'Officiating' },
];

const DOCUMENT_CATEGORIES = ['All Categories', 'Rules & Regulations', 'Forms', 'Policies', 'Officials', 'Reports'];

interface LinkInserterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (options: LinkInsertOptions) => void;
  trigger?: React.ReactNode;
}

export function LinkInserter({ open, onOpenChange, onInsert, trigger }: LinkInserterProps) {
  const [docSearch, setDocSearch] = useState('');
  const [pageSearch, setPageSearch] = useState('');
  const [leagueInfoSearch, setLeagueInfoSearch] = useState('');
  const [docCategory, setDocCategory] = useState('All Categories');
  const [customUrl, setCustomUrl] = useState('');
  const [customText, setCustomText] = useState('');
  const [newTab, setNewTab] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ url: string; title?: string } | null>(null);

  // Filter documents
  const filteredDocuments = DOCUMENTS.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(docSearch.toLowerCase());
    const matchesCategory = docCategory === 'All Categories' || doc.category === doc.category;
    return matchesSearch && matchesCategory;
  });

  // Filter site pages
  const filteredSitePages = SITE_PAGES.filter(page =>
    page.title.toLowerCase().includes(pageSearch.toLowerCase())
  );

  // Filter league info pages
  const filteredLeagueInfoPages = LEAGUE_INFO_PAGES.filter(page =>
    page.title.toLowerCase().includes(leagueInfoSearch.toLowerCase())
  );

  // Get icon for category
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'About': return <Briefcase className="w-4 h-4" />;
      case 'Governance': return <Scale className="w-4 h-4" />;
      case 'Resources': return <FileText className="w-4 h-4" />;
      case 'Players & Coaches': return <Users className="w-4 h-4" />;
      case 'Officiating': return <Book className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const selectDocument = (doc: DocumentItem) => {
    setSelectedItem({ url: `/documents/${doc.id}`, title: doc.title });
    setCustomText(doc.title);
  };

  const selectPage = (page: PageItem) => {
    setSelectedItem({ url: page.url, title: page.title });
    setCustomText(page.title);
  };

  const handleInsert = () => {
    if (selectedItem) {
      onInsert({
        url: selectedItem.url,
        title: customText || selectedItem.title,
        newTab,
      });
    } else if (customUrl) {
      onInsert({
        url: customUrl,
        title: customText || customUrl,
        newTab,
      });
    }
  };

  const reset = () => {
    setSelectedItem(null);
    setCustomUrl('');
    setCustomText('');
    setNewTab(false);
    setDocSearch('');
    setPageSearch('');
    setLeagueInfoSearch('');
    setDocCategory('All Categories');
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  return (
    <>
      {trigger}
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Insert Link</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="documents" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="documents">
              <FileText className="w-4 h-4 mr-2" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="pages">
              <MenuIcon className="w-4 h-4 mr-2" />
              Pages
            </TabsTrigger>
            <TabsTrigger value="league-info">
              <Book className="w-4 h-4 mr-2" />
              League Info
            </TabsTrigger>
            <TabsTrigger value="custom">
              <ExternalLink className="w-4 h-4 mr-2" />
              Custom URL
            </TabsTrigger>
          </TabsList>

          {/* Documents Tab */}
          <TabsContent value="documents" className="flex-1 overflow-hidden flex flex-col mt-4">
            <div className="space-y-3 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search documents..."
                  value={docSearch}
                  onChange={(e) => setDocSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {DOCUMENT_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setDocCategory(cat)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${
                      docCategory === cat
                        ? 'bg-[#013fac] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <ScrollArea className="flex-1 border rounded-lg mt-3">
              <div className="p-2 space-y-1">
                {filteredDocuments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No documents found
                  </div>
                ) : (
                  filteredDocuments.map((doc) => (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => selectDocument(doc)}
                      className={`w-full text-left p-3 rounded-lg transition-colors border group ${
                        selectedItem?.url === `/documents/${doc.id}`
                          ? 'bg-[#013fac] text-white border-[#013fac]'
                          : 'hover:bg-gray-100 border-transparent hover:border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded group-hover:transition-colors ${
                            selectedItem?.url === `/documents/${doc.id}`
                              ? 'bg-blue-800'
                              : 'bg-red-50 group-hover:bg-red-100'
                          }`}>
                            <FileText className="w-4 h-4 text-red-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm truncate">
                              {doc.title}
                            </div>
                            <div className={`text-xs flex items-center gap-2 ${
                              selectedItem?.url === `/documents/${doc.id}`
                                ? 'text-blue-200'
                                : 'text-gray-500'
                            }`}>
                              <span>{doc.category}</span>
                              <span>•</span>
                              <span>{doc.year}</span>
                            </div>
                          </div>
                        </div>
                        <ExternalLink className="w-4 h-4" />
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Site Pages Tab */}
          <TabsContent value="pages" className="flex-1 overflow-hidden flex flex-col mt-4">
            <div className="space-y-3 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search pages..."
                  value={pageSearch}
                  onChange={(e) => setPageSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <ScrollArea className="flex-1 border rounded-lg mt-3">
              <div className="p-2 space-y-1">
                {filteredSitePages.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No pages found
                  </div>
                ) : (
                  filteredSitePages.map((page) => (
                    <button
                      key={page.id}
                      type="button"
                      onClick={() => selectPage(page)}
                      className={`w-full text-left p-3 rounded-lg transition-colors border group ${
                        selectedItem?.url === page.url
                          ? 'bg-[#013fac] text-white border-[#013fac]'
                          : 'hover:bg-gray-100 border-transparent hover:border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded group-hover:transition-colors ${
                            selectedItem?.url === page.url
                              ? 'bg-blue-800'
                              : 'bg-blue-50 group-hover:bg-blue-100'
                          }`}>
                            <MenuIcon className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm text-gray-900 truncate">
                              {page.title}
                            </div>
                            <div className={`text-xs ${
                              selectedItem?.url === page.url ? 'text-blue-200' : 'text-gray-500'
                            }`}>
                              {page.category}
                            </div>
                          </div>
                        </div>
                        <ExternalLink className="w-4 h-4" />
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* League Info Tab */}
          <TabsContent value="league-info" className="flex-1 overflow-hidden flex flex-col mt-4">
            <div className="space-y-3 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search league info pages..."
                  value={leagueInfoSearch}
                  onChange={(e) => setLeagueInfoSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <ScrollArea className="flex-1 border rounded-lg mt-3">
              <div className="p-2">
                {(() => {
                  const categories = [...new Set(filteredLeagueInfoPages.map(p => p.category))];
                  return filteredLeagueInfoPages.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No pages found
                    </div>
                  ) : (
                    categories.map((category) => (
                      <div key={category} className="mb-3">
                        <div className="flex items-center gap-2 px-2 py-1 text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                          {getCategoryIcon(category)}
                          {category}
                        </div>
                        <div className="space-y-1">
                          {filteredLeagueInfoPages
                            .filter(p => p.category === category)
                            .map((page) => (
                              <button
                                key={page.id}
                                type="button"
                                onClick={() => selectPage(page)}
                                className={`w-full text-left p-2 rounded-lg transition-colors border group ${
                                  selectedItem?.url === page.url
                                    ? 'bg-[#013fac] text-white border-[#013fac]'
                                    : 'hover:bg-gray-100 border-transparent hover:border-gray-200'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className={`p-1.5 rounded group-hover:transition-colors ${
                                      selectedItem?.url === page.url
                                        ? 'bg-blue-800'
                                        : 'bg-purple-50 group-hover:bg-purple-100'
                                    }`}>
                                      <Book className="w-3 h-3 text-purple-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="font-semibold text-sm text-gray-900 truncate">
                                        {page.title}
                                      </div>
                                      <div className={`text-xs truncate ${
                                        selectedItem?.url === page.url ? 'text-blue-200' : 'text-gray-500'
                                      }`}>
                                        {page.url}
                                      </div>
                                    </div>
                                  </div>
                                  <ExternalLink className="w-4 h-4" />
                                </div>
                              </button>
                            ))}
                        </div>
                      </div>
                    ))
                  );
                })()}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Custom URL Tab */}
          <TabsContent value="custom" className="mt-4 flex-1">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">URL</label>
                <Input
                  placeholder="https://example.com"
                  value={customUrl}
                  onChange={(e) => {
                    setCustomUrl(e.target.value);
                    if (e.target.value && !selectedItem) {
                      setSelectedItem({ url: e.target.value });
                    }
                  }}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Link Text (optional)</label>
                <Input
                  placeholder="Click here"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="newTab"
                  checked={newTab}
                  onCheckedChange={(checked) => setNewTab(checked as boolean)}
                />
                <label htmlFor="newTab" className="text-sm">
                  Open in new tab
                </label>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer with custom options */}
        {selectedItem && (
          <div className="border-t pt-4 mt-4 space-y-3">
            <div>
              <label className="text-sm font-medium">Link Text</label>
              <Input
                placeholder="Link text"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="newTab"
                  checked={newTab}
                  onCheckedChange={(checked) => setNewTab(checked as boolean)}
                />
                <label htmlFor="newTab" className="text-sm">
                  Open in new tab
                </label>
              </div>
              <div className="text-xs text-gray-500">
                {selectedItem.url}
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleInsert} disabled={!selectedItem.url}>
                Insert Link
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}