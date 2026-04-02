import { useState, useCallback, memo, useEffect } from 'react';
import { ChevronRight, ChevronDown, FileText, Scale, Trophy, BookOpen, Wrench, Briefcase, ChevronsLeft, ChevronsRight, Users, Menu, X } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { RMLLExecutivePage } from '../components/league-info/RMLLExecutivePage';
import { AffiliateLinksPage } from '../components/league-info/AffiliateLinksPage';
import { MissionStatementPage } from '../components/league-info/MissionStatementPage';
import { HistoryPage } from '../components/league-info/HistoryPage';
import { CodeOfConductPage } from '../components/league-info/CodeOfConductPage';
import { PrivacyPolicyPage } from '../components/league-info/PrivacyPolicyPage';
import { BylawsPage } from '../components/league-info/BylawsPage';
import { RegulationsPage } from '../components/league-info/RegulationsPage';
import { RulesOfPlayPage } from '../components/league-info/RulesOfPlayPage';
import { FacilitiesPage } from '../components/league-info/FacilitiesPage';
import { AwardsPage } from '../components/league-info/AwardsPage';
import { RegistrationPage } from '../components/league-info/RegistrationPage';
import { SuspensionsPage } from '../components/league-info/SuspensionsPage';
import { SuperCoachingClinicPage } from '../components/league-info/SuperCoachingClinicPage';
import { CoachingRequirementsPage } from '../components/league-info/CoachingRequirementsPage';
import { CombinesPage } from '../components/league-info/CombinesPage';
import { OfficiatingRulebookPage } from '../components/league-info/OfficiatingRulebookPage';
import { OfficiatingFloorEquipmentPage } from '../components/league-info/OfficiatingFloorEquipmentPage';
import { OfficiatingRuleInterpretationsPage } from '../components/league-info/OfficiatingRuleInterpretationsPage';
import { OfficiatingOffFloorOfficialsPage } from '../components/league-info/OfficiatingOffFloorOfficialsPage';
import { OfficiatingApplicationFormPage } from '../components/league-info/OfficiatingApplicationFormPage';
import { BadStandingPage } from '../components/league-info/BadStandingPage';
import { NewPlayerInfoPage } from '../components/league-info/NewPlayerInfoPage';
import { NewPlayerInfoFemalePage } from '../components/league-info/NewPlayerInfoFemalePage';
import { GraduatingU17InfoPage } from '../components/league-info/GraduatingU17InfoPage';
import { LCALAInfoPage } from '../components/league-info/LCALAInfoPage';
import { BrandGuidelinesPage } from '../components/league-info/BrandGuidelinesPage';
import { PlanningMeetingAGMPage } from '../components/league-info/PlanningMeetingAGMPage';
import { RecordBooksPage } from '../components/league-info/RecordBooksPage';
import { DocumentsLibraryContent } from '../components/DocumentsLibraryContent';
import { ContentPageRenderer } from '../components/league-info/ContentBlockRenderer';
import { getPageDefaults } from '../utils/page-defaults';
import { mergePageContent } from '../utils/page-content-types';
import type { PageContentSchema } from '../utils/page-content-types';
import { useDocumentMeta, PAGE_META } from '../hooks/useDocumentMeta';

// Pages that MUST use their custom React components (data-driven / interactive)
// All other pages with structured defaults will render via ContentPageRenderer
const DATA_DRIVEN_PAGES = new Set([
  'suspension-guidelines',  // Fetches suspension data from API
  'facilities',             // Interactive facility data
  'documents',              // Document library browser/uploader
  'planning-meeting-agm',   // Fetches documents from CMS library
  'affiliate-links',        // Uses imported Figma asset logos
  'brand-guidelines',       // Uses imported Figma asset logos + interactive color swatches
  'awards',                 // Uses imported Figma asset photos + complex interactive layout
  'record-books',           // Interactive tabbed iframe embeds
]);

// Define the navigation structure
interface NavSection {
  title: string;
  icon: string;
  items: NavItem[];
}

interface NavItem {
  id: string;
  label: string;
  slug: string;
}

// Icon mapping
const iconMap: Record<string, any> = {
  FileText,
  Scale,
  Trophy,
  BookOpen,
  Wrench,
  Briefcase,
  Users
};

