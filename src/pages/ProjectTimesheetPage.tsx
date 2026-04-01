import { useState } from 'react';
import { FileText, Clock, DollarSign, ChevronDown, ChevronUp, CheckCircle2, Plus, ArrowRight, Server, Shield, Wrench, TrendingUp, Sparkles, ShoppingCart, Camera, CalendarCheck, Users, Globe, BarChart3, Megaphone } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
 *  DATA
 * ═══════════════════════════════════════════════════════════════ */

interface TimeEntry {
  phase: string;
  task: string;
  description: string;
  hours: number;
  status: 'complete' | 'in-progress' | 'not-started';
  category: 'quoted' | 'additional' | 'production' | 'change-request';
}

interface QuotedLineItem {
  service: string;
  premiumPrice: number;
  templatePrice: number;
  description: string;
}

const QUOTED_LINE_ITEMS: QuotedLineItem[] = [
  { service: 'UI/UX Design', premiumPrice: 3500, templatePrice: 1750, description: 'The overall look and feel of the site. Premium includes a fully custom design tailored to RMLL.' },
  { service: 'Development & CMS Setup', premiumPrice: 6000, templatePrice: 3500, description: 'The behind-the-scenes build of the website in WordPress.' },
  { service: 'Content Migration & Reorganization', premiumPrice: 3000, templatePrice: 3000, description: 'Moving and cleaning up all existing content (pages, bylaws, forms, budgets).' },
  { service: 'Historical Data Migration', premiumPrice: 3000, templatePrice: 3000, description: 'Extracting old results and stats from PDFs/Excel into searchable tables.' },
  { service: 'News & Media Module', premiumPrice: 1000, templatePrice: 1000, description: 'League updates, news, photos, and videos section.' },
  { service: 'Accessibility & SEO', premiumPrice: 1000, templatePrice: 1000, description: 'Accessibility standards and Google optimization.' },
  { service: 'QA, Training & Launch', premiumPrice: 1000, templatePrice: 1000, description: 'Full testing, staff training, and launch support.' },
  { service: 'Plugin Licensing', premiumPrice: 120, templatePrice: 120, description: 'Annual license for wpDataTables plugin.' },
];

