import { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { FileText, AlertTriangle, Shield, Users, Camera, Scale, Ban, RefreshCw, Loader2 } from 'lucide-react';
import { useDocumentMeta, PAGE_META } from '../hooks/useDocumentMeta';
import { fetchLeagueContacts, type LeagueContacts } from '../services/cms-api';

interface TermSection {
  icon: React.ReactNode;
  title: string;
  content: React.ReactNode;
}

const TERMS_SECTIONS: TermSection[] = [
  {
    icon: <Users className="w-5 h-5" />,
    title: '1. Acceptance of Terms',
    content: (
      <p>
        By accessing and using the Rocky Mountain Lacrosse League ("RMLL") website, you accept and agree to be
        bound by these Terms of Service. If you do not agree to these terms, please do not use this website.
        The RMLL reserves the right to modify these terms at any time, and your continued use of the website
        constitutes acceptance of any changes.
      </p>
    ),
  },
  {
    icon: <FileText className="w-5 h-5" />,
    title: '2. Website Content',
    content: (
      <div className="space-y-3">
        <p>
          The RMLL website provides information about the league, including but not limited to schedules,
          standings, statistics, news, player information, and league governance documents. While the RMLL
          strives to ensure accuracy, all content is provided "as is" without warranty of any kind.
        </p>
        <p>
          Game scores, statistics, and standings are sourced from the SportzSoft league management system
          and are updated on a regular basis. The RMLL does not guarantee the real-time accuracy of this data
          and is not responsible for discrepancies arising from delayed updates.
        </p>
      </div>
    ),
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: '3. Intellectual Property',
    content: (
      <div className="space-y-3">
        <p>
          All content on this website, including but not limited to text, graphics, logos, images, and software,
          is the property of the Rocky Mountain Lacrosse League or its content suppliers and is protected by
          Canadian copyright and intellectual property laws.
        </p>
        <p>
          The RMLL name, logo, and related marks are trademarks of the Rocky Mountain Lacrosse League.
          You may not use these marks without prior written consent from the RMLL.
        </p>
      </div>
    ),
  },
  {
    icon: <Camera className="w-5 h-5" />,
    title: '4. Photography & Media',
    content: (
      <div className="space-y-3">
        <p>
          By participating in RMLL events as a player, coach, official, or spectator, you acknowledge
          that photographs and video recordings may be taken during games and events. These images may be
          used by the RMLL on its website, social media accounts, and promotional materials.
        </p>
        <p>
          If you have concerns about the use of your image or your child's image, please contact
          the RMLL Executive Director.
        </p>
      </div>
    ),
  },
  {
    icon: <Ban className="w-5 h-5" />,
    title: '5. Prohibited Conduct',
    content: (
      <div className="space-y-3">
        <p>Users of this website agree not to:</p>
        <ul className="list-disc list-inside space-y-1.5 ml-2 text-gray-600">
          <li>Use the website for any unlawful purpose or in violation of any applicable laws</li>
          <li>Attempt to gain unauthorized access to any portion of the website or its systems</li>
          <li>Scrape, harvest, or collect personal information of players, coaches, or officials for commercial purposes</li>
          <li>Reproduce, distribute, or republish league content without express written permission</li>
          <li>Interfere with or disrupt the website's functionality or servers</li>
          <li>Impersonate any person or entity, or misrepresent your affiliation with the RMLL</li>
        </ul>
      </div>
    ),
  },
  {
    icon: <Scale className="w-5 h-5" />,
    title: '6. Limitation of Liability',
    content: (
      <div className="space-y-3">
        <p>
          The RMLL, its executive members, volunteers, and affiliates shall not be liable for any direct,
          indirect, incidental, consequential, or punitive damages arising out of your use of or inability
          to use this website.
        </p>
        <p>
          The RMLL does not warrant that the website will be uninterrupted, error-free, or free of viruses
          or other harmful components. The website is operated on a volunteer basis and service availability
          may vary.
        </p>
      </div>
    ),
  },
  {
    icon: <AlertTriangle className="w-5 h-5" />,
    title: '7. Disclaimer',
    content: (
      <div className="space-y-3">
        <p>
          This website is provided on an "as is" and "as available" basis. The RMLL makes no representations
          or warranties of any kind, express or implied, regarding the operation of the website or the
          information, content, materials, or products included on this website.
        </p>
        <p>
          Information provided on this website, including league rules, regulations, and bylaws, is for
          general reference purposes. In the event of any discrepancy between website content and official
          RMLL documents, the official documents shall prevail.
        </p>
      </div>
    ),
  },
  {
    icon: <FileText className="w-5 h-5" />,
    title: '8. External Links',
    content: (
      <p>
        This website may contain links to third-party websites, including those of affiliate organizations,
        sponsors, and partners. The RMLL is not responsible for the content, privacy practices, or terms of
        service of any linked websites. These links are provided for convenience only and do not imply
        endorsement by the RMLL.
      </p>
    ),
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: '9. Member Conduct & Code of Conduct',
    content: (
      <div className="space-y-3">
        <p>
          All RMLL members, including players, coaches, officials, and volunteers, are subject to the RMLL
          Code of Conduct, Bylaws, and Regulations. These documents, available on the League Info section of
          this website, govern behaviour both on and off the floor during RMLL-sanctioned events.
        </p>
        <p>
          Violations of the Code of Conduct may result in suspensions, fines, or other disciplinary action
          as determined by the RMLL Executive and/or the appropriate Division Commissioner.
        </p>
      </div>
    ),
  },
  {
    icon: <RefreshCw className="w-5 h-5" />,
    title: '10. Changes to Terms',
    content: (
      <p>
        The RMLL reserves the right to update or modify these Terms of Service at any time without prior
        notice. Changes will be effective immediately upon posting on this website. Your continued use of
        the website following any changes constitutes your acceptance of the revised terms. We encourage
        users to review these terms periodically.
      </p>
    ),
  },
  {
    icon: <Scale className="w-5 h-5" />,
    title: '11. Governing Law',
    content: (
      <p>
        These Terms of Service shall be governed by and construed in accordance with the laws of the
        Province of Alberta and the federal laws of Canada applicable therein, without regard to
        conflict of law principles. Any disputes arising from these terms shall be subject to the
        exclusive jurisdiction of the courts of the Province of Alberta.
      </p>
    ),
  },
];

export function TermsOfServicePage() {
  useDocumentMeta(PAGE_META.termsOfService);

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

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        {/* Hero Banner */}
        <div className="bg-gradient-to-br from-[#001741] via-[#013fac] to-[#0149c9] text-white py-12 sm:py-16">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 bg-white/10 rounded-lg">
                <FileText className="w-7 h-7" />
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black">Terms of Service</h1>
            </div>
            <p className="text-blue-200 text-base sm:text-lg max-w-2xl">
              Please read these terms carefully before using the RMLL website.
            </p>
            <p className="text-blue-300 text-sm mt-3">Effective: February 2026</p>
          </div>
        </div>

        <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {/* Introduction */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 sm:p-6 mb-8">
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              These Terms of Service ("Terms") govern your use of the Rocky Mountain Lacrosse League website
              and its associated services. The RMLL operates as a volunteer-run lacrosse league sanctioned under
              the Alberta Lacrosse Association and Lacrosse Canada. By using this website, you acknowledge that
              you have read, understood, and agree to be bound by these Terms.
            </p>
          </div>

          {/* Terms Sections */}
          <div className="space-y-6">
            {TERMS_SECTIONS.map((section, idx) => (
              <section key={idx} className="bg-white border border-gray-200 rounded-lg p-5 sm:p-6 hover:shadow-sm transition-shadow">
                <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-[#013fac]/10 text-[#013fac] shrink-0">
                    {section.icon}
                  </div>
                  <span className="mt-1.5">{section.title}</span>
                </h2>
                <div className="text-sm text-gray-600 leading-relaxed ml-12">
                  {section.content}
                </div>
              </section>
            ))}
          </div>

          {/* Contact */}
          <div className="mt-10 bg-gradient-to-r from-[#0F2942] to-[#1a3a5c] text-white rounded-xl p-6 sm:p-8 shadow-lg">
            <h3 className="text-lg font-bold mb-3">Questions About These Terms?</h3>
            <p className="text-sm text-blue-100 mb-4 leading-relaxed">
              If you have questions or concerns about these Terms of Service, please contact us:
            </p>
            {loading ? (
              <div className="flex items-center gap-2 text-blue-200 text-sm py-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading contact info...
              </div>
            ) : (
              <div className="bg-white/10 border border-white/20 rounded-lg p-4">
                <p className="font-semibold text-white">Rocky Mountain Lacrosse League</p>
                <p className="text-blue-100 text-sm">{addressLine1}, {addressLine2}</p>
                <p className="text-sm mt-2">
                  <a
                    href="/contact"
                    onClick={(e) => {
                      e.preventDefault();
                      (window as any).navigateToPath('/contact');
                    }}
                    className="text-blue-300 hover:text-white underline transition-colors"
                  >
                    Contact Us
                  </a>
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
