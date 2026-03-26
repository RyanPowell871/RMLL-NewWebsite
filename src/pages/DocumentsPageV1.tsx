import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Search, FileText, Download, Calendar, X, ChevronRight, Menu, FolderOpen } from 'lucide-react';
import { useState } from 'react';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../components/ui/sheet';
import { ScrollArea } from '../components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

interface Document {
  id: string;
  title: string;
  category: string;
  date: string;
  year: number;
  type: string;
  size: string;
  description: string;
  content?: string;
}

const documents: Document[] = [
  {
    id: '1',
    title: 'RMLL Official Rulebook 2025',
    category: 'Rules & Regulations',
    date: 'Jan 15, 2025',
    year: 2025,
    type: 'PDF',
    size: '2.4 MB',
    description: 'Complete rulebook for the 2025 RMLL season including all divisions.',
    content: 'Official rules and regulations for Rocky Mountain Lacrosse League 2025 season...'
  },
  {
    id: '2',
    title: 'Player Registration Form',
    category: 'Forms',
    date: 'Jan 10, 2025',
    year: 2025,
    type: 'PDF',
    size: '156 KB',
    description: 'Required registration form for all players.',
    content: 'Player registration and waiver form...'
  },
  {
    id: '3',
    title: 'Code of Conduct',
    category: 'Policies',
    date: 'Jan 5, 2025',
    year: 2025,
    type: 'PDF',
    size: '345 KB',
    description: 'Player and spectator code of conduct.',
    content: 'RMLL Code of Conduct for players, coaches, and spectators...'
  },
  {
    id: '4',
    title: 'League Bylaws',
    category: 'Rules & Regulations',
    date: 'Dec 20, 2024',
    year: 2024,
    type: 'PDF',
    size: '1.8 MB',
    description: 'RMLL organizational bylaws and governance structure.',
    content: 'Rocky Mountain Lacrosse League Bylaws and Constitution...'
  },
  {
    id: '5',
    title: 'Referee Guidelines',
    category: 'Officials',
    date: 'Dec 15, 2024',
    year: 2024,
    type: 'PDF',
    size: '876 KB',
    description: 'Guidelines and best practices for RMLL referees.',
    content: 'Official referee guidelines and game management protocols...'
  },
  {
    id: '6',
    title: 'Safety Protocol',
    category: 'Policies',
    date: 'Dec 10, 2024',
    year: 2024,
    type: 'PDF',
    size: '542 KB',
    description: 'Safety guidelines and emergency procedures.',
    content: 'RMLL safety protocols and emergency response procedures...'
  },
  {
    id: '7',
    title: 'Team Registration Package',
    category: 'Forms',
    date: 'Dec 1, 2024',
    year: 2024,
    type: 'PDF',
    size: '234 KB',
    description: 'Complete package for team registration.',
    content: 'Team registration forms and requirements...'
  },
  {
    id: '8',
    title: 'Playoff Format Guide',
    category: 'Rules & Regulations',
    date: 'Nov 25, 2024',
    year: 2024,
    type: 'PDF',
    size: '678 KB',
    description: 'Playoff structure and tournament format.',
    content: 'RMLL playoff format and championship tournament structure...'
  },
  {
    id: '9',
    title: 'Coaching Certification Requirements',
    category: 'Officials',
    date: 'Nov 20, 2024',
    year: 2024,
    type: 'PDF',
    size: '445 KB',
    description: 'Requirements for coaching certification.',
    content: 'Coaching certification and training requirements...'
  },
  {
    id: '10',
    title: 'Financial Report 2024',
    category: 'Reports',
    date: 'Nov 15, 2024',
    year: 2024,
    type: 'PDF',
    size: '1.2 MB',
    description: 'Annual financial report for 2024 season.',
    content: 'RMLL 2024 Annual Financial Report...'
  },
  {
    id: '11',
    title: 'Equipment Standards',
    category: 'Rules & Regulations',
    date: 'Nov 10, 2024',
    year: 2024,
    type: 'PDF',
    size: '567 KB',
    description: 'Required equipment standards and specifications.',
    content: 'Official equipment standards and safety requirements...'
  },
  {
    id: '12',
    title: 'Volunteer Application',
    category: 'Forms',
    date: 'Nov 5, 2024',
    year: 2024,
    type: 'PDF',
    size: '189 KB',
    description: 'Application form for league volunteers.',
    content: 'RMLL volunteer application and background check...'
  },
  {
    id: '13',
    title: 'RMLL Official Rulebook 2024',
    category: 'Rules & Regulations',
    date: 'Jan 12, 2024',
    year: 2024,
    type: 'PDF',
    size: '2.2 MB',
    description: 'Complete rulebook for the 2024 RMLL season.',
    content: 'Official rules and regulations for Rocky Mountain Lacrosse League 2024 season...'
  },
  {
    id: '14',
    title: 'Annual Report 2023',
    category: 'Reports',
    date: 'Dec 15, 2023',
    year: 2023,
    type: 'PDF',
    size: '3.1 MB',
    description: 'Complete annual report for 2023 season.',
    content: 'RMLL 2023 Annual Report...'
  },
  {
    id: '15',
    title: 'RMLL Official Rulebook 2023',
    category: 'Rules & Regulations',
    date: 'Jan 18, 2023',
    year: 2023,
    type: 'PDF',
    size: '2.1 MB',
    description: 'Complete rulebook for the 2023 RMLL season.',
    content: 'Official rules and regulations for Rocky Mountain Lacrosse League 2023 season...'
  },
];

