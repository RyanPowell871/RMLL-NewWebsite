import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { TextareaWithLinkInserter } from './TextareaWithLinkInserter';
import {
  Megaphone,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Calendar,
  Target,
  AlertCircle,
  CheckCircle,
  Info,
  Settings,
  Save,
  X,
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import {
  fetchAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  type Announcement,
  type CreateAnnouncementData,
} from '../../services/announcements-api';

export function AnnouncementManager() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateAnnouncementData>({
    title: '',
    content: '',
    type: 'info',
    priority: 0,
    display_frequency: 'once',
    target_pages: ['all'],
    start_date: null,
    end_date: null,
    button_text: null,
    button_link: null,
    image_url: null,
    is_active: true,
  });

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await fetchAllAnnouncements();
      setAnnouncements(data);
    } catch (error) {
      console.error('Error loading announcements:', error);
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.content) {
      toast.error('Title and content are required');
      return;
    }

    try {
      if (editingId) {
        await updateAnnouncement(editingId, formData);
        toast.success('Announcement updated successfully');
      } else {
        await createAnnouncement(formData);
        toast.success('Announcement created successfully');
      }

      resetForm();
      loadAnnouncements();
    } catch (error) {
      console.error('Error saving announcement:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save announcement');
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setFormData({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      priority: announcement.priority,
      display_frequency: announcement.display_frequency,
      target_pages: announcement.target_pages,
      start_date: announcement.start_date,
      end_date: announcement.end_date,
      button_text: announcement.button_text,
      button_link: announcement.button_link,
      image_url: announcement.image_url,
      is_active: announcement.is_active,
    });
    setEditingId(announcement.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    try {
      await deleteAnnouncement(id);
      toast.success('Announcement deleted successfully');
      loadAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast.error('Failed to delete announcement');
    }
  };

  const handleToggleActive = async (announcement: Announcement) => {
    try {
      await updateAnnouncement(announcement.id, {
        is_active: !announcement.is_active,
      });
      toast.success(`Announcement ${announcement.is_active ? 'deactivated' : 'activated'}`);
      loadAnnouncements();
    } catch (error) {
      console.error('Error toggling announcement:', error);
      toast.error('Failed to update announcement');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      type: 'info',
      priority: 0,
      display_frequency: 'once',
      target_pages: ['all'],
      start_date: null,
      end_date: null,
      button_text: null,
      button_link: null,
      image_url: null,
      is_active: true,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertCircle className="w-4 h-4" />;
      case 'success':
        return <CheckCircle className="w-4 h-4" />;
      case 'announcement':
        return <Megaphone className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'warning':
        return 'bg-amber-100 text-amber-800';
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'announcement':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Announcements</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Create and manage site-wide announcements and popups
          </p>
        </div>
        {!showForm && (
          <Button
            onClick={() => setShowForm(true)}
            className="bg-[#013fac] hover:bg-[#0149c9]"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Announcement
          </Button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {editingId ? 'Edit Announcement' : 'Create New Announcement'}
                </CardTitle>
                <CardDescription>
                  Design a beautiful popup announcement for your visitors
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={resetForm}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="Important Announcement"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="mt-2"
                />
              </div>

              {/* Content */}
              <div>
                <Label htmlFor="content">Content *</Label>
                <TextareaWithLinkInserter
                  id="content"
                  value={formData.content}
                  onChange={(value) => setFormData({ ...formData, content: value })}
                  placeholder="<p>Your announcement content here. You can use HTML formatting.</p>"
                  rows={6}
                  className="mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  HTML formatting is supported. Use the link button to insert links.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Type */}
                <div>
                  <Label htmlFor="type">Type</Label>
                  <select
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="info">Info</option>
                    <option value="announcement">Announcement</option>
                    <option value="warning">Warning</option>
                    <option value="success">Success</option>
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <Label htmlFor="priority">Priority (higher shows first)</Label>
                  <Input
                    id="priority"
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                    className="mt-2"
                  />
                </div>

                {/* Display Frequency */}
                <div>
                  <Label htmlFor="frequency">Display Frequency</Label>
                  <select
                    id="frequency"
                    value={formData.display_frequency}
                    onChange={(e) => setFormData({ ...formData, display_frequency: e.target.value as any })}
                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="once">Once (per user, ever)</option>
                    <option value="daily">Daily</option>
                    <option value="session">Once per session</option>
                    <option value="always">Always (every page load)</option>
                  </select>
                </div>

                {/* Target Pages */}
                <div>
                  <Label htmlFor="target_pages">Target Pages</Label>
                  <Input
                    id="target_pages"
                    type="text"
                    placeholder="all, /league, /schedule"
                    value={formData.target_pages.join(', ')}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        target_pages: e.target.value.split(',').map((s) => s.trim()),
                      })
                    }
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Comma-separated. Use "all" for all pages, or specific paths like "/league"
                  </p>
                </div>

                {/* Start Date */}
                <div>
                  <Label htmlFor="start_date">Start Date (optional)</Label>
                  <Input
                    id="start_date"
                    type="datetime-local"
                    value={formData.start_date || ''}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value || null })}
                    className="mt-2"
                  />
                </div>

                {/* End Date */}
                <div>
                  <Label htmlFor="end_date">End Date (optional)</Label>
                  <Input
                    id="end_date"
                    type="datetime-local"
                    value={formData.end_date || ''}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value || null })}
                    className="mt-2"
                  />
                </div>
              </div>

              {/* Button */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="button_text">Button Text (optional)</Label>
                  <Input
                    id="button_text"
                    type="text"
                    placeholder="Learn More"
                    value={formData.button_text || ''}
                    onChange={(e) => setFormData({ ...formData, button_text: e.target.value || null })}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="button_link">Button Link (optional)</Label>
                  <Input
                    id="button_link"
                    type="text"
                    placeholder="/schedule or https://example.com"
                    value={formData.button_link || ''}
                    onChange={(e) => setFormData({ ...formData, button_link: e.target.value || null })}
                    className="mt-2"
                  />
                </div>
              </div>

              {/* Image URL */}
              <div>
                <Label htmlFor="image_url">Header Image URL (optional)</Label>
                <Input
                  id="image_url"
                  type="text"
                  placeholder="https://example.com/image.jpg"
                  value={formData.image_url || ''}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value || null })}
                  className="mt-2"
                />
              </div>

              {/* Active */}
              <div className="flex items-center gap-2">
                <input
                  id="is_active"
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4"
                />
                <Label htmlFor="is_active" className="mb-0">
                  Active (show to users)
                </Label>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button type="submit" className="flex-1 bg-[#013fac] hover:bg-[#0149c9]">
                  <Save className="w-4 h-4 mr-2" />
                  {editingId ? 'Update' : 'Create'} Announcement
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-[#013fac] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading announcements...</p>
        </div>
      ) : announcements.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Megaphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No announcements yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create your first announcement to engage with your visitors
            </p>
            <Button onClick={() => setShowForm(true)} className="bg-[#013fac] hover:bg-[#0149c9]">
              <Plus className="w-4 h-4 mr-2" />
              Create Announcement
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <Card key={announcement.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge className={getTypeBadgeColor(announcement.type)}>
                        {getTypeIcon(announcement.type)}
                        <span className="ml-1 capitalize">{announcement.type}</span>
                      </Badge>
                      {announcement.priority > 0 && (
                        <Badge variant="outline">Priority: {announcement.priority}</Badge>
                      )}
                      <Badge variant={announcement.is_active ? 'default' : 'secondary'}>
                        {announcement.is_active ? (
                          <>
                            <Eye className="w-3 h-3 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3 mr-1" />
                            Inactive
                          </>
                        )}
                      </Badge>
                    </div>

                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {announcement.title}
                    </h3>

                    <div
                      className="prose prose-sm max-w-none text-gray-600 dark:text-gray-400 mb-3"
                      dangerouslySetInnerHTML={{ __html: announcement.content }}
                    />

                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Settings className="w-4 h-4" />
                        <span className="capitalize">{announcement.display_frequency}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className="w-4 h-4" />
                        <span>{announcement.target_pages.join(', ')}</span>
                      </div>
                      {announcement.start_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            Starts: {new Date(announcement.start_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {announcement.end_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Ends: {new Date(announcement.end_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(announcement)}
                    >
                      {announcement.is_active ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(announcement)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(announcement.id)}
                      className="text-red-600 hover:text-red-700"
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
    </div>
  );
}
