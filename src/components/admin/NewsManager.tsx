import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, Search, Calendar, User, Star } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { toast } from 'sonner@2.0.3';
import {
  fetchNews,
  createNewsArticle,
  updateNewsArticle,
  deleteNewsArticle,
  NEWS_CATEGORIES,
  type NewsArticle,
} from '../../services/cms-api';
import { ImageUploader } from '../ImageUploader';

export function NewsManager() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<NewsArticle | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    author: '',
    category: 'general',
    featured_image_url: '',
    image_position: 'center',
    is_published: false,
    is_spotlight: false,
  });

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      setLoading(true);
      const data = await fetchNews();
      setArticles(data);
    } catch (error) {
      console.error('Error loading articles:', error);
      toast.error('Failed to load news articles');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Auto-generate slug if not provided
      const dataToSubmit = {
        ...formData,
        slug: formData.slug || generateSlug(formData.title),
      };

      if (editingArticle) {
        await updateNewsArticle(editingArticle.slug, dataToSubmit);
        toast.success('Article updated successfully');
      } else {
        await createNewsArticle(dataToSubmit);
        toast.success('Article created successfully');
      }

      setShowCreateModal(false);
      setEditingArticle(null);
      resetForm();
      loadArticles();
    } catch (error) {
      console.error('Error saving article:', error);
      toast.error('Failed to save article');
    }
  };

  const handleEdit = (article: NewsArticle) => {
    setEditingArticle(article);
    setFormData({
      title: article.title,
      slug: article.slug,
      content: article.content,
      excerpt: article.excerpt || '',
      author: article.author || '',
      category: article.category || 'general',
      featured_image_url: article.featured_image_url || '',
      image_position: article.image_position || 'center',
      is_published: article.is_published || false,
      is_spotlight: article.is_spotlight || false,
    });
    setShowCreateModal(true);
  };

  const handleDelete = async (slug: string) => {
    if (!confirm('Are you sure you want to delete this article?')) {
      return;
    }

    try {
      await deleteNewsArticle(slug);
      toast.success('Article deleted successfully');
      loadArticles();
    } catch (error) {
      console.error('Error deleting article:', error);
      toast.error('Failed to delete article');
    }
  };

  const handleToggleSpotlight = async (article: NewsArticle) => {
    try {
      const newSpotlightValue = !article.is_spotlight;

      // If turning spotlight ON, turn it OFF for all other articles first
      if (newSpotlightValue) {
        const currentSpotlights = articles.filter(a => a.is_spotlight && a.slug !== article.slug);
        for (const spotlightArticle of currentSpotlights) {
          await updateNewsArticle(spotlightArticle.slug, { is_spotlight: false } as any);
        }
      }

      await updateNewsArticle(article.slug, { is_spotlight: newSpotlightValue } as any);
      toast.success(
        newSpotlightValue
          ? `"${article.title}" is now the spotlight article`
          : `Spotlight removed from "${article.title}"`
      );
      loadArticles();
    } catch (error) {
      console.error('Error toggling spotlight:', error);
      toast.error('Failed to update spotlight');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      content: '',
      excerpt: '',
      author: '',
      category: 'general',
      featured_image_url: '',
      image_position: 'center',
      is_published: false,
      is_spotlight: false,
    });
  };

  const filteredArticles = articles.filter((article) =>
    article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort: spotlight first, then by date
  const sortedArticles = [...filteredArticles].sort((a, b) => {
    if (a.is_spotlight && !b.is_spotlight) return -1;
    if (!a.is_spotlight && b.is_spotlight) return 1;
    return 0;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">News Articles</h2>
          <p className="text-gray-600 dark:text-gray-400">Create and manage news content</p>
        </div>
        <Button
          onClick={() => {
            setEditingArticle(null);
            resetForm();
            setShowCreateModal(true);
          }}
          className="bg-[#013fac] hover:bg-[#0149c9]"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Article
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search articles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#013fac] dark:bg-gray-800 dark:text-white"
        />
      </div>

      {/* Articles List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-[#013fac] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading articles...</p>
        </div>
      ) : sortedArticles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm ? 'No articles found matching your search.' : 'No articles yet. Create your first one!'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sortedArticles.map((article) => (
            <Card
              key={article.id}
              className={`hover:shadow-lg transition-shadow ${
                article.is_spotlight ? 'ring-2 ring-amber-400 bg-amber-50/50 dark:bg-amber-950/20' : ''
              }`}
            >
              <CardContent className="p-6">
                <div className="flex gap-4">
                  {article.featured_image_url && (
                    <img
                      src={article.featured_image_url}
                      alt={article.title}
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {article.is_spotlight && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                              Spotlight
                            </span>
                          )}
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {article.title}
                          </h3>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {article.author && (
                            <span className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {article.author}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(article.created_at).toLocaleDateString()}
                          </span>
                          <Badge
                            variant={article.is_published ? 'default' : 'secondary'}
                          >
                            {article.is_published ? 'published' : 'draft'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleSpotlight(article)}
                          title={article.is_spotlight ? 'Remove spotlight' : 'Make spotlight article'}
                          className={article.is_spotlight
                            ? 'text-amber-600 bg-amber-50 border-amber-300 hover:bg-amber-100'
                            : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50 hover:border-amber-300'
                          }
                        >
                          <Star className={`w-4 h-4 ${article.is_spotlight ? 'fill-amber-500' : ''}`} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(article)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(article.slug)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    {article.excerpt && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {article.excerpt}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingArticle ? 'Edit Article' : 'Create New Article'}
            </DialogTitle>
            <DialogDescription>
              {editingArticle ? 'Update the article details below.' : 'Fill in the article details below.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#013fac] dark:bg-gray-800 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Excerpt</label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#013fac] dark:bg-gray-800 dark:text-white"
                placeholder="Brief summary of the article..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Content *</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={10}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#013fac] dark:bg-gray-800 dark:text-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Author</label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#013fac] dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#013fac] dark:bg-gray-800 dark:text-white"
                >
                  {NEWS_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Featured Image</label>
              <ImageUploader
                value={formData.featured_image_url}
                onChange={(url) => setFormData({ ...formData, featured_image_url: url })}
              />
              <div className="mt-3">
                <label className="block text-sm font-medium mb-1">Image Crop Position</label>
                <p className="text-xs text-gray-500 mb-2">
                  Controls which part of the image stays visible when cropped in cards and banners.
                </p>
                <div className="flex gap-2">
                  {(['top', 'center', 'bottom'] as const).map((pos) => (
                    <button
                      key={pos}
                      type="button"
                      onClick={() => setFormData({ ...formData, image_position: pos })}
                      className={`px-4 py-2 rounded-md text-sm font-semibold capitalize transition-all ${
                        formData.image_position === pos
                          ? 'bg-[#013fac] text-white shadow-md'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
                {/* Live preview of crop position — only when there's an image URL */}
                {formData.featured_image_url && (
                  <div className="mt-3 relative w-full h-32 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800">
                    <img
                      src={formData.featured_image_url}
                      alt="Crop preview"
                      className={`w-full h-full object-cover ${
                        formData.image_position === 'top' ? 'object-top' :
                        formData.image_position === 'bottom' ? 'object-bottom' :
                        'object-center'
                      }`}
                    />
                    <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                      {formData.image_position} crop
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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

              <div>
                <label className="block text-sm font-medium mb-1">Spotlight</label>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_spotlight: !formData.is_spotlight })}
                  className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md border transition-all ${
                    formData.is_spotlight
                      ? 'bg-amber-50 border-amber-400 text-amber-700 font-bold'
                      : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500 hover:border-amber-300 hover:text-amber-600'
                  }`}
                >
                  <Star className={`w-4 h-4 ${formData.is_spotlight ? 'fill-amber-500 text-amber-500' : ''}`} />
                  {formData.is_spotlight ? 'Spotlight Article' : 'Not Spotlighted'}
                </button>
                <p className="text-[11px] text-gray-400 mt-1">
                  Spotlight pins this article as the featured story. Only one article can be spotlighted at a time.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingArticle(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-[#013fac] hover:bg-[#0149c9]">
                {editingArticle ? 'Update Article' : 'Create Article'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}