'use client';

import { useState } from 'react';
import {
  GraduationCap, Calendar, MapPin, Users, BookOpen, Award,
  DollarSign, Hotel, ChevronDown, ChevronRight, ExternalLink, AlertTriangle,
  ClipboardCheck, Info, CheckCircle, HelpCircle, XCircle, Mail
} from 'lucide-react';

interface Instructor {
  name: string;
  credentials: string;
  profileLink?: string;
}

interface ScheduleItem {
  day: string;
  time: string;
  label: string;
}

interface Topic {
  topic: string;
}

// Default data
const INSTRUCTORS: Instructor[] = [
  {
    name: 'Walt Christianson',
    credentials: 'Former Assistant Coach Calgary Roughnecks, Colorado Mammoth; former Head Coach Victoria Shamrocks Sr A, and Victoria Shamrocks Jr A.',
  },
  {
    name: 'Duane Bratt',
    credentials: 'LC Master Learning Facilitator, former Assistant Coach Calgary Jr. A Mountaineers, and former Head Coach Calgary Sr. B Mountaineers.',
  },
  {
    name: 'John Kilbride',
    credentials: 'Former Calgary Roughnecks player, former Sr. A player (Salmonbellies, Burrards), drafted 2nd Overall WLA draft, and current Head Coach of the Calgary Sr. B Mountaineers.',
    profileLink: 'https://nkfbehspyjookipapdbp.supabase.co/storage/v1/object/public/make-9a1ba23f-documents/1774499555011-hikvaw9jhjq.pdf',
  },
  {
    name: 'Jason Crook',
    credentials: 'Head Coach of the Calgary Jr B Shamrocks; former player Jr A Mountaineers/Sr B Mountaineers; Technical Director of the ALA.',
    profileLink: 'https://nkfbehspyjookipapdbp.supabase.co/storage/v1/object/public/make-9a1ba23f-documents/1774499554217-vp5fes1veld.pdf',
  },
  {
    name: 'Kane Swartout',
    credentials: 'Former starting goalie Jr A Mountaineers; current Lead Goalie Instructor Sr B Mounties YouthLax Camps; current starting goalie Calgary Sr B Mountaineers.',
  },
  {
    name: 'Greg Hart',
    credentials: "Longtime RMLL Official, who has officiated in the Minto Cup and President's Cup as well as the NLL; Trains Officials around the world.",
  },
  {
    name: 'Jared Ferris',
    credentials: 'Instructor for the Super Coaching Clinic.',
    profileLink: 'https://nkfbehspyjookipapdbp.supabase.co/storage/v1/object/public/make-9a1ba23f-documents/1774499553291-fxtphg4r9no.pdf',
  },
];

const TOPICS: Topic[] = [
  { topic: 'Fast Break Systems' },
  { topic: 'Stick Skills' },
  { topic: 'Team Offence' },
  { topic: 'Team Defence' },
  { topic: 'Specialty Teams' },
  { topic: 'Goaltending' },
  { topic: 'Practice Planning' },
  { topic: 'Seasonal Planning' },
  { topic: 'Refereeing in Junior Lacrosse' },
  { topic: 'Physical and Mental Preparation' },
  { topic: 'Scouting and Statistics' },
];

const SCHEDULE: ScheduleItem[] = [
  { day: 'Friday, April 11th, 2025', time: '7:00 PM to 10:00 PM', label: 'Evening Session' },
  { day: 'Saturday, April 12th, 2025', time: '8:00 AM to 8:30 PM', label: 'Full Day' },
  { day: 'Sunday, April 13th, 2025', time: '8:00 AM to 4:00 PM', label: 'Full Day' },
];

const INCLUDED_ITEMS = [
  "Passcode to the LC's coaching database",
  'Breakfast on Saturday & Sunday',
  'Lunch on Saturday & Sunday',
  'Dinner on Saturday',
];

const REQUIRED_INFO = [
  'Participant Name',
  'Participant Email',
  'Participant Club/Team',
  'Participant Cell Number',
];

const CERT_REQUIRED_INFO = [
  "Coach's name and contact information",
  "Coach's team or club name",
  "Coach's NCCP Certification Number or 'CC Number'",
  "Coach's current level attained (i.e. what certification the coach has completed to date); this should be 'Community Development' as a minimum",
  "Coach's status of currently level attained (i.e. just taken course, taken course and workbook submitted)",
  "Lacrosse.ca account \u2014 if you have taken a course in the last 4 years, you would have been issued a 'code' which you would have used to create an account at nccp.lacrosse.ca. If you already have an account, you don't need a new one. If you don't have an account, we will issue you a code so you can set one up.",
];

