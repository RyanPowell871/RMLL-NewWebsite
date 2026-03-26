import { useState } from 'react';
import {
  GraduationCap, ChevronDown, ChevronRight, ExternalLink,
  AlertTriangle, CheckCircle, Award, BookOpen, Clock,
  Mail, ShieldCheck, Star, FileText, Users
} from 'lucide-react';

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

/* ─── Certification Level Card ─── */
interface CertLevelProps {
  level: string;
  yearLabel: string;
  yearNote: string;
  requirements: string[];
  accentColor: string;
  icon: React.ReactNode;
}

function CertLevelCard({ level, yearLabel, yearNote, requirements, accentColor, icon }: CertLevelProps) {
  return (
    <div className="border rounded-lg overflow-hidden" style={{ borderColor: `${accentColor}40` }}>
      <div className="px-4 py-3 flex items-center gap-3" style={{ backgroundColor: `${accentColor}10` }}>
        <div className="p-1.5 rounded-md" style={{ backgroundColor: `${accentColor}20` }}>
          {icon}
        </div>
        <div>
          <h4 className="font-bold text-gray-900 text-sm" style={{ fontFamily: 'var(--font-secondary)' }}>{level}</h4>
          <p className="text-xs text-gray-500">{yearLabel}</p>
        </div>
      </div>
      <div className="px-4 py-3 space-y-2">
        <p className="text-xs italic" style={{ color: accentColor }}>{yearNote}</p>
        {requirements.map((req, i) => (
          <div key={i} className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: accentColor }} />
            <p className="text-sm text-gray-700">{req}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export function CoachingRequirementsPage() {
  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-3 bg-[#013fac]/10 rounded-xl">
            <GraduationCap className="w-7 h-7 text-[#013fac]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-secondary)' }}>
              Coaching Program Requirements
            </h1>
            <p className="text-sm text-gray-500">Updated December 18, 2024</p>
          </div>
        </div>
        <p className="text-gray-600 text-sm leading-relaxed">
          All RMLL coaches must follow the Lacrosse Canada certification pathway. This page outlines the two streams
          &mdash; Community Development and Competitive Introduction &mdash; along with required courses, PD points,
          and important links.
        </p>
      </div>

      <div className="space-y-5">

        {/* ── Community Development Stream ── */}
        <CollapsibleSection
          title="Community Development"
          icon={<Users className="w-5 h-5 text-[#013fac]" />}
          defaultOpen={true}
        >
          <div className="mt-4">
            <CertLevelCard
              level="Trained"
              yearLabel="First Year"
              yearNote="First year RMLL coach must be Community Development Trained"
              requirements={['Attended a clinic']}
              accentColor="#013fac"
              icon={<GraduationCap className="w-4 h-4 text-[#013fac]" />}
            />
          </div>
        </CollapsibleSection>

        {/* ── Competitive Introduction Stream ── */}
        <CollapsibleSection
          title="Competitive Introduction"
          icon={<Award className="w-5 h-5 text-[#DC2626]" />}
          defaultOpen={true}
        >
          <div className="mt-4 space-y-4">
            {/* In Training */}
            <CertLevelCard
              level="In Training"
              yearLabel="Second Year"
              yearNote="Second year RMLL coach must be Competitive Introduction In Training"
              requirements={['Attended a clinic']}
              accentColor="#2563eb"
              icon={<BookOpen className="w-4 h-4 text-blue-600" />}
            />

            {/* Trained */}
            <CertLevelCard
              level="Trained"
              yearLabel="Third Year"
              yearNote="Third year RMLL coach must be Competitive Introduction Trained"
              requirements={[
                'Completed Making Head Way (MHW) in Sport in the Locker by Dec. of the year attended the clinic',
                'Completed Making Ethical Decisions (MED) Online Clinic for Comp Intro by Dec. of the year attended the clinic',
              ]}
              accentColor="#7c3aed"
              icon={<Star className="w-4 h-4 text-purple-600" />}
            />

            {/* Certified */}
            <CertLevelCard
              level="Certified"
              yearLabel="Fourth Year"
              yearNote="Fourth year RMLL coach must Competitive Introduction Certified to go on the Bench at Presidents', Minto and Founders' or to go out-of-province."
              requirements={[
                'Completed the In Person Evaluation',
                'Completed Making Ethical Decisions (MED) Evaluation (test) in the Locker',
              ]}
              accentColor="#059669"
              icon={<ShieldCheck className="w-4 h-4 text-emerald-600" />}
            />
          </div>
        </CollapsibleSection>

        {/* ── Professional Development Points ── */}
        <CollapsibleSection
          title="Professional Development (PD) Points"
          icon={<Clock className="w-5 h-5 text-[#013fac]" />}
          defaultOpen={true}
        >
          <div className="mt-4 space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-gray-800 leading-relaxed">
                Once a coach is <strong>Comp Intro Certified</strong>, the coach must acquire <strong>20 PD Points every 5 years</strong> to
                maintain their certification status. A <strong>Competitive Development Certified</strong> coach must acquire <strong>30 PD points
                every 5 years</strong> to maintain their certification status.
              </p>
            </div>

            <h4 className="font-bold text-gray-900 text-sm" style={{ fontFamily: 'var(--font-secondary)' }}>
              Acquiring PD Points
            </h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 text-emerald-600 flex-shrink-0" />
                <span>One PD Point for coaching a team &ndash; Self Report at end of Season</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 text-emerald-600 flex-shrink-0" />
                <span>Attend RMLL Super Coaching Clinic &ndash; <strong>11 PD Points</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 text-emerald-600 flex-shrink-0" />
                <span>ALA Technical Team Programs and Online Modules</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 text-emerald-600 flex-shrink-0" />
                <span>PD Points can be acquired by completing online coaching courses in the Locker (Many are Free)</span>
              </li>
            </ul>

            {/* Locker Instructions */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm font-bold text-gray-800 mb-2">To access courses in the Locker:</p>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                <li>Login to your account at{' '}
                  <a
                    href="https://thelocker.coach.ca/account/login?ReturnUrl=%2f"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#013fac] hover:underline font-medium"
                  >
                    The Locker
                    <ExternalLink className="w-3 h-3 inline ml-1" />
                  </a>
                </li>
                <li>Click <strong>ELEARNING</strong> along the top navigation bar.</li>
                <li>Select <strong>Multi-sport</strong> along the left navigation bar.</li>
                <li>Select your course.</li>
              </ol>
            </div>
          </div>
        </CollapsibleSection>

        {/* ── Required Courses ── */}
        <CollapsibleSection
          title="Required Course Details"
          icon={<BookOpen className="w-5 h-5 text-[#7c3aed]" />}
          defaultOpen={false}
        >
          <div className="mt-4 space-y-5">
            {/* MHW */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-bold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-secondary)' }}>
                1. Making Head Way (MHW) &mdash; in the Locker
              </h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                <li>Login to your account at{' '}
                  <a
                    href="https://thelocker.coach.ca/account/login?ReturnUrl=%2f"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#013fac] hover:underline font-medium"
                  >
                    The Locker <ExternalLink className="w-3 h-3 inline ml-1" />
                  </a>
                </li>
                <li>Click <strong>ELEARNING</strong> along the top navigation bar.</li>
                <li>Select <strong>Multi-sport</strong> along the left navigation bar.</li>
                <li>Select your course.</li>
              </ol>
            </div>

            {/* MED */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-bold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-secondary)' }}>
                2. Make Ethical Decisions (MED) Online Clinic
              </h4>
              <p className="text-sm text-gray-700 mb-2">
                This is a <strong>4-hour workshop</strong>. Cost is <strong>$85.00</strong>.
              </p>
              <a
                href="https://albertasport.ca/coaching/nccp-multi-sport-module-calendar/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-[#013fac] hover:underline font-medium"
              >
                View MED Calendar on Alberta Sport
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* In-Person Evaluation */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-bold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-secondary)' }}>
                3. In-Person Evaluation Request
              </h4>
              <p className="text-sm text-gray-700 mb-2">
                Send the request for an in-person evaluation to:
              </p>
              <a
                href="mailto:technicaldirector@albertalacrosse.com"
                className="inline-flex items-center gap-1.5 text-sm text-[#013fac] hover:underline font-medium"
              >
                <Mail className="w-4 h-4" />
                technicaldirector@albertalacrosse.com
              </a>
            </div>
          </div>
        </CollapsibleSection>

        {/* ── Loss of Certification ── */}
        <CollapsibleSection
          title="Loss of Certification"
          icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
          defaultOpen={false}
        >
          <div className="mt-4">
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
              <p className="text-sm text-amber-900 leading-relaxed">
                If a coach does not acquire their required PD points in the 5-year span, they lose their certification
                status and must acquire the missing PD points to become certified again. A coach with missing PD points
                will <strong>not be allowed to go on the Bench</strong> for Presidents', Minto or Founders'.
              </p>
            </div>
          </div>
        </CollapsibleSection>

        {/* ── Female Only Teams ── */}
        <CollapsibleSection
          title="Female Only Teams"
          icon={<Users className="w-5 h-5 text-purple-600" />}
          defaultOpen={false}
          accent="#7c3aed"
        >
          <div className="mt-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-sm text-gray-800 leading-relaxed">
                <strong className="text-purple-700">RMLL Regulation 21.2</strong> &mdash; Each Junior and Senior Major Female Franchise must
                have one female coach registered as Bench Personnel on their Franchise Certificate.
              </p>
            </div>
          </div>
        </CollapsibleSection>

        {/* ── Important Links ── */}
        <CollapsibleSection
          title="Important Links"
          icon={<ExternalLink className="w-5 h-5 text-[#013fac]" />}
          defaultOpen={true}
        >
          <div className="mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  label: 'The Locker (Coach Login)',
                  url: 'https://thelocker.coach.ca/account/login?ReturnUrl=%2f',
                  desc: 'Access MHW, MED, and PD courses',
                },
                {
                  label: 'LC Coaching Site',
                  url: 'https://nccp.lacrosse.ca/',
                  desc: 'Lacrosse Canada coaching resources',
                },
                {
                  label: 'AB Coaching Clinics',
                  url: 'https://www.albertalacrosse.com/content/coaching-clinics',
                  desc: 'Alberta Lacrosse clinic schedule',
                },
                {
                  label: 'RMLL Super Coaching Clinic',
                  url: '__internal__super-coaching-clinic',
                  desc: 'Clinic attendance = 11 PD Points',
                },
              ].map((link) => (
                link.url.startsWith('__internal__') ? (
                  <button
                    key={link.url}
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('rmll-league-info-navigate', { detail: { pageId: link.url.replace('__internal__', '') } }));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:border-[#013fac] hover:bg-blue-50/50 transition-colors group text-left"
                  >
                    <div className="p-2 bg-[#013fac]/10 rounded-lg group-hover:bg-[#013fac]/20 transition-colors">
                      <ChevronRight className="w-4 h-4 text-[#013fac]" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-gray-900 group-hover:text-[#013fac] transition-colors">
                        {link.label}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{link.desc}</p>
                    </div>
                  </button>
                ) : (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:border-[#013fac] hover:bg-blue-50/50 transition-colors group"
                >
                  <div className="p-2 bg-[#013fac]/10 rounded-lg group-hover:bg-[#013fac]/20 transition-colors">
                    <ExternalLink className="w-4 h-4 text-[#013fac]" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-gray-900 group-hover:text-[#013fac] transition-colors">
                      {link.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{link.desc}</p>
                  </div>
                </a>
                )
              ))}
            </div>

            {/* ALA Contact Note */}
            <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-600 italic">
                Contact the ALA office if you cannot log into your profile.
              </p>
            </div>
          </div>
        </CollapsibleSection>

        {/* ── Certification Pathway Summary Table ── */}
        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
          <div className="px-5 py-4 bg-gradient-to-r from-[#0F2942] to-[#1a3a5c]">
            <h3 className="font-bold text-white flex items-center gap-2" style={{ fontFamily: 'var(--font-secondary)' }}>
              <FileText className="w-5 h-5" />
              Certification Pathway Summary
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-bold text-gray-700 whitespace-nowrap">Year</th>
                  <th className="text-left px-4 py-3 font-bold text-gray-700 whitespace-nowrap">Stream</th>
                  <th className="text-left px-4 py-3 font-bold text-gray-700 whitespace-nowrap">Level</th>
                  <th className="text-left px-4 py-3 font-bold text-gray-700">Requirements</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr className="bg-blue-50/40">
                  <td className="px-4 py-3 font-medium text-gray-900">1st</td>
                  <td className="px-4 py-3 text-gray-700">Community Dev</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800">
                      Trained
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">Attend a clinic</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-gray-900">2nd</td>
                  <td className="px-4 py-3 text-gray-700">Comp Intro</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-sky-100 text-sky-800">
                      In Training
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">Attend a clinic</td>
                </tr>
                <tr className="bg-purple-50/40">
                  <td className="px-4 py-3 font-medium text-gray-900">3rd</td>
                  <td className="px-4 py-3 text-gray-700">Comp Intro</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-purple-100 text-purple-800">
                      Trained
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">MHW + MED Online Clinic</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-gray-900">4th</td>
                  <td className="px-4 py-3 text-gray-700">Comp Intro</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800">
                      Certified
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">In-Person Eval + MED Eval (test)</td>
                </tr>
                <tr className="bg-amber-50/40">
                  <td className="px-4 py-3 font-medium text-gray-900">5th+</td>
                  <td className="px-4 py-3 text-gray-700">Maintenance</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800">
                      PD Points
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">20 PD pts / 5 yrs (30 for Comp Dev Certified)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}