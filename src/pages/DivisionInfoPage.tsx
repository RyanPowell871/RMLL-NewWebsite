import React, { useState, useEffect, useRef } from 'react';
import { Header } from '../components/Header';
import { ChevronRight, ChevronDown, Info, Calendar, Users, Award, Trophy, FileText, ArrowRightLeft, Loader2 } from 'lucide-react';
import { allPossibleDivisions } from '../contexts/DivisionContext';
import { useDivision } from '../contexts/DivisionContext';
import { useNavigation } from '../contexts/NavigationContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card } from '../components/ui/card';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { SeasonInfoDisplay } from '../components/SeasonInfoDisplay';
import { AwardsDisplay } from '../components/AwardsDisplay';
import { Tier2AwardsDisplay } from '../components/Tier2AwardsDisplay';
import { ChampionshipsDisplay } from '../components/ChampionshipsDisplay';
import { Tier2ChampionshipsDisplay } from '../components/Tier2ChampionshipsDisplay';
import { TransactionsDisplay } from '../components/TransactionsDisplay';
import { ProtectedListDisplay } from '../components/ProtectedListDisplay';
import { DraftsDisplay } from '../components/DraftsDisplay';
import { PointLeaderAwards } from '../components/league-info/PointLeaderAwards';
import { JrBTier1DivisionAwards } from '../components/league-info/JrBTier1DivisionAwards';

interface SectionConfig {
  id: string;
  title: string;
  heading?: string;
  collapsible: boolean;
  collapsed?: boolean;
  order: number;
  isCustom?: boolean;
  colSpan?: 1 | 2;
}

interface DivisionData {
  lastActiveSeason?: string;
  divisionDescription?: string;
  divisionInfo?: {
    teams: string;
    playerAges: string;
    graduatingDraft: string;
    playingRights: string;
    minGames: string;
    outOfProvince: string;
    outOfCountry: string;
    otherJurisdiction: string;
    regularSeasonStandings: string;
    tryouts: string;
    northGraduatingDraft: string;
    centralGraduatingDraft: string;
    southGraduatingDraft: string;
    protectedList: string;
    draftedProtectedPlayers: string;
    freeAgent: string;
    firstYearRegistration: string;
    // Alberta Major Female specific fields
    instagram: string;
    draftInfo: string;
    protectedListInfo: string;
    calgaryFreeAgents: string;
    stAlbertDrillers: string;
    sherwoodParkTitans: string;
    capitalRegionSaints: string;
    redDeerRiot: string;
    freeAgents: string;
    freeAgentsAMF: string;
    returningPlayers: string;
    // Custom sections - dynamic keys
    [key: string]: string | undefined;
  };
  seasonInfo?: string;
  drafts?: string;
  protectedList?: string;
  transactions?: string;
  awards?: string;
  championships?: string;
  sectionConfigs?: string; // JSON string of section configs
  subdivisions?: Record<string, DivisionData>;
}

