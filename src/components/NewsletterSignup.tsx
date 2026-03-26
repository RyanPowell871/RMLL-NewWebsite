import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Mail, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { subscribeToNewsletter } from '../services/email-api';

interface NewsletterSignupProps {
  variant?: 'inline' | 'card';
  className?: string;
}

export function NewsletterSignup({ variant = 'inline', className = '' }: NewsletterSignupProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    try {
      setIsSubmitting(true);
      await subscribeToNewsletter({ email, name: name || undefined });
      setIsSuccess(true);
      toast.success('Successfully subscribed to newsletter!');
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setEmail('');
        setName('');
        setIsSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error subscribing:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to subscribe');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className={`flex items-center gap-2 text-green-600 ${className}`}>
        <CheckCircle2 className="w-5 h-5" />
        <span>Successfully subscribed!</span>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`bg-[#013fac] text-white p-8 rounded-lg ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Stay Updated</h3>
            <p className="text-sm text-white/80">Get the latest RMLL news</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            type="text"
            placeholder="Your name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
          />
          <Input
            type="email"
            placeholder="Your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
          />
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-white text-[#013fac] hover:bg-gray-100"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-[#013fac] border-t-transparent rounded-full animate-spin mr-2" />
                Subscribing...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Subscribe
              </>
            )}
          </Button>
        </form>
      </div>
    );
  }

  // Inline variant
  return (
    <form onSubmit={handleSubmit} className={`flex gap-2 ${className}`}>
      <Input
        type="email"
        placeholder="Your email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="flex-1"
      />
      <Button
        type="submit"
        disabled={isSubmitting}
        className="bg-[#013fac] hover:bg-[#0149c9]"
      >
        {isSubmitting ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <Mail className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Subscribe</span>
          </>
        )}
      </Button>
    </form>
  );
}
