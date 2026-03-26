import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Upload,
  FileText,
  Search,
  Filter,
  Calendar,
  Download,
  Trash2,
  Eye,
  FolderOpen,
  ArrowUpDown,
  Pencil,
  X,
  Save,
  Check,
  Plus,
  Tag,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { fetchDocuments, deleteDocument, updateDocument, importDocuments, type Document } from '../../services/cms-api';
import { BulkDocumentUploader } from './BulkDocumentUploader';
import { 
  DOCUMENT_CATEGORIES, 
  getCategoryLabel, 
  getSubcategoryLabel,
  type CategoryStructure,
} from '../../utils/document-analyzer';

// Match the front-end color coding for category badges
const CATEGORY_COLORS: Record<string, { badge: string; subcategory: string }> = {
  'governance': { badge: 'bg-indigo-100 text-indigo-800', subcategory: 'bg-indigo-50 text-indigo-700 border border-indigo-200' },
  'rules-regulations': { badge: 'bg-amber-100 text-amber-800', subcategory: 'bg-amber-50 text-amber-700 border border-amber-200' },
  'officiating': { badge: 'bg-purple-100 text-purple-800', subcategory: 'bg-purple-50 text-purple-700 border border-purple-200' },
  'forms': { badge: 'bg-emerald-100 text-emerald-800', subcategory: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  'insurance': { badge: 'bg-cyan-100 text-cyan-800', subcategory: 'bg-cyan-50 text-cyan-700 border border-cyan-200' },
  'meetings': { badge: 'bg-blue-100 text-blue-800', subcategory: 'bg-blue-50 text-blue-700 border border-blue-200' },
  'financial': { badge: 'bg-green-100 text-green-800', subcategory: 'bg-green-50 text-green-700 border border-green-200' },
  'schedules': { badge: 'bg-orange-100 text-orange-800', subcategory: 'bg-orange-50 text-orange-700 border border-orange-200' },
  'rosters': { badge: 'bg-teal-100 text-teal-800', subcategory: 'bg-teal-50 text-teal-700 border border-teal-200' },
  'transactions': { badge: 'bg-rose-100 text-rose-800', subcategory: 'bg-rose-50 text-rose-700 border border-rose-200' },
  'statistics': { badge: 'bg-sky-100 text-sky-800', subcategory: 'bg-sky-50 text-sky-700 border border-sky-200' },
  'communications': { badge: 'bg-violet-100 text-violet-800', subcategory: 'bg-violet-50 text-violet-700 border border-violet-200' },
  'historical': { badge: 'bg-stone-100 text-stone-800', subcategory: 'bg-stone-50 text-stone-700 border border-stone-200' },
  'other': { badge: 'bg-gray-100 text-gray-800', subcategory: 'bg-gray-50 text-gray-700 border border-gray-200' },
};

function getCategoryBadgeColor(categoryId: string) {
  return CATEGORY_COLORS[categoryId] || CATEGORY_COLORS['other'];
}

// ─── Custom Categories (stored in component, synced with KV via documents) ─── 

interface CustomCategory {
  id: string;
  label: string;
  icon: string;
  subcategories: { id: string; label: string }[];
}

function getAllCategories(customCategories: CustomCategory[]): (CategoryStructure | CustomCategory)[] {
  const builtIn = [...DOCUMENT_CATEGORIES];
  // Merge custom categories (avoid duplicates by id)
  const builtInIds = new Set(builtIn.map(c => c.id));
  const extras = customCategories.filter(c => !builtInIds.has(c.id));
  return [...builtIn, ...extras];
}

function getLabelForCategory(categoryId: string, customCategories: CustomCategory[]): string {
  // Check built-in first
  const builtIn = DOCUMENT_CATEGORIES.find(c => c.id === categoryId);
  if (builtIn) return builtIn.label;
  // Check custom
  const custom = customCategories.find(c => c.id === categoryId);
  if (custom) return custom.label;
  return categoryId;
}

function getSubcategoriesForCategory(categoryId: string, customCategories: CustomCategory[]): { id: string; label: string }[] {
  const builtIn = DOCUMENT_CATEGORIES.find(c => c.id === categoryId);
  if (builtIn?.subcategories) {
    return builtIn.subcategories.map(s => ({ id: s.id, label: s.label }));
  }
  const custom = customCategories.find(c => c.id === categoryId);
  if (custom?.subcategories) return custom.subcategories;
  return [];
}

function getLabelForSubcategory(categoryId: string, subcategoryId: string, customCategories: CustomCategory[]): string {
  const builtIn = DOCUMENT_CATEGORIES.find(c => c.id === categoryId);
  if (builtIn) {
    const sub = builtIn.subcategories?.find(s => s.id === subcategoryId);
    if (sub) return sub.label;
  }
  const custom = customCategories.find(c => c.id === categoryId);
  if (custom) {
    const sub = custom.subcategories?.find(s => s.id === subcategoryId);
    if (sub) return sub.label;
  }
  return subcategoryId;
}

// ─── Edit Modal ───

interface EditModalProps {
  document: Document;
  customCategories: CustomCategory[];
  onSave: (id: string, updates: Partial<Document>) => Promise<void>;
  onClose: () => void;
}

function EditDocumentModal({ document: doc, customCategories, onSave, onClose }: EditModalProps) {
  const [title, setTitle] = useState(doc.title);
  const [description, setDescription] = useState(doc.description || '');
  const [category, setCategory] = useState(doc.category || 'other');
  const [subcategory, setSubcategory] = useState(doc.subcategory || '');
  const [documentYear, setDocumentYear] = useState<string>(doc.document_year?.toString() || '');
  const [saving, setSaving] = useState(false);

  const allCats = getAllCategories(customCategories);
  const subcats = getSubcategoriesForCategory(category, customCategories);

  // Reset subcategory when category changes (unless it's still valid)
  useEffect(() => {
    const validSubIds = subcats.map(s => s.id);
    if (subcategory && !validSubIds.includes(subcategory)) {
      setSubcategory('');
    }
  }, [category]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(doc.id, {
        title,
        description,
        category,
        subcategory: subcategory || undefined,
        document_year: documentYear ? parseInt(documentYear) : undefined,
      });
      onClose();
    } catch (error) {
      console.error('Error saving document:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Pencil className="w-5 h-5 text-[#013fac]" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Edit Document</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="p-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#013fac] dark:bg-gray-800 dark:text-white text-sm"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#013fac] dark:bg-gray-800 dark:text-white text-sm resize-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#013fac] dark:bg-gray-800 dark:text-white text-sm"
            >
              {allCats.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
          </div>

          {/* Subcategory */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Subcategory</label>
            <select
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#013fac] dark:bg-gray-800 dark:text-white text-sm"
            >
              <option value="">None</option>
              {subcats.map(sub => (
                <option key={sub.id} value={sub.id}>{sub.label}</option>
              ))}
            </select>
          </div>

          {/* Document Year */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Document Year</label>
            <input
              type="number"
              value={documentYear}
              onChange={(e) => setDocumentYear(e.target.value)}
              placeholder="e.g. 2025"
              min="2000"
              max="2099"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#013fac] dark:bg-gray-800 dark:text-white text-sm"
            />
          </div>

          {/* File Info (read-only) */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p><span className="font-semibold">File:</span> {doc.file_name}</p>
            <p><span className="font-semibold">Type:</span> {doc.file_type}</p>
            <p><span className="font-semibold">Uploaded:</span> {new Date(doc.upload_date).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving || !title.trim()}
            className="bg-[#013fac] hover:bg-[#0149c9]"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Create Category Modal ───

interface CreateCategoryModalProps {
  onSave: (category: CustomCategory) => void;
  onClose: () => void;
  existingIds: Set<string>;
}

function CreateCategoryModal({ onSave, onClose, existingIds }: CreateCategoryModalProps) {
  const [label, setLabel] = useState('');
  const [subcategoryInputs, setSubcategoryInputs] = useState<{ label: string }[]>([]);
  const [newSubLabel, setNewSubLabel] = useState('');

  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const isDuplicate = existingIds.has(id);

  const addSubcategory = () => {
    if (newSubLabel.trim()) {
      setSubcategoryInputs(prev => [...prev, { label: newSubLabel.trim() }]);
      setNewSubLabel('');
    }
  };

  const removeSubcategory = (index: number) => {
    setSubcategoryInputs(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!label.trim() || isDuplicate) return;
    
    const newCategory: CustomCategory = {
      id,
      label: label.trim(),
      icon: 'Folder',
      subcategories: subcategoryInputs.map(s => ({
        id: s.label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        label: s.label,
      })),
    };
    
    onSave(newCategory);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-[#013fac]" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Create New Category</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="p-5 space-y-4">
          {/* Category Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Category Name</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Training & Development"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#013fac] dark:bg-gray-800 dark:text-white text-sm"
            />
            {id && (
              <p className={`text-xs mt-1 ${isDuplicate ? 'text-red-500' : 'text-gray-400'}`}>
                ID: {id} {isDuplicate && '(already exists)'}
              </p>
            )}
          </div>

          {/* Subcategories */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Subcategories <span className="font-normal text-gray-400">(optional)</span>
            </label>

            {subcategoryInputs.length > 0 && (
              <div className="space-y-1.5 mb-2">
                {subcategoryInputs.map((sub, i) => (
                  <div key={i} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-lg">
                    <Tag className="w-3 h-3 text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{sub.label}</span>
                    <button
                      onClick={() => removeSubcategory(i)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={newSubLabel}
                onChange={(e) => setNewSubLabel(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSubcategory())}
                placeholder="Add subcategory..."
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#013fac] dark:bg-gray-800 dark:text-white text-sm"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={addSubcategory}
                disabled={!newSubLabel.trim()}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSave}
            disabled={!label.trim() || isDuplicate}
            className="bg-[#013fac] hover:bg-[#0149c9]"
          >
            <Check className="w-4 h-4 mr-2" />
            Create Category
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main DocumentManager Component ───

export function DocumentManager() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [showUploader, setShowUploader] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'category'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);

  useEffect(() => {
    loadDocuments();
    loadCustomCategories();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const data = await fetchDocuments();
      setDocuments(data);
    } catch (error) {
      console.error('Error loading documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  // Load custom categories from localStorage (lightweight approach)
  const loadCustomCategories = () => {
    try {
      const stored = localStorage.getItem('rmll-custom-doc-categories');
      if (stored) {
        setCustomCategories(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Error loading custom categories:', e);
    }
  };

  const saveCustomCategories = (cats: CustomCategory[]) => {
    setCustomCategories(cats);
    localStorage.setItem('rmll-custom-doc-categories', JSON.stringify(cats));
  };

  const handleAddCategory = (cat: CustomCategory) => {
    const updated = [...customCategories, cat];
    saveCustomCategories(updated);
    toast.success(`Category "${cat.label}" created`);
  };

  const handleDeleteCategory = (id: string) => {
    // Check if any documents use this category
    const docsUsingCategory = documents.filter(d => d.category === id);
    if (docsUsingCategory.length > 0) {
      toast.error(`Cannot delete: ${docsUsingCategory.length} document(s) use this category`);
      return;
    }
    const updated = customCategories.filter(c => c.id !== id);
    saveCustomCategories(updated);
    toast.success('Category deleted');
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    try {
      await deleteDocument(id);
      toast.success('Document deleted successfully');
      loadDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };

  const handleUpdate = async (id: string, updates: Partial<Document>) => {
    try {
      await updateDocument(id, updates);
      toast.success('Document updated successfully');
      await loadDocuments();
    } catch (error) {
      console.error('Error updating document:', error);
      toast.error('Failed to update document');
      throw error;
    }
  };

  const handleImport = async () => {
    // Prompt for CSV/JSON data
    const data = prompt('Paste your CSV or JSON document data here (or the JSON array of documents):');
    if (!data) return;

    setIsMigrating(true);
    try {
      let documents: Document[] = [];

      // Try to parse as JSON array first
      try {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          documents = parsed;
        } else if (typeof parsed === 'object' && parsed.documents) {
          documents = parsed.documents;
        } else {
          throw new Error('Invalid JSON format');
        }
      } catch {
        // Try to parse as CSV
        const lines = data.trim().split('\n');
        if (lines.length < 2) {
          throw new Error('CSV must have at least a header and one data row');
        }

        const headers = lines[0].split('\t').map(h => h.replace(/"/g, '').trim());
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split('\t').map(v => v.replace(/^"|"$/g, '').trim());
          const doc: any = {};

          // Find the document entry (key starts with "document:")
          const docKey = values.find((v: string) => v.startsWith('document:'));
          if (!docKey) continue;

          // Parse the JSON value
          const jsonValue = values.find((v: string) => v.startsWith('{'));
          if (!jsonValue) continue;

          try {
            const parsedDoc = JSON.parse(jsonValue);
            if (parsedDoc.id && parsedDoc.title) {
              documents.push(parsedDoc);
            }
          } catch {
            console.warn('Failed to parse document row:', i);
          }
        }
      }

      if (documents.length === 0) {
        toast.info('No valid documents found in the provided data');
        return;
      }

      const result = await importDocuments(documents);
      if (result.imported > 0) {
        toast.success(`Successfully imported ${result.imported} documents. ${result.skipped || 0} already existed.`);
      } else if (result.skipped > 0) {
        toast.info(`All ${result.skipped} documents already exist.`);
      } else {
        toast.info(result.message || 'No documents imported.');
      }
      if (result.errors && result.errors.length > 0) {
        toast.error(`${result.errors.length} errors occurred during import`);
        result.errors.forEach(err => console.error(err));
      }
      await loadDocuments();
    } catch (error: any) {
      console.error('Error importing documents:', error);
      toast.error(error.message || 'Failed to import documents');
    } finally {
      setIsMigrating(false);
    }
  };

  // Get unique years from documents
  const availableYears = Array.from(
    new Set(
      documents
        .map(doc => doc.document_year)
        .filter((year): year is number => year !== null && year !== undefined)
    )
  ).sort((a, b) => b - a);

  // Get unique categories (including any that exist on documents but aren't in the predefined list)
  const availableCategories = useMemo(() => {
    const docCats = Array.from(new Set(documents.map(doc => doc.category))).sort();
    const allKnown = new Set([
      ...DOCUMENT_CATEGORIES.map(c => c.id),
      ...customCategories.map(c => c.id),
    ]);
    // Include any categories found on documents even if not in our lists
    return docCats;
  }, [documents, customCategories]);

  // All known category IDs for duplicate checking
  const allCategoryIds = useMemo(() => {
    return new Set([
      ...DOCUMENT_CATEGORIES.map(c => c.id),
      ...customCategories.map(c => c.id),
    ]);
  }, [customCategories]);

  // Filter documents
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = 
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.file_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;
    
    const matchesYear = yearFilter === 'all' || 
      (doc.document_year && doc.document_year.toString() === yearFilter);
    
    return matchesSearch && matchesCategory && matchesYear;
  });

  // Sort documents
  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'category':
        comparison = a.category.localeCompare(b.category);
        break;
      case 'date':
      default:
        comparison = new Date(b.upload_date).getTime() - new Date(a.upload_date).getTime();
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (showUploader) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Upload Documents</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Bulk upload documents with AI-powered categorization
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setShowUploader(false);
              loadDocuments();
            }}
          >
            <Eye className="w-4 h-4 mr-2" />
            View All Documents
          </Button>
        </div>
        <BulkDocumentUploader onComplete={() => {
          setShowUploader(false);
          loadDocuments();
        }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Documents</h2>
          <p className="text-gray-600 dark:text-gray-400">
            {documents.length} document{documents.length !== 1 ? 's' : ''} in library
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowCategoryManager(!showCategoryManager)}
          >
            <Tag className="w-4 h-4 mr-2" />
            Categories
            {showCategoryManager ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
          </Button>
          <Button
            onClick={handleImport}
            variant="outline"
            disabled={isMigrating}
          >
            <Upload className={`w-4 h-4 mr-2 ${isMigrating ? 'animate-spin' : ''}`} />
            {isMigrating ? 'Importing...' : 'Import CSV/JSON'}
          </Button>
          <Button
            onClick={() => setShowUploader(true)}
            className="bg-[#013fac] hover:bg-[#0149c9]"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Documents
          </Button>
        </div>
      </div>

      {/* Category Manager Panel */}
      {showCategoryManager && (
        <Card className="border-[#013fac]/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Manage Categories</CardTitle>
                <CardDescription>
                  {DOCUMENT_CATEGORIES.length} built-in categories{customCategories.length > 0 ? ` + ${customCategories.length} custom` : ''}
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() => setShowCreateCategory(true)}
                className="bg-[#013fac] hover:bg-[#0149c9]"
              >
                <Plus className="w-4 h-4 mr-1" />
                New Category
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Built-in Categories */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Built-in Categories</h4>
                <div className="flex flex-wrap gap-1.5">
                  {DOCUMENT_CATEGORIES.map(cat => {
                    const count = documents.filter(d => d.category === cat.id).length;
                    return (
                      <span key={cat.id} className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300">
                        {cat.label}
                        {count > 0 && (
                          <span className="bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded-full text-[10px]">{count}</span>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Custom Categories */}
              {customCategories.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Custom Categories</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {customCategories.map(cat => {
                      const count = documents.filter(d => d.category === cat.id).length;
                      return (
                        <span key={cat.id} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-full text-xs font-medium text-blue-700 dark:text-blue-300">
                          {cat.label}
                          {count > 0 && (
                            <span className="bg-blue-100 dark:bg-blue-800 text-blue-500 px-1.5 py-0.5 rounded-full text-[10px]">{count}</span>
                          )}
                          {cat.subcategories.length > 0 && (
                            <span className="text-[10px] text-blue-400">({cat.subcategories.length} sub)</span>
                          )}
                          <button
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="text-blue-400 hover:text-red-500 ml-0.5"
                            title="Delete category"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Unrecognized categories on documents */}
              {(() => {
                const allKnownIds = new Set([
                  ...DOCUMENT_CATEGORIES.map(c => c.id),
                  ...customCategories.map(c => c.id),
                ]);
                const unknownCats = Array.from(new Set(
                  documents.map(d => d.category).filter(c => !allKnownIds.has(c))
                ));
                if (unknownCats.length === 0) return null;
                return (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500 mb-2">
                      Unrecognized Categories (on documents)
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {unknownCats.map(catId => {
                        const count = documents.filter(d => d.category === catId).length;
                        return (
                          <span key={catId} className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-full text-xs font-medium text-amber-700 dark:text-amber-300">
                            {catId}
                            <span className="bg-amber-100 text-amber-500 px-1.5 py-0.5 rounded-full text-[10px]">{count}</span>
                          </span>
                        );
                      })}
                    </div>
                    <p className="text-xs text-amber-600 mt-1.5">
                      These categories exist on documents but aren't in the category list. Edit the documents to reassign them, or create matching custom categories.
                    </p>
                  </div>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#013fac] dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#013fac] dark:bg-gray-800 dark:text-white"
              >
                <option value="all">All Categories</option>
                {availableCategories.map(category => (
                  <option key={category} value={category}>
                    {getLabelForCategory(category, customCategories)}
                  </option>
                ))}
              </select>
            </div>

            {/* Year Filter */}
            <div>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#013fac] dark:bg-gray-800 dark:text-white"
              >
                <option value="all">All Years</option>
                {availableYears.map(year => (
                  <option key={year} value={year.toString()}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <span className="text-sm text-gray-600 dark:text-gray-400">Sort by:</span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={sortBy === 'date' ? 'default' : 'outline'}
                onClick={() => setSortBy('date')}
              >
                Date
              </Button>
              <Button
                size="sm"
                variant={sortBy === 'title' ? 'default' : 'outline'}
                onClick={() => setSortBy('title')}
              >
                Title
              </Button>
              <Button
                size="sm"
                variant={sortBy === 'category' ? 'default' : 'outline'}
                onClick={() => setSortBy('category')}
              >
                Category
              </Button>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              <ArrowUpDown className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-[#013fac] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading documents...</p>
        </div>
      ) : sortedDocuments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {documents.length === 0 ? 'No documents yet' : 'No documents found'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {documents.length === 0 
                ? 'Upload your first document to get started'
                : 'Try adjusting your filters or search term'}
            </p>
            {documents.length === 0 && (
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => setShowUploader(true)}
                  className="bg-[#013fac] hover:bg-[#0149c9]"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Documents
                </Button>
                <Button
                  onClick={handleImport}
                  variant="outline"
                  disabled={isMigrating}
                >
                  <Upload className={`w-4 h-4 mr-2 ${isMigrating ? 'animate-spin' : ''}`} />
                  {isMigrating ? 'Importing...' : 'Import CSV/JSON'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sortedDocuments.map((doc) => (
            <Card key={doc.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-4 flex-1">
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-[#013fac]/10 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-[#013fac]" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {doc.title}
                      </h3>
                      
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        {(() => {
                          const colors = getCategoryBadgeColor(doc.category);
                          return (
                            <>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold ${colors.badge}`}>
                                {getLabelForCategory(doc.category, customCategories)}
                              </span>
                              
                              {doc.subcategory && (
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${colors.subcategory}`}>
                                  {getLabelForSubcategory(doc.category, doc.subcategory, customCategories)}
                                </span>
                              )}
                            </>
                          );
                        })()}
                        
                        {doc.document_year && (
                          <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {doc.document_year}
                          </span>
                        )}
                        
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {formatFileSize(doc.file_size)}
                        </span>
                      </div>

                      {doc.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                          {doc.description}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span>{doc.file_name}</span>
                        <span>•</span>
                        <span>Uploaded {new Date(doc.upload_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingDoc(doc)}
                      title="Edit document"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(doc.file_url, '_blank')}
                      title="Download document"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(doc.id, doc.title)}
                      className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      title="Delete document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingDoc && (
        <EditDocumentModal
          document={editingDoc}
          customCategories={customCategories}
          onSave={handleUpdate}
          onClose={() => setEditingDoc(null)}
        />
      )}

      {/* Create Category Modal */}
      {showCreateCategory && (
        <CreateCategoryModal
          onSave={handleAddCategory}
          onClose={() => setShowCreateCategory(false)}
          existingIds={allCategoryIds}
        />
      )}
    </div>
  );
}