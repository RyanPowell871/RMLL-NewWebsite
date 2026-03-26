import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Download,
  Filter,
  FileCode,
  Sparkles,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { uploadDocument } from '../../services/cms-api';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { 
  DOCUMENT_CATEGORIES,
  getCategoryPath,
  getCategoryLabel,
  getSubcategoryLabel,
  analyzeDocumentByFilename,
  detectYear,
  type CategoryStructure 
} from '../../utils/document-analyzer';

interface ParsedDocument {
  id: string;
  url: string;
  title: string;
  filename: string;
  fileType: string;
  category: string;
  subcategory?: string;
  confidence?: 'high' | 'medium' | 'low';
  status: 'pending' | 'downloading' | 'uploading' | 'success' | 'error' | 'duplicate';
  progress: number;
  error?: string;
  originalData?: any;
  year?: number;
}

interface XMLDocumentImporterProps {
  onComplete?: () => void;
}

export function XMLDocumentImporter({ onComplete }: XMLDocumentImporterProps) {
  const [xmlContent, setXmlContent] = useState('');
  const [documents, setDocuments] = useState<ParsedDocument[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showRawXml, setShowRawXml] = useState(false);

  // Document extensions we want to import (not images)
  const DOCUMENT_EXTENSIONS = [
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
    'txt', 'csv', 'rtf', 'odt', 'ods', 'odp'
  ];

  // Generate clean title from filename
  const generateTitle = useCallback((filename: string): string => {
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
    let title = nameWithoutExt.replace(/[_-]/g, ' ');
    title = title.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
    return title;
  }, []);

  // Parse XML content to extract documents
  const parseXML = useCallback(() => {
    if (!xmlContent.trim()) {
      toast.error('Please paste XML content first');
      return;
    }

    setIsParsing(true);
    
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
      
      // Check for parsing errors
      const parserError = xmlDoc.querySelector('parsererror');
      if (parserError) {
        throw new Error('Invalid XML format');
      }

      const parsedDocs: ParsedDocument[] = [];
      
      // Try multiple common XML structures
      // WordPress export format
      const wpItems = xmlDoc.querySelectorAll('item');
      wpItems.forEach((item) => {
        const attachmentUrl = item.querySelector('attachment_url, guid')?.textContent;
        const title = item.querySelector('title')?.textContent;
        const filename = item.querySelector('post_name, wp\\:post_name')?.textContent;
        
        if (attachmentUrl) {
          const ext = attachmentUrl.split('.').pop()?.toLowerCase() || '';
          if (DOCUMENT_EXTENSIONS.includes(ext)) {
            parsedDocs.push({
              id: crypto.randomUUID(),
              url: attachmentUrl,
              title: title || generateTitle(attachmentUrl.split('/').pop() || 'document'),
              filename: filename || attachmentUrl.split('/').pop() || 'document',
              fileType: ext,
              category: 'other', // Default category
              status: 'pending',
              progress: 0,
              originalData: {
                title,
                filename,
                url: attachmentUrl
              }
            });
          }
        }
      });

      // Generic attachment/media format
      const mediaItems = xmlDoc.querySelectorAll('attachment, media, file, document');
      mediaItems.forEach((item) => {
        const url = item.getAttribute('url') || 
                   item.getAttribute('href') || 
                   item.querySelector('url, href, link')?.textContent;
        const title = item.getAttribute('title') || 
                     item.querySelector('title, name')?.textContent;
        const filename = item.getAttribute('filename') || 
                        item.querySelector('filename')?.textContent;
        
        if (url) {
          const ext = url.split('.').pop()?.toLowerCase() || '';
          if (DOCUMENT_EXTENSIONS.includes(ext)) {
            parsedDocs.push({
              id: crypto.randomUUID(),
              url: url,
              title: title || generateTitle(url.split('/').pop() || 'document'),
              filename: filename || url.split('/').pop() || 'document',
              fileType: ext,
              category: 'other', // Default category
              status: 'pending',
              progress: 0,
              originalData: { title, filename, url }
            });
          }
        }
      });

      // Direct link elements
      const links = xmlDoc.querySelectorAll('link[href], a[href]');
      links.forEach((link) => {
        const url = link.getAttribute('href');
        if (url) {
          const ext = url.split('.').pop()?.toLowerCase() || '';
          if (DOCUMENT_EXTENSIONS.includes(ext)) {
            // Check if already added
            if (!parsedDocs.find(d => d.url === url)) {
              parsedDocs.push({
                id: crypto.randomUUID(),
                url: url,
                title: generateTitle(url.split('/').pop() || 'document'),
                filename: url.split('/').pop() || 'document',
                fileType: ext,
                category: 'other', // Default category
                status: 'pending',
                progress: 0,
                originalData: { url }
              });
            }
          }
        }
      });

      if (parsedDocs.length === 0) {
        toast.error('No documents found in XML. Only images were detected or XML format not recognized.');
        setIsParsing(false);
        return;
      }

      // AI-powered categorization for all documents

      const categorizedDocs = parsedDocs.map((doc) => {
        const analysis = analyzeDocumentByFilename(doc.filename, doc.url);
        const year = detectYear(doc.filename, doc.url);
        return {
          ...doc,
          category: analysis.category,
          subcategory: analysis.subcategory,
          confidence: analysis.confidence,
          year: year,
        };
      });

      setDocuments(categorizedDocs);
      
      // Count high-confidence categorizations
      const highConfidenceCount = categorizedDocs.filter(d => d.confidence === 'high').length;
      
      toast.success(
        `Found ${parsedDocs.length} document${parsedDocs.length > 1 ? 's' : ''}. ` +
        `${highConfidenceCount} categorized with high confidence.`
      );
      
    } catch (error) {
      console.error('Error parsing XML:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to parse XML');
    }
    
    setIsParsing(false);
  }, [xmlContent, generateTitle, DOCUMENT_EXTENSIONS]);

  // Import all documents
  const importDocuments = async () => {
    if (documents.length === 0) {
      toast.error('No documents to import');
      return;
    }

    setIsImporting(true);
    let successCount = 0;
    let errorCount = 0;

    for (const doc of documents) {
      if (doc.status === 'success') continue;

      try {
        // Update status to downloading
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === doc.id ? { ...d, status: 'downloading', progress: 30 } : d
          )
        );

        // Use server proxy to download the file and upload to storage (bypasses CORS)
        const proxyResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-9a1ba23f/proxy-download`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${publicAnonKey}`,
            },
            body: JSON.stringify({ 
              url: doc.url,
              filename: doc.filename
            }),
          }
        );

        if (!proxyResponse.ok) {
          const errorData = await proxyResponse.json();
          throw new Error(errorData.error || `HTTP ${proxyResponse.status}`);
        }

        const proxyData = await proxyResponse.json();

        // Update status to creating record
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === doc.id ? { ...d, status: 'uploading', progress: 70 } : d
          )
        );

        // Create document record in database with the storage path
        const createResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-9a1ba23f/documents`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${publicAnonKey}`,
            },
            body: JSON.stringify({
              title: doc.title,
              description: `Imported from old site - ${getCategoryPath(doc.category, doc.subcategory)}`,
              category: doc.category,
              subcategory: doc.subcategory || null,
              document_year: doc.year || null,
              file_url: proxyData.publicUrl,
              file_name: proxyData.filename,
              file_size: proxyData.size,
              file_type: proxyData.contentType,
              is_public: true,
            }),
          }
        );

        if (!createResponse.ok) {
          const errorData = await createResponse.json();
          
          // Check if it's a duplicate
          if (createResponse.status === 409 && errorData.duplicate) {

            setDocuments((prev) =>
              prev.map((d) =>
                d.id === doc.id ? { ...d, status: 'duplicate', progress: 100 } : d
              )
            );
            continue; // Skip to next document
          }
          
          throw new Error(errorData.error || 'Failed to create document record');
        }

        setDocuments((prev) =>
          prev.map((d) =>
            d.id === doc.id ? { ...d, status: 'success', progress: 100 } : d
          )
        );

        successCount++;
        
      } catch (error) {
        console.error('Error importing document:', error);
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === doc.id
              ? {
                  ...d,
                  status: 'error',
                  error: error instanceof Error ? error.message : 'Import failed',
                }
              : d
          )
        );
        errorCount++;
      }
    }

    setIsImporting(false);

    if (successCount > 0) {
      toast.success(`Successfully imported ${successCount} document${successCount > 1 ? 's' : ''}`);
    }
    if (errorCount > 0) {
      toast.error(`Failed to import ${errorCount} document${errorCount > 1 ? 's' : ''}`);
    }

    if (successCount > 0 && onComplete) {
      onComplete();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setXmlContent(content);
      toast.success('XML file loaded');
    };
    reader.onerror = () => {
      toast.error('Failed to read file');
    };
    reader.readAsText(file);
  };

  const overallProgress = documents.length > 0
    ? documents.reduce((sum, d) => sum + d.progress, 0) / documents.length
    : 0;

  const pendingCount = documents.filter((d) => d.status === 'pending').length;
  const successCount = documents.filter((d) => d.status === 'success').length;
  const errorCount = documents.filter((d) => d.status === 'error').length;
  const duplicateCount = documents.filter((d) => d.status === 'duplicate').length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Documents from XML</CardTitle>
        <CardDescription>
          Import documents from your old site's XML export. Images will be automatically filtered out.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* XML Input Section */}
        {documents.length === 0 && (
          <div className="space-y-4">
            {/* File Upload Option */}
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => document.getElementById('xml-file-input')?.click()}
              >
                <Upload className="w-4 h-4" />
                Upload XML File
              </Button>
              <span className="text-sm text-gray-500">or paste XML content below</span>
              <input
                id="xml-file-input"
                type="file"
                accept=".xml,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Supported Formats Info */}
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <FileCode className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                    Supported Formats
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                    Works with WordPress exports, custom XML exports, and generic media lists.
                  </p>
                  <div className="text-xs text-blue-600 dark:text-blue-400">
                    <strong>Document types:</strong> PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV, RTF, ODT, ODS, ODP
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    <strong>Filtered out:</strong> Images (JPG, PNG, GIF, SVG, etc.)
                  </div>
                </div>
              </div>
            </div>

            {/* XML Textarea */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">XML Content</label>
                {xmlContent && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowRawXml(!showRawXml)}
                  >
                    {showRawXml ? 'Hide' : 'Show'} Raw XML
                  </Button>
                )}
              </div>
              <Textarea
                value={xmlContent}
                onChange={(e) => setXmlContent(e.target.value)}
                placeholder="Paste your XML content here..."
                rows={showRawXml ? 15 : 8}
                className="font-mono text-xs"
              />
            </div>

            {/* Parse Button */}
            <Button
              onClick={parseXML}
              disabled={!xmlContent.trim() || isParsing}
              className="w-full flex items-center justify-center gap-2"
            >
              {isParsing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Parsing XML...
                </>
              ) : (
                <>
                  <Filter className="w-4 h-4" />
                  Parse & Extract Documents
                </>
              )}
            </Button>
          </div>
        )}

        {/* Documents List */}
        {documents.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">
                  Found {documents.length} Document{documents.length > 1 ? 's' : ''}
                </h3>
                <p className="text-sm text-gray-500">
                  Images have been automatically filtered out
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setDocuments([]);
                    setXmlContent('');
                  }}
                  disabled={isImporting}
                >
                  Reset
                </Button>
                <Button
                  size="sm"
                  onClick={importDocuments}
                  disabled={isImporting || pendingCount === 0}
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Import All ({pendingCount})
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Overall Progress */}
            {isImporting && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Overall Progress</span>
                  <span>{Math.round(overallProgress)}%</span>
                </div>
                <Progress value={overallProgress} />
              </div>
            )}

            {/* Status Summary */}
            <div className="flex gap-4 text-sm">
              {pendingCount > 0 && (
                <Badge variant="outline">
                  {pendingCount} Pending
                </Badge>
              )}
              {successCount > 0 && (
                <Badge className="bg-green-500">
                  {successCount} Imported
                </Badge>
              )}
              {errorCount > 0 && (
                <Badge variant="destructive">
                  {errorCount} Failed
                </Badge>
              )}
              {duplicateCount > 0 && (
                <Badge variant="secondary">
                  {duplicateCount} Duplicates
                </Badge>
              )}
            </div>

            {/* Individual Documents */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {documents.map((doc) => (
                <Card key={doc.id} className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Status Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {doc.status === 'success' && (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      )}
                      {doc.status === 'duplicate' && (
                        <AlertTriangle className="w-5 h-5 text-yellow-500" />
                      )}
                      {doc.status === 'error' && (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                      {(doc.status === 'downloading' || doc.status === 'uploading') && (
                        <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                      )}
                      {doc.status === 'pending' && (
                        <FileText className="w-5 h-5 text-gray-400" />
                      )}
                    </div>

                    {/* Document Info */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium">{doc.title}</p>
                          <Badge variant="secondary" className="text-xs">
                            {doc.fileType.toUpperCase()}
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              doc.confidence === 'high' 
                                ? 'border-green-500 text-green-700 dark:text-green-400' 
                                : doc.confidence === 'medium'
                                ? 'border-blue-500 text-blue-700 dark:text-blue-400'
                                : 'border-gray-400 text-gray-600 dark:text-gray-400'
                            }`}
                          >
                            <Sparkles className="w-3 h-3 mr-1" />
                            {getCategoryPath(doc.category, doc.subcategory)}
                          </Badge>
                          {doc.confidence && (
                            <Badge 
                              variant="secondary" 
                              className={`text-xs ${
                                doc.confidence === 'high' 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                  : doc.confidence === 'medium'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                              }`}
                            >
                              {doc.confidence}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          {doc.url}
                        </p>
                      </div>

                      {/* Progress Bar */}
                      {(doc.status === 'downloading' || doc.status === 'uploading') && (
                        <div className="space-y-1">
                          <Progress value={doc.progress} className="h-2" />
                          <p className="text-xs text-gray-500">
                            {doc.status === 'downloading' ? 'Downloading from old site...' : 'Uploading to new system...'}
                          </p>
                        </div>
                      )}

                      {/* Error Message */}
                      {doc.status === 'error' && doc.error && (
                        <p className="text-sm text-red-500">{doc.error}</p>
                      )}

                      {/* Success Message */}
                      {doc.status === 'success' && (
                        <p className="text-sm text-green-600">
                          Successfully imported and categorized as "{getCategoryPath(doc.category, doc.subcategory)}"
                        </p>
                      )}
                      
                      {/* Duplicate Message */}
                      {doc.status === 'duplicate' && (
                        <p className="text-sm text-yellow-600">
                          Document already exists - skipped
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}