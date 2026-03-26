import { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Shield, Lock, Eye, UserCheck, FileCheck, Mail, Database, Globe, AlertTriangle, Users, Loader2 } from 'lucide-react';
import { useDocumentMeta, PAGE_META } from '../hooks/useDocumentMeta';
import { fetchLeagueContacts, type LeagueContacts } from '../services/cms-api';

const PRINCIPLES = [
  {
    icon: <Eye className="w-5 h-5" />,
    title: 'Purpose of Collection',
    description:
      'Personal information will be collected to determine eligibility for competitive and recreational opportunities, age related events, to facilitate enrollment, to disseminate information, to communicate, to administer and evaluate programs and promotions that benefit Members, and for insurance and statistical purposes.',
  },
  {
    icon: <FileCheck className="w-5 h-5" />,
    title: 'Funding Requirements',
    description:
      'In addition, personal information may be, from time to time, submitted to major funding bodies in order to verify registration and meeting funding requirements.',
  },
  {
    icon: <UserCheck className="w-5 h-5" />,
    title: 'Consent',
    description:
      'All information must be collected with the consent of the person or legal guardian. By registering as a member of the RMLL or any affiliated organization, individuals consent to the collection, use, and disclosure of their personal information as outlined in this policy.',
  },
  {
    icon: <Lock className="w-5 h-5" />,
    title: 'Minimization',
    description:
      'Personal information collection must be limited to what is absolutely necessary for the stated purposes. The RMLL does not collect more information than is required to fulfill its obligations.',
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: 'Accuracy',
    description:
      'All efforts must be made to avoid incorrect information, and efforts must be made to verify accuracy, completeness and timeliness of information. Members are encouraged to update their information as needed.',
  },
  {
    icon: <Database className="w-5 h-5" />,
    title: 'Retention',
    description:
      'Personal information will only be retained for as long as necessary to fulfill the purposes for which it was collected, or as required by law. Statistical and historical records may be retained indefinitely in de-identified form.',
  },
  {
    icon: <Lock className="w-5 h-5" />,
    title: 'Protection',
    description:
      'Reasonable steps will be taken to protect the privacy of all personal information. This includes physical, organizational, and technological measures to prevent unauthorized access, disclosure, or misuse.',
  },
  {
    icon: <Globe className="w-5 h-5" />,
    title: 'Third Party Disclosure',
    description:
      'Personal information will not be disclosed to third parties without consent, except where required for league operations (e.g., game officials, facility operators, insurance providers), or as required by law.',
  },
];

