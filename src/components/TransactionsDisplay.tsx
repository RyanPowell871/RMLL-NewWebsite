import React, { useState } from 'react';
import { useTransactions, TransactionEntry } from '../hooks/useTransactions';
import { 
  ArrowRightLeft, 
  Filter, 
  RefreshCw, 
  AlertCircle, 
  Shield, 
  UserMinus, 
  UserPlus, 
  FileText,
  ChevronDown,
  ChevronUp,
  Search,
  Calendar,
  Loader2,
  Users
} from 'lucide-react';
import { Card } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { SubdivisionFilter } from './SubdivisionFilter';

interface TransactionsDisplayProps {
  divisionName: string;
}

// Transaction type styling based on type code or type name
const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; bgColor: string; borderColor: string }> = {
  T: { 
    icon: <ArrowRightLeft className="w-3.5 h-3.5" />, 
    color: 'text-blue-700', 
    bgColor: 'bg-blue-50', 
    borderColor: 'border-blue-200' 
  },
  Trade: { 
    icon: <ArrowRightLeft className="w-3.5 h-3.5" />, 
    color: 'text-blue-700', 
    bgColor: 'bg-blue-50', 
    borderColor: 'border-blue-200' 
  },
  P: { 
    icon: <Shield className="w-3.5 h-3.5" />, 
    color: 'text-purple-700', 
    bgColor: 'bg-purple-50', 
    borderColor: 'border-purple-200' 
  },
  Protected: { 
    icon: <Shield className="w-3.5 h-3.5" />, 
    color: 'text-purple-700', 
    bgColor: 'bg-purple-50', 
    borderColor: 'border-purple-200' 
  },
  R: { 
    icon: <UserMinus className="w-3.5 h-3.5" />, 
    color: 'text-red-700', 
    bgColor: 'bg-red-50', 
    borderColor: 'border-red-200' 
  },
  Release: { 
    icon: <UserMinus className="w-3.5 h-3.5" />, 
    color: 'text-red-700', 
    bgColor: 'bg-red-50', 
    borderColor: 'border-red-200' 
  },
  A: { 
    icon: <UserPlus className="w-3.5 h-3.5" />, 
    color: 'text-green-700', 
    bgColor: 'bg-green-50', 
    borderColor: 'border-green-200' 
  },
};

const DEFAULT_TYPE_CONFIG = {
  icon: <FileText className="w-3.5 h-3.5" />,
  color: 'text-gray-700',
  bgColor: 'bg-gray-50',
  borderColor: 'border-gray-200'
};

function getTypeConfig(typeCode: string, typeName: string) {
  return TYPE_CONFIG[typeCode] || TYPE_CONFIG[typeName] || DEFAULT_TYPE_CONFIG;
}

