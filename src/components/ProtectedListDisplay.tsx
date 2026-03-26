import React, { useState } from 'react';
import { useProtectedList, TeamProtectedList } from '../hooks/useProtectedList';
import {
  Shield,
  RefreshCw,
  AlertCircle,
  Search,
  Loader2,
  ChevronDown,
  ChevronUp,
  User,
} from 'lucide-react';
import { Card } from './ui/card';
import { SubdivisionFilter } from './SubdivisionFilter';

interface ProtectedListDisplayProps {
  divisionName: string;
}

function TeamProtectedCard({ team, defaultExpanded }: { team: TeamProtectedList; defaultExpanded: boolean }) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  // Compute the most recent revised date from player dates
  const revisedDate = (() => {
    if (team.players.length === 0) return null;
    let latest = '';
    for (const p of team.players) {
      if (p.dateRaw && p.dateRaw > latest) latest = p.dateRaw;
    }
    if (!latest) return null;
    try {
      return new Date(latest).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return latest;
    }
  })();

  return (
    <Card className="border border-gray-200 shadow-sm overflow-hidden">
      {/* Team Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white hover:from-gray-100 hover:to-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          {team.teamLogoUrl ? (
            <img
              src={team.teamLogoUrl}
              alt={`${team.teamName} logo`}
              className="w-9 h-9 object-contain rounded-lg border border-gray-200 bg-white shrink-0"
            />
          ) : (
            <div className="p-2 rounded-lg bg-purple-100 text-purple-700 border border-purple-200">
              <Shield className="w-4 h-4" />
            </div>
          )}
          <div>
            <h4 className="font-bold text-gray-900 text-base" style={{ fontFamily: 'var(--font-secondary)' }}>
              {team.teamName}
            </h4>
            <p className="text-xs text-gray-500 font-medium">
              {team.players.length} player{team.players.length !== 1 ? 's' : ''} protected
              {revisedDate && (
                <span className="ml-2 text-gray-400">· Revised {revisedDate}</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
            {team.players.length}
          </span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </button>

      {/* Player List */}
      {expanded && (
        <div className="border-t border-gray-200">
          {team.players.length === 0 ? (
            <div className="p-6 text-center text-gray-500 italic text-sm">
              No players listed
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {team.players.map((player, idx) => (
                <div
                  key={player.id}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50/80 transition-colors"
                >
                  <span className="text-xs font-bold text-gray-400 w-6 text-right shrink-0">
                    {idx + 1}.
                  </span>
                  {player.jerseyNumber ? (
                    <span className="text-xs font-bold text-purple-600 bg-purple-50 border border-purple-200 rounded px-1.5 py-0.5 w-8 text-center shrink-0">
                      {player.jerseyNumber}
                    </span>
                  ) : (
                    <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  )}
                  <span className="font-bold text-sm text-gray-900 flex-1">
                    {player.playerName}
                  </span>
                  {player.position && (
                    <span className="text-xs text-gray-500 font-medium hidden sm:inline">
                      {player.position}
                    </span>
                  )}
                  {player.comment && (
                    <span className="text-xs text-gray-500 max-w-[200px] truncate hidden sm:inline" title={player.comment}>
                      {player.comment}
                    </span>
                  )}
                  {player.date && (
                    <span className="text-xs text-gray-400 shrink-0 hidden sm:inline">
                      {player.date}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

export function ProtectedListDisplay({ divisionName }: ProtectedListDisplayProps) {
  const {
    teams,
    totalPlayers,
    loading,
    error,
    selectedSubdivision,
    setSelectedSubdivision,
    availableSubdivisions,
    hasSubdivisions,
    refetch,
  } = useProtectedList(divisionName);

  const [searchQuery, setSearchQuery] = useState('');

  // Filter teams/players by search
  const filteredTeams = searchQuery.trim()
    ? teams
        .map(team => ({
          ...team,
          players: team.players.filter(p =>
            p.playerName.toLowerCase().includes(searchQuery.toLowerCase())
          ),
        }))
        .filter(team =>
          team.teamName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          team.players.length > 0
        )
    : teams;

  const filteredPlayerCount = filteredTeams.reduce((sum, t) => sum + t.players.length, 0);

  if (loading) {
    return (
      <Card className="border border-gray-200 shadow-sm">
        <div className="p-8 flex flex-col items-center justify-center min-h-[300px]">
          <Loader2 className="w-10 h-10 text-purple-600 animate-spin mb-4" />
          <p className="text-sm font-bold text-gray-500">Loading protected lists...</p>
          <p className="text-xs text-gray-400 mt-1">Fetching from SportzSoft API</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border border-red-200 shadow-sm bg-red-50">
        <div className="p-8 flex flex-col items-center justify-center min-h-[200px]">
          <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
          <h3 className="text-lg font-bold text-red-900 mb-1">Error Loading Protected Lists</h3>
          <p className="text-sm text-red-700 mb-4 max-w-md text-center">{error.message}</p>
          <button
            onClick={refetch}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-bold text-sm hover:bg-red-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border border-gray-200 shadow-sm bg-gradient-to-br from-white to-gray-50">
        <div className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2" style={{ fontFamily: 'var(--font-secondary)' }}>
                <Shield className="w-5 h-5 text-purple-600" />
                Protected Lists
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {filteredTeams.length} team{filteredTeams.length !== 1 ? 's' : ''} &middot; {filteredPlayerCount} player{filteredPlayerCount !== 1 ? 's' : ''} for {divisionName}
              </p>
            </div>
            <button
              onClick={refetch}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors self-start"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-3 mt-4">
            {/* Subdivision filter */}
            {hasSubdivisions && (
              <SubdivisionFilter
                availableSubdivisions={availableSubdivisions}
                selectedSubdivision={selectedSubdivision}
                setSelectedSubdivision={setSelectedSubdivision}
                accentColor="#7c3aed"
              />
            )}

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search players or teams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Empty State */}
      {filteredTeams.length === 0 && (
        <Card className="border border-gray-200 shadow-sm">
          <div className="p-12 text-center">
            <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h4 className="text-lg font-bold text-gray-900 mb-2">No Protected Lists Found</h4>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              {searchQuery
                ? `No players or teams matching "${searchQuery}" were found.`
                : `No protected list data is available for ${divisionName}.`
              }
            </p>
            <div className="flex items-center justify-center gap-3 mt-4">
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-sm font-bold text-purple-600 hover:underline">
                  Clear search
                </button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Team Protected Lists */}
      {filteredTeams.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 items-start">
          {filteredTeams.map(team => (
            <TeamProtectedCard
              key={team.teamName}
              team={team}
              defaultExpanded={filteredTeams.length <= 6}
            />
          ))}
        </div>
      )}
    </div>
  );
}