const categories = [
  'All Categories',
  'Rules & Regulations',
  'Forms',
  'Policies',
  'Officials',
  'Reports'
];

const years = ['All Years', '2025', '2024', '2023'];

export function DocumentsPageV1() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedYear, setSelectedYear] = useState('All Years');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(documents[0]);
  const [mobileView, setMobileView] = useState<'list' | 'preview'>('list');

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All Categories' || doc.category === selectedCategory;
    const matchesYear = selectedYear === 'All Years' || doc.year.toString() === selectedYear;
    return matchesSearch && matchesCategory && matchesYear;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main>
        {/* Page Header */}
        <section className="bg-gradient-to-r from-[#0F2942] to-[#1a3a5c] text-white py-8 sm:py-12">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
            <div className="flex items-center gap-2 text-sm mb-3 text-gray-300">
              <span>Home</span>
              <ChevronRight className="w-4 h-4" />
              <span className="text-white">Documents</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl mb-2">Document Library</h1>
            <p className="text-base text-gray-300 max-w-3xl">
              Access league rules, forms, policies, and official documents
            </p>
          </div>
        </section>

        {/* Main Content Area */}
        <section className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 pb-16 min-h-[calc(100vh-400px)]">
          {/* Mobile Tabs */}
          <div className="lg:hidden mb-4">
            <Tabs value={mobileView} onValueChange={(v) => setMobileView(v as 'list' | 'preview')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="list">Documents ({filteredDocuments.length})</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex gap-6">
            {/* Left Column - Navigation */}
            <aside className={`${mobileView === 'list' ? 'block' : 'hidden'} lg:block w-full lg:w-64 bg-white rounded-lg border border-gray-200 shadow-sm h-fit lg:sticky lg:top-24 flex-shrink-0`}>
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Search</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-10"
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

              <div className="p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Categories</h3>
                <div className="space-y-1">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm font-semibold transition-colors ${
                        selectedCategory === category
                          ? 'text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      style={selectedCategory === category ? { backgroundColor: 'var(--color-accent)' } : {}}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            {/* Middle Column - Document Cards */}
            <div className={`${mobileView === 'list' ? 'block' : 'hidden'} lg:block w-full lg:w-72 flex-shrink-0`}>
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm h-[700px] flex flex-col overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex-shrink-0 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Documents ({filteredDocuments.length})
                    </h3>
                  </div>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Filter by year" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <ScrollArea className="flex-1 overflow-y-auto">
                  <div className="p-3 space-y-2">
                    {filteredDocuments.map((doc) => (
                      <button
                        key={doc.id}
                        onClick={() => {
                          setSelectedDocument(doc);
                          setMobileView('preview');
                        }}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                          selectedDocument?.id === doc.id
                            ? 'shadow-md'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                        style={selectedDocument?.id === doc.id ? { 
                          borderColor: 'var(--color-accent)',
                          backgroundColor: 'var(--color-accent)15'
                        } : {}}
                      >
                        <div className="flex items-center gap-2">
                          <div 
                            className="p-2 rounded flex-shrink-0"
                            style={selectedDocument?.id === doc.id ? { backgroundColor: 'var(--color-accent)' } : { backgroundColor: '#fef2f2' }}
                          >
                            <FileText className={`w-4 h-4 ${
                              selectedDocument?.id === doc.id ? 'text-white' : 'text-red-600'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-sm text-gray-900 line-clamp-2">
                              {doc.title}
                            </h4>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {doc.type} • {doc.size}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>

            {/* Right Column - Preview Area */}
            <div className={`${mobileView === 'preview' ? 'block' : 'hidden'} lg:block flex-1`}>
              {selectedDocument ? (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm h-[700px] flex flex-col">
                  {/* Document Header */}
                  <div className="p-6 border-b border-gray-200 flex-shrink-0">
                    <button
                      onClick={() => setMobileView('list')}
                      className="lg:hidden mb-4 text-sm font-semibold flex items-center gap-1"
                      style={{ color: 'var(--color-accent)' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-accent-dark)'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-accent)'}
                    >
                      <ChevronRight className="w-4 h-4 rotate-180" />
                      Back to Documents
                    </button>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-3 bg-red-50 rounded-lg">
                            <FileText className="w-8 h-8 text-red-600" />
                          </div>
                          <Badge className="text-white" style={{ backgroundColor: 'var(--color-accent)' }}>{selectedDocument.category}</Badge>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black text-gray-900 mb-2">
                          {selectedDocument.title}
                        </h2>
                        <p className="text-sm text-gray-600 mb-3">{selectedDocument.description}</p>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            <span>{selectedDocument.date}</span>
                          </div>
                          <span>•</span>
                          <span>{selectedDocument.type}</span>
                          <span>•</span>
                          <span>{selectedDocument.size}</span>
                        </div>
                      </div>
                      <button 
                        className="px-4 py-2 text-white rounded-lg flex items-center gap-2 font-bold transition-colors shadow-md flex-shrink-0"
                        style={{ backgroundColor: 'var(--color-accent)' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-accent-dark)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-accent)'}
                      >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">Download</span>
                      </button>
                    </div>
                  </div>

                  {/* Document Preview */}
                  <ScrollArea className="flex-1">
                    <div className="p-6">
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                        <div className="prose max-w-none">
                          <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap mb-6">
                            {selectedDocument.content}
                          </p>
                          <div className="mt-6 p-6 bg-white border-2 border-dashed border-gray-300 rounded-lg text-center">
                            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <h3 className="font-bold text-gray-900 mb-2">Full Document Preview</h3>
                            <p className="text-gray-600 text-sm mb-4">
                              Download the complete document to view all content
                            </p>
                            <button 
                              className="px-5 py-2 text-white rounded-lg flex items-center gap-2 font-bold transition-colors mx-auto"
                              style={{ backgroundColor: 'var(--color-accent)' }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-accent-dark)'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-accent)'}
                            >
                              <Download className="w-4 h-4" />
                              Download {selectedDocument.type}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm h-[700px] flex items-center justify-center p-12 text-center">
                  <div>
                    <FolderOpen className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-black text-gray-900 mb-2">No Document Selected</h3>
                    <p className="text-gray-600">Select a document from the list to view its contents</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}