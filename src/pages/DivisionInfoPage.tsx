import React, { useState, useEffect, useRef } from 'react';
import { Header } from '../components/Header';
import { ChevronRight, Info, Calendar, Users, Award, Trophy, FileText, ArrowRightLeft, Loader2 } from 'lucide-react';
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
    returningPlayers: string;
  };
  seasonInfo?: string;
  drafts?: string;
  protectedList?: string;
  transactions?: string;
  awards?: string;
  championships?: string;
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
  const [loading, setLoading] = useState(false);

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

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Tryouts */}
                  {(divisionData.subdivisions && activeSubdivision 
                    ? divisionData.subdivisions[activeSubdivision]?.divisionInfo?.tryouts 
                    : divisionData.divisionInfo?.tryouts) && (
                    <Card className="border-l-4 border-l-[#013fac] shadow-sm hover:shadow-md transition-shadow md:col-span-2">
                      <div className="p-5">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="p-2 bg-[#013fac]/10 rounded-lg">
                            <Info className="w-5 h-5 text-[#013fac]" />
                          </div>
                          <div>
                            <h4 className="font-bold text-base text-gray-900 mb-1" style={{ fontFamily: 'var(--font-secondary)' }}>
                              Tryouts
                            </h4>
                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                              {divisionData.subdivisions && activeSubdivision
                                ? divisionData.subdivisions[activeSubdivision].divisionInfo?.tryouts
                                : divisionData.divisionInfo?.tryouts}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Teams */}
                  <Card className="border-l-4 border-l-[#013fac] shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-5">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="p-2 bg-[#013fac]/10 rounded-lg">
                          <Users className="w-5 h-5 text-[#013fac]" />
                        </div>
                        <div>
                          <h4 className="font-bold text-base text-gray-900 mb-1" style={{ fontFamily: 'var(--font-secondary)' }}>
                            Teams
                          </h4>
                          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                            {divisionData.subdivisions && activeSubdivision
                              ? divisionData.subdivisions[activeSubdivision].divisionInfo?.teams || 'Select a specific division to view details'
                              : divisionData.divisionInfo?.teams || 'Select a specific division to view details'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Player Ages */}
                  <Card className="border-l-4 border-l-[#DC2626] shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-5">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="p-2 bg-[#DC2626]/10 rounded-lg">
                          <Info className="w-5 h-5 text-[#DC2626]" />
                        </div>
                        <div>
                          <h4 className="font-bold text-base text-gray-900 mb-1" style={{ fontFamily: 'var(--font-secondary)' }}>
                            Player Ages
                          </h4>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {divisionData.subdivisions && activeSubdivision
                              ? divisionData.subdivisions[activeSubdivision].divisionInfo?.playerAges || 'Select a specific division to view details'
                              : divisionData.divisionInfo?.playerAges || 'Select a specific division to view details'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Playing Rights - also support subdivisions */}
                  {((divisionData.subdivisions && activeSubdivision && divisionData.subdivisions[activeSubdivision]?.divisionInfo?.playingRights) ||
                    divisionData.divisionInfo?.playingRights) && (
                    <Card className="border-l-4 border-l-[#DC2626] shadow-sm hover:shadow-md transition-shadow md:col-span-2">
                      <div className="p-5">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="p-2 bg-[#DC2626]/10 rounded-lg">
                            <FileText className="w-5 h-5 text-[#DC2626]" />
                          </div>
                          <div>
                            <h4 className="font-bold text-base text-gray-900 mb-1" style={{ fontFamily: 'var(--font-secondary)' }}>
                              Playing Rights
                            </h4>
                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                              {divisionData.subdivisions && activeSubdivision
                                ? divisionData.subdivisions[activeSubdivision].divisionInfo?.playingRights
                                : divisionData.divisionInfo?.playingRights}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* North Graduating Draft (Junior B Tier I) */}
                  {divisionData.divisionInfo?.northGraduatingDraft && (
                    <Card className="border-l-4 border-l-[#013fac] shadow-sm hover:shadow-md transition-shadow md:col-span-2">
                      <div className="p-5">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="p-2 bg-[#013fac]/10 rounded-lg">
                            <Users className="w-5 h-5 text-[#013fac]" />
                          </div>
                          <div>
                            <h4 className="font-bold text-base text-gray-900 mb-1" style={{ fontFamily: 'var(--font-secondary)' }}>
                              North Graduating U17 Player Draft
                            </h4>
                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                              {divisionData.divisionInfo.northGraduatingDraft}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Central Graduating Draft (Junior B Tier I) */}
                  {divisionData.divisionInfo?.centralGraduatingDraft && (
                    <Card className="border-l-4 border-l-[#DC2626] shadow-sm hover:shadow-md transition-shadow md:col-span-2">
                      <div className="p-5">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="p-2 bg-[#DC2626]/10 rounded-lg">
                            <Users className="w-5 h-5 text-[#DC2626]" />
                          </div>
                          <div>
                            <h4 className="font-bold text-base text-gray-900 mb-1" style={{ fontFamily: 'var(--font-secondary)' }}>
                              Red Deer Rampage and Innisfail Mavericks Graduating U17 Draft
                            </h4>
                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                              {divisionData.divisionInfo.centralGraduatingDraft}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* South Graduating Draft (Junior B Tier I) */}
                  {divisionData.divisionInfo?.southGraduatingDraft && (
                    <Card className="border-l-4 border-l-[#013fac] shadow-sm hover:shadow-md transition-shadow md:col-span-2">
                      <div className="p-5">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="p-2 bg-[#013fac]/10 rounded-lg">
                            <Users className="w-5 h-5 text-[#013fac]" />
                          </div>
                          <div>
                            <h4 className="font-bold text-base text-gray-900 mb-1" style={{ fontFamily: 'var(--font-secondary)' }}>
                              South Graduating U17 Draft
                            </h4>
                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                              {divisionData.divisionInfo.southGraduatingDraft}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Protected List (Junior B Tier I specific or general) */}
                  {divisionData.divisionInfo?.protectedList && (
                    <Card className="border-l-4 border-l-[#DC2626] shadow-sm hover:shadow-md transition-shadow md:col-span-2">
                      <div className="p-5">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="p-2 bg-[#DC2626]/10 rounded-lg">
                            <FileText className="w-5 h-5 text-[#DC2626]" />
                          </div>
                          <div>
                            <h4 className="font-bold text-base text-gray-900 mb-1" style={{ fontFamily: 'var(--font-secondary)' }}>
                              35 Player Protected List
                            </h4>
                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                              {divisionData.divisionInfo.protectedList}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Drafted/Protected Players (Junior B Tier I) */}
                  {divisionData.divisionInfo?.draftedProtectedPlayers && (
                    <Card className="border-l-4 border-l-[#013fac] shadow-sm hover:shadow-md transition-shadow md:col-span-2">
                      <div className="p-5">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="p-2 bg-[#013fac]/10 rounded-lg">
                            <Users className="w-5 h-5 text-[#013fac]" />
                          </div>
                          <div>
                            <h4 className="font-bold text-base text-gray-900 mb-1" style={{ fontFamily: 'var(--font-secondary)' }}>
                              Drafted/Protected Players
                            </h4>
                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                              {divisionData.divisionInfo.draftedProtectedPlayers}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Free Agent (Junior B Tier I) */}
                  {divisionData.divisionInfo?.freeAgent && (
                    <Card className="border-l-4 border-l-[#DC2626] shadow-sm hover:shadow-md transition-shadow">
                      <div className="p-5">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="p-2 bg-[#DC2626]/10 rounded-lg">
                            <Users className="w-5 h-5 text-[#DC2626]" />
                          </div>
                          <div>
                            <h4 className="font-bold text-base text-gray-900 mb-1" style={{ fontFamily: 'var(--font-secondary)' }}>
                              Jr. B Tier I Free Agent
                            </h4>
                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                              {divisionData.divisionInfo.freeAgent}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* First Year Registration (Junior B Tier I) */}
                  {divisionData.divisionInfo?.firstYearRegistration && (
                    <Card className="border-l-4 border-l-[#013fac] shadow-sm hover:shadow-md transition-shadow">
                      <div className="p-5">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="p-2 bg-[#013fac]/10 rounded-lg">
                            <FileText className="w-5 h-5 text-[#013fac]" />
                          </div>
                          <div>
                            <h4 className="font-bold text-base text-gray-900 mb-1" style={{ fontFamily: 'var(--font-secondary)' }}>
                              First-Year Player Registration
                            </h4>
                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                              {divisionData.divisionInfo.firstYearRegistration}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Graduating Junior Entry Draft (for other divisions) */}
                  {divisionData.divisionInfo?.graduatingDraft && (
                    <Card className="border-l-4 border-l-[#013fac] shadow-sm hover:shadow-md transition-shadow">
                      <div className="p-5">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="p-2 bg-[#013fac]/10 rounded-lg">
                            <Users className="w-5 h-5 text-[#013fac]" />
                          </div>
                          <div>
                            <h4 className="font-bold text-base text-gray-900 mb-1" style={{ fontFamily: 'var(--font-secondary)' }}>
                              Graduating Junior Entry Draft
                            </h4>
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {divisionData.divisionInfo.graduatingDraft}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Minimum Games for Playoff Eligibility */}
                  {divisionData.divisionInfo?.minGames && (
                    <Card className="border-l-4 border-l-[#013fac] shadow-sm hover:shadow-md transition-shadow">
                      <div className="p-5">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="p-2 bg-[#013fac]/10 rounded-lg">
                            <Trophy className="w-5 h-5 text-[#013fac]" />
                          </div>
                          <div>
                            <h4 className="font-bold text-base text-gray-900 mb-1" style={{ fontFamily: 'var(--font-secondary)' }}>
                              Minimum Games for Playoff Eligibility
                            </h4>
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {divisionData.divisionInfo.minGames}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Out of Province Players */}
                  {divisionData.divisionInfo?.outOfProvince && (
                    <Card className="border-l-4 border-l-[#DC2626] shadow-sm hover:shadow-md transition-shadow">
                      <div className="p-5">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="p-2 bg-[#DC2626]/10 rounded-lg">
                            <FileText className="w-5 h-5 text-[#DC2626]" />
                          </div>
                          <div>
                            <h4 className="font-bold text-base text-gray-900 mb-1" style={{ fontFamily: 'var(--font-secondary)' }}>
                              Out of Province Players
                            </h4>
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {divisionData.divisionInfo.outOfProvince}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Out of Country Players */}
                  {divisionData.divisionInfo?.outOfCountry && (
                    <Card className="border-l-4 border-l-[#013fac] shadow-sm hover:shadow-md transition-shadow">
                      <div className="p-5">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="p-2 bg-[#013fac]/10 rounded-lg">
                            <FileText className="w-5 h-5 text-[#013fac]" />
                          </div>
                          <div>
                            <h4 className="font-bold text-base text-gray-900 mb-1" style={{ fontFamily: 'var(--font-secondary)' }}>
                              Out of Country Players
                            </h4>
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {divisionData.divisionInfo.outOfCountry}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Other Jurisdiction Players */}
                  {divisionData.divisionInfo?.otherJurisdiction && (
                    <Card className="border-l-4 border-l-[#DC2626] shadow-sm hover:shadow-md transition-shadow">
                      <div className="p-5">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="p-2 bg-[#DC2626]/10 rounded-lg">
                            <FileText className="w-5 h-5 text-[#DC2626]" />
                          </div>
                          <div>
                            <h4 className="font-bold text-base text-gray-900 mb-1" style={{ fontFamily: 'var(--font-secondary)' }}>
                              Other Jurisdiction Players
                            </h4>
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {divisionData.divisionInfo.otherJurisdiction}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Regular Season Standings */}
                  {divisionData.divisionInfo?.regularSeasonStandings && (
                    <Card className="border-l-4 border-l-[#013fac] shadow-sm hover:shadow-md transition-shadow">
                      <div className="p-5">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="p-2 bg-[#013fac]/10 rounded-lg">
                            <FileText className="w-5 h-5 text-[#013fac]" />
                          </div>
                          <div>
                            <h4 className="font-bold text-base text-gray-900 mb-1" style={{ fontFamily: 'var(--font-secondary)' }}>
                              Regular Season Standings
                            </h4>
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {divisionData.divisionInfo.regularSeasonStandings}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Instagram - Alberta Major Female */}
                  {divisionData.divisionInfo?.instagram && (
                    <Card className="border-l-4 border-l-[#DC2626] shadow-sm hover:shadow-md transition-shadow md:col-span-2">
                      <div className="p-5">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="p-2 bg-[#DC2626]/10 rounded-lg">
                            <Info className="w-5 h-5 text-[#DC2626]" />
                          </div>
                          <div>
                            <h4 className="font-bold text-base text-gray-900 mb-1" style={{ fontFamily: 'var(--font-secondary)' }}>
                              Division Instagram
                            </h4>
                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                              {divisionData.divisionInfo.instagram}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Draft Info - Alberta Major Female */}
                  {divisionData.divisionInfo?.draftInfo && (
                    <Card className="border-l-4 border-l-[#013fac] shadow-sm hover:shadow-md transition-shadow md:col-span-2">
                      <div className="p-5">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="p-2 bg-[#013fac]/10 rounded-lg">
                            <Users className="w-5 h-5 text-[#013fac]" />
                          </div>
                          <div>
                            <h4 className="font-bold text-base text-gray-900 mb-1" style={{ fontFamily: 'var(--font-secondary)' }}>
                              U17 Player Draft
                            </h4>
                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                              {divisionData.divisionInfo.draftInfo}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Protected List Info - Alberta Major Female */}
                  {divisionData.divisionInfo?.protectedListInfo && (
                    <Card className="border-l-4 border-l-[#DC2626] shadow-sm hover:shadow-md transition-shadow md:col-span-2">
                      <div className="p-5">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="p-2 bg-[#DC2626]/10 rounded-lg">
                            <FileText className="w-5 h-5 text-[#DC2626]" />
                          </div>
                          <div>
                            <h4 className="font-bold text-base text-gray-900 mb-1" style={{ fontFamily: 'var(--font-secondary)' }}>
                              35 Player Protected List
                            </h4>
                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                              {divisionData.divisionInfo.protectedListInfo}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Calgary Free Agents - Alberta Major Female */}
                  {divisionData.divisionInfo?.calgaryFreeAgents && (
                    <Card className="border-l-4 border-l-[#013fac] shadow-sm hover:shadow-md transition-shadow md:col-span-2">
                      <div className="p-5">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="p-2 bg-[#013fac]/10 rounded-lg">
                            <Users className="w-5 h-5 text-[#013fac]" />
                          </div>
                          <div>
                            <h4 className="font-bold text-base text-gray-900 mb-1" style={{ fontFamily: 'var(--font-secondary)' }}>
                              Calgary Area Free Agents
                            </h4>
                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                              {divisionData.divisionInfo.calgaryFreeAgents}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* St. Albert Drillers - Alberta Major Female */}
                  {divisionData.divisionInfo?.stAlbertDrillers && (
                    <Card className="border-l-4 border-l-[#DC2626] shadow-sm hover:shadow-md transition-shadow md:col-span-2">
                      <div className="p-5">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="p-2 bg-[#DC2626]/10 rounded-lg">
                            <FileText className="w-5 h-5 text-[#DC2626]" />
                          </div>
                          <div>
                            <h4 className="font-bold text-base text-gray-900 mb-1" style={{ fontFamily: 'var(--font-secondary)' }}>
                              St. Albert Drillers Playing Rights
                            </h4>
                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                              {divisionData.divisionInfo.stAlbertDrillers}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Sherwood Park Titans - Alberta Major Female */}
                  {divisionData.divisionInfo?.sherwoodParkTitans && (
                    <Card className="border-l-4 border-l-[#013fac] shadow-sm hover:shadow-md transition-shadow md:col-span-2">
                      <div className="p-5">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="p-2 bg-[#013fac]/10 rounded-lg">
                            <FileText className="w-5 h-5 text-[#013fac]" />
                          </div>
                          <div>
                            <h4 className="font-bold text-base text-gray-900 mb-1" style={{ fontFamily: 'var(--font-secondary)' }}>
                              Sherwood Park Titans Playing Rights
                            </h4>
                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                              {divisionData.divisionInfo.sherwoodParkTitans}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Capital Region Saints - Alberta Major Female */}
                  {divisionData.divisionInfo?.capitalRegionSaints && (
                    <Card className="border-l-4 border-l-[#DC2626] shadow-sm hover:shadow-md transition-shadow md:col-span-2">
                      <div className="p-5">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="p-2 bg-[#DC2626]/10 rounded-lg">
                            <FileText className="w-5 h-5 text-[#DC2626]" />
                          </div>
                          <div>
                            <h4 className="font-bold text-base text-gray-900 mb-1" style={{ fontFamily: 'var(--font-secondary)' }}>
                              Capital Region Saints Playing Rights
                            </h4>
                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                              {divisionData.divisionInfo.capitalRegionSaints}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Red Deer Riot - Alberta Major Female */}
                  {divisionData.divisionInfo?.redDeerRiot && (
                    <Card className="border-l-4 border-l-[#013fac] shadow-sm hover:shadow-md transition-shadow md:col-span-2">
                      <div className="p-5">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="p-2 bg-[#013fac]/10 rounded-lg">
                            <FileText className="w-5 h-5 text-[#013fac]" />
                          </div>
                          <div>
                            <h4 className="font-bold text-base text-gray-900 mb-1" style={{ fontFamily: 'var(--font-secondary)' }}>
                              Red Deer Riot Playing Rights
                            </h4>
                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                              {divisionData.divisionInfo.redDeerRiot}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Free Agents - Alberta Major Female */}
                  {divisionData.divisionInfo?.freeAgents && (
                    <Card className="border-l-4 border-l-[#DC2626] shadow-sm hover:shadow-md transition-shadow md:col-span-2">
                      <div className="p-5">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="p-2 bg-[#DC2626]/10 rounded-lg">
                            <Users className="w-5 h-5 text-[#DC2626]" />
                          </div>
                          <div>
                            <h4 className="font-bold text-base text-gray-900 mb-1" style={{ fontFamily: 'var(--font-secondary)' }}>
                              Free Agents Outside Draft Territories
                            </h4>
                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                              {divisionData.divisionInfo.freeAgents}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Returning Players - Alberta Major Female */}
                  {divisionData.divisionInfo?.returningPlayers && (
                    <Card className="border-l-4 border-l-[#013fac] shadow-sm hover:shadow-md transition-shadow md:col-span-2">
                      <div className="p-5">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="p-2 bg-[#013fac]/10 rounded-lg">
                            <Users className="w-5 h-5 text-[#013fac]" />
                          </div>
                          <div>
                            <h4 className="font-bold text-base text-gray-900 mb-1" style={{ fontFamily: 'var(--font-secondary)' }}>
                              Returning Players
                            </h4>
                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                              {divisionData.divisionInfo.returningPlayers}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}
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