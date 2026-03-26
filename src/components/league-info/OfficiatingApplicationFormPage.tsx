import { ExternalLink, ClipboardCheck, Award, Users, CheckCircle } from 'lucide-react';

const FORM_URL = 'https://docs.google.com/forms/d/10D5MFdz9ENNOzw4HY6gapOOzuDQcMnXhThZ1M7SIS3c/viewform?edit_requested=true';

const ATTRIBUTES = [
  { text: 'ALA Minor Box Provincials / Summer Games / Nationals Experience', applicants: 'All Applicants' },
  { text: 'Jr B Tier I or Higher Playing Experience', applicants: 'Male Applicants' },
  { text: 'Jr B Tier I or Higher Coaching Experience', applicants: 'All Applicants' },
  { text: 'Jr or Sr Playing Experience', applicants: 'Female Applicants' },
  { text: 'Jr or Sr Hockey Refereeing or Linesing Experience', applicants: 'All Applicants' },
  { text: 'High School / Collegiate Basketball Officiating Experience', applicants: 'All Applicants' },
];

export function OfficiatingApplicationFormPage() {
  return (
    <div>
      <p className="text-base leading-relaxed">
        The <strong>Alberta Referees Lacrosse Association</strong> is looking for the top officiating
        prospects in Alberta to add to our roster for the Rocky Mountain Lacrosse League.
      </p>

      <p className="text-base leading-relaxed mt-3">
        Those who are interested in enhancing their personal development and on-floor performance are
        encouraged to complete the <strong>RMLL Officials Application Form</strong>.
      </p>

      {/* CTA Card */}
      <div className="not-prose my-6">
        <div className="bg-gradient-to-r from-[#013fac] to-[#0149c9] rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-start gap-4">
            <div className="bg-white/20 rounded-lg p-3 flex-shrink-0">
              <ClipboardCheck className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-1">RMLL Officials Application Form</h3>
              <p className="text-blue-100 text-sm mb-4">
                Complete the application to be considered for RMLL officiating assignments.
              </p>
              <a
                href={FORM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white text-[#013fac] font-bold px-5 py-2.5 rounded-lg hover:bg-blue-50 transition-colors shadow-md text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                Open Application Form
              </a>
            </div>
          </div>
        </div>
      </div>

      <h2>Attributes That Will Assist Applicants</h2>

      <p className="text-sm text-gray-600 mb-3">
        The following experience and qualifications will strengthen your application:
      </p>

      <div className="not-prose my-4 space-y-2">
        {ATTRIBUTES.map((attr, i) => (
          <div key={i} className="flex items-start gap-3 bg-white border border-gray-200 rounded-lg p-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 font-medium">{attr.text}</p>
            </div>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
              attr.applicants === 'All Applicants'
                ? 'bg-blue-100 text-blue-800'
                : attr.applicants === 'Male Applicants'
                ? 'bg-purple-100 text-purple-800'
                : 'bg-pink-100 text-pink-800'
            }`}>
              {attr.applicants}
            </span>
          </div>
        ))}
      </div>

      <h2>What Happens After You Apply</h2>

      <p className="text-base leading-relaxed">
        Those officials who complete the form will be contacted by the <strong>ALRA</strong> on the status
        of their application during the season, and may receive RMLL assignments based upon their performance
        in minor lacrosse during the season.
      </p>

      {/* Secondary CTA */}
      <div className="not-prose mt-6">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 flex-1">
            <Award className="w-5 h-5 text-[#013fac] flex-shrink-0" />
            <p className="text-sm text-gray-700">
              Ready to take the next step in your officiating career?
            </p>
          </div>
          <a
            href={FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#013fac] hover:text-[#0149c9] hover:underline transition-colors flex-shrink-0"
          >
            <ExternalLink className="w-4 h-4" />
            Apply Now
          </a>
        </div>
      </div>
    </div>
  );
}