// Hardcoded default navigation - used as fallback when API fails
const DEFAULT_NAVIGATION: NavSection[] = [
  {
    title: "About",
    icon: "Briefcase",
    items: [
      { id: "rmll-executive", label: "Executive", slug: "rmll-executive" },
      { id: "mission-statement", label: "Mission Statement", slug: "mission-statement" },
      { id: "history", label: "History", slug: "history" },
      { id: "awards", label: "Awards", slug: "awards" },
      { id: "affiliate-links", label: "Affiliate Links", slug: "affiliate-links" }
    ]
  },
  {
    title: "Governance",
    icon: "Scale",
    items: [
      { id: "code-of-conduct", label: "Code of Conduct", slug: "code-of-conduct" },
      { id: "privacy-policy", label: "Privacy Policy", slug: "privacy-policy" },
      { id: "bylaws", label: "Bylaws", slug: "bylaws" },
      { id: "regulations", label: "Regulations", slug: "regulations" },
      { id: "rules-of-play", label: "Rules of Play", slug: "rules-of-play" },
      { id: "planning-meeting-agm", label: "Planning Meeting & AGM", slug: "planning-meeting-agm" },
      { id: "brand-guidelines", label: "Brand Guidelines", slug: "brand-guidelines" }
    ]
  },
  {
    title: "Resources",
    icon: "FileText",
    items: [
      { id: "documents", label: "Documents Library", slug: "documents" },
      { id: "facilities", label: "Facilities", slug: "facilities" },
      { id: "lcala-info", label: "LC & ALA Info", slug: "lcala-info" }
    ]
  },
  {
    title: "Players & Coaches",
    icon: "Users",
    items: [
      { id: "registration", label: "Intent-to-Play", slug: "registration" },
      { id: "new-player-info", label: "New Player Info", slug: "new-player-info" },
      { id: "new-player-info-female", label: "New Player Info (Female)", slug: "new-player-info-female" },
      { id: "graduating-u17-info", label: "Graduating U17 Info Sessions", slug: "graduating-u17-info" },
      { id: "super-coaching-clinic", label: "Super Coaching Clinic", slug: "super-coaching-clinic" },
      { id: "coaching-requirements", label: "Coaching Requirements", slug: "coaching-requirements" },
      { id: "combines", label: "Combines", slug: "combines" },
      { id: "suspension-guidelines", label: "Suspensions", slug: "suspension-guidelines" },
      { id: "bad-standing", label: "Bad Standing", slug: "bad-standing" },
      { id: "record-books", label: "Record Books", slug: "record-books" }
    ]
  },
  {
    title: "Officiating",
    icon: "BookOpen",
    items: [
      { id: "officiating-rulebook", label: "Rulebook", slug: "officiating-rulebook" },
      { id: "officiating-floor-equipment", label: "Floor & Equipment", slug: "officiating-floor-equipment" },
      { id: "officiating-rule-interpretations", label: "Rule Interpretations", slug: "officiating-rule-interpretations" },
      { id: "officiating-off-floor-officials", label: "Off-Floor Officials", slug: "officiating-off-floor-officials" },
      { id: "officiating-application-form", label: "Application Form", slug: "officiating-application-form" }
    ]
  }
];