const TIME_ENTRIES: TimeEntry[] = [
  // Phase 1 — Discovery & Architecture
  { phase: 'Phase 1: Discovery & Architecture', task: 'Kickoff & Requirements Gathering', description: 'Initial meetings, reviewing existing site, documenting all content pages, understanding SportzSoft API structure', hours: 6, status: 'complete', category: 'quoted' },
  { phase: 'Phase 1: Discovery & Architecture', task: 'SportzSoft API Integration Research', description: 'Reverse-engineering the SportzSoft REST API (undocumented), mapping division IDs, season IDs, testing endpoints for schedules, standings, stats, rosters, drafts, transactions, protected lists', hours: 14, status: 'complete', category: 'additional' },
  { phase: 'Phase 1: Discovery & Architecture', task: 'Information Architecture & Sitemap', description: 'Designing navigation structure, division hierarchy, page routing for 20+ division subdivisions, league info sections', hours: 5, status: 'complete', category: 'quoted' },
  { phase: 'Phase 1: Discovery & Architecture', task: 'Technology Stack Selection', description: 'Evaluating and selecting React + Tailwind + Supabase architecture (replacing originally-scoped WordPress + Elementor) for better performance with live data requirements', hours: 3, status: 'complete', category: 'quoted' },

  // Phase 2 — UI/UX Design
  { phase: 'Phase 2: UI/UX Design', task: 'Custom Homepage Design', description: 'Mobile-first hero section, live score ticker, schedule/standings/stats widgets, news section, NLL Roughnecks schedule, newsletter signup', hours: 10, status: 'complete', category: 'quoted' },
  { phase: 'Phase 2: UI/UX Design', task: 'Division Pages Design', description: 'Tab-based layout for Schedule, Standings, Stats, Teams, Drafts, Protected Lists, Transactions, Season Info, Awards, Championships across all divisions', hours: 8, status: 'complete', category: 'quoted' },
  { phase: 'Phase 2: UI/UX Design', task: 'Component Library / Design System', description: 'Building reusable UI component library (50+ shadcn/ui components), establishing color system, typography, responsive breakpoints', hours: 6, status: 'complete', category: 'quoted' },
  { phase: 'Phase 2: UI/UX Design', task: 'Team Detail Pages Design', description: 'Team profile pages with roster, schedule, stats, transaction history, team colors, logo integration (Change Request CR-001)', hours: 5, status: 'complete', category: 'change-request' },
  { phase: 'Phase 2: UI/UX Design', task: 'Player Profile Pages Design', description: 'Individual player stat pages with career data, game logs (Change Request CR-002)', hours: 4, status: 'complete', category: 'change-request' },

  // Phase 3 — Core Development
  { phase: 'Phase 3: Core Development', task: 'Application Framework & Routing', description: 'React SPA with client-side routing, lazy loading, DivisionContext, NavigationContext, AuthContext providers', hours: 8, status: 'complete', category: 'quoted' },
  { phase: 'Phase 3: Core Development', task: 'SportzSoft API Service Layer', description: 'Full API client with proxy server, type definitions, response parsing, error handling, caching strategy for all SportzSoft endpoints', hours: 18, status: 'complete', category: 'additional' },
  { phase: 'Phase 3: Core Development', task: 'Server-Side API Proxy', description: 'Hono web server on Supabase Edge Functions proxying SportzSoft API requests, CORS handling, key management', hours: 6, status: 'complete', category: 'additional' },
  { phase: 'Phase 3: Core Development', task: 'Schedule System', description: 'Live schedule display with date grouping, game details modal, game sheet PDF generation, filtering by division/subdivision, "Add to Calendar" feature', hours: 12, status: 'complete', category: 'quoted' },
  { phase: 'Phase 3: Core Development', task: 'Standings System', description: 'Live standings tables with sorting, subdivision filtering, team linking, responsive mobile layout', hours: 6, status: 'complete', category: 'quoted' },
  { phase: 'Phase 3: Core Development', task: 'Stats & League Leaders', description: 'Player statistics tables with sorting, league leaders display, division/subdivision filtering', hours: 8, status: 'complete', category: 'quoted' },
  { phase: 'Phase 3: Core Development', task: 'Teams Listing Page', description: 'Team listing grid with division/subdivision filtering and team cards', hours: 4, status: 'complete', category: 'quoted' },
  { phase: 'Phase 3: Core Development', task: 'Team Detail Pages Development', description: 'Individual team pages with roster, schedule, stats, transactions, team colors, logo integration (Change Request CR-001)', hours: 10, status: 'complete', category: 'change-request' },
  { phase: 'Phase 3: Core Development', task: 'Player Profile System', description: 'Individual player profile pages with career stats and game logs (Change Request CR-002)', hours: 8, status: 'complete', category: 'change-request' },
  { phase: 'Phase 3: Core Development', task: 'Draft System', description: 'Division draft picks display with round-by-round view, season filtering, client-side season filter fix — NOT in original scope', hours: 6, status: 'complete', category: 'additional' },
  { phase: 'Phase 3: Core Development', task: 'Protected Lists System', description: 'Team protected player lists display — NOT in original scope', hours: 4, status: 'complete', category: 'additional' },
  { phase: 'Phase 3: Core Development', task: 'Transactions System', description: 'Player transaction history with filtering, division/team views — NOT in original scope', hours: 5, status: 'complete', category: 'additional' },
  { phase: 'Phase 3: Core Development', task: 'Live Score Ticker', description: 'Real-time scrolling score ticker on homepage showing recent/upcoming games — NOT in original scope', hours: 5, status: 'complete', category: 'additional' },
  { phase: 'Phase 3: Core Development', task: 'Homepage Stats Dashboard', description: 'Dynamic homepage widgets pulling live aggregate league statistics — NOT in original scope', hours: 4, status: 'complete', category: 'additional' },
  { phase: 'Phase 3: Core Development', task: 'NLL Roughnecks Schedule Widget', description: 'Calgary Roughnecks NLL schedule integration on homepage — NOT in original scope', hours: 2, status: 'complete', category: 'additional' },
  { phase: 'Phase 3: Core Development', task: 'Game Sheet PDF Generation', description: 'In-browser PDF generation of game details/box scores — NOT in original scope', hours: 4, status: 'complete', category: 'additional' },
  { phase: 'Phase 3: Core Development', task: 'Header & Navigation', description: 'Responsive mega-menu header with division dropdowns, mobile hamburger menu, dynamic navigation from CMS', hours: 8, status: 'complete', category: 'quoted' },
  { phase: 'Phase 3: Core Development', task: 'Footer', description: 'Site footer with navigation links, attribution logos (Altered Digital, SportzSoft), responsive layout', hours: 2, status: 'complete', category: 'quoted' },

  // Phase 4 — CMS & Backend
  { phase: 'Phase 4: CMS & Backend', task: 'Authentication System', description: 'Supabase Auth integration with admin login, user roles (admin/editor/viewer), session management, security hardening', hours: 8, status: 'complete', category: 'quoted' },
  { phase: 'Phase 4: CMS & Backend', task: 'CMS Dashboard', description: 'Full admin dashboard with tabbed interface for all content management modules', hours: 6, status: 'complete', category: 'quoted' },
  { phase: 'Phase 4: CMS & Backend', task: 'News Manager', description: 'CRUD for news articles with rich text editor, image uploads, featured images, publish/draft status', hours: 8, status: 'complete', category: 'quoted' },
  { phase: 'Phase 4: CMS & Backend', task: 'Document Library & Manager', description: 'Searchable document library with categories, file uploads to Supabase Storage, bulk uploader, XML importer', hours: 10, status: 'complete', category: 'quoted' },
  { phase: 'Phase 4: CMS & Backend', task: 'Page Manager & Content Editor', description: 'CMS-editable league info pages with rich text blocks, content block renderer, 25+ page defaults', hours: 12, status: 'complete', category: 'quoted' },
  { phase: 'Phase 4: CMS & Backend', task: 'Navigation Editor', description: 'Drag-and-drop CMS navigation management with integrated page editing — NOT in original scope', hours: 6, status: 'complete', category: 'additional' },
  { phase: 'Phase 4: CMS & Backend', task: 'Image Manager', description: 'Supabase Storage image management with upload, organize, and embed in content — NOT in original scope as standalone module', hours: 4, status: 'complete', category: 'additional' },
  { phase: 'Phase 4: CMS & Backend', task: 'Division Manager', description: 'CMS division configuration management — NOT in original scope', hours: 4, status: 'complete', category: 'additional' },
  { phase: 'Phase 4: CMS & Backend', task: 'Suspensions Manager', description: 'Full CMS for managing suspension/discipline records by season with carryovers and association statuses — NOT in original scope', hours: 8, status: 'complete', category: 'additional' },
  { phase: 'Phase 4: CMS & Backend', task: 'Awards & Championships Editors', description: 'CMS editors for division awards and championship history — NOT in original scope', hours: 6, status: 'complete', category: 'additional' },
  { phase: 'Phase 4: CMS & Backend', task: 'Season Info Editor', description: 'CMS for division season information management — NOT in original scope', hours: 3, status: 'complete', category: 'additional' },
  { phase: 'Phase 4: CMS & Backend', task: 'Announcement/Popup System', description: 'CMS-managed site-wide announcement popups — NOT in original scope', hours: 3, status: 'complete', category: 'additional' },
  { phase: 'Phase 4: CMS & Backend', task: 'Email Manager', description: 'Contact form with Resend email integration, email templates — NOT in original scope', hours: 4, status: 'complete', category: 'additional' },
  { phase: 'Phase 4: CMS & Backend', task: 'User Manager', description: 'Admin panel for creating/editing/deleting CMS users with role management', hours: 4, status: 'complete', category: 'additional' },
  { phase: 'Phase 4: CMS & Backend', task: 'Settings Manager', description: 'Site-wide settings management (GA ID, site title, meta descriptions, etc.)', hours: 3, status: 'complete', category: 'additional' },
  { phase: 'Phase 4: CMS & Backend', task: 'Server Routes & API Endpoints', description: '9 server route modules: auth, content, documents, images, settings, config, email, suspensions, link checker', hours: 10, status: 'complete', category: 'quoted' },

  // Phase 5 — Content Migration
  { phase: 'Phase 5: Content Migration', task: 'League Info Pages Migration', description: 'Migrating and reformatting 25+ content pages: Bylaws, Regulations, Rules of Play, Code of Conduct, Mission Statement, Executive, History, Registration, Coaching Requirements, etc.', hours: 16, status: 'complete', category: 'quoted' },
  { phase: 'Phase 5: Content Migration', task: 'Suspensions Historical Data', description: 'Entering 4+ years of suspension/discipline records (2022-2025) with all details — 1000+ records', hours: 10, status: 'complete', category: 'quoted' },
  { phase: 'Phase 5: Content Migration', task: 'Awards & Championships Data', description: 'Migrating historical awards and championship data for Sr. B, Jr. B Tier II divisions', hours: 4, status: 'complete', category: 'quoted' },
  { phase: 'Phase 5: Content Migration', task: 'Facilities Data', description: 'Compiling arena/facility information across all teams', hours: 2, status: 'complete', category: 'quoted' },

  // Phase 6 — SEO, Accessibility & Production Hardening
  { phase: 'Phase 6: SEO, Accessibility & Production', task: 'SEO Optimization', description: 'Dynamic document titles, meta descriptions, Open Graph tags, Twitter Cards, canonical URLs, robots directives for every page via useDocumentMeta hook', hours: 6, status: 'complete', category: 'quoted' },
  { phase: 'Phase 6: SEO, Accessibility & Production', task: 'Structured Data / JSON-LD', description: 'SportsOrganization and WebSite schema markup for search engine rich results', hours: 2, status: 'complete', category: 'quoted' },
  { phase: 'Phase 6: SEO, Accessibility & Production', task: 'Semantic HTML & Accessibility', description: 'ARIA labels, semantic landmarks (<main>, <nav>), keyboard navigation, screen reader compatibility', hours: 3, status: 'complete', category: 'quoted' },
  { phase: 'Phase 6: SEO, Accessibility & Production', task: 'Google Analytics 4 Integration', description: 'CMS-configurable GA4 measurement ID, SPA page view tracking, gtag.js loader component — NOT in original scope', hours: 3, status: 'complete', category: 'additional' },
  { phase: 'Phase 6: SEO, Accessibility & Production', task: 'Site-Wide Search (Command Palette)', description: 'Ctrl/Cmd+K search modal searching news, pages, divisions, documents with relevance scoring and keyboard navigation — NOT in original scope', hours: 6, status: 'complete', category: 'additional' },
  { phase: 'Phase 6: SEO, Accessibility & Production', task: 'Broken Link Checker', description: 'CMS tool that scans all content sources for external URLs and batch-verifies them with inline replacement — NOT in original scope', hours: 5, status: 'complete', category: 'additional' },
  { phase: 'Phase 6: SEO, Accessibility & Production', task: 'Console Log Cleanup', description: 'Removing/silencing all debug console.log statements across entire codebase for production', hours: 3, status: 'complete', category: 'production' },
  { phase: 'Phase 6: SEO, Accessibility & Production', task: 'Bug Fixes — Drafts Season Filter', description: 'Fixing draft data showing wrong season via client-side season filtering in useDivisionDraft.ts', hours: 2, status: 'complete', category: 'production' },
  { phase: 'Phase 6: SEO, Accessibility & Production', task: 'Bug Fixes — Inactive Division Data Leak', description: 'Hiding Drafts/Protected Lists/Transactions tabs for inactive divisions (Jr. B Tier III), repositioning status banner', hours: 2, status: 'complete', category: 'production' },
  { phase: 'Phase 6: SEO, Accessibility & Production', task: 'Bug Fixes — Suspensions Game Count', description: 'Fixing parseGameCount regex extracting year numbers (2023, 2024) from text-based suspension strings, inflating totals by thousands', hours: 1, status: 'complete', category: 'production' },
  { phase: 'Phase 6: SEO, Accessibility & Production', task: 'Security Hardening', description: 'Removing /setup-admin endpoint with hardcoded credentials, deleting unused SetupAdminPage, securing admin account creation to CMS-only', hours: 1, status: 'complete', category: 'production' },
  { phase: 'Phase 6: SEO, Accessibility & Production', task: 'Footer Attribution & Legal Pages', description: 'Attribution links with logos, Privacy Policy page, Terms of Service page', hours: 2, status: 'complete', category: 'quoted' },

  // Phase 7 — Specialized Content Pages (Beyond Scope)
  { phase: 'Phase 7: Specialized Content Pages', task: 'Suspensions & Discipline Page', description: 'Multi-season suspension browser with card/table views, filtering by division/team/offense type, search, stats dashboard — NOT in original scope', hours: 10, status: 'complete', category: 'additional' },
  { phase: 'Phase 7: Specialized Content Pages', task: 'Officiating Section (4 pages)', description: 'Application Form, Floor Equipment, Off-Floor Officials, Rule Interpretations, Rulebook pages — NOT in original scope as separate section', hours: 4, status: 'complete', category: 'additional' },
  { phase: 'Phase 7: Specialized Content Pages', task: 'Awards & Championships Display Pages', description: 'Public-facing awards and championships history pages with filtering — NOT in original scope', hours: 4, status: 'complete', category: 'additional' },
  { phase: 'Phase 7: Specialized Content Pages', task: 'Brand Guidelines Page', description: 'RMLL brand standards page — NOT in original scope', hours: 1, status: 'complete', category: 'additional' },
  { phase: 'Phase 7: Specialized Content Pages', task: 'Combines & Events Page', description: 'Combine/tryout information page — NOT in original scope', hours: 1, status: 'complete', category: 'additional' },
  { phase: 'Phase 7: Specialized Content Pages', task: 'Newsletter Signup Component', description: 'Email newsletter signup integration — NOT in original scope', hours: 1, status: 'complete', category: 'additional' },
  { phase: 'Phase 7: Specialized Content Pages', task: 'Contact Page with Form', description: 'Contact page with server-side email delivery via Resend — NOT in original scope', hours: 3, status: 'complete', category: 'additional' },
  { phase: 'Phase 7: Specialized Content Pages', task: 'Franchise Certificate Component', description: 'Printable franchise certificate generator — NOT in original scope', hours: 2, status: 'complete', category: 'additional' },
];

/* ═══════════════════════════════════════════════════════════════
 *  FUTURE ENHANCEMENTS DATA
 * ═══════════════════════════════════════════════════════════════ */

interface Enhancement {
  id: string;
  title: string;
  icon: React.ReactNode;
  summary: string;
  description: string;
  features: string[];
  estimatedHours: { low: number; high: number };
  rate: number; // $/hr
  complexity: 'moderate' | 'high' | 'very-high';
  dependencies?: string;
}

const HOURLY_RATE = 125; // ad-hoc rate

