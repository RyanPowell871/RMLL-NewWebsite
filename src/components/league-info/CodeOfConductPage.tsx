'use client';

import { Shield, CheckCircle } from 'lucide-react';

const CONDUCT_ITEMS = [
  {
    letter: 'A',
    text: 'Attempt at all times to work toward the goals and Mission Statement of the RMLL and the game of Lacrosse, and towards the betterment of its Members;',
  },
  {
    letter: 'B',
    text: 'Strive to heighten the image and dignity of the RMLL and the sport of Lacrosse as a whole, and to refrain from behavior which may discredit or embarrass the RMLL or the Game;',
  },
  {
    letter: 'C',
    text: 'Always be courteous and objective in dealings with other Members;',
  },
  {
    letter: 'D',
    text: 'Except when made through proper channels, refrain from unfavorable criticism of other Members or representatives of the RMLL;',
  },
  {
    letter: 'E',
    text: 'Strive to achieve excellence in the sport while supporting the concepts of Fair Play and a Drug-Free sport;',
  },
  {
    letter: 'F',
    text: 'Show respect for the cultural, social and political values of all participants in the sport;',
  },
  {
    letter: 'G',
    text: 'As a guest in a foreign country, other province or other Association, abide by the laws of the host and adhere to any social customs concerning conduct.',
  },
];

export function CodeOfConductPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#013fac]/5 via-white to-red-50 border-2 border-[#013fac]/20 rounded-lg p-6 sm:p-8">
        <div className="flex items-start gap-4 mb-4">
          <div className="p-3 bg-[#013fac] rounded-lg shadow-md">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Code of Conduct</h2>
            <div className="h-1 w-20 bg-[#013fac] rounded"></div>
          </div>
        </div>
        <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
          All Members, Members of Members, Officials, or other persons associated with the Rocky Mountain Lacrosse
          League are expected to uphold the following standards of conduct.
        </p>
      </div>

      {/* Conduct Items */}
      <div className="space-y-3">
        {CONDUCT_ITEMS.map((item) => (
          <div
            key={item.letter}
            className="flex items-start gap-4 bg-white border border-gray-200 rounded-lg p-4 sm:p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#013fac] text-white font-bold text-lg shrink-0 shadow-md">
              {item.letter}
            </div>
            <div className="flex-1">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-1" />
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">{item.text}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-r from-[#0F2942] to-[#1a3a5c] text-white rounded-lg p-6 sm:p-8 shadow-lg">
        <h3 className="text-lg sm:text-xl font-bold mb-3">Our Standard</h3>
        <p className="text-sm sm:text-base text-blue-100 leading-relaxed">
          The RMLL is committed to maintaining the highest standards of conduct across all levels of the organization.
          These principles apply to all participants — players, coaches, officials, volunteers, and administrators —
          and reflect our dedication to the values of fair play, respect, and sportsmanship that are central to the
          game of lacrosse.
        </p>
      </div>
    </div>
  );
}