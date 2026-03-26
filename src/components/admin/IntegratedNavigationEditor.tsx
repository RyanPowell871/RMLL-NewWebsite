import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Plus, Trash2, Edit, GripVertical, FileText, Scale, Trophy, BookOpen, Wrench, Briefcase, Users, Save, Sparkles, Upload, Eye, EyeOff, Globe, Calendar, Edit2, ChevronDown, ChevronRight, Image as ImageIcon, Box } from 'lucide-react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Badge } from '../ui/badge';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { fetchPages, updatePage, deletePage, type Page } from '../../services/cms-api';
import { getAccessToken } from '../../utils/supabase-client';

interface NavItem {
  id: string;
  label: string;
  slug: string;
}

interface NavSection {
  title: string;
  icon: string;
  items: NavItem[];
}

interface PageWithNav extends Page {
  navLabel?: string;
  isVirtual?: boolean; // For custom component pages that don't have KV entries
}

const ICON_OPTIONS = [
  { value: 'FileText', label: 'File Text' },
  { value: 'Scale', label: 'Scale/Legal' },
  { value: 'Trophy', label: 'Trophy' },
  { value: 'BookOpen', label: 'Book' },
  { value: 'Wrench', label: 'Tools' },
  { value: 'Briefcase', label: 'Briefcase' },
  { value: 'Users', label: 'Users' },
];

const ItemTypes = {
  SECTION: 'section',
  PAGE_ITEM: 'pageItem',
};

// Known custom component page slugs — these render React components, not CMS HTML
const CUSTOM_COMPONENT_SLUGS: Record<string, string> = {
  'rmll-executive': 'RMLLExecutivePage',
  'affiliate-links': 'AffiliateLinksPage',
  'affiliate-website-links': 'AffiliateLinksPage',
  'mission-statement': 'MissionStatementPage',
  'history': 'HistoryPage',
  'documents': 'DocumentsLibraryContent',
  'code-of-conduct': 'CodeOfConductPage',
  'privacy-policy': 'PrivacyPolicyPage',
  'bylaws': 'BylawsPage',
  'regulations': 'RegulationsPage',
  'rules-of-play': 'RulesOfPlayPage',
  'facilities': 'FacilitiesPage',
  'awards': 'AwardsPage',
  'registration': 'RegistrationPage',
  'suspension-guidelines': 'SuspensionsPage',
  'super-coaching-clinic': 'SuperCoachingClinicPage',
  'coaching-requirements': 'CoachingRequirementsPage',
  'combines': 'CombinesPage',
  'officiating-rulebook': 'OfficiatingRulebookPage',
  'officiating-floor-equipment': 'OfficiatingFloorEquipmentPage',
  'officiating-rule-interpretations': 'OfficiatingRuleInterpretationsPage',
  'officiating-off-floor-officials': 'OfficiatingOffFloorOfficialsPage',
  'officiating-application-form': 'OfficiatingApplicationFormPage',
  'bad-standing': 'BadStandingPage',
  'new-player-info': 'NewPlayerInfoPage',
  'new-player-info-female': 'NewPlayerInfoFemalePage',
  'graduating-u17-info': 'GraduatingU17InfoPage',
  'lcala-info': 'LCALAInfoPage',
  'brand-guidelines': 'BrandGuidelinesPage',
  'planning-meeting-agm': 'PlanningMeetingAGMPage',
};

// Component pages that use live data and CANNOT be edited via CMS
const LIVE_DATA_SLUGS = new Set(['facilities', 'documents', 'suspension-guidelines']);

// Content editor component
function ContentEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-64 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 font-mono text-sm"
      placeholder="Enter HTML content..."
    />
  );
}

interface DraggablePageItemProps {
  page: PageWithNav;
  sectionIndex: number;
  sectionTitle: string;
  itemIndex: number;
  moveItem: (fromSectionIndex: number, fromItemIndex: number, toSectionIndex: number, toItemIndex: number, toSectionTitle: string) => void;
  onEdit: (page: PageWithNav) => void;
  onDelete: (slug: string) => void;
}

