import { useState, useEffect } from 'react';
import {
  FileText,
  Image,
  Settings,
  Users,
  LogOut,
  FolderOpen,
  Menu,
  X,
  Shield,
  Edit,
  Eye,
  LayoutDashboard,
  ArrowLeft,
  Mail,
  Megaphone,
  Trophy,
  Loader2,
  Newspaper,
  FileImage,
  AlertCircle,
  Link2,
  Contact,
  Code,
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { NewsManager } from './admin/NewsManager';
import { PageManager } from './admin/PageManager';
import { DocumentManager } from './admin/DocumentManager';
import { ImageManager } from './admin/ImageManager';
import { SettingsManager } from './admin/SettingsManager';
import { UserManager } from './admin/UserManager';
import { EmailManager } from './admin/EmailManager';
import { AnnouncementManager } from './admin/AnnouncementManager';
import { DivisionManager } from './admin/DivisionManager';
import { SuspensionsManager } from './admin/SuspensionsManager';
import { BrokenLinkChecker } from './admin/BrokenLinkChecker';
import { ContactInfoManager } from './admin/ContactInfoManager';
import { ComponentFileEditor } from './admin/ComponentFileEditor';
import { fetchNews, fetchDocuments, fetchUsers as fetchCmsUsers } from '../services/cms-api';
import { fetchAllAnnouncements } from '../services/announcements-api';

type TabType = 'overview' | 'news' | 'pages' | 'documents' | 'images' | 'email' | 'announcements' | 'divisions' | 'suspensions' | 'contacts' | 'link-checker' | 'settings' | 'users' | 'component-editor';

export function CMSDashboard() {
  const { user, signOut, isAdmin, isEditor } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getRoleBadge = (role: string) => {
    const badges = {
      admin: { label: 'Admin', icon: Shield, className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
      editor: { label: 'Editor', icon: Edit, className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
      viewer: { label: 'Viewer', icon: Eye, className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' },
    };
    return badges[role as keyof typeof badges] || badges.viewer;
  };

  const roleBadge = getRoleBadge(user?.role || 'viewer');

  const menuItems = [
    { id: 'overview' as TabType, label: 'Overview', icon: LayoutDashboard, requiredRole: 'viewer' },
    { id: 'news' as TabType, label: 'News Articles', icon: FileText, requiredRole: 'editor' },
    { id: 'pages' as TabType, label: 'Pages', icon: FileText, requiredRole: 'editor' },
    { id: 'component-editor' as TabType, label: 'Component Editor', icon: Code, requiredRole: 'editor' },
    { id: 'documents' as TabType, label: 'Documents', icon: FolderOpen, requiredRole: 'editor' },
    { id: 'images' as TabType, label: 'Images', icon: Image, requiredRole: 'editor' },
    { id: 'email' as TabType, label: 'Contact Forms', icon: Mail, requiredRole: 'admin' },
    { id: 'announcements' as TabType, label: 'Announcements', icon: Megaphone, requiredRole: 'admin' },
    { id: 'divisions' as TabType, label: 'Divisions', icon: Trophy, requiredRole: 'admin' },
    { id: 'suspensions' as TabType, label: 'Suspensions', icon: AlertCircle, requiredRole: 'admin' },
    { id: 'contacts' as TabType, label: 'Contact Info', icon: Contact, requiredRole: 'admin' },
    { id: 'link-checker' as TabType, label: 'Link Checker', icon: Link2, requiredRole: 'admin' },
    { id: 'settings' as TabType, label: 'Settings', icon: Settings, requiredRole: 'admin' },
    { id: 'users' as TabType, label: 'Users', icon: Users, requiredRole: 'admin' },
  ];

  const canAccess = (requiredRole: string) => {
    if (requiredRole === 'admin') return isAdmin();
    if (requiredRole === 'editor') return isEditor() || isAdmin();
    return true; // viewer
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/cms';
  };

  const navigateToTab = (tab: TabType) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">RMLL CMS</h1>
                <p className="text-xs text-gray-600 dark:text-gray-400 hidden sm:block">
                  Content Management System
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if ((window as any).navigateToPath) {
                    (window as any).navigateToPath('/');
                  } else {
                    window.history.pushState({}, '', '/');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }
                }}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden md:inline">Back to Website</span>
              </Button>
              <div className="hidden sm:flex items-center gap-2">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.name}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{user?.email}</p>
                </div>
                <Badge className={roleBadge.className}>
                  <roleBadge.icon className="w-3 h-3 mr-1" />
                  {roleBadge.label}
                </Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Mobile sidebar backdrop */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-20 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
            ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
            lg:translate-x-0 transition-transform duration-200 ease-in-out
            fixed lg:sticky top-16 left-0 z-30
            w-64 h-[calc(100vh-4rem)] bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
            overflow-y-auto
          `}
        >
          <nav className="p-4 space-y-1">
            {menuItems.map((item) => {
              if (!canAccess(item.requiredRole)) return null;
              
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => navigateToTab(item.id)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors
                    ${
                      isActive
                        ? 'bg-[#013fac] text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Mobile user info */}
          <div className="lg:hidden p-4 border-t border-gray-200 dark:border-gray-700 mt-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.name}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">{user?.email}</p>
              </div>
              <Badge className={roleBadge.className}>
                <roleBadge.icon className="w-3 h-3 mr-1" />
                {roleBadge.label}
              </Badge>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-4rem)]">
          {activeTab === 'overview' && <CMSOverview user={user} onNavigate={navigateToTab} />}
          {activeTab === 'news' && <NewsManager />}
          {activeTab === 'pages' && <PageManager />}
          {activeTab === 'component-editor' && <ComponentFileEditor />}
          {activeTab === 'documents' && <DocumentManager />}
          {activeTab === 'images' && <ImageManager />}
          {activeTab === 'email' && <EmailManager />}
          {activeTab === 'announcements' && <AnnouncementManager />}
          {activeTab === 'divisions' && <DivisionManager />}
          {activeTab === 'suspensions' && <SuspensionsManager />}
          {activeTab === 'contacts' && <ContactInfoManager />}
          {activeTab === 'link-checker' && <BrokenLinkChecker />}
          {activeTab === 'settings' && <SettingsManager />}
          {activeTab === 'users' && <UserManager />}
        </main>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Overview with live stats + clickable cards
// ---------------------------------------------------------------------------

interface ContentStats {
  newsCount: number;
  documentCount: number;
  announcementCount: number;
  userCount: number;
  loading: boolean;
  error: boolean;
}

function CMSOverview({ user, onNavigate }: { user: any; onNavigate: (tab: TabType) => void }) {
  const { isAdmin, isEditor } = useAuth();
  const [stats, setStats] = useState<ContentStats>({
    newsCount: 0,
    documentCount: 0,
    announcementCount: 0,
    userCount: 0,
    loading: true,
    error: false,
  });

  useEffect(() => {
    let cancelled = false;

    const loadStats = async () => {
      try {
        const results = await Promise.allSettled([
          fetchNews(),
          fetchDocuments(),
          fetchAllAnnouncements(),
          isAdmin() ? fetchCmsUsers() : Promise.resolve([]),
        ]);

        if (cancelled) return;

        setStats({
          newsCount: results[0].status === 'fulfilled' ? results[0].value.length : 0,
          documentCount: results[1].status === 'fulfilled' ? results[1].value.length : 0,
          announcementCount: results[2].status === 'fulfilled' ? results[2].value.length : 0,
          userCount: results[3].status === 'fulfilled' ? (results[3].value as any[]).length : 0,
          loading: false,
          error: false,
        });
      } catch {
        if (!cancelled) {
          setStats(prev => ({ ...prev, loading: false, error: true }));
        }
      }
    };

    loadStats();
    return () => { cancelled = true; };
  }, []);

  const editorCards = [
    {
      tab: 'news' as TabType,
      icon: Newspaper,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-100',
      title: 'News Articles',
      description: 'Create and manage news content',
      stat: stats.loading ? null : stats.newsCount,
      statLabel: 'articles',
    },
    {
      tab: 'pages' as TabType,
      icon: FileText,
      iconColor: 'text-green-600',
      iconBg: 'bg-green-100',
      title: 'Pages',
      description: 'Manage page navigation structure',
      stat: null,
      statLabel: '',
    },
    {
      tab: 'documents' as TabType,
      icon: FolderOpen,
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-100',
      title: 'Documents',
      description: 'Upload and organize PDFs and files',
      stat: stats.loading ? null : stats.documentCount,
      statLabel: 'documents',
    },
    {
      tab: 'images' as TabType,
      icon: FileImage,
      iconColor: 'text-pink-600',
      iconBg: 'bg-pink-100',
      title: 'Images',
      description: 'Upload and manage images',
      stat: null,
      statLabel: '',
    },
  ];

  const adminCards = [
    {
      tab: 'email' as TabType,
      icon: Mail,
      iconColor: 'text-orange-600',
      iconBg: 'bg-orange-100',
      title: 'Contact Forms',
      description: 'View contact submissions and manage email',
      stat: null,
      statLabel: '',
    },
    {
      tab: 'announcements' as TabType,
      icon: Megaphone,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-100',
      title: 'Announcements',
      description: 'Create site-wide announcements and popups',
      stat: stats.loading ? null : stats.announcementCount,
      statLabel: 'announcements',
    },
    {
      tab: 'divisions' as TabType,
      icon: Trophy,
      iconColor: 'text-teal-600',
      iconBg: 'bg-teal-100',
      title: 'Divisions',
      description: 'Manage division info, awards, and championships',
      stat: null,
      statLabel: '',
    },
    {
      tab: 'suspensions' as TabType,
      icon: AlertCircle,
      iconColor: 'text-red-600',
      iconBg: 'bg-red-100',
      title: 'Suspensions',
      description: 'Manage player suspensions and penalties',
      stat: null,
      statLabel: '',
    },
    {
      tab: 'contacts' as TabType,
      icon: Contact,
      iconColor: 'text-cyan-600',
      iconBg: 'bg-cyan-100',
      title: 'Contact Info',
      description: 'Manage contact information for the website',
      stat: null,
      statLabel: '',
    },
    {
      tab: 'link-checker' as TabType,
      icon: Link2,
      iconColor: 'text-cyan-600',
      iconBg: 'bg-cyan-100',
      title: 'Link Checker',
      description: 'Scan for broken links and fix them',
      stat: null,
      statLabel: '',
    },
    {
      tab: 'settings' as TabType,
      icon: Settings,
      iconColor: 'text-gray-600',
      iconBg: 'bg-gray-100',
      title: 'Settings',
      description: 'Site info, social links, SEO, and API key',
      stat: null,
      statLabel: '',
    },
    {
      tab: 'users' as TabType,
      icon: Users,
      iconColor: 'text-red-600',
      iconBg: 'bg-red-100',
      title: 'User Management',
      description: 'Create users, assign roles, control access',
      stat: stats.loading ? null : stats.userCount,
      statLabel: 'users',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
          Welcome back, {user?.name}!
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your RMLL website content from this dashboard.
        </p>
      </div>

      {/* Quick Stats Banner */}
      {(isEditor() || isAdmin()) && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'News', value: stats.newsCount, icon: Newspaper, tab: 'news' as TabType },
            { label: 'Documents', value: stats.documentCount, icon: FolderOpen, tab: 'documents' as TabType },
            { label: 'Announcements', value: stats.announcementCount, icon: Megaphone, tab: 'announcements' as TabType },
            ...(isAdmin() ? [{ label: 'Users', value: stats.userCount, icon: Users, tab: 'users' as TabType }] : []),
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => onNavigate(item.tab)}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-left hover:shadow-md hover:border-[#013fac]/30 transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <item.icon className="w-5 h-5 text-gray-400 group-hover:text-[#013fac] transition-colors" />
                {stats.loading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-gray-300" />
                ) : stats.error ? (
                  <AlertCircle className="w-4 h-4 text-red-400" />
                ) : null}
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.loading ? '--' : item.value}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
            </button>
          ))}
        </div>
      )}

      {/* Content Cards */}
      {(isEditor() || isAdmin()) && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Content</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {editorCards.map((card) => {
              const Icon = card.icon;
              return (
                <button
                  key={card.tab}
                  onClick={() => onNavigate(card.tab)}
                  className="text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:shadow-lg hover:border-[#013fac]/40 transition-all group"
                >
                  <div className={`w-10 h-10 ${card.iconBg} rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-5 h-5 ${card.iconColor}`} />
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-[#013fac] transition-colors">
                    {card.title}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                    {card.description}
                  </p>
                  {card.stat !== null && (
                    <p className="text-xs text-[#013fac] font-semibold mt-2">
                      {card.stat} {card.statLabel}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {isAdmin() && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Administration</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {adminCards.map((card) => {
              const Icon = card.icon;
              return (
                <button
                  key={card.tab}
                  onClick={() => onNavigate(card.tab)}
                  className="text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:shadow-lg hover:border-[#013fac]/40 transition-all group"
                >
                  <div className={`w-10 h-10 ${card.iconBg} rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-5 h-5 ${card.iconColor}`} />
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-[#013fac] transition-colors">
                    {card.title}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                    {card.description}
                  </p>
                  {card.stat !== null && (
                    <p className="text-xs text-[#013fac] font-semibold mt-2">
                      {card.stat} {card.statLabel}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Your Access Level */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your Access Level</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {user?.role === 'admin' && (
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Administrator</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Full access to all features including user management, content management, and system settings.
                  </p>
                </div>
              </div>
            )}
            {user?.role === 'editor' && (
              <div className="flex items-start gap-3">
                <Edit className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Editor</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Can create and edit content including news articles, pages, and upload documents.
                  </p>
                </div>
              </div>
            )}
            {user?.role === 'viewer' && (
              <div className="flex items-start gap-3">
                <Eye className="w-5 h-5 text-gray-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Viewer</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Read-only access to view content and settings. Contact an administrator to request editing permissions.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}