export function DivisionInfoPage() {
  const { selectedDivision: favoriteDivision, selectedSubDivision: favoriteSubDivision } = useDivision();
  const { navigationParams } = useNavigation();
  
  // Divisions that are inactive / have no active SportzSoft data for drafts,
  // protected lists, or transactions.  Hide those tabs to avoid showing
  // cross-contaminated data from other divisions.
  const INACTIVE_DIVISIONS = ['Junior B Tier III'];
  const HIDDEN_TABS_FOR_INACTIVE = ['drafts', 'protected-list', 'transactions'];
  
  const initialDivision = navigationParams?.divisionName || (favoriteDivision !== 'All Divisions' ? favoriteDivision : 'Senior B');
  const [selectedDivision, setSelectedDivision] = useState(initialDivision);
  const [activeTab, setActiveTab] = useState('division-info');
  const [activeSubdivision, setActiveSubdivision] = useState<string | null>(null);
  const [divisionData, setDivisionData] = useState<DivisionData>({});
  const [sectionConfigs, setSectionConfigs] = useState<SectionConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  // Default section configurations for different divisions
  const getDefaultSectionConfigs = (divisionName: string): SectionConfig[] => {
    const common: SectionConfig[] = [
      { id: 'teams', title: 'Teams', collapsible: true, collapsed: false, order: 0, colSpan: 1 },
      { id: 'playerAges', title: 'Player Ages', collapsible: true, collapsed: false, order: 1, colSpan: 1 },
      { id: 'graduatingDraft', title: 'Graduating Junior Entry Draft', collapsible: true, collapsed: false, order: 2, colSpan: 1 },
      { id: 'playingRights', title: 'Playing Rights', collapsible: true, collapsed: false, order: 3, colSpan: 2 },
      { id: 'minGames', title: 'Minimum Games for Playoff Eligibility', collapsible: true, collapsed: false, order: 4, colSpan: 1 },
      { id: 'outOfProvince', title: 'Out of Province Players', collapsible: true, collapsed: false, order: 5, colSpan: 1 },
      { id: 'outOfCountry', title: 'Out of Country Players', collapsible: true, collapsed: false, order: 6, colSpan: 1 },
    ];

    if (['Senior B', 'Senior C', 'Junior A', 'Junior B Tier I', 'Junior B Tier II', 'Junior B Tier III'].includes(divisionName)) {
      return [
        ...common,
        { id: 'tryouts', title: 'Tryouts', collapsible: true, collapsed: false, order: 7, colSpan: 2 },
      ];
    }

    if (['Senior B', 'Senior C', 'Junior A', 'Junior B Tier I', 'Junior B Tier II'].includes(divisionName)) {
      return [
        ...common,
        { id: 'tryouts', title: 'Tryouts', collapsible: true, collapsed: false, order: 7, colSpan: 2 },
        { id: 'regularSeasonStandings', title: 'Regular Season Standings', collapsible: true, collapsed: false, order: 8, colSpan: 2 },
      ];
    }

    if (['Senior B', 'Senior C', 'Junior B Tier I', 'Junior B Tier II', 'Junior B Tier III'].includes(divisionName)) {
      return [
        ...common,
        { id: 'tryouts', title: 'Tryouts', collapsible: true, collapsed: false, order: 7, colSpan: 2 },
        { id: 'otherJurisdiction', title: 'Other Jurisdiction Players', collapsible: true, collapsed: false, order: 8, colSpan: 1 },
        { id: 'protectedList', title: 'Protected List', collapsible: true, collapsed: false, order: 9, colSpan: 2 },
        { id: 'draftedProtectedPlayers', title: 'Drafted Protected Players', collapsible: true, collapsed: false, order: 10, colSpan: 2 },
        { id: 'freeAgent', title: 'Free Agent', collapsible: true, collapsed: false, order: 11, colSpan: 1 },
        { id: 'firstYearRegistration', title: 'First Year Registration', collapsible: true, collapsed: false, order: 12, colSpan: 1 },
      ];
    }

    if (divisionName === 'Junior B Tier I') {
      return [
        ...common,
        { id: 'tryouts', title: 'Tryouts', collapsible: true, collapsed: false, order: 7, colSpan: 2 },
        { id: 'otherJurisdiction', title: 'Other Jurisdiction Players', collapsible: true, collapsed: false, order: 8, colSpan: 1 },
        { id: 'regularSeasonStandings', title: 'Regular Season Standings', collapsible: true, collapsed: false, order: 9, colSpan: 2 },
        { id: 'northGraduatingDraft', title: 'North Graduating Draft', collapsible: true, collapsed: false, order: 10, colSpan: 2 },
        { id: 'centralGraduatingDraft', title: 'Central Graduating Draft', collapsible: true, collapsed: false, order: 11, colSpan: 2 },
        { id: 'southGraduatingDraft', title: 'South Graduating Draft', collapsible: true, collapsed: false, order: 12, colSpan: 2 },
        { id: 'protectedList', title: 'Protected List', collapsible: true, collapsed: false, order: 13, colSpan: 2 },
        { id: 'draftedProtectedPlayers', title: 'Drafted Protected Players', collapsible: true, collapsed: false, order: 14, colSpan: 2 },
        { id: 'freeAgent', title: 'Free Agent', collapsible: true, collapsed: false, order: 15, colSpan: 1 },
        { id: 'firstYearRegistration', title: 'First Year Registration', collapsible: true, collapsed: false, order: 16, colSpan: 1 },
      ];
    }

    if (divisionName === 'Alberta Major Female') {
      return [
        ...common,
        { id: 'instagram', title: 'Instagram', collapsible: true, collapsed: false, order: 7, colSpan: 1 },
        { id: 'draftInfo', title: 'Draft Info', collapsible: true, collapsed: false, order: 8, colSpan: 2 },
        { id: 'protectedListInfo', title: 'Protected List Info', collapsible: true, collapsed: false, order: 9, colSpan: 2 },
        { id: 'calgaryFreeAgents', title: 'Calgary Free Agents', collapsible: true, collapsed: false, order: 10, colSpan: 1 },
        { id: 'stAlbertDrillers', title: 'St. Albert Drillers', collapsible: true, collapsed: false, order: 11, colSpan: 1 },
        { id: 'sherwoodParkTitans', title: 'Sherwood Park Titans', collapsible: true, collapsed: false, order: 12, colSpan: 1 },
        { id: 'capitalRegionSaints', title: 'Capital Region Saints', collapsible: true, collapsed: false, order: 13, colSpan: 1 },
        { id: 'redDeerRiot', title: 'Red Deer Riot', collapsible: true, collapsed: false, order: 14, colSpan: 1 },
        { id: 'freeAgentsAMF', title: 'Free Agents', collapsible: true, collapsed: false, order: 15, colSpan: 1 },
        { id: 'returningPlayers', title: 'Returning Players', collapsible: true, collapsed: false, order: 16, colSpan: 1 },
      ];
    }

    if (divisionName === 'Alberta Major Senior Female') {
      return [
        ...common,
        { id: 'instagram', title: 'Instagram', collapsible: true, collapsed: false, order: 7, colSpan: 1 },
      ];
    }

    return common;
  };

  // Helper to get section icon and color
  const getSectionProps = (sectionId: string) => {
    const props: Record<string, { icon: any; color: string; label?: string }> = {
      tryouts: { icon: Info, color: '#013fac' },
      teams: { icon: Users, color: '#013fac' },
      playerAges: { icon: Info, color: '#DC2626' },
      graduatingDraft: { icon: Users, color: '#013fac' },
      playingRights: { icon: FileText, color: '#DC2626' },
      minGames: { icon: Calendar, color: '#013fac' },
      outOfProvince: { icon: Calendar, color: '#DC2626' },
      outOfCountry: { icon: Calendar, color: '#013fac' },
      otherJurisdiction: { icon: Calendar, color: '#DC2626' },
      regularSeasonStandings: { icon: Trophy, color: '#013fac' },
      northGraduatingDraft: { icon: Users, color: '#013fac', label: 'North Graduating U17 Player Draft' },
      centralGraduatingDraft: { icon: Users, color: '#DC2626', label: 'Red Deer Rampage and Innisfail Mavericks Graduating U17 Draft' },
      southGraduatingDraft: { icon: Users, color: '#013fac', label: 'South Graduating U17 Draft' },
      protectedList: { icon: FileText, color: '#DC2626', label: '35 Player Protected List' },
      draftedProtectedPlayers: { icon: Users, color: '#013fac', label: 'Drafted/Protected Players' },
      freeAgent: { icon: Users, color: '#DC2626' },
      firstYearRegistration: { icon: Calendar, color: '#013fac' },
      instagram: { icon: Info, color: '#E1306C' },
      draftInfo: { icon: Users, color: '#013fac' },
      protectedListInfo: { icon: FileText, color: '#DC2626' },
      calgaryFreeAgents: { icon: Users, color: '#013fac' },
      stAlbertDrillers: { icon: Info, color: '#DC2626' },
      sherwoodParkTitans: { icon: Info, color: '#013fac' },
      capitalRegionSaints: { icon: Info, color: '#DC2626' },
      redDeerRiot: { icon: Info, color: '#013fac' },
      freeAgentsAMF: { icon: Users, color: '#DC2626' },
      returningPlayers: { icon: Users, color: '#013fac' },
    };
    return props[sectionId] || { icon: Info, color: '#013fac' };
  };

  // Helper to get section value
  const getSectionValue = (sectionId: string): string | undefined => {
    if (divisionData.subdivisions && activeSubdivision) {
      return divisionData.subdivisions[activeSubdivision]?.divisionInfo?.[sectionId as keyof typeof divisionData.divisionInfo] as string;
    }
    return divisionData.divisionInfo?.[sectionId as keyof typeof divisionData.divisionInfo] as string;
  };

  // Helper to get section display title
  const getSectionTitle = (config: SectionConfig): string => {
    const props = getSectionProps(config.id);
    return props.label || config.heading || config.title;
  };

  const isSectionCollapsed = (sectionId: string): boolean => {
    const config = sectionConfigs.find(c => c.id === sectionId);
    if (!config || !config.collapsible) return false;
    return config.collapsed ?? false;
  };

  const toggleSectionCollapse = (sectionId: string) => {
    const config = sectionConfigs.find(c => c.id === sectionId);
    if (!config || !config.collapsible) return;
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const isInactiveDivision = INACTIVE_DIVISIONS.includes(selectedDivision);

  // Update local division when favorite changes, but only for non-"All Divisions" selections
  const prevFavoriteRef = useRef(favoriteDivision);
  useEffect(() => {
    const prev = prevFavoriteRef.current;
    prevFavoriteRef.current = favoriteDivision;
    if (favoriteDivision === prev) return; // Skip if unchanged (e.g. on mount)
    if (favoriteDivision !== 'All Divisions') {
      setSelectedDivision(favoriteDivision);
    }
  }, [favoriteDivision]);

  // Update local division when navigationParams change (e.g., from cross-route navigation)
  useEffect(() => {
    if (navigationParams?.divisionName) {
      setSelectedDivision(navigationParams.divisionName);
    }
  }, [navigationParams?.divisionName]);

  // Reset active tab if the current tab is hidden for the selected division
  useEffect(() => {
    if (isInactiveDivision && HIDDEN_TABS_FOR_INACTIVE.includes(activeTab)) {
      setActiveTab('division-info');
    }
  }, [selectedDivision, isInactiveDivision, activeTab]);

  // Fetch division data from backend
  useEffect(() => {
    let isCancelled = false;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-9a1ba23f/division/${encodeURIComponent(selectedDivision)}`,
          {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
            },
          }
        );
        
        if (response.ok) {
          const data = await response.json();

          
          // Only update state if this request hasn't been cancelled
          if (!isCancelled) {
            setDivisionData(data);

            // Parse section configs
            if (data.sectionConfigs) {
              try {
                const parsedConfigs = JSON.parse(data.sectionConfigs) as SectionConfig[];
                // Merge with defaults, preserving custom sections
                const defaultConfigs = getDefaultSectionConfigs(selectedDivision);
                const mergedConfigs: SectionConfig[] = [];

                // Add default sections with saved config
                defaultConfigs.forEach(defaultConfig => {
                  const savedConfig = parsedConfigs.find(c => c.id === defaultConfig.id);
                  mergedConfigs.push(savedConfig ? { ...defaultConfig, ...savedConfig } : defaultConfig);
                });

                // Add custom sections
                parsedConfigs.filter(c => c.isCustom && !defaultConfigs.find(d => d.id === c.id))
                  .forEach(customConfig => {
                    mergedConfigs.push(customConfig);
                  });

                // Sort by order
                mergedConfigs.sort((a, b) => a.order - b.order);

                setSectionConfigs(mergedConfigs);
              } catch (e) {
                console.error('Error parsing section configs:', e);
                setSectionConfigs(getDefaultSectionConfigs(selectedDivision));
              }
            } else {
              setSectionConfigs(getDefaultSectionConfigs(selectedDivision));
            }

            // If there are subdivisions, set the first one as active
            if (data.subdivisions) {
              const subdivisionKeys = Object.keys(data.subdivisions);
              if (subdivisionKeys.length > 0) {
                setActiveSubdivision(subdivisionKeys[0]);
              }
            } else {
              setActiveSubdivision(null);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching division data:', error);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();
    
    // Cleanup function to prevent state updates if component unmounts or division changes
    return () => {
      isCancelled = true;
    };
  }, [selectedDivision]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main>
        {/* Page Header */}
        <section className="bg-gradient-to-r from-[#0F2942] to-[#1a3a5c] text-white py-8 sm:py-12">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
            <div className="flex items-center gap-2 text-sm mb-3 text-gray-300">
              <span>Home</span>
              <ChevronRight className="w-4 h-4" />
              <span className="text-white">Division Info</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl mb-2">Division Information</h1>
            <p className="text-base text-gray-300 max-w-3xl">
              Rules, eligibility, drafts, and important details for each division
            </p>
          </div>
        </section>

        {/* Division Info Content */}
        <section className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 sm:py-8 lg:py-12">
          {/* Division Filters */}
          <div className="mb-6 sm:mb-8 space-y-4">
            {/* Mobile Dropdown */}
            <div className="block md:hidden">
              <Select value={selectedDivision} onValueChange={setSelectedDivision}>
                <SelectTrigger className="w-full font-bold">
                  <SelectValue placeholder="Select Division" />
                </SelectTrigger>
                <SelectContent>
                  {allPossibleDivisions.filter(d => d !== 'All Divisions').map((division) => (
                    <SelectItem key={division} value={division} className="font-bold">
                      {division}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Desktop Filter Bar */}
            <div className="hidden md:block overflow-x-auto scrollbar-hide">
              <div className="flex gap-1.5 sm:gap-2 pb-2 min-w-max">
                {allPossibleDivisions.filter(d => d !== 'All Divisions').map((division) => (
                  <button
                    key={division}
                    onClick={() => setSelectedDivision(division)}
                    className={`px-2.5 sm:px-3 lg:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold tracking-wide whitespace-nowrap rounded transition-all duration-200 ${
                      selectedDivision === division
                        ? 'text-white shadow-md'
                        : 'bg-white text-gray-700 hover:bg-[#013fac]/5 border-2 border-[#013fac]/20 hover:border-[#013fac]'
                    }`}
                    style={selectedDivision === division ? { background: 'linear-gradient(to bottom, var(--color-primary), var(--color-primary-dark))' } : {}}
                  >
                    {division}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto mb-6 bg-white border-b border-gray-200 rounded-none h-auto p-0 flex-wrap sm:flex-nowrap">
              <TabsTrigger 
                value="division-info" 
                className="flex items-center gap-2 px-4 py-3 data-[state=active]:border-b-2 data-[state=active]:border-[#013fac] data-[state=active]:text-[#013fac] rounded-none"
              >
                <Info className="w-4 h-4" />
                <span className="font-bold text-xs sm:text-sm">Division Info</span>
              </TabsTrigger>
              <TabsTrigger 
                value="season-info" 
                className="flex items-center gap-2 px-4 py-3 data-[state=active]:border-b-2 data-[state=active]:border-[#013fac] data-[state=active]:text-[#013fac] rounded-none"
              >
                <Calendar className="w-4 h-4" />
                <span className="font-bold text-xs sm:text-sm">Season Info</span>
              </TabsTrigger>
              {!isInactiveDivision && (
                <TabsTrigger 
                  value="drafts" 
                  className="flex items-center gap-2 px-4 py-3 data-[state=active]:border-b-2 data-[state=active]:border-[#013fac] data-[state=active]:text-[#013fac] rounded-none"
                >
                  <Users className="w-4 h-4" />
                  <span className="font-bold text-xs sm:text-sm">Drafts</span>
                </TabsTrigger>
              )}
              {!isInactiveDivision && (
                <TabsTrigger 
                  value="protected-list" 
                  className="flex items-center gap-2 px-4 py-3 data-[state=active]:border-b-2 data-[state=active]:border-[#013fac] data-[state=active]:text-[#013fac] rounded-none"
                >
                  <FileText className="w-4 h-4" />
                  <span className="font-bold text-xs sm:text-sm">Protected List</span>
                </TabsTrigger>
              )}
              {!isInactiveDivision && (
                <TabsTrigger 
                  value="transactions" 
                  className="flex items-center gap-2 px-4 py-3 data-[state=active]:border-b-2 data-[state=active]:border-[#013fac] data-[state=active]:text-[#013fac] rounded-none"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span className="font-bold text-xs sm:text-sm">Transactions</span>
                </TabsTrigger>
              )}
              <TabsTrigger 
                value="awards" 
                className="flex items-center gap-2 px-4 py-3 data-[state=active]:border-b-2 data-[state=active]:border-[#013fac] data-[state=active]:text-[#013fac] rounded-none"
              >
                <Award className="w-4 h-4" />
                <span className="font-bold text-xs sm:text-sm">Awards</span>
              </TabsTrigger>
              <TabsTrigger 
                value="championships" 
                className="flex items-center gap-2 px-4 py-3 data-[state=active]:border-b-2 data-[state=active]:border-[#013fac] data-[state=active]:text-[#013fac] rounded-none"
              >
                <Trophy className="w-4 h-4" />
                <span className="font-bold text-xs sm:text-sm">Championships</span>
              </TabsTrigger>
            </TabsList>

            {/* Division Info Tab */}
            <TabsContent value="division-info" className="mt-0">
              <div className="space-y-6">
                {/* Last Active Season Notice — shown at top for inactive divisions */}
                {divisionData.lastActiveSeason && (
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 p-5 rounded-lg shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-amber-500/20 rounded-lg">
                        <Info className="w-5 h-5 text-amber-700" />
                      </div>
                      <div>
                        <h4 className="font-bold text-base text-amber-900 mb-1" style={{ fontFamily: 'var(--font-secondary)' }}>
                          Division Status
                        </h4>
                        <p className="text-sm text-amber-800">
                          This division's last active season was <span className="font-bold">{divisionData.lastActiveSeason}</span>. 
                          The information below reflects the rules and structure from that season.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Header Card with Division Description */}
                <Card className="border border-gray-200 shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-[#0F2942] to-[#1a3a5c] text-white px-5 py-4">
                    <h2 className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: 'var(--font-secondary)' }}>{selectedDivision}</h2>
                    {!divisionData.divisionDescription && (
                      <p className="text-gray-300 text-sm mt-1">
                        Complete rules, regulations, and eligibility information for the {selectedDivision} division.
                      </p>
                    )}
                  </div>
                  {divisionData.divisionDescription && (
                    <div className="p-5 bg-gradient-to-br from-white to-gray-50">
                      <div className="max-w-none space-y-2.5">
                        {divisionData.divisionDescription.split('\n').map((paragraph, idx) => {
                          if (!paragraph.trim()) return null;
                          // Auto-link URLs in the text
                          const parts = paragraph.split(/(https?:\/\/[^\s]+)/g);
                          return (
                            <p key={idx} className="text-sm text-gray-700 leading-relaxed">
                              {parts.map((part, i) =>
                                part.match(/^https?:\/\//) ? (
                                  <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-[#013fac] hover:underline font-medium">
                                    {part}
                                  </a>
                                ) : (
                                  <span key={i}>{part}</span>
                                )
                              )}
                            </p>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </Card>

                {/* Subdivision Tabs (if subdivisions exist) */}
                {divisionData.subdivisions && activeSubdivision && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-4">
                      {Object.keys(divisionData.subdivisions).map((subdivisionKey) => (
                        <button
                          key={subdivisionKey}
                          onClick={() => setActiveSubdivision(subdivisionKey)}
                          className={`px-4 py-2 text-sm font-bold tracking-wide whitespace-nowrap rounded transition-all duration-200 ${
                            activeSubdivision === subdivisionKey
                              ? 'bg-gradient-to-b from-[#DC2626] to-[#8b1529] text-white shadow-md'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                          }`}
                        >
                          {subdivisionKey}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Info Grid - Dynamic sections based on config */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sectionConfigs
                    .sort((a, b) => a.order - b.order)
                    .map((config) => {
                      const sectionValue = getSectionValue(config.id);
                      const { icon: Icon, color } = getSectionProps(config.id);
                      const isCollapsed = isSectionCollapsed(config.id);

                      // Don't render if no value (except for custom sections)
                      if (!sectionValue && !config.isCustom) return null;

                      return (
                        <Card
                          key={config.id}
                          className={`border-l-4 shadow-sm hover:shadow-md transition-shadow ${config.colSpan === 2 ? 'md:col-span-2' : ''}`}
                          style={{ borderColor: color }}
                        >
                          {config.collapsible && (
                            <button
                              onClick={() => toggleSectionCollapse(config.id)}
                              className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}15` }}>
                                  <Icon className="w-5 h-5" style={{ color }} />
                                </div>
                                <h4 className="font-bold text-base text-gray-900" style={{ fontFamily: 'var(--font-secondary)' }}>
                                  {getSectionTitle(config)}
                                </h4>
                              </div>
                              {isCollapsed ? (
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-gray-400" />
                              )}
                            </button>
                          )}
                          {(!config.collapsible || !isCollapsed) && (
                            <div className={`p-5 ${config.collapsible ? 'pt-2' : ''}`}>
                              {!config.collapsible && (
                                <div className="flex items-start gap-3 mb-3">
                                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}15` }}>
                                    <Icon className="w-5 h-5" style={{ color }} />
                                  </div>
                                  <h4 className="font-bold text-base text-gray-900" style={{ fontFamily: 'var(--font-secondary)' }}>
                                    {getSectionTitle(config)}
                                  </h4>
                                </div>
                              )}
                              <p className={`text-sm text-gray-700 leading-relaxed whitespace-pre-line ${config.collapsible ? 'pl-14' : ''}`}>
                                {sectionValue || 'No content yet...'}
                              </p>
                            </div>
                          )}
                        </Card>
                      );
                    })}
                </div>
              </div>
            </TabsContent>

            {/* Season Info Tab */}
            <TabsContent value="season-info" className="mt-0">
              {divisionData.seasonInfo ? (
                <SeasonInfoDisplay data={divisionData.seasonInfo} />
              ) : (
                <Card className="border border-gray-200 shadow-sm">
                  <div className="p-6">
                    <p className="text-sm text-gray-600 italic">Season information content coming soon...</p>
                  </div>
                </Card>
              )}
            </TabsContent>

            {/* Drafts Tab */}
            <TabsContent value="drafts" className="mt-0">
              {INACTIVE_DIVISIONS.includes(selectedDivision) ? (
                <Card className="border border-gray-200 shadow-sm">
                  <div className="p-6">
                    <p className="text-sm text-gray-600 italic">Draft information content coming soon...</p>
                  </div>
                </Card>
              ) : (
                <DraftsDisplay divisionName={selectedDivision} />
              )}
            </TabsContent>

            {/* Protected List Tab */}
            <TabsContent value="protected-list" className="mt-0">
              {INACTIVE_DIVISIONS.includes(selectedDivision) ? (
                <Card className="border border-gray-200 shadow-sm">
                  <div className="p-6">
                    <p className="text-sm text-gray-600 italic">Protected list information content coming soon...</p>
                  </div>
                </Card>
              ) : (
                <ProtectedListDisplay divisionName={selectedDivision} />
              )}
            </TabsContent>

            {/* Transactions Tab */}
            <TabsContent value="transactions" className="mt-0">
              {INACTIVE_DIVISIONS.includes(selectedDivision) ? (
                <Card className="border border-gray-200 shadow-sm">
                  <div className="p-6">
                    <p className="text-sm text-gray-600 italic">Transaction information content coming soon...</p>
                  </div>
                </Card>
              ) : (
                <TransactionsDisplay divisionName={selectedDivision} />
              )}
            </TabsContent>

            {/* Awards Tab */}
            <TabsContent value="awards" className="mt-0">
              {selectedDivision === 'Junior B Tier I' ? (
                <div className="space-y-8">
                  <JrBTier1DivisionAwards />
                  <PointLeaderAwards />
                </div>
              ) : divisionData.awards ? (
                selectedDivision === 'Junior B Tier II' ? (
                  <Tier2AwardsDisplay data={divisionData.awards} />
                ) : (
                  <AwardsDisplay data={divisionData.awards} />
                )
              ) : (
                <Card className="border border-gray-200 shadow-sm">
                  <div className="p-6">
                    <p className="text-sm text-gray-600 italic">Awards content coming soon...</p>
                  </div>
                </Card>
              )}
            </TabsContent>

            {/* Championships Tab */}
            <TabsContent value="championships" className="mt-0">
              {divisionData.championships ? (
                selectedDivision === 'Junior B Tier II' ? (
                  <Tier2ChampionshipsDisplay data={divisionData.championships} />
                ) : (
                  <ChampionshipsDisplay data={divisionData.championships} />
                )
              ) : (
                <Card className="border border-gray-200 shadow-sm">
                  <div className="p-6">
                    <p className="text-sm text-gray-600 italic">Championship history coming soon...</p>
                  </div>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </section>
      </main>
    </div>
  );
}