import { useState, useEffect, useCallback } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Badge } from '../ui/badge';
import {
  Plus, Trash2, Edit2, Save, Upload, Search, AlertTriangle, Gavel, Calendar,
  DollarSign, Users, ChevronDown, ChevronRight, Loader2, X, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import {
  type Suspension, type SeasonData, type AssociationStatus,
  SEASON_SUSPENSIONS,
} from '../league-info/suspensions-data';

const API = `https://${projectId}.supabase.co/functions/v1/make-server-9a1ba23f`;
const headers = { 'Authorization': `Bearer ${publicAnonKey}`, 'Content-Type': 'application/json' };

/* ─── Empty suspension template ─── */
function emptySuspension(): Suspension & { id?: string } {
  return {
    name: '',
    date: '',
    sortDate: new Date().toISOString().split('T')[0],
    team: '',
    division: '',
    offense: '',
    opponent: '',
    penalties: { fine: '', suspension: '', gamesDetail: '' },
    isTeamFine: false,
    isCoach: false,
    role: '',
    isRuling: false,
  };
}

/* ─── Format a date string for display ─── */
function formatDateForInput(sortDate: string): string {
  return sortDate || '';
}

/* ═══════════════════════════════════════════════════════════════
 *  SUSPENSION FORM
 * ═══════════════════════════════════════════════════════════════ */

function SuspensionForm({
  entry,
  onChange,
  onSave,
  onCancel,
  saving,
  title,
}: {
  entry: Suspension & { id?: string };
  onChange: (e: Suspension & { id?: string }) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  title: string;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs font-semibold">Name *</Label>
          <Input
            value={entry.name}
            onChange={(e) => onChange({ ...entry, name: e.target.value })}
            placeholder="Player name or team name"
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-xs font-semibold">Team *</Label>
          <Input
            value={entry.team}
            onChange={(e) => onChange({ ...entry, team: e.target.value })}
            placeholder="Team name"
            className="mt-1"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <Label className="text-xs font-semibold">Display Date *</Label>
          <Input
            value={entry.date}
            onChange={(e) => onChange({ ...entry, date: e.target.value })}
            placeholder="e.g. July 9th, 2025"
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-xs font-semibold">Sort Date *</Label>
          <Input
            type="date"
            value={formatDateForInput(entry.sortDate)}
            onChange={(e) => onChange({ ...entry, sortDate: e.target.value })}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-xs font-semibold">Division</Label>
          <Input
            value={entry.division || ''}
            onChange={(e) => onChange({ ...entry, division: e.target.value })}
            placeholder="e.g. Jr. B Tier II"
            className="mt-1"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs font-semibold">Offense *</Label>
          <Input
            value={entry.offense}
            onChange={(e) => onChange({ ...entry, offense: e.target.value })}
            placeholder="e.g. Match Penalty — Fighting"
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-xs font-semibold">Opponent</Label>
          <Input
            value={entry.opponent || ''}
            onChange={(e) => onChange({ ...entry, opponent: e.target.value })}
            placeholder="Opposing team"
            className="mt-1"
          />
        </div>
      </div>

      {/* Penalties */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-3">
        <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider">Penalties</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs font-semibold">Fine</Label>
            <Input
              value={entry.penalties?.fine || ''}
              onChange={(e) => onChange({ ...entry, penalties: { ...entry.penalties, fine: e.target.value } })}
              placeholder="e.g. $200 + $50"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold">Suspension</Label>
            <Input
              value={entry.penalties?.suspension || ''}
              onChange={(e) => onChange({ ...entry, penalties: { ...entry.penalties, suspension: e.target.value } })}
              placeholder="e.g. 3 games"
              className="mt-1"
            />
          </div>
        </div>
        <div>
          <Label className="text-xs font-semibold">Games Detail / Notes</Label>
          <textarea
            value={entry.penalties?.gamesDetail || ''}
            onChange={(e) => onChange({ ...entry, penalties: { ...entry.penalties, gamesDetail: e.target.value } })}
            placeholder="Detailed description of the penalty..."
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm h-20 resize-y"
          />
        </div>
      </div>

      {/* Flags */}
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={entry.isTeamFine || false}
            onChange={(e) => onChange({ ...entry, isTeamFine: e.target.checked })}
            className="rounded border-gray-300"
          />
          Team Fine
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={entry.isCoach || false}
            onChange={(e) => onChange({ ...entry, isCoach: e.target.checked })}
            className="rounded border-gray-300"
          />
          Coach
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={entry.isRuling || false}
            onChange={(e) => onChange({ ...entry, isRuling: e.target.checked })}
            className="rounded border-gray-300"
          />
          Ruling / Non-standard
        </label>
      </div>

      {entry.isCoach && (
        <div>
          <Label className="text-xs font-semibold">Coach Role</Label>
          <Input
            value={entry.role || ''}
            onChange={(e) => onChange({ ...entry, role: e.target.value })}
            placeholder="e.g. Head Coach, Assistant Coach"
            className="mt-1"
          />
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2 border-t">
        <Button variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={onSave} disabled={saving || !entry.name || !entry.team || !entry.offense} className="bg-[#013fac] hover:bg-[#0149c9]">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save
        </Button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
 *  MAIN MANAGER
 * ═══════════════════════════════════════════════════════════════ */

export function SuspensionsManager() {
  const [seasons, setSeasons] = useState<number[]>([]);
  const [activeSeason, setActiveSeason] = useState<number | null>(null);
  const [seasonData, setSeasonData] = useState<SeasonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSeason, setLoadingSeason] = useState(false);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [search, setSearch] = useState('');
  const [activeListTab, setActiveListTab] = useState<'suspensions' | 'carryovers' | 'associations'>('suspensions');

  // Modal state
  const [editingEntry, setEditingEntry] = useState<(Suspension & { id?: string }) | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingType, setEditingType] = useState<'suspension' | 'carryover'>('suspension');

  // New season modal
  const [showNewSeason, setShowNewSeason] = useState(false);
  const [newSeasonYear, setNewSeasonYear] = useState(new Date().getFullYear() + 1);

  const loadSeasons = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/cms/suspensions/seasons`, { headers });
      const data = await res.json();
      if (data.success) {
        setSeasons(data.seasons);
        if (data.seasons.length > 0 && !activeSeason) {
          setActiveSeason(data.seasons[0]);
        }
      }
    } catch (error) {
      console.error('Error loading seasons:', error);
      toast.error('Failed to load suspension seasons');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSeasonData = useCallback(async (year: number) => {
    try {
      setLoadingSeason(true);
      const res = await fetch(`${API}/cms/suspensions/season/${year}`, { headers });
      const data = await res.json();
      if (data.success) {
        setSeasonData(data.data);
      }
    } catch (error) {
      console.error(`Error loading season ${year}:`, error);
      toast.error(`Failed to load season ${year}`);
    } finally {
      setLoadingSeason(false);
    }
  }, []);

  useEffect(() => { loadSeasons(); }, [loadSeasons]);
  useEffect(() => { if (activeSeason) loadSeasonData(activeSeason); }, [activeSeason, loadSeasonData]);

  /* ─── Seed from hardcoded data ─── */
  const seedFromHardcoded = async () => {
    if (!confirm('This will import all hardcoded suspension data into the database. Existing data for matching seasons will be overwritten. Continue?')) return;

    try {
      setSeeding(true);
      let seeded = 0;

      for (const season of SEASON_SUSPENSIONS) {
        const res = await fetch(`${API}/cms/suspensions/season/${season.season}`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            suspensions: season.suspensions.map((s, i) => ({ ...s, id: `seed-${season.season}-s-${i}` })),
            carryovers: (season.carryovers || []).map((s, i) => ({ ...s, id: `seed-${season.season}-c-${i}` })),
            associationStatuses: season.associationStatuses || [],
          }),
        });
        if (res.ok) seeded++;
      }

      toast.success(`Seeded ${seeded} season(s) from hardcoded data`);
      await loadSeasons();
      if (activeSeason) await loadSeasonData(activeSeason);
    } catch (error) {
      console.error('Error seeding:', error);
      toast.error('Failed to seed data');
    } finally {
      setSeeding(false);
    }
  };

  /* ─── Create new season ─── */
  const createSeason = async () => {
    try {
      const res = await fetch(`${API}/cms/suspensions/create-season`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ season: newSeasonYear }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Season ${newSeasonYear} created`);
        setShowNewSeason(false);
        await loadSeasons();
        setActiveSeason(newSeasonYear);
      } else {
        toast.error(data.error || 'Failed to create season');
      }
    } catch (error) {
      console.error('Error creating season:', error);
      toast.error('Failed to create season');
    }
  };

  /* ─── Save entry ─── */
  const handleSaveEntry = async () => {
    if (!editingEntry || !activeSeason) return;
    try {
      setSaving(true);
      const res = await fetch(`${API}/cms/suspensions/entry`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          season: activeSeason,
          entry: editingEntry,
          entryType: editingType,
          entryIndex: editingIndex,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSeasonData(data.data);
        setEditingEntry(null);
        setEditingIndex(null);
        toast.success(editingIndex !== null ? 'Entry updated' : 'Entry added');
      } else {
        toast.error(data.error || 'Failed to save');
      }
    } catch (error) {
      console.error('Error saving entry:', error);
      toast.error('Failed to save entry');
    } finally {
      setSaving(false);
    }
  };

  /* ─── Delete entry ─── */
  const handleDeleteEntry = async (type: 'suspension' | 'carryover', index: number, name: string) => {
    if (!confirm(`Delete suspension for "${name}"? This cannot be undone.`)) return;
    if (!activeSeason) return;

    try {
      const res = await fetch(`${API}/cms/suspensions/entry`, {
        method: 'DELETE',
        headers,
        body: JSON.stringify({
          season: activeSeason,
          entryType: type,
          entryIndex: index,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSeasonData(data.data);
        toast.success('Entry deleted');
      } else {
        toast.error(data.error || 'Failed to delete');
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast.error('Failed to delete entry');
    }
  };

  /* ─── Delete season ─── */
  const handleDeleteSeason = async () => {
    if (!activeSeason) return;
    if (!confirm(`Delete the entire ${activeSeason} season and all its suspensions? This cannot be undone.`)) return;

    try {
      const res = await fetch(`${API}/cms/suspensions/season/${activeSeason}`, {
        method: 'DELETE',
        headers,
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Season ${activeSeason} deleted`);
        setActiveSeason(null);
        setSeasonData(null);
        await loadSeasons();
      }
    } catch (error) {
      console.error('Error deleting season:', error);
      toast.error('Failed to delete season');
    }
  };

  /* ─── Filter suspensions by search ─── */
  const filteredList = (list: Suspension[]): Suspension[] => {
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter(s =>
      [s.name, s.team, s.division, s.offense, s.opponent, s.role]
        .filter(Boolean).join(' ').toLowerCase().includes(q)
    );
  };

  const suspensions = seasonData?.suspensions || [];
  const carryovers = seasonData?.carryovers || [];
  const associations = seasonData?.associationStatuses || [];

  /* ─── Loading state ─── */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#013fac]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Suspensions Manager</h2>
              <p className="text-sm text-gray-600 mt-1">
                Add, edit, and delete suspension records. Changes appear immediately on the public Suspensions page.
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={seedFromHardcoded}
                disabled={seeding}
                className="text-amber-700 border-amber-300 hover:bg-amber-50"
              >
                {seeding ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Upload className="w-4 h-4 mr-1" />}
                Seed from Code
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNewSeason(true)}
              >
                <Plus className="w-4 h-4 mr-1" />
                New Season
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Season tabs */}
      {seasons.length > 0 ? (
        <div className="flex items-center gap-2 flex-wrap">
          {seasons.map(year => (
            <button
              key={year}
              onClick={() => setActiveSeason(year)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                activeSeason === year
                  ? 'bg-[#013fac] text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {year} Season
            </button>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
            <p className="text-gray-600 mb-4">No suspension data in the database yet.</p>
            <p className="text-sm text-gray-500 mb-4">Click "Seed from Code" to import the existing hardcoded data, or create a new season.</p>
          </CardContent>
        </Card>
      )}

      {/* Season content */}
      {activeSeason && seasonData && (
        <>
          {/* List type tabs + search */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveListTab('suspensions')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  activeListTab === 'suspensions' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Suspensions ({suspensions.length})
              </button>
              <button
                onClick={() => setActiveListTab('carryovers')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  activeListTab === 'carryovers' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Carryovers ({carryovers.length})
              </button>
              <button
                onClick={() => setActiveListTab('associations')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  activeListTab === 'associations' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Associations ({associations.length})
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="pl-8 h-9 w-48"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                    <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
              {activeListTab !== 'associations' && (
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingEntry(emptySuspension());
                    setEditingIndex(null);
                    setEditingType(activeListTab === 'carryovers' ? 'carryover' : 'suspension');
                  }}
                  className="bg-[#013fac] hover:bg-[#0149c9]"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              )}
            </div>
          </div>

          {loadingSeason ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[#013fac]" />
            </div>
          ) : (
            <>
              {/* Suspensions / Carryovers list */}
              {(activeListTab === 'suspensions' || activeListTab === 'carryovers') && (
                <SuspensionList
                  items={filteredList(activeListTab === 'suspensions' ? suspensions : carryovers)}
                  type={activeListTab === 'carryovers' ? 'carryover' : 'suspension'}
                  allItems={activeListTab === 'suspensions' ? suspensions : carryovers}
                  onEdit={(entry, idx) => {
                    setEditingEntry({ ...entry });
                    setEditingIndex(idx);
                    setEditingType(activeListTab === 'carryovers' ? 'carryover' : 'suspension');
                  }}
                  onDelete={(idx, name) => handleDeleteEntry(activeListTab === 'carryovers' ? 'carryover' : 'suspension', idx, name)}
                />
              )}

              {/* Associations */}
              {activeListTab === 'associations' && (
                <AssociationsEditor
                  associations={associations}
                  season={activeSeason}
                  onUpdate={(updated) => setSeasonData({ ...seasonData, associationStatuses: updated })}
                />
              )}
            </>
          )}

          {/* Season actions */}
          <div className="flex justify-end pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteSeason}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Delete {activeSeason} Season
            </Button>
          </div>
        </>
      )}

      {/* Edit / Add entry modal */}
      <Dialog open={editingEntry !== null} onOpenChange={() => setEditingEntry(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingIndex !== null ? 'Edit Suspension' : 'Add Suspension'}
              {editingType === 'carryover' && ' (Carryover)'}
            </DialogTitle>
            <DialogDescription>
              Fill in the details for this suspension record.
            </DialogDescription>
          </DialogHeader>
          {editingEntry && (
            <SuspensionForm
              entry={editingEntry}
              onChange={setEditingEntry}
              onSave={handleSaveEntry}
              onCancel={() => setEditingEntry(null)}
              saving={saving}
              title={editingIndex !== null ? 'Update' : 'Add'}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* New season modal */}
      <Dialog open={showNewSeason} onOpenChange={setShowNewSeason}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Season</DialogTitle>
            <DialogDescription>Enter the year for the new season.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Season Year</Label>
              <Input
                type="number"
                value={newSeasonYear}
                onChange={(e) => setNewSeasonYear(parseInt(e.target.value))}
                min={2020}
                max={2040}
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewSeason(false)}>Cancel</Button>
              <Button onClick={createSeason} className="bg-[#013fac] hover:bg-[#0149c9]">
                <Plus className="w-4 h-4 mr-1" />
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
 *  SUSPENSION LIST
 * ═══════════════════════════════════════════════════════════════ */

function SuspensionList({
  items,
  type,
  allItems,
  onEdit,
  onDelete,
}: {
  items: Suspension[];
  type: 'suspension' | 'carryover';
  allItems: Suspension[];
  onEdit: (entry: Suspension, originalIndex: number) => void;
  onDelete: (originalIndex: number, name: string) => void;
}) {
  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-gray-500">
          <Gavel className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p>No {type === 'carryover' ? 'carryover' : 'suspension'} records found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((s, displayIdx) => {
        // Find original index in the full list for API calls
        const originalIdx = allItems.indexOf(s);
        const penaltyParts: string[] = [];
        if (s.penalties?.fine) penaltyParts.push(`Fine: ${s.penalties.fine}`);
        if (s.penalties?.suspension) penaltyParts.push(`Suspension: ${s.penalties.suspension}`);

        return (
          <div
            key={`${s.name}-${s.sortDate}-${displayIdx}`}
            className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 hover:border-blue-300 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-semibold text-gray-900 text-sm">{s.name}</span>
                  {s.isTeamFine && (
                    <Badge variant="outline" className="text-[10px] bg-orange-50 text-orange-700 border-orange-200">Team Fine</Badge>
                  )}
                  {s.isCoach && (
                    <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">{s.role || 'Coach'}</Badge>
                  )}
                  {s.isRuling && (
                    <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200">Ruling</Badge>
                  )}
                  {type === 'carryover' && (
                    <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">Carryover</Badge>
                  )}
                </div>
                <div className="text-xs text-gray-500 space-y-0.5">
                  <p>
                    <span className="font-medium text-gray-600">{s.team}</span>
                    {s.division && <> &middot; {s.division}</>}
                    {s.opponent && <> vs {s.opponent}</>}
                  </p>
                  <p>{s.date}</p>
                  <p className="font-medium text-gray-700">{s.offense}</p>
                  {penaltyParts.length > 0 && (
                    <p className="text-red-700">{penaltyParts.join(' | ')}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(s, originalIdx >= 0 ? originalIdx : displayIdx)}
                  className="h-7 w-7 p-0"
                >
                  <Edit2 className="w-3 h-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(originalIdx >= 0 ? originalIdx : displayIdx, s.name)}
                  className="h-7 w-7 p-0 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
 *  ASSOCIATIONS EDITOR
 * ═══════════════════════════════════════════════════════════════ */

function AssociationsEditor({
  associations,
  season,
  onUpdate,
}: {
  associations: AssociationStatus[];
  season: number;
  onUpdate: (updated: AssociationStatus[]) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [local, setLocal] = useState(associations);

  useEffect(() => { setLocal(associations); }, [associations]);

  const handleAdd = () => {
    setLocal([...local, { name: '', abbreviation: '', status: 'None' }]);
  };

  const handleRemove = (index: number) => {
    setLocal(local.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: keyof AssociationStatus, value: string) => {
    const updated = [...local];
    updated[index] = { ...updated[index], [field]: value };
    setLocal(updated);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch(`${API}/cms/suspensions/associations/${season}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ associationStatuses: local }),
      });
      const data = await res.json();
      if (data.success) {
        onUpdate(local);
        toast.success('Association statuses updated');
      } else {
        toast.error(data.error || 'Failed to update');
      }
    } catch (error) {
      console.error('Error saving associations:', error);
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="w-4 h-4" />
          Minor Association Suspension Report Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {local.map((a, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              value={a.name}
              onChange={(e) => handleChange(i, 'name', e.target.value)}
              placeholder="Association name"
              className="flex-1"
            />
            <Input
              value={a.abbreviation}
              onChange={(e) => handleChange(i, 'abbreviation', e.target.value)}
              placeholder="Abbreviation"
              className="w-24"
            />
            <select
              value={a.status}
              onChange={(e) => handleChange(i, 'status', e.target.value)}
              className="h-9 px-2 border border-gray-300 rounded-md text-sm bg-white"
            >
              <option value="None">None</option>
              <option value="Pending">Pending</option>
              <option value="Received">Received</option>
              <option value="Overdue">Overdue</option>
            </select>
            <Button variant="outline" size="sm" onClick={() => handleRemove(i)} className="h-9 w-9 p-0 text-red-600">
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        ))}
        <div className="flex justify-between pt-2">
          <Button variant="outline" size="sm" onClick={handleAdd}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add Association
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving} className="bg-[#013fac] hover:bg-[#0149c9]">
            {saving ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1" />}
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
