import { useState } from 'react';
import { Plus, Upload } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { toast } from 'sonner@2.0.3';
import { createPage } from '../../services/cms-api';
import { XMLImportModal } from './XMLImportModal';
import { IntegratedNavigationEditor } from './IntegratedNavigationEditor';

export function PageManager() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [key, setKey] = useState(0);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    meta_description: '',
    is_published: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const dataToSubmit = {
        ...formData,
        slug: formData.slug || generateSlug(formData.title),
      };

      await createPage(dataToSubmit);
      toast.success('Page created successfully');

      setShowCreateModal(false);
      resetForm();
      setKey(prev => prev + 1);
    } catch (error) {
      console.error('Error saving page:', error);
      toast.error('Failed to save page');
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      content: '',
      meta_description: '',
      is_published: false,
    });
  };

  const handleImportComplete = () => {
    setShowImportModal(false);
    setKey(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Pages</h2>
          <p className="text-gray-600 dark:text-gray-400">Manage website pages and navigation</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="bg-[#013fac] hover:bg-[#0149c9]"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Page
          </Button>
          <Button
            onClick={() => setShowImportModal(true)}
            className="bg-[#013fac] hover:bg-[#0149c9]"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import XML
          </Button>
        </div>
      </div>

      {/* Integrated Navigation & Page Editor */}
      <IntegratedNavigationEditor key={key} />

      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Page</DialogTitle>
            <DialogDescription>
              Fill in the page details below.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => {
                  const newTitle = e.target.value;
                  setFormData({ 
                    ...formData, 
                    title: newTitle,
                    slug: generateSlug(newTitle)
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#013fac] dark:bg-gray-800 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Slug (URL Path) *</label>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">/</span>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#013fac] dark:bg-gray-800 dark:text-white"
                  placeholder="about-us"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">This will be the URL of your page</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Meta Description</label>
              <textarea
                value={formData.meta_description}
                onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#013fac] dark:bg-gray-800 dark:text-white"
                placeholder="Brief description for search engines..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Content *</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={15}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#013fac] dark:bg-gray-800 dark:text-white font-mono text-sm"
                placeholder="You can use HTML here..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={formData.is_published ? 'published' : 'draft'}
                onChange={(e) => setFormData({ ...formData, is_published: e.target.value === 'published' })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#013fac] dark:bg-gray-800 dark:text-white"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-[#013fac] hover:bg-[#0149c9]">
                Create Page
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* XML Import Modal */}
      <XMLImportModal 
        isOpen={showImportModal} 
        onClose={() => setShowImportModal(false)} 
        onImportComplete={handleImportComplete} 
      />
    </div>
  );
}
