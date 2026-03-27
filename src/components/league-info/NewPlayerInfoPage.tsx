'use client';

import { useState, useEffect } from 'react';
import {
  ArrowRight,
  Calendar,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Clock,
  DollarSign,
  ExternalLink,
  GraduationCap,
  Info,
  Mail,
  MapPin,
  Megaphone,
  Repeat,
  Shield,
  Truck,
  TrendingUp,
  Trophy,
  Users,
  AlertTriangle,
} from 'lucide-react';
import { ClipboardList } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

const supabase = createClient(`https://${projectId}.supabase.co`, publicAnonKey);

/* ─── helpers ─── */

// Navigate from /league-info to a page on / (cross-route navigation)
function navigateToHomePage(page: string, params?: Record<string, any>) {
  sessionStorage.setItem('rmll-navigate-to', page);
  if (params) {
    sessionStorage.setItem('rmll-navigate-params', JSON.stringify(params));
  }
  (window as any).navigateToPath('/');
}

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  accentColor?: string;
}

function CollapsibleSection({ title, icon, children, defaultOpen = false, accentColor = 'border-[#013fac]' }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`not-prose border-l-4 ${accentColor} bg-white rounded-lg shadow-sm overflow-hidden mb-4`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="text-[#013fac]">{icon}</span>
        <span className="flex-1 font-bold text-gray-900 text-base">{title}</span>
        {open ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </button>
      {open && <div className="px-4 pb-4 border-t border-gray-100">{children}</div>}
    </div>
  );
}

interface InfoSessionCardProps {
  city: string;
  date: string;
  venue: string;
  address: string;
  time: string;
}