function TransactionCard({ entry }: { entry: TransactionEntry }) {
  const [expanded, setExpanded] = useState(false);
  const config = getTypeConfig(entry.typeCode, entry.typeName);
  const hasLongComment = entry.comment.length > 120;

  return (
    <div 
      className={`border rounded-lg p-4 transition-all hover:shadow-md ${config.borderColor} ${config.bgColor}`}
    >
      <div className="flex items-start gap-3">
        {/* Type Icon */}
        <div className={`shrink-0 mt-0.5 p-2 rounded-lg ${config.color} bg-white shadow-sm border ${config.borderColor}`}>
          {config.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className={`inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${config.color} bg-white border ${config.borderColor}`}>
              {config.icon}
              {entry.typeName}
            </span>
            <span className="text-xs text-gray-500 font-medium">
              {entry.date}
            </span>
            {entry.status && entry.status !== 'Completed' && (
              <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                {entry.status}
              </span>
            )}
          </div>

          {/* Teams involved */}
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            <span className="font-bold text-sm text-gray-900">{entry.teamName}</span>
            {entry.tradeWithTeam && (
              <>
                <ArrowRightLeft className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="font-bold text-sm text-gray-900">{entry.tradeWithTeam}</span>
              </>
            )}
          </div>

          {/* Player name if available */}
          {entry.playerName && (
            <div className="text-sm text-gray-700 mb-1.5 font-medium">
              Player: {entry.playerName}
            </div>
          )}

          {/* Transaction details/comment */}
          {entry.comment && (
            <div className="relative">
              <p className={`text-sm text-gray-600 leading-relaxed ${!expanded && hasLongComment ? 'line-clamp-2' : ''}`}>
                {entry.comment}
              </p>
              {hasLongComment && (
                <button 
                  onClick={() => setExpanded(!expanded)} 
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 mt-1 flex items-center gap-1"
                >
                  {expanded ? (
                    <>Show less <ChevronUp className="w-3 h-3" /></>
                  ) : (
                    <>Show more <ChevronDown className="w-3 h-3" /></>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TransactionTableRow({ entry }: { entry: TransactionEntry }) {
  const config = getTypeConfig(entry.typeCode, entry.typeName);

  return (
    <tr className="hover:bg-gray-50/80 transition-colors border-b border-gray-100 last:border-0">
      <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
        {entry.date}
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${config.color} ${config.bgColor} border ${config.borderColor}`}>
          {config.icon}
          {entry.typeName}
        </span>
      </td>
      <td className="px-4 py-3 text-sm font-bold text-gray-900 whitespace-nowrap">
        {entry.teamName}
      </td>
      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
        {entry.tradeWithTeam || '-'}
      </td>
      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
        {entry.playerName || '-'}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600 max-w-md">
        <div className="line-clamp-2" title={entry.comment}>
          {entry.comment || '-'}
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        {entry.status && (
          <span className={`text-xs font-bold px-2 py-1 rounded ${
            entry.status === 'Completed' 
              ? 'text-green-700 bg-green-50 border border-green-200' 
              : 'text-amber-700 bg-amber-50 border border-amber-200'
          }`}>
            {entry.status}
          </span>
        )}
      </td>
    </tr>
  );
}

export function TransactionsDisplay({ divisionName }: TransactionsDisplayProps) {
  const { 
    transactions, 
    loading, 
    error, 
    typeFilter, 
    setTypeFilter, 
    availableTypes, 
    totalBeforeTypeFilter,
    teamFilter,
    setTeamFilter,
    availableTeams,
    totalBeforeTeamFilter,
    selectedSeason,
    setSelectedSeason,
    seasonOptions,
    seasonsLoading,
    selectedSubdivision,
    setSelectedSubdivision,
    availableSubdivisions,
    hasSubdivisions,
    refetch 
  } = useTransactions(divisionName);

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Apply search filter on top of type filter
  const filteredTransactions = searchQuery.trim()
    ? transactions.filter(t => {
        const q = searchQuery.toLowerCase();
        return (
          (t.teamName && t.teamName.toLowerCase().includes(q)) ||
          (t.tradeWithTeam && t.tradeWithTeam.toLowerCase().includes(q)) ||
          (t.playerName && t.playerName.toLowerCase().includes(q)) ||
          (t.comment && t.comment.toLowerCase().includes(q)) ||
          (t.typeName && t.typeName.toLowerCase().includes(q))
        );
      })
    : transactions;

  // Group transactions by month/year for card view
  const groupedByMonth: Record<string, TransactionEntry[]> = {};
  filteredTransactions.forEach(t => {
    const monthKey = t.dateRaw 
      ? new Date(t.dateRaw).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
      : 'Unknown Date';
    if (!groupedByMonth[monthKey]) groupedByMonth[monthKey] = [];
    groupedByMonth[monthKey].push(t);
  });

  if (loading || seasonsLoading) {
    return (
      <Card className="border border-gray-200 shadow-sm">
        <div className="p-8 flex flex-col items-center justify-center min-h-[300px]">
          <Loader2 className="w-10 h-10 text-[#013fac] animate-spin mb-4" />
          <p className="text-sm font-bold text-gray-500">Loading transactions...</p>
          <p className="text-xs text-gray-400 mt-1">{seasonsLoading ? 'Loading season data...' : 'Fetching from SportzSoft API'}</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border border-red-200 shadow-sm bg-red-50">
        <div className="p-8 flex flex-col items-center justify-center min-h-[200px]">
          <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
          <h3 className="text-lg font-bold text-red-900 mb-1">Error Loading Transactions</h3>
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
                <ArrowRightLeft className="w-5 h-5 text-[#013fac]" />
                Transactions
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''} for {divisionName}
                {selectedSeason !== 'all' && (
                  <span className="ml-1 text-gray-400">
                    ({seasonOptions.find(s => s.value === selectedSeason)?.label || selectedSeason})
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={refetch}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex flex-col gap-3 mt-4">
            {/* Subdivision filter (for divisions with subdivisions like Jr B Tier I, Jr B Tier II, Sr C) */}
            {hasSubdivisions && (
              <SubdivisionFilter
                availableSubdivisions={availableSubdivisions}
                selectedSubdivision={selectedSubdivision}
                setSelectedSubdivision={setSelectedSubdivision}
              />
            )}

            {/* Season + Team + Search row */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Season Selector */}
              <div className="w-full sm:w-48 shrink-0">
                <Select 
                  value={selectedSeason} 
                  onValueChange={setSelectedSeason}
                  disabled={seasonsLoading}
                >
                  <SelectTrigger className="w-full bg-white font-bold text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#013fac]" />
                      <SelectValue placeholder={seasonsLoading ? "Loading..." : "Select Season"} />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {seasonOptions.map(option => (
                      <SelectItem key={option.value} value={option.value} className="font-bold">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Team Selector */}
              {availableTeams.length > 0 && (
                <div className="w-full sm:w-56 shrink-0">
                  <Select 
                    value={teamFilter} 
                    onValueChange={setTeamFilter}
                  >
                    <SelectTrigger className="w-full bg-white font-bold text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-[#013fac]" />
                        <SelectValue placeholder="All Teams" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="font-bold">
                        All Teams ({totalBeforeTypeFilter})
                      </SelectItem>
                      {availableTeams.map(team => (
                        <SelectItem key={team.name} value={team.name} className="font-bold">
                          {team.name} ({team.count})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search teams, players, details..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#013fac] focus:border-[#013fac] bg-white"
                />
              </div>

              {/* View Mode Toggle */}
              <div className="flex border border-gray-300 rounded-lg overflow-hidden shrink-0 self-start">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-3 py-2 text-xs font-bold transition-colors ${
                    viewMode === 'cards' ? 'bg-[#013fac] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Cards
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-2 text-xs font-bold transition-colors border-l border-gray-300 ${
                    viewMode === 'table' ? 'bg-[#013fac] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Table
                </button>
              </div>
            </div>

            {/* Type Filter row */}
            {availableTypes.length > 0 && (
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400 shrink-0" />
                <div className="flex gap-1.5 flex-wrap">
                  <button
                    onClick={() => setTypeFilter('all')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all ${
                      typeFilter === 'all'
                        ? 'bg-[#013fac] text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                    }`}
                  >
                    All ({totalBeforeTypeFilter})
                  </button>
                  {availableTypes.map(type => {
                    const config = getTypeConfig(type.id, type.name);
                    return (
                      <button
                        key={type.id}
                        onClick={() => setTypeFilter(typeFilter === type.id ? 'all' : type.id)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all flex items-center gap-1.5 ${
                          typeFilter === type.id
                            ? `${config.color} ${config.bgColor} border ${config.borderColor} shadow-sm ring-1 ring-current/20`
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                        }`}
                      >
                        {config.icon}
                        {type.name}
                        <span className="opacity-60">({type.count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Empty State */}
      {filteredTransactions.length === 0 && (
        <Card className="border border-gray-200 shadow-sm">
          <div className="p-12 text-center">
            <ArrowRightLeft className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h4 className="text-lg font-bold text-gray-900 mb-2">No Transactions Found</h4>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              {searchQuery 
                ? `No transactions matching "${searchQuery}" were found.`
                : teamFilter !== 'all'
                  ? `No transactions found for ${teamFilter} in the ${seasonOptions.find(s => s.value === selectedSeason)?.label || selectedSeason} season.`
                  : `No transactions have been recorded for ${divisionName} in the ${seasonOptions.find(s => s.value === selectedSeason)?.label || selectedSeason} season.`
              }
            </p>
            <div className="flex items-center justify-center gap-3 mt-4">
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="text-sm font-bold text-[#013fac] hover:underline"
                >
                  Clear search
                </button>
              )}
              {teamFilter !== 'all' && (
                <button 
                  onClick={() => setTeamFilter('all')}
                  className="text-sm font-bold text-[#013fac] hover:underline"
                >
                  Show all teams
                </button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Card View */}
      {viewMode === 'cards' && filteredTransactions.length > 0 && (
        <div className="space-y-6">
          {Object.entries(groupedByMonth).map(([month, entries]) => (
            <div key={month}>
              <div className="flex items-center gap-3 mb-3">
                <h4 className="text-sm font-black text-gray-500 uppercase tracking-wider">{month}</h4>
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="text-xs font-bold text-gray-400">{entries.length}</span>
              </div>
              <div className="space-y-3">
                {entries.map(entry => (
                  <TransactionCard key={entry.id} entry={entry} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && filteredTransactions.length > 0 && (
        <Card className="border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-gray-100/80 text-gray-500 font-extrabold uppercase text-xs tracking-wider border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Team</th>
                  <th className="px-4 py-3">With</th>
                  <th className="px-4 py-3">Player</th>
                  <th className="px-4 py-3">Details</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map(entry => (
                  <TransactionTableRow key={entry.id} entry={entry} />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}