function DraggablePageItem({ page, sectionIndex, sectionTitle, itemIndex, moveItem, onEdit, onDelete }: DraggablePageItemProps) {
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.PAGE_ITEM,
    item: { sectionIndex, itemIndex, page, sectionTitle },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: ItemTypes.PAGE_ITEM,
    hover: (draggedItem: { sectionIndex: number; itemIndex: number; sectionTitle: string }) => {
      if (draggedItem.sectionIndex !== sectionIndex || draggedItem.itemIndex !== itemIndex) {
        moveItem(draggedItem.sectionIndex, draggedItem.itemIndex, sectionIndex, itemIndex, sectionTitle);
        draggedItem.sectionIndex = sectionIndex;
        draggedItem.itemIndex = itemIndex;
        draggedItem.sectionTitle = sectionTitle;
      }
    },
  });

  const isCustomComponent = !!page.custom_component || !!page.isVirtual;
  const isEditable = isCustomComponent && !LIVE_DATA_SLUGS.has(page.slug);
  const isLiveData = isCustomComponent && LIVE_DATA_SLUGS.has(page.slug);

  return (
    <div
      ref={(node) => drag(drop(node))}
      className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-400 dark:hover:border-blue-600 transition-all ${
        isDragging ? 'opacity-50 scale-95' : ''
      }`}
    >
      <div className="p-3 sm:p-4">
        <div className="flex items-start gap-2 sm:gap-3">
          <div className="cursor-move mt-1 shrink-0">
            <GripVertical className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate">
                    {page.navLabel || page.title}
                  </h4>
                  {isCustomComponent && (
                    <Badge variant="outline" className={`text-[10px] shrink-0 ${
                      isLiveData 
                        ? 'bg-orange-50 text-orange-700 border-orange-200' 
                        : 'bg-purple-50 text-purple-700 border-purple-200'
                    }`}>
                      <Box className="w-2.5 h-2.5 mr-0.5" />
                      {isLiveData ? 'Live Data' : 'Editable Component'}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                  <span className="flex items-center gap-1 truncate">
                    <Globe className="w-3 h-3 shrink-0" />
                    /{page.slug}
                  </span>
                  {page.updated_at && (
                    <span className="flex items-center gap-1 shrink-0">
                      <Calendar className="w-3 h-3" />
                      {new Date(page.updated_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {isLiveData ? (
                  <span className="text-xs text-orange-600 dark:text-orange-400 px-2 py-1 bg-orange-50 dark:bg-orange-900/20 rounded hidden sm:block">
                    Live Data (Read Only)
                  </span>
                ) : isEditable ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(page)}
                      className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 h-8 px-2 sm:px-3"
                    >
                      <Edit2 className="w-3 h-3 sm:mr-1" />
                      <span className="hidden sm:inline">Edit Content</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(page.slug)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 px-2 sm:px-3"
                    >
                      <Trash2 className="w-3 h-3 sm:mr-1" />
                      <span className="hidden sm:inline">Delete</span>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(page)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 px-2 sm:px-3"
                    >
                      <Edit2 className="w-3 h-3 sm:mr-1" />
                      <span className="hidden sm:inline">Edit</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(page.slug)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 px-2 sm:px-3"
                    >
                      <Trash2 className="w-3 h-3 sm:mr-1" />
                      <span className="hidden sm:inline">Delete</span>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface DraggableSectionProps {
  section: NavSection;
  sectionIndex: number;
  pages: PageWithNav[];
  moveSection: (fromIndex: number, toIndex: number) => void;
  moveItem: (fromSectionIndex: number, fromItemIndex: number, toSectionIndex: number, toItemIndex: number, toSectionTitle: string) => void;
  onEditSection: (section: NavSection, index: number) => void;
  onDeleteSection: (index: number) => void;
  onEditPage: (page: PageWithNav) => void;
  onDeletePage: (slug: string) => void;
  onAddPage: (sectionIndex: number) => void;
  expandedSections: Set<number>;
  toggleSection: (index: number) => void;
}

function DraggableSection({
  section,
  sectionIndex,
  pages,
  moveSection,
  moveItem,
  onEditSection,
  onDeleteSection,
  onEditPage,
  onDeletePage,
  onAddPage,
  expandedSections,
  toggleSection,
}: DraggableSectionProps) {
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.SECTION,
    item: { sectionIndex },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: ItemTypes.SECTION,
    hover: (draggedItem: { sectionIndex: number }) => {
      if (draggedItem.sectionIndex !== sectionIndex) {
        moveSection(draggedItem.sectionIndex, sectionIndex);
        draggedItem.sectionIndex = sectionIndex;
      }
    },
  });

  const isExpanded = expandedSections.has(sectionIndex);
  const componentCount = pages.filter(p => p.isVirtual || p.custom_component).length;
  const cmsCount = pages.length - componentCount;

  return (
    <div
      ref={(node) => drag(drop(node))}
      className={`border border-gray-200 dark:border-gray-700 rounded-lg ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center gap-2 p-3 sm:p-4 bg-gradient-to-r from-[#013fac] to-[#0149c9] text-white border-b border-gray-200 dark:border-gray-700 group rounded-t-lg">
        <GripVertical className="w-4 h-4 sm:w-5 sm:h-5 opacity-70 cursor-move shrink-0" />
        <button
          onClick={() => toggleSection(sectionIndex)}
          className="flex items-center gap-2 flex-1 text-left min-w-0"
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 shrink-0" />
          )}
          <span className="font-semibold truncate">{section.title}</span>
          <span className="text-xs opacity-80 shrink-0">
            ({pages.length} page{pages.length !== 1 ? 's' : ''})
          </span>
        </button>
        <div className="flex gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEditSection(section, sectionIndex)}
            className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-white hover:bg-white/20"
          >
            <Edit2 className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAddPage(sectionIndex)}
            className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-white hover:bg-white/20"
          >
            <Plus className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDeleteSection(sectionIndex)}
            className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-white hover:bg-white/20"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-3 sm:p-4 space-y-2 sm:space-y-3 bg-gray-50 dark:bg-gray-900/30">
          {/* Summary badges */}
          {pages.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-gray-500 pb-1">
              {cmsCount > 0 && (
                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">
                  {cmsCount} editable
                </span>
              )}
              {componentCount > 0 && (
                <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full">
                  {componentCount} component{componentCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}
          
          {pages.map((page, itemIndex) => (
            <DraggablePageItem
              key={page.slug}
              page={page}
              sectionIndex={sectionIndex}
              sectionTitle={section.title}
              itemIndex={itemIndex}
              moveItem={moveItem}
              onEdit={onEditPage}
              onDelete={onDeletePage}
            />
          ))}
          {pages.length === 0 && (
            <div className="text-center py-8 text-sm text-gray-500 bg-white dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
              No pages in this section. Click + to add one.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function IntegratedNavigationEditor() {
  const [navigation, setNavigation] = useState<NavSection[]>([]);
  const [allPages, setAllPages] = useState<PageWithNav[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0, 1, 2, 3, 4, 5, 6]));
  
  // Modal states
  const [editingPage, setEditingPage] = useState<PageWithNav | null>(null);
  const [editingSectionIndex, setEditingSectionIndex] = useState<number | null>(null);
  const [editingSection, setEditingSection] = useState<NavSection | null>(null);
  const [addingSectionModal, setAddingSectionModal] = useState(false);
  const [addingPageModal, setAddingPageModal] = useState(false);
  const [addingPageSectionIndex, setAddingPageSectionIndex] = useState<number | null>(null);
  const [processingAI, setProcessingAI] = useState(false);
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [imageAnalysisPrompt, setImageAnalysisPrompt] = useState('');
  const [editingComponentPage, setEditingComponentPage] = useState(false); // tracks if current edit is a component page
  const [loadingComponentContent, setLoadingComponentContent] = useState(false);
  
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load navigation
      const navResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9a1ba23f/cms/league-info-navigation`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      let navData: NavSection[] = [];
      if (navResponse.ok) {
        const data = await navResponse.json();
        navData = data.navigation || [];
      }

      // Load all KV-stored pages
      const kvPages = await fetchPages();
      const kvPageMap = new Map<string, Page>();
      for (const p of kvPages) {
        kvPageMap.set(p.slug, p);
      }
      
      // Build a complete page list:
      // - KV pages that match custom component slugs get flagged as components
      // - Nav items without KV entries get virtual entries
      const allPagesList: PageWithNav[] = kvPages.map(p => {
        const componentName = CUSTOM_COMPONENT_SLUGS[p.slug];
        if (componentName) {
          return { ...p, custom_component: componentName, isVirtual: true };
        }
        return p;
      });
      const allSlugSet = new Set(kvPages.map(p => p.slug));

      for (const section of navData) {
        for (const item of section.items) {
          if (!allSlugSet.has(item.slug)) {
            // This nav item doesn't have a KV page entry.
            // Check if it's a known custom component, or create a virtual placeholder.
            const componentName = CUSTOM_COMPONENT_SLUGS[item.slug];
            const virtualPage: PageWithNav = {
              id: item.id || item.slug,
              slug: item.slug,
              title: item.label,
              content: '',
              meta_description: null,
              featured_image_url: null,
              is_published: true,
              show_in_nav: true,
              nav_order: 0,
              template: 'default' as const,
              custom_component: componentName || undefined,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              navLabel: item.label,
              isVirtual: true,
            };
            allPagesList.push(virtualPage);
            allSlugSet.add(item.slug);
          }
        }
      }

      // Map pages with their navLabel
      const pagesWithNav = allPagesList.map(page => {
        for (const section of navData) {
          const navItem = section.items.find(item => item.slug === page.slug);
          if (navItem) {
            return { ...page, navLabel: navItem.label };
          }
        }
        return page;
      });
      
      setNavigation(navData);
      setAllPages(pagesWithNav);
      
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load navigation and pages');
    } finally {
      setLoading(false);
    }
  };

  const getPagesForSection = (sectionIndex: number): PageWithNav[] => {
    const section = navigation[sectionIndex];
    if (!section) return [];
    
    const sectionPages: PageWithNav[] = [];
    for (const item of section.items) {
      const page = allPages.find(p => p.slug === item.slug);
      if (page) {
        sectionPages.push({ ...page, navLabel: item.label });
      }
    }
    return sectionPages;
  };

  const saveNavigation = async () => {
    try {
      setSaving(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9a1ba23f/cms/league-info-navigation`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${await getAccessToken()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ navigation }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save navigation');
      }

      toast.success('Navigation saved successfully!');
    } catch (error) {
      console.error('Error saving navigation:', error);
      toast.error('Failed to save navigation');
    } finally {
      setSaving(false);
    }
  };

  const moveSection = (fromIndex: number, toIndex: number) => {
    const newNavigation = [...navigation];
    const [movedSection] = newNavigation.splice(fromIndex, 1);
    newNavigation.splice(toIndex, 0, movedSection);
    setNavigation(newNavigation);
  };

const moveItem = async (
    fromSectionIndex: number,
    fromItemIndex: number,
    toSectionIndex: number,
    toItemIndex: number,
    toSectionTitle: string
  ) => {
    // 1. Create a deep copy of the navigation to avoid mutating state directly
    const newNavigation = JSON.parse(JSON.stringify(navigation));
    
    // 2. Safely extract the item we are moving
    const movedItem = newNavigation[fromSectionIndex].items[fromItemIndex];
    if (!movedItem) return;

    // 3. Remove this exact item from ALL sections just to be safe (prevents duplication bugs)
    newNavigation.forEach((section: NavSection) => {
      section.items = section.items.filter((item: NavItem) => item.slug !== movedItem.slug);
    });

    // 4. Insert the item into its new destination
    newNavigation[toSectionIndex].items.splice(toItemIndex, 0, movedItem);

    // 5. Update state
    if (fromSectionIndex !== toSectionIndex) {
      toast.success(`Page moved to ${toSectionTitle} section`);
    }
    setNavigation(newNavigation);
  };

  const toggleSection = (index: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSections(newExpanded);
  };

  const handleEditPage = async (page: PageWithNav) => {
    const isComponent = !!(page.isVirtual || page.custom_component);
    const isEditable = isComponent && !LIVE_DATA_SLUGS.has(page.slug);
    
    if (isComponent && !isEditable) {
      toast.info('This page uses live data and cannot be edited through the CMS.');
      return;
    }
    
    if (isEditable) {
      // Editable component page — load existing KV content if any
      setEditingComponentPage(true);
      setLoadingComponentContent(true);
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-9a1ba23f/cms/component-page-info/${page.slug}`,
          { headers: { 'Authorization': `Bearer ${publicAnonKey}` } }
        );
        if (response.ok) {
          const data = await response.json();
          const kvContent = data.info?.kvContent;
          setEditingPage({
            ...page,
            title: kvContent?.title || page.navLabel || page.title,
            content: kvContent?.content || '',
            meta_description: kvContent?.meta_description || '',
            is_published: kvContent?.is_published !== false,
          });
        } else {
          setEditingPage({
            ...page,
            content: '',
            is_published: true,
          });
        }
      } catch (error) {
        console.error('Error loading component page info:', error);
        setEditingPage({
          ...page,
          content: '',
          is_published: true,
        });
      } finally {
        setLoadingComponentContent(false);
      }
      return;
    }
    
    // Regular CMS page
    setEditingComponentPage(false);
    setEditingPage(page);
  };

  const handleSavePage = async () => {
    if (!editingPage) return;

    try {
      if (editingComponentPage) {
        // Save via the component page content endpoint
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-9a1ba23f/cms/component-page-content/${editingPage.slug}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: editingPage.title,
              content: editingPage.content,
              meta_description: editingPage.meta_description,
              is_published: editingPage.is_published,
            }),
          }
        );
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to save component page content');
        }
        toast.success('Component page content saved! It will now show your custom HTML instead of the default component.');
      } else {
        // Regular page save
        await updatePage(editingPage.slug, {
          title: editingPage.title,
          content: editingPage.content,
          meta_description: editingPage.meta_description,
          is_published: editingPage.is_published,
        });
        toast.success('Page updated successfully!');
      }

      setAllPages(prev => prev.map(p => 
        p.slug === editingPage.slug ? { ...editingPage, updated_at: new Date().toISOString() } : p
      ));

      setEditingPage(null);
      setEditingComponentPage(false);
    } catch (error) {
      console.error('Error updating page:', error);
      toast.error(`Failed to update page: ${(error as Error).message}`);
    }
  };

  const handleResetToDefault = async () => {
    if (!editingPage) return;
    if (!confirm('Reset this page to the default React component? Any custom HTML content will be deleted.')) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9a1ba23f/cms/component-page-content/${editingPage.slug}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ resetToDefault: true }),
        }
      );
      if (!response.ok) throw new Error('Failed to reset');
      
      toast.success('Page reset to default component view.');
      setEditingPage(null);
      setEditingComponentPage(false);
    } catch (error) {
      console.error('Error resetting page:', error);
      toast.error('Failed to reset page to default.');
    }
  };

  const handleEditSection = (section: NavSection, index: number) => {
    setEditingSection({ ...section });
    setEditingSectionIndex(index);
  };

  const handleDeletePage = async (slug: string) => {
    if (!confirm('Are you sure you want to delete this page? This will remove its content and remove it from navigation. This cannot be undone.')) return;

    try {
      await deletePage(slug);
      
      // Remove from all navigation sections
      const newNavigation = navigation.map(section => ({
        ...section,
        items: section.items.filter(item => item.slug !== slug),
      }));
      setNavigation(newNavigation);
      
      // Auto-save the updated navigation
      try {
        await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-9a1ba23f/cms/league-info-navigation`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${await getAccessToken()}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ navigation: newNavigation }),
          }
        );
      } catch (navError) {
        console.error('Error auto-saving navigation after page delete:', navError);
      }
      
      // Remove from allPages
      setAllPages(prev => prev.filter(p => p.slug !== slug));
      
      toast.success('Page deleted and removed from navigation!');
    } catch (error) {
      console.error('Error deleting page:', error);
      toast.error('Failed to delete page');
    }
  };

  const handleSaveSection = () => {
    if (editingSection && editingSectionIndex !== null) {
      const newNavigation = [...navigation];
      newNavigation[editingSectionIndex] = editingSection;
      setNavigation(newNavigation);
      setEditingSection(null);
      setEditingSectionIndex(null);
      toast.success('Section updated');
    }
  };

  const handleDeleteSection = (index: number) => {
    if (confirm('Are you sure you want to delete this section? Pages will remain but be removed from navigation.')) {
      const newNavigation = navigation.filter((_, i) => i !== index);
      setNavigation(newNavigation);
      toast.success('Section deleted');
    }
  };

  const handleAddSection = () => {
    setEditingSection({ title: 'New Section', icon: 'FileText', items: [] });
    setAddingSectionModal(true);
  };

  const handleSaveNewSection = () => {
    if (editingSection) {
      setNavigation([...navigation, editingSection]);
      setEditingSection(null);
      setAddingSectionModal(false);
      toast.success('Section added');
    }
  };

  const handleAddPage = (sectionIndex: number) => {
    setAddingPageSectionIndex(sectionIndex);
    setAddingPageModal(true);
  };

  const handleAddPageToSection = (page: PageWithNav) => {
    if (addingPageSectionIndex !== null) {
      const newNavigation = [...navigation];
      newNavigation[addingPageSectionIndex].items.push({
        id: page.slug,
        label: page.navLabel || page.title,
        slug: page.slug,
      });
      setNavigation(newNavigation);
      setAddingPageModal(false);
      setAddingPageSectionIndex(null);
      toast.success('Page added to navigation');
    }
  };

  const handleAIProcess = async () => {
    if (!editingPage) return;

    const contentLength = editingPage.content?.length || 0;
    if (contentLength > 20000) {
      if (!confirm(`This content is quite long (${Math.round(contentLength / 1000)}K characters). AI processing may take 60-120 seconds. Continue?`)) {
        return;
      }
    }

    try {
      setProcessingAI(true);
      toast.info('AI is processing your content...');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 150000);

      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-9a1ba23f/cms/ai-process-content`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              content: editingPage.content,
              customPrompt: customPrompt.trim() || undefined 
            }),
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          let errorMessage = 'Failed to process content with AI';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch {
            const textError = await response.text();
            errorMessage = textError || errorMessage;
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();
        setEditingPage({ ...editingPage, content: data.processedContent });
        toast.success('Content processed successfully!');
        setCustomPrompt('');
        setShowCustomPrompt(false);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
    } catch (error: any) {
      let userMessage = `AI Processing Error: ${error?.message || 'Unknown error'}`;
      if (error?.name === 'AbortError') {
        userMessage = 'Request timed out (>150s). Try with shorter content.';
      } else if (error?.message?.includes('Failed to fetch')) {
        userMessage = 'Connection error. Server may be offline.';
      }
      toast.error(userMessage);
    } finally {
      setProcessingAI(false);
    }
  };

  const handleAnalyzeImage = async () => {
    if (!uploadedImageUrl) {
      toast.error('Please provide an image URL first');
      return;
    }

    try {
      setAnalyzingImage(true);
      toast.info('AI is analyzing the image...');

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9a1ba23f/cms/ai-analyze-image`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            imageUrl: uploadedImageUrl,
            customPrompt: imageAnalysisPrompt.trim() || undefined 
          }),
        }
      );

      if (!response.ok) {
        let errorMessage = 'Failed to analyze image';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = await response.text() || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const imageHTML = `<img src="${uploadedImageUrl}" alt="Image" class="w-full max-w-2xl mb-6" />`;
      const newContent = (editingPage?.content || '') + '\n\n' + imageHTML + '\n\n' + data.generatedContent;
      
      if (editingPage) {
        setEditingPage({ ...editingPage, content: newContent });
      }
      toast.success('Image analyzed and content generated!');
      setUploadedImageUrl('');
      setImageAnalysisPrompt('');
      setShowImageUpload(false);
    } catch (error: any) {
      toast.error(`Image Analysis Error: ${error.message}`);
    } finally {
      setAnalyzingImage(false);
    }
  };

  // Get pages that are not in any navigation section (orphaned KV pages)
  const getOrphanedPages = (): PageWithNav[] => {
    const navSlugs = new Set(navigation.flatMap(s => s.items.map(i => i.slug)));
    return allPages.filter(p => !navSlugs.has(p.slug) && !p.isVirtual);
  };

  const handleDeleteAllOrphaned = async () => {
    const orphaned = getOrphanedPages();
    if (orphaned.length === 0) return;
    if (!confirm(`Delete all ${orphaned.length} unassigned pages? This cannot be undone.`)) return;

    let deleted = 0;
    let failed = 0;
    for (const page of orphaned) {
      try {
        await deletePage(page.slug);
        deleted++;
      } catch (err) {
        console.error(`Failed to delete orphaned page ${page.slug}:`, err);
        failed++;
      }
    }

    // Remove from local state
    const orphanedSlugs = new Set(orphaned.map(p => p.slug));
    setAllPages(prev => prev.filter(p => !orphanedSlugs.has(p.slug)));

    if (failed > 0) {
      toast.warning(`Deleted ${deleted} pages, ${failed} failed.`);
    } else {
      toast.success(`Deleted ${deleted} unassigned pages.`);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 border-4 border-[#013fac] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Loading navigation and pages...</p>
      </div>
    );
  }

  const orphanedPages = getOrphanedPages();

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-4">
        {/* Header */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Navigation & Page Manager</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Drag and drop to reorganize sections and pages. Purple "Component" pages use custom React code.
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button onClick={handleAddSection} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Add </span>Section
                </Button>
                <Button onClick={saveNavigation} disabled={saving} size="sm" className="bg-[#013fac] hover:bg-[#0149c9]">
                  <Save className="w-4 h-4 mr-1 sm:mr-2" />
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation Sections */}
        <div className="space-y-4">
          {navigation.map((section, index) => (
            <DraggableSection
              key={`${section.title}-${index}`}
              section={section}
              sectionIndex={index}
              pages={getPagesForSection(index)}
              moveSection={moveSection}
              moveItem={moveItem}
              onEditSection={handleEditSection}
              onDeleteSection={handleDeleteSection}
              onEditPage={handleEditPage}
              onDeletePage={handleDeletePage}
              onAddPage={handleAddPage}
              expandedSections={expandedSections}
              toggleSection={toggleSection}
            />
          ))}

          {navigation.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500 mb-4">No navigation sections yet.</p>
                <Button onClick={handleAddSection}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Section
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Orphaned Pages (in KV but not in navigation) */}
        {orphanedPages.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-600" />
                Unassigned Pages ({orphanedPages.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-3">
                These pages exist in the database but aren't assigned to any navigation section.
              </p>
              <div className="space-y-2">
                {orphanedPages.map(page => (
                  <div key={page.slug} className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{page.title}</p>
                      <p className="text-xs text-gray-500">/{page.slug}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditPage(page)}
                        className="h-7 text-xs"
                      >
                        <Edit2 className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeletePage(page.slug)}
                        className="h-7 text-xs text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeleteAllOrphaned}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Delete All
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Page Modal */}
      <Dialog open={editingPage !== null} onOpenChange={() => setEditingPage(null)}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Page: {editingPage?.title}</DialogTitle>
            <DialogDescription>
              Update page content, metadata, and publishing status.
            </DialogDescription>
          </DialogHeader>
          {editingPage && (
            <div className="space-y-4 mt-2">
              {/* Component page info banner */}
              {editingComponentPage && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <p className="text-sm text-purple-800 font-medium">
                    <Box className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                    Component Page Override
                  </p>
                  <p className="text-xs text-purple-600 mt-1">
                    This page has a default React component (<code className="bg-purple-100 px-1 rounded">{editingPage.custom_component}</code>). 
                    Enter HTML below to override the default view. Leave empty and click "Reset to Default" to use the built-in component.
                  </p>
                  {loadingComponentContent && (
                    <p className="text-xs text-purple-500 mt-1 italic">Loading existing content...</p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={editingPage.title}
                    onChange={(e) => setEditingPage({ ...editingPage, title: e.target.value })}
                    placeholder="Page title"
                    className="mt-1.5"
                  />
                </div>
              
                <div>
                  <Label>Slug (URL path)</Label>
                  <Input
                    value={editingPage.slug}
                    disabled
                    className="bg-gray-100 dark:bg-gray-900 mt-1.5"
                  />
                  <p className="text-xs text-gray-500 mt-1">Slug cannot be changed after creation</p>
                </div>
              </div>

              <div>
                <Label>Meta Description</Label>
                <Input
                  value={editingPage.meta_description || ''}
                  onChange={(e) => setEditingPage({ ...editingPage, meta_description: e.target.value })}
                  placeholder="Brief description for SEO"
                  className="mt-1.5"
                />
              </div>

              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <Label>Content (HTML)</Label>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      onClick={() => setShowCustomPrompt(!showCustomPrompt)}
                      size="sm"
                      variant="outline"
                      className="text-xs h-7"
                    >
                      {showCustomPrompt ? 'Hide' : 'Show'} Prompt
                    </Button>
                    <Button
                      onClick={handleAIProcess}
                      disabled={processingAI}
                      size="sm"
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 h-7 text-xs"
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      {processingAI ? 'Processing...' : 'AI Format'}
                    </Button>
                  </div>
                </div>
                
                {showCustomPrompt && (
                  <div className="mb-3">
                    <Input
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder="e.g., 'Make this more professional' or 'Format as bullet points'"
                      className="text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Custom instructions for the AI (optional)
                    </p>
                  </div>
                )}
                
                <ContentEditor
                  value={editingPage.content}
                  onChange={(content) => setEditingPage({ ...editingPage, content })}
                />
              </div>

              {/* Image Upload & AI Analysis */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm">Add Image with AI Analysis</Label>
                  <Button
                    onClick={() => setShowImageUpload(!showImageUpload)}
                    size="sm"
                    variant="outline"
                    className="text-xs h-7"
                  >
                    <ImageIcon className="w-3 h-3 mr-1" />
                    {showImageUpload ? 'Hide' : 'Show'}
                  </Button>
                </div>

                {showImageUpload && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 space-y-3">
                    <div>
                      <Label className="text-sm">Image URL</Label>
                      <Input
                        value={uploadedImageUrl}
                        onChange={(e) => setUploadedImageUrl(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="text-sm mt-1"
                      />
                    </div>

                    <div>
                      <Label className="text-sm">AI Instructions (Optional)</Label>
                      <Input
                        value={imageAnalysisPrompt}
                        onChange={(e) => setImageAnalysisPrompt(e.target.value)}
                        placeholder="e.g., 'Describe this lacrosse game'"
                        className="text-sm mt-1"
                      />
                    </div>

                    {uploadedImageUrl && (
                      <div className="border border-green-300 dark:border-green-600 rounded-lg p-2 bg-white dark:bg-gray-800">
                        <img 
                          src={uploadedImageUrl} 
                          alt="Preview" 
                          className="w-full max-w-sm border border-gray-300 rounded" 
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}

                    <Button
                      onClick={handleAnalyzeImage}
                      disabled={analyzingImage || !uploadedImageUrl}
                      className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
                      size="sm"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      {analyzingImage ? 'Analyzing...' : 'Analyze Image & Add to Page'}
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_published"
                  checked={editingPage.is_published}
                  onChange={(e) => setEditingPage({ ...editingPage, is_published: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="is_published" className="cursor-pointer">
                  Published (visible to public)
                </Label>
              </div>

              {editingComponentPage && (
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetToDefault}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Reset to Default
                  </Button>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setEditingPage(null)}>
                  Cancel
                </Button>
                <Button onClick={handleSavePage} className="bg-[#013fac] hover:bg-[#0149c9]">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Section Modal */}
      <Dialog open={editingSectionIndex !== null} onOpenChange={() => setEditingSectionIndex(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Section</DialogTitle>
            <DialogDescription>
              Update the section title and icon for the navigation menu.
            </DialogDescription>
          </DialogHeader>
          {editingSection && (
            <div className="space-y-4">
              <div>
                <Label>Section Title</Label>
                <Input
                  value={editingSection.title}
                  onChange={(e) => setEditingSection({ ...editingSection, title: e.target.value })}
                  placeholder="Section title"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Icon</Label>
                <select
                  value={editingSection.icon}
                  onChange={(e) => setEditingSection({ ...editingSection, icon: e.target.value })}
                  className="w-full mt-1.5 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                >
                  {ICON_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingSectionIndex(null)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveSection}>Save Changes</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Section Modal */}
      <Dialog open={addingSectionModal} onOpenChange={setAddingSectionModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Section</DialogTitle>
            <DialogDescription>
              Create a new navigation section with a custom title and icon.
            </DialogDescription>
          </DialogHeader>
          {editingSection && (
            <div className="space-y-4">
              <div>
                <Label>Section Title</Label>
                <Input
                  value={editingSection.title}
                  onChange={(e) => setEditingSection({ ...editingSection, title: e.target.value })}
                  placeholder="Section title"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Icon</Label>
                <select
                  value={editingSection.icon}
                  onChange={(e) => setEditingSection({ ...editingSection, icon: e.target.value })}
                  className="w-full mt-1.5 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                >
                  {ICON_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setAddingSectionModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveNewSection}>Add Section</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Page to Section Modal */}
      <Dialog open={addingPageModal} onOpenChange={setAddingPageModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Page to Section</DialogTitle>
            <DialogDescription>
              Select a page to add to this navigation section.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            <div className="space-y-2">
              {allPages
                .filter(page => {
                  // Only show pages not already in any section
                  return !navigation.some(section => 
                    section.items.some(item => item.slug === page.slug)
                  );
                })
                .map((page) => (
                  <button
                    key={page.slug}
                    onClick={() => handleAddPageToSection(page)}
                    className="w-full text-left p-3 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{page.title}</span>
                      {(page.isVirtual || page.custom_component) && (
                        <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-600">Component</Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">/{page.slug}</div>
                  </button>
                ))}
              {allPages.filter(page => 
                !navigation.some(section => section.items.some(item => item.slug === page.slug))
              ).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  All pages are already in navigation sections
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DndProvider>
  );
}