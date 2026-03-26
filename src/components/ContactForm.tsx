import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Mail, Phone, User, MessageSquare, Send, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { sendContactForm, type ContactFormData } from '../services/email-api';

export function ContactForm() {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      await sendContactForm(formData);
      setIsSuccess(true);
      toast.success('Message sent successfully!');
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: '',
        });
        setIsSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-12 text-center">
          <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Message Sent!</h3>
          <p className="text-gray-600">
            Thank you for contacting the RMLL. We'll get back to you as soon as possible.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Contact Us</CardTitle>
        <CardDescription>
          Send us a message and we'll get back to you as soon as possible
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <Label htmlFor="name" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Name *
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Your name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="mt-2"
            />
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email *
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="mt-2"
            />
          </div>

          {/* Phone */}
          <div>
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Phone (optional)
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="(403) 555-1234"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="mt-2"
            />
          </div>

          {/* Subject */}
          <div>
            <Label htmlFor="subject" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Subject *
            </Label>
            <Input
              id="subject"
              type="text"
              placeholder="What is this regarding?"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              required
              className="mt-2"
            />
          </div>

          {/* Message */}
          <div>
            <Label htmlFor="message">
              Message *
            </Label>
            <Textarea
              id="message"
              placeholder="Your message..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              required
              rows={6}
              className="mt-2"
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#013fac] hover:bg-[#0149c9]"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Message
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
