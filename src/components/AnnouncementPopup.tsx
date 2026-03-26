import { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle, Info, Megaphone, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import { fetchActiveAnnouncements, type Announcement } from '../services/announcements-api';

export function AnnouncementPopup() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      const announcements = await fetchActiveAnnouncements();
      
      if (announcements.length === 0) return;

      // Get the highest priority announcement that should be shown
      const currentPath = window.location.pathname;
      const validAnnouncement = announcements.find(a => {
        // Check if announcement targets current page
        const targetsPage = a.target_pages.includes('all') || 
                           a.target_pages.includes(currentPath) ||
                           a.target_pages.some(path => currentPath.startsWith(path));
        
        if (!targetsPage) return false;

        // Check display frequency
        return shouldDisplayAnnouncement(a);
      });

      if (validAnnouncement) {
        setAnnouncement(validAnnouncement);
        setIsVisible(true);
        setTimeout(() => setIsAnimating(true), 10);
      }
    } catch (error) {
      console.error('Error loading announcements:', error);
    }
  };

  const shouldDisplayAnnouncement = (announcement: Announcement): boolean => {
    const storageKey = `announcement_${announcement.id}`;
    const lastShown = localStorage.getItem(storageKey);

    switch (announcement.display_frequency) {
      case 'always':
        return true;

      case 'once':
        return !lastShown;

      case 'daily': {
        if (!lastShown) return true;
        const lastShownDate = new Date(lastShown);
        const today = new Date();
        return lastShownDate.toDateString() !== today.toDateString();
      }

      case 'session': {
        const sessionKey = `announcement_${announcement.id}_session`;
        return !sessionStorage.getItem(sessionKey);
      }

      default:
        return true;
    }
  };

  const handleClose = () => {
    if (!announcement) return;

    // Mark as shown based on frequency
    const storageKey = `announcement_${announcement.id}`;
    
    switch (announcement.display_frequency) {
      case 'once':
      case 'daily':
        localStorage.setItem(storageKey, new Date().toISOString());
        break;
      
      case 'session':
        sessionStorage.setItem(`announcement_${announcement.id}_session`, 'true');
        break;
    }

    // Animate out
    setIsAnimating(false);
    setTimeout(() => setIsVisible(false), 300);
  };

  const handleButtonClick = () => {
    if (announcement?.button_link) {
      if (announcement.button_link.startsWith('http')) {
        window.open(announcement.button_link, '_blank');
      } else {
        window.location.href = announcement.button_link;
      }
    }
    handleClose();
  };

  if (!isVisible || !announcement) return null;

  const getIcon = () => {
    switch (announcement.type) {
      case 'warning':
        return <AlertCircle className="w-8 h-8" />;
      case 'success':
        return <CheckCircle className="w-8 h-8" />;
      case 'announcement':
        return <Megaphone className="w-8 h-8" />;
      default:
        return <Info className="w-8 h-8" />;
    }
  };

  const getColorClasses = () => {
    switch (announcement.type) {
      case 'warning':
        return {
          bg: 'bg-gradient-to-br from-amber-500 to-orange-600',
          icon: 'text-amber-100',
          text: 'text-white',
          button: 'bg-white text-amber-600 hover:bg-amber-50',
        };
      case 'success':
        return {
          bg: 'bg-gradient-to-br from-green-500 to-emerald-600',
          icon: 'text-green-100',
          text: 'text-white',
          button: 'bg-white text-green-600 hover:bg-green-50',
        };
      case 'announcement':
        return {
          bg: 'bg-gradient-to-br from-purple-500 to-indigo-600',
          icon: 'text-purple-100',
          text: 'text-white',
          button: 'bg-white text-purple-600 hover:bg-purple-50',
        };
      default:
        return {
          bg: 'bg-gradient-to-br from-[#013fac] to-[#0149c9]',
          icon: 'text-blue-100',
          text: 'text-white',
          button: 'bg-white text-[#013fac] hover:bg-blue-50',
        };
    }
  };

  const colors = getColorClasses();

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />

      {/* Popup */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className={`
            relative max-w-2xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden pointer-events-auto
            transition-all duration-300 transform
            ${isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
          `}
        >
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/10 hover:bg-black/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header with gradient */}
          <div className={`${colors.bg} p-8 pb-12 ${colors.text} relative overflow-hidden`}>
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24" />
            
            <div className="relative z-10 flex items-start gap-4">
              <div className={`${colors.icon} flex-shrink-0 mt-1`}>
                {getIcon()}
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-2">
                  {announcement.title}
                </h2>
                {announcement.image_url && (
                  <div className="mt-4 rounded-lg overflow-hidden">
                    <img
                      src={announcement.image_url}
                      alt={announcement.title}
                      className="w-full h-48 object-cover"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 -mt-4 relative z-10">
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <div 
                className="prose prose-sm max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: announcement.content }}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              {announcement.button_text && announcement.button_link && (
                <Button
                  onClick={handleButtonClick}
                  className={`flex-1 ${colors.button}`}
                >
                  {announcement.button_text}
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              )}
              <Button
                onClick={handleClose}
                variant="outline"
                className={announcement.button_text ? '' : 'flex-1'}
              >
                {announcement.button_text ? 'Maybe Later' : 'Got it, thanks!'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
