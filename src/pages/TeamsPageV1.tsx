import { ChevronRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useDivision } from '../contexts/DivisionContext';
import { allPossibleDivisions } from '../contexts/DivisionContext';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useCurrentTeamsData } from '../hooks/useCurrentTeamsData';
import { TeamDetailPage } from '../components/TeamDetailPage';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { getTeamLogo } from '../utils/team-logos';
import React from 'react';
import { useNavigation } from '../contexts/NavigationContext';
import { User, Mail, Phone, Globe, MapPin } from 'lucide-react';
import { Facebook, Instagram, Youtube } from 'lucide-react';
import { Home } from 'lucide-react';
import { fetchTeamFranchiseProtectedList, fetchFranchiseDetails } from '../services/sportzsoft/api';
import { fetchTeamRaw } from '../services/sportzsoft/api';

// X (Twitter) logo as inline SVG component for team cards
function XLogoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

// TikTok logo as inline SVG component
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.81a8.23 8.23 0 0 0 4.76 1.52V6.88a4.84 4.84 0 0 1-1-.19z" />
    </svg>
  );
}

// Helper to build a proper social media URL from an account name or existing URL
function buildSocialUrl(value: string, platform: 'facebook' | 'twitter' | 'instagram' | 'youtube' | 'tiktok' | 'website'): string {
  if (!value) return '';
  // Already a full URL
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  // Has www
  if (value.startsWith('www.')) return `https://${value}`;
  // Platform-specific URL building from account names
  switch (platform) {
    case 'facebook': return `https://www.facebook.com/${encodeURIComponent(value)}`;
    case 'twitter': return `https://x.com/${value.replace(/^@/, '')}`;
    case 'instagram': return `https://www.instagram.com/${value.replace(/^@/, '')}`;
    case 'youtube': return `https://www.youtube.com/${value}`;
    case 'tiktok': return `https://www.tiktok.com/@${value.replace(/^@/, '')}`;
    default: return `https://${value}`;
  }
}

// Helper to get a display label for a social media value
function socialDisplayLabel(value: string, platform: 'facebook' | 'twitter' | 'instagram' | 'youtube' | 'tiktok'): string {
  if (!value) return '';
  // If it's a URL, strip the protocol
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value.replace(/^https?:\/\//, '').replace(/\/$/, '');
  }
  // For account names, show with platform-appropriate prefix
  switch (platform) {
    case 'twitter': return `@${value.replace(/^@/, '')}`;
    case 'instagram': return `@${value.replace(/^@/, '')}`;
    case 'tiktok': return `@${value.replace(/^@/, '')}`;
    default: return value;
  }
}

// Helper to resolve the first non-empty string value from an object given multiple possible keys
function resolveStr(obj: any, ...keys: string[]): string {
  for (const key of keys) {
    const val = obj?.[key];
    if (val && typeof val === 'string' && val.trim()) return val.trim();
  }
  return '';
}

// Parse slash-separated color strings like "Black/Red/White" into an array of CSS color values
function parseTeamColors(colorStr: string): string[] {
  if (!colorStr) return [];
  return colorStr.split('/').map(c => c.trim()).filter(Boolean);
}

// Get unique colors from home and away sweater colors (preserving home order first)
function getAllTeamColors(homeStr: string, awayStr: string): string[] {
  const homeColors = parseTeamColors(homeStr);
  const awayColors = parseTeamColors(awayStr);
  const seen = new Set<string>();
  const result: string[] = [];
  for (const c of [...homeColors, ...awayColors]) {
    const lower = c.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      result.push(c);
    }
  }
  return result;
}

// Deep resolve — searches top-level keys AND common nested containers
function deepResolveStr(obj: any, ...keys: string[]): string {
  // First try top-level
  const topLevel = resolveStr(obj, ...keys);
  if (topLevel) return topLevel;
  
  // Then try common nested containers
  const nestedContainers = [
    'TeamContacts', 'Contacts', 'Contact', 'ContactInfo', 'TeamContact',
    'TeamLinks', 'Links', 'Link', 'TeamLink', 'SocialMedia', 'Social',
    'TeamInfo', 'Info', 'Details', 'TeamDetails', 'TeamData',
    'TeamWebLinks', 'WebLinks', 'ExternalLinks',
  ];
  
  for (const container of nestedContainers) {
    const nested = obj?.[container];
    if (!nested) continue;
    
    // If it's an array, search each element
    if (Array.isArray(nested)) {
      for (const item of nested) {
        const val = resolveStr(item, ...keys);
        if (val) return val;
      }
    } else if (typeof nested === 'object') {
      const val = resolveStr(nested, ...keys);
      if (val) return val;
    }
  }
  
  return '';
}

