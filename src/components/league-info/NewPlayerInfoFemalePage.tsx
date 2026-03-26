import { useState } from 'react';
import {
  GraduationCap, MapPin, Calendar, Clock, DollarSign, Users, Shield, ArrowRight,
  ChevronDown, ChevronUp, ExternalLink, Mail, Info, AlertTriangle,
  ClipboardList, Repeat, Truck, CalendarDays, TrendingUp, Globe
} from 'lucide-react';

/* ─── helpers ─── */
interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  accentColor?: string;
}

function CollapsibleSection({ title, icon, children, defaultOpen = false, accentColor = 'border-[#9b2d86]' }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`not-prose border-l-4 ${accentColor} bg-white rounded-lg shadow-sm overflow-hidden mb-4`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="text-[#9b2d86]">{icon}</span>
        <span className="flex-1 font-bold text-gray-900 text-base">{title}</span>
        {open ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </button>
      {open && <div className="px-4 pb-4 border-t border-gray-100">{children}</div>}
    </div>
  );
}

/* ─── data ─── */
const DIFFERENCES = [
  'Games are 3 × twenty-minute stop time periods, with 10-minute intermissions and a minimum 30-minute warmup.',
  'Season is usually longer than minor lacrosse (16 games) and playoffs run into mid/late June.',
  'Nets are bigger (4\'×4\'6″ instead of 4\'×4\'4″).',
  'Provincial travel (and in some divisions, inter-provincial travel).',
  'Home and away uniforms.',
  'New teams to play.',
  'Increased player commitment and higher skill level play.',
  'Five-year age category.',
  'Different tactics are introduced and developed.',
  'Higher trained coaches.',
  'Modified playing rules.',
];

const DIVISIONS = [
  { name: 'Alberta Series Lacrosse (Senior B)', teams: 5 },
  { name: 'Senior C', teams: 13 },
  { name: 'Junior A', teams: 5, note: 'includes a team from Saskatoon and a team from Winnipeg' },
  { name: 'Junior B Tier I', teams: 13, note: 'includes a team from Regina and a team from Saskatoon' },
  { name: 'Junior B Tier II', teams: 18 },
  { name: 'Alberta Sr. Major Female', teams: 2 },
  { name: 'Alberta Jr. Major Female', teams: 7 },
];

interface FranchiseInfo {
  name: string;
  region: 'north' | 'south';
  contacts: { role: string; email: string; phone?: string }[];
  website?: string;
  boundaryDescription?: string;
}

const NORTH_FRANCHISES: FranchiseInfo[] = [
  {
    name: 'Saint Albert Drillers',
    region: 'north',
    contacts: [
      { role: 'Head Coach / Manager', email: 'jrdrillers@gmail.com', phone: '780-222-6641' },
    ],
    website: 'https://drillerslacrosse.com',
    boundaryDescription:
      'West of the City of Edmonton, north of Highway 627 to Highway 759. Then north of Township Road 514. North of the City of Edmonton to the west side of the North Saskatchewan River. From the river the north side of Township Road 542 to Range Road 224. West side of Range Road 224 to Township Road 544. North side of Township Road 544 to Range Road 220/215. West side of Range Road 220/215 north to Highway 15. North side of Highway 15 to Highway 855, then west side of Highway 855 heading north.',
  },
  {
    name: 'Sherwood Park Titans',
    region: 'north',
    contacts: [
      { role: 'Head Coach', email: 'megchuck@shaw.ca' },
    ],
    boundaryDescription:
      'East of the City of Edmonton. East side of Range Road 234 and as far south as Township Road 510, north side of Township Road 510. To Highway 14 then north side of Highway 14 east. North boundary is east of the City of Edmonton up to Highway 16 then the north side of Highway 16 to the North Saskatchewan River then the east side of the river to the south side of Township Road 542 to Range Road 224, east side of Range Road 224 to Township Road 544. South side of Township Road 544 to Range Road 220/215. East side of Range Road 220/215 north to Highway 15. South side of Highway 15 to Highway 855, east side of Highway 855 heading north.',
  },
  {
    name: 'Edmonton Capital Region Saints',
    region: 'north',
    contacts: [
      { role: 'Manager', email: 'capitalregionsaintsmanager@gmail.com' },
    ],
    boundaryDescription:
      'City of Edmonton proper. East boundary is west side of Range Road 234 and south side of Township Road 510 until Highway 14, then south side of Highway 14. To the west, south of Highway 627 to Highway 759 then south of Township Road 514.',
  },
  {
    name: 'Red Deer Riot',
    region: 'north',
    contacts: [
      { role: 'Manager', email: 'riotfemalelax@gmail.com' },
    ],
    boundaryDescription:
      'CALL boundaries including Blackfalds, Didsbury, Innisfail, Three Hills, Lacoka, Olds, Red Deer, Stettler and Sylvan Lake.',
  },
];