const FUTURE_ENHANCEMENTS: Enhancement[] = [
  {
    id: 'ecommerce',
    title: 'e-Commerce / Merchandise Store',
    icon: <ShoppingCart className="w-5 h-5" />,
    summary: 'Full online store for RMLL-branded merchandise, team gear, and event tickets.',
    description: 'A complete e-Commerce solution integrated into the RMLL website, enabling the league and member teams to sell branded merchandise, apparel, equipment, and event tickets directly to fans. Includes a product catalog with variants (size, color), shopping cart, secure checkout via Stripe, order management dashboard in the CMS, inventory tracking, shipping calculation, tax handling, and email order confirmations.',
    features: [
      'Product catalog with categories, variants (size/color), images, and descriptions',
      'Shopping cart with persistent state (localStorage + server sync)',
      'Secure checkout flow with Stripe payment processing',
      'Order management dashboard in CMS (view, fulfill, refund orders)',
      'Inventory tracking with low-stock alerts',
      'Shipping rate calculation and tax handling (GST)',
      'Email order confirmations and shipping notifications via Resend',
      'Discount codes and promotional pricing',
      'Team-specific merchandise collections (per-team storefronts)',
      'Sales analytics and reporting dashboard',
    ],
    estimatedHours: { low: 80, high: 120 },
    rate: HOURLY_RATE,
    complexity: 'very-high',
    dependencies: 'Stripe account setup and configuration required',
  },
  {
    id: 'media-gallery',
    title: 'Media Gallery & Photo Albums',
    icon: <Camera className="w-5 h-5" />,
    summary: 'Photo and video galleries organized by event, season, and division.',
    description: 'A media management system allowing RMLL administrators to upload, organize, and showcase photos and videos from games, events, and ceremonies. Includes album management, bulk upload, image optimization, lightbox viewing, social sharing, and optional integration with external services like Flickr or Google Photos.',
    features: [
      'Album creation and management in CMS with drag-and-drop ordering',
      'Bulk image upload with automatic compression and thumbnail generation',
      'Responsive masonry grid layout with lightbox viewer',
      'Video embedding support (YouTube, Vimeo)',
      'Tag-based filtering by division, team, season, and event',
      'Social media sharing for individual photos and albums',
      'Featured gallery widget for homepage',
    ],
    estimatedHours: { low: 35, high: 50 },
    rate: HOURLY_RATE,
    complexity: 'moderate',
  },
  {
    id: 'event-registration',
    title: 'Event Registration & Ticketing',
    icon: <CalendarCheck className="w-5 h-5" />,
    summary: 'Online registration for camps, combines, and clinics with optional ticketing.',
    description: 'A registration and ticketing system for RMLL events such as combines, coaching clinics, referee certification, and special events. Includes registration forms with custom fields, payment collection via Stripe, capacity limits, waitlists, confirmation emails, and an admin dashboard for managing registrations and attendance.',
    features: [
      'CMS-managed event creation with custom registration fields',
      'Online payment collection via Stripe (or free registration)',
      'Capacity limits with automatic waitlist management',
      'Registration confirmation and reminder emails',
      'QR code check-in for event day',
      'Admin dashboard for viewing/exporting registrations',
      'Calendar integration (iCal/Google Calendar event links)',
      'Early-bird and group discount pricing',
    ],
    estimatedHours: { low: 45, high: 65 },
    rate: HOURLY_RATE,
    complexity: 'high',
  },
  {
    id: 'sponsor-portal',
    title: 'Sponsor Management & Ad Platform',
    icon: <Megaphone className="w-5 h-5" />,
    summary: 'Manage league and team sponsors with rotating ad placements and analytics.',
    description: 'A sponsor management system allowing RMLL to showcase sponsor logos and advertisements across the site with rotation, placement zones, and click-through tracking. Includes a CMS module for managing sponsor tiers (Platinum, Gold, Silver), scheduling ad campaigns, and generating sponsor impact reports with impression and click data.',
    features: [
      'Sponsor tier management (Platinum, Gold, Silver, etc.) with CMS editor',
      'Rotating banner ad placements across configurable site zones',
      'Click-through tracking and impression counting',
      'Sponsor landing pages with custom content',
      'Automated sponsor impact reports (monthly/season summary)',
      'Division and team-level sponsorship support',
      'Sponsor logo integration in schedule, standings, and team pages',
    ],
    estimatedHours: { low: 30, high: 45 },
    rate: HOURLY_RATE,
    complexity: 'moderate',
  },
  {
    id: 'advanced-analytics',
    title: 'Advanced Analytics & Reporting Dashboard',
    icon: <BarChart3 className="w-5 h-5" />,
    summary: 'Deep-dive analytics for league administrators with trends and visual reports.',
    description: 'An advanced analytics dashboard for RMLL executives and division directors providing insights into league performance, team statistics trends, player development metrics, attendance patterns, and website engagement. Includes interactive charts, exportable reports, and season-over-season comparisons.',
    features: [
      'Interactive league-wide statistics dashboard with charts (Recharts)',
      'Season-over-season trend comparisons (goals, penalties, attendance)',
      'Team performance rankings and competitive balance analysis',
      'Exportable PDF/CSV reports for executive meetings',
      'Division director view with division-specific metrics',
      'Website traffic analytics integration (page views, popular content)',
      'Automated monthly executive summary email',
    ],
    estimatedHours: { low: 40, high: 60 },
    rate: HOURLY_RATE,
    complexity: 'high',
  },
  {
    id: 'fan-engagement',
    title: 'Fan Engagement Hub',
    icon: <Users className="w-5 h-5" />,
    summary: 'Fan accounts, game-day polls, predictions, and interactive features.',
    description: 'A fan engagement platform allowing lacrosse fans to create accounts, follow their favorite teams, participate in game-day polls and predictions, and receive personalized content. Includes fan profiles, team following system, game predictions with leaderboards, and push notification support for game alerts.',
    features: [
      'Fan account creation and profile management',
      'Follow teams for personalized schedule and news feeds',
      'Game-day polls and fan voting (MVP, prediction games)',
      'Season-long prediction leaderboard with prizes',
      'Push notification support for game starts, scores, and news',
      'Fan comment/reaction system on news articles',
      'Personalized homepage based on followed teams',
    ],
    estimatedHours: { low: 55, high: 80 },
    rate: HOURLY_RATE,
    complexity: 'very-high',
    dependencies: 'Requires push notification service (e.g., Firebase Cloud Messaging)',
  },
  {
    id: 'multilingual',
    title: 'Bilingual Support (English/French)',
    icon: <Globe className="w-5 h-5" />,
    summary: 'Full French/English bilingual site with language toggle and translated content.',
    description: 'Implementing full bilingual support for the RMLL website to serve Alberta\'s French-speaking community and meet potential ALA (Alberta Lacrosse Association) requirements. Includes a language toggle, translation management in the CMS, automatic interface translation, and French versions of all static content pages.',
    features: [
      'Language toggle (EN/FR) with persistent preference',
      'CMS translation management for all content pages',
      'Automatic UI string translation for interface elements',
      'French translations for all static content (25+ pages)',
      'Bilingual meta tags and SEO optimization',
      'French email templates for contact form and notifications',
    ],
    estimatedHours: { low: 35, high: 50 },
    rate: HOURLY_RATE,
    complexity: 'high',
    dependencies: 'French translations of all content must be provided or contracted',
  },
];

// Support plan monthly dev hours
const SUPPORT_PLAN_HOURS: Record<string, { label: string; monthlyHours: number; color: string }> = {
  basic: { label: 'Basic (2h/mo)', monthlyHours: 2, color: 'text-gray-700' },
  standard: { label: 'Standard (5h/mo)', monthlyHours: 5, color: 'text-blue-700' },
  premium: { label: 'Premium (10h/mo)', monthlyHours: 10, color: 'text-purple-700' },
};

function formatMonths(hours: number, monthlyDevHours: number): string {
  const months = Math.ceil(hours / monthlyDevHours);
  if (months <= 1) return '~1 month';
  if (months > 24) return `${Math.round(months / 12)}+ years`;
  return `~${months} months`;
}

// Group entries by phase
function groupByPhase(entries: TimeEntry[]): Record<string, TimeEntry[]> {
  const groups: Record<string, TimeEntry[]> = {};
  entries.forEach(e => {
    if (!groups[e.phase]) groups[e.phase] = [];
    groups[e.phase].push(e);
  });
  return groups;
}

/* ═══════════════════════════════════════════════════════════════
 *  COMPONENTS
 * ═══════════════════════════════════════════════════════════════ */

