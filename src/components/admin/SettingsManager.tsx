import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Save } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { ImageUploader } from '../ImageUploader';
import { ApiKeyChecker } from './ApiKeyChecker';
import {
  fetchSettings,
  updateSettings,
  type SiteSettings,
} from '../../services/cms-api';

export function SettingsManager() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const data = await fetchSettings();
      setSettings(data);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async () => {
    if (!settings) return;

    setIsSaving(true);
    try {
      await updateSettings(settings);
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !settings) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-gray-500">
          Loading settings...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* API Key Status Checker */}
      <ApiKeyChecker />

      <Card>
        <CardHeader>
          <CardTitle>Site Information</CardTitle>
          <CardDescription>Basic information about your website</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="site_name">Site Name</Label>
              <Input
                id="site_name"
                value={settings.site_name}
                onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="site_tagline">Tagline</Label>
              <Input
                id="site_tagline"
                value={settings.site_tagline}
                onChange={(e) => setSettings({ ...settings, site_tagline: e.target.value })}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="site_description">Description</Label>
              <Textarea
                id="site_description"
                value={settings.site_description}
                onChange={(e) => setSettings({ ...settings, site_description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="col-span-2">
              <ImageUploader
                label="Logo"
                value={settings.logo_url || ''}
                onChange={(url) => setSettings({ ...settings, logo_url: url })}
                id="logo"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>How people can reach you</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contact_email">Email</Label>
              <Input
                id="contact_email"
                type="email"
                value={settings.contact_email}
                onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="contact_phone">Phone</Label>
              <Input
                id="contact_phone"
                value={settings.contact_phone}
                onChange={(e) => setSettings({ ...settings, contact_phone: e.target.value })}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="contact_address">Address</Label>
              <Textarea
                id="contact_address"
                value={settings.contact_address}
                onChange={(e) => setSettings({ ...settings, contact_address: e.target.value })}
                rows={2}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Social Media</CardTitle>
          <CardDescription>Links to your social media profiles</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="social_facebook">Facebook URL</Label>
              <Input
                id="social_facebook"
                placeholder="https://facebook.com/..."
                value={settings.social_facebook}
                onChange={(e) => setSettings({ ...settings, social_facebook: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="social_twitter">Twitter/X URL</Label>
              <Input
                id="social_twitter"
                placeholder="https://twitter.com/..."
                value={settings.social_twitter}
                onChange={(e) => setSettings({ ...settings, social_twitter: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="social_instagram">Instagram URL</Label>
              <Input
                id="social_instagram"
                placeholder="https://instagram.com/..."
                value={settings.social_instagram}
                onChange={(e) => setSettings({ ...settings, social_instagram: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="social_youtube">YouTube URL</Label>
              <Input
                id="social_youtube"
                placeholder="https://youtube.com/..."
                value={settings.social_youtube}
                onChange={(e) => setSettings({ ...settings, social_youtube: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SEO & Metadata</CardTitle>
          <CardDescription>Improve search engine visibility</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="meta_description">Meta Description</Label>
            <Textarea
              id="meta_description"
              value={settings.meta_description}
              onChange={(e) => setSettings({ ...settings, meta_description: e.target.value })}
              rows={2}
              placeholder="Brief description for search engines (150-160 characters)"
            />
          </div>

          <div>
            <Label htmlFor="meta_keywords">Keywords (comma-separated)</Label>
            <Input
              id="meta_keywords"
              value={Array.isArray(settings.meta_keywords) ? settings.meta_keywords.join(', ') : ''}
              onChange={(e) => setSettings({
                ...settings,
                meta_keywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean)
              })}
              placeholder="lacrosse, box lacrosse, alberta"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Google Analytics</CardTitle>
          <CardDescription>Track website traffic and user behavior with Google Analytics 4</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="google_analytics_id">GA4 Measurement ID</Label>
            <Input
              id="google_analytics_id"
              value={settings.google_analytics_id || ''}
              onChange={(e) => setSettings({ ...settings, google_analytics_id: e.target.value.trim() })}
              placeholder="G-XXXXXXXXXX"
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              Enter your Google Analytics 4 Measurement ID (starts with "G-"). Find it in your GA4 property under Admin &rarr; Data Streams &rarr; Web.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Footer</CardTitle>
          <CardDescription>Footer text and copyright information</CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="footer_text">Footer Text</Label>
            <Input
              id="footer_text"
              value={settings.footer_text}
              onChange={(e) => setSettings({ ...settings, footer_text: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}