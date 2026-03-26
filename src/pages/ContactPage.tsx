import { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { ContactForm } from '../components/ContactForm';
import { Mail, MapPin, Clock, ExternalLink, Loader2 } from 'lucide-react';
import { useDocumentMeta, PAGE_META } from '../hooks/useDocumentMeta';
import { fetchLeagueContacts, type LeagueContacts } from '../services/cms-api';

// Hardcoded fallbacks used while CMS data loads or if fetch fails
const FALLBACK_EXECUTIVE = [
  { role: 'President', name: 'Duane Bratt', email: 'dbratt@mtroyal.ca' },
  { role: 'Executive Director', name: 'Christine Thielen', email: 'christinethielen@hotmail.com' },
  { role: 'Vice President', name: 'Greg Lintz', email: 'greg@purdonlaw.com' },
];

const FALLBACK_COMMISSIONERS = [
  { division: 'ASL (Senior B)', commissioner: 'Norm Shaw', email: 'rmllsrb@gmail.com' },
  { division: 'Senior C', commissioner: 'Melinda Campbell', email: 'rmllsrc@gmail.com' },
  { division: 'Junior A', commissioner: 'Darrel Knight', email: 'darrelk1@me.com' },
  { division: 'Junior B Tier I', commissioner: 'Ian Stewart', email: 'rmlljrbtierone@gmail.com' },
  { division: 'Junior B Tier II', commissioner: 'Shari Weber', email: 'rmlljrb2@gmail.com' },
  { division: 'Junior B Tier III', commissioner: 'Shari Weber', email: 'rmlljrb3@gmail.com' },
  { division: 'Alberta Major Female', commissioner: 'Mandy Fehr', email: 'rmllfemalelax@gmail.com' },
];

export function ContactPage() {
  useDocumentMeta(PAGE_META.contact);

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
  const generalEmail = contacts?.general_inquiry_email || 'christinethielen@hotmail.com';
  const executiveContacts = contacts?.executive_contacts?.length
    ? contacts.executive_contacts
    : FALLBACK_EXECUTIVE;
  const divisionContacts = contacts?.division_commissioners?.length
    ? contacts.division_commissioners
    : [];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        {/* Hero Banner */}
        <div className="bg-gradient-to-br from-[#001741] via-[#013fac] to-[#0149c9] text-white py-12 sm:py-16">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-3">Contact Us</h1>
            <p className="text-blue-200 text-base sm:text-lg max-w-2xl">
              Have a question about the Rocky Mountain Lacrosse League? We're here to help.
              Reach out to our executive team or use the contact form below.
            </p>
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Left Column - Contact Info */}
            <div className="lg:col-span-1 space-y-6">
              {/* General Info Card */}
              <div className="bg-gradient-to-br from-[#0F2942] to-[#1a3a5c] text-white rounded-xl p-6 shadow-lg">
                <h2 className="text-lg font-bold mb-5">League Office</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-blue-300 shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-100">
                      <p className="font-semibold text-white">Rocky Mountain Lacrosse League</p>
                      <p>{addressLine1}</p>
                      <p>{addressLine2}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-blue-300 shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-100">
                      <p className="font-semibold text-white">General Inquiries</p>
                      <a href={`mailto:${generalEmail}`} className="hover:text-white transition-colors underline">
                        {generalEmail}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-blue-300 shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-100">
                      <p className="font-semibold text-white">Season</p>
                      <p>March through September</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Executive Contacts */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Executive Contacts</h2>
                {loading ? (
                  <div className="flex items-center gap-2 text-gray-400 text-sm py-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading...
                  </div>
                ) : (
                  <div className="space-y-3">
                    {executiveContacts.map((contact) => (
                      <div key={contact.role} className="flex flex-col">
                        <span className="text-xs font-semibold text-[#013fac] uppercase tracking-wider">{contact.role}</span>
                        <span className="text-sm font-semibold text-gray-900">{contact.name}</span>
                        <a href={`mailto:${contact.email}`} className="text-sm text-gray-500 hover:text-[#013fac] transition-colors">
                          {contact.email}
                        </a>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-gray-100">
                      <a
                        href="/league-info"
                        onClick={(e) => {
                          e.preventDefault();
                          (window as any).navigateToPath('/league-info');
                        }}
                        className="text-sm text-[#013fac] hover:text-[#0149c9] font-semibold flex items-center gap-1"
                      >
                        View Full Executive List <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Division Commissioners */}
              {!loading && divisionContacts.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Division Commissioners</h2>
                <p className="text-xs text-gray-500 mb-3">
                  For division-specific questions, contact the appropriate commissioner:
                </p>
                  <div className="space-y-2.5">
                    {divisionContacts.map((contact) => (
                      <div key={contact.division} className="flex flex-col">
                        <span className="text-xs font-semibold text-gray-500">{contact.division}</span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-sm font-semibold text-gray-900">{contact.commissioner}</span>
                          <span className="text-gray-300">-</span>
                          <a href={`mailto:${contact.email}`} className="text-xs text-gray-500 hover:text-[#013fac] transition-colors">
                            {contact.email}
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
              </div>
              )}
            </div>

            {/* Right Column - Contact Form */}
            <div className="lg:col-span-2">
              <ContactForm />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}