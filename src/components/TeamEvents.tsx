import { useState, useEffect, useMemo } from 'react';
import { Calendar, MapPin, Clock, Loader2, AlertCircle, Filter, ChevronUp, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { fetchTeamEvents } from '../services/sportzsoft/api';

interface TeamEvent {
  id: number | string;
  name: string;
  type: string;
  startDate: Date | null;
  startDateStr: string;
  startTime: string;
  endDate: Date | null;
  endDateStr: string;
  location: string;
  status: string;
  raw: any;
}

interface TeamEventsProps {
  teamId: number;
  teamName: string;
  primaryColor: string;
  secondaryColor: string;
  currentSeason: string;
}

type SortField = 'name' | 'type' | 'startDate' | 'location' | 'status';
type SortDir = 'asc' | 'desc';
type TimeFilter = 'all' | 'upcoming' | 'past';

/**
 * Recursively search an object tree for arrays that might contain event data
 */
function findEventArrays(obj: any, path: string = 'root'): { path: string; arr: any[] }[] {
  const results: { path: string; arr: any[] }[] = [];
  if (!obj || typeof obj !== 'object') return results;

  for (const [key, val] of Object.entries(obj)) {
    const currentPath = `${path}.${key}`;
    if (Array.isArray(val) && val.length > 0) {
      const first = val[0];
      if (first && typeof first === 'object') {
        const keys = Object.keys(first).map(k => k.toLowerCase());
        const hasDateField = keys.some(k => k.includes('date') || k.includes('start') || k.includes('time'));
        const hasNameField = keys.some(k => k.includes('name') || k.includes('title') || k.includes('event') || k.includes('description') || k.includes('subject'));
        if (hasDateField || hasNameField) {
          results.push({ path: currentPath, arr: val });
        }
      }
    } else if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      results.push(...findEventArrays(val, currentPath));
    }
  }
  return results;
}