function InfoSessionCard({ city, date, venue, address, time }: InfoSessionCardProps) {
  return (
    <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg p-4 flex-1 min-w-[260px]">
      <div className="flex items-center gap-2 mb-3">
        <MapPin className="w-5 h-5 text-[#8B4513]" />
        <h4 className="font-bold text-gray-900">{city}</h4>
      </div>
      <div className="space-y-1.5 text-sm">
        <div className="flex items-start gap-2">
          <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <span className="text-gray-700">{date}</span>
        </div>
        <div className="flex items-start gap-2">
          <Clock className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <span className="text-gray-700">{time}</span>
        </div>
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-gray-700 font-medium">{venue}</p>
            <p className="text-gray-500 text-xs">{address}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface DraftCardProps {
  title: string;
  teams: string;
  eligiblePlayers: string;
  date: string;
  time: string;
  location?: string;
  draftOrder: string[];
  notes?: string;
  streamInfo?: string;
}

function DraftCard({ title, teams, eligiblePlayers, date, time, location, draftOrder, notes, streamInfo }: DraftCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-[#8B4513] text-white px-4 py-2.5">
        <h4 className="font-bold text-sm">{title}</h4>
        <p className="text-xs text-orange-100 mt-0.5">{teams}</p>
      </div>
      <div className="p-4 space-y-3 text-sm">
        <p className="text-gray-700">{eligiblePlayers}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-700">{date}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-700">{time}</span>
          </div>
          {location && (
            <div className="flex items-start gap-1.5 sm:col-span-2">
              <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5" />
              <span className="text-gray-700">{location}</span>
            </div>
          )}
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Draft Order</p>
          <ol className="list-decimal list-inside text-gray-700 text-xs space-y-0.5">
            {draftOrder.map((team, i) => (
              <li key={i}>{team}</li>
            ))}
          </ol>
          <p className="text-xs text-gray-500 italic mt-1">And by trade transactions where trades include draft picks.</p>
        </div>
        {streamInfo && <p className="text-xs text-gray-500">{streamInfo}</p>}
        {notes && <p className="text-xs text-gray-600 italic">{notes}</p>}
        <p className="text-xs text-gray-500">All Graduating U17 players and their families are welcome to attend.</p>
        <p className="text-xs text-gray-500">Follow Live on X: <strong>@RMLaxL</strong></p>
      </div>
    </div>
  );
}

/* ─── divisions data ─── */
const DEFAULT_DIVISIONS = [
  { name: 'Alberta Series Lacrosse (Senior B)', teams: 5 },
  { name: 'Senior C', teams: 13 },
  { name: 'Junior A', teams: 5, note: 'includes a team from Saskatoon and a team from Winnipeg' },
  { name: 'Junior B Tier I', teams: 13, note: 'includes a team from Regina and a team from Saskatoon' },
  { name: 'Junior B Tier II', teams: 18 },
  { name: 'Alberta Sr. Major Female', teams: 2 },
  { name: 'Alberta Jr. Major Female', teams: 7 },
];

const DEFAULT_MINOR_VS_JUNIOR = [
  'All games are 3 twenty-minute stop time periods, with 10-minute intermissions and a minimum 30-minute warmup.',
  'Season is usually longer, depending upon how deep you go in the playoffs.',
  'Nets are bigger (4\'×4\'6″ instead of 4\'×4\').',
  'Provincial travel (and in some Divisions, inter-provincial travel).',
  '3-Person-Mechanic (Officials) for Jr. A and when available Sr. B, Tier I, and Tier II.',
  'RMLL modified rules of play making for a faster game.',
  'Home and away uniforms.',
  'New teams to play.',
  'Five-year age category.',
  'Different tactics are introduced and developed.',
];

const DEFAULT_CONTACTS = [
  { role: 'President', name: 'Duane Bratt', email: 'dbratt@mtroyal.ca' },
  { role: 'Jr. A Commissioner', name: 'Darrel Knight', email: 'darrelk1@me.com' },
  { role: 'Jr. B Tier I Commissioner', name: 'Ian Stewart', email: 'rmlljrbtierone@gmail.com' },
  { role: 'Jr. B Tier II Commissioner', name: 'Mike Medhurst', email: 'mmdhrst@gmail.com' },
];

/* ─── main component ─── */
export function NewPlayerInfoPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    DIVISIONS: DEFAULT_DIVISIONS,
    MINOR_VS_JUNIOR: DEFAULT_MINOR_VS_JUNIOR,
    CONTACTS: DEFAULT_CONTACTS,
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: result, error } = await supabase
          .from('rmll_component_content')
          .select('extracted_data')
          .eq('page_id', 'new-player-info')
          .maybeSingle();

        if (!error && result && result.extracted_data) {
          const extracted = result.extracted_data as Record<string, unknown>;
          setData({
            DIVISIONS: (extracted.DIVISIONS as typeof DEFAULT_DIVISIONS) || DEFAULT_DIVISIONS,
            MINOR_VS_JUNIOR: (extracted.MINOR_VS_JUNIOR as typeof DEFAULT_MINOR_VS_JUNIOR) || DEFAULT_MINOR_VS_JUNIOR,
            CONTACTS: (extracted.CONTACTS as typeof DEFAULT_CONTACTS) || DEFAULT_CONTACTS,
          });
        }
      } catch (error) {
        console.error('[NewPlayerInfoPage] Error fetching data:', error);
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
    <div>
      {/* Hero welcome */}
      <div className="not-prose mb-6">
        <div className="bg-gradient-to-r from-[#013fac] to-[#0149c9] rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-start gap-4">
            <div className="bg-white/20 rounded-lg p-3 flex-shrink-0">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-blue-200 text-sm font-semibold uppercase tracking-wider">To: All Alberta Players Born in 2009</p>
              <h3 className="text-2xl font-black mt-1 mb-2">WELCOME to Major Lacrosse!</h3>
              <p className="text-blue-100 text-sm leading-relaxed">
                Major Lacrosse is for those players aging out of Minor Lacrosse who still wish to play competitive
                lacrosse. The growth and sustainability of Major Lacrosse teams is totally dependent on the number of
                players coming up from Minor Lacrosse.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Sessions */}
      <h2>Junior Lacrosse Information Sessions</h2>
      <p className="text-base leading-relaxed">
        Please plan to attend one of the RMLL Junior Lacrosse Information Sessions being held in
        Edmonton and Calgary. Members of the RMLL Executive and Junior Team Representatives will
        attend both Sessions to provide information on our Junior Programs.
      </p>
      <div className="not-prose flex flex-col sm:flex-row gap-3 my-4">
        <InfoSessionCard
          city="Edmonton"
          date="Friday, January 9, 2026"
          venue="Central Lions Senior Rec. Centre"
          address="Large Auditorium, 11113-113 Street"
          time="7:00 PM"
        />
        <InfoSessionCard
          city="Calgary"
          date="Friday, January 16, 2026"
          venue="Acadia Recreation Centre"
          address="Rose Hall, 240 90 Ave SE"
          time="7:00 PM"
        />
      </div>

      {/* Governance */}
      <CollapsibleSection title="Governance" icon={<Shield className="w-5 h-5" />} defaultOpen>
        <div className="mt-3 space-y-3 text-sm text-gray-700 leading-relaxed">
          <p>
            Governance rules in Major Lacrosse differ from Minor Lacrosse and rules may change from Division to Division
            depending on if a Division has their own Operating Policy.
          </p>
          <p>
            Major Lacrosse encompasses all players who turn 17 as of December 31, 2026 (birth year 2009).
            We have two age groups: <strong>Junior</strong> and <strong>Senior</strong>. Junior Lacrosse is for players between
            17 and 21 years old as of December 31, 2026, and Senior Lacrosse is for players over the age of 21 who still
            wish to play competitive lacrosse. The governing body for Major Lacrosse in Alberta is the{' '}
            <strong>Rocky Mountain Lacrosse League (RMLL)</strong>.
          </p>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="font-semibold text-gray-800 mb-2">There are 7 Divisions and 63 teams in the RMLL:</p>
            <div className="space-y-1">
              {data.DIVISIONS.map((div, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="bg-[#013fac] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">{div.teams}</span>
                  <span>
                    <strong>{div.name}</strong>
                    {div.note && <span className="text-gray-500 text-xs ml-1">({div.note})</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <p>
            Each RMLL Division has a <strong>Commissioner</strong> who is appointed annually by the Franchises in a Division.
            The Commissioner is a Member of the RMLL Executive, represents their Franchises on the Executive and is
            responsible for administering their Division. All RMLL Divisions must meet the same standards and are treated equally.
          </p>
          <p>
            All games are <strong>3 twenty-minute stop time periods</strong>, with 10-minute intermissions and a minimum 30-minute warmup.
          </p>
        </div>
      </CollapsibleSection>

      {/* Differences */}
      <CollapsibleSection title="Differences Between Minor & Junior Lacrosse" icon={<Repeat className="w-5 h-5" />} defaultOpen>
        <div className="mt-3">
          <p className="text-sm text-gray-700 mb-3">Some significant differences between Minor and Junior Lacrosse are:</p>
          <div className="space-y-1.5">
            {data.MINOR_VS_JUNIOR.map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <ArrowRight className="w-4 h-4 text-[#8B4513] mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </CollapsibleSection>

      {/* Junior Tiers */}
      <CollapsibleSection title="Junior Tiers" icon={<TrendingUp className="w-5 h-5" />} defaultOpen>
        <div className="mt-3 space-y-3 text-sm text-gray-700 leading-relaxed">
          <p>
            Excluding the Alberta Major Female Division, we have three (3) tiers of Junior Lacrosse:{' '}
            <strong>Junior B Tier II</strong>, <strong>Junior B Tier I</strong> and <strong>Junior A</strong>.
            The main difference between each tier is the increased level of play. As players develop their skills,
            the game becomes faster, harder hitting and with each level, game strategy becomes even more of an integral
            part of a team's success.
          </p>
          <p>
            A player's commitment also increases with each level — a Junior B Tier II player is most likely on
            the floor 2 to 3 times a week, whereas a Junior A player is on the floor 4 to 5 times a week.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="font-semibold text-blue-900 mb-1">2025 First-Year Junior Breakdown</p>
            <p className="text-blue-800 text-xs mb-2">Of the 170 first-year Juniors who played in the RMLL:</p>
            <div className="flex gap-3 flex-wrap">
              <div className="bg-white rounded px-3 py-1.5 text-center border border-blue-200">
                <p className="text-lg font-bold text-[#013fac]">108</p>
                <p className="text-xs text-gray-600">Tier II</p>
              </div>
              <div className="bg-white rounded px-3 py-1.5 text-center border border-blue-200">
                <p className="text-lg font-bold text-[#013fac]">58</p>
                <p className="text-xs text-gray-600">Tier I</p>
              </div>
              <div className="bg-white rounded px-3 py-1.5 text-center border border-blue-200">
                <p className="text-lg font-bold text-[#013fac]">4</p>
                <p className="text-xs text-gray-600">Junior A</p>
              </div>
            </div>
          </div>

          <p>
            The Junior B Tier II Franchises are the entry-level teams for most first-year Juniors. During the five-year
            span of Junior Lacrosse, players are encouraged to move up through the Junior Tiers as their skill level develops.
            The two Tiers of Junior B are responsible for player development and provide players with the tools to further
            their playing skills.
          </p>
        </div>
      </CollapsibleSection>

      {/* Boundaries */}
      <CollapsibleSection title="Boundaries" icon={<MapPin className="w-5 h-5" />}>
        <div className="mt-3 space-y-3 text-sm text-gray-700 leading-relaxed">
          <p>
            Boundaries for the initial registration of a first-year Junior is with your Minor Club if your Club offers
            a Tier II Franchise. If your Minor Club does not offer a Tier II Franchise, then you may be a Tier II Free Agent
            and may register with any Tier II Franchise.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <p className="text-amber-900 text-xs">
                  If a player, in the last year of U17, was given a <strong>one-year release</strong> from their Minor Club
                  to play in another Minor Club, then the player's rights are held by the Club giving the release.
                </p>
                <p className="text-amber-900 text-xs">
                  If a player, in the last year of U17, was given a <strong>permanent release</strong> from their Minor Club
                  to play in another Minor Club, then the player's rights are held by the last Club they played for.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Registration */}
      <CollapsibleSection title="Registration" icon={<ClipboardList className="w-5 h-5" />}>
        <div className="mt-3 space-y-3 text-sm text-gray-700 leading-relaxed">
          <p>
            In addition to a player registering directly with an RMLL Alberta Franchise, the player must also complete
            an <strong>RMLL Intent-to-Play</strong>. The RMLL Intent-to-Play also aligns with the ALA Registration System
            and Lacrosse Canada's Transfer System.
          </p>
          <p>
            To align the RMLL and ALA systems with Lacrosse Canada's interprovincial transfer system, we are anticipating
            opening registration for Intent-to-Play for the 2026 Box Lacrosse Season by February 1, 2026.
          </p>
          <p>
            A communication will be sent out once the 2026 Box Season registration is open. The Intent-to-Play information
            is also posted on the RMLL website.
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center gap-3">
            <ClipboardList className="w-5 h-5 text-[#013fac] flex-shrink-0" />
            <p className="text-sm text-gray-700 flex-1">
              See the <strong>Intent-to-Play</strong> page for full registration details and the RAMP registration link.
            </p>
          </div>
        </div>
      </CollapsibleSection>

      {/* Entry Drafts Overview */}
      <CollapsibleSection title="Junior Entry Drafts" icon={<Users className="w-5 h-5" />}>
        <div className="mt-3 space-y-3 text-sm text-gray-700 leading-relaxed">
          <p>
            To assist with keeping the competitiveness of Franchises in a Division consistent, the Junior A Division and
            the Junior B Tier I Division hold <strong>annual Drafts in February</strong>.
          </p>
          <p>
            <strong>Graduating U17 Player Draft</strong> — At the end of each playing season, the ALA provides the RMLL with a list
            of all the U17 players graduating from the season just completed. All male players on this list are eligible for
            the Junior A and Tier I Graduating U17 Player Drafts.
          </p>
          <p>
            Each of the Alberta Junior A Franchises draft <strong>ten (10) players</strong> from this list and each of the
            Alberta Junior B Tier I Franchises may draft up to <strong>twenty (20)</strong> from the list.
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-red-800 text-xs">
                Players drafted by both a Jr. A Franchise and Jr. B Tier I Franchise <strong>must attend the tryouts
                of both</strong> the Jr. A Franchise and the Jr. B Tier I Franchise.
              </p>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Rosters */}
      <CollapsibleSection title="Rosters" icon={<ClipboardList className="w-5 h-5" />}>
        <div className="mt-3 text-sm text-gray-700 leading-relaxed">
          <p className="mb-3">
            In Major, each Franchise can have a <strong>maximum roster of 25 players</strong>. Exceptions:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left px-3 py-1.5 font-semibold text-gray-700 border-b">Division</th>
                  <th className="text-center px-3 py-1.5 font-semibold text-gray-700 border-b">Max Roster</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100"><td className="px-3 py-1.5">Junior A, Jr. B Tier I</td><td className="text-center px-3 py-1.5 font-bold">25</td></tr>
                <tr className="border-b border-gray-100 bg-gray-50"><td className="px-3 py-1.5">Alberta Series Lacrosse (Sr. B), Jr. B Tier II, Alberta Major Female</td><td className="text-center px-3 py-1.5 font-bold">30</td></tr>
                <tr className="border-b border-gray-100"><td className="px-3 py-1.5">Senior Major Female, Senior C</td><td className="text-center px-3 py-1.5 font-bold">40</td></tr>
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-gray-600 text-xs">
            For all Franchises in all Divisions, you can only dress <strong>20 players</strong> for each game
            (max 18 runners and 2 goalies).
          </p>
        </div>
      </CollapsibleSection>

      {/* Travel */}
      <CollapsibleSection title="Travel" icon={<Truck className="w-5 h-5" />}>
        <div className="mt-3 text-sm text-gray-700 leading-relaxed">
          <p>
            All Franchises in Major lacrosse, regardless of the Division they are in, must travel. It's up to the
            policies of the individual Franchises whether buses are used for travel games.
          </p>
        </div>
      </CollapsibleSection>

      {/* Schedules */}
      <CollapsibleSection title="Schedules" icon={<CalendarDays className="w-5 h-5" />}>
        <div className="mt-3 space-y-3 text-sm text-gray-700 leading-relaxed">
          <p>
            We try to have all Division schedules posted on the RMLL website by <strong>mid March</strong>.
            This gives players a six-week notice period in case they must arrange or re-arrange work schedules, etc.
          </p>
          <p>
            Depending on arena availability, we try to schedule weekday games against two teams in the same
            local area, leaving Saturday and Sunday for travel games (i.e. team travels or team plays a traveling team).
          </p>
        </div>
      </CollapsibleSection>

      {/* Player Development / Call-ups */}
      <CollapsibleSection title="Player Development & Call-ups" icon={<TrendingUp className="w-5 h-5" />}>
        <div className="mt-3 space-y-3 text-sm text-gray-700 leading-relaxed">
          <p>
            Call-ups are an important piece of player development. The number of times a player can be a call-up during
            a season is <strong>unlimited</strong>. To encourage call-ups, each Tier has a set night for weekday games:
          </p>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500 font-semibold uppercase">Tier II</p>
              <p className="text-sm font-bold text-gray-900 mt-1">Mon & Wed</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500 font-semibold uppercase">Tier I</p>
              <p className="text-sm font-bold text-gray-900 mt-1">Tue & Thu</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500 font-semibold uppercase">Junior A</p>
              <p className="text-sm font-bold text-gray-900 mt-1">Wednesday</p>
            </div>
          </div>
          <p>
            This allows a Tier II player to be a call-up for a Tier I team on a Tuesday and Thursday, and for a
            Tier I player to be a call-up for a Junior A team on a Wednesday.
          </p>
        </div>
      </CollapsibleSection>

      {/* Division Links */}
      <h2>Junior Division Information</h2>
      <p className="text-sm text-gray-600 mb-3">
        Visit each division's page for detailed Division Info and Season Info:
      </p>
      <div className="not-prose grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Junior B Tier II', division: 'Junior B Tier II' },
          { label: 'Junior B Tier I', division: 'Junior B Tier I' },
          { label: 'Junior A', division: 'Junior A' },
        ].map((d) => (
          <button
            key={d.division}
            onClick={() => navigateToHomePage('division-info', { divisionName: d.division })}
            className="flex items-center justify-between gap-2 bg-white border border-gray-200 rounded-lg px-4 py-3 hover:border-[#013fac] hover:bg-blue-50/50 transition-colors text-left group"
          >
            <div>
              <p className="font-bold text-gray-900 text-sm group-hover:text-[#013fac]">{d.label}</p>
              <p className="text-xs text-gray-500">Division & Season Info</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#013fac]" />
          </button>
        ))}
      </div>

      {/* Combines */}
      <h2>2026 Junior Combines</h2>
      <p className="text-sm text-gray-600 mb-1">
        If you have an interest in playing Junior A and/or Junior B Tier I, please plan to attend the RMLL
        South or North Combine. Attending a combine allows you the opportunity to highlight your skills to the
        coaching staff of the Junior A and Junior B Tier I Franchises prior to the Drafts.
      </p>
      <div className="not-prose grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
        {/* North Combine */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-[#013fac] text-white px-4 py-2.5">
            <h4 className="font-bold text-sm">North Junior Combine</h4>
          </div>
          <div className="p-4 space-y-2 text-sm">
            <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-400" /><span>Saturday, January 24, 2026</span></div>
            <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-gray-400" /><span>6:00 PM to 9:00 PM</span></div>
            <div className="flex items-start gap-2"><MapPin className="w-4 h-4 text-gray-400 mt-0.5" /><span>Servus Credit Union Place – Orion Plastics S Field House, St. Albert</span></div>
            <div className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-gray-400" /><span className="font-semibold">$40.00</span></div>
            <p className="text-xs text-gray-600">
              <strong>Who:</strong> Graduating U17 players from GELC, Wheatland, and Grande Prairie Minor Lacrosse Clubs
              as well as Tier II players from Tier II teams located in Grande Prairie, GELC and Wheatland areas.
            </p>
            <p className="text-xs text-red-700 font-semibold">Registration Deadline: Monday, January 19, 2026</p>
            <a
              href="https://www.sportzsoft.com/regApp/Login?OrgId=4023"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#013fac] hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Register for North Combine
            </a>
          </div>
        </div>
        {/* South Combine */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-[#013fac] text-white px-4 py-2.5">
            <h4 className="font-bold text-sm">South Junior Combine</h4>
          </div>
          <div className="p-4 space-y-2 text-sm">
            <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-400" /><span>Sunday, February 15, 2026</span></div>
            <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-gray-400" /><span>11:30 AM to 2:30 PM</span></div>
            <div className="flex items-start gap-2"><MapPin className="w-4 h-4 text-gray-400 mt-0.5" /><span>Scotiabank Saddledome, Calgary</span></div>
            <div className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-gray-400" /><span className="font-semibold">$70.00</span> <span className="text-xs text-gray-500">(includes Roughnecks/Georgia Swarm game ticket at 6:00 PM)</span></div>
            <p className="text-xs text-gray-600">
              <strong>Who:</strong> CALL, CDLA, and SALA Graduating U17 and Tier II Players.
            </p>
            <p className="text-xs text-red-700 font-semibold">Registration Deadline: Monday, February 9, 2026</p>
            <div className="bg-amber-50 border border-amber-200 rounded p-2 text-xs text-amber-800">
              <strong>Note:</strong> Registration is limited to 72 players and 12 goalies — register early!
            </div>
            <div className="flex flex-col gap-1">
              <a
                href="https://www.sportzsoft.com/regApp/Login?OrgId=4023"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#013fac] hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Register for South Combine
              </a>
              <a
                href="https://waiver.smartwaiver.com/e/bdNUd5vgHg3XWFhH688DE6/web/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Complete Saddledome Waiver (required)
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 2026 Draft Details */}
      <h2>Junior A and Junior B Tier I Draft Detail &amp; 2026 Drafts</h2>

      {/* Jr. A Draft Details */}
      <CollapsibleSection title="Junior A Graduating U17 Player Draft" icon={<Trophy className="w-5 h-5" />} accentColor="border-[#8B4513]" defaultOpen>
        <div className="mt-3 space-y-3 text-sm text-gray-700 leading-relaxed">
          <p>
            <strong>2026 Draft Eligible – Alberta Jr. A Teams:</strong> All U17 Players born in 2009 and on the ALA Male Graduating U17 Player List.
          </p>
          <p>
            Up until the draft date, all Graduating U17 Players on the Graduating U17 Player List from CALL, CDLA and SALA
            Minor Lacrosse Clubs may attend any/all open floor sessions of the Jr. A Mounties and/or Jr. A Raiders.
          </p>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
            <p className="font-semibold text-gray-800 text-xs uppercase tracking-wider">Protected List</p>
            <p className="text-xs text-gray-700">
              Drafted players are automatically added to the Junior A Franchise's Protected List and the Junior A Franchise
              holds the player's Junior A playing rights for all <strong>five (5) years</strong> of the player's Junior eligibility
              until the player is released or traded. A non-drafted player can be added to a Jr. A Franchise's Protected List,
              if the player gives written permission, agreeing to be added.
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
            <p className="font-semibold text-gray-800 text-xs uppercase tracking-wider">Jr. A Free Agents</p>
            <p className="text-xs text-gray-700">
              A player not on a Junior A Protected List is a Jr. A Free Agent. Jr. A Free Agents who reside north of the CALL
              boundary may try out for the Jr. A Miners. Jr. A Free Agents who reside in CALL, CDLA and SALA areas may try out for the
              Jr. A Mounties and/or the Jr. A Raiders. (A drafted/protected player can only attend the tryouts of the Jr. A team
              which drafted/protected them).
            </p>
          </div>

          <div className="space-y-2 text-xs text-gray-700">
            <p>The <strong>Calgary Junior A Mountaineers</strong> and the <strong>Calgary Junior A Raiders</strong> each draft ten Graduating U17 Players from the CALL, CDLA and SALA Minor Lacrosse Clubs.</p>
            <p>The <strong>Edmonton Junior A Miners</strong> draft ten Graduating U17 Players from the GELC and Wheatland Minor Lacrosse Clubs as well as from the Grande Prairie Lacrosse Association.</p>
            <p>The <strong>Saskatchewan SWAT</strong> draft ten players from the Province of Saskatchewan.</p>
            <p>The <strong>Winnipeg Blizzard</strong> draft ten players from the Province of Manitoba.</p>
          </div>

          <DraftCard
            title="2026 Junior A Graduating U17 Player Draft"
            teams="Mounties, Raiders, Miners, SWAT, Blizzard"
            eligiblePlayers="All U17 Players born in 2009 on the ALA Male Graduating U17 Player List."
            date="Monday, February 16, 2026"
            time="7:00 PM"
            location="Acadia Recreation Centre – Rose Hall – 240 90 Ave S.E., Calgary"
            draftOrder={['Jr. A Blizzard', 'Jr. A Swat', 'Jr. A Miners', 'Jr. A Mounties', 'Jr. A Raiders']}
            notes="The Jr. A Miners, Saskatchewan Swat and Winnipeg Blizzard will be attending the Draft virtually."
          />
        </div>
      </CollapsibleSection>

      {/* Jr. B Tier I Draft Details */}
      <CollapsibleSection title="Junior B Tier I Entry Draft" icon={<Trophy className="w-5 h-5" />} accentColor="border-[#8B4513]" defaultOpen>
        <div className="mt-3 space-y-3 text-sm text-gray-700 leading-relaxed">
          <p>
            Up until the draft dates, all Graduating U17 Players on the Graduating U17 Player List may attend any Junior B Tier I floor time.
            Up until the draft dates, all Tier II players not currently listed on a Junior B Tier I Franchise's Protected List may attend any Junior B Tier I floor time.
          </p>
          <p>
            The drafts help to keep the competitiveness of Franchises in a local area consistent.
            The drafts must be held each year in February and the Junior B Tier I drafts will take place <strong>after the Junior A Drafts</strong>.
          </p>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
            <p className="font-semibold text-gray-800 text-xs uppercase tracking-wider">Protected List</p>
            <p className="text-xs text-gray-700">
              Drafted players are automatically added to the Junior B Tier I Franchise's Protected List. A player can remain
              on a Jr. B Tier I team's Protected List for all <strong>five (5) years</strong> of their Junior eligibility unless released,
              traded, or not registered to the team's roster for <strong>two (2) consecutive playing seasons</strong>. An exception
              to the two consecutive playing seasons is a Jr. B Tier I drafted player on a Junior A roster — this player can remain
              on the Tier I Protected List for all five (5) years of their Junior eligibility unless released or traded. A non-drafted
              player can be added to a Junior B Tier I Franchise's Protected List, if the player gives written permission.
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
            <p className="font-semibold text-gray-800 text-xs uppercase tracking-wider">Junior B Tier I Free Agents</p>
            <p className="text-xs text-gray-700">
              All Graduating U17 Players on the Graduating U17 Player List for the Season who are not drafted will become Junior B Tier I Free Agents.
              All Tier II players who are not on a team's Protected List are Junior B Tier I Free Agents.
            </p>
          </div>

          <h4 className="font-bold text-gray-900 text-sm pt-2">2026 Junior B Tier I Graduating U17 Player Drafts</h4>
          <p className="text-xs text-gray-600">
            <strong>Draft Eligible:</strong> All Alberta U17 Players born in 2009 and on the ALA Male Graduating U17 Player List.
          </p>

          <div className="space-y-4 pt-2">
            <DraftCard
              title="Junior B Tier I Central Draft"
              teams="Rampage and Mavericks"
              eligiblePlayers="Rounds 1–8: Rampage drafts from Red Deer Minor Lacrosse Association. Mavericks drafts from Olds & Innisfail Minor Lacrosse Associations. Rounds 9–20: Both teams draft from Blackfalds, Innisfail, Chargers, Kneehills, Lacoka, Olds, Red Deer, Stettler and Sylvan Lake Minor Lacrosse Associations."
              date="Tuesday, February 17, 2026"
              time="7:00 PM"
              location="Innisfail Legion – 5108 49 Ave #1, Innisfail"
              draftOrder={['Rampage', 'Mavericks']}
              streamInfo="Streamed Live – Mavericks TV YouTube channel"
            />

            <DraftCard
              title="Junior B Tier I South Draft"
              teams="Silvertips, Chill, Shamrocks, Mounties & Marauders"
              eligiblePlayers="Rounds 1–20: All 5 teams draft Graduating U17 Players from Rockyview Rage, Foothills Spurs, Okotoks Raiders, Strathmore Venom, Calgary Hornets, Calgary Knights, Calgary Axemen, and Calgary Sabrecats Minor Lacrosse Clubs."
              date="Wednesday, February 18, 2026"
              time="7:00 PM"
              draftOrder={['Calgary Mounties', 'Okotoks Marauders', 'Calgary Chill', 'Rockyview Silvertips', 'Calgary Shamrocks']}
            />

            <DraftCard
              title="Junior B Tier I North Draft"
              teams="Warriors, Outlaws, Crude & Rebels"
              eligiblePlayers="20 rounds of 4 selections from Blues, Beaumont, Fort Saskatchewan, Leduc, Parkland, Rams, Titans, Warriors, Westlock, Wizards, Grande Prairie, Flagstaff, Lakeland, Lloydminster, Vermilion, Wainwright, and Wood Buffalo Minor Lacrosse Associations."
              date="Friday, February 20, 2026"
              time="7:00 PM"
              location="St. Albert Community Hall – 17 Perron St., St. Albert"
              draftOrder={['Edmonton Warriors', 'Beaumont Outlaws', 'St. Albert Crude', 'Fort Saskatchewan Rebels']}
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* Contact Info */}
      <div className="not-prose mt-6">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
          <h3 className="font-bold text-gray-900 text-base mb-3 flex items-center gap-2">
            <Mail className="w-5 h-5 text-[#013fac]" />
            Contact Information
          </h3>
          <p className="text-sm text-gray-700 mb-4">
            For further information, team contact information or any additional questions about Junior
            Lacrosse, the RMLL Junior Divisions, drafts, player rights, etc., please feel free to contact:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.CONTACTS.map((c) => (
              <div key={c.email} className="bg-white border border-gray-200 rounded-lg p-3">
                <p className="text-xs text-gray-500 font-semibold uppercase">{c.role}</p>
                <p className="text-sm font-bold text-gray-900">{c.name}</p>
                <a href={`mailto:${c.email}`} className="text-xs text-[#013fac] hover:underline">{c.email}</a>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-700 italic">
              We sincerely hope you register for the 2026 Season and look forward to assisting you in any way
              we can as you continue playing <strong>"the fastest game on two feet"</strong>.
            </p>
            <p className="text-sm text-gray-700 mt-2">
              <strong>Christine Thielen</strong><br />
              Executive Director, RMLL<br />
              <a href="mailto:christinethielen@hotmail.com" className="text-[#013fac] hover:underline text-xs">christinethielen@hotmail.com</a>
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-200 flex items-center gap-3 text-xs text-gray-500">
            <Megaphone className="w-4 h-4" />
            <span>Follow the RMLL on X <strong>@RMLaxL</strong> and on Instagram <strong>@rocky.mountainlax</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}