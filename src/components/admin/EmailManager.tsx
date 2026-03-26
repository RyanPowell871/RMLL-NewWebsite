import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Mail, 
  Send, 
  Users, 
  Inbox,
  Calendar,
  CheckCircle2,
  XCircle,
  Eye,
  Code,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { 
  fetchNewsletterSubscribers, 
  sendEmailCampaign,
  fetchContactSubmissions,
  type NewsletterSubscriber,
  type ContactSubmission
} from '../../services/email-api';
import { emailTemplates, type EmailTemplateType } from '../../utils/email-templates';

export function EmailManager() {
  // Changed default tab to 'submissions' (contact form submissions only)
  const [activeTab, setActiveTab] = useState<'campaign' | 'subscribers' | 'submissions'>('submissions');
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Campaign form
  const [subject, setSubject] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [textContent, setTextContent] = useState('');
  const [sendToNewsletter, setSendToNewsletter] = useState(true);
  const [customRecipients, setCustomRecipients] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [previewMode, setPreviewMode] = useState<'html' | 'code'>('html');

  useEffect(() => {
    if (activeTab === 'subscribers') {
      loadSubscribers();
    } else if (activeTab === 'submissions') {
      loadSubmissions();
    }
  }, [activeTab]);

  const loadSubscribers = async () => {
    try {
      setLoading(true);
      const data = await fetchNewsletterSubscribers();
      setSubscribers(data.subscribers);
    } catch (error) {
      console.error('Error loading subscribers:', error);
      toast.error('Failed to load subscribers');
    } finally {
      setLoading(false);
    }
  };

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const data = await fetchContactSubmissions();
      setSubmissions(data);
    } catch (error) {
      console.error('Error loading submissions:', error);
      toast.error('Failed to load contact submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleSendCampaign = async () => {
    if (!subject || !htmlContent) {
      toast.error('Subject and content are required');
      return;
    }

    if (!sendToNewsletter && !customRecipients) {
      toast.error('Please select recipients');
      return;
    }

    try {
      setIsSending(true);
      
      const recipients = sendToNewsletter 
        ? undefined 
        : customRecipients.split(',').map(e => e.trim()).filter(e => e);

      const result = await sendEmailCampaign({
        subject,
        htmlContent,
        textContent: textContent || undefined,
        recipients,
        sendToNewsletter,
      });

      toast.success(result.message);
      
      // Reset form
      setSubject('');
      setHtmlContent('');
      setTextContent('');
      setCustomRecipients('');
    } catch (error) {
      console.error('Error sending campaign:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send campaign');
    } finally {
      setIsSending(false);
    }
  };

  const insertTemplate = (template: EmailTemplateType) => {
    const selectedTemplate = emailTemplates[template];
    setSubject(selectedTemplate.subject);
    setHtmlContent(selectedTemplate.html);
    toast.success('Template loaded! Edit as needed.');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Contact Form Submissions</h2>
        <p className="text-gray-600 dark:text-gray-400">
          View and manage contact form submissions from your website
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        {/* Hide tab list - only show submissions */}
        <TabsList className="hidden">
          <TabsTrigger value="submissions">
            <Inbox className="w-4 h-4 mr-2" />
            Contact Forms
          </TabsTrigger>
        </TabsList>

        {/* Campaign Tab */}
        <TabsContent value="campaign" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create Email Campaign</CardTitle>
              <CardDescription>
                Send emails to newsletter subscribers or custom recipients
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Quick Templates */}
              <div>
                <Label className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4" />
                  Quick Templates
                </Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => insertTemplate('season-announcement')}
                  >
                    🏒 Season Announcement
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => insertTemplate('game-reminder')}
                  >
                    📅 Game Reminder
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => insertTemplate('game-recap')}
                  >
                    📊 Game Recap
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => insertTemplate('newsletter')}
                  >
                    📰 Newsletter
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => insertTemplate('registration')}
                  >
                    🎉 Registration
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => insertTemplate('championship')}
                  >
                    🏆 Championship
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => insertTemplate('schedule-update')}
                  >
                    ⚠️ Schedule Update
                  </Button>
                </div>
              </div>

              {/* Recipients */}
              <div>
                <Label>Recipients</Label>
                <div className="space-y-2 mt-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={sendToNewsletter}
                      onChange={() => setSendToNewsletter(true)}
                      className="w-4 h-4"
                    />
                    <span>All newsletter subscribers ({subscribers.length})</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={!sendToNewsletter}
                      onChange={() => setSendToNewsletter(false)}
                      className="w-4 h-4"
                    />
                    <span>Custom recipients (comma-separated emails)</span>
                  </label>
                </div>
                {!sendToNewsletter && (
                  <Input
                    type="text"
                    placeholder="email1@example.com, email2@example.com"
                    value={customRecipients}
                    onChange={(e) => setCustomRecipients(e.target.value)}
                    className="mt-2"
                  />
                )}
              </div>

              {/* Subject */}
              <div>
                <Label htmlFor="subject">Email Subject *</Label>
                <Input
                  id="subject"
                  type="text"
                  placeholder="Enter email subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="mt-2"
                />
              </div>

              {/* HTML Content */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="htmlContent">Email Content (HTML) *</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewMode('html')}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewMode('code')}
                    >
                      <Code className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {previewMode === 'code' ? (
                  <Textarea
                    id="htmlContent"
                    placeholder="<div>Your HTML email content here</div>"
                    value={htmlContent}
                    onChange={(e) => setHtmlContent(e.target.value)}
                    rows={15}
                    className="font-mono text-sm"
                  />
                ) : (
                  <div className="border rounded-lg p-4 min-h-[300px] bg-white">
                    <div dangerouslySetInnerHTML={{ __html: htmlContent || '<p class="text-gray-400">Preview will appear here</p>' }} />
                  </div>
                )}
              </div>

              {/* Text Content (optional) */}
              <div>
                <Label htmlFor="textContent">Plain Text Version (optional)</Label>
                <Textarea
                  id="textContent"
                  placeholder="Plain text version for email clients that don't support HTML"
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  rows={6}
                  className="mt-2"
                />
              </div>

              {/* Send Button */}
              <Button
                onClick={handleSendCampaign}
                disabled={isSending}
                className="w-full bg-[#013fac] hover:bg-[#0149c9]"
              >
                {isSending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Sending Campaign...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Campaign
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscribers Tab */}
        <TabsContent value="subscribers" className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-[#013fac] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Loading subscribers...</p>
            </div>
          ) : subscribers.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No subscribers yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Newsletter subscribers will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Newsletter Subscribers</CardTitle>
                <CardDescription>
                  {subscribers.length} active subscriber{subscribers.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {subscribers.map((subscriber) => (
                    <div
                      key={subscriber.id}
                      className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {subscriber.name || subscriber.email}
                        </p>
                        {subscriber.name && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {subscriber.email}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Subscribed {new Date(subscriber.subscribed_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={subscriber.is_active ? 'default' : 'secondary'}>
                        {subscriber.is_active ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 mr-1" />
                            Inactive
                          </>
                        )}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Submissions Tab */}
        <TabsContent value="submissions" className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-[#013fac] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Loading submissions...</p>
            </div>
          ) : submissions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Inbox className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No submissions yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Contact form submissions will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission) => (
                <Card key={submission.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{submission.subject}</CardTitle>
                        <CardDescription>
                          From {submission.name} ({submission.email})
                        </CardDescription>
                      </div>
                      <Badge variant="outline">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(submission.submitted_at).toLocaleDateString()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {submission.phone && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <strong>Phone:</strong> {submission.phone}
                        </p>
                      )}
                      <div>
                        <strong className="text-sm text-gray-700 dark:text-gray-300">Message:</strong>
                        <p className="text-gray-600 dark:text-gray-400 mt-1 whitespace-pre-wrap">
                          {submission.message}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.href = `mailto:${submission.email}?subject=Re: ${submission.subject}`}
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Reply
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}