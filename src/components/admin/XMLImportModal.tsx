import { useState } from 'react';
import { Upload, FileText, CheckCircle, XCircle, Loader2, AlertCircle, FolderTree } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { toast } from 'sonner@2.0.3';
import { createPage } from '../../services/cms-api';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface ParsedPage {
  title: string;
  slug: string;
  content: string;
  meta_description: string;
  category: string;
  confidence: number;
  selected: boolean;
}

interface NavigationSection {
  title: string;
  icon: string;
  items: NavigationItem[];
}

interface NavigationItem {
  id: string;
  label: string;
  slug: string;
}

interface XMLImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export function XMLImportModal({ isOpen, onClose, onImportComplete }: XMLImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [parsedPages, setParsedPages] = useState<ParsedPage[]>([]);
  const [navigationStructure, setNavigationStructure] = useState<NavigationSection[]>([]);
  const [step, setStep] = useState<'upload' | 'review' | 'complete'>('upload');
  const [importResults, setImportResults] = useState<{
    success: number;
    failed: number;
    errors: string[];
  }>({ success: 0, failed: 0, errors: [] });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.xml')) {
        toast.error('Please select an XML file');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleParse = async () => {
    if (!file) return;

    setParsing(true);
    try {
      // Read file content
      const fileContent = await file.text();

      // Send to backend for AI parsing
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9a1ba23f/cms/parse-xml`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ xmlContent: fileContent }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to parse XML');
      }

      const data = await response.json();
      const pages = data.pages.map((page: any) => ({
        ...page,
        selected: true, // Select all pages by default
      }));

      setParsedPages(pages);
      setNavigationStructure(data.navigationStructure || []);
      setStep('review');
      toast.success(`Found ${pages.length} pages to import`);
    } catch (error) {
      console.error('Error parsing XML:', error);
      toast.error('Failed to parse XML file');
    } finally {
      setParsing(false);
    }
  };

  const togglePageSelection = (index: number) => {
    setParsedPages(prev =>
      prev.map((page, i) => i === index ? { ...page, selected: !page.selected } : page)
    );
  };

  const toggleAllPages = () => {
    const allSelected = parsedPages.every(p => p.selected);
    setParsedPages(prev => prev.map(page => ({ ...page, selected: !allSelected })));
  };

  const handleImport = async () => {
    const selectedPages = parsedPages.filter(p => p.selected);
    if (selectedPages.length === 0) {
      toast.error('Please select at least one page to import');
      return;
    }

    setImporting(true);
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Import pages
    for (const page of selectedPages) {
      try {
        await createPage({
          title: page.title,
          slug: page.slug,
          content: page.content,
          meta_description: page.meta_description,
          is_published: false, // Import as draft by default
        });
        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`${page.title}: ${error.message || 'Unknown error'}`);
      }
    }

    // Save navigation structure if we have it
    if (navigationStructure.length > 0 && results.success > 0) {
      try {
        // Filter navigation to only include selected pages
        const selectedSlugs = new Set(selectedPages.map(p => p.slug));
        const filteredNavigation = navigationStructure.map(section => ({
          ...section,
          items: section.items.filter(item => selectedSlugs.has(item.slug) || item.slug === 'documents')
        })).filter(section => section.items.length > 0);

        // Ensure Documents Library is included
        const hasDocuments = filteredNavigation.some(section => 
          section.items.some(item => item.slug === 'documents')
        );
        
        if (!hasDocuments) {
          const resourcesSection = filteredNavigation.find(section => section.title === 'Resources');
          if (resourcesSection) {
            resourcesSection.items.push({
              id: 'documents',
              label: 'Documents Library',
              slug: 'documents'
            });
          } else {
            filteredNavigation.push({
              title: 'Resources',
              icon: 'Wrench',
              items: [{ id: 'documents', label: 'Documents Library', slug: 'documents' }]
            });
          }
        }

        const navResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-9a1ba23f/cms/league-info-navigation`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ navigation: filteredNavigation }),
          }
        );

        if (navResponse.ok) {

        } else {
          console.error('[XML Import] Failed to save navigation structure');
        }
      } catch (error) {
        console.error('[XML Import] Error saving navigation:', error);
      }
    }

    setImportResults(results);
    setImporting(false);
    setStep('complete');

    if (results.success > 0) {
      toast.success(`Successfully imported ${results.success} pages`);
      onImportComplete();
    }
    if (results.failed > 0) {
      toast.error(`Failed to import ${results.failed} pages`);
    }
  };

  const handleClose = () => {
    setFile(null);
    setParsedPages([]);
    setStep('upload');
    setImportResults({ success: 0, failed: 0, errors: [] });
    onClose();
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'About': 'bg-blue-100 text-blue-800',
      'Governance': 'bg-purple-100 text-purple-800',
      'Recognition': 'bg-yellow-100 text-yellow-800',
      'Rules & Policies': 'bg-red-100 text-red-800',
      'Resources': 'bg-green-100 text-green-800',
      'Partners': 'bg-orange-100 text-orange-800',
      'Uncategorized': 'bg-gray-100 text-gray-800',
    };
    return colors[category] || colors['Uncategorized'];
  };

  // Group pages by category
  const pagesByCategory = parsedPages.reduce((acc, page) => {
    if (!acc[page.category]) {
      acc[page.category] = [];
    }
    acc[page.category].push(page);
    return acc;
  }, {} as Record<string, ParsedPage[]>);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Import Pages from XML
          </DialogTitle>
          <DialogDescription>
            Upload an XML sitemap or export file to automatically import static pages with AI-powered categorization
          </DialogDescription>
        </DialogHeader>

        {/* Upload Step */}
        {step === 'upload' && (
          <div className="space-y-6">
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <input
                type="file"
                accept=".xml"
                onChange={handleFileSelect}
                className="hidden"
                id="xml-file-input"
              />
              <label htmlFor="xml-file-input">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('xml-file-input')?.click()}
                  className="cursor-pointer"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Select XML File
                </Button>
              </label>
              {file && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Selected: {file.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              )}
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium mb-1">How it works:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Upload an XML file containing your website's pages</li>
                    <li>AI will parse and categorize each page automatically</li>
                    <li>Review and select which pages to import</li>
                    <li>Pages will be organized into League Info sections</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleParse}
                disabled={!file || parsing}
                className="bg-[#013fac] hover:bg-[#0149c9]"
              >
                {parsing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Parsing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Parse & Categorize
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Review Step */}
        {step === 'review' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Found <span className="font-semibold">{parsedPages.length}</span> pages
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {parsedPages.filter(p => p.selected).length} selected for import
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={toggleAllPages}>
                {parsedPages.every(p => p.selected) ? 'Deselect All' : 'Select All'}
              </Button>
            </div>

            {/* Grouped by Category */}
            <div className="space-y-6 max-h-[500px] overflow-y-auto">
              {Object.entries(pagesByCategory).map(([category, pages]) => (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-3">
                    <FolderTree className="w-4 h-4 text-gray-500" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">{category}</h3>
                    <Badge className={getCategoryColor(category)}>
                      {pages.length} {pages.length === 1 ? 'page' : 'pages'}
                    </Badge>
                  </div>
                  <div className="space-y-2 pl-6">
                    {pages.map((page, pageIndex) => {
                      const globalIndex = parsedPages.indexOf(page);
                      return (
                        <Card
                          key={globalIndex}
                          className={`cursor-pointer transition-all ${
                            page.selected ? 'ring-2 ring-[#013fac]' : 'opacity-60'
                          }`}
                          onClick={() => togglePageSelection(globalIndex)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                checked={page.selected}
                                onChange={() => togglePageSelection(globalIndex)}
                                onClick={(e) => e.stopPropagation()}
                                className="mt-1 h-4 w-4 text-[#013fac] rounded focus:ring-[#013fac]"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium text-gray-900 dark:text-white">
                                    {page.title}
                                  </h4>
                                  <Badge variant="outline" className="text-xs">
                                    {Math.round(page.confidence * 100)}% match
                                  </Badge>
                                </div>
                                <p className="text-xs text-gray-500 mb-2">/{page.slug}</p>
                                {page.meta_description && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                    {page.meta_description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setStep('upload')}>
                Back
              </Button>
              <Button
                onClick={handleImport}
                disabled={importing || parsedPages.filter(p => p.selected).length === 0}
                className="bg-[#013fac] hover:bg-[#0149c9]"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Import {parsedPages.filter(p => p.selected).length} Pages
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Complete Step */}
        {step === 'complete' && (
          <div className="space-y-6">
            <div className="text-center py-8">
              {importResults.success > 0 && importResults.failed === 0 ? (
                <>
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Import Complete!
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Successfully imported {importResults.success} pages
                  </p>
                </>
              ) : (
                <>
                  <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Import Completed with Issues
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {importResults.success} succeeded, {importResults.failed} failed
                  </p>
                </>
              )}
            </div>

            {importResults.errors.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="font-medium text-red-800 dark:text-red-200 mb-2">Errors:</p>
                <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                  {importResults.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Next steps:</strong> All imported pages are in draft status. Review and publish them from the Pages list.
                Pages will automatically appear in the League Info hub based on their categories.
              </p>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleClose} className="bg-[#013fac] hover:bg-[#0149c9]">
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}