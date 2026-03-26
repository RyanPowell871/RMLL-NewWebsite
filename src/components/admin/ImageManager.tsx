import { useState, useEffect, useCallback } from 'react';
import { Upload, Search, Image as ImageIcon, Trash2, Edit, Copy, Check, X, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface Image {
  id: string;
  title: string;
  alt_text: string;
  category: string;
  file_url: string;
  filename: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
}

const IMAGE_CATEGORIES = [
  'Team Photos',
  'Player Photos',
  'Game Action',
  'Venue Photos',
  'Event Photos',
  'Logos',
  'Banners',
  'Promotional',
  'Other',
];

export function ImageManager() {
  const [images, setImages] = useState<Image[]>([]);
  const [filteredImages, setFilteredImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingImage, setEditingImage] = useState<Image | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Upload form state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadAltText, setUploadAltText] = useState('');
  const [uploadCategory, setUploadCategory] = useState('Other');
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    loadImages();
  }, []);

  useEffect(() => {
    filterImages();
  }, [images, searchQuery, selectedCategory]);

  const loadImages = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9a1ba23f/images`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setImages(data.images || []);
      }
    } catch (error) {
      console.error('Error loading images:', error);
      toast.error('Failed to load images');
    } finally {
      setLoading(false);
    }
  };

  const filterImages = useCallback(() => {
    let filtered = [...images];

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(img => img.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        img =>
          img.title.toLowerCase().includes(query) ||
          img.alt_text.toLowerCase().includes(query) ||
          img.category.toLowerCase().includes(query)
      );
    }

    setFilteredImages(filtered);
  }, [images, searchQuery, selectedCategory]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        setUploadFile(file);
        setUploadTitle(file.name.replace(/\.[^/.]+$/, ''));
      } else {
        toast.error('Please upload an image file');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith('image/')) {
        setUploadFile(file);
        setUploadTitle(file.name.replace(/\.[^/.]+$/, ''));
      } else {
        toast.error('Please upload an image file');
      }
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      toast.error('Please select an image');
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('title', uploadTitle || uploadFile.name);
      formData.append('alt_text', uploadAltText);
      formData.append('category', uploadCategory);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9a1ba23f/images`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: formData,
        }
      );

      if (response.ok) {
        const data = await response.json();
        toast.success('Image uploaded successfully!');
        setImages(prev => [data.image, ...prev]);
        resetUploadForm();
        setShowUploadDialog(false);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateImage = async () => {
    if (!editingImage) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9a1ba23f/images/${editingImage.id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: editingImage.title,
            alt_text: editingImage.alt_text,
            category: editingImage.category,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        toast.success('Image updated successfully!');
        setImages(prev =>
          prev.map(img => (img.id === editingImage.id ? data.image : img))
        );
        setShowEditDialog(false);
        setEditingImage(null);
      } else {
        toast.error('Failed to update image');
      }
    } catch (error) {
      console.error('Error updating image:', error);
      toast.error('Failed to update image');
    }
  };

  const handleDeleteImage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9a1ba23f/images/${id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        toast.success('Image deleted successfully!');
        setImages(prev => prev.filter(img => img.id !== id));
      } else {
        toast.error('Failed to delete image');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Failed to delete image');
    }
  };

  const copyToClipboard = async (url: string, id: string) => {
    try {
      // Check if clipboard API is available
      if (!navigator.clipboard) {
        console.error('Clipboard API not available');
        // Fallback method
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
          textArea.remove();
          setCopiedId(id);
          toast.success('Link copied to clipboard!');
          setTimeout(() => setCopiedId(null), 2000);
        } catch (err) {
          console.error('Fallback copy failed:', err);
          textArea.remove();
          toast.error('Failed to copy link');
        }
        return;
      }

      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Copy to clipboard error:', error);
      toast.error('Failed to copy link. Please check browser permissions.');
    }
  };

  const resetUploadForm = () => {
    setUploadFile(null);
    setUploadTitle('');
    setUploadAltText('');
    setUploadCategory('Other');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Image Manager
            </CardTitle>
            <Button onClick={() => setShowUploadDialog(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Upload Image
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search images..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="sm:w-64">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                >
                  <option value="all">All Categories</option>
                  {IMAGE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredImages.length} of {images.length} images
          </div>
        </CardContent>
      </Card>

      {/* Images Grid */}
      {loading ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">Loading images...</div>
          </CardContent>
        </Card>
      ) : filteredImages.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-500">No images found</p>
              <Button
                onClick={() => setShowUploadDialog(true)}
                className="mt-4"
                variant="outline"
              >
                Upload Your First Image
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredImages.map(image => (
            <Card key={image.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative aspect-video bg-gray-100 dark:bg-gray-800">
                <img
                  src={image.file_url}
                  alt={image.alt_text || image.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="p-4">
                <h3 className="font-medium text-sm mb-1 truncate" title={image.title}>
                  {image.title}
                </h3>
                <p className="text-xs text-gray-500 mb-2">{image.category}</p>
                <p className="text-xs text-gray-400 mb-3">{formatFileSize(image.file_size)}</p>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => copyToClipboard(image.file_url, image.id)}
                  >
                    {copiedId === image.id ? (
                      <Check className="w-3 h-3 mr-1" />
                    ) : (
                      <Copy className="w-3 h-3 mr-1" />
                    )}
                    {copiedId === image.id ? 'Copied!' : 'Copy'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingImage(image);
                      setShowEditDialog(true);
                    }}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteImage(image.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Image</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Drag & Drop Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/10'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {uploadFile ? (
                <div className="space-y-2">
                  <img
                    src={URL.createObjectURL(uploadFile)}
                    alt="Preview"
                    className="max-h-48 mx-auto rounded"
                  />
                  <p className="text-sm text-gray-600">{uploadFile.name}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setUploadFile(null)}
                  >
                    <X className="w-3 h-3 mr-1" />
                    Remove
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    Drag and drop an image here, or click to select
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload">
                    <Button variant="outline" as="span">
                      Select Image
                    </Button>
                  </label>
                  <p className="text-xs text-gray-500 mt-2">
                    Max file size: 5MB
                  </p>
                </>
              )}
            </div>

            {/* Metadata Form */}
            {uploadFile && (
              <>
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="Enter image title"
                  />
                </div>

                <div>
                  <Label htmlFor="alt-text">Alt Text (for accessibility)</Label>
                  <Input
                    id="alt-text"
                    value={uploadAltText}
                    onChange={(e) => setUploadAltText(e.target.value)}
                    placeholder="Describe the image"
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                  >
                    {IMAGE_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="flex-1"
                  >
                    {uploading ? 'Uploading...' : 'Upload Image'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      resetUploadForm();
                      setShowUploadDialog(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Image</DialogTitle>
          </DialogHeader>

          {editingImage && (
            <div className="space-y-4">
              <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
                <img
                  src={editingImage.file_url}
                  alt={editingImage.alt_text}
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editingImage.title}
                  onChange={(e) =>
                    setEditingImage({ ...editingImage, title: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="edit-alt-text">Alt Text</Label>
                <Input
                  id="edit-alt-text"
                  value={editingImage.alt_text}
                  onChange={(e) =>
                    setEditingImage({ ...editingImage, alt_text: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="edit-category">Category</Label>
                <select
                  id="edit-category"
                  value={editingImage.category}
                  onChange={(e) =>
                    setEditingImage({ ...editingImage, category: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                >
                  {IMAGE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={handleUpdateImage} className="flex-1">
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditDialog(false);
                    setEditingImage(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}