export function PrivacyPolicyStandalonePage() {
  useDocumentMeta(PAGE_META.privacyPolicy);

  const [contacts, setContacts] = useState<LeagueContacts | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeagueContacts()
      .then(setContacts)
      .catch((err) => console.error('Failed to load league contacts:', err))
      .finally(() => setLoading(false));
  }, []);

  const addressLine1 = contacts?.address_line1 || 'PO Box 47083 Creekside';
  const addressLine2 = contacts?.address_line2 || 'Calgary, Alberta T3P 0B9';
  const privacyOfficerTitle = contacts?.privacy_officer_title || 'President of the RMLL';
  const privacyOfficerEmail = contacts?.privacy_officer_email || '';

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        {/* Hero Banner */}
        <div className="bg-gradient-to-br from-[#001741] via-[#013fac] to-[#0149c9] text-white py-12 sm:py-16">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 bg-white/10 rounded-lg">
                <Shield className="w-7 h-7" />
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black">Privacy Policy</h1>
            </div>
            <p className="text-blue-200 text-base sm:text-lg max-w-2xl">
              The Rocky Mountain Lacrosse League is committed to protecting the personal information
              of its members, players, coaches, officials, and website visitors.
            </p>
            <p className="text-blue-300 text-sm mt-3">Last updated: January 21, 2010</p>
          </div>
        </div>

        <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {/* Introduction */}
          <section className="mb-10">
            <p className="text-gray-700 leading-relaxed">
              The Rocky Mountain Lacrosse League ("RMLL") respects the privacy of its members and is committed
              to safeguarding personal information in accordance with applicable Canadian privacy legislation,
              including the <em>Personal Information Protection and Electronic Documents Act</em> (PIPEDA) and
              the Alberta <em>Personal Information Protection Act</em> (PIPA). This policy outlines how personal
              information is collected, used, disclosed, and protected.
            </p>
          </section>

          {/* What We Collect */}
          <section className="mb-10">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Database className="w-6 h-6 text-[#013fac]" />
              Information We Collect
            </h2>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 sm:p-6">
              <p className="text-gray-700 mb-3 text-sm">The RMLL may collect the following types of personal information:</p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-[#013fac] font-bold mt-0.5">-</span>
                  <span><strong>Player Registration:</strong> Name, date of birth, address, phone number, email, emergency contacts, medical information relevant to participation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#013fac] font-bold mt-0.5">-</span>
                  <span><strong>Team Officials:</strong> Name, contact information, coaching certifications, criminal record check status</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#013fac] font-bold mt-0.5">-</span>
                  <span><strong>Game Officials:</strong> Name, contact information, certification levels</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#013fac] font-bold mt-0.5">-</span>
                  <span><strong>Statistics:</strong> Game performance data, scores, standings, and player statistics which are publicly displayed</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#013fac] font-bold mt-0.5">-</span>
                  <span><strong>Website Visitors:</strong> Basic usage data collected through standard web analytics</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Core Principles */}
          <section className="mb-10">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-6 h-6 text-[#013fac]" />
              Privacy Principles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PRINCIPLES.map((principle, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-[#013fac]/10 text-[#013fac] shrink-0">{principle.icon}</div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1.5">{principle.title}</h4>
                      <p className="text-sm text-gray-600 leading-relaxed">{principle.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Website & Cookies */}
          <section className="mb-10">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Globe className="w-6 h-6 text-[#013fac]" />
              Website Usage
            </h2>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 sm:p-6 space-y-3 text-sm text-gray-700 leading-relaxed">
              <p>
                The RMLL website uses local browser storage (localStorage) to remember your preferences, such as
                your selected division. This data is stored only on your device and is not transmitted to our servers.
              </p>
              <p>
                Game statistics, standings, scores, and player performance data displayed on this website are considered
                public information and are provided through the SportzSoft league management system. Players' names,
                jersey numbers, and statistical performance are displayed as part of the normal operation of the league.
              </p>
              <p>
                External links on this website may direct you to third-party sites. The RMLL is not responsible for
                the privacy practices of external websites.
              </p>
            </div>
          </section>

          {/* Your Rights */}
          <section className="mb-10">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-6 h-6 text-[#013fac]" />
              Your Rights
            </h2>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 sm:p-6 space-y-3 text-sm text-gray-700 leading-relaxed">
              <p>Members have the right to:</p>
              <ul className="list-disc list-inside space-y-1.5 ml-2">
                <li>Access their personal information held by the RMLL</li>
                <li>Request corrections to inaccurate personal information</li>
                <li>Withdraw consent for the collection and use of personal information (subject to legal or contractual restrictions)</li>
                <li>File a complaint regarding the handling of their personal information</li>
              </ul>
              <p>
                Please note that withdrawal of consent may affect your ability to participate in RMLL programs and activities.
              </p>
            </div>
          </section>

          {/* Privacy Officer */}
          <section>
            <div className="bg-gradient-to-r from-[#0F2942] to-[#1a3a5c] text-white rounded-xl p-6 sm:p-8 shadow-lg">
              <h3 className="text-lg sm:text-xl font-bold mb-3 flex items-center gap-2">
                <Mail className="w-5 h-5" /> Privacy Officer
              </h3>
              <div className="space-y-3 text-sm sm:text-base text-blue-100 leading-relaxed">
                <p>
                  The {privacyOfficerTitle} serves as the Privacy Officer for the RMLL.
                </p>
                <p>
                  Any member wanting access to their personal information, or with questions or concerns
                  about this policy, can contact the Privacy Officer at:
                </p>
                {loading ? (
                  <div className="flex items-center gap-2 text-blue-200 text-sm py-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading contact info...
                  </div>
                ) : (
                  <div className="bg-white/10 border border-white/20 rounded-lg p-4 mt-3">
                    <p className="font-semibold text-white">Rocky Mountain Lacrosse League</p>
                    <p>{addressLine1}</p>
                    <p>{addressLine2}</p>
                    {privacyOfficerEmail && (
                      <p className="mt-2">
                        Or e-mail the RMLL {privacyOfficerTitle}:{' '}
                        <a
                          href={`mailto:${privacyOfficerEmail}`}
                          className="text-blue-300 hover:text-white underline transition-colors"
                        >
                          {privacyOfficerEmail}
                        </a>
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
