import { useDocumentMeta, PAGE_META } from '../hooks/useDocumentMeta';
import { trackPageView } from '../components/GoogleAnalytics';
import { lazy, Suspense, useEffect, useMemo } from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { ScoreTicker } from '../components/ScoreTicker';
import { Hero } from '../components/Hero';
import { PlayerSpotlight } from '../components/PlayerSpotlight';
import { LeagueLeaders } from '../components/LeagueLeaders';
import { StandingsSection } from '../components/StandingsSection';
import { NewsSection } from '../components/NewsSection';
import { RoughnecksSchedule } from '../components/RoughnecksSchedule';
import { useNavigation } from '../contexts/NavigationContext';

// Lazy load secondary pages
const SchedulePage = lazy(() => import('./SchedulePage').then(m => ({ default: m.SchedulePage })));
const StandingsPage = lazy(() => import('./StandingsPage').then(m => ({ default: m.StandingsPage })));
const StatsPage = lazy(() => import('./StatsPage').then(m => ({ default: m.StatsPage })));
const TeamsPageV1 = lazy(() => import('./TeamsPageV1').then(m => ({ default: m.TeamsPageV1 })));
const DivisionInfoPage = lazy(() => import('./DivisionInfoPage').then(m => ({ default: m.DivisionInfoPage })));
const DocumentsPageV1 = lazy(() => import('./DocumentsPageV1').then(m => ({ default: m.DocumentsPageV1 })));
const StorePageV1 = lazy(() => import('./StorePageV1').then(m => ({ default: m.StorePageV1 })));
const PlayerProfilePage = lazy(() => import('../components/PlayerProfilePage').then(m => ({ default: m.default })));
const NewsPage = lazy(() => import('./NewsPage').then(m => ({ default: m.NewsPage })));

// Page loader
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 font-semibold">Loading...</p>
      </div>
    </div>
  );
}

export function HomePage() {
  const { currentPage, navigateTo } = useNavigation();

  // SEO: Dynamic page meta based on current navigation
  const pageMeta = useMemo(() => {
    const metaMap: Record<string, typeof PAGE_META.home> = {
      home: PAGE_META.home,
      schedule: PAGE_META.schedule,
      standings: PAGE_META.standings,
      stats: PAGE_META.stats,
      teams: PAGE_META.teams,
      'division-info': PAGE_META.divisionInfo,
      news: PAGE_META.news,
      documents: PAGE_META.documents,
      store: PAGE_META.store,
      player: { title: 'Player Profile', description: 'View detailed player statistics, game log, and career information in the Rocky Mountain Lacrosse League.', canonicalPath: '/' },
    };
    return metaMap[currentPage] || PAGE_META.home;
  }, [currentPage]);

  useDocumentMeta(pageMeta);

  // Track SPA page views in Google Analytics
  useEffect(() => {
    trackPageView(pageMeta.title, `/${currentPage === 'home' ? '' : currentPage}`);
  }, [currentPage, pageMeta.title]);

  // Check if we need to navigate to a specific page on mount
  useEffect(() => {
    const targetPage = sessionStorage.getItem('rmll-navigate-to');
    if (targetPage) {
      sessionStorage.removeItem('rmll-navigate-to');
      const targetParams = sessionStorage.getItem('rmll-navigate-params');
      let params = {};
      if (targetParams) {
        sessionStorage.removeItem('rmll-navigate-params');
        try { params = JSON.parse(targetParams); } catch {}
      }
      navigateTo(targetPage as any, params);
    }
  }, [navigateTo]);

  // Listen for in-page navigation events (e.g. from Footer links when already on home)
  useEffect(() => {
    const handleNavigate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.page) {
        navigateTo(detail.page as any, detail.params || {});
      }
    };
    window.addEventListener('rmll-navigate', handleNavigate);
    return () => window.removeEventListener('rmll-navigate', handleNavigate);
  }, [navigateTo]);

  // Render different pages based on navigation
  // Note: Other pages include their own Header/Footer
  if (currentPage === 'home') {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main>
          <ScoreTicker />
          <Hero />
          <NewsSection />
          <PlayerSpotlight />
          <StandingsSection />
          <LeagueLeaders />
          <RoughnecksSchedule />
        </main>
        <Footer />
      </div>
    );
  }

  // Lazy load other pages
  return (
    <Suspense fallback={<PageLoader />}>
      {currentPage === 'schedule' && <SchedulePage />}
      {currentPage === 'standings' && <StandingsPage />}
      {currentPage === 'stats' && <StatsPage />}
      {currentPage === 'teams' && <TeamsPageV1 />}
      {currentPage === 'division-info' && <DivisionInfoPage />}
      {currentPage === 'documents' && <DocumentsPageV1 />}
      {currentPage === 'store' && <StorePageV1 />}
      {currentPage === 'player' && <PlayerProfilePage />}
      {currentPage === 'news' && <NewsPage />}
    </Suspense>
  );
}