const SOUTH_FRANCHISES: FranchiseInfo[] = [
  {
    name: 'Silvertips Major Female',
    region: 'south',
    contacts: [
      { role: 'Head Coach / General Manager', email: 'robintf@telus.net' },
      { role: 'Manager', email: 'egert06@gmail.com' },
    ],
    website: 'http://rockyviewlacrosse.com',
  },
  {
    name: 'Calgary Cardinals',
    region: 'south',
    contacts: [
      { role: 'Head Coach', email: 'dhalcro@its.jnj.com' },
      { role: 'Manager', email: 'pepi.supino@yahoo.ca' },
    ],
  },
  {
    name: 'Valkyries Lacrosse',
    region: 'south',
    contacts: [
      { role: 'Head Coach', email: 'jrvalkryies.coach@gmail.com' },
      { role: 'Manager', email: 'jrvalkyries.manager@gmail.com' },
    ],
  },
];

const KEY_CONTACTS = [
  { role: 'Major Female Division Commissioner', name: 'Alex Traboulay', email: 'abladieslaxcomish@gmail.com' },
  { role: 'Executive Director', name: 'Christine Thielen', email: 'christinethielen@hotmail.com' },
  { role: 'President', name: 'Duane Bratt', email: 'dbratt@mtroyal.ca' },
];

