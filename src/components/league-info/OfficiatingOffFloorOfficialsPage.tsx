import { FileText, ExternalLink, AlertTriangle, Users, Clock, ClipboardList } from 'lucide-react';

export function OfficiatingOffFloorOfficialsPage() {
  return (
    <div>
      <p className="text-base leading-relaxed">
        As per the LC Off-Floor Officials Guide for Box Lacrosse, Off-Floor Officials are very important
        Members of the Officiating team and are an integral part of our game with responsibilities and functions.
      </p>

      <p className="text-base leading-relaxed mt-3">
        The responsibilities and functions of the Off-Floor Officials are documented in the{' '}
        <strong>LC Off-Floor Officials Guide for Box Lacrosse</strong>.
      </p>

      {/* Document callout */}
      <div className="not-prose my-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <FileText className="w-5 h-5 text-[#013fac] mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-[#013fac] mb-1">Reference Document</p>
            <p className="text-sm text-gray-700 mb-2">
              The <strong>2011 Box Lacrosse Off-Floor Officials Guide</strong> is available in the RMLL
              Documents Library under the <em>Officiating</em> category.
            </p>
            <a
              href="/league-info?page=documents"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#013fac] hover:text-[#0149c9] hover:underline transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Open Documents Library
            </a>
          </div>
        </div>
      </div>

      <p className="text-base leading-relaxed mt-3">
        Since Off-Floor Officials are such an integral part of our game, teams are requested to have a
        designated group fulfill this role at each of their home games.
      </p>

      {/* Age requirement callout */}
      <div className="not-prose my-6">
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-amber-900 font-medium">
            As per RMLL Regulation 13, Off-Floor Officials must be <strong>18 years of age or older</strong>.
          </p>
        </div>
      </div>

      <h2>RMLL Regulation 13 - Maintenance of Order</h2>

      <div className="not-prose my-4 space-y-0">
        {/* Reg 13.1 */}
        <div className="border border-gray-200 rounded-t-lg bg-white">
          <div className="flex items-start gap-3 p-4">
            <div className="flex-shrink-0 bg-[#013fac] text-white text-xs font-bold rounded px-2 py-1 mt-0.5">
              13.1
            </div>
            <p className="text-sm text-gray-800 leading-relaxed">
              It is the home Franchise responsibility to supply all the Off-Floor Officials required for home games.
            </p>
          </div>

          {/* Sub-regulations indented */}
          <div className="border-t border-gray-100 bg-gray-50 px-3 sm:px-4 py-3 ml-4 sm:ml-8 mr-2 sm:mr-4 mb-4 rounded-lg space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 bg-gray-200 text-gray-700 text-xs font-bold rounded px-2 py-0.5 mt-0.5">
                13.1.1
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                Each Franchise will train a select group of individuals, eighteen years of age and older, for the role of Off-Floor Officials.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 bg-gray-200 text-gray-700 text-xs font-bold rounded px-2 py-0.5 mt-0.5">
                13.1.2
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                The ALRA will assign an Official to operate the shot clock for Playoff, RMLL Championship, and Provincial games.
              </p>
            </div>
          </div>
        </div>

        {/* Reg 13.2 */}
        <div className="border border-t-0 border-gray-200 bg-white">
          <div className="flex items-start gap-3 p-4">
            <div className="flex-shrink-0 bg-[#013fac] text-white text-xs font-bold rounded px-2 py-1 mt-0.5">
              13.2
            </div>
            <p className="text-sm text-gray-800 leading-relaxed">
              Off-Floor Officials are responsible for reading, understanding, and following the procedures listed in the{' '}
              <strong>LC Off-Floor Officials Guide</strong>.
            </p>
          </div>
        </div>

        {/* Reg 13.3 */}
        <div className="border border-t-0 border-gray-200 rounded-b-lg bg-white">
          <div className="flex items-start gap-3 p-4">
            <div className="flex-shrink-0 bg-[#013fac] text-white text-xs font-bold rounded px-2 py-1 mt-0.5">
              13.3
            </div>
            <p className="text-sm text-gray-800 leading-relaxed">
              The home Franchise is responsible for ensuring all the people assigned to the time-keepers bench are in place{' '}
              <strong>fifteen (15) minutes</strong> prior to the start of the game.
            </p>
          </div>
        </div>
      </div>

      {/* Key responsibilities summary */}
      <h2>Key Responsibilities Summary</h2>
      <div className="not-prose my-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <Users className="w-8 h-8 text-[#013fac] mx-auto mb-2" />
          <p className="text-sm font-bold text-gray-900 mb-1">Home Franchise Duty</p>
          <p className="text-xs text-gray-600">Supply trained Off-Floor Officials (18+) for every home game</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <ClipboardList className="w-8 h-8 text-[#013fac] mx-auto mb-2" />
          <p className="text-sm font-bold text-gray-900 mb-1">Know the Guide</p>
          <p className="text-xs text-gray-600">Read, understand, and follow the LC Off-Floor Officials Guide</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <Clock className="w-8 h-8 text-[#013fac] mx-auto mb-2" />
          <p className="text-sm font-bold text-gray-900 mb-1">15 Minutes Prior</p>
          <p className="text-xs text-gray-600">All timekeepers bench staff must be in place before game time</p>
        </div>
      </div>
    </div>
  );
}