function tryParseDate(val: any): Date | null {
  if (!val) return null;
  try {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

function formatDateForTable(date: Date | null): string {
  if (!date) return '';
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTimeForTable(val: any): string {
  if (!val) return '';
  const s = String(val);

  // Already formatted
  if (/[ap]m/i.test(s) && !s.includes('T')) return s;

  // ISO datetime — extract time part
  if (s.includes('T')) {
    const timePart = s.split('T')[1]?.split('.')[0];
    if (timePart) {
      const [hStr, mStr] = timePart.split(':');
      let h = parseInt(hStr, 10);
      const m = mStr || '00';
      const ampm = h >= 12 ? 'PM' : 'AM';
      if (h > 12) h -= 12;
      if (h === 0) h = 12;
      return `${h}:${m} ${ampm}`;
    }
  }

  // HH:MM format
  if (/^\d{1,2}:\d{2}/.test(s)) {
    const [hStr, mStr] = s.split(':');
    let h = parseInt(hStr, 10);
    const m = mStr;
    const ampm = h >= 12 ? 'PM' : 'AM';
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    return `${h}:${m} ${ampm}`;
  }

  return s;
}

function getTypeBadgeColor(type: string): string {
  const t = type.toLowerCase();
  if (t.includes('practice') || t.includes('training')) return '#059669';
  if (t.includes('exhibition')) return '#9333ea';
  if (t.includes('playoff')) return '#dc2626';
  if (t.includes('game') || t.includes('match')) return '#2563eb';
  if (t.includes('meeting')) return '#ca8a04';
  if (t.includes('fundrais') || t.includes('social')) return '#ea580c';
  if (t.includes('tryout')) return '#0891b2';
  return '#6b7280';
}

function getStatusColor(status: string): string {
  const s = status.toLowerCase();
  if (s.includes('active') || s.includes('confirmed') || s.includes('scheduled') || s.includes('published')) return '#059669';
  if (s.includes('cancel')) return '#dc2626';
  if (s.includes('postpone') || s.includes('pending')) return '#ca8a04';
  if (s.includes('draft')) return '#9ca3af';
  if (s.includes('complete') || s.includes('done') || s.includes('finished')) return '#6b7280';
  return '#374151';
}

function parseEvent(raw: any, index: number): TeamEvent {
  const id = raw.EventId || raw.TeamEventId || raw.Id || raw.ID || raw.TeamEvent_Id || index;

  const name = raw.EventName || raw.Title || raw.Name || raw.Subject || raw.EventTitle
    || raw.Description || raw.EventDescription || 'Untitled Event';

  const type = raw.EventType || raw.EventTypeName || raw.Type || raw.Category
    || raw.EventCategory || raw.EventTypeCd || raw.PracticeType || '';

  // --- Brute-force date/time scanning ---
  // Look for any key containing "date" or "start" for a date value, and "time" for a time value
  let rawStartDate = '';
  let rawEndDate = '';
  let rawStartTime = '';
  let rawEndTime = '';

  // First try explicit known fields
  rawStartDate = raw.StartDate || raw.EventDate || raw.Date || raw.Start
    || raw.FromDate || raw.EventStartDate || raw.PracticeDate || '';
  rawStartTime = raw.StartTime || raw.TimeFrom || raw.FromTime || raw.EventStartTime || '';
  rawEndDate = raw.EndDate || raw.EventEndDate || raw.End || raw.ToDate || raw.EventEnd || '';
  rawEndTime = raw.EndTime || raw.TimeTo || raw.ToTime || raw.EventEndTime || '';

  // If nothing found, brute-force scan all keys
  if (!rawStartDate) {
    for (const [k, v] of Object.entries(raw)) {
      if (!v || typeof v !== 'string') continue;
      const kl = k.toLowerCase();
      // Look for date-like values (ISO dates or date strings)
      if ((kl.includes('start') || kl.includes('from') || kl.includes('begin')) && kl.includes('date')) {
        rawStartDate = v;
        break;
      }
    }
  }
  if (!rawStartDate) {
    // Fallback: any key with "date" in name that has a parseable date value
    for (const [k, v] of Object.entries(raw)) {
      if (!v || typeof v !== 'string') continue;
      const kl = k.toLowerCase();
      if (kl.includes('date') && tryParseDate(v)) {
        rawStartDate = v;
        break;
      }
    }
  }
  if (!rawStartDate) {
    // Last resort: any string value that looks like an ISO date
    for (const [k, v] of Object.entries(raw)) {
      if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)) {
        rawStartDate = v;

        break;
      }
    }
  }

  if (!rawStartTime && rawStartDate && rawStartDate.includes('T')) {
    rawStartTime = rawStartDate; // ISO datetime contains time
  }

  if (!rawEndDate) {
    for (const [k, v] of Object.entries(raw)) {
      if (!v || typeof v !== 'string') continue;
      const kl = k.toLowerCase();
      if ((kl.includes('end') || kl.includes('to') || kl.includes('finish')) && kl.includes('date')) {
        rawEndDate = v;
        break;
      }
    }
  }
  if (!rawEndDate) {
    rawEndDate = rawStartDate; // fallback to start date
  }

  if (!rawStartTime) {
    for (const [k, v] of Object.entries(raw)) {
      if (!v || typeof v !== 'string') continue;
      const kl = k.toLowerCase();
      if (kl.includes('time') && (kl.includes('start') || kl.includes('from') || kl.includes('begin'))) {
        rawStartTime = v;
        break;
      }
    }
    // Still nothing? Try any "time" field
    if (!rawStartTime) {
      for (const [k, v] of Object.entries(raw)) {
        if (!v || typeof v !== 'string') continue;
        if (k.toLowerCase().includes('time') && !k.toLowerCase().includes('end') && !k.toLowerCase().includes('to')) {
          rawStartTime = v;
          break;
        }
      }
    }
  }

  const startDate = tryParseDate(rawStartDate);
  const endDate = tryParseDate(rawEndDate);



  // Location
  const location = raw.Location || raw.Venue || raw.Address || raw.Place
    || raw.EventLocation || raw.FacilityName || raw.Facility || raw.VenueName
    || raw.Arena || raw.EventFacility || '';

  // Also brute-force location
  let resolvedLocation = location;
  if (!resolvedLocation) {
    for (const [k, v] of Object.entries(raw)) {
      if (typeof v !== 'string' || !v) continue;
      const kl = k.toLowerCase();
      if (kl.includes('location') || kl.includes('facility') || kl.includes('venue') || kl.includes('arena') || kl.includes('place')) {
        resolvedLocation = v;
        break;
      }
    }
  }

  // Status
  const status = raw.Status || raw.EventStatus || raw.StatusName || raw.EventStatusName || '';

  return {
    id,
    name,
    type: type || 'Event',
    startDate,
    startDateStr: formatDateForTable(startDate),
    startTime: formatTimeForTable(rawStartTime),
    endDate,
    endDateStr: formatDateForTable(endDate),
    location: resolvedLocation,
    status: status || 'Active',
    raw,
  };
}

export function TeamEvents({ teamId, teamName, primaryColor, secondaryColor, currentSeason }: TeamEventsProps) {
  const [events, setEvents] = useState<TeamEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('upcoming');
  const [sortField, setSortField] = useState<SortField>('startDate');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!teamId) return;
      setLoading(true);
      setError(null);

      try {

        const results = await fetchTeamEvents(teamId, 'B');


        let allFoundEvents: TeamEvent[] = [];

        for (const result of results) {
          const data = result.data;
          if (!data) continue;

          if (data.Response) {
            // Search for event arrays in the response
            const eventArrays = findEventArrays(data.Response, `${result.source}.Response`);

            for (const ea of eventArrays) {


              const parsed = ea.arr.map((item: any, idx: number) => parseEvent(item, idx));
              const meaningful = parsed.filter(e => e.name !== 'Untitled Event' || e.startDate);
              if (meaningful.length > 0) {
                allFoundEvents.push(...meaningful);
              }
            }

            // Check known event keys explicitly
            const resp = data.Response;
            const eventKeys = ['Events', 'TeamEvents', 'Event', 'TeamEvent', 'EventView',
              'TeamEventView', 'Announcements', 'TeamAnnouncements', 'TeamMessages',
              'Messages', 'NewsItems'];
            for (const key of eventKeys) {
              if (resp[key] && Array.isArray(resp[key]) && resp[key].length > 0) {

                // Only add if not already added by findEventArrays
                const existingIds = new Set(allFoundEvents.map(e => e.id));
                const parsed = resp[key].map((item: any, idx: number) => parseEvent(item, idx));
                for (const p of parsed) {
                  if (!existingIds.has(p.id)) {
                    allFoundEvents.push(p);
                  }
                }
              }
            }
          } else if (Array.isArray(data.Response)) {
            if (data.Response.length > 0) {
              const parsed = data.Response.map((item: any, idx: number) => parseEvent(item, idx));
              allFoundEvents.push(...parsed);
            }
          }
        }

        // Deduplicate
        const seen = new Set<string>();
        allFoundEvents = allFoundEvents.filter(e => {
          const key = `${e.id}-${e.name}-${e.startDateStr}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        // Default sort by start date
        allFoundEvents.sort((a, b) => {
          if (!a.startDate && !b.startDate) return 0;
          if (!a.startDate) return 1;
          if (!b.startDate) return -1;
          return a.startDate.getTime() - b.startDate.getTime();
        });


        setEvents(allFoundEvents);
      } catch (err: any) {
        console.error('[TeamEvents] Error:', err);
        setError(err.message || 'Failed to load events');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [teamId, teamName]);

  const now = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const filteredEvents = useMemo(() => {
    let filtered = events;

    if (timeFilter === 'upcoming') {
      filtered = filtered.filter(e => !e.startDate || e.startDate >= now);
    } else if (timeFilter === 'past') {
      filtered = filtered.filter(e => e.startDate && e.startDate < now);
    }

    filtered.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'type':
          cmp = a.type.localeCompare(b.type);
          break;
        case 'startDate':
          if (!a.startDate && !b.startDate) cmp = 0;
          else if (!a.startDate) cmp = 1;
          else if (!b.startDate) cmp = -1;
          else cmp = a.startDate.getTime() - b.startDate.getTime();
          break;
        case 'location':
          cmp = a.location.localeCompare(b.location);
          break;
        case 'status':
          cmp = a.status.localeCompare(b.status);
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return filtered;
  }, [events, timeFilter, sortField, sortDir, now]);

  const upcomingCount = events.filter(e => !e.startDate || e.startDate >= now).length;
  const pastCount = events.filter(e => e.startDate && e.startDate < now).length;

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronDown className="w-3 h-3 opacity-30" />;
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
  };

  const ThButton = ({ field, children, className = '' }: { field: SortField; children: React.ReactNode; className?: string }) => (
    <th
      className={`px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wider cursor-pointer select-none hover:opacity-80 transition-opacity ${className}`}
      style={{ backgroundColor: primaryColor, color: 'white' }}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        <SortIcon field={field} />
      </div>
    </th>
  );

  const ThStatic = ({ children }: { children: React.ReactNode }) => (
    <th
      className="px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wider"
      style={{ backgroundColor: primaryColor, color: 'white' }}
    >
      {children}
    </th>
  );

  if (loading) {
    return (
      <Card className="border-2 shadow-lg" style={{ borderColor: `${primaryColor}40` }}>
        <CardHeader className="border-b-2 rounded-t-lg" style={{ backgroundColor: primaryColor, borderBottomColor: primaryColor }}>
          <CardTitle className="text-xl font-black text-white flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Events
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-10 h-10 animate-spin mb-3" style={{ color: primaryColor }} />
            <p className="text-gray-400 font-bold">Loading events...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-2 shadow-lg" style={{ borderColor: `${primaryColor}40` }}>
        <CardHeader className="border-b-2 rounded-t-lg" style={{ backgroundColor: primaryColor, borderBottomColor: primaryColor }}>
          <CardTitle className="text-xl font-black text-white flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Events
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="w-10 h-10 text-gray-300 mb-3" />
            <p className="text-gray-500 font-bold">Error loading events</p>
            <p className="text-sm text-gray-400 mt-1">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 shadow-lg" style={{ borderColor: `${primaryColor}40` }}>
      <CardHeader className="border-b-2 rounded-t-lg" style={{ backgroundColor: primaryColor, borderBottomColor: primaryColor }}>
        <CardTitle className="text-xl font-black text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Events
          </div>
          {events.length > 0 && (
            <Badge variant="outline" className="text-white/80 border-white/30 bg-white/10 font-semibold text-xs">
              {events.length} event{events.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {events.length === 0 ? (
          <div className="text-center py-16 text-gray-500 italic">
            <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="font-bold text-gray-400">No Events</p>
            <p className="text-sm text-gray-400 mt-1">
              No events found for {teamName} in the {currentSeason} season.
            </p>
          </div>
        ) : (
          <>
            {/* Filter bar */}
            <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100">
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                <div className="flex rounded-md border border-gray-200 overflow-hidden text-xs">
                  {([
                    { key: 'upcoming' as TimeFilter, label: `Upcoming (${upcomingCount})` },
                    { key: 'all' as TimeFilter, label: `All (${events.length})` },
                    { key: 'past' as TimeFilter, label: `Past (${pastCount})` },
                  ]).map(f => (
                    <button
                      key={f.key}
                      onClick={() => setTimeFilter(f.key)}
                      className={`px-2.5 py-1 font-semibold transition-colors ${
                        timeFilter === f.key ? 'text-white' : 'text-gray-500 hover:bg-gray-100 bg-white'
                      }`}
                      style={timeFilter === f.key ? { backgroundColor: primaryColor } : {}}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <span className="ml-auto text-xs text-gray-400 font-medium">
                {filteredEvents.length} result{filteredEvents.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Table */}
            {filteredEvents.length === 0 ? (
              <div className="text-center py-12 text-gray-400 italic">
                No {timeFilter !== 'all' ? timeFilter : ''} events found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <ThButton field="name" className="min-w-[200px]">Event</ThButton>
                      <ThButton field="type">Type</ThButton>
                      <ThButton field="startDate">Start Date</ThButton>
                      <ThStatic>Start Time</ThStatic>
                      <ThStatic>End Date</ThStatic>
                      <ThButton field="location">Location</ThButton>
                      <ThButton field="status">Status</ThButton>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredEvents.map((event, idx) => {
                      const isPast = event.startDate && event.startDate < now;
                      return (
                        <tr
                          key={`${event.id}-${idx}`}
                          className={`hover:bg-gray-50 transition-colors ${isPast ? 'opacity-60' : ''} ${
                            idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                          }`}
                        >
                          <td className="px-3 py-2.5">
                            <span className="font-semibold" style={{ color: primaryColor }}>
                              {event.name}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <Badge
                              variant="outline"
                              className="text-[10px] font-bold uppercase whitespace-nowrap"
                              style={{
                                color: getTypeBadgeColor(event.type),
                                borderColor: `${getTypeBadgeColor(event.type)}40`,
                                backgroundColor: `${getTypeBadgeColor(event.type)}08`,
                              }}
                            >
                              {event.type}
                            </Badge>
                          </td>
                          <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap text-xs">
                            {event.startDateStr || '—'}
                          </td>
                          <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap text-xs font-medium">
                            {event.startTime || '—'}
                          </td>
                          <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap text-xs">
                            {event.endDateStr || '—'}
                          </td>
                          <td className="px-3 py-2.5 text-gray-700 text-xs">
                            <div className="flex items-center gap-1">
                              {event.location && <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />}
                              <span className="truncate max-w-[200px]">{event.location || '—'}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="text-xs font-bold" style={{ color: getStatusColor(event.status) }}>
                              {event.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}