/* ─── franchise card ─── */
function FranchiseCard({ franchise }: { franchise: FranchiseInfo }) {
  const [showBoundary, setShowBoundary] = useState(false);
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className={`px-4 py-2.5 ${franchise.region === 'north' ? 'bg-[#9b2d86]' : 'bg-[#c2185b]'} text-white`}>
        <h4 className="font-bold text-sm">{franchise.name}</h4>
      </div>
      <div className="p-4 space-y-2 text-sm">
        {franchise.contacts.map((c, i) => (
          <div key={i} className="flex items-start gap-2">
            <Mail className="w-3.5 h-3.5 text-gray-400 mt-1 flex-shrink-0" />
            <div>
              <span className="text-xs text-gray-500">{c.role}</span>
              <div className="flex items-center gap-2 flex-wrap">
                <a href={`mailto:${c.email}`} className="text-[#9b2d86] hover:underline text-xs break-all">{c.email}</a>
                {c.phone && <span className="text-xs text-gray-500">| {c.phone}</span>}
              </div>
            </div>
          </div>
        ))}
        {franchise.website && (
          <div className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <a href={franchise.website} target="_blank" rel="noopener noreferrer" className="text-[#9b2d86] hover:underline text-xs inline-flex items-center gap-1">
              Website <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
        {franchise.boundaryDescription && (
          <div className="pt-1">
            <button
              onClick={() => setShowBoundary(!showBoundary)}
              className="text-xs font-semibold text-gray-600 hover:text-[#9b2d86] flex items-center gap-1"
            >
              <MapPin className="w-3.5 h-3.5" />
              {showBoundary ? 'Hide' : 'View'} Boundary Details
              {showBoundary ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {showBoundary && (
              <p className="text-xs text-gray-600 mt-1.5 leading-relaxed bg-gray-50 p-2 rounded border border-gray-100">
                {franchise.boundaryDescription}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── main component ─── */
export function NewPlayerInfoFemalePage() {
  return (
    <div>
      {/* Hero welcome */}
      <div className="not-prose mb-6">
        <div className="bg-gradient-to-r from-[#9b2d86] to-[#c2185b] rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-start gap-4">
            <div className="bg-white/20 rounded-lg p-3 flex-shrink-0">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-pink-200 text-sm font-semibold uppercase tracking-wider">To: All Alberta Female Players Born in 2009</p>
              <h3 className="text-2xl font-black mt-1 mb-2">WELCOME to Major Female Lacrosse!</h3>
              <p className="text-pink-100 text-sm leading-relaxed">
                Major Lacrosse is for those players aging out of Minor Lacrosse who still wish to play competitive
                lacrosse. The growth and sustainability of Major Lacrosse teams is dependent on the number of
                players coming up from Minor Lacrosse.
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/20 flex items-center gap-2 text-sm">
            <Shield className="w-4 h-4 text-pink-200" />
            <span className="text-pink-100">Division Commissioner: </span>
            <strong>Alex Traboulay</strong>
            <span className="text-pink-200 mx-1">—</span>
            <a href="mailto:abladieslaxcomish@gmail.com" className="underline text-white hover:text-pink-200">abladieslaxcomish@gmail.com</a>
          </div>
        </div>
      </div>

      {/* Differences */}
      <CollapsibleSection title="Differences Between Minor & Major Lacrosse" icon={<Repeat className="w-5 h-5" />} defaultOpen>
        <div className="mt-3">
          <p className="text-sm text-gray-700 mb-3">Some of the significant differences between Minor and Major Lacrosse:</p>
          <div className="space-y-1.5">
            {DIFFERENCES.map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <ArrowRight className="w-4 h-4 text-[#9b2d86] mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </CollapsibleSection>

      {/* Age Groups & Governance */}
      <CollapsibleSection title="Age Groups & RMLL Structure" icon={<Shield className="w-5 h-5" />} defaultOpen>
        <div className="mt-3 space-y-3 text-sm text-gray-700 leading-relaxed">
          <p>
            Major Lacrosse encompasses all players who turn 17 as of December 31, 2026 (birth year 2009) and includes
            two age groups: <strong>Junior</strong> and <strong>Senior</strong>. Junior lacrosse is for players between 17
            and 21 years old as of December 31, 2026, and Senior lacrosse is for players over the age of 21 who still wish
            to play competitive lacrosse. The governing body for Alberta Major Female Lacrosse is the{' '}
            <strong>Rocky Mountain Lacrosse League (RMLL)</strong>.
          </p>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <p className="font-semibold text-purple-900 mb-1 text-xs uppercase tracking-wider">Junior Program Structure</p>
            <p className="text-purple-800 text-xs">
              The Junior Division is one of the four Divisions in our Junior Program. The Junior Men's Program is divided
              into 3 tiers (Junior B Tier II, Junior B Tier I, and Junior A). The Alberta Major Female division has an{' '}
              <strong>interlocking schedule</strong> with the Alberta Major Senior Female division.
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="font-semibold text-gray-800 mb-2">There are 7 Divisions and 63 teams in the RMLL:</p>
            <div className="space-y-1">
              {DIVISIONS.map((div, i) => {
                const isFemale = div.name.includes('Female');
                return (
                  <div key={i} className={`flex items-start gap-2 ${isFemale ? 'bg-purple-50 rounded px-2 py-0.5 -mx-2' : ''}`}>
                    <span className={`text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5 ${isFemale ? 'bg-[#9b2d86] text-white' : 'bg-gray-300 text-gray-700'}`}>
                      {div.teams}
                    </span>
                    <span>
                      <strong className={isFemale ? 'text-[#9b2d86]' : ''}>{div.name}</strong>
                      {div.note && <span className="text-gray-500 text-xs ml-1">({div.note})</span>}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <p>
            Each RMLL Division has a <strong>Commissioner</strong> who is voted annually by the franchises in each division.
            The Commissioner is a member of the RMLL Executive, represents the franchises on the Executive and is
            responsible for administration of the division. All RMLL divisions must meet the same standards and are treated equally.
          </p>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 flex items-center gap-3">
            <Mail className="w-5 h-5 text-[#9b2d86] flex-shrink-0" />
            <p className="text-sm text-purple-900">
              The Commissioner for the Major Female division is{' '}
              <strong>Alex Traboulay</strong>{' '}
              (<a href="mailto:abladieslaxcomish@gmail.com" className="text-[#9b2d86] underline hover:text-purple-600">abladieslaxcomish@gmail.com</a>)
            </p>
          </div>
        </div>
      </CollapsibleSection>

      {/* Info Session Note */}
      <div className="not-prose mb-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-amber-800 mb-1">Graduating U17 Information Session</p>
            <p className="text-sm text-amber-700">
              The Alberta Major Female division <strong>will not be attending</strong> the U17 info sessions for 2026.
              Please reach out to the commissioner or coaches/clubs in your area for additional information.
            </p>
          </div>
        </div>
      </div>

      {/* Boundaries & Franchises — North */}
      <CollapsibleSection title="North Franchises & Boundaries" icon={<MapPin className="w-5 h-5" />} defaultOpen>
        <div className="mt-3 space-y-3">
          <p className="text-sm text-gray-700">
            Boundaries for the Alberta Major Female division differ slightly from Minor Lacrosse programs.
            First playing rights for Graduating U17 players are determined by the boundaries below.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {NORTH_FRANCHISES.map((f) => (
              <FranchiseCard key={f.name} franchise={f} />
            ))}
          </div>
        </div>
      </CollapsibleSection>

      {/* Boundaries & Franchises — South */}
      <CollapsibleSection title="South Franchises & Draft (CDLA)" icon={<MapPin className="w-5 h-5" />} defaultOpen>
        <div className="mt-3 space-y-3">
          <p className="text-sm text-gray-700">
            U17 players residing in Calgary and area playing under CDLA will be in the south draft and selected
            by one of the following clubs:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {SOUTH_FRANCHISES.map((f) => (
              <FranchiseCard key={f.name} franchise={f} />
            ))}
          </div>

          {/* Draft details */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mt-3">
            <div className="bg-[#c2185b] text-white px-4 py-2.5">
              <h4 className="font-bold text-sm">2026 South Draft</h4>
              <p className="text-xs text-pink-100 mt-0.5">Hosted by the Cardinals</p>
            </div>
            <div className="p-4 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">Sunday, February 1, 2026</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">4:00 PM</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                <span className="text-gray-700">Hudson's Pub South, 16061 Macleod Trail SE, Calgary</span>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded p-2 text-xs text-gray-700 mt-2">
                <strong>Free Agents:</strong> Players who are not drafted or residing outside of the above boundaries are
                considered "Free Agents" and may register with the Franchise (team) of their choice. For any questions,
                please contact the division commissioner.
              </div>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Registration */}
      <CollapsibleSection title="Registration" icon={<ClipboardList className="w-5 h-5" />} defaultOpen>
        <div className="mt-3 space-y-3 text-sm text-gray-700 leading-relaxed">
          <p className="font-semibold text-gray-900">Registration in the RMLL is a two-step process:</p>

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="flex items-stretch">
              <div className="bg-[#9b2d86] text-white font-bold flex items-center justify-center px-4 text-lg flex-shrink-0">1</div>
              <div className="p-3 space-y-2">
                <p className="font-semibold text-gray-900 text-sm">Complete RMLL Intent-to-Play</p>
                <p className="text-xs text-gray-700">
                  A player cannot go on the floor with an RMLL team unless they have completed the Intent-to-Play form.
                  See the <strong>Intent-to-Play</strong> page for full details and the RAMP registration link.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs text-blue-800">
                  <strong>Note:</strong> The RMLL Intent-to-Play also aligns with the ALA Registration System and Lacrosse
                  Canada's Transfer System. We are anticipating opening registration for Intent-to-Play for the 2026 Box
                  Lacrosse Season by February 1, 2026. A communication will be sent out once the 2026 Box Season
                  registration is open.
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="flex items-stretch">
              <div className="bg-[#9b2d86] text-white font-bold flex items-center justify-center px-4 text-lg flex-shrink-0">2</div>
              <div className="p-3 space-y-2">
                <p className="font-semibold text-gray-900 text-sm">Complete Club-Specific Registration</p>
                <p className="text-xs text-gray-700">
                  Clubs may have different fees and registration processes. All first-year Juniors must register with the
                  club/team holding their playing rights. If you are not aware of which team that may be, please e-mail
                  Alex at{' '}
                  <a href="mailto:abladieslaxcomish@gmail.com" className="text-[#9b2d86] underline">abladieslaxcomish@gmail.com</a>
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-start gap-2">
            <DollarSign className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-700">
              <strong>Note:</strong> The RMLL Intent-to-Play includes submitting an ALA Player Registration Fee of{' '}
              <strong>$87.00</strong> plus an admin fee.
            </p>
          </div>
        </div>
      </CollapsibleSection>

      {/* Free Agents */}
      <CollapsibleSection title="Free Agents" icon={<Users className="w-5 h-5" />}>
        <div className="mt-3 text-sm text-gray-700 leading-relaxed">
          <p>
            Any Alberta Major Female "Free Agent" is a player who resides <strong>outside</strong> of the documented boundaries
            for the seven Alberta Major Female Franchises set forth above, or has gone undrafted. Free agents may register
            with the Franchise of their choice.
          </p>
        </div>
      </CollapsibleSection>

      {/* Rosters */}
      <CollapsibleSection title="Team Rosters" icon={<ClipboardList className="w-5 h-5" />}>
        <div className="mt-3 text-sm text-gray-700 leading-relaxed">
          <p className="mb-3">
            In Major Lacrosse, each team can have a maximum roster size depending on the division:
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
                <tr className="border-b border-gray-100 bg-purple-50"><td className="px-3 py-1.5 font-semibold text-[#9b2d86]">Jr. Major Female, Alberta Series Lacrosse (Sr. B)</td><td className="text-center px-3 py-1.5 font-bold text-[#9b2d86]">30</td></tr>
                <tr className="border-b border-gray-100 bg-purple-50"><td className="px-3 py-1.5 font-semibold text-[#9b2d86]">Sr. Major Female, Senior C</td><td className="text-center px-3 py-1.5 font-bold text-[#9b2d86]">40</td></tr>
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-gray-600 text-xs">
            For all teams in all Divisions, only <strong>20 players</strong> can dress for each game
            (max 18 runners and 2 goalies).
          </p>
        </div>
      </CollapsibleSection>

      {/* Travel */}
      <CollapsibleSection title="Travel" icon={<Truck className="w-5 h-5" />}>
        <div className="mt-3 text-sm text-gray-700 leading-relaxed">
          <p>
            All franchises in Major lacrosse, regardless of division, must travel. It's up to the policies of the
            individual franchise whether buses are used for travel games.
          </p>
        </div>
      </CollapsibleSection>

      {/* Schedules */}
      <CollapsibleSection title="Schedules" icon={<CalendarDays className="w-5 h-5" />}>
        <div className="mt-3 text-sm text-gray-700 leading-relaxed">
          <p>
            Schedules should be posted on the RMLL website by <strong>mid-March</strong>. This allows players a six-week
            notice period in case they must arrange or re-arrange work schedules, etc. Depending on arena availability,
            weekday games involve teams from the same local area, leaving weekends for travel games.
          </p>
        </div>
      </CollapsibleSection>

      {/* Player Development */}
      <CollapsibleSection title="Player Development & Affiliates" icon={<TrendingUp className="w-5 h-5" />}>
        <div className="mt-3 space-y-3 text-sm text-gray-700 leading-relaxed">
          <p>
            Affiliates are an important aspect of player development. The number of times a player can be a call-up
            during a season is <strong>unlimited</strong>.
          </p>
          <p>
            To encourage affiliates, the Alberta Major Female Division has traditionally had a set night for weekday games:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500 font-semibold uppercase">Jr. Major Female</p>
              <p className="text-sm font-bold text-[#9b2d86] mt-1">Wednesday</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500 font-semibold uppercase">Sr. Women</p>
              <p className="text-sm font-bold text-[#9b2d86] mt-1">Tuesday</p>
            </div>
          </div>
          <p>
            This allows a Major Female player to affiliate to a Senior Women's Franchise on Tuesdays.
          </p>
        </div>
      </CollapsibleSection>

      {/* Governance note */}
      <CollapsibleSection title="Governance" icon={<Shield className="w-5 h-5" />}>
        <div className="mt-3 text-sm text-gray-700 leading-relaxed">
          <p>
            Governance rules in Major Lacrosse are different from Minor Lacrosse and policies may change from division
            to division depending on if a division has their own Operating Policy.
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Follow the RMLL on X <strong>@RMLaxL</strong> and on Instagram <strong>@rocky.mountainlax</strong>
          </p>
        </div>
      </CollapsibleSection>

      {/* Contact Info */}
      <div className="not-prose mt-6">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
          <h3 className="font-bold text-gray-900 text-base mb-3 flex items-center gap-2">
            <Mail className="w-5 h-5 text-[#9b2d86]" />
            Contact Information
          </h3>
          <p className="text-sm text-gray-700 mb-4">
            For further information, franchise contact information, or any additional questions about the Alberta
            Major Female Division, the RMLL, player rights, etc., please feel free to contact:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {KEY_CONTACTS.map((c) => (
              <div key={c.email} className="bg-white border border-gray-200 rounded-lg p-3">
                <p className="text-xs text-gray-500 font-semibold uppercase">{c.role}</p>
                <p className="text-sm font-bold text-gray-900">{c.name}</p>
                <a href={`mailto:${c.email}`} className="text-xs text-[#9b2d86] hover:underline break-all">{c.email}</a>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-700 italic">
              We sincerely hope you register for the 2026 Season and look forward to assisting you in any way
              we can as you continue playing <strong>"the fastest game on two feet!"</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
