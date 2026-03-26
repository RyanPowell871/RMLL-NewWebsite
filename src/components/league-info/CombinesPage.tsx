import { useState } from 'react';
import {
  Users, Calendar, MapPin, DollarSign, Clock, ChevronDown, ChevronRight,
  ExternalLink, AlertTriangle, FileText, Info, UserCheck
} from 'lucide-react';

const SPORTZSOFT_REG_URL = 'https://www.sportzsoft.com/regApp/Login?OrgId=4023';
const SOUTH_WAIVER_URL = 'https://waiver.smartwaiver.com/e/bdNUd5vgHg3XWFhH688DE6/web/';

interface CombineInfo {
  name: string;
  region: 'north' | 'south';
  date: string;
  time: string;
  location: string;
  locationDetail?: string;
  cost: string;
  costNote?: string;
  who: string;
  registrationDeadline: string;
  registrationUrl: string;
  waiverUrl?: string;
  waiverNote?: string;
  capacityNote?: string;
}

const COMBINES: CombineInfo[] = [
  {
    name: 'North Junior Combine',
    region: 'north',
    date: 'Saturday, January 24, 2026',
    time: '6:00 PM to 9:00 PM',
    location: 'Servus Credit Union Place',
    locationDetail: 'Place Orion Plastics S Field House \u2014 Field House SP, St. Albert',
    cost: '$40.00',
    who: 'GELC, Wheatland, and Grande Prairie Graduating U17 and Tier II Players.',
    registrationDeadline: 'Monday, January 19, 2026',
    registrationUrl: SPORTZSOFT_REG_URL,
  },
  {
    name: 'South Junior Combine',
    region: 'south',
    date: 'Sunday, February 15, 2026',
    time: '11:30 AM to 2:30 PM',
    location: 'Scotiabank Saddledome',
    locationDetail: 'Calgary',
    cost: '$70',
    costNote: 'Includes a ticket to the Roughnecks/Georgia Swarm game at 6:00 PM.',
    who: 'CALL, CDLA, and SALA Graduating U17 and Tier II Players.',
    registrationDeadline: 'Monday, February 9, 2026',
    registrationUrl: SPORTZSOFT_REG_URL,
    waiverUrl: SOUTH_WAIVER_URL,
    waiverNote: 'Once you have registered, please complete the online waiver. The waiver must be completed to go on the floor at the Saddledome.',
    capacityNote: 'Registration for the South Combine is limited to 72 players and 12 goalies, so please register early.',
  },
];

function InfoRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex items-center gap-1.5 shrink-0 w-24 sm:w-28">
        {icon}
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex-1 min-w-0 text-sm text-gray-700 leading-relaxed">{children}</div>
    </div>
  );
}