// Search for social link in array of link/contact objects (SportzSoft often uses typed arrays)
function findLinkByType(obj: any, ...typePatterns: string[]): string {
  // Check common array containers for typed link objects
  const arrayContainers = [
    'TeamLinks', 'Links', 'Link', 'WebLinks', 'TeamWebLinks', 'ExternalLinks',
    'SocialMediaLinks', 'SocialLinks', 'TeamContacts', 'Contacts',
  ];
  
  for (const container of arrayContainers) {
    const items = obj?.[container];
    if (!Array.isArray(items)) continue;
    
    for (const item of items) {
      // Check if item has a type/name field matching our pattern
      const typeFields = ['LinkType', 'Type', 'TypeCd', 'TypeCode', 'Name', 'LinkName', 
                          'ContactType', 'MediaType', 'Platform', 'SocialType', 'Label'];
      for (const typeField of typeFields) {
        const typeVal = item?.[typeField];
        if (typeVal && typeof typeVal === 'string') {
          const typeLower = typeVal.toLowerCase();
          for (const pattern of typePatterns) {
            if (typeLower.includes(pattern.toLowerCase())) {
              // Found a matching type — now get the URL/value
              const urlVal = resolveStr(item, 'Url', 'URL', 'LinkUrl', 'LinkURL', 'Value', 
                'Link', 'Address', 'WebAddress', 'Handle', 'ProfileUrl', 'ProfileURL');
              if (urlVal) return urlVal;
            }
          }
        }
      }
    }
  }
  
  return '';
}

// Extract contact info from the raw API team object
function extractContactInfo(apiTeam: any) {
  return {
    contactName: deepResolveStr(apiTeam, 'ContactName', 'PrimaryContactName', 'Contact', 'ManagerName', 'GMName', 'GeneralManager', 'Name'),
    contactEmail: deepResolveStr(apiTeam, 'ContactEmail', 'PrimaryContactEmail', 'Email', 'TeamEmail', 'ManagerEmail', 'EmailAddress'),
    contactPhone: deepResolveStr(apiTeam, 'ContactPhone', 'PrimaryContactPhone', 'Phone', 'TeamPhone', 'ManagerPhone', 'PhoneNumber', 'Telephone'),
    website: deepResolveStr(apiTeam, 'WebsiteUrl', 'TeamWebsiteUrl', 'Website', 'TeamUrl', 'TeamWebsite', 'Url', 'WebsiteURL', 'WebAddress', 'HomePage', 'HomePageUrl'),
    headCoach: deepResolveStr(apiTeam, 'HeadCoach', 'Coach', 'HeadCoachName', 'CoachName'),
    city: deepResolveStr(apiTeam, 'City', 'TeamCity', 'Location', 'HomeTown', 'CityName'),
    // Social media links — try top-level fields, nested containers, AND typed link arrays
    facebook: deepResolveStr(apiTeam, 'FaceBookAccount', 'FacebookAccount', 'FacebookUrl', 'FacebookURL', 'Facebook', 'FacebookPage', 'FacebookLink', 'SocialFacebook') 
              || findLinkByType(apiTeam, 'facebook', 'fb'),
    twitter: deepResolveStr(apiTeam, 'TwitterAccount', 'TwitterUrl', 'TwitterURL', 'Twitter', 'TwitterHandle', 'TwitterLink', 'XUrl', 'XURL', 'SocialTwitter', 'SocialX')
             || findLinkByType(apiTeam, 'twitter', 'x.com', 'x '),
    instagram: deepResolveStr(apiTeam, 'InstagramAccount', 'InstagramUrl', 'InstagramURL', 'Instagram', 'InstagramHandle', 'InstagramLink', 'SocialInstagram')
               || findLinkByType(apiTeam, 'instagram', 'ig'),
    youtube: deepResolveStr(apiTeam, 'YouTubeUrl', 'YoutubeUrl', 'YouTubeURL', 'YoutubeURL', 'YouTube', 'Youtube', 'YouTubeChannel', 'SocialYouTube')
             || findLinkByType(apiTeam, 'youtube', 'yt'),
    tiktok: deepResolveStr(apiTeam, 'TikTokUrl', 'TiktokUrl', 'TikTokURL', 'TikTok', 'Tiktok', 'TikTokLink', 'SocialTikTok')
            || findLinkByType(apiTeam, 'tiktok', 'tik tok'),
  };
}

