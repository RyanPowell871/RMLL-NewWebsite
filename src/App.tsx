import { lazy, Suspense, useState, useEffect, startTransition } from 'react';
import { Toaster } from 'sonner@2.0.3';
import { DivisionProvider } from './contexts/DivisionContext';
import { NavigationProvider } from './contexts/NavigationContext';
import { AuthProvider } from './contexts/AuthContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LeagueInfoPage } from './pages/LeagueInfoPage';
import { DivisionDataLoader } from './components/DivisionDataLoader';
import { CMSPage } from './pages/CMSPage';
import { AnnouncementPopup } from './components/AnnouncementPopup';
import { initializeApiKey } from './services/sportzsoft/client';
import { projectId, publicAnonKey } from './utils/supabase/info';
import { StructuredData } from './components/StructuredData';
import { GoogleAnalytics } from './components/GoogleAnalytics';
import { fetchSettings } from './services/cms-api';
import { HomePage } from './pages/HomePage';

// App version for cache busting
const APP_VERSION = '1.3.8-subdivision-fix';

// Lazy load pages for better performance (HomePage is eagerly loaded as default route)
const ContactPage = lazy(() => import('./pages/ContactPage').then(m => ({ default: m.ContactPage })));
const ProjectTimesheetPage = lazy(() => import('./pages/ProjectTimesheetPage').then(m => ({ default: m.ProjectTimesheetPage })));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyStandalonePage').then(m => ({ default: m.PrivacyPolicyStandalonePage })));
const TermsOfServicePage = lazy(() => import('./pages/TermsOfServicePage').then(m => ({ default: m.TermsOfServicePage })));

// Loading fallback component
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 font-semibold">Loading...</p>
      </div>
    </div>
  );
}

function App() {
  // Client-side routing state
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [gaId, setGaId] = useState<string | null>(null);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      startTransition(() => {
        setCurrentPath(window.location.pathname);
      });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Expose navigation function globally for components to use
  useEffect(() => {
    (window as any).navigateToPath = (path: string) => {
      if (path !== currentPath) {
        window.history.pushState({}, '', path);
        startTransition(() => {
          setCurrentPath(path);
        });
      }
    };
  }, [currentPath]);

  // Initialize API key
  useEffect(() => {
    const init = async () => {
      await initializeApiKey(projectId, publicAnonKey);
      // Fetch GA measurement ID from settings after API is ready
      try {
        const settings = await fetchSettings();
        if (settings.google_analytics_id) {
          setGaId(settings.google_analytics_id);
        }
      } catch {
        // Non-critical — analytics just won't load
      }
    };
    init();
  }, []);

  // CMS page needs AuthProvider
  if (currentPath === '/cms') {
    return (
      <>
        <Toaster position="top-right" />
        <GoogleAnalytics measurementId={gaId} />
        <AuthProvider>
          <CMSPage />
        </AuthProvider>
      </>
    );
  }

  // Setup admin page - removed, admin accounts must be created by existing administrators
  if (currentPath === '/setup-admin') {
    window.location.href = '/cms';
    return null;
  }

  // Admin page - DEPRECATED, redirect to CMS
  if (currentPath === '/admin') {
    window.location.href = '/cms';
    return null;
  }

  // League Info page - no lazy loading for instant navigation
  if (currentPath === '/league-info') {
    return (
      <>
        <Toaster position="top-right" />
        <GoogleAnalytics measurementId={gaId} />
        <NavigationProvider>
          <DivisionProvider>
            <DivisionDataLoader />
            <div className="min-h-screen bg-white">
              <Header />
              <LeagueInfoPage />
              <Footer />
            </div>
          </DivisionProvider>
        </NavigationProvider>
      </>
    );
  }

  // Contact page
  if (currentPath === '/contact') {
    return (
      <>
        <Toaster position="top-right" />
        <GoogleAnalytics measurementId={gaId} />
        <NavigationProvider>
          <DivisionProvider>
            <DivisionDataLoader />
            <Suspense fallback={<PageLoader />}>
              <ContactPage />
            </Suspense>
          </DivisionProvider>
        </NavigationProvider>
      </>
    );
  }

  // Project Timesheet page
  if (currentPath === '/project-timesheet') {
    return (
      <>
        <Toaster position="top-right" />
        <GoogleAnalytics measurementId={gaId} />
        <NavigationProvider>
          <DivisionProvider>
            <DivisionDataLoader />
            <Suspense fallback={<PageLoader />}>
              <ProjectTimesheetPage />
            </Suspense>
          </DivisionProvider>
        </NavigationProvider>
      </>
    );
  }

  // Privacy Policy page
  if (currentPath === '/privacy-policy') {
    return (
      <>
        <Toaster position="top-right" />
        <GoogleAnalytics measurementId={gaId} />
        <NavigationProvider>
          <DivisionProvider>
            <DivisionDataLoader />
            <Suspense fallback={<PageLoader />}>
              <PrivacyPolicyPage />
            </Suspense>
          </DivisionProvider>
        </NavigationProvider>
      </>
    );
  }

  // Terms of Service page
  if (currentPath === '/terms-of-service') {
    return (
      <>
        <Toaster position="top-right" />
        <GoogleAnalytics measurementId={gaId} />
        <NavigationProvider>
          <DivisionProvider>
            <DivisionDataLoader />
            <Suspense fallback={<PageLoader />}>
              <TermsOfServicePage />
            </Suspense>
          </DivisionProvider>
        </NavigationProvider>
      </>
    );
  }

  // All other pages need providers
  return (
    <>
      <Toaster position="top-right" />
      <GoogleAnalytics measurementId={gaId} />
      <StructuredData />
      <AnnouncementPopup />
      {/* ApiKeyAlert removed — API key is configured via environment variables */}
      <NavigationProvider>
        <DivisionProvider>
          <DivisionDataLoader />
          <HomePage />
        </DivisionProvider>
      </NavigationProvider>
    </>
  );
}

export default App;