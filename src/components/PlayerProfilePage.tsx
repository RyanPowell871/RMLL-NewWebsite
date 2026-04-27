import React, { useState } from 'react';
import { useNavigation } from '../contexts/NavigationContext';
import { usePlayerProfile } from '../hooks/usePlayerProfile';
import { ArrowLeft, User, Trophy, Calendar, Shield, Activity, Award, ArrowRightLeft, MapPin } from 'lucide-react';
import { Header } from './Header';
import { Footer } from './Footer';

export default function PlayerProfilePage() {
  const { navigateTo, navigationParams } = useNavigation();
  const playerId = navigationParams.playerId;
  const teamId = navigationParams.teamId ? Number(navigationParams.teamId) : undefined;
  const seasonId = navigationParams.seasonId ? Number(navigationParams.seasonId) : undefined;
  const photoDocId = navigationParams.photoDocId ? Number(navigationParams.photoDocId) : undefined;
  const isGoalieHint = navigationParams.isGoalie === true || navigationParams.isGoalie === 'true';
  
  // Back navigation context - remember where the user came from
  const fromPage = navigationParams.fromPage as string | undefined;
  const fromLabel = navigationParams.fromLabel as string | undefined;
  const fromParams = navigationParams.fromParams as Record<string, any> | undefined;

  // Compute the back button destination and label
  const backDestination = fromPage || 'stats';
  const backLabel = fromLabel || 'Back to Stats';
  const backParams = fromParams || {};

  const handleBack = () => {
    navigateTo(backDestination as any, backParams);
  };

  const { profile, loading, error } = usePlayerProfile(Number(playerId), teamId, seasonId, photoDocId, isGoalieHint);

  // Local state to toggle view if player has mixed stats
  const [viewRole, setViewRole] = useState<'player' | 'goalie' | null>(null);
  const [activeTab, setActiveTab] = useState<'career' | 'season_log' | 'penalty_log'>('career');
  const [photoError, setPhotoError] = useState(false);
  
  // Initialize viewRole when profile loads — respect navigation hint
  React.useEffect(() => {
    if (profile) {
      if (isGoalieHint && profile.hasGoalieStats) {
        // Navigated from goalie context AND player has goalie data → show goalie view
        setViewRole('goalie');
      } else if (isGoalieHint && !profile.hasGoalieStats && profile.hasPlayerStats) {
        setViewRole('player');
      } else {
        // No hint — use profile's own primaryRole detection
        setViewRole(profile.primaryRole);
      }
    }
  }, [profile?.playerId, isGoalieHint]);

  // Reset photo error state when player changes
  React.useEffect(() => {
    setPhotoError(false);
  }, [playerId]);

  const currentRole = viewRole || profile?.primaryRole || 'player';
  const isGoalieView = currentRole === 'goalie';

  // Select role-specific career data based on toggle
  const activeCareer = profile ? (isGoalieView ? profile.goalieCareer : profile.playerCareer) : null;
  const activeSeasons = profile ? (isGoalieView ? profile.goalieAggregatedSeasons : profile.playerAggregatedSeasons) : [];

  // Calculate aggregates based on view (using role-specific career)
  const careerShotsAgainst = activeCareer?.shotsAgainst || ((activeCareer?.saves || 0) + (activeCareer?.goalsAgainst || 0));
  const careerSvPct = careerShotsAgainst > 0 ? ((activeCareer?.saves || 0) / careerShotsAgainst * 100).toFixed(1) : '-';
  const careerGAA = activeCareer?.minutes && activeCareer.minutes > 0 
    ? ((activeCareer.goalsAgainst || 0) * 60 / activeCareer.minutes).toFixed(2) 
    : '-';

  const toggleRole = () => {
    setViewRole(prev => prev === 'player' ? 'goalie' : 'player');
  };

  const handleSeasonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSeasonId = e.target.value;
    if (newSeasonId) {
        // Don't pass teamId when switching seasons - the hook will resolve the correct team
        // for the selected season from the player's career stat entries
        // Preserve back navigation context across season changes
        navigateTo('player', { playerId, seasonId: newSeasonId, photoDocId, isGoalie: isGoalieHint || viewRole === 'goalie', fromPage, fromLabel, fromParams });
    }
  };

  // Determine colors (default to RMLL Blue if not found)
  const primaryColor = profile?.currentTeamColors?.primary || '#013fac';
  const secondaryColor = profile?.currentTeamColors?.secondary || '#ffffff';
  
  // Helper to format season name
  const formatSeasonName = (name: string, type?: string) => {
      if (!name) return '';
      // Comprehensive cleanup matching usePlayerProfile.cleanSeasonName
      let clean = name
          .replace(/\s*-?\s*Playoffs?/i, '')
          .replace(/\s*Playodd/i, '')
          .replace(/\s*-?\s*Exhibition/i, '')
          .replace(/\s*-?\s*Regular\s*Season/i, '')
          .replace(/\s*-?\s*Provincials?/i, '')
          .replace(/\s*\(\d+\)\s*/g, '') // Remove "(7235)" style IDs
          .replace(/\s*#\d+\s*/g, '') // Remove "#7235" style IDs
          .replace(/\s*-\s*$/, '') // Remove trailing dash
          .trim();
      return clean || name;
  };

  // Helper for ordinals
  const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  };

  // Helper to calculate penalty end time - Fallback only if data is missing
  const calculatePenaltyEnd = (start: string, minutes: number, end: string) => {
    // If we have an explicit end time, use it
    if (end && end !== '-') return end;
    
    // Otherwise calculate
    if (!start || start === '-' || !minutes) return '-';
    try {
        if (!start.includes(':')) return '-';
        const [minStr, secStr] = start.split(':');
        const startMin = parseInt(minStr);
        const startSec = parseInt(secStr || '0');
        
        const durationSec = Math.floor(minutes * 60);
        let totalStartSec = startMin * 60 + startSec;
        let endSec = totalStartSec - durationSec;
        
        if (endSec < 0) return '00:00'; 
        
        const m = Math.floor(endSec / 60);
        const s = endSec % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    } catch {
        return '-';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <Header />
        <div className="flex-1 flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" style={{ borderColor: '#013fac' }}></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[50vh]">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4 text-gray-400">
            <User className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Player Not Found</h2>
          <p className="text-gray-500 mb-6 max-w-md">{error?.message || "We couldn't find detailed statistics for this player."}</p>
          <div className="text-xs text-gray-400 mb-6">Player ID: {playerId}</div>
          <button 
            onClick={handleBack}
            className="text-white bg-[#013fac] hover:bg-blue-700 px-6 py-2 rounded-md font-bold transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> {backLabel}
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <div className="relative overflow-hidden text-white shadow-lg" style={{ backgroundColor: primaryColor }}>
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10" style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` 
          }}></div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
            <button 
              onClick={handleBack}
              className="mb-8 hover:text-white flex items-center gap-2 text-sm font-bold transition-colors uppercase tracking-wide group opacity-80 hover:opacity-100"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> {backLabel}
            </button>

            <div className="flex flex-col md:flex-row items-center md:items-end gap-8">
              {/* Photo Container */}
              <div className="relative group">
                <div className="w-32 h-32 md:w-48 md:h-48 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-white shrink-0 relative z-10">
                  {profile.photoUrl && !photoError ? (
                    <img src={profile.photoUrl} alt={profile.name} className="w-full h-full object-cover" onError={() => setPhotoError(true)} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-300">
                      <User className="w-24 h-24" />
                    </div>
                  )}
                </div>
                
                {/* Team Logo Badge */}
                {profile.teamLogoUrl && (
                  <div className="absolute -bottom-2 -right-2 z-20 w-16 h-16 md:w-20 md:h-20 bg-white rounded-full p-2 shadow-lg border-2 border-gray-100 flex items-center justify-center">
                     <img src={profile.teamLogoUrl} alt="Team Logo" className="w-full h-full object-contain" />
                  </div>
                )}
                
                {profile.mostRecentJersey && !profile.teamLogoUrl && (
                  <div className="absolute -bottom-2 -right-2 z-20 bg-yellow-400 text-black text-xl font-black w-14 h-14 flex items-center justify-center rounded-full border-4 border-white shadow-lg">
                    {profile.mostRecentJersey}
                  </div>
                )}
              </div>

              {/* Player Info */}
              <div className="flex-1 text-center md:text-left space-y-2">
                <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none">
                  {profile.firstName} <span className="text-white/80">{profile.lastName}</span>
                </h1>
                
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm font-bold mt-4">
                  {profile.mostRecentTeam && (
                    <span className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded text-white backdrop-blur-sm border border-white/10 shadow-sm">
                      <Shield className="w-4 h-4 opacity-80" />
                      {profile.mostRecentTeam}
                    </span>
                  )}
                  {profile.mostRecentPosition && (
                    <span className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded text-white backdrop-blur-sm border border-white/10 shadow-sm">
                      <Activity className="w-4 h-4 opacity-80" />
                      {profile.mostRecentPosition}
                    </span>
                  )}
                   {profile.mostRecentJersey && (
                    <span className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded text-white backdrop-blur-sm border border-white/10 shadow-sm">
                      <span className="font-mono text-lg leading-none">#</span>
                      {profile.mostRecentJersey}
                    </span>
                  )}

                </div>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-semibold text-white/70 mt-2 uppercase tracking-wide">
                  {profile.divisionName && (
                    <span className="flex items-center gap-1">
                      <Trophy className="w-3 h-3" />
                      {profile.divisionName}
                    </span>
                  )}
                  {profile.hometown && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {profile.hometown}
                    </span>
                  )}
                  {profile.age && (
                    <span>Age: {profile.age}</span>
                  )}
                  {profile.birthDate && (
                    <span>Born: {new Date(profile.birthDate).getFullYear()}</span>
                  )}
                  {profile.height && (
                    <span>Ht: {profile.height}</span>
                  )}
                  {profile.weight && (
                    <span>Wt: {profile.weight}</span>
                  )}
                  {profile.shoots && (
                    <span>Shoots: {profile.shoots}</span>
                  )}
                </div>
              </div>

               {/* Career Totals - Big Numbers */}
               <div className="flex gap-8 md:gap-12 text-center md:text-right px-4">
                  <div>
                    <div className="text-4xl md:text-5xl font-black text-white">{activeCareer?.gamesPlayed || 0}</div>
                    <div className="text-xs uppercase font-bold text-white/60 tracking-widest mt-1">Games</div>
                  </div>
                  <div>
                    <div className="text-4xl md:text-5xl font-black text-white">
                         {isGoalieView ? careerSvPct : (activeCareer?.points || 0)}
                    </div>
                    <div className="text-xs uppercase font-bold text-white/60 tracking-widest mt-1">
                        {isGoalieView ? 'SV%' : 'Points'}
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Top Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            
            <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                {/* Tabs */}
                <div className="flex gap-1 bg-gray-100 p-1 rounded-lg self-start sm:self-auto">
                <button 
                    onClick={() => setActiveTab('career')}
                    className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-md transition-all ${
                        activeTab === 'career' 
                        ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' 
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
                    }`}
                >
                    Career Overview
                </button>
                <button 
                    onClick={() => setActiveTab('season_log')}
                    className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-md transition-all ${
                        activeTab === 'season_log' 
                        ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' 
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
                    }`}
                >
                    Game Log
                </button>
                <button 
                    onClick={() => setActiveTab('penalty_log')}
                    className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-md transition-all ${
                        activeTab === 'penalty_log' 
                        ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' 
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
                    }`}
                >
                    Penalties
                </button>
                </div>

                {/* Season Selector */}
                {(activeTab === 'season_log' || activeTab === 'penalty_log') && (
                    <div className="relative">
                        <select
                            value={profile.activeSeasonId || ''}
                            onChange={handleSeasonChange}
                            className="appearance-none bg-white border border-gray-300 hover:border-gray-400 text-gray-700 py-2 pl-4 pr-10 rounded-lg font-bold text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[200px]"
                        >
                            {/* Create unique list of seasons, de-duplicated by cleaned name
                                so regular season and playoffs don't show as separate entries */}
                            {(() => {
                                const seen = new Map<string, { id: number; name: string }>();
                                profile.seasons.forEach(s => {
                                    const clean = formatSeasonName(s.SeasonName || '');
                                    if (!seen.has(clean)) {
                                        seen.set(clean, { id: s.SeasonId, name: clean });
                                    }
                                });
                                return Array.from(seen.values())
                                    .sort((a, b) => b.id - a.id)
                                    .map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name}
                                        </option>
                                    ));
                            })()}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                            <Calendar className="w-4 h-4" />
                        </div>
                    </div>
                )}
            </div>

            {/* View Toggle (Only if player has both history types) */}
            {profile.hasGoalieStats && profile.hasPlayerStats && (
              <button 
                onClick={toggleRole}
                className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-50 transition-colors shadow-sm self-end sm:self-auto"
              >
                <ArrowRightLeft className="w-4 h-4" />
                Switch to {isGoalieView ? 'Player' : 'Goalie'} View
              </button>
            )}
          </div>

          {/* Tab Content: Career Overview */}
          {activeTab === 'career' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <StatCard label="Seasons" value={activeSeasons.length} icon={<Calendar className="w-4 h-4" />} color={primaryColor} />
                    
                    {isGoalieView ? (
                        <>
                        <StatCard label="SV%" value={careerSvPct} highlight color={primaryColor} />
                        <StatCard label="GAA" value={careerGAA} color={primaryColor} />
                        <StatCard label="Saves" value={activeCareer?.saves || 0} color={primaryColor} />
                        <StatCard label="GA" value={activeCareer?.goalsAgainst || 0} color={primaryColor} />
                        <StatCard label="SOG" value={careerShotsAgainst || 0} color={primaryColor} />
                        </>
                    ) : (
                        <>
                        <StatCard label="Goals" value={activeCareer?.goals || 0} color={primaryColor} />
                        <StatCard label="Assists" value={activeCareer?.assists || 0} color={primaryColor} />
                        <StatCard label="Points" value={activeCareer?.points || 0} highlight color={primaryColor} />
                        <StatCard label="PIM" value={activeCareer?.pim || 0} color={primaryColor} />
                        <StatCard label="PPG" value={activeCareer?.ppg || 0} color={primaryColor} />
                        </>
                    )}
                </div>

                {/* Team History */}
                {(() => {
                    // Use authoritative team history from "T" child code when available,
                    // otherwise fall back to deriving from aggregated seasons
                    type TeamHistoryEntry = { teamName: string; teamId: number; seasons: string[]; divisionName: string; latestSeasonIdx: number; isAffiliate: boolean };
                    const teamMap = new Map<string, TeamHistoryEntry>();

                    if (profile.teamHistory && profile.teamHistory.length > 0) {
                        // Build team history from the "T" child code data (authoritative source)
                        profile.teamHistory.forEach((th, idx) => {
                            const key = th.teamName;
                            if (!teamMap.has(key)) {
                                teamMap.set(key, { teamName: th.teamName, teamId: th.teamId, seasons: [], divisionName: th.divisionName, latestSeasonIdx: idx, isAffiliate: th.isAffiliate });
                            }
                            const entry = teamMap.get(key)!;
                            if (!entry.seasons.includes(th.seasonName)) {
                                entry.seasons.push(th.seasonName);
                            }
                            // If any entry for this team is non-affiliate, mark the whole team as non-affiliate
                            if (!th.isAffiliate) {
                                entry.isAffiliate = false;
                            }
                        });
                    } else {
                        // Fallback: derive from aggregated seasons
                        const allSeasons = profile.aggregatedSeasons;
                        allSeasons.forEach((s, idx) => {
                            const key = s.teamName;
                            if (!teamMap.has(key)) {
                                teamMap.set(key, { teamName: s.teamName, teamId: s.teamId, seasons: [], divisionName: s.divisionName, latestSeasonIdx: idx, isAffiliate: !!s.isAffiliate });
                            }
                            const entry = teamMap.get(key)!;
                            if (!entry.seasons.includes(s.seasonName)) {
                                entry.seasons.push(s.seasonName);
                            }
                            if (!entry.divisionName && s.divisionName) {
                                entry.divisionName = s.divisionName;
                            }
                            if (!s.isAffiliate) {
                                entry.isAffiliate = false;
                            }
                        });
                    }
                    const teams = Array.from(teamMap.values());
                    if (teams.length === 0) return null;

                    // Sort by most recent appearance first
                    teams.sort((a, b) => a.latestSeasonIdx - b.latestSeasonIdx);
                    const isMostRecent = (idx: number) => idx === 0;

                    return (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                                <h3 className="font-black text-lg text-gray-900 flex items-center gap-2">
                                    <Shield className="w-5 h-5" style={{ color: primaryColor }} />
                                    Team History
                                </h3>
                            </div>
                            <div className="p-6">
                                <div className="space-y-0">
                                    {teams.map((team, idx) => (
                                        <div key={team.teamId || idx} className="flex items-stretch gap-4">
                                            {/* Timeline connector */}
                                            <div className="flex flex-col items-center">
                                                <div
                                                    className={`flex-shrink-0 w-3 h-3 rounded-full mt-1.5 ${isMostRecent(idx) ? '' : 'bg-gray-300'}`}
                                                    style={isMostRecent(idx) ? { backgroundColor: primaryColor } : undefined}
                                                />
                                                {idx < teams.length - 1 && (
                                                    <div className="w-px flex-1 bg-gray-200 my-1" />
                                                )}
                                            </div>
                                            {/* Team info */}
                                            <div className={`flex-1 min-w-0 ${idx < teams.length - 1 ? 'pb-5' : 'pb-0'}`}>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className={`${isMostRecent(idx) ? 'font-black text-gray-900 text-base' : 'font-bold text-gray-600 text-sm'}`}>
                                                        {team.teamName}
                                                    </span>
                                                    {isMostRecent(idx) && (
                                                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: primaryColor }}>
                                                            Most Recent
                                                        </span>
                                                    )}
                                                    {team.isAffiliate && (
                                                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                                                            AP
                                                        </span>
                                                    )}
                                                </div>
                                                {team.divisionName && (
                                                    <div className="text-xs text-gray-400 font-semibold uppercase tracking-wide mt-0.5">{team.divisionName}</div>
                                                )}
                                                <div className={`mt-0.5 ${isMostRecent(idx) ? 'text-sm text-gray-500' : 'text-xs text-gray-400'}`}>
                                                    {team.seasons.join(', ')}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {/* Career Breakdown Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                        <h3 className="font-black text-lg text-gray-900 flex items-center gap-2">
                            <Trophy className="w-5 h-5" style={{ color: primaryColor }} />
                            Career Statistics by Season
                        </h3>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left whitespace-nowrap">
                            <thead className="bg-gray-100/50 text-gray-500 font-extrabold uppercase text-xs tracking-wider border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3">Season</th>
                                    <th className="px-6 py-3">Team</th>
                                    <th className="px-4 py-3 text-center">Type</th>
                                    <th className="px-4 py-3 text-center">GP</th>
                                    {isGoalieView ? (
                                        <>
                                            <th className="px-4 py-3 text-center">GD</th>
                                            <th className="px-4 py-3 text-center">MIN</th>
                                            <th className="px-4 py-3 text-center">SOG</th>
                                            <th className="px-4 py-3 text-center">GA</th>
                                            <th className="px-4 py-3 text-center">GAA</th>
                                            <th className="px-4 py-3 text-center">SV</th>
                                            <th className="px-4 py-3 text-center bg-gray-50 text-gray-900">SV%</th>
                                            <th className="px-4 py-3 text-center text-gray-400">G</th>
                                            <th className="px-4 py-3 text-center text-gray-400">A</th>
                                            <th className="px-4 py-3 text-center text-gray-400">PTS</th>
                                            <th className="px-4 py-3 text-center">PIM</th>
                                        </>
                                    ) : (
                                        <>
                                            <th className="px-4 py-3 text-center">G</th>
                                            <th className="px-4 py-3 text-center">A</th>
                                            <th className="px-4 py-3 text-center bg-gray-50 text-gray-900">PTS</th>
                                            <th className="px-4 py-3 text-center">PIM</th>
                                            <th className="px-4 py-3 text-center text-gray-400">PPG</th>
                                            <th className="px-4 py-3 text-center text-gray-400">SHG</th>
                                            <th className="px-4 py-3 text-center text-gray-400">GWG</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {activeSeasons.flatMap((season, idx) => {
                                    const rows = [];
                                    
                                    // Regular Season Row
                                    if (season.stats.regular) {
                                        rows.push(
                                            <StatsRow
                                                key={`${idx}-reg`}
                                                season={season.seasonName}
                                                team={season.teamName}
                                                divisionName={season.divisionName}
                                                type="Regular Season"
                                                stat={season.stats.regular}
                                                isGoalie={isGoalieView}
                                                primaryColor={primaryColor}
                                                isAffiliate={!!season.isAffiliate}
                                            />
                                        );
                                    }

                                    // Playoffs Row
                                    if (season.stats.playoffs) {
                                        rows.push(
                                            <StatsRow
                                                key={`${idx}-ply`}
                                                season={season.seasonName}
                                                team={season.teamName}
                                                divisionName={season.divisionName}
                                                type="Playoffs"
                                                stat={season.stats.playoffs}
                                                isGoalie={isGoalieView}
                                                primaryColor={primaryColor}
                                                isPlayoff
                                                isAffiliate={!!season.isAffiliate}
                                            />
                                        );
                                    }

                                    // Exhibition Row
                                    if (season.stats.exhibition) {
                                        rows.push(
                                            <StatsRow
                                                key={`${idx}-exh`}
                                                season={season.seasonName}
                                                team={season.teamName}
                                                divisionName={season.divisionName}
                                                type="Exhibition"
                                                stat={season.stats.exhibition}
                                                isGoalie={isGoalieView}
                                                primaryColor={primaryColor}
                                                isAffiliate={!!season.isAffiliate}
                                            />
                                        );
                                    }

                                    // Provincials Row
                                    if (season.stats.provincials) {
                                        rows.push(
                                            <StatsRow
                                                key={`${idx}-prov`}
                                                season={season.seasonName}
                                                team={season.teamName}
                                                divisionName={season.divisionName}
                                                type="Provincials"
                                                stat={season.stats.provincials}
                                                isGoalie={isGoalieView}
                                                primaryColor={primaryColor}
                                                isPlayoff
                                                isAffiliate={!!season.isAffiliate}
                                            />
                                        );
                                    }
                                    
                                    return rows;
                                })}
                            </tbody>
                            <tfoot className="bg-gray-50 border-t-2 border-gray-200 font-bold text-gray-900">
                                <tr>
                                    <td colSpan={3} className="px-6 py-4 text-right uppercase text-xs tracking-wider text-gray-500">Career Totals</td>
                                    <td className="px-4 py-4 text-center">{activeCareer?.gamesPlayed || 0}</td>
                                    {isGoalieView ? (() => {
                                        const sa = activeCareer?.shotsAgainst || ((activeCareer?.saves || 0) + (activeCareer?.goalsAgainst || 0));
                                        const svPct = sa > 0 ? ((activeCareer?.saves || 0) / sa * 100).toFixed(1) : '-';
                                        const gaa = (activeCareer?.minutes && activeCareer.minutes > 0) 
                                            ? ((activeCareer.goalsAgainst || 0) * 60 / activeCareer.minutes).toFixed(1) : '-';
                                        return (
                                        <>
                                            <td className="px-4 py-4 text-center">{activeCareer?.gamesDressed || 0}</td>
                                            <td className="px-4 py-4 text-center">{activeCareer?.minutes || 0}</td>
                                            <td className="px-4 py-4 text-center">{sa || 0}</td>
                                            <td className="px-4 py-4 text-center">{activeCareer?.goalsAgainst || 0}</td>
                                            <td className="px-4 py-4 text-center">{gaa}</td>
                                            <td className="px-4 py-4 text-center">{activeCareer?.saves || 0}</td>
                                            <td className="px-4 py-4 text-center font-black" style={{ color: primaryColor }}>{svPct}</td>
                                            <td className="px-4 py-4 text-center text-gray-500">{activeCareer?.goals || 0}</td>
                                            <td className="px-4 py-4 text-center text-gray-500">{activeCareer?.assists || 0}</td>
                                            <td className="px-4 py-4 text-center text-gray-500">{activeCareer?.points || 0}</td>
                                            <td className="px-4 py-4 text-center">{activeCareer?.pim || 0}</td>
                                        </>
                                        );
                                    })() : (
                                        <>
                                            <td className="px-4 py-4 text-center">{activeCareer?.goals || 0}</td>
                                            <td className="px-4 py-4 text-center">{activeCareer?.assists || 0}</td>
                                            <td className="px-4 py-4 text-center text-lg" style={{ color: primaryColor }}>{activeCareer?.points || 0}</td>
                                            <td className="px-4 py-4 text-center">{activeCareer?.pim || 0}</td>
                                            <td className="px-4 py-4 text-center">{activeCareer?.ppg || 0}</td>
                                            <td className="px-4 py-4 text-center">{activeCareer?.shg || 0}</td>
                                            <td className="px-4 py-4 text-center">{activeCareer?.gwg || 0}</td>
                                        </>
                                    )}
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>
          )}

          {/* Tab Content: Season Log */}
          {activeTab === 'season_log' && (
             <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                    <h3 className="font-black text-lg text-gray-900 flex items-center gap-2">
                        <Calendar className="w-5 h-5" style={{ color: primaryColor }} />
                        Game Log
                    </h3>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{profile.gameLog.length} Games Played</span>
                 </div>
                 
                 {profile.gameLog.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left whitespace-nowrap">
                            <thead className="bg-gray-100/50 text-gray-500 font-extrabold uppercase text-xs tracking-wider border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3">Date</th>
                                    <th className="px-6 py-3">Opponent</th>
                                    <th className="px-4 py-3 text-center">Score</th>
                                    {isGoalieView ? (
                                        <>
                                            <th className="px-4 py-3 text-center">MIN</th>
                                            <th className="px-4 py-3 text-center">SOG</th>
                                            <th className="px-4 py-3 text-center">GA</th>
                                            <th className="px-4 py-3 text-center">GAA</th>
                                            <th className="px-4 py-3 text-center">SV</th>
                                            <th className="px-4 py-3 text-center bg-gray-50 text-gray-900">SV%</th>
                                            <th className="px-4 py-3 text-center text-gray-400">G</th>
                                            <th className="px-4 py-3 text-center text-gray-400">A</th>
                                            <th className="px-4 py-3 text-center text-gray-400">PTS</th>
                                            <th className="px-4 py-3 text-center">PIM</th>
                                        </>
                                    ) : (
                                        <>
                                            <th className="px-4 py-3 text-center">G</th>
                                            <th className="px-4 py-3 text-center">A</th>
                                            <th className="px-4 py-3 text-center bg-gray-50 text-gray-900">PTS</th>
                                            <th className="px-4 py-3 text-center">PIM</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {profile.gameLog.map((game, idx) => (
                                    <tr key={game.gameId || idx} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-3 font-medium text-gray-900">
                                            {game.date ? new Date(game.date).toLocaleDateString() : '-'}
                                            {game.gameInfo && <div className="text-[10px] text-gray-400 font-normal">{game.gameInfo.split(' ').slice(0, 1).join('')}</div>}
                                        </td>
                                        <td className="px-6 py-3 text-gray-700">
                                            {game.opponent}
                                            <span className="ml-2 text-xs text-gray-400">({game.homeAway})</span>
                                        </td>
                                        <td className="px-4 py-3 text-center font-mono text-xs text-gray-500">
                                            {game.score}
                                        </td>
                                        
                                        {isGoalieView ? (() => {
                                            const gSA = game.shotsAgainst || ((game.saves || 0) + (game.goalsAgainst || 0));
                                            const gSvPct = gSA > 0 ? ((game.saves || 0) / gSA * 100).toFixed(1) : '-';
                                            const gGAA = (game.minutes && game.minutes > 0) 
                                                ? ((game.goalsAgainst || 0) * 60 / game.minutes).toFixed(1) : '-';
                                            return (
                                            <>
                                                <td className="px-4 py-3 text-center text-gray-500 text-xs font-mono">{game.minutes || 0}</td>
                                                <td className="px-4 py-3 text-center text-gray-700">{gSA || 0}</td>
                                                <td className="px-4 py-3 text-center text-gray-700">{game.goalsAgainst || 0}</td>
                                                <td className="px-4 py-3 text-center text-gray-700">{gGAA}</td>
                                                <td className="px-4 py-3 text-center text-gray-700">{game.saves || 0}</td>
                                                <td className="px-4 py-3 text-center font-black bg-gray-50/50" style={{ color: primaryColor }}>{gSvPct}</td>
                                                <td className="px-4 py-3 text-center text-gray-400 text-xs">{game.goals || 0}</td>
                                                <td className="px-4 py-3 text-center text-gray-400 text-xs">{game.assists || 0}</td>
                                                <td className="px-4 py-3 text-center text-gray-400 text-xs">{game.points || 0}</td>
                                                <td className="px-4 py-3 text-center text-gray-500">{game.pim || 0}</td>
                                            </>
                                            );
                                        })() : (
                                            <>
                                                <td className="px-4 py-3 text-center font-medium text-gray-700">{game.goals}</td>
                                                <td className="px-4 py-3 text-center font-medium text-gray-700">{game.assists}</td>
                                                <td className="px-4 py-3 text-center font-black bg-gray-50/50" style={{ color: primaryColor }}>
                                                    {game.points}
                                                </td>
                                                <td className="px-4 py-3 text-center text-gray-500">{game.pim}</td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                 ) : (
                    <div className="p-12 text-center text-gray-500">
                        <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <h4 className="text-lg font-bold text-gray-900 mb-2">No Game Log Available</h4>
                        <p className="max-w-md mx-auto">Detailed game statistics are not available for this player's history.</p>
                    </div>
                 )}
             </div>
          )}

          {/* Tab Content: Penalty Log */}
          {activeTab === 'penalty_log' && (
             <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                    <h3 className="font-black text-lg text-gray-900 flex items-center gap-2">
                        <Shield className="w-5 h-5" style={{ color: primaryColor }} />
                        Penalty Log
                    </h3>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{profile.penaltyLog.length} Penalties</span>
                 </div>
                 
                 {profile.penaltyLog.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left whitespace-nowrap">
                            <thead className="bg-gray-100/50 text-gray-500 font-extrabold uppercase text-xs tracking-wider border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3">Date</th>
                                    <th className="px-6 py-3">Opponent</th>
                                    <th className="px-6 py-3">Offense</th>
                                    <th className="px-4 py-3 text-center">Period</th>
                                    <th className="px-4 py-3 text-center">Start</th>
                                    <th className="px-4 py-3 text-center">End</th>
                                    <th className="px-4 py-3 text-center">Min</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {profile.penaltyLog.map((penalty, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-3 font-medium text-gray-900">
                                            {penalty.date ? new Date(penalty.date).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="px-6 py-3 text-gray-700">
                                            {penalty.opponent || '-'}
                                        </td>
                                        <td className="px-6 py-3 font-medium text-gray-800">
                                            {penalty.offense}
                                        </td>
                                        <td className="px-4 py-3 text-center text-gray-500">
                                            {penalty.period}
                                        </td>
                                        <td className="px-4 py-3 text-center text-gray-700 font-mono text-xs">
                                            {penalty.time}
                                        </td>
                                        <td className="px-4 py-3 text-center text-gray-500 font-mono text-xs">
                                            {calculatePenaltyEnd(penalty.time, penalty.minutes, penalty.timeOut || '-')}
                                        </td>
                                        <td className="px-4 py-3 text-center font-bold text-gray-900">
                                            {penalty.minutes}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                 ) : (
                    <div className="p-12 text-center text-gray-500">
                        <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <h4 className="text-lg font-bold text-gray-900 mb-2">No Penalties Recorded</h4>
                        <p className="max-w-md mx-auto">This player has no penalties recorded for the selected season.</p>
                    </div>
                 )}
             </div>
          )}

        </div>
      </main>
      
      <Footer />
    </div>
  );
}

// Sub-components

function StatCard({ label, value, icon, highlight, color }: { label: string, value: any, icon?: React.ReactNode, highlight?: boolean, color: string }) {
  return (
    <div className={`rounded-xl p-4 shadow-sm border transition-all hover:-translate-y-1 bg-white ${
      highlight ? 'ring-1 ring-inset' : 'border-gray-100 hover:border-gray-200'
    }`}
    style={highlight ? { borderColor: `${color}40`, boxShadow: `0 4px 12px ${color}15` } : undefined}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
        {icon && <span className="text-gray-300">{icon}</span>}
      </div>
      <div className="text-3xl font-black" style={{ color: highlight ? color : '#111827' }}>
        {value || 0}
      </div>
    </div>
  );
}

function StatsRow({ season, team, divisionName, type, stat, isGoalie, primaryColor, isPlayoff, isAffiliate }: any) {
    const rowClass = isPlayoff ? "bg-amber-50/40 hover:bg-amber-50/80" : "hover:bg-gray-50";

    // Local resolver helpers - same pattern as usePlayerProfile to handle API field name variations
    const rn = (obj: any, ...fields: string[]): number => {
        for (const f of fields) {
            if (obj[f] !== undefined && obj[f] !== null) return Number(obj[f]) || 0;
        }
        return 0;
    };

    return (
        <tr className={`transition-colors border-b border-gray-50 last:border-0 ${rowClass}`}>
            <td className="px-6 py-3 font-bold text-gray-900">
                {season}
            </td>
            <td className="px-6 py-3">
                <div className="font-medium text-gray-700">
                    {team}
                    {isAffiliate && (
                        <span className="ml-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">AP</span>
                    )}
                </div>
                <div className="text-[10px] text-gray-400 uppercase tracking-wide">{divisionName || ''}</div>
            </td>
            <td className="px-4 py-3 text-center">
                <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${
                    isPlayoff ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'
                }`}>
                    {type}
                </span>
            </td>
            <td className="px-4 py-3 text-center font-bold text-gray-900">{rn(stat, 'GamesPlayed')}</td>
            
            {isGoalie ? (() => {
                const gd = rn(stat, 'GamesDressed', 'GD');
                const min = rn(stat, 'MinutesPlayed', 'MinPlayed', 'Min');
                const ga = rn(stat, 'GoalsAgainst', 'GA');
                const sv = rn(stat, 'SaversTotal', 'Saves', 'ShotsStopped');
                // Don't use 'SOG' here — that's the SKATER's shots on goal, not shots against the goalie
                const sa = rn(stat, 'ShotsAgainst', 'ShotsTotal', 'TotalShots') || (sv + ga);
                const svPct = sa > 0 ? ((sv / sa) * 100).toFixed(1) : '-';
                // Try pre-computed GAA first, then calculate from GA/MIN
                const preGAA = rn(stat, 'GoalsAgainstAverage', 'GAA');
                const gaa = preGAA > 0 ? preGAA.toFixed(2) : (min > 0 ? (ga * 60 / min).toFixed(2) : '-');
                const g = rn(stat, 'Goals', 'G');
                const a = rn(stat, 'Assists', 'A');
                const pts = rn(stat, 'Points', 'Pts') || (g + a);
                const pim = rn(stat, 'PenaltyMin', 'PIM');
                return (
                <>
                    <td className="px-4 py-3 text-center text-gray-500">{gd}</td>
                    <td className="px-4 py-3 text-center text-gray-500 text-xs font-mono">{min}</td>
                    <td className="px-4 py-3 text-center text-gray-700">{sa}</td>
                    <td className="px-4 py-3 text-center text-gray-700">{ga}</td>
                    <td className="px-4 py-3 text-center text-gray-700">{gaa}</td>
                    <td className="px-4 py-3 text-center text-gray-700">{sv}</td>
                    <td className="px-4 py-3 text-center font-black bg-gray-50/50" style={{ color: primaryColor }}>{svPct}</td>
                    <td className="px-4 py-3 text-center text-gray-400 text-xs">{g || '-'}</td>
                    <td className="px-4 py-3 text-center text-gray-400 text-xs">{a || '-'}</td>
                    <td className="px-4 py-3 text-center text-gray-400 text-xs">{pts || '-'}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{pim}</td>
                </>
                );
            })() : (
                <>
                    <td className="px-4 py-3 text-center font-medium text-gray-700">{rn(stat, 'Goals', 'G')}</td>
                    <td className="px-4 py-3 text-center font-medium text-gray-700">{rn(stat, 'Assists', 'A')}</td>
                    <td className="px-4 py-3 text-center font-black text-lg bg-gray-50/50" style={{ color: primaryColor }}>
                        {rn(stat, 'Points', 'Pts') || (rn(stat, 'Goals', 'G') + rn(stat, 'Assists', 'A'))}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">{rn(stat, 'PenaltyMin', 'PIM')}</td>
                    <td className="px-4 py-3 text-center text-gray-400 text-xs">{rn(stat, 'PPGoals') || '-'}</td>
                    <td className="px-4 py-3 text-center text-gray-400 text-xs">{rn(stat, 'SHGoals') || '-'}</td>
                    <td className="px-4 py-3 text-center text-gray-400 text-xs">{rn(stat, 'GameWinningGoals', 'GWG') || '-'}</td>
                </>
            )}
        </tr>
    );
}