function ScopeComparisonTable() {
  const quotedTotal = QUOTED_LINE_ITEMS.reduce((s, i) => s + i.premiumPrice, 0);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="text-left p-3 border border-gray-200 font-semibold">Service</th>
            <th className="text-right p-3 border border-gray-200 font-semibold">Premium Quote</th>
            <th className="text-right p-3 border border-gray-200 font-semibold">Template Quote</th>
            <th className="text-left p-3 border border-gray-200 font-semibold">What Was Actually Delivered</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="p-3 border border-gray-200 font-medium">UI/UX Design</td>
            <td className="p-3 border border-gray-200 text-right">$3,500</td>
            <td className="p-3 border border-gray-200 text-right">$1,750</td>
            <td className="p-3 border border-gray-200 text-green-700">Fully custom mobile-first design. No template used. Custom component library with 50+ UI components. Custom designs for homepage, 10+ division page tabs, team detail pages, player profiles, and 25+ league info pages.</td>
          </tr>
          <tr className="bg-gray-50">
            <td className="p-3 border border-gray-200 font-medium">Development & CMS Setup</td>
            <td className="p-3 border border-gray-200 text-right">$6,000</td>
            <td className="p-3 border border-gray-200 text-right">$3,500</td>
            <td className="p-3 border border-gray-200 text-green-700">Custom React SPA (not WordPress). Full CMS with 20 admin modules. Supabase backend with 9 server route modules, storage buckets, auth system. Live SportzSoft API integration with proxy server. Significantly exceeds WordPress scope.</td>
          </tr>
          <tr>
            <td className="p-3 border border-gray-200 font-medium">Content Migration & Reorganization</td>
            <td className="p-3 border border-gray-200 text-right">$3,000</td>
            <td className="p-3 border border-gray-200 text-right">$3,000</td>
            <td className="p-3 border border-gray-200 text-green-700">25+ content pages migrated and reformatted. All bylaws, regulations, forms converted to web format. Hardcoded page defaults for all league info sections.</td>
          </tr>
          <tr className="bg-gray-50">
            <td className="p-3 border border-gray-200 font-medium">Historical Data Migration</td>
            <td className="p-3 border border-gray-200 text-right">$3,000</td>
            <td className="p-3 border border-gray-200 text-right">$3,000</td>
            <td className="p-3 border border-gray-200 text-green-700">Live API data replaces static tables entirely. 4+ years of suspension records (1,000+ entries). Awards & championships history. All data is searchable, sortable, and filterable — far exceeds static wpDataTables approach.</td>
          </tr>
          <tr>
            <td className="p-3 border border-gray-200 font-medium">News & Media Module</td>
            <td className="p-3 border border-gray-200 text-right">$1,000</td>
            <td className="p-3 border border-gray-200 text-right">$1,000</td>
            <td className="p-3 border border-gray-200 text-green-700">Full news CMS with rich text editor, image uploads, featured articles, homepage integration. Also includes announcement popup system.</td>
          </tr>
          <tr className="bg-gray-50">
            <td className="p-3 border border-gray-200 font-medium">Accessibility & SEO</td>
            <td className="p-3 border border-gray-200 text-right">$1,000</td>
            <td className="p-3 border border-gray-200 text-right">$1,000</td>
            <td className="p-3 border border-gray-200 text-green-700">Comprehensive SEO: dynamic meta tags, OG/Twitter Cards, JSON-LD structured data, canonical URLs, robots directives per page. Semantic HTML with ARIA labels. GA4 integration. Site-wide search. Broken link checker.</td>
          </tr>
          <tr>
            <td className="p-3 border border-gray-200 font-medium">QA, Training & Launch</td>
            <td className="p-3 border border-gray-200 text-right">$1,000</td>
            <td className="p-3 border border-gray-200 text-right">$1,000</td>
            <td className="p-3 border border-gray-200 text-green-700">Extensive QA including bug fixes (draft season filtering, inactive division data leaks, suspension calculation errors), security hardening, console log cleanup, production readiness audit.</td>
          </tr>
          <tr className="bg-gray-50">
            <td className="p-3 border border-gray-200 font-medium">Plugin Licensing</td>
            <td className="p-3 border border-gray-200 text-right">$120</td>
            <td className="p-3 border border-gray-200 text-right">$120</td>
            <td className="p-3 border border-gray-200 text-green-700">No plugin licenses required. All functionality is custom-built. No annual wpDataTables or Elementor Pro fees.</td>
          </tr>
          <tr className="bg-blue-50 font-semibold">
            <td className="p-3 border border-gray-200">QUOTED TOTAL</td>
            <td className="p-3 border border-gray-200 text-right">${quotedTotal.toLocaleString()}</td>
            <td className="p-3 border border-gray-200 text-right">$15,370</td>
            <td className="p-3 border border-gray-200 text-blue-800">See "Additional Deliverables" below for items delivered beyond scope</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function PhaseSection({ phase, entries, isOpen, onToggle }: { phase: string; entries: TimeEntry[]; isOpen: boolean; onToggle: () => void }) {
  const totalHours = entries.reduce((s, e) => s + e.hours, 0);
  const quotedHours = entries.filter(e => e.category === 'quoted').reduce((s, e) => s + e.hours, 0);
  const additionalHours = entries.filter(e => e.category === 'additional').reduce((s, e) => s + e.hours, 0);
  const productionHours = entries.filter(e => e.category === 'production').reduce((s, e) => s + e.hours, 0);
  const changeRequestHours = entries.filter(e => e.category === 'change-request').reduce((s, e) => s + e.hours, 0);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden mb-3">
      <button onClick={onToggle} className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left">
        <div className="flex items-center gap-3">
          {isOpen ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
          <span className="font-semibold text-gray-900">{phase}</span>
          <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">{entries.length} tasks</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          {quotedHours > 0 && <span className="text-blue-700">{quotedHours}h quoted</span>}
          {changeRequestHours > 0 && <span className="text-amber-700">{changeRequestHours}h CR</span>}
          {additionalHours > 0 && <span className="text-green-700">+{additionalHours}h additional</span>}
          {productionHours > 0 && <span className="text-orange-700">+{productionHours}h production</span>}
          <span className="font-bold text-gray-900">{totalHours}h total</span>
        </div>
      </button>
      {isOpen && (
        <div className="divide-y divide-gray-100">
          {entries.map((entry, i) => (
            <div key={i} className="p-4 flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-gray-900 text-sm">{entry.task}</span>
                  {entry.category === 'change-request' && (
                    <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded uppercase tracking-wide">Change Request</span>
                  )}
                  {entry.category === 'additional' && (
                    <span className="text-[10px] font-semibold bg-green-100 text-green-800 px-1.5 py-0.5 rounded uppercase tracking-wide">Beyond Scope</span>
                  )}
                  {entry.category === 'production' && (
                    <span className="text-[10px] font-semibold bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded uppercase tracking-wide">Production Hardening</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">{entry.description}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-sm font-mono font-semibold text-gray-700">{entry.hours}h</span>
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
 *  MAIN PAGE
 * ═══════════════════════════════════════════════════════════════ */

export function ProjectTimesheetPage() {
  const [openPhases, setOpenPhases] = useState<Set<string>>(new Set());
  const [selectedMaintenance, setSelectedMaintenance] = useState<string>('none');

  const togglePhase = (phase: string) => {
    setOpenPhases(prev => {
      const next = new Set(prev);
      if (next.has(phase)) next.delete(phase); else next.add(phase);
      return next;
    });
  };

  const expandAll = () => setOpenPhases(new Set(Object.keys(groupByPhase(TIME_ENTRIES))));
  const collapseAll = () => setOpenPhases(new Set());

  const grouped = groupByPhase(TIME_ENTRIES);

  const totalHours = TIME_ENTRIES.reduce((s, e) => s + e.hours, 0);
  const quotedHours = TIME_ENTRIES.filter(e => e.category === 'quoted').reduce((s, e) => s + e.hours, 0);
  const additionalHours = TIME_ENTRIES.filter(e => e.category === 'additional').reduce((s, e) => s + e.hours, 0);
  const productionHours = TIME_ENTRIES.filter(e => e.category === 'production').reduce((s, e) => s + e.hours, 0);
  const totalTasks = TIME_ENTRIES.length;
  const completedTasks = TIME_ENTRIES.filter(e => e.status === 'complete').length;

  // Invoice calculations
  const MAINTENANCE_PRICES: Record<string, number> = { none: 0, basic: 1800, standard: 4200, premium: 7800 };
  const maintenanceCost = MAINTENANCE_PRICES[selectedMaintenance] || 0;
  const invoiceSubtotal = 16970 + 2700 + 1150 + 700 + maintenanceCost;
  const invoiceGst = invoiceSubtotal * 0.05;
  const invoiceTotal = invoiceSubtotal + invoiceGst;
  const totalPayments = 19031.25; // Updated to remove CR-003 through CR-010 from project
  const balanceOwing = invoiceTotal - totalPayments;

  // Counts
  const totalComponents = 65; // approximate from file listing
  const totalPages = 40; // approximate total pages/views
  const totalHooks = 18;
  const totalServerRoutes = 9;
  const totalAdminModules = 20;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#001741] via-[#00234f] to-[#003060] text-white">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-8 h-8" />
            <h1 className="text-3xl font-bold">Project Deliverables & Timesheet</h1>
          </div>
          <p className="text-blue-200 text-lg">Rocky Mountain Lacrosse League — Website Redesign</p>
          <p className="text-blue-300 text-sm mt-1">Prepared by Altered Digital Inc. — March 10, 2026</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
            <Clock className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <div className="text-3xl font-bold text-gray-900">{totalHours}</div>
            <div className="text-sm text-gray-500">Total Hours</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
            <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <div className="text-3xl font-bold text-gray-900">{completedTasks}/{totalTasks}</div>
            <div className="text-sm text-gray-500">Tasks Complete</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
            <Plus className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
            <div className="text-3xl font-bold text-emerald-700">{additionalHours}h</div>
            <div className="text-sm text-gray-500">Beyond Original Scope</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
            <Wrench className="w-6 h-6 text-orange-600 mx-auto mb-2" />
            <div className="text-3xl font-bold text-orange-700">{productionHours}h</div>
            <div className="text-sm text-gray-500">Production Hardening</div>
          </div>
        </div>

        {/* Project Stats */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Project at a Glance</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 text-center">
            <div><div className="text-2xl font-bold text-blue-700">{totalComponents}</div><div className="text-xs text-gray-500">React Components</div></div>
            <div><div className="text-2xl font-bold text-blue-700">{totalPages}</div><div className="text-xs text-gray-500">Pages / Views</div></div>
            <div><div className="text-2xl font-bold text-blue-700">{totalHooks}</div><div className="text-xs text-gray-500">Custom Hooks</div></div>
            <div><div className="text-2xl font-bold text-blue-700">{totalServerRoutes}</div><div className="text-xs text-gray-500">Server Route Modules</div></div>
            <div><div className="text-2xl font-bold text-blue-700">{totalAdminModules}</div><div className="text-xs text-gray-500">CMS Admin Modules</div></div>
            <div><div className="text-2xl font-bold text-blue-700">20+</div><div className="text-xs text-gray-500">API Integrations</div></div>
          </div>
        </div>

        {/* ── SECTION 1: Original Scope vs Delivered ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <ArrowRight className="w-5 h-5 text-blue-600" />
            Original Quoted Scope vs. What Was Delivered
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            The original proposal quoted a WordPress + Elementor site with wpDataTables. What was delivered is a fully custom React application with a live SportzSoft API integration, custom CMS, and significantly more features than originally scoped.
          </p>
          <ScopeComparisonTable />
        </div>

        {/* ── SECTION 2: Additional Deliverables ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Plus className="w-5 h-5 text-green-600" />
            Major Additional Deliverables (Beyond Original Scope)
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            The following features and systems were delivered at no additional charge beyond the original quote. Team Detail Pages and Player Profile Pages were approved change requests and are billed separately (see Final Invoice). The remaining items below represent significant goodwill value provided at no extra cost.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { title: 'Live SportzSoft API Integration', desc: 'Full reverse-engineering and integration of the undocumented SportzSoft REST API with server-side proxy, providing real-time schedules, standings, stats, rosters, drafts, protected lists, and transactions across 20+ divisions.' },
              { title: 'Draft, Protected List & Transaction Systems', desc: 'Three entirely new data systems providing division-level draft picks, team protected player lists, and player transaction history with filtering.' },
              { title: 'Live Score Ticker', desc: 'Auto-scrolling real-time score ticker on the homepage showing recent results and upcoming games.' },
              { title: 'Suspensions & Discipline System', desc: 'Complete suspension management with CMS editor, multi-season browsing, card/table views, filtering, search, and statistical dashboard.' },
              { title: 'Site-Wide Search (Command Palette)', desc: 'Ctrl/Cmd+K search modal searching across news, pages, divisions, documents, and quick-nav with relevance scoring and keyboard navigation.' },
              { title: 'Advanced CMS Modules', desc: 'Navigation editor, image manager, division manager, awards/championships editors, season info editor, announcement system, settings manager, user manager, broken link checker.' },
              { title: 'Google Analytics 4 Integration', desc: 'CMS-configurable GA4 with SPA page view tracking.' },
              { title: 'Email System', desc: 'Contact form with server-side Resend email delivery and HTML email templates.' },
              { title: 'Game Sheet PDF Generation', desc: 'In-browser PDF generation of game details and box scores.' },
              { title: 'Officiating Section', desc: 'Four dedicated pages for officiating resources: application forms, equipment requirements, off-floor officials guide, and rule interpretations.' },
            ].map((item, i) => (
              <div key={i} className="border border-green-200 bg-green-50 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 text-sm">{item.title}</h3>
                <p className="text-xs text-green-700 mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── SECTION 3: Detailed Timesheet ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Detailed Timesheet
            </h2>
            <div className="flex gap-2">
              <button onClick={expandAll} className="text-xs text-blue-600 hover:text-blue-800 underline">Expand All</button>
              <button onClick={collapseAll} className="text-xs text-blue-600 hover:text-blue-800 underline">Collapse All</button>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mb-4 text-xs">
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-100 border border-blue-300" /> Within quoted scope</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-100 border border-amber-300" /> Change request (billable)</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-100 border border-green-300" /> Beyond scope (no charge)</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-orange-100 border border-orange-300" /> Production hardening</div>
          </div>

          {Object.entries(grouped).map(([phase, entries]) => (
            <PhaseSection key={phase} phase={phase} entries={entries} isOpen={openPhases.has(phase)} onToggle={() => togglePhase(phase)} />
          ))}

          {/* Totals */}
          <div className="mt-6 border-t border-gray-200 pt-6">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-800">{quotedHours}h</div>
                <div className="text-xs text-blue-600">Hours on Quoted Scope</div>
              </div>
              <div className="bg-amber-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-amber-800">{TIME_ENTRIES.filter(e => e.category === 'change-request').reduce((s, e) => s + e.hours, 0)}h</div>
                <div className="text-xs text-amber-600">Change Requests (Billable)</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-800">{additionalHours}h</div>
                <div className="text-xs text-green-600">Additional Hours (No Charge)</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-800">{productionHours}h</div>
                <div className="text-xs text-orange-600">Production Hardening</div>
              </div>
              <div className="bg-gray-100 rounded-lg p-4 text-center col-span-2 sm:col-span-1">
                <div className="text-2xl font-bold text-gray-900">{totalHours}h</div>
                <div className="text-xs text-gray-600">Grand Total</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── SECTION 4: Technology Upgrade ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Technology Upgrade: What Was Quoted vs. What Was Built
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-3 border border-gray-200">Category</th>
                  <th className="text-left p-3 border border-gray-200">Originally Quoted</th>
                  <th className="text-left p-3 border border-gray-200">What Was Delivered</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Platform', 'WordPress + Elementor Pro', 'Custom React SPA with Supabase backend'],
                  ['Data Tables', 'wpDataTables (static, $120/yr license)', 'Live API data — no license fees, real-time updates'],
                  ['Data Source', 'Manually imported PDFs/Excel', 'Live SportzSoft API with server-side proxy'],
                  ['CMS', 'WordPress admin', 'Custom-built CMS with 20 admin modules'],
                  ['Hosting', 'Traditional WordPress hosting', 'Managed cloud hosting (serverless edge functions)'],
                  ['Performance', 'Standard WordPress page loads', 'SPA with lazy loading, instant navigation'],
                  ['Search', 'WordPress default search', 'Custom command palette with relevance scoring'],
                  ['SEO', 'Yoast SEO plugin', 'Custom per-page meta tags, JSON-LD, OG tags'],
                  ['Email', 'Contact Form 7 or similar', 'Server-side Resend integration with HTML templates'],
                  ['Analytics', 'Not included', 'CMS-configurable GA4 with SPA tracking'],
                  ['Annual Plugin Costs', '$120+ (wpDataTables, Elementor Pro)', '$0 — all functionality is custom-built'],
                ].map(([cat, quoted, delivered], i) => (
                  <tr key={i} className={i % 2 === 0 ? '' : 'bg-gray-50'}>
                    <td className="p-3 border border-gray-200 font-medium">{cat}</td>
                    <td className="p-3 border border-gray-200 text-gray-600">{quoted}</td>
                    <td className="p-3 border border-gray-200 text-green-700 font-medium">{delivered}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── SECTION 5: Hosting & Maintenance Estimate ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-600" />
            Estimated Annual Hosting & Maintenance Costs
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            The following estimates are for ongoing hosting, maintenance, and support after the site is launched.
          </p>

          <div className="space-y-6">
            {/* Hosting */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Server className="w-4 h-4 text-gray-500" />
                Hosting & Infrastructure
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="text-left p-3 border border-gray-200">Service</th>
                      <th className="text-left p-3 border border-gray-200">Provider</th>
                      <th className="text-right p-3 border border-gray-200">Monthly</th>
                      <th className="text-right p-3 border border-gray-200">Annual</th>
                      <th className="text-left p-3 border border-gray-200">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { service: 'Managed Cloud Backend (Database, Auth, Storage, Edge Functions)', provider: 'Altered Digital', monthly: 45, annual: 540, notes: 'Managed Supabase Pro plan. Includes database, authentication, file storage, serverless edge functions, real-time capabilities, and ongoing infrastructure management.' },
                      { service: 'Managed Frontend Hosting & CDN', provider: 'Altered Digital', monthly: 10, annual: 120, notes: 'Global CDN distribution, SSL certificate, continuous deployment pipeline, and performance optimization.' },
                      { service: 'Domain Name (rockymountainlax.com)', provider: 'Altered Digital', monthly: 0, annual: 40, notes: 'Annual domain registration and DNS management for rockymountainlax.com.' },
                      { service: 'Transactional Email Service', provider: 'Included', monthly: 0, annual: 0, notes: 'Free tier: 3,000 emails/month. More than sufficient for contact form volume. Included with managed hosting.' },
                      { service: 'SSL Certificate & Security', provider: 'Included', monthly: 0, annual: 0, notes: 'Included with managed hosting. Auto-renewing SSL with HTTPS enforcement.' },
                    ].map((row, i) => (
                      <tr key={i} className={i % 2 === 0 ? '' : 'bg-gray-50'}>
                        <td className="p-3 border border-gray-200 font-medium">{row.service}</td>
                        <td className="p-3 border border-gray-200">{row.provider}</td>
                        <td className="p-3 border border-gray-200 text-right">${row.monthly}</td>
                        <td className="p-3 border border-gray-200 text-right font-semibold">${row.annual}</td>
                        <td className="p-3 border border-gray-200 text-xs text-gray-500">{row.notes}</td>
                      </tr>
                    ))}
                    <tr className="bg-blue-50 font-semibold">
                      <td className="p-3 border border-gray-200" colSpan={3}>Hosting Subtotal</td>
                      <td className="p-3 border border-gray-200 text-right text-blue-800">$700/yr</td>
                      <td className="p-3 border border-gray-200 text-xs text-blue-600">Approx. $58/month</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Maintenance */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-gray-500" />
                Maintenance & Support Options
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="text-left p-3 border border-gray-200">Plan</th>
                      <th className="text-left p-3 border border-gray-200">Includes</th>
                      <th className="text-right p-3 border border-gray-200">Monthly</th>
                      <th className="text-right p-3 border border-gray-200">Annual</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-3 border border-gray-200 font-medium">Basic Maintenance</td>
                      <td className="p-3 border border-gray-200 text-xs text-gray-600">
                        <ul className="list-disc pl-4 space-y-0.5">
                          <li>Security patches & dependency updates</li>
                          <li>Uptime monitoring & alerting</li>
                          <li>Monthly backups verification</li>
                          <li>Up to 2 hours of minor content/bug fixes per month</li>
                        </ul>
                      </td>
                      <td className="p-3 border border-gray-200 text-right font-semibold">$150</td>
                      <td className="p-3 border border-gray-200 text-right font-semibold">$1,800</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="p-3 border border-gray-200 font-medium">Standard Maintenance</td>
                      <td className="p-3 border border-gray-200 text-xs text-gray-600">
                        <ul className="list-disc pl-4 space-y-0.5">
                          <li>Everything in Basic</li>
                          <li>Up to 5 hours of development/changes per month</li>
                          <li>SportzSoft API monitoring (new season setup, division changes)</li>
                          <li>Priority email support (24h response)</li>
                          <li>Quarterly performance review</li>
                        </ul>
                      </td>
                      <td className="p-3 border border-gray-200 text-right font-semibold">$350</td>
                      <td className="p-3 border border-gray-200 text-right font-semibold">$4,200</td>
                    </tr>
                    <tr>
                      <td className="p-3 border border-gray-200 font-medium">Premium Support</td>
                      <td className="p-3 border border-gray-200 text-xs text-gray-600">
                        <ul className="list-disc pl-4 space-y-0.5">
                          <li>Everything in Standard</li>
                          <li>Up to 10 hours of development per month</li>
                          <li>New feature development</li>
                          <li>Season-start configuration & testing</li>
                          <li>Same-day priority support</li>
                          <li>Analytics reporting & recommendations</li>
                        </ul>
                      </td>
                      <td className="p-3 border border-gray-200 text-right font-semibold">$650</td>
                      <td className="p-3 border border-gray-200 text-right font-semibold">$7,800</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Ad-hoc */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-gray-500" />
                Ad-Hoc Development (No Maintenance Plan)
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-2">
                <p><span className="font-semibold">Hourly Rate:</span> $125/hr CAD</p>
                <p><span className="font-semibold">Minimum Billable:</span> 1 hour</p>
                <p className="text-gray-500">For clients who prefer to pay as needed rather than a monthly plan. Note: response times are not guaranteed and depend on availability.</p>
              </div>
            </div>

            {/* Total Annual Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
              <h3 className="font-bold text-gray-900 mb-4">Estimated Annual Cost Summary</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-white/60">
                      <th className="text-left p-3 border border-blue-200" />
                      <th className="text-right p-3 border border-blue-200 font-semibold">Hosting Only</th>
                      <th className="text-right p-3 border border-blue-200 font-semibold">+ Basic Maint.</th>
                      <th className="text-right p-3 border border-blue-200 font-semibold">+ Standard Maint.</th>
                      <th className="text-right p-3 border border-blue-200 font-semibold">+ Premium Support</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-3 border border-blue-200 font-medium">Hosting & Infrastructure</td>
                      <td className="p-3 border border-blue-200 text-right">$700</td>
                      <td className="p-3 border border-blue-200 text-right">$700</td>
                      <td className="p-3 border border-blue-200 text-right">$700</td>
                      <td className="p-3 border border-blue-200 text-right">$700</td>
                    </tr>
                    <tr className="bg-white/40">
                      <td className="p-3 border border-blue-200 font-medium">Maintenance & Support</td>
                      <td className="p-3 border border-blue-200 text-right">$0</td>
                      <td className="p-3 border border-blue-200 text-right">$1,800</td>
                      <td className="p-3 border border-blue-200 text-right">$4,200</td>
                      <td className="p-3 border border-blue-200 text-right">$7,800</td>
                    </tr>
                    <tr className="bg-white/40">
                      <td className="p-3 border border-blue-200 font-medium">Plugin Licenses</td>
                      <td className="p-3 border border-blue-200 text-right">$0</td>
                      <td className="p-3 border border-blue-200 text-right">$0</td>
                      <td className="p-3 border border-blue-200 text-right">$0</td>
                      <td className="p-3 border border-blue-200 text-right">$0</td>
                    </tr>
                    <tr className="font-bold bg-white/70">
                      <td className="p-3 border border-blue-200">Annual Total</td>
                      <td className="p-3 border border-blue-200 text-right text-blue-800">$700/yr</td>
                      <td className="p-3 border border-blue-200 text-right text-blue-800">$2,500/yr</td>
                      <td className="p-3 border border-blue-200 text-right text-blue-800">$4,900/yr</td>
                      <td className="p-3 border border-blue-200 text-right text-blue-800">$8,500/yr</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-blue-700 mt-3">
                * For comparison: the original WordPress setup would have required ~$300-600/yr for hosting + $120/yr for wpDataTables + ~$60/yr for Elementor Pro licensing, with no live data capabilities.
                The current setup eliminates all third-party plugin licensing costs. All prices in CAD.
              </p>
            </div>
          </div>
        </div>

        {/* ── SECTION 6: Final Invoice ── */}
        <div className="bg-white rounded-xl border-2 border-blue-300 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
            Final Project Invoice
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Summary of all billable work including original quoted scope and approved change requests.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-3 border border-gray-200">Item</th>
                  <th className="text-left p-3 border border-gray-200">Description</th>
                  <th className="text-right p-3 border border-gray-200">Hours</th>
                  <th className="text-right p-3 border border-gray-200">Rate</th>
                  <th className="text-right p-3 border border-gray-200">Amount</th>
                </tr>
              </thead>
              <tbody>
                {/* Original Scope */}
                <tr className="bg-blue-50">
                  <td className="p-3 border border-gray-200 font-semibold" colSpan={5}>Original Project Scope (Premium Quote)</td>
                </tr>
                {QUOTED_LINE_ITEMS.map((item, i) => (
                  <tr key={`q-${i}`} className={i % 2 === 0 ? '' : 'bg-gray-50'}>
                    <td className="p-3 border border-gray-200 font-medium">{item.service}</td>
                    <td className="p-3 border border-gray-200 text-xs text-gray-600">{item.description}</td>
                    <td className="p-3 border border-gray-200 text-right text-gray-400">—</td>
                    <td className="p-3 border border-gray-200 text-right text-gray-400">—</td>
                    <td className="p-3 border border-gray-200 text-right font-medium">${item.premiumPrice.toLocaleString()}</td>
                  </tr>
                ))}
                <tr className="bg-blue-50 font-semibold">
                  <td className="p-3 border border-gray-200" colSpan={4}>Original Scope Subtotal</td>
                  <td className="p-3 border border-gray-200 text-right text-blue-800">${QUOTED_LINE_ITEMS.reduce((s, i) => s + i.premiumPrice, 0).toLocaleString()}</td>
                </tr>

                {/* Change Requests */}
                <tr className="bg-amber-50">
                  <td className="p-3 border border-gray-200 font-semibold" colSpan={5}>Approved Change Requests</td>
                </tr>
                <tr>
                  <td className="p-3 border border-gray-200 font-medium">CR-001: Team Detail Pages</td>
                  <td className="p-3 border border-gray-200 text-xs text-gray-600">Individual team profile pages with dynamic team colors, logos, full roster, team-specific schedule, stats, and transaction history. Includes design (5h) and development (10h).</td>
                  <td className="p-3 border border-gray-200 text-right">15</td>
                  <td className="p-3 border border-gray-200 text-right">$100/hr</td>
                  <td className="p-3 border border-gray-200 text-right font-medium">$1,500</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="p-3 border border-gray-200 font-medium">CR-002: Player Profile Pages</td>
                  <td className="p-3 border border-gray-200 text-xs text-gray-600">Individual player stat pages with career data, game logs, and cross-linked navigation from roster and stats views. Includes design (4h) and development (8h).</td>
                  <td className="p-3 border border-gray-200 text-right">12</td>
                  <td className="p-3 border border-gray-200 text-right">$100/hr</td>
                  <td className="p-3 border border-gray-200 text-right font-medium">$1,200</td>
                </tr>
                <tr className="bg-amber-50 font-semibold">
                  <td className="p-3 border border-gray-200" colSpan={4}>Change Requests Subtotal</td>
                  <td className="p-3 border border-gray-200 text-right text-amber-800">$2,200</td>
                </tr>

                {/* Beyond Scope — No Charge */}
                <tr className="bg-green-50">
                  <td className="p-3 border border-gray-200 font-semibold" colSpan={5}>Additional Deliverables — No Charge</td>
                </tr>
                <tr>
                  <td className="p-3 border border-gray-200 text-gray-600" colSpan={2}>
                    <span className="font-medium text-green-800">10 major features & systems</span>
                    <span className="text-xs text-gray-500 ml-2">(SportzSoft API, Draft/Protected List/Transaction systems, Live Score Ticker, Suspensions System, Site Search, Advanced CMS Modules, GA4, Email System, Game Sheet PDFs, Officiating Section)</span>
                  </td>
                  <td className="p-3 border border-gray-200 text-right">{TIME_ENTRIES.filter(e => e.category === 'additional').reduce((s, e) => s + e.hours, 0)}h</td>
                  <td className="p-3 border border-gray-200 text-right text-gray-400">$100/hr</td>
                  <td className="p-3 border border-gray-200 text-right text-green-700 font-medium line-through">${(TIME_ENTRIES.filter(e => e.category === 'additional').reduce((s, e) => s + e.hours, 0) * 100).toLocaleString()}</td>
                </tr>
                <tr className="bg-green-50 font-semibold">
                  <td className="p-3 border border-gray-200" colSpan={4}>Goodwill Value (Waived)</td>
                  <td className="p-3 border border-gray-200 text-right text-green-700">$0</td>
                </tr>

                {/* Production Hardening — No Charge */}
                <tr className="bg-orange-50">
                  <td className="p-3 border border-gray-200 font-semibold" colSpan={5}>Production Hardening — No Charge</td>
                </tr>
                <tr>
                  <td className="p-3 border border-gray-200 text-gray-600" colSpan={2}>
                    <span className="font-medium text-orange-800">Bug fixes, security hardening, console cleanup</span>
                  </td>
                  <td className="p-3 border border-gray-200 text-right">{TIME_ENTRIES.filter(e => e.category === 'production').reduce((s, e) => s + e.hours, 0)}h</td>
                  <td className="p-3 border border-gray-200 text-right text-gray-400">$100/hr</td>
                  <td className="p-3 border border-gray-200 text-right text-orange-700 font-medium line-through">${(TIME_ENTRIES.filter(e => e.category === 'production').reduce((s, e) => s + e.hours, 0) * 100).toLocaleString()}</td>
                </tr>
                <tr className="bg-orange-50 font-semibold">
                  <td className="p-3 border border-gray-200" colSpan={4}>Production Hardening (Waived)</td>
                  <td className="p-3 border border-gray-200 text-right text-orange-700">$0</td>
                </tr>

                {/* Year 1 Hosting */}
                <tr className="bg-sky-50">
                  <td className="p-3 border border-gray-200 font-semibold" colSpan={5}>Year 1 Hosting & Infrastructure (Prepaid Annual)</td>
                </tr>
                <tr>
                  <td className="p-3 border border-gray-200 font-medium">Managed Cloud Backend</td>
                  <td className="p-3 border border-gray-200 text-xs text-gray-600">Database, Auth, Storage, Edge Functions — 12 months @ $45/mo</td>
                  <td className="p-3 border border-gray-200 text-right text-gray-400">—</td>
                  <td className="p-3 border border-gray-200 text-right text-gray-400">—</td>
                  <td className="p-3 border border-gray-200 text-right font-medium">$540.00</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="p-3 border border-gray-200 font-medium">Managed Frontend Hosting & CDN</td>
                  <td className="p-3 border border-gray-200 text-xs text-gray-600">Global CDN, SSL, continuous deployment — 12 months @ $10/mo</td>
                  <td className="p-3 border border-gray-200 text-right text-gray-400">—</td>
                  <td className="p-3 border border-gray-200 text-right text-gray-400">—</td>
                  <td className="p-3 border border-gray-200 text-right font-medium">$120.00</td>
                </tr>
                <tr>
                  <td className="p-3 border border-gray-200 font-medium">Domain (rockymountainlax.com)</td>
                  <td className="p-3 border border-gray-200 text-xs text-gray-600">Annual registration and DNS management</td>
                  <td className="p-3 border border-gray-200 text-right text-gray-400">—</td>
                  <td className="p-3 border border-gray-200 text-right text-gray-400">—</td>
                  <td className="p-3 border border-gray-200 text-right font-medium">$40.00</td>
                </tr>
                <tr className="bg-sky-50 font-semibold">
                  <td className="p-3 border border-gray-200" colSpan={4}>Year 1 Hosting Subtotal</td>
                  <td className="p-3 border border-gray-200 text-right text-sky-800">$700.00</td>
                </tr>

                {/* Optional Maintenance Add-On */}
                <tr className="bg-purple-50">
                  <td className="p-3 border border-gray-200 font-semibold" colSpan={5}>
                    <span>Optional: Year 1 Maintenance & Support Plan</span>
                    <span className="text-xs font-normal text-purple-600 ml-2">(select a tier to see adjusted total)</span>
                  </td>
                </tr>
                {[
                  { key: 'none', label: 'No Maintenance Plan', desc: 'Hosting only. Ad-hoc support available at $125/hr CAD as needed.', annual: 0 },
                  { key: 'basic', label: 'Basic Maintenance', desc: 'Dependency updates, security patches, daily backups, uptime monitoring, monthly reporting. 2h/mo included.', annual: 1800 },
                  { key: 'standard', label: 'Standard Maintenance', desc: 'Everything in Basic + up to 5h dev/month, SportzSoft API monitoring, priority 24h response, quarterly reviews.', annual: 4200 },
                  { key: 'premium', label: 'Premium Support', desc: 'Everything in Standard + up to 10h dev/month, new features, season-start config, same-day support, analytics.', annual: 7800 },
                ].map((tier, i) => {
                  const isSelected = selectedMaintenance === tier.key;
                  return (
                    <tr key={tier.key} className={`cursor-pointer transition-colors ${isSelected ? 'bg-purple-100 ring-1 ring-inset ring-purple-400' : i % 2 === 0 ? 'hover:bg-purple-50/50' : 'bg-gray-50 hover:bg-purple-50/50'}`} onClick={() => setSelectedMaintenance(tier.key)}>
                      <td className="p-3 border border-gray-200">
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-purple-600 bg-purple-600' : 'border-gray-300'}`}>
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <span className="font-medium">{tier.label}</span>
                        </div>
                      </td>
                      <td className="p-3 border border-gray-200 text-xs text-gray-600">{tier.desc}</td>
                      <td className="p-3 border border-gray-200 text-right text-gray-400">—</td>
                      <td className="p-3 border border-gray-200 text-right text-gray-400">{tier.annual > 0 ? `$${(tier.annual / 12).toFixed(0)}/mo` : '—'}</td>
                      <td className="p-3 border border-gray-200 text-right font-medium">{tier.annual > 0 ? `$${tier.annual.toLocaleString()}.00` : '$0.00'}</td>
                    </tr>
                  );
                })}
                <tr className="bg-purple-50 font-semibold">
                  <td className="p-3 border border-gray-200" colSpan={4}>Maintenance Plan Subtotal</td>
                  <td className="p-3 border border-gray-200 text-right text-purple-800">${maintenanceCost.toLocaleString()}.00</td>
                </tr>

                {/* Subtotal & Tax */}
                <tr className="font-semibold bg-gray-100">
                  <td className="p-3 border border-gray-200" colSpan={4}>Subtotal</td>
                  <td className="p-3 border border-gray-200 text-right">${invoiceSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                  <td className="p-3 border border-gray-200" colSpan={4}>GST (5%)</td>
                  <td className="p-3 border border-gray-200 text-right">${invoiceGst.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr className="font-semibold bg-gray-100">
                  <td className="p-3 border border-gray-200" colSpan={4}>Total (incl. GST)</td>
                  <td className="p-3 border border-gray-200 text-right">${invoiceTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                </tr>

                {/* Payments Received */}
                <tr className="bg-emerald-50">
                  <td className="p-3 border border-gray-200 font-semibold" colSpan={5}>Payments Received</td>
                </tr>
                <tr>
                  <td className="p-3 border border-gray-200 font-medium">INV-005 — Project Kick-Off</td>
                  <td className="p-3 border border-gray-200 text-xs text-gray-600">October 22, 2025</td>
                  <td className="p-3 border border-gray-200 text-right text-gray-500">$9,500.00</td>
                  <td className="p-3 border border-gray-200 text-right text-gray-500">+ $475.00 GST</td>
                  <td className="p-3 border border-gray-200 text-right text-emerald-700 font-medium">($9,975.00)</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="p-3 border border-gray-200 font-medium">INV-006 — Progress Milestone (25%)</td>
                  <td className="p-3 border border-gray-200 text-xs text-gray-600">December 17, 2025</td>
                  <td className="p-3 border border-gray-200 text-right text-gray-500">$4,750.00</td>
                  <td className="p-3 border border-gray-200 text-right text-gray-500">+ $237.50 GST</td>
                  <td className="p-3 border border-gray-200 text-right text-emerald-700 font-medium">($4,987.50)</td>
                </tr>
                <tr>
                  <td className="p-3 border border-gray-200 font-medium">INV-007 — Website Build Progress Milestone (Pre-Launch)</td>
                  <td className="p-3 border border-gray-200 text-xs text-gray-600">March 13, 2026</td>
                  <td className="p-3 border border-gray-200 text-right text-gray-500">$3,875.00</td>
                  <td className="p-3 border border-gray-200 text-right text-gray-500">+ $193.75 GST</td>
                  <td className="p-3 border border border-gray-200 text-right text-emerald-700 font-medium">($4,068.75)</td>
                </tr>
                <tr className="bg-emerald-50 font-semibold">
                  <td className="p-3 border border-gray-200" colSpan={4}>Total Payments Received</td>
                  <td className="p-3 border border-gray-200 text-right text-emerald-800">($19,031.25)</td>
                </tr>

                {/* Balance Owing */}
                <tr className="bg-gradient-to-r from-blue-100 to-indigo-100 font-bold text-lg">
                  <td className="p-4 border border-blue-300" colSpan={4}>Balance Owing</td>
                  <td className="p-4 border border-blue-300 text-right text-blue-900">${balanceOwing.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-6 grid sm:grid-cols-3 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 text-sm mb-1">Value Delivered at No Extra Charge</h3>
              <p className="text-xs text-green-700">
                {TIME_ENTRIES.filter(e => e.category === 'additional').reduce((s, e) => s + e.hours, 0) + TIME_ENTRIES.filter(e => e.category === 'production').reduce((s, e) => s + e.hours, 0)} hours of additional development and production hardening
                (valued at ${((TIME_ENTRIES.filter(e => e.category === 'additional').reduce((s, e) => s + e.hours, 0) + TIME_ENTRIES.filter(e => e.category === 'production').reduce((s, e) => s + e.hours, 0)) * 100).toLocaleString()})
                were provided at no charge as a goodwill investment in the RMLL partnership.
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 text-sm mb-1">Payment Terms</h3>
              <p className="text-xs text-blue-700">
                All amounts in CAD. Due upon receipt. Year 1 hosting is included in this invoice. Subsequent annual hosting renewals billed separately.
              </p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 text-sm mb-1">Tax Information</h3>
              <p className="text-xs text-gray-600">
                Altered Digital Inc. — GST registered. All amounts include applicable 5% GST where indicated.
              </p>
            </div>
          </div>
        </div>

        {/* ── SECTION 7: Potential Future Enhancements ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Potential Future Enhancements
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            The following enhancements represent high-value additions that could be developed for the RMLL website. Each includes estimated development hours, cost at the standard ad-hoc rate of ${HOURLY_RATE}/hr CAD, and projected timelines if delivered exclusively through a support package.
          </p>

          {/* Summary Table */}
          <div className="overflow-x-auto mb-8">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-3 border border-gray-200 font-semibold">Enhancement</th>
                  <th className="text-center p-3 border border-gray-200 font-semibold">Complexity</th>
                  <th className="text-right p-3 border border-gray-200 font-semibold">Est. Hours</th>
                  <th className="text-right p-3 border border-gray-200 font-semibold">Est. Cost (CAD)</th>
                  <th className="text-center p-3 border border-gray-200 font-semibold">
                    <span className="hidden sm:inline">Timeline via </span>Basic
                    <span className="block text-[10px] font-normal text-gray-400">2h/mo</span>
                  </th>
                  <th className="text-center p-3 border border-gray-200 font-semibold">
                    <span className="hidden sm:inline">Timeline via </span>Standard
                    <span className="block text-[10px] font-normal text-gray-400">5h/mo</span>
                  </th>
                  <th className="text-center p-3 border border-gray-200 font-semibold">
                    <span className="hidden sm:inline">Timeline via </span>Premium
                    <span className="block text-[10px] font-normal text-gray-400">10h/mo</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {FUTURE_ENHANCEMENTS.map((enh, i) => {
                  const avgHours = Math.round((enh.estimatedHours.low + enh.estimatedHours.high) / 2);
                  const lowCost = enh.estimatedHours.low * enh.rate;
                  const highCost = enh.estimatedHours.high * enh.rate;
                  return (
                    <tr key={enh.id} className={i % 2 === 0 ? '' : 'bg-gray-50'}>
                      <td className="p-3 border border-gray-200">
                        <div className="flex items-center gap-2">
                          <span className="text-amber-500 shrink-0">{enh.icon}</span>
                          <span className="font-medium text-gray-900">{enh.title}</span>
                        </div>
                      </td>
                      <td className="p-3 border border-gray-200 text-center">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                          enh.complexity === 'very-high' ? 'bg-red-100 text-red-800' :
                          enh.complexity === 'high' ? 'bg-amber-100 text-amber-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {enh.complexity === 'very-high' ? 'Very High' : enh.complexity === 'high' ? 'High' : 'Moderate'}
                        </span>
                      </td>
                      <td className="p-3 border border-gray-200 text-right font-mono text-sm">
                        {enh.estimatedHours.low}–{enh.estimatedHours.high}h
                      </td>
                      <td className="p-3 border border-gray-200 text-right font-semibold">
                        <span className="text-gray-900">${lowCost.toLocaleString()}</span>
                        <span className="text-gray-400"> – </span>
                        <span className="text-gray-900">${highCost.toLocaleString()}</span>
                      </td>
                      <td className="p-3 border border-gray-200 text-center text-xs text-gray-600">
                        {formatMonths(avgHours, 2)}
                      </td>
                      <td className="p-3 border border-gray-200 text-center text-xs text-blue-700">
                        {formatMonths(avgHours, 5)}
                      </td>
                      <td className="p-3 border border-gray-200 text-center text-xs text-purple-700 font-medium">
                        {formatMonths(avgHours, 10)}
                      </td>
                    </tr>
                  );
                })}
                {/* Totals Row */}
                {(() => {
                  const totalLow = FUTURE_ENHANCEMENTS.reduce((s, e) => s + e.estimatedHours.low, 0);
                  const totalHigh = FUTURE_ENHANCEMENTS.reduce((s, e) => s + e.estimatedHours.high, 0);
                  const totalAvg = Math.round((totalLow + totalHigh) / 2);
                  return (
                    <tr className="bg-amber-50 font-semibold">
                      <td className="p-3 border border-gray-200" colSpan={2}>Total (All Enhancements)</td>
                      <td className="p-3 border border-gray-200 text-right font-mono">{totalLow}–{totalHigh}h</td>
                      <td className="p-3 border border-gray-200 text-right text-amber-900">
                        ${(totalLow * HOURLY_RATE).toLocaleString()} – ${(totalHigh * HOURLY_RATE).toLocaleString()}
                      </td>
                      <td className="p-3 border border-gray-200 text-center text-xs">{formatMonths(totalAvg, 2)}</td>
                      <td className="p-3 border border-gray-200 text-center text-xs text-blue-700">{formatMonths(totalAvg, 5)}</td>
                      <td className="p-3 border border-gray-200 text-center text-xs text-purple-700">{formatMonths(totalAvg, 10)}</td>
                    </tr>
                  );
                })()}
              </tbody>
            </table>
          </div>

          {/* Detailed Enhancement Cards */}
          <h3 className="font-bold text-gray-900 mb-4 text-base">Detailed Breakdown</h3>
          <div className="space-y-4">
            {FUTURE_ENHANCEMENTS.map((enh) => {
              const avgHours = Math.round((enh.estimatedHours.low + enh.estimatedHours.high) / 2);
              const lowCost = enh.estimatedHours.low * enh.rate;
              const highCost = enh.estimatedHours.high * enh.rate;
              return (
                <div key={enh.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className={`px-5 py-4 flex items-start gap-3 ${
                    enh.id === 'ecommerce' ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200' : 'bg-gray-50 border-b border-gray-200'
                  }`}>
                    <span className={enh.id === 'ecommerce' ? 'text-amber-600 mt-0.5' : 'text-gray-500 mt-0.5'}>{enh.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-gray-900">{enh.title}</h4>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                          enh.complexity === 'very-high' ? 'bg-red-100 text-red-800' :
                          enh.complexity === 'high' ? 'bg-amber-100 text-amber-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {enh.complexity === 'very-high' ? 'Very High' : enh.complexity === 'high' ? 'High' : 'Moderate'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{enh.summary}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-gray-900 text-lg">${lowCost.toLocaleString()} – ${highCost.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">{enh.estimatedHours.low}–{enh.estimatedHours.high} hours @ ${enh.rate}/hr</div>
                    </div>
                  </div>
                  <div className="p-5 space-y-4">
                    <p className="text-sm text-gray-600">{enh.description}</p>
                    <div>
                      <h5 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2">Key Features</h5>
                      <ul className="grid sm:grid-cols-2 gap-x-4 gap-y-1">
                        {enh.features.map((feature, fi) => (
                          <li key={fi} className="text-xs text-gray-600 flex items-start gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {enh.dependencies && (
                      <p className="text-xs text-amber-700 bg-amber-50 rounded px-3 py-2 border border-amber-200">
                        <span className="font-semibold">Dependency:</span> {enh.dependencies}
                      </p>
                    )}
                    {/* Timeline via support plans */}
                    <div>
                      <h5 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2">Estimated Timeline via Support Package</h5>
                      <div className="grid grid-cols-3 gap-3">
                        {Object.entries(SUPPORT_PLAN_HOURS).map(([key, plan]) => (
                          <div key={key} className="bg-gray-50 rounded-lg p-3 text-center">
                            <div className={`font-bold text-sm ${plan.color}`}>{formatMonths(avgHours, plan.monthlyHours)}</div>
                            <div className="text-[10px] text-gray-500 mt-0.5">{plan.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Note */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 text-sm mb-1">Important Notes on Estimates</h4>
            <ul className="text-xs text-blue-700 space-y-1 list-disc pl-4">
              <li>All estimates are provided as ranges reflecting varying levels of complexity and scope refinement. Final cost depends on detailed requirements.</li>
              <li>Support package timelines assume the <strong>full monthly development allocation</strong> is dedicated to a single enhancement. Building multiple enhancements in parallel will extend timelines accordingly.</li>
              <li>The <strong>ad-hoc rate of $125/hr CAD</strong> applies if enhancements are commissioned outside of a support plan. Support plan hours are included in the plan cost and represent better value.</li>
              <li>Third-party service costs (Stripe transaction fees, push notification services, translation services, etc.) are not included in estimates and would be billed at cost.</li>
              <li>All prices in CAD. GST (5%) applies in addition to quoted amounts.</li>
            </ul>
          </div>
        </div>

        {/* ── SECTION 8: Recommendations ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Recommended Maintenance Considerations
          </h2>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            {[
              { title: 'Season Changeover', desc: 'Each new RMLL season requires updating division IDs and season IDs in the SportzSoft configuration as SportzSoft assigns new IDs annually.' },
              { title: 'SportzSoft API Changes', desc: 'The SportzSoft API is undocumented and could change without notice. Monitoring and adapting to API changes is an ongoing concern.' },
              { title: 'Security Updates', desc: 'Regular dependency updates to patch security vulnerabilities in npm packages and Supabase client libraries.' },
              { title: 'Backup Strategy', desc: 'All CMS content is stored in the Supabase KV store. Regular exports/backups of this data are recommended.' },
              { title: 'Performance Monitoring', desc: 'As traffic grows, monitoring Edge Function usage and database performance to ensure the Supabase plan tier remains sufficient.' },
              { title: 'OG Image Assets', desc: 'Adding branded Open Graph images for richer social media previews when RMLL pages are shared (currently using text-only meta tags).' },
            ].map((item, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900">{item.title}</h3>
                <p className="text-gray-500 text-xs mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-8 text-sm text-gray-400 border-t border-gray-200">
          <p>Prepared by Altered Digital Inc. for the Rocky Mountain Lacrosse League</p>
          <p className="mt-1">Document generated March 10, 2026</p>
        </div>

      </div>
    </div>
  );
}

export default ProjectTimesheetPage;