const SPORTZSOFT_REG_URL = 'https://www.sportzsoft.com/regApp/Login?OrgId=4023';
const LOCKER_REG_URL = 'https://thelocker.coach.ca/event/public/5740859';
const COMP_INTRO_LOCKER_URL = 'https://thelocker.coach.ca/event/public/5876592';

const CERTIFICATION_TEXT = 'All Community Development coaches attending will receive their Competitive-Introduction "In-training" status. Coaches who already have taken Competitive-Introduction are encouraged to attend - they will receive more advanced on-floor material.';
const PD_POINTS_TEXT = 'Competitive Introduction Certified Coaches may receive eleven (11) PD points based on unique modules included in the Super Coaching Clinic.';

function InfoRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 sm:gap-4">
      <div className="flex items-center gap-2 shrink-0 w-28 sm:w-36">
        {icon}
        <span className="text-xs sm:text-sm font-bold text-[#013fac] uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex-1 min-w-0 text-sm text-gray-700 leading-relaxed">{children}</div>
    </div>
  );
}

export function SuperCoachingClinicPage() {
  const [showRegistration, setShowRegistration] = useState(false);
  const [regPath, setRegPath] = useState<'none' | 'certification' | 'interest'>('none');
  const [certSubPath, setCertSubPath] = useState<'choose' | 'have-cc' | 'no-cc' | 'no-commdev'>('choose');

  // Extract date range from SCHEDULE for display
  const dateRange = SCHEDULE.length > 0
    ? (() => {
        const firstDay = SCHEDULE[0].day;
        const lastDay = SCHEDULE[SCHEDULE.length - 1].day;
        // Extract year and month from last day
        const lastParts = lastDay.match(/(\d{4})/);
        const year = lastParts ? lastParts[1] : '';
        const firstDateOnly = firstDay.replace(/, \d{4}/, '');
        const lastDateOnly = lastDay.replace(/, \d{4}/, '');
        if (firstDateOnly === lastDateOnly) {
          return `${firstDateOnly}, ${year}`;
        }
        return `${firstDateOnly} - ${lastDateOnly}, ${year}`;
      })()
    : 'April 11-13, 2025';

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-[#013fac] via-[#0149c9] to-[#4b5baa] text-white rounded-lg p-5 sm:p-8 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="p-2.5 sm:p-3 bg-white/10 rounded-lg border border-white/20 shrink-0">
            <GraduationCap className="w-7 h-7 sm:w-9 sm:h-9 text-white" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Super Coaching Clinic</h2>
            <p className="text-sm sm:text-base text-blue-100 mt-2 leading-relaxed">
              {"The RMLL's premier coaching development weekend. Three days of elite instruction covering all aspects of competitive lacrosse coaching, from systems and strategy to player development."}
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="inline-flex items-center gap-1.5 bg-white/15 border border-white/25 rounded px-3 py-1 text-xs font-bold">
                <Calendar className="w-3.5 h-3.5" /> {dateRange}
              </span>
              <span className="inline-flex items-center gap-1.5 bg-white/15 border border-white/25 rounded px-3 py-1 text-xs font-bold">
                <MapPin className="w-3.5 h-3.5" /> Okotoks, AB
              </span>
              <span className="inline-flex items-center gap-1.5 bg-amber-400/20 border border-amber-400/30 rounded px-3 py-1 text-xs font-bold text-amber-100">
                <Award className="w-3.5 h-3.5" /> Competitive Introduction Certification
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Facts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border-2 border-gray-200 rounded-lg p-4 text-center">
          <DollarSign className="w-6 h-6 text-[#013fac] mx-auto mb-1.5" />
          <p className="text-2xl font-bold text-gray-900">$180</p>
          <p className="text-[10px] text-gray-500 font-medium uppercase">All Inclusive</p>
        </div>
        <div className="bg-white border-2 border-gray-200 rounded-lg p-4 text-center">
          <Calendar className="w-6 h-6 text-[#013fac] mx-auto mb-1.5" />
          <p className="text-2xl font-bold text-gray-900">3 Days</p>
          <p className="text-[10px] text-gray-500 font-medium uppercase">Fri - Sun</p>
        </div>
        <div className="bg-white border-2 border-gray-200 rounded-lg p-4 text-center">
          <Award className="w-6 h-6 text-[#013fac] mx-auto mb-1.5" />
          <p className="text-2xl font-bold text-gray-900">11 PD</p>
          <p className="text-[10px] text-gray-500 font-medium uppercase">Points Available</p>
        </div>
        <div className="bg-white border-2 border-gray-200 rounded-lg p-4 text-center">
          <Users className="w-6 h-6 text-[#013fac] mx-auto mb-1.5" />
          <p className="text-2xl font-bold text-gray-900">6</p>
          <p className="text-[10px] text-gray-500 font-medium uppercase">Expert Instructors</p>
        </div>
      </div>

      {/* Schedule */}
      <div className="border-2 border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <div className="bg-gray-100 border-b-2 border-gray-200 px-4 sm:px-5 py-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#013fac]" />
          <h3 className="font-bold text-gray-900 text-sm sm:text-base">Schedule</h3>
        </div>
        <div className="p-4 sm:p-5">
          <div className="space-y-3">
            {SCHEDULE.map((s, i) => (
              <div key={i} className="flex items-start gap-3 sm:gap-4">
                <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${i === 0 ? 'bg-blue-400' : 'bg-[#013fac]'}`} />
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
                    <p className="font-bold text-gray-900 text-sm">{s.day}</p>
                    <span className="text-xs text-gray-400 hidden sm:inline">&bull;</span>
                    <p className="text-sm text-gray-600">{s.time}</p>
                  </div>
                  <span className="text-xs text-gray-400 font-medium">{s.label}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <MapPin className="w-4 h-4 text-[#013fac] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-gray-900">Okotoks Recreation Center</p>
              <p className="text-xs text-gray-600">99 Okotoks Drive, Okotoks, Alberta</p>
            </div>
          </div>
        </div>
      </div>

      {/* Target Audience */}
      <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <Users className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-amber-800 text-sm sm:text-base">Who Should Attend?</h3>
            <p className="text-sm text-amber-700 mt-1 leading-relaxed">
              All <strong>Senior B, Senior C, Junior A, Junior B (Tier I &amp; II), Alberta Major Female,
              and U17 Coaches</strong> &mdash; plus all coaches from any RMLL Division who are already
              Comp Intro Certified and need PD Points.
            </p>
          </div>
        </div>
      </div>

      {/* Topics */}
      <div className="border-2 border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <div className="bg-gray-100 border-b-2 border-gray-200 px-4 sm:px-5 py-3 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#013fac]" />
          <h3 className="font-bold text-gray-900 text-sm sm:text-base">Topics Covered</h3>
        </div>
        <div className="p-4 sm:p-5">
          <div className="flex flex-wrap gap-2">
            {TOPICS.map((item) => (
              <span
                key={item.topic}
                className="inline-flex items-center px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-800 rounded text-xs sm:text-sm font-medium"
              >
                {item.topic}
              </span>
            ))}
          </div>
          <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-xs text-gray-600 leading-relaxed">
              <strong className="text-gray-800">Structure:</strong> Floor and Classroom sessions, video analysis and group tasks.
              There will also be some joint sessions with Referees held in conjunction with their Uber Clinic.
            </p>
          </div>
        </div>
      </div>

      {/* Instructors */}
      <div className="border-2 border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <div className="bg-gray-100 border-b-2 border-gray-200 px-4 sm:px-5 py-3 flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-[#013fac]" />
          <h3 className="font-bold text-gray-900 text-sm sm:text-base">Instructors</h3>
        </div>
        <div className="p-4 sm:p-5 space-y-4">
          {INSTRUCTORS.map((instructor) => (
            <div key={instructor.name} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#013fac] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                {instructor.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1 min-w-0">
                {instructor.profileLink ? (
                  <a
                    href={instructor.profileLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-[#013fac] text-sm hover:underline flex items-center gap-1"
                  >
                    {instructor.name}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <p className="font-bold text-gray-900 text-sm">{instructor.name}</p>
                )}
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mt-0.5">{instructor.credentials}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Certification */}
      <div className="border-2 border-[#013fac] rounded-lg overflow-hidden shadow-sm">
        <div className="bg-[#013fac] px-4 sm:px-5 py-3 flex items-center gap-2">
          <Award className="w-4 h-4 text-white" />
          <h3 className="font-bold text-white text-sm sm:text-base">Certification &amp; PD Points</h3>
        </div>
        <div className="p-4 sm:p-5 bg-blue-50 space-y-3">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
            {CERTIFICATION_TEXT}
          </p>
          <div className="bg-white border border-blue-200 rounded-lg p-3 flex items-center gap-3">
            <Award className="w-5 h-5 text-[#013fac] shrink-0" />
            <p className="text-sm text-gray-800 whitespace-pre-line">
              {PD_POINTS_TEXT}
            </p>
          </div>
        </div>
      </div>

      {/* Cost & Inclusions */}
      <div className="border-2 border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <div className="bg-gray-100 border-b-2 border-gray-200 px-4 sm:px-5 py-3 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-[#013fac]" />
          <h3 className="font-bold text-gray-900 text-sm sm:text-base">{"Cost & What's Included"}</h3>
        </div>
        <div className="p-4 sm:p-5">
          <div className="flex items-center gap-4 mb-4">
            <div>
              <p className="text-3xl font-bold text-[#013fac]">$180</p>
              <p className="text-xs text-gray-500">per participant</p>
            </div>
            <div className="h-12 w-px bg-gray-200" />
            <p className="text-sm text-gray-600">
              Whether seeking Competitive Introduction in-training status <em>or</em> attending for further information.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {INCLUDED_ITEMS.map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hotel */}
      <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <Hotel className="w-5 h-5 text-gray-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-gray-900 text-sm sm:text-base">Accommodations</h3>
            <p className="text-sm text-gray-700 mt-1">
              <strong>Best Western Plus Okotoks Inn and Suites</strong> &mdash; 100 Southbank Road, Okotoks
            </p>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              RMLL Coaches located 100 km or more from Okotoks may send a request to{' '}
              <a href="mailto:christinethielen@hotmail.com" className="text-[#013fac] hover:underline font-medium">
                christinethielen@hotmail.com
              </a>{' '}
              for the RMLL to secure accommodations and cover the expense. Funding requests are reviewed on a case-by-case basis.
            </p>
          </div>
        </div>
      </div>

      {/* Registration Section */}
      <div className="border-2 border-black rounded-lg overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <button
          onClick={() => setShowRegistration(!showRegistration)}
          className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-5 sm:px-6 py-4 flex items-center gap-3 transition-colors"
        >
          <ClipboardCheck className="w-6 h-6 shrink-0" />
          <div className="flex-1 text-left">
            <h3 className="text-lg sm:text-xl font-bold">Registration &amp; Payment</h3>
            <p className="text-xs text-red-100 mt-0.5">Click to expand registration options</p>
          </div>
          {showRegistration
            ? <ChevronDown className="w-5 h-5 shrink-0" />
            : <ChevronRight className="w-5 h-5 shrink-0" />
          }
        </button>

        {showRegistration && (
          <div className="bg-white">
            {regPath === 'none' && (
              <div className="p-5 sm:p-8 space-y-6">
                <div className="text-center">
                  <h4 className="text-lg sm:text-xl font-bold text-gray-900">
                    Are you pursuing Certification for this course?
                  </h4>
                  <p className="text-sm text-gray-500 mt-1">Select the option that applies to you.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => setRegPath('certification')}
                    className="group border-2 border-[#013fac] rounded-lg p-5 hover:bg-blue-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="w-6 h-6 text-[#013fac]" />
                      <h5 className="font-bold text-[#013fac] text-sm sm:text-base">{"Yes \u2014 I Need Certification"}</h5>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {"I am seeking my Competitive-Introduction \"In-training\" certification status."}
                    </p>
                    <div className="mt-3 text-xs font-bold text-[#013fac] group-hover:underline flex items-center gap-1">
                      Get Certified <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </button>

                  <button
                    onClick={() => setRegPath('interest')}
                    className="group border-2 border-gray-300 rounded-lg p-5 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <BookOpen className="w-6 h-6 text-gray-600" />
                      <h5 className="font-bold text-gray-800 text-sm sm:text-base">{`No \u2014 Personal Interest`}</h5>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      I am attending this course out of personal interest and am not seeking certification.
                    </p>
                    <div className="mt-3 text-xs font-bold text-gray-600 group-hover:underline flex items-center gap-1">
                      Continue <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </button>
                </div>
              </div>
            )}

            {regPath === 'certification' && (
              <div className="p-5 sm:p-8 space-y-5">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-bold text-gray-900">Coaches Seeking Certification</h4>
                  <button
                    onClick={() => { setRegPath('none'); setCertSubPath('choose'); }}
                    className="text-xs text-gray-400 hover:text-gray-600 font-bold flex items-center gap-1"
                  >
                    <ChevronRight className="w-3 h-3 rotate-180" /> Back
                  </button>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800 font-bold">Please read the following carefully...</p>
                  </div>
                </div>

                <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p>
                      <strong className="text-gray-900">CERTIFICATION</strong> &mdash; {"The certification you are seeking is called \"Competitive Introduction\". This level is required for coaches who are coaching teams at the Senior, Junior, U17, and U15 levels."}
                    </p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p>
                      <strong className="text-gray-900">PRE-REQUISITE COURSE REQUIRED</strong> &mdash; {"The pre-requisite course for Competitive Introduction is called \"Community Development\". You must have attended this course and achieved Trained status at Community Development level in order to advance to further pre-requisites for the Competitive Introduction course."}
                    </p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p>
                      <strong className="text-gray-900">COACHING CERTIFICATION (CC) NUMBER (NCCP NUMBER)</strong> &mdash; If you have completed the pre-requisite course (or other National Coach Certification Program courses &mdash; NCCP) then you will have been issued a CC Number or a NCCP Number. You will need this number.
                    </p>
                  </div>
                </div>

                <div>
                  <h5 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
                    <Info className="w-4 h-4 text-[#013fac]" />
                    Select the link that applies to you:
                  </h5>
                  <div className="space-y-2">
                    <button
                      onClick={() => setCertSubPath('have-cc')}
                      className={`w-full flex items-start gap-3 border-2 rounded-lg p-3.5 transition-colors text-left group ${certSubPath === 'have-cc' ? 'border-[#013fac] bg-blue-50' : 'border-gray-200 hover:border-[#013fac] hover:bg-blue-50'}`}
                    >
                      <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 leading-relaxed">
                          I <strong>HAVE</strong> completed the pre-requisite COMMUNITY DEVELOPMENT course and been
                          issued a CC Number or a NCCP Number <strong>(which I have)</strong>
                        </p>
                        <span className="text-xs font-bold text-[#013fac] group-hover:underline mt-1 inline-flex items-center gap-1">
                          Register Here <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </button>

                    <button
                      onClick={() => setCertSubPath('no-cc')}
                      className={`w-full flex items-start gap-3 border-2 rounded-lg p-3.5 transition-colors text-left group ${certSubPath === 'no-cc' ? 'border-[#013fac] bg-blue-50' : 'border-gray-200 hover:border-[#013fac] hover:bg-blue-50'}`}
                    >
                      <HelpCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 leading-relaxed">
                          I <strong>HAVE</strong> completed the pre-requisite COMMUNITY DEVELOPMENT course{' '}
                          <strong>{"but can't remember or don't know my CC Number or NCCP Number"}</strong>
                        </p>
                        <span className="text-xs font-bold text-[#013fac] group-hover:underline mt-1 inline-flex items-center gap-1">
                          Get Help <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </button>

                    <button
                      onClick={() => setCertSubPath('no-commdev')}
                      className={`w-full flex items-start gap-3 border-2 rounded-lg p-3.5 transition-colors text-left group ${certSubPath === 'no-commdev' ? 'border-[#013fac] bg-blue-50' : 'border-gray-200 hover:border-[#013fac] hover:bg-blue-50'}`}
                    >
                      <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 leading-relaxed">
                          I have <strong>NOT</strong> completed the pre-requisite COMMUNITY DEVELOPMENT course or am
                          unsure if I have taken it or not
                        </p>
                        <span className="text-xs font-bold text-[#013fac] group-hover:underline mt-1 inline-flex items-center gap-1">
                          See Options <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Sub-path: Have CC Number - show required info + register */}
                {certSubPath === 'have-cc' && (
                  <div className="border-t-2 border-gray-100 pt-5 space-y-4">
                    <h5 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      <Info className="w-4 h-4 text-[#013fac]" />
                      When you register, you will be asked to provide:
                    </h5>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <ul className="space-y-2">
                        {CERT_REQUIRED_INFO.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#013fac] shrink-0 mt-2" />
                            <span className="leading-relaxed">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <p className="text-sm text-gray-700">
                      If you have the information listed above, you are now ready to register in the RMLL for the clinic.
                    </p>

                    <a
                      href={SPORTZSOFT_REG_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-[#013fac] hover:bg-[#0149c9] text-white font-bold px-6 py-3 rounded border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors text-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Register for the RMLL Clinic
                    </a>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-800 leading-relaxed">
                          <strong>Note:</strong> Coaches attending for Competitive Introduction Clinic must also register at this link:{' '}
                          <a
                            href={COMP_INTRO_LOCKER_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#013fac] hover:underline font-medium break-all"
                          >
                            {COMP_INTRO_LOCKER_URL}
                          </a>.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-path: Don't Know CC Number - contact Jason Crook */}
                {certSubPath === 'no-cc' && (
                  <div className="border-t-2 border-gray-100 pt-5 space-y-4">
                    <h5 className="font-bold text-gray-900 text-base">
                      {"Don't Know Your CC Number?"}
                    </h5>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="text-sm text-amber-800 font-bold mb-3">
                        {"If you don't know your CC Number or NCCP Number, contact:"}
                      </p>
                      <div className="flex items-start gap-3 bg-white border border-amber-200 rounded-lg p-3">
                        <div className="w-8 h-8 rounded-full bg-[#013fac] text-white flex items-center justify-center text-xs font-bold shrink-0">
                          JC
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">Jason Crook</p>
                          <a
                            href="mailto:technicaldirector@albertalacrosse.com"
                            className="text-sm text-[#013fac] hover:underline font-medium flex items-center gap-1.5 mt-1"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            technicaldirector@albertalacrosse.com
                          </a>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Once you have your CC number or NCCP number, you can return to this site and sign up for the course.
                    </p>
                  </div>
                )}

                {/* Sub-path: Not Taken Community Development - options */}
                {certSubPath === 'no-commdev' && (
                  <div className="border-t-2 border-gray-100 pt-5 space-y-4">
                    <h5 className="font-bold text-gray-900 text-base">
                      Not Taken Community Development
                    </h5>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        <p className="text-sm text-red-800 font-bold leading-relaxed">
                          If you have not taken the Community Development course you cannot register for Competitive Introduction.
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
                      <p className="font-bold text-gray-800">So what do I do?</p>
                      <p>
                        If you have not previously taken the Community Development course, please contact your local organization to register for a Community Development clinic.
                      </p>
                      <p>
                        CDLA area coaches can visit:
                      </p>
                      <a
                        href="https://www.calgarylacrosse.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-[#013fac] hover:underline font-medium"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        www.calgarylacrosse.com
                      </a>
                      <p className="text-gray-500">for information to start the process.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {regPath === 'interest' && (
              <div className="p-5 sm:p-8 space-y-5">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-bold text-gray-900">Participants Not Seeking Certification</h4>
                  <button
                    onClick={() => setRegPath('none')}
                    className="text-xs text-gray-400 hover:text-gray-600 font-bold flex items-center gap-1"
                  >
                    <ChevronRight className="w-3 h-3 rotate-180" /> Back
                  </button>
                </div>

                <p className="text-sm text-gray-700 leading-relaxed">
                  If you are interested in attending this course but <strong>not seeking certification</strong>,
                  you can sign up using the link below.
                </p>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-sm font-bold text-gray-800 mb-2">You will need to provide:</p>
                  <ul className="space-y-1.5">
                    {REQUIRED_INFO.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-gray-700">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#013fac] shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <a
                  href={SPORTZSOFT_REG_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#013fac] hover:bg-[#0149c9] text-white font-bold px-6 py-3 rounded border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors text-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  {"Register \u2014 Not Seeking Certification"}
                </a>

                <p className="text-xs text-gray-400 italic">
                  This registration is for individuals who are NOT seeking Certification from this course.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="bg-gray-50 border border-gray-200 rounded p-3 text-xs text-gray-500 leading-relaxed">
        <AlertTriangle className="w-3.5 h-3.5 inline -mt-0.5 mr-1 text-gray-400" />
        For questions about the Super Coaching Clinic, contact the RMLL Development Commissioner. Dates and details are subject to change.
      </div>
    </div>
  );
}