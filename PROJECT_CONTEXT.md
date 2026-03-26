# Rocky Mountain Lacrosse League (RMLL) Website - Project Context

## Project Overview

The RMLL website is a modern React-based single-page application (SPA) built for the Rocky Mountain Lacrosse League, a competitive box lacrosse league in Alberta, Canada. The site displays league information, schedules, standings, statistics, news, and provides a CMS for content management.

**Project Name:** Rocky Mountain Lacrosse League Mockup
**Version:** 1.3.8-subdivision-fix
**Type:** React SPA with Vite
**Language:** TypeScript/React

---

## Tech Stack

### Frontend
- **React 18.3.1** - UI framework with hooks
- **TypeScript** - Type safety
- **Vite 6.3.5** - Build tool and dev server
- **Tailwind CSS 4.1.12** - Styling with custom RMLL color scheme

### UI Components
- **Radix UI** - Accessible component primitives (@radix-ui/*)
- **shadcn/ui** - Pre-built UI components in `src/components/ui/`
- **Lucide React** - Icon library
- **Sonner** - Toast notifications
- **Recharts** - Data visualization
- **Command (cmdk)** - Command palette/search
- **Vaul** - Bottom sheets
- **React Day Picker** - Date picker

### Backend/API
- **Supabase** - Authentication, database, and serverless functions
  - Auth: User management (admin, editor, viewer roles)
  - Database: KV store for content (news, announcements, documents, users, settings)
  - Edge Functions: API endpoints for CMS operations
- **SportzSoft API** - Third-party sports data provider for:
  - Schedules, standings, teams, rosters
  - Player statistics and profiles
  - Game details and score sheets
  - Transactions and drafts

### Other Libraries
- **jsPDF** - PDF generation (game sheets)
- **React DnD** - Drag and drop functionality
- **next-themes** - Dark mode support (configured but not actively used)

---

## Project Structure

```
RMLL-NewWebsite/
├── src/
│   ├── main.tsx                 # App entry point
│   ├── App.tsx                  # Main router and layout
│   ├── index.css                # Tailwind imports
│   ├── styles/
│   │   └── globals.css          # Global styles, CSS variables, typography
│   │
│   ├── pages/                   # Route pages
│   │   ├── HomePage.tsx         # Home with lazy-loaded sub-pages
│   │   ├── SchedulePage.tsx
│   │   ├── StandingsPage.tsx
│   │   ├── StatsPage.tsx
│   │   ├── TeamsPageV1.tsx
│   │   ├── DivisionInfoPage.tsx
│   │   ├── DocumentsPageV1.tsx
│   │   ├── StorePageV1.tsx
│   │   ├── NewsPage.tsx
│   │   ├── ContactPage.tsx
│   │   ├── LeagueInfoPage.tsx
│   │   ├── PrivacyPolicyStandalonePage.tsx
│   │   ├── TermsOfServicePage.tsx
│   │   └── ProjectTimesheetPage.tsx
│   │
│   ├── components/              # React components
│   │   ├── Header.tsx           # Navigation header with division selector
│   │   ├── Footer.tsx           # Site footer
│   │   ├── Hero.tsx             # Hero section with league stats
│   │   ├── ScoreTicker.tsx      # Live score ticker
│   │   ├── NewsSection.tsx      # News preview section
│   │   ├── PlayerSpotlight.tsx  # Featured player display
│   │   ├── LeagueLeaders.tsx    # League statistics leaders
│   │   ├── StandingsSection.tsx # Standings table
│   │   ├── ScheduleSection.tsx  # Schedule display
│   │   ├── StatsSection.tsx     # Statistics display
│   │   ├── TeamDetailPage.tsx   # Team roster/details
│   │   ├── PlayerProfilePage.tsx # Individual player stats
│   │   ├── ContactForm.tsx      # Contact form
│   │   ├── SearchModal.tsx      # Global search (Ctrl/Cmd+K)
│   │   ├── AnnouncementPopup.tsx # Site announcements
│   │   ├── CMSDashboard.tsx     # Admin CMS dashboard
│   │   ├── DivisionDataLoader.tsx # Loads division data from API
│   │   ├── SubdivisionFilter.tsx # Sub-division dropdown filter
│   │   ├── RoughnecksSchedule.tsx # Roughnecks NLL team schedule
│   │   ├── SeasonInfoDisplay.tsx # Season info display
│   │   ├── DocumentsLibraryContent.tsx # Document library
│   │   ├── DraftsDisplay.tsx    # Draft information display
│   │   ├── AwardsDisplay.tsx    # Awards display
│   │   ├── Tier2AwardsDisplay.tsx
│   │   ├── ChampionshipsDisplay.tsx # Championships display
│   │   ├── Tier2ChampionshipsDisplay.tsx
│   │   ├── TransactionsDisplay.tsx # Transaction history
│   │   ├── ProtectedListDisplay.tsx # Protected player lists
│   │   ├── GameSheetModal.tsx   # Game sheet PDF modal
│   │   ├── FranchiseCertificate.tsx # Franchise certificate
│   │   ├── TeamEvents.tsx       # Team events
│   │   ├── StructuredData.tsx   # SEO structured data
│   │   ├── GoogleAnalytics.tsx  # GA tracking
│   │   ├── AdminLogin.tsx       # CMS login form
│   │   ├── ApiKeyAlert.tsx      # API key configuration warning
│   │   ├── StoreSection.tsx     # Store section
│   │   ├── ImageUploader.tsx    # Image upload component
│   │   ├── RichTextEditor.tsx   # Rich text editor
│   │   └── SortableTable.tsx    # Sortable table component
│   │
│   │   ├── admin/               # CMS admin components
│   │   │   ├── NewsManager.tsx
│   │   │   ├── PageManager.tsx
│   │   │   ├── DocumentManager.tsx
│   │   │   ├── ImageManager.tsx
│   │   │   ├── SettingsManager.tsx
│   │   │   ├── UserManager.tsx
│   │   │   ├── EmailManager.tsx
│   │   │   ├── AnnouncementManager.tsx
│   │   │   ├── DivisionManager.tsx
│   │   │   ├── SuspensionsManager.tsx
│   │   │   ├── AwardsEditor.tsx
│   │   │   ├── ChampionshipsEditor.tsx
│   │   │   ├── SeasonInfoEditor.tsx
│   │   │   ├── IntegratedNavigationEditor.tsx
│   │   │   ├── XMLImportModal.tsx
│   │   │   ├── LeagueInfoContentEditor.tsx
│   │   │   ├── BrokenLinkChecker.tsx
│   │   │   ├── ContactInfoManager.tsx
│   │   │   ├── XMLDocumentImporter.tsx
│   │   │   ├── BulkDocumentUploader.tsx
│   │   │   └── ApiKeyChecker.tsx
│   │   │
│   │   ├── ui/                  # shadcn/ui components (40+ components)
│   │   ├── figma/               # Figma-related components
│   │   └── league-info/         # League info data
│   │       └── suspensions-data.ts
│   │
│   ├── contexts/                # React contexts
│   │   ├── AuthContext.tsx      # Authentication state (user, roles)
│   │   ├── DivisionContext.tsx  # Division/sub-division selection
│   │   └── NavigationContext.tsx # SPA routing state
│   │
│   ├── hooks/                   # Custom React hooks
│   │   ├── useDocumentMeta.ts   # SEO document title/meta
│   │   ├── useSeasons.ts        # Season data fetching
│   │   ├── useTeamsData.ts      # Teams data fetching
│   │   ├── useAllTeamsData.ts
│   │   ├── useCurrentTeamsData.ts
│   │   ├── useDivisionScheduleStatus.ts
│   │   ├── useDivisionDraft.ts  # Draft data
│   │   ├── useDivisionMapping.ts
│   │   ├── useDivisionTransactions.ts
│   │   ├── useDocumentMeta.ts   # Document metadata
│   │   ├── useDraftPicks.ts
│   │   ├── useGameDetails.ts
│   │   ├── useHomepageStats.ts
│   │   ├── useLeagueStats.ts
│   │   ├── usePlayerProfile.ts
│   │   ├── useProtectedList.ts
│   │   ├── useScheduleData.ts
│   │   ├── useTeamRoster.ts
│   │   ├── useTeamSchedule.ts
│   │   ├── useTeamTransactions.ts
│   │   └── useTransactions.ts
│   │
│   ├── services/                # API service layers
│   │   ├── cms-api.ts           # CMS API (news, documents, pages, users)
│   │   ├── announcements-api.ts # Announcements API
│   │   ├── email-api.ts         # Email/contact form API
│   │   └── sportzsoft/          # SportzSoft API integration
│   │       ├── client.ts        # API client with key management
│   │       ├── api.ts           # API functions (fetchSchedule, etc.)
│   │       ├── types.ts         # TypeScript types
│   │       ├── constants.ts     # API constants
│   │       ├── utils.ts         # Utility functions
│   │       └── index.ts         # Main exports
│   │
│   ├── supabase/                # Supabase server functions
│   │   └── functions/
│   │       └── server/          # Edge function routes
│   │           ├── auth_routes.ts       # User auth, profile, admin users
│   │           ├── config_routes.ts     # SportzSoft API key, settings
│   │           ├── content_routes.ts    # News, pages, announcements
│   │           ├── documents_routes.ts  # Document upload/management
│   │           ├── email_routes.ts      # Contact forms
│   │           ├── images_routes.ts     # Image upload
│   │           ├── settings_routes.ts   # Site settings, league contacts
│   │           ├── link_checker_routes.ts # Link checking
│   │           └── suspensions_routes.ts # Suspensions data
│   │
│   ├── utils/                   # Utility functions
│   │   ├── supabase-client.ts   # Supabase client singleton
│   │   ├── page-content-types.ts # Page content type definitions
│   │   ├── calendar.ts          # Calendar utilities
│   │   ├── color-extractor.ts   # Color extraction
│   │   ├── document-analyzer.ts # Document analysis
│   │   ├── email-templates.ts   # Email templates
│   │   ├── gameSheetPdf.ts      # Game sheet PDF generation
│   │   ├── team-colors.ts       # Team color mappings
│   │   ├── team-logos.ts        # Team logo mappings
│   │   ├── supabase/
│   │   │   └── info.tsx         # Supabase credentials
│   │   └── page-defaults/       # Default page content
│   │       ├── index.ts
│   │       ├── mission-statement.ts
│   │       ├── code-of-conduct.ts
│   │       ├── executive.ts
│   │       ├── registration.ts
│   │       ├── privacy-policy.ts
│   │       ├── bylaws.ts
│   │       ├── regulations.ts
│   │       ├── rules-of-play.ts
│   │       ├── officiating-*.ts
│   │       ├── coaching-*.ts
│   │       ├── combines.ts
│   │       ├── new-player-info*.ts
│   │       ├── graduating-u17-info.ts
│   │       ├── lcala-info.ts
│   │       ├── bad-standing.ts
│   │       ├── planning-meeting-agm.ts
│   │       ├── history.ts
│   │       └── awards.ts
│   │
│   ├── imports/                 # Imported data
│   │   └── pasted_text/
│   │       └── franchise-team-roles.json
│   │
│   ├── assets/                  # Static assets (images, logos)
│   ├── guidelines/              # Project guidelines
│   └── Attributions.md          # Library attributions
│
├── package.json                 # Dependencies
├── vite.config.ts               # Vite configuration
├── index.html                   # HTML entry point
├── .npmrc                       # npm configuration
└── README.md                    # Project readme
```

---

## Key Features

### Public Website
1. **Home Page** - Hero section with league stats (divisions, teams, games), season countdown, quick navigation
2. **Schedule** - Game schedules by division, with team-specific views
3. **Standings** - League standings tables
4. **Statistics** - Player stats, league leaders, individual player profiles
5. **Teams** - Team roster pages with player lists
6. **Division Info** - Detailed division information (awards, championships, etc.)
7. **Documents** - Document library (rules, forms, policies, etc.)
8. **News** - News articles with categories
9. **Contact** - Contact form

### CMS (Content Management System) - `/cms`
Accessed at `/cms`, the CMS provides:
- **News Management** - Create/edit news articles with rich text editor
- **Page Management** - Create/edit custom pages
- **Document Management** - Upload and manage PDF documents
- **Image Management** - Upload and manage images
- **Announcement Management** - Site-wide announcements/popups
- **User Management** - Admin can create/edit users (admin, editor, viewer roles)
- **Settings** - Site info, contact details, social links, SEO, API key management
- **League Info Content** - Edit League Info page content block-by-block
- **Divisions** - Manage division info, awards, championships
- **Suspensions** - Manage player suspensions
- **Contact Info** - Manage contact information
- **Link Checker** - Scan for broken links
- **Contact Forms** - View contact form submissions

### User Roles
- **Admin** - Full access to all features including user management
- **Editor** - Can create and edit content (news, pages, documents, images)
- **Viewer** - Read-only access to CMS

---

## Routing Architecture

The app uses a custom SPA routing system:

### Main Routes (`App.tsx`)
- `/` - **Home Page** (with internal navigation via `NavigationContext`)
- `/cms` - **CMS Dashboard** (requires auth via `AuthProvider`)
- `/league-info` - **League Info Page** (static page)
- `/contact` - **Contact Page**
- `/privacy-policy` - **Privacy Policy Page**
- `/terms-of-service` - **Terms of Service Page**
- `/project-timesheet` - **Project Timesheet Page**

### Internal Navigation (`NavigationContext`)
Within the home page route (`/`), internal pages are managed via context:
- `home` - Main home view
- `schedule` - Schedule view
- `standings` - Standings view
- `stats` - Statistics view
- `teams` - Teams view
- `division-info` - Division info view
- `documents` - Documents view
- `store` - Store view
- `player` - Player profile view (with params: `playerId`)
- `news` - News view

The navigation is triggered via:
- `useNavigation()` hook provides `navigateTo(page, params)`
- Custom event `rmll-navigate` for in-page navigation
- Session storage for cross-page navigation
- Global `window.navigateToPath()` for route changes

---

## Contexts

### AuthContext (`src/contexts/AuthContext.tsx`)
Manages user authentication with Supabase:
- `user` - Current user object (id, email, name, role)
- `loading` - Auth state loading
- `signIn(email, password)` - Sign in function
- `signOut()` - Sign out function
- `isAdmin()` / `isEditor()` - Role checks
- `refreshUser()` - Refresh user profile

### DivisionContext (`src/contexts/DivisionContext.tsx`)
Manages division/sub-division selection:
- `selectedDivision` - Current division selection
- `selectedSubDivision` - Current sub-division selection
- `divisions` - Available divisions
- `subDivisions` - Available sub-divisions by division
- `activeDivisions` - Divisions with active teams
- `dynamicDivisionGroups` - Dynamic division ID mappings from API
- Selections persisted to localStorage

### NavigationContext (`src/contexts/NavigationContext.tsx`)
Manages SPA internal navigation:
- `currentPage` - Current page (within home route)
- `navigationParams` - Navigation parameters
- `navigateTo(page, params)` - Navigate function

---

## API Integration

### SportzSoft API
Third-party sports data provider accessed via `src/services/sportzsoft/`:

**Key Functions:**
- `fetchSeasons()` - Get available seasons with division groups
- `fetchTeams(seasonId)` - Get teams for a season
- `fetchSchedule(seasonId, start, end, options)` - Get games/practices
- `fetchStandings(seasonId, divisionId)` - Get standings
- `fetchGameDetails(gameId)` - Get detailed game info
- `fetchTeamRoster(teamId)` - Get team roster
- `fetchPlayerStats(options)` - Get player statistics
- `fetchPlayerCareerStats(playerId)` - Get career stats
- `fetchFranchiseTransactions(options)` - Get transaction history
- `fetchDivisionDraft(options)` - Get draft data
- `fetchDivisionScheduleStatus(divisionId)` - Check if schedule is ready/final

**Features:**
- API key fetched from Supabase environment variables
- Request deduplication and caching (5-30 min TTL)
- Timezone-aware headers (TZO, LocalTime)

### Supabase CMS API
Backend functions accessed via Supabase Edge Functions:

**Endpoints:**
- `/user/profile` - Get current user profile
- `/admin/users` - User management (CRUD)
- `/news` - News articles (CRUD)
- `/pages` - Page management (CRUD)
- `/documents` - Document management (CRUD)
- `/upload-image` - Image upload
- `/upload-document` - Document upload
- `/announcements` - Announcements (CRUD)
- `/settings` - Site settings (GET/PUT)
- `/league-contacts` - League contacts (GET/PUT)
- `/config/sportzsoft-key` - Get SportzSoft API key
- `/email/*` - Contact form submissions
- `/suspensions/*` - Suspension data
- `/link-checker/*` - Broken link scanning

---

## Styling

### Color Scheme (RMLL Brand)
- **Primary:** `#013fac` (Royal Blue)
- **Primary Dark:** `#00234f`
- **Header BG:** `#001741` (Dark Navy)
- **Accent:** `#dc2626` (Red)
- **Accent Dark:** `#b91c1c`
- **Accent Light:** `#ef4444`

### Fonts
- **Primary:** `'Athletic Block'` / `'Bebas Neue'` (headings)
- **Secondary:** `'Montserrat'` (body text)

### Custom CSS Variables
Defined in `src/styles/globals.css`:
- `--font-primary`, `--font-secondary`
- `--color-primary`, `--color-primary-dark`, etc.
- Chart colors, sidebar colors, etc.

---

## Data Flow

### Division Data Loading
1. `DivisionDataLoader` component mounts on app start
2. Fetches seasons from SportzSoft API
3. Builds dynamic division groups from season data
4. Detects active divisions with teams
5. Populates `DivisionContext` with active divisions and sub-divisions
6. Loads division awards, championships, suspensions

### Authentication Flow
1. User accesses `/cms`
2. `AuthProvider` checks for existing Supabase session
3. If no session, shows `AdminLogin` form
4. On sign-in, fetches user profile from backend
5. User role (admin/editor/viewer) determines CMS access
6. Token used for all CMS API requests

### SPA Navigation
1. User clicks nav item → calls `navigateTo(page)`
2. `NavigationContext` updates `currentPage` state
3. `HomePage` renders appropriate lazy-loaded page component
4. Document title/meta updated via `useDocumentMeta` hook
5. Google Analytics page view tracked

---

## Known Configuration

### Supabase
- **Project ID:** `nkfbehspyjookipapdbp`
- **Edge Function Name:** `make-server-9a1ba23f`
- **Base URL:** `https://nkfbehspyjookipapdbp.supabase.co`

### SportzSoft
- **Organization ID:** `520` (defined in constants)
- **API Key:** Retrieved from Supabase env variable `SPORTZSOFT_API_KEY`

---

## Development

### Scripts
```bash
npm i          # Install dependencies
npm run dev    # Start dev server (port 3000)
npm run build  # Build for production
```

### Dev Server
- Port: 3000
- Auto-opens browser on start

---

## Notes

- The app uses lazy loading for better performance (secondary pages loaded on demand)
- API responses are cached with TTL to reduce calls
- Division/sub-division selections are persisted to localStorage
- Season rollover logic handles transition between seasons
- The CMS is fully functional with role-based access control
- The site includes Google Analytics tracking
- Images are assets exported from Figma Make