export function TeamsPageV1() {
  const { selectedDivision: favoriteDivision, selectedSubDivision: favoriteSubDivision, divisions, subDivisions } = useDivision();
  const { navigationParams } = useNavigation();
  
  const [selectedDivision, setSelectedDivision] = useState(() =>
    favoriteDivision && favoriteDivision !== 'All Divisions' ? favoriteDivision : 'Senior B'
  );
  const [selectedSubDivision, setSelectedSubDivision] = useState(() =>
    favoriteDivision && favoriteDivision !== 'All Divisions' ? (favoriteSubDivision || 'All') : 'All'
  );
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedTeamName, setSelectedTeamName] = useState<string | null>(null);
  const [selectedTeamLogo, setSelectedTeamLogo] = useState<string | null>(null);
  const [selectedTeamDivisionId, setSelectedTeamDivisionId] = useState<number | null>(null);
  const [selectedTeamSeason, setSelectedTeamSeason] = useState<string | undefined>(undefined);

  // Auto-select team when navigating back from player profile
  useEffect(() => {
    if (navigationParams?.selectedTeamId && navigationParams?.selectedTeamName) {
      setSelectedTeamId(String(navigationParams.selectedTeamId));
      setSelectedTeamName(String(navigationParams.selectedTeamName));
      setSelectedTeamLogo(navigationParams.selectedTeamLogo ? String(navigationParams.selectedTeamLogo) : null);
      setSelectedTeamDivisionId(navigationParams.selectedTeamDivisionId ? Number(navigationParams.selectedTeamDivisionId) : null);
      setSelectedTeamSeason(navigationParams.selectedTeamSeason ? String(navigationParams.selectedTeamSeason) : undefined);
    }
  }, []);

  // Update local division when favorite changes (skip on mount since already initialized)
  const prevFavoriteRef = useRef({ div: favoriteDivision, sub: favoriteSubDivision });
  useEffect(() => {
    const prevDiv = prevFavoriteRef.current.div;
    const prevSub = prevFavoriteRef.current.sub;
    prevFavoriteRef.current = { div: favoriteDivision, sub: favoriteSubDivision };
    
    // Skip if nothing actually changed (e.g. on mount)
    if (favoriteDivision === prevDiv && favoriteSubDivision === prevSub) return;
    if (favoriteDivision === 'All Divisions') return;
    
    setSelectedDivision(favoriteDivision);
    setSelectedSubDivision(favoriteSubDivision || 'All');
  }, [favoriteDivision, favoriteSubDivision]);

  // Reset subdivision when division changes via user interaction (not from favorite sync)
  const handleDivisionChange = (division: string) => {
    setSelectedDivision(division);
    setSelectedSubDivision('All');
  };

  // Fetch teams data from SportzSoft API - CURRENT season only
  const { teams: apiTeams, loading, error } = useCurrentTeamsData();

  // Per-team enrichment: fetch individual team details (contact info, social links)
  // from the Team/{id} endpoint which returns more data than the bulk Season/Team endpoint
  const [enrichedContactData, setEnrichedContactData] = useState<Record<string, any>>({});
  const enrichmentFetchedRef = useRef<Set<string>>(new Set());

  // Build available subdivisions from teams data
  const availableSubDivisions = React.useMemo(() => {
    const divisionsWithSubdivs = ['Junior B Tier I', 'Junior B Tier II', 'Senior C'];
    
    if (!divisionsWithSubdivs.includes(selectedDivision)) {
      return [];
    }

    const subdivs = new Set<string>();
    apiTeams.forEach(team => {
      if (team.DivisionName === selectedDivision && team.SubDivision) {
        subdivs.add(team.SubDivision);
      }
    });

    const sortedSubdivs = Array.from(subdivs).sort();
    return ['All', ...sortedSubdivs];
  }, [apiTeams, selectedDivision]);

  // Map API data to component format for display and filter by selected division AND subdivision
  const filteredTeams = useMemo(() => apiTeams
    .filter((apiTeam) => {
      if (!selectedDivision || selectedDivision === 'All Divisions') return true;
      if (apiTeam.DivisionName !== selectedDivision) return false;
      if (!selectedSubDivision || selectedSubDivision === 'All') return true;
      return apiTeam.SubDivision === selectedSubDivision;
    })
    .sort((a, b) => a.TeamName.localeCompare(b.TeamName))
    .map((apiTeam) => ({
      id: apiTeam.TeamId.toString(),
      teamIdNum: apiTeam.TeamId,
      name: apiTeam.TeamName,
      division: apiTeam.DivisionName,
      subdivision: apiTeam.SubDivision,
      divisionId: apiTeam.DivisionId,
      logo: getTeamLogo(apiTeam.TeamName, apiTeam.PrimaryTeamLogoURL),
      homeFacilityName: apiTeam.HomeFacilityName || (apiTeam as any).HomeFacility1Name || (apiTeam as any).HomeFacility2Name || '',
      contactInfo: extractContactInfo(apiTeam),
    })),
  [apiTeams, selectedDivision, selectedSubDivision]);

  // Enrich visible teams with individual Team endpoint data (contacts, social links)
  useEffect(() => {
    if (loading || filteredTeams.length === 0) return;
    
    // Only fetch for teams we haven't enriched yet
    const teamsToEnrich = filteredTeams.filter(t => !enrichmentFetchedRef.current.has(t.id));
    if (teamsToEnrich.length === 0) return;

    // Mark as in-progress to avoid duplicate fetches
    teamsToEnrich.forEach(t => enrichmentFetchedRef.current.add(t.id));

    const enrichTeams = async () => {
      const batchResults: Record<string, any> = {};
      
      // Fetch in parallel batches of 4 to avoid overwhelming the API
      for (let i = 0; i < teamsToEnrich.length; i += 4) {
        const batch = teamsToEnrich.slice(i, i + 4);
        const batchPromises = batch.map(async (team) => {
          try {
            // Fetch individual team data: BI+B for roles, and raw (no limiters) for social fields
            const [teamResp, rawResp] = await Promise.all([
              fetchTeamFranchiseProtectedList(team.teamIdNum, 'BI', 'B'),
              fetchTeamRaw(team.teamIdNum),
            ]);
            if (!teamResp?.Success) return;

            const teamData = teamResp.Response?.Team || teamResp.Response || {};
            const rawTeam = rawResp?.Response?.Team || rawResp?.Response || {};
            
            // Merge raw fields into teamData (raw has FaceBookAccount, TwitterAccount, etc.)
            Object.keys(rawTeam).forEach(key => {
              if (teamData[key] === undefined || teamData[key] === null) {
                teamData[key] = rawTeam[key];
              }
            });
            
            const franchiseId = teamData.TeamFranchiseId;
            
            const enriched: any = {
              // Extract any contact/social fields from the merged Team response
              ...extractContactInfo(teamData),
            };

            // Extract team colors from API
            const color1 = resolveStr(teamData, 'HomeSweaterColor', 'TeamColor1', 'TeamColour1', 'HomeColor', 'HomeColour1', 'PrimaryColor');
            const color2 = resolveStr(teamData, 'AwaySweaterColor', 'TeamColor2', 'TeamColour2', 'AwayColor', 'AwayColour1', 'SecondaryColor');
            if (color1) enriched.teamColor1 = color1;
            if (color2) enriched.teamColor2 = color2;

            // Extract home facility
            const facility = resolveStr(teamData, 'HomeFacilityName', 'HomeFacility1Name', 'HomeFacility2Name', 'FacilityName', 'HomeFacility', 'HomeArena', 'HomeVenue', 'Arena', 'Facility');
            if (facility) enriched.homeFacility = facility;

            // Extract Public Contact from TeamRoles (returned by ChildCodes=B)
            // The "Public Contact" role is the designated team contact for public display
            const teamRoles = teamData.TeamRoles || teamData.Roles || teamData.TeamRole || [];
            if (Array.isArray(teamRoles) && teamRoles.length > 0) {
              // Look for "Public Contact" role first — this is the designated public-facing contact
              const publicContactRole = teamRoles.find((r: any) =>
                r.Role === 'Public Contact' || r.Role?.toLowerCase() === 'public contact'
              );
              if (publicContactRole) {
                const name = publicContactRole.Name || publicContactRole.FullName ||
                  ((publicContactRole.FirstName || '') + (publicContactRole.LastName ? ' ' + publicContactRole.LastName : '')).trim();
                if (name) {
                  enriched.publicContactName = name;
                  enriched.publicContactEmail = publicContactRole.PrimaryEmail || publicContactRole.Email || publicContactRole.EmailAddress || publicContactRole.EMailAddress || '';
                }
              } else {
                // No Public Contact role assigned — mark as missing so we can show TBD
                enriched.publicContactName = '';
                enriched.publicContactEmail = '';
              }
            }

            // Also fetch with LimiterCode=I specifically for contact/info fields
            try {
              const infoResp = await fetchTeamFranchiseProtectedList(team.teamIdNum, 'I');
              if (infoResp?.Success && infoResp?.Response) {
                const infoTeam = infoResp.Response?.Team || infoResp.Response || {};
                const infoCI = extractContactInfo(infoTeam);
                // Merge — I fields take priority if they have values
                Object.keys(infoCI).forEach(k => {
                  if ((infoCI as any)[k]) (enriched as any)[k] = (infoCI as any)[k];
                });
              }
            } catch (e) {
              // LimiterCode=I fetch failed — not critical
            }

            // If we got a franchise ID, try to get franchise contacts
            if (franchiseId) {
              try {
                const franResp = await fetchFranchiseDetails(franchiseId, 'C', 'P');
                if (franResp?.Success && franResp?.Response) {
                  const tf = franResp.Response?.TeamFranchise || franResp.Response || {};
                  const protList = tf.ProtectedList || [];
                  
                  if (Array.isArray(protList)) {
                    // Find PRIM contact
                    const primRole = protList.find((r: any) => {
                      const cd = (r.FranchiseRoleCd || '').toUpperCase();
                      return cd === 'PRIM' || cd === 'PRIMARY';
                    });
                    if (primRole) {
                      const name = primRole.Name || primRole.FullName || 
                        ((primRole.FirstName || '') + (primRole.LastName ? ' ' + primRole.LastName : '')).trim();
                      if (name) {
                        enriched.contactName = name;
                        enriched.contactEmail = primRole.Email || primRole.EmailAddress || primRole.EMailAddress || enriched.contactEmail || '';
                        enriched.contactPhone = primRole.Phone || primRole.CellPhone || primRole.HomePhone || enriched.contactPhone || '';
                      }
                    }
                  }
                }
              } catch (e) {
                // Franchise fetch failed — not critical, card still shows basic data
              }
            }

            batchResults[team.id] = enriched;
          } catch (e) {
            console.warn(`[TeamsPage] Enrichment failed for team ${team.id}:`, e);
          }
        });
        
        await Promise.all(batchPromises);
      }
      
      if (Object.keys(batchResults).length > 0) {
        setEnrichedContactData(prev => ({ ...prev, ...batchResults }));
      }
    };

    enrichTeams();
  }, [filteredTeams, loading]);

  // If a team is selected, show the team detail page
  if (selectedTeamId && selectedTeamName) {
    return (
      <TeamDetailPage
        teamId={selectedTeamId}
        teamName={selectedTeamName}
        teamLogo={selectedTeamLogo || undefined}
        divisionId={selectedTeamDivisionId || undefined}
        season={selectedTeamSeason}
        onBack={() => {
          setSelectedTeamId(null);
          setSelectedTeamName(null);
          setSelectedTeamLogo(null);
          setSelectedTeamDivisionId(null);
          setSelectedTeamSeason(undefined);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main>
        {/* Page Header */}
        <section className="bg-gradient-to-r from-[#0F2942] to-[#1a3a5c] text-white py-8 sm:py-12">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
            <div className="flex items-center gap-2 text-sm mb-3 text-gray-300">
              <Home className="w-4 h-4" />
              <ChevronRight className="w-4 h-4" />
              <span className="text-white">Teams</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl mb-2">RMLL Teams</h1>
            <p className="text-base text-gray-300 max-w-3xl">
              Browse all teams competing in the Rocky Mountain Lacrosse League
            </p>
          </div>
        </section>

        {/* Teams Content */}
        <section className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 sm:py-8 lg:py-12">
          {/* Division Filters */}
          <div className="mb-6 sm:mb-8 space-y-4">
            {/* Mobile Dropdown */}
            <div className="block md:hidden">
              <Select value={selectedDivision} onValueChange={handleDivisionChange}>
                <SelectTrigger className="w-full font-bold">
                  <SelectValue placeholder="Select Division" />
                </SelectTrigger>
                <SelectContent>
                  {allPossibleDivisions.map((division) => (
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
                {allPossibleDivisions.map((division) => (
                  <button
                    key={division}
                    onClick={() => handleDivisionChange(division)}
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

            {/* Subdivision Filter - Only show if division has subdivisions */}
            {availableSubDivisions.length > 0 && (
              <>
                {/* Mobile Dropdown */}
                <div className="block md:hidden">
                  <Select value={selectedSubDivision} onValueChange={setSelectedSubDivision}>
                    <SelectTrigger className="w-full font-medium">
                      <SelectValue placeholder="Select Conference" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSubDivisions.map((subdivision) => (
                        <SelectItem key={subdivision} value={subdivision} className="font-medium">
                          {subdivision}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Desktop Filter Bar */}
                <div className="hidden md:block overflow-x-auto scrollbar-hide">
                  <div className="flex gap-1.5 sm:gap-2 pb-2 min-w-max">
                    {availableSubDivisions.map((subdivision) => (
                      <button
                        key={subdivision}
                        onClick={() => setSelectedSubDivision(subdivision)}
                        className={`px-2.5 sm:px-3 lg:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-medium tracking-wide whitespace-nowrap rounded transition-all duration-200 ${
                          selectedSubDivision === subdivision
                            ? 'bg-[#DC2626] text-white shadow-md'
                            : 'bg-white text-gray-600 hover:bg-[#DC2626]/5 border border-gray-300 hover:border-[#DC2626]'
                        }`}
                      >
                        {subdivision}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Teams Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {loading ? (
              // Loading skeleton
              Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="overflow-hidden border border-gray-200 animate-pulse">
                  <div className="bg-gray-100 p-6 border-b border-gray-200">
                    <div className="flex flex-col items-center">
                      <div className="w-24 h-24 rounded-full bg-gray-300 mb-3"></div>
                      <div className="h-5 w-32 bg-gray-300 rounded mb-2"></div>
                      <div className="h-4 w-24 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-center mb-4">
                      <div className="h-6 w-20 bg-gray-200 rounded"></div>
                    </div>
                    <div className="h-10 w-full bg-gray-300 rounded"></div>
                  </CardContent>
                </Card>
              ))
            ) : error ? (
              // Error state
              <div className="col-span-full text-center py-12">
                <p className="text-red-500 mb-2">Error loading teams</p>
                <p className="text-gray-500 text-sm">{error}</p>
              </div>
            ) : (
              filteredTeams.map((team) => {
              const initials = team.name.split(' ').map(word => word[0]).join('').slice(0, 3);
              
              // Merge base contact info with any enriched data from per-team fetches
              const baseCI = team.contactInfo;
              const enriched = enrichedContactData[team.id];
              const ci = enriched ? {
                contactName: enriched.contactName || baseCI.contactName,
                contactEmail: enriched.contactEmail || baseCI.contactEmail,
                contactPhone: enriched.contactPhone || baseCI.contactPhone,
                website: enriched.website || baseCI.website,
                headCoach: enriched.headCoach || baseCI.headCoach,
                city: enriched.city || baseCI.city,
                facebook: enriched.facebook || baseCI.facebook,
                twitter: enriched.twitter || baseCI.twitter,
                instagram: enriched.instagram || baseCI.instagram,
                youtube: enriched.youtube || baseCI.youtube,
                tiktok: enriched.tiktok || baseCI.tiktok,
                publicContactName: enriched.publicContactName || '',
                publicContactEmail: enriched.publicContactEmail || '',
              } : baseCI;
              
              // Public Contact info (from enrichment only)
              const publicContactName = (ci as any).publicContactName || '';
              const publicContactEmail = (ci as any).publicContactEmail || '';
              // enrichedContactData exists for this team means enrichment is done
              const enrichmentDone = !!enriched;
              
              // Team colors and home facility from enrichment
              const teamColor1 = enriched?.teamColor1 || '';
              const teamColor2 = enriched?.teamColor2 || '';
              const homeFacility = enriched?.homeFacility || team.homeFacilityName || '';
              const allColors = getAllTeamColors(teamColor1, teamColor2);
              const homeColors = parseTeamColors(teamColor1);
              
              // Check if any contact info exists
              const hasContactInfo = ci.city || ci.headCoach || ci.contactName || ci.contactEmail || ci.contactPhone || ci.website || ci.facebook || ci.twitter || ci.instagram || ci.youtube || ci.tiktok || enrichmentDone;
              
              return (
              <Card 
                key={team.id} 
                className="overflow-hidden hover:shadow-lg transition-all cursor-pointer border border-gray-200 hover:border-[#013fac] flex flex-col"
                onClick={() => {
                  setSelectedTeamId(team.id);
                  setSelectedTeamName(team.name);
                  setSelectedTeamLogo(team.logo);
                  setSelectedTeamDivisionId(team.divisionId);
                }}
              >
                {/* Team Logo Header */}
                <div className="bg-gray-50 p-6 border-b border-gray-200 relative">
                  <div className="flex flex-col items-center">
                    {team.logo ? (
                      <div className="w-24 h-24 flex items-center justify-center mb-3">
                        <img 
                          src={team.logo}
                          alt={`${team.name} logo`}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ) : (
                      <div 
                        className="w-24 h-24 rounded-full flex items-center justify-center shadow-lg mb-3"
                        style={{ 
                          background: 'linear-gradient(135deg, #0F2942 0%, #DC2626 100%)'
                        }}
                      >
                        <span className="text-white font-black text-2xl tracking-tight">
                          {initials}
                        </span>
                      </div>
                    )}
                    <h3 className="font-bold text-center">
                      {team.name}
                    </h3>
                    <p className="text-sm text-gray-600 text-center mt-1">
                      {team.division}
                    </p>
                  </div>
                </div>

                <CardContent className="p-4 pt-2 flex-1 flex flex-col">
                  {/* Home Facility */}
                  {homeFacility && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1.5 pb-1.5 border-b border-gray-100">
                      <Home className="w-3 h-3 text-gray-400 shrink-0" />
                      <span className="truncate font-medium">{homeFacility}</span>
                    </div>
                  )}
                  {/* Team Colors - text display */}
                  {teamColor1 && (
                    <div className="flex items-start gap-2 text-xs text-gray-600 mb-1.5 pb-1.5 border-b border-gray-100">
                      <span className="text-gray-400 font-medium shrink-0">Home Colours:</span>
                      <span className="truncate">{teamColor1}</span>
                    </div>
                  )}
                  {/* Contact Info Section */}
                  {hasContactInfo ? (
                    <div className="space-y-1.5 mb-3 flex-1 flex flex-col">
                      {ci.city && (
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                          <span className="truncate">{ci.city}</span>
                        </div>
                      )}
                      {/* ... existing code ... (headCoach) */}
                      {ci.headCoach && (
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <User className="w-3 h-3 text-gray-400 shrink-0" />
                          <span className="truncate">
                            {ci.headCoach ? `Coach: ${ci.headCoach}` : ci.contactName}
                          </span>
                        </div>
                      )}
                      {ci.contactEmail && (
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Mail className="w-3 h-3 text-gray-400 shrink-0" />
                          <a
                            href={`mailto:${ci.contactEmail}`}
                            onClick={(e) => e.stopPropagation()}
                            className="truncate text-[#013fac] hover:underline"
                          >
                            {ci.contactEmail}
                          </a>
                        </div>
                      )}
                      {ci.contactPhone && (
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Phone className="w-3 h-3 text-gray-400 shrink-0" />
                          <a
                            href={`tel:${ci.contactPhone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="truncate text-[#013fac] hover:underline"
                          >
                            {ci.contactPhone}
                          </a>
                        </div>
                      )}
                      {ci.website && (
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Globe className="w-3 h-3 text-gray-400 shrink-0" />
                          <a
                            href={ci.website.startsWith('http') ? ci.website : `https://${ci.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="truncate text-[#013fac] hover:underline"
                          >
                            {ci.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                          </a>
                        </div>
                      )}
                      {/* Spacer to push contact + social to bottom */}
                      <div className="flex-1" />
                      {/* Public Contact — displayed prominently as the team's designated contact */}
                      {enrichmentDone && (
                        <div className="bg-blue-50 border border-blue-100 rounded px-2.5 py-1.5 -mx-0.5">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <User className="w-3 h-3 text-[#013fac] shrink-0" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#013fac]">Team Contact</span>
                          </div>
                          {publicContactName ? (
                            <div className="pl-[18px] space-y-0.5">
                              <p className="text-xs font-semibold text-gray-800">{publicContactName}</p>
                              {publicContactEmail && (
                                <a
                                  href={`mailto:${publicContactEmail}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-xs text-[#013fac] hover:underline block truncate"
                                >
                                  {publicContactEmail}
                                </a>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400 italic pl-[18px]">Not yet assigned</p>
                          )}
                        </div>
                      )}
                      {/* Social Media Icons Row */}
                      {(ci.facebook || ci.twitter || ci.instagram || ci.youtube || ci.tiktok) && (
                        <div className="flex items-center gap-1.5 pt-1">
                          {ci.facebook && (
                            <a
                              href={buildSocialUrl(ci.facebook, 'facebook')}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="w-7 h-7 rounded-full bg-gray-100 hover:bg-[#1877F2] hover:text-white text-gray-500 flex items-center justify-center transition-colors"
                              title={socialDisplayLabel(ci.facebook, 'facebook')}
                            >
                              <Facebook className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {ci.twitter && (
                            <a
                              href={buildSocialUrl(ci.twitter, 'twitter')}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="w-7 h-7 rounded-full bg-gray-100 hover:bg-black hover:text-white text-gray-500 flex items-center justify-center transition-colors"
                              title={socialDisplayLabel(ci.twitter, 'twitter')}
                            >
                              <XLogoIcon className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {ci.instagram && (
                            <a
                              href={buildSocialUrl(ci.instagram, 'instagram')}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gradient-to-br hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888] hover:text-white text-gray-500 flex items-center justify-center transition-colors"
                              title={socialDisplayLabel(ci.instagram, 'instagram')}
                            >
                              <Instagram className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {ci.youtube && (
                            <a
                              href={buildSocialUrl(ci.youtube, 'youtube')}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="w-7 h-7 rounded-full bg-gray-100 hover:bg-[#FF0000] hover:text-white text-gray-500 flex items-center justify-center transition-colors"
                              title={socialDisplayLabel(ci.youtube, 'youtube')}
                            >
                              <Youtube className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {ci.tiktok && (
                            <a
                              href={buildSocialUrl(ci.tiktok, 'tiktok')}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="w-7 h-7 rounded-full bg-gray-100 hover:bg-black hover:text-white text-gray-500 flex items-center justify-center transition-colors"
                              title={socialDisplayLabel(ci.tiktok, 'tiktok')}
                            >
                              <TikTokIcon className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    // No contact data populated yet — show division badge as placeholder
                    <div className="flex items-center justify-center py-1 mb-3">
                      <Badge variant="outline" className="text-xs text-gray-400 border-gray-200">
                        {team.subdivision || team.division}
                      </Badge>
                    </div>
                  )}
                  
                  {/* View Details Button */}
                  <button className="w-full py-2 px-4 bg-[#013fac] text-white rounded hover:bg-[#012a7a] transition-colors font-bold text-sm mt-auto">
                    View Team Details
                  </button>
                </CardContent>
              </Card>
              );
            })
            )}
          </div>

          {/* Empty State */}
          {!loading && !error && filteredTeams.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No teams found for this division.</p>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}