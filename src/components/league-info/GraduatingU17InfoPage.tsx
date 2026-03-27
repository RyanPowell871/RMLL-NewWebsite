'use client';

import { useState, useEffect } from 'react';
import {
  Users, Calendar, Clock, MapPin, ChevronDown, ChevronRight,
  Info, Building2, Megaphone
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

const supabase = createClient(`https://${projectId}.supabase.co`, publicAnonKey);

/* ─── Collapsible Section ─── */
interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  accent?: string;
}

function CollapsibleSection({ title, icon, children, defaultOpen = false, accent = '#013fac' }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-3 sm:px-5 py-3 sm:py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="p-2 rounded-lg shrink-0" style={{ backgroundColor: `${accent}15` }}>
          {icon}
        </div>
        <span className="font-bold text-gray-900 flex-1 text-sm sm:text-base" style={{ fontFamily: 'var(--font-secondary)' }}>{title}</span>
        {open
          ? <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
          : <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />}
      </button>
      {open && <div className="px-3 sm:px-5 pb-4 sm:pb-5 border-t border-gray-100">{children}</div>}
    </div>
  );
}

/* ─── Session Card ─── */
interface SessionInfo {
  clubs: string;
  date: string;
  time: string;
  location: string;
  address: string;
}

function SessionCard({ session, index }: { session: SessionInfo; index: number }) {
  const colors = ['#013fac', '#7c3aed'];
  const color = colors[index % colors.length];

  return (
    <div className="border rounded-lg overflow-hidden" style={{ borderColor: `${color}30` }}>
      {/* Header – clubs served */}
      <div className="px-5 py-3 flex items-start gap-3" style={{ backgroundColor: `${color}08` }}>
        <div className="p-1.5 rounded-md mt-0.5" style={{ backgroundColor: `${color}15` }}>
          <Users className="w-4 h-4" style={{ color }} />
        </div>
        <p className="text-sm font-bold text-gray-900 leading-snug">{session.clubs}</p>
      </div>

      {/* Details */}
      <div className="px-5 py-4 space-y-3">
        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4 flex-shrink-0" style={{ color }} />
          <span className="text-sm text-gray-800 font-medium">{session.date}</span>
        </div>
        <div className="flex items-center gap-3">
          <Clock className="w-4 h-4 flex-shrink-0" style={{ color }} />
          <span className="text-sm text-gray-700">{session.time}</span>
        </div>
        <div className="flex items-start gap-3">
          <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color }} />
          <div>
            <p className="text-sm text-gray-800 font-medium">{session.location}</p>
            <p className="text-xs text-gray-500 mt-0.5">{session.address}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
const DEFAULT_SESSIONS: SessionInfo[] = [
  {
    clubs: 'Graduating U17 Players from GELC, Wheatland and Grande Prairie Minor Lacrosse Clubs',
    date: 'Friday, January 9, 2026',
    time: '7:00 pm to 9:30 pm',
    location: 'Central Lions Recreation Centre – Large Auditorium',
    address: '11113-113 Street, Edmonton',
  },
  {
    clubs: 'Graduating U17 Players from CALL, CDLA and SALA Minor Lacrosse Clubs',
    date: 'Friday, January 16, 2026',
    time: '7:00 pm to 9:30 pm',
    location: 'Acadia Recreation Centre – Rose Hall',
    address: '240 – 90 Ave. S.E., Calgary',
  },
];

export function GraduatingU17InfoPage() {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<SessionInfo[]>(DEFAULT_SESSIONS);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: result, error } = await supabase
          .from('rmll_component_content')
          .select('extracted_data')
          .eq('page_id', 'graduating-u17-info')
          .maybeSingle();

        if (!error && result && result.extracted_data) {
          const extracted = result.extracted_data as Record<string, unknown>;
          const fetchedSessions = (extracted.SESSIONS as typeof DEFAULT_SESSIONS);
          if (fetchedSessions && Array.isArray(fetchedSessions) && fetchedSessions.length > 0) {
            setSessions(fetchedSessions);
          }
        }
      } catch (error) {
        console.error('[GraduatingU17InfoPage] Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-3 bg-[#013fac]/10 rounded-xl">
            <Megaphone className="w-7 h-7 text-[#013fac]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-secondary)' }}>
              Graduating U17 Info Sessions
            </h1>
            <p className="text-sm text-gray-500">Information Sessions for New Junior Players</p>
          </div>
        </div>
      </div>

      <div className="space-y-5">

        {/* ── Overview ── */}
        <CollapsibleSection
          title="About the Information Sessions"
          icon={<Info className="w-5 h-5 text-[#013fac]" />}
          defaultOpen={true}
        >
          <div className="mt-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-gray-800 leading-relaxed">
                Annually, in early January, the RMLL holds Information Sessions for all first-year Junior players
                (Graduating U17 players). At these sessions the RMLL presents an overview of Major Lacrosse in
                Alberta and the various RMLL Divisions of Junior lacrosse. Representatives of each team in the
                Junior Divisions attend and provide information on their specific Programs.
              </p>
            </div>
          </div>
        </CollapsibleSection>

        {/* ── 2026 Sessions ── */}
        <CollapsibleSection
          title="2026 RMLL Information Sessions"
          icon={<Calendar className="w-5 h-5 text-[#013fac]" />}
          defaultOpen={true}
        >
          <div className="mt-4 space-y-4">
            {sessions.map((session, i) => (
              <SessionCard key={i} session={session} index={i} />
            ))}
          </div>
        </CollapsibleSection>

      </div>
    </div>
  );
}