export const LeagueInfoPage = memo(function LeagueInfoPage() {
  useDocumentMeta(PAGE_META.leagueInfo);

  const [navigationStructure, setNavigationStructure] = useState<NavSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string>('');
  const [activePage, setActivePage] = useState<string>('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [pageContent, setPageContent] = useState<{ title: string; content: any; isDraft?: boolean }>({ title: '', content: null });
  const [loadingPage, setLoadingPage] = useState(false);

  // Track if initial page has been set (to prevent hash handler from overriding)
  const [initialPageSet, setInitialPageSet] = useState(false);

  useEffect(() => {
    loadNavigation();
  }, []);

  const loadNavigation = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9a1ba23f/cms/league-info-navigation`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        let nav = (data.navigation && data.navigation.length > 0) ? data.navigation : DEFAULT_NAVIGATION;

        // Clean up navigation - ensure correct placement of items
        nav = nav.map((section: any) => {
          // Remove brand-guidelines and record-books from About section
          if (section.title === "About" && Array.isArray(section.items)) {
            const items = section.items.filter((item: any) =>
              item.id !== 'brand-guidelines' && item.id !== 'record-books'
            );
            return { ...section, items };
          }
          // Remove brand-guidelines and record-books from Resources section
          if (section.title === "Resources" && Array.isArray(section.items)) {
            const items = section.items.filter((item: any) =>
              item.id !== 'brand-guidelines' && item.id !== 'record-books'
            );
            return { ...section, items };
          }
          // Ensure brand-guidelines is in Governance section
          if (section.title === "Governance" && Array.isArray(section.items)) {
            const items = section.items.filter((item: any) => item.id !== 'suspension-guidelines');
            if (!items.some((item: any) => item.id === 'brand-guidelines')) {
              items.push({ id: "brand-guidelines", label: "Brand Guidelines", slug: "brand-guidelines" });
            }
            return { ...section, items };
          }
          // Ensure record-books is in Players & Coaches section
          if (section.title === "Players & Coaches" && Array.isArray(section.items)) {
            const items = section.items.filter((item: any) => item.id !== 'officiating');
            if (!items.some((item: any) => item.id === 'record-books')) {
              items.push({ id: "record-books", label: "Record Books", slug: "record-books" });
            }
            return { ...section, items };
          }
          return section;
        });

        setNavigationStructure(nav);

        // Set initial active section and page based on hash or use default
        const currentHash = window.location.hash.substring(1);
        let initialSection = nav[0];
        let initialPageId = initialSection?.items?.[0]?.id || '';

        // Check if we have an initial hash to use
        if (currentHash) {
          const hashPageId = currentHash.split('?')[0];
          for (const section of nav) {
            const item = section.items?.find((i: NavItem) => i.id === hashPageId);
            if (item) {
              initialSection = section;
              initialPageId = hashPageId;
              break;
            }
          }
        }

        setActiveSection(initialSection.title);
        setExpandedSections(new Set([initialSection.title]));
        if (initialPageId) {
          setActivePage(initialPageId);
        }
        setInitialPageSet(true);
      } else {
        // If API fails, use default navigation
        setNavigationStructure(DEFAULT_NAVIGATION);

        // Set initial active section and page based on hash or use default
        const currentHash = window.location.hash.substring(1);
        if (DEFAULT_NAVIGATION.length > 0) {
          let initialSection = DEFAULT_NAVIGATION[0];
          let initialPageId = initialSection?.items?.[0]?.id || '';

          // Check if we have an initial hash to use
          if (currentHash) {
            const hashPageId = currentHash.split('?')[0];
            for (const section of DEFAULT_NAVIGATION) {
              const item = section.items?.find((i: NavItem) => i.id === hashPageId);
              if (item) {
                initialSection = section;
                initialPageId = hashPageId;
                break;
              }
            }
          }

          setActiveSection(initialSection.title);
          setExpandedSections(new Set([initialSection.title]));
          if (initialPageId) {
            setActivePage(initialPageId);
          }
        }
        setInitialPageSet(true);
      }
    } catch (error) {
      console.error('[League Info] Error loading navigation:', error);
      // If API fails, use default navigation
      setNavigationStructure(DEFAULT_NAVIGATION);

      // Set initial active section and page based on hash or use default
      const currentHash = window.location.hash.substring(1);
      if (DEFAULT_NAVIGATION.length > 0) {
        let initialSection = DEFAULT_NAVIGATION[0];
        let initialPageId = initialSection?.items?.[0]?.id || '';

        // Check if we have an initial hash to use
        if (currentHash) {
          const hashPageId = currentHash.split('?')[0];
          for (const section of DEFAULT_NAVIGATION) {
            const item = section.items?.find((i: NavItem) => i.id === hashPageId);
            if (item) {
              initialSection = section;
              initialPageId = hashPageId;
              break;
            }
          }
        }

        setActiveSection(initialSection.title);
        setExpandedSections(new Set([initialSection.title]));
        if (initialPageId) {
          setActivePage(initialPageId);
        }
      }
      setInitialPageSet(true);
    } finally {
      setLoading(false);
    }
  };

  // Handle hash navigation for user-initiated hash changes (e.g., clicking nav links)
  // The initial hash is handled in loadNavigation, so this only handles subsequent changes
  useEffect(() => {
    if (navigationStructure.length === 0 || !initialPageSet) return;

    const handleHashChange = () => {
      const hash = window.location.hash.substring(1); // Remove #

      // Extract page ID from hash (strip query params like ?doc=123)
      const pageId = hash.split('?')[0];
      if (!pageId) return;

      // Find the section and page that matches the hash
      for (const section of navigationStructure) {
        for (const item of section.items || []) {
          if (item.id === pageId) {
            setActiveSection(section.title);
            setActivePage(pageId);
            setExpandedSections(new Set([section.title]));
            return;
          }
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [navigationStructure, initialPageSet]);

  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(section)) {
        newExpanded.delete(section);
      } else {
        newExpanded.add(section);
      }
      return newExpanded;
    });
  }, []);

  const handleNavClick = useCallback((sectionTitle: string, item: NavItem) => {
    setActiveSection(sectionTitle);
    setActivePage(item.id);
    
    // Close mobile nav when an item is selected
    setIsMobileNavOpen(false);
    
    // Auto-collapse sidebar when Documents Library is selected
    if (item.id === 'documents') {
      setIsSidebarCollapsed(true);
    }
    
    // Ensure the section is expanded
    setExpandedSections(prev => {
      if (!prev.has(sectionTitle)) {
        return new Set([...prev, sectionTitle]);
      }
      return prev;
    });
  }, []);

  const handleHomeClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    (window as any).navigateToPath('/');
  }, []);

  // Client-side slug-to-component mapping for fallback when API is unreachable
  const COMPONENT_MAP: Record<string, { title: string; component: JSX.Element }> = {
    'rmll-executive': { title: 'RMLL Executive', component: <RMLLExecutivePage /> },
    'affiliate-links': { title: 'Affiliate Links', component: <AffiliateLinksPage /> },
    'mission-statement': { title: 'Mission Statement', component: <MissionStatementPage /> },
    'history': { title: 'League History', component: <HistoryPage /> },
    'code-of-conduct': { title: 'Code of Conduct', component: <CodeOfConductPage /> },
    'privacy-policy': { title: 'Privacy Policy', component: <PrivacyPolicyPage /> },
    'bylaws': { title: 'Bylaws', component: <BylawsPage /> },
    'regulations': { title: 'Regulations', component: <RegulationsPage /> },
    'rules-of-play': { title: 'Rules of Play', component: <RulesOfPlayPage /> },
    'facilities': { title: 'Facilities', component: <FacilitiesPage /> },
    'awards': { title: 'Awards', component: <AwardsPage /> },
    'registration': { title: 'Intent-to-Play', component: <RegistrationPage /> },
    'suspension-guidelines': { title: 'Current Season Suspensions', component: <SuspensionsPage /> },
    'super-coaching-clinic': { title: 'Super Coaching Clinic', component: <SuperCoachingClinicPage /> },
    'coaching-requirements': { title: 'Coaching Requirements', component: <CoachingRequirementsPage /> },
    'combines': { title: 'Combines', component: <CombinesPage /> },
    'documents': { title: 'Documents Library', component: <DocumentsLibraryContent /> },
    'officiating-rulebook': { title: 'Officiating Rulebook', component: <OfficiatingRulebookPage /> },
    'officiating-floor-equipment': { title: 'Floor & Equipment', component: <OfficiatingFloorEquipmentPage /> },
    'officiating-rule-interpretations': { title: 'Rule Interpretations', component: <OfficiatingRuleInterpretationsPage /> },
    'officiating-off-floor-officials': { title: 'Off-Floor Officials', component: <OfficiatingOffFloorOfficialsPage /> },
    'officiating-application-form': { title: 'Application Form', component: <OfficiatingApplicationFormPage /> },
    'bad-standing': { title: 'Bad Standing', component: <BadStandingPage /> },
    'new-player-info': { title: 'New Player Information', component: <NewPlayerInfoPage /> },
    'new-player-info-female': { title: 'New Player Information (Female)', component: <NewPlayerInfoFemalePage /> },
    'graduating-u17-info': { title: 'Graduating U17 Info Sessions', component: <GraduatingU17InfoPage /> },
    'lcala-info': { title: 'LCALA Information', component: <LCALAInfoPage /> },
    'brand-guidelines': { title: 'Brand Guidelines', component: <BrandGuidelinesPage /> },
    'planning-meeting-agm': { title: 'Planning Meeting & AGM', component: <PlanningMeetingAGMPage /> },
    'record-books': { title: 'Record Books', component: <RecordBooksPage /> },
  };

const loadPageContent = async (pageId: string) => {
    try {
      setLoadingPage(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9a1ba23f/cms/league-info-content/${pageId}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.content) {
          // ── Priority -1: Absolute override for interactive tools/pages ──
          // This ensures CMS saves don't delete your interactive React components
          if (DATA_DRIVEN_PAGES.has(pageId) && COMPONENT_MAP[pageId]) {
            setPageContent({
              title: data.content.title || COMPONENT_MAP[pageId].title,
              content: COMPONENT_MAP[pageId].component,
              isDraft: data.content.isDraft
            });
          }
          // ── Priority 0: Structured content (block-based editing) with EXPLICIT override
          else if (data.content.hasOverride === true && data.content.structuredContent) {
            const defaults = getPageDefaults(pageId);
            const schema = defaults
              ? mergePageContent(defaults, data.content.structuredContent as Partial<PageContentSchema>)
              : data.content.structuredContent as PageContentSchema;
            setPageContent({
              title: data.content.title,
              content: <ContentPageRenderer schema={schema} />,
              isDraft: data.content.isDraft
            });
          }
          // ── Priority 1: Original React component (no CMS override) ──
          else if (COMPONENT_MAP[pageId]) {
            setPageContent({
              title: data.content.title || COMPONENT_MAP[pageId].title,
              content: COMPONENT_MAP[pageId].component,
              isDraft: data.content.isDraft
            });
          }
          // ── Priority 2: KV HTML override (admin-edited content) ──
          else if (data.content.hasKvOverride && data.content.htmlContent && data.content.content) {
            setPageContent({
              title: data.content.title,
              content: <div dangerouslySetInnerHTML={{ __html: data.content.content }} />,
              isDraft: data.content.isDraft
            });
          }
          // ── Fallback ──
          else {
            setPageContent(data.content);
          }
        }
      } else {
        console.error('[League Info] Failed to load page:', pageId);
        const fallback = COMPONENT_MAP[pageId];
        if (fallback) {
          setPageContent({ title: fallback.title, content: fallback.component });
        } else {
          setPageContent({
            title: 'Page Not Found',
            content: <p>This page could not be loaded.</p>
          });
        }
      }
    } catch (error) {
      console.error('[League Info] Error loading page content:', error);
      const fallback = COMPONENT_MAP[pageId];
      if (fallback) {
        setPageContent({ title: fallback.title, content: fallback.component });
      } else {
        setPageContent({
          title: 'Error',
          content: <p>An error occurred while loading this page.</p>
        });
      }
    } finally {
      setLoadingPage(false);
    }
  };

  useEffect(() => {
    if (activePage) {
      loadPageContent(activePage);
      // Scroll to top when page changes
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activePage]);

  // Listen for internal navigation events from child pages
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.pageId) {
        // Find the section that contains this page
        for (const section of navigationStructure) {
          const item = section.items.find((i: NavItem) => i.id === detail.pageId);
          if (item) {
            handleNavClick(section.title, item);
            break;
          }
        }
      }
    };
    window.addEventListener('rmll-league-info-navigate', handler);
    return () => window.removeEventListener('rmll-league-info-navigate', handler);
  }, [navigationStructure, handleNavClick]);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Page Header */}
      <div className="bg-gradient-to-br from-[#013fac] via-[#0149c9] to-[#4b5baa] text-white border-b-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="w-full px-4 sm:px-6 py-6 sm:py-8 lg:py-10">
          <div className="flex items-center gap-2 text-blue-100 mb-2 text-xs sm:text-sm">
            <button onClick={handleHomeClick} className="hover:text-white transition-colors font-bold">Home</button>
            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="font-extrabold">League Information</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl mb-2 font-extrabold tracking-tight">League Information</h1>
          <p className="text-sm sm:text-base text-blue-50 max-w-2xl font-medium">
            Everything you need to know about the Rocky Mountain Lacrosse League
          </p>
        </div>
      </div>

      {/* Mobile Slide-Out Navigation Drawer */}
      {isMobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 transition-opacity"
            onClick={() => setIsMobileNavOpen(false)}
          />
          {/* Drawer */}
          <div className="absolute inset-y-0 left-0 w-[85%] max-w-sm bg-white shadow-2xl flex flex-col animate-[slideInLeft_0.25s_ease-out]">
            {/* Drawer Header */}
            <div className="bg-gradient-to-r from-[#013fac] to-[#0149c9] text-white px-4 py-3 border-b-2 border-black flex items-center justify-between shrink-0">
              <h2 className="text-base font-extrabold tracking-wide">NAVIGATION</h2>
              <button
                onClick={() => setIsMobileNavOpen(false)}
                className="flex items-center justify-center w-8 h-8 hover:bg-blue-700 transition-colors rounded"
                aria-label="Close navigation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Body - Scrollable */}
            <nav className="flex-1 overflow-y-auto overscroll-contain p-2">
              {navigationStructure.map((section) => {
                const Icon = iconMap[section.icon];
                const isExpanded = expandedSections.has(section.title);
                const isActiveSection = activeSection === section.title;

                return (
                  <div key={section.title} className="mb-2">
                    <button
                      onClick={() => toggleSection(section.title)}
                      className={`
                        w-full flex items-center justify-between px-3 py-2.5 text-left transition-all border-2 rounded text-sm
                        ${isActiveSection
                          ? 'bg-gradient-to-r from-[#013fac] to-[#0149c9] text-white border-black font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                          : 'text-gray-900 hover:bg-gray-50 border-gray-300 hover:border-gray-400 font-bold'
                        }
                      `}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        <span>{section.title}</span>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 flex-shrink-0" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="mt-1.5 ml-3 space-y-0.5 border-l-4 border-blue-200 pl-2">
                        {section.items.map((item, itemIndex) => {
                          const isActive = activePage === item.id;
                          return (
                            <button
                              key={`drawer-${section.title}-${item.id}-${itemIndex}`}
                              onClick={() => handleNavClick(section.title, item)}
                              className={`
                                w-full text-left px-3 py-2 transition-all text-sm rounded
                                ${isActive
                                  ? 'bg-blue-50 text-blue-900 font-bold border-l-4 border-[#013fac]'
                                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 border-l-4 border-transparent font-bold'
                                }
                              `}
                            >
                              {item.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* Drawer Footer */}
            <div className="shrink-0 border-t-2 border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-xs text-gray-500 text-center">
                Viewing: <strong className="text-gray-700">{pageContent.title}</strong>
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="w-full px-4 sm:px-6 py-4 sm:py-6 lg:py-8">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 relative">
          {/* Mobile Navigation Toggle */}
          <button
            onClick={() => setIsMobileNavOpen(true)}
            className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-[#013fac] text-white font-bold text-sm border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
          >
            <Menu className="h-4 w-4" />
            <span>Browse Sections</span>
            {pageContent.title && (
              <span className="text-blue-200 font-normal ml-1 truncate">— {pageContent.title}</span>
            )}
          </button>

          {/* Left Sidebar Navigation — Desktop only */}
          <aside className={`
            hidden lg:block flex-shrink-0 transition-all duration-300 ease-in-out
            ${isSidebarCollapsed ? 'lg:w-0 lg:opacity-0 lg:overflow-hidden lg:absolute lg:-left-full' : 'lg:w-80 lg:opacity-100'}
          `}>
            <div className="sticky top-24 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
              <div className="bg-gradient-to-r from-[#013fac] to-[#0149c9] text-white px-5 py-3 border-b-2 border-black flex items-center justify-between">
                <h2 className="text-lg font-extrabold tracking-wide">NAVIGATION</h2>
                <button
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  className="flex items-center justify-center w-8 h-8 hover:bg-blue-700 transition-colors rounded"
                  aria-label="Collapse sidebar"
                  title="Collapse sidebar"
                >
                  <ChevronsLeft className="h-5 w-5" />
                </button>
              </div>

              <nav className="p-2">
                {navigationStructure.map((section) => {
                  const Icon = iconMap[section.icon];
                  const isExpanded = expandedSections.has(section.title);
                  const isActiveSection = activeSection === section.title;

                  return (
                    <div key={section.title} className="mb-2">
                      <button
                        onClick={() => toggleSection(section.title)}
                        className={`
                          w-full flex items-center justify-between px-3 py-2 text-left transition-all border-2 rounded text-sm
                          ${isActiveSection
                            ? 'bg-gradient-to-r from-[#013fac] to-[#0149c9] text-white border-black font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                            : 'text-gray-900 hover:bg-gray-50 border-gray-300 hover:border-gray-400 font-bold'
                          }
                        `}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 flex-shrink-0" />
                          <span>{section.title}</span>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="h-4 w-4 flex-shrink-0" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="mt-1.5 ml-3 space-y-1 border-l-4 border-blue-200 pl-2">
                          {section.items.map((item, itemIndex) => {
                            const isActive = activePage === item.id;
                            return (
                              <button
                                key={`${section.title}-${item.id}-${itemIndex}`}
                                onClick={() => handleNavClick(section.title, item)}
                                className={`
                                  w-full text-left px-3 py-1.5 transition-all text-sm rounded
                                  ${isActive
                                    ? 'bg-blue-50 text-blue-900 font-bold border-l-4 border-[#013fac]'
                                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 border-l-4 border-transparent font-bold'
                                  }
                                `}
                              >
                                {item.label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className={`
            flex-1 min-w-0 transition-all duration-300 ease-in-out
            ${isSidebarCollapsed ? 'lg:ml-0' : ''}
          `}>
            {/* Expand Sidebar Button - Only shown when collapsed */}
            {isSidebarCollapsed && (
              <button
                onClick={() => setIsSidebarCollapsed(false)}
                className="hidden lg:flex items-center gap-2 mb-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all rounded"
                aria-label="Expand sidebar"
              >
                <ChevronsRight className="h-5 w-5" />
                <span className="font-bold">Show Navigation</span>
              </button>
            )}
            
            <article className="bg-white border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              {/* Content Header */}
              <header className="border-b-2 border-black px-4 sm:px-6 lg:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-50 via-white to-blue-50">
                <div className="flex items-center gap-3">
                  <div className="h-8 sm:h-10 w-1 bg-gradient-to-b from-[#013fac] to-[#4b5baa]"></div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl text-gray-900 font-extrabold tracking-tight">{pageContent.title}</h1>
                </div>
              </header>

              {/* Content Body */}
              <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                <div className="prose prose-sm max-w-none
                  prose-headings:font-bold prose-headings:text-gray-900
                  prose-h2:text-lg prose-h2:sm:text-xl prose-h2:mt-6 prose-h2:mb-3 prose-h2:pb-2 prose-h2:border-b-2 prose-h2:border-[#013fac]
                  prose-h3:text-base prose-h3:sm:text-lg prose-h3:mt-4 prose-h3:mb-2
                  prose-p:text-sm prose-p:sm:text-base prose-p:text-gray-700 prose-p:leading-relaxed prose-p:font-semibold
                  prose-a:text-[#013fac] prose-a:font-bold prose-a:no-underline hover:prose-a:text-[#0149c9] hover:prose-a:underline
                  prose-ul:text-sm prose-ul:sm:text-base prose-ul:text-gray-700 prose-ul:font-semibold
                  prose-li:my-0.5
                  prose-strong:text-gray-900 prose-strong:font-extrabold
                  prose-code:text-xs prose-code:sm:text-sm prose-code:bg-blue-50 prose-code:text-[#013fac] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-semibold
                  prose-blockquote:border-l-4 prose-blockquote:border-[#013fac] prose-blockquote:bg-blue-50 prose-blockquote:text-sm prose-blockquote:sm:text-base prose-blockquote:font-semibold
                  prose-table:text-sm prose-table:sm:text-base prose-table:font-semibold
                ">
                  {pageContent.content}
                </div>
              </div>
            </article>
          </main>
        </div>
      </div>
    </div>
  );
});