function CombineCard({ combine }: { combine: CombineInfo }) {
  const [expanded, setExpanded] = useState(true);
  const regionColor = combine.region === 'north' ? '#013fac' : '#b91c1c';
  const regionBg = combine.region === 'north' ? 'bg-blue-50' : 'bg-red-50';
  const regionBorder = combine.region === 'north' ? 'border-blue-200' : 'border-red-200';

  return (
    <div className="border-2 border-gray-200 rounded-lg overflow-hidden shadow-sm">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 sm:px-5 py-3.5 flex items-center gap-3 bg-gray-100 border-b-2 border-gray-200 hover:bg-gray-50 transition-colors"
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
          style={{ backgroundColor: regionColor }}
        >
          {combine.region === 'north' ? 'N' : 'S'}
        </div>
        <div className="flex-1 text-left">
          <h3 className="font-bold text-gray-900 text-sm sm:text-base">{combine.name}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{combine.date}</p>
        </div>
        {expanded
          ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
          : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
        }
      </button>

      {expanded && (
        <div className="p-4 sm:p-5 space-y-4">
          <div className="space-y-3">
            <InfoRow icon={<Calendar className="w-3.5 h-3.5 text-gray-400" />} label="Date">
              <span className="font-medium text-gray-900">{combine.date}</span>
            </InfoRow>
            <InfoRow icon={<Clock className="w-3.5 h-3.5 text-gray-400" />} label="Time">
              {combine.time}
            </InfoRow>
            <InfoRow icon={<MapPin className="w-3.5 h-3.5 text-gray-400" />} label="Location">
              <div>
                <span className="font-medium text-gray-900">{combine.location}</span>
                {combine.locationDetail && (
                  <span className="text-gray-500"> &mdash; {combine.locationDetail}</span>
                )}
              </div>
            </InfoRow>
            <InfoRow icon={<DollarSign className="w-3.5 h-3.5 text-gray-400" />} label="Cost">
              <div>
                <span className="font-bold text-gray-900">{combine.cost}</span>
                {combine.costNote && (
                  <span className="text-gray-600 ml-1">&mdash; {combine.costNote}</span>
                )}
              </div>
            </InfoRow>
            <InfoRow icon={<UserCheck className="w-3.5 h-3.5 text-gray-400" />} label="Who">
              {combine.who}
            </InfoRow>
            <InfoRow icon={<AlertTriangle className="w-3.5 h-3.5 text-amber-500" />} label="Deadline">
              <span className="font-medium text-amber-700">{combine.registrationDeadline}</span>
            </InfoRow>
          </div>

          {/* Capacity warning */}
          {combine.capacityNote && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 font-medium">{combine.capacityNote}</p>
            </div>
          )}

          {/* Registration button */}
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={combine.registrationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 text-white font-bold px-5 py-2.5 rounded border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors text-sm"
              style={{ backgroundColor: regionColor }}
            >
              <ExternalLink className="w-4 h-4" />
              Register for {combine.region === 'north' ? 'North' : 'South'} Combine
            </a>
          </div>

          {/* Waiver section */}
          {combine.waiverUrl && (
            <div className={`${regionBg} border ${regionBorder} rounded-lg p-4`}>
              <div className="flex items-start gap-2">
                <FileText className="w-4 h-4 shrink-0 mt-0.5" style={{ color: regionColor }} />
                <div>
                  <p className="text-sm font-bold text-gray-900 mb-1">Waiver Required</p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {combine.waiverNote}
                  </p>
                  <a
                    href={combine.waiverUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-bold mt-2 hover:underline"
                    style={{ color: regionColor }}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Complete Online Waiver
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function CombinesPage() {
  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-[#013fac] via-[#0149c9] to-[#4b5baa] text-white rounded-lg p-5 sm:p-8 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="p-2.5 sm:p-3 bg-white/10 rounded-lg border border-white/20 shrink-0">
            <Users className="w-7 h-7 sm:w-9 sm:h-9 text-white" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Junior Combines</h2>
            <p className="text-sm sm:text-base text-blue-100 mt-2 leading-relaxed">
              Annually, in late January or early February, the RMLL hosts a North Combine in Edmonton and a South Combine in Calgary for Graduating U17 and Jr. B Tier II players who are interested in playing Junior A and Junior B Tier I. Attending a Combine allows a player the opportunity to showcase their skills to the Junior A and Junior B Tier I coaching staffs prior to the Junior A and Junior B Tier I Drafts.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Facts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border-2 border-gray-200 rounded-lg p-4 text-center">
          <MapPin className="w-6 h-6 text-[#013fac] mx-auto mb-1.5" />
          <p className="text-2xl font-bold text-gray-900">2</p>
          <p className="text-[10px] text-gray-500 font-medium uppercase">Combine Locations</p>
        </div>
        <div className="bg-white border-2 border-gray-200 rounded-lg p-4 text-center">
          <Calendar className="w-6 h-6 text-[#013fac] mx-auto mb-1.5" />
          <p className="text-lg font-bold text-gray-900">Jan &amp; Feb 2026</p>
          <p className="text-[10px] text-gray-500 font-medium uppercase">North &amp; South</p>
        </div>
        <div className="bg-white border-2 border-gray-200 rounded-lg p-4 text-center">
          <Users className="w-6 h-6 text-[#013fac] mx-auto mb-1.5" />
          <p className="text-lg font-bold text-gray-900">U17 &amp; Tier II</p>
          <p className="text-[10px] text-gray-500 font-medium uppercase">Graduating Players</p>
        </div>
      </div>

      {/* Who Should Attend */}
      <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-amber-800 text-sm sm:text-base">Who Should Attend?</h3>
            <p className="text-sm text-amber-700 mt-1 leading-relaxed">
              <strong>Graduating U17 and Jr. B Tier II players</strong> who are interested in playing
              Junior A or Junior B Tier I. Combines give players the chance to showcase their skills
              to coaching staffs prior to the Junior A and Junior B Tier I Drafts.
            </p>
          </div>
        </div>
      </div>

      {/* Combine Cards */}
      {COMBINES.map((combine) => (
        <CombineCard key={combine.name} combine={combine} />
      ))}
    </div>
  );
}
