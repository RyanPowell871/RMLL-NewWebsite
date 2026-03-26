import { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { 
  Upload, 
  X, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  FolderOpen,
  Sparkles,
  HelpCircle,
  Target
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { uploadDocument } from '../../services/cms-api';
import { 
  analyzeDocument, 
  getCategoryPath,
  getCategoryLabel,
  getSubcategoryLabel,
  detectYear,
  DOCUMENT_CATEGORIES,
  type AnalysisResult
} from '../../utils/document-analyzer';

interface UploadingFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'categorizing' | 'success' | 'error';
  progress: number;
  category?: string;
  subcategory?: string;
  suggestedCategory?: string;
  suggestedSubcategory?: string;
  confidence?: 'high' | 'medium' | 'low';
  error?: string;
  title?: string;
  description?: string;
  analysis?: AnalysisResult;
}

interface BulkDocumentUploaderProps {
  onComplete?: () => void;
}

export function BulkDocumentUploader({ onComplete }: BulkDocumentUploaderProps) {
  const [files, setFiles] = useState<UploadingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [autoCategorizationEnabled, setAutoCategorizationEnabled] = useState(true);
  const [showCategorizationGuide, setShowCategorizationGuide] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Categorization guide
  const categorizationGuide = {
    'rules': {
      keywords: ['rule', 'regulation', 'guideline'],
      examples: ['RMLL Rules 2025.pdf', 'Player Conduct Guidelines.pdf']
    },
    'forms': {
      keywords: ['form', 'application', 'registration'],
      examples: ['Player Registration Form.pdf', 'Waiver Form.docx']
    },
    'policies': {
      keywords: ['policy', 'procedure', 'code of conduct'],
      examples: ['Code of Conduct Policy.pdf', 'Harassment Policy.pdf']
    },
    'minutes': {
      keywords: ['minute', 'meeting', 'agm', 'board'],
      examples: ['Board Meeting Minutes Jan 2025.pdf', 'AGM Minutes.pdf']
    },
    'bylaws': {
      keywords: ['bylaw', 'constitution', 'charter'],
      examples: ['RMLL Bylaws.pdf', 'League Constitution.pdf']
    },
    'schedules': {
      keywords: ['schedule', 'calendar', 'fixture'],
      examples: ['2025 Season Schedule.pdf', 'Game Calendar.xlsx']
    },
    'roster': {
      keywords: ['roster', 'lineup', 'team list'],
      examples: ['Team Roster 2025.pdf', 'Player Lineup.xlsx']
    },
    'other': {
      keywords: ['other documents'],
      examples: ['Miscellaneous Document.pdf']
    }
  };

  // AI-powered categorization based on filename and content type
  const categorizeDocument = useCallback((filename: string, fileType: string): string => {
    const lowerName = filename.toLowerCase();
    
    // Rules & Regulations
    if (lowerName.includes('rule') || lowerName.includes('regulation') || lowerName.includes('guideline')) {
      return 'rules';
    }
    
    // Forms
    if (lowerName.includes('form') || lowerName.includes('application') || lowerName.includes('registration')) {
      return 'forms';
    }
    
    // Policies
    if (lowerName.includes('policy') || lowerName.includes('procedure') || lowerName.includes('code of conduct')) {
      return 'policies';
    }
    
    // Meeting Minutes
    if (lowerName.includes('minute') || lowerName.includes('meeting') || lowerName.includes('agm') || lowerName.includes('board')) {
      return 'minutes';
    }
    
    // Bylaws
    if (lowerName.includes('bylaw') || lowerName.includes('constitution') || lowerName.includes('charter')) {
      return 'bylaws';
    }
    
    // Schedules
    if (lowerName.includes('schedule') || lowerName.includes('calendar') || lowerName.includes('fixture')) {
      return 'schedules';
    }
    
    // Rosters
    if (lowerName.includes('roster') || lowerName.includes('lineup') || lowerName.includes('team list')) {
      return 'roster';
    }
    
    // Default to 'other'
    return 'other';
  }, []);

  // Generate title from filename
  const generateTitle = useCallback((filename: string): string => {
    // Remove extension
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
    
    // Replace underscores and hyphens with spaces
    let title = nameWithoutExt.replace(/[_-]/g, ' ');
    
    // Capitalize first letter of each word
    title = title.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
    
    return title;
  }, []);

  // Generate description based on category
  const generateDescription = useCallback((category: string, filename: string): string => {
    const categoryDescriptions: Record<string, string> = {
      'rules': 'Official league rules and regulations',
      'forms': 'Administrative form',
      'policies': 'League policy document',
      'minutes': 'Meeting minutes',
      'bylaws': 'League bylaw document',
      'schedules': 'Schedule document',
      'roster': 'Team roster',
      'other': 'League document'
    };
    
    return categoryDescriptions[category] || 'League document';
  }, []);

  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: UploadingFile[] = Array.from(selectedFiles).map((file) => {
      // Use advanced analyzer if auto-categorization is enabled
      let analysis: AnalysisResult | undefined;
      let category = 'other';
      let subcategory: string | undefined;
      let title = generateTitle(file.name);
      let description = 'League document';
      let confidence: 'high' | 'medium' | 'low' | undefined;

      if (autoCategorizationEnabled) {
        analysis = analyzeDocument(file);
        category = analysis.category;
        subcategory = analysis.subcategory;
        title = analysis.suggestedTitle;
        description = analysis.suggestedDescription;
        confidence = analysis.confidence;
      }

      return {
        file,
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        status: 'pending' as const,
        progress: 0,
        category,
        subcategory,
        suggestedCategory: autoCategorizationEnabled ? category : undefined,
        suggestedSubcategory: autoCategorizationEnabled ? subcategory : undefined,
        confidence,
        title,
        description,
        analysis,
      };
    });

    setFiles((prev) => [...prev, ...newFiles]);
    
    // Show analysis summary if auto-categorization is on
    if (autoCategorizationEnabled && newFiles.length > 0) {
      const highConfidence = newFiles.filter(f => f.confidence === 'high').length;
      const mediumConfidence = newFiles.filter(f => f.confidence === 'medium').length;
      
      toast.success(`Analyzed ${newFiles.length} files - ${highConfidence} high confidence, ${mediumConfidence} medium confidence`);
    }
  }, [autoCategorizationEnabled, generateTitle]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const updateFileCategory = useCallback((id: string, category: string) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, category, description: generateDescription(category, f.file.name) } : f
      )
    );
  }, [generateDescription]);

  const updateFileTitle = useCallback((id: string, title: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, title } : f))
    );
  }, []);

  const uploadAllFiles = async () => {
    if (files.length === 0) {
      toast.error('No files selected');
      return;
    }

    setIsUploading(true);
    let successCount = 0;
    let errorCount = 0;

    for (const fileData of files) {
      if (fileData.status === 'success') continue;

      try {
        // Update status to uploading
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileData.id ? { ...f, status: 'uploading', progress: 10 } : f
          )
        );

        // Simulate progress
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileData.id ? { ...f, progress: 50 } : f
          )
        );

        // Upload document
        await uploadDocument({
          file: fileData.file,
          title: fileData.title || fileData.file.name,
          description: fileData.description || '',
          category: fileData.category || 'other',
          subcategory: fileData.analysis?.subcategory || null,
          document_year: fileData.analysis?.detectedYear || null,
          is_public: true,
        });

        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileData.id ? { ...f, status: 'success', progress: 100 } : f
          )
        );

        successCount++;
      } catch (error) {
        console.error('Error uploading file:', error);
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileData.id
              ? {
                  ...f,
                  status: 'error',
                  error: error instanceof Error ? error.message : 'Upload failed',
                }
              : f
          )
        );
        errorCount++;
      }
    }

    setIsUploading(false);

    if (successCount > 0) {
      toast.success(`Successfully uploaded ${successCount} document${successCount > 1 ? 's' : ''}`);
    }
    if (errorCount > 0) {
      toast.error(`Failed to upload ${errorCount} document${errorCount > 1 ? 's' : ''}`);
    }

    if (successCount > 0 && onComplete) {
      onComplete();
    }
  };

  const clearCompleted = () => {
    setFiles((prev) => prev.filter((f) => f.status !== 'success'));
  };

  const overallProgress = files.length > 0
    ? files.reduce((sum, f) => sum + f.progress, 0) / files.length
    : 0;

  const pendingCount = files.filter((f) => f.status === 'pending').length;
  const successCount = files.filter((f) => f.status === 'success').length;
  const errorCount = files.filter((f) => f.status === 'error').length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Bulk Document Upload</CardTitle>
            <CardDescription>
              Upload multiple documents at once with automatic categorization
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={autoCategorizationEnabled ? 'default' : 'outline'}>
              <Sparkles className="w-3 h-3 mr-1" />
              Auto-Categorization {autoCategorizationEnabled ? 'ON' : 'OFF'}
            </Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAutoCategorizationEnabled(!autoCategorizationEnabled)}
            >
              Toggle
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Categorization Tip */}
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                Smart Categorization Enabled
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Files are automatically categorized based on their names. Include keywords like "form", "policy", "schedule", or "roster" in your filenames for better accuracy. You can manually adjust categories before uploading.
              </p>
            </div>
          </div>
        </div>

        {/* Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer
            ${isDragging 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
              : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
            }
          `}
          onClick={() => fileInputRef.current?.click()}
        >
          <FolderOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg mb-2">
            Drag and drop files here, or click to select
          </p>
          <p className="text-sm text-gray-500">
            Supports PDF, DOC, DOCX, XLS, XLSX, and more
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
          />
        </div>

        {/* Files List */}
        {files.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">
                Files ({files.length})
              </h3>
              <div className="flex gap-2">
                {successCount > 0 && (
                  <Button size="sm" variant="outline" onClick={clearCompleted}>
                    Clear Completed
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={uploadAllFiles}
                  disabled={isUploading || pendingCount === 0}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload All ({pendingCount})
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Overall Progress */}
            {isUploading && (
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
                  {successCount} Uploaded
                </Badge>
              )}
              {errorCount > 0 && (
                <Badge variant="destructive">
                  {errorCount} Failed
                </Badge>
              )}
            </div>

            {/* Individual Files */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {files.map((fileData) => (
                <Card key={fileData.id} className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Status Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {fileData.status === 'success' && (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      )}
                      {fileData.status === 'error' && (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                      {(fileData.status === 'uploading' || fileData.status === 'categorizing') && (
                        <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                      )}
                      {fileData.status === 'pending' && (
                        <FileText className="w-5 h-5 text-gray-400" />
                      )}
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0 space-y-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium truncate">{fileData.file.name}</p>
                          {fileData.confidence && fileData.status === 'pending' && (
                            <>
                              <Badge 
                                variant={fileData.confidence === 'high' ? 'default' : fileData.confidence === 'medium' ? 'secondary' : 'outline'} 
                                className="text-xs"
                              >
                                <Target className="w-3 h-3 mr-1" />
                                {fileData.confidence} confidence
                              </Badge>
                              {fileData.category && fileData.subcategory && (
                                <Badge variant="outline" className="text-xs">
                                  {getCategoryPath(fileData.category, fileData.subcategory)}
                                </Badge>
                              )}
                            </>
                          )}
                          {fileData.suggestedCategory && !fileData.confidence && fileData.status === 'pending' && (
                            <Badge variant="secondary" className="text-xs">
                              <Sparkles className="w-3 h-3 mr-1" />
                              Auto
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>{(fileData.file.size / 1024).toFixed(1)} KB</span>
                          {fileData.analysis?.detectedKeywords && fileData.analysis.detectedKeywords.length > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-xs">
                                Keywords: {fileData.analysis.detectedKeywords.slice(0, 3).join(', ')}
                                {fileData.analysis.detectedKeywords.length > 3 && ` +${fileData.analysis.detectedKeywords.length - 3} more`}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Editable Fields */}
                      {fileData.status === 'pending' && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Title</Label>
                            <Input
                              value={fileData.title || ''}
                              onChange={(e) => updateFileTitle(fileData.id, e.target.value)}
                              className="h-8 text-sm"
                              placeholder="Document title"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Category</Label>
                            <Select
                              value={fileData.category || 'other'}
                              onValueChange={(value) => updateFileCategory(fileData.id, value)}
                            >
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {DOCUMENT_CATEGORIES.map((cat) => (
                                  <SelectItem key={cat.id} value={cat.id}>
                                    {cat.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}

                      {/* Progress Bar */}
                      {(fileData.status === 'uploading' || fileData.status === 'categorizing') && (
                        <Progress value={fileData.progress} className="h-2" />
                      )}

                      {/* Error Message */}
                      {fileData.status === 'error' && fileData.error && (
                        <p className="text-sm text-red-500">{fileData.error}</p>
                      )}

                      {/* Success Message */}
                      {fileData.status === 'success' && (
                        <p className="text-sm text-green-600">
                          Uploaded successfully • {fileData.category}
                        </p>
                      )}
                    </div>

                    {/* Remove Button */}
                    {fileData.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFile(fileData.id)}
                        disabled={isUploading}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
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