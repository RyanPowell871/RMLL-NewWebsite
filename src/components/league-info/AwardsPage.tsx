import { useState } from 'react';
import { Award, Trophy, ChevronDown, ChevronRight, Heart, Star, Quote } from 'lucide-react';

// Award ceremony photos
import billSuchaAwardPhoto from 'figma:asset/43baae1dfe97f21ad34f3ec5b183fc9a91b1ddbd.png';
import wayneSutherlandPhoto from 'figma:asset/cd2b8ac5d778cd8a0d9c952eef39aa2e6eed1730.png';

/* --- Award Data --- */

interface AwardRecipient {
  year: number;
  name: string;
  affiliation?: string;
  notAwarded?: boolean;
  reason?: string;
  inaugural?: boolean;
}

interface AwardData {
  id: string;
  title: string;
  subtitle: string;
  honoree: string;
  honoreeDates?: string;
  createdYear: number;
  description: string;
  biography: string[];
  dedication?: string;
  recipients: AwardRecipient[];
  accentColor: string;
  accentBg: string;
  accentBorder: string;
  photo?: string;
  photoCaption?: string;
}

const AWARDS: AwardData[] = [
  {
    id: 'bill-sucha',
    title: 'Bill Sucha Volunteer of the Year Award',
    subtitle: 'Recognizing exceptional volunteer contributions to Major Lacrosse',
    honoree: 'Bill Sucha',
    honoreeDates: 'January 18, 1957 - December 13, 2018',
    createdYear: 2018,
    description: 'In recognition of the contribution Bill Sucha made to the sport of lacrosse throughout the years, in November 2018, the RMLL created the Bill Sucha Volunteer of the Year Award and presented the inaugural award to Bill\'s sons, David and Steven at the 2018 AGM. Annual nominations for the Bill Sucha Volunteer of the Year Award is for a sustained period of exceptional volunteer work in Major Lacrosse.',
    biography: [
      'One might argue that above all else, a volunteer\'s job is to dedicate themselves to where help is needed, perhaps at the expense of where they might really want to help. In rare cases though, we come across a volunteer who does just that but who\'s skill set is also perfectly matched to where the volunteer is needed. Bill Sucha was such a volunteer.',
      'Co-Founder of the Jr A Mountaineers, esteemed President of the RMLL, and although technically not a volunteer position, Bill was also an ALRA referee, although good luck convincing anyone he did it for the money!',
      'Bill was the type of volunteer all sports associations dream of. He had an undeniable dedication to the success of his children in sport which ultimately led to a broader passion for the sport of lacrosse, an expanded volunteer footprint, which ultimately enabled Bill to positively impact more athletes in the fastest possible way.',
      'Bill was innately adept at navigating the political pitfalls that come with all major sports associations. In fact, Bill did so to such an extent that not only was he able to move the sport of lacrosse in Alberta positively forward, but he did so by building relationships, working with not against opposing voices, and gaining genuine friendships along the way.',
      'Bill was unique among his volunteering peers and he set a standard regarding how to get things done the right way. Which is to say, by treating people the way he hoped to be treated. With respect, dignity, and appreciation. Bill didn\'t have enemies, he had people he hadn\'t yet convinced. That\'s leadership.',
      'Bill\'s earnest approach to volunteering most certainly endeared him to his peers, but it\'s not enough to get people in the same room who invariably have differing opinions on how something should be done. No, to be a great leader one must also actually get things done and perhaps above all other considerations, this was a trademark of Bill.',
      'Bill knew how to get things done because he was the first to get his hands dirty... but he did so with community building in mind. If a hole needed to be dug, Bill didn\'t just start digging. No, Bill would bring 10 shovels, invite 50 people, bring food and wine for 75, then start digging himself until the hole was dug. And guess what, those other shovels would happily have hands on them. Bill made things happen.',
      'Bill did it the right way - he executed the responsibility of being a volunteer the right way. Those throughout the RMLL, and those who knew Bill personally will be forever grateful for Bill\'s tireless dedication to the RMLL, the sport of lacrosse, the athletes. Bill left an indelible mark on our lacrosse volunteer community that will not be forgotten.',
    ],
    dedication: 'We dedicate the RMLL Volunteer of the Year Award to Bill Sucha, which will hence forward be known as the Bill Sucha Volunteer of the Year Award.\n\nThank You Bill!',
    recipients: [
      { year: 2024, name: 'Greg Lintz', affiliation: 'RMLL Executive' },
      { year: 2023, name: 'Tony Materi', affiliation: 'Edmonton Warriors' },
      { year: 2022, name: 'Randy Trobak', affiliation: 'Saskatchewan SWAT' },
      { year: 2021, name: '', notAwarded: true, reason: 'Not Awarded due to COVID' },
      { year: 2020, name: '', notAwarded: true, reason: 'Not Awarded due to COVID' },
      { year: 2019, name: 'Christine Thielen', affiliation: 'RMLL Executive Director' },
      { year: 2018, name: 'Bill Sucha', inaugural: true },
    ],
    accentColor: 'text-amber-600',
    accentBg: 'bg-amber-50',
    accentBorder: 'border-amber-300',
    photo: wayneSutherlandPhoto,
    photoCaption: 'Bill Sucha Volunteer of the Year Award',
  },
  {
    id: 'wayne-sutherland',
    title: 'Wayne Sutherland Coaching Award',
    subtitle: 'Recognizing excellence in coaching through major accomplishment or sustained achievement',
    honoree: 'Wayne "Suds" Sutherland',
    createdYear: 2018,
    description: 'In recognition of the contribution Wayne made to lacrosse over 40 years, in November 2018, the RMLL created the Wayne Sutherland Coaching Award and presented the award to Wayne at the 2018 AGM. Annual nominations for the Wayne Sutherland Coach of the Year Award is for excellence in coaching either for a major accomplishment or a sustained record of achievement.',
    biography: [
      'Wayne "Suds" Sutherland was involved in the game of Lacrosse for over 40 years, from being a grassroots participant as a minor lacrosse player to the pinnacles of the game as a professional player, both in Canada and internationally. He was a successful Coach, Mentor and Clinician.',
      'Suds came to the game late, he started playing in 1967 as a Midget with the South Burnaby Payless Gas team and played his way up the ranks of the South Burnaby organization culminating with three years on the Burnaby Cablevision team in the West Coast Junior A League, where he had a successful career.',
      'Notwithstanding he was drafted the following year into the WLA, Suds, like many young players aspired to "play pro" and, when the first NLL was formed, he found a spot on the roster of the Montreal Quebecois. Some "fun facts" about that time in Suds\' career. The team played in the old Montreal Forum, the shrine made famous by the Montreal Canadiens and his Coach was none other than John Ferguson, the legendary Montreal tough guy. Suds had 49 points in the 1974-75 season in 39 games, not bad for a kid from the coast, until you realize he finished a mere 134 points behind team leader Johnny Davis who had 184 points that season.',
      'Suds\' pro career lasted just the one year, mind you the league only lasted two, its first time around. He returned to West Coast and played for the Nanaimo Timberman of the WLA for the 1975/76 season where he was a WLA Top 10 Scorer with 72 points in 24 games and was named a Second Team All Star, along with Paul Parnell of the New Westminster Salmonbellies. That was the last season Suds played Lacrosse on the Coast.',
      'With the oil boom upon us, Suds like many in the late 70\'s moved from the Coast to seek his fortune and fame in Calgary\'s oilpatch and joined the ranks of Dome Petroleum, but he couldn\'t stay away from the game he loved. His first Alberta lacrosse coaching assignment came as the Head Coach of the Calgary Jr B Mountaineers in 1977 where he coached a number of players who are either still active in the game today as Coaches or Officials or who\'s kids or in some cases grand kids are now playing lacrosse in Minor, Junior or Senior.',
      'Even though he had no kids of his own he gave countless volunteer hours coaching and mentoring in the game of lacrosse. Since his first Alberta Coaching assignment in 1977 he coached Pee Wee, Bantam and Midget with the Calgary Sabrecats, as well as a number of tournament and Team Alberta teams.',
      'He was also been a Coach and Player/Coach with the Sr B. Mounties winning a number of Provincial Championships and making numerous President\'s Cup appearances winning Gold in 1983 and Silver in 1981. Together with Duane Bratt, he also coached the Calgary Boykiws Senior Men\'s Field team to a Ross Victory Cup Gold Medal performance in 2010 at McGill University.',
      'Suds was as Coach of the Jr. B Mounties where he was a fixture behind the bench from 2003 until his passing in December 2018. In those 15 seasons he built a family and a legacy that will continue to impact the game of lacrosse well into the future. Under his guidance the team had great success on the floor with 7 consecutive Alberta Provincial Championships, 11 Founders Cup appearances resulting in 1 National Championship Gold, 2 Silver and 3 Bronze medals, perhaps the most successful team in Alberta history in National Competition.',
      'But his greatest accomplishment and contribution was the passion he had for the game, a passion he has passed onto his players and everyone around him and what those individuals have done and continue to do with that passion. That is the greatest lasting impact he will have on the game.',
    ],
    recipients: [
      { year: 2024, name: 'Daryl Hodinsky', affiliation: 'Lakeland Heat' },
      { year: 2023, name: 'Vay Diep & Robin Finley', affiliation: 'Edmonton Warriors / Silvertips' },
      { year: 2022, name: 'John Lintz, Richard Lochlan & Lucas Bobbitt', affiliation: 'Edmonton Miners / Strathmore Venom' },
      { year: 2021, name: '', notAwarded: true, reason: 'Not Awarded due to COVID' },
      { year: 2020, name: '', notAwarded: true, reason: 'Not Awarded due to COVID' },
      { year: 2019, name: 'Jason Crook', affiliation: 'Calgary Shamrocks' },
      { year: 2018, name: 'Wayne "Suds" Sutherland', inaugural: true },
    ],
    accentColor: 'text-blue-600',
    accentBg: 'bg-blue-50',
    accentBorder: 'border-blue-300',
    photo: billSuchaAwardPhoto,
    photoCaption: 'Wayne "Suds" Sutherland',
  },
];

/* --- Component --- */

function AwardCard({ award }: { award: AwardData }) {
  const [showBio, setShowBio] = useState(false);

  return (
    <div className="border-2 border-gray-200 rounded-lg overflow-hidden shadow-sm">
      {/* Award Header */}
      <div className={`${award.accentBg} border-b-2 ${award.accentBorder} p-4 sm:p-6`}>
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-full bg-white border-2 ${award.accentBorder} shrink-0`}>
            {award.id === 'bill-sucha'
              ? <Heart className={`w-6 h-6 ${award.accentColor}`} />
              : <Star className={`w-6 h-6 ${award.accentColor}`} />
            }
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">{award.title}</h3>
            <p className="text-sm text-gray-600 mt-1">{award.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Honoree */}
      <div className="p-4 sm:p-6 bg-white">
        <div className="text-center mb-4">
          <h4 className="text-xl sm:text-2xl font-bold text-gray-900">{award.honoree}</h4>
          {award.honoreeDates && (
            <p className="text-sm text-gray-500 mt-1">{award.honoreeDates}</p>
          )}
        </div>

        {/* Award Photo */}
        {award.photo && (
          <div className="flex justify-center mb-5">
            <div className={`rounded-lg overflow-hidden border-2 ${award.accentBorder} shadow-md max-w-xs sm:max-w-sm`}>
              <img
                src={award.photo}
                alt={award.photoCaption || award.title}
                className="w-full h-auto object-cover"
              />
              {award.photoCaption && (
                <div className={`${award.accentBg} px-3 py-2 text-center`}>
                  <p className={`text-xs font-semibold ${award.accentColor}`}>{award.photoCaption}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Description */}
        <div className={`${award.accentBg} border ${award.accentBorder} rounded-lg p-4 mb-5`}>
          <p className="text-sm text-gray-700 leading-relaxed">{award.description}</p>
        </div>

        {/* Biography - Collapsible */}
        <div className="mb-5">
          <button
            onClick={() => setShowBio(!showBio)}
            className="flex items-center gap-2 text-sm font-bold text-[#013fac] hover:text-[#0149c9] transition-colors"
          >
            {showBio
              ? <ChevronDown className="w-4 h-4" />
              : <ChevronRight className="w-4 h-4" />
            }
            {showBio ? 'Hide' : 'Read'} Full Biography
          </button>

          {showBio && (
            <div className="mt-4 space-y-4">
              {award.biography.map((para, i) => (
                <p key={i} className="text-sm text-gray-700 leading-relaxed">
                  {para}
                </p>
              ))}

              {award.dedication && (
                <div className="mt-6 border-t border-gray-200 pt-4">
                  <div className="flex items-start gap-2">
                    <Quote className={`w-5 h-5 ${award.accentColor} shrink-0 mt-0.5`} />
                    <div className="italic text-gray-800 text-sm leading-relaxed space-y-2">
                      {award.dedication.split('\n\n').map((line, i) => (
                        <p key={i} className={i === award.dedication!.split('\n\n').length - 1 ? 'font-bold text-base' : ''}>
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Recipients Table */}
        <div>
          <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Trophy className={`w-4 h-4 ${award.accentColor}`} />
            Award Recipients
          </h4>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="min-w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left font-bold text-gray-700 border border-gray-200 w-20">Year</th>
                  <th className="px-4 py-2 text-left font-bold text-gray-700 border border-gray-200">Recipient</th>
                  <th className="px-4 py-2 text-left font-bold text-gray-700 border border-gray-200 hidden sm:table-cell">Affiliation</th>
                </tr>
              </thead>
              <tbody>
                {award.recipients.map((r, i) => (
                  <tr
                    key={r.year}
                    className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${r.inaugural ? `${award.accentBg}` : ''}`}
                  >
                    <td className="px-4 py-2.5 border border-gray-200 font-bold text-gray-900 tabular-nums">
                      {r.year}
                    </td>
                    <td className="px-4 py-2.5 border border-gray-200">
                      {r.notAwarded ? (
                        <span className="text-gray-400 italic">{r.reason}</span>
                      ) : (
                        <div>
                          <span className={`font-semibold ${r.inaugural ? award.accentColor : 'text-gray-900'}`}>
                            {r.name}
                          </span>
                          {r.inaugural && (
                            <span className={`ml-2 text-xs ${award.accentColor} font-bold`}>(Inaugural)</span>
                          )}
                          {r.affiliation && (
                            <span className="text-gray-500 text-xs sm:hidden ml-1">- {r.affiliation}</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2.5 border border-gray-200 text-gray-600 hidden sm:table-cell">
                      {r.notAwarded ? (
                        <span className="text-gray-300">-</span>
                      ) : (
                        r.affiliation || <span className="text-gray-300">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AwardsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-50 via-white to-blue-50 border-2 border-[#013fac] rounded-lg p-4 sm:p-6">
        <div className="flex items-start gap-3">
          <Award className="w-8 h-8 text-[#013fac] shrink-0 mt-1" />
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">RMLL Awards</h2>
            <p className="text-sm text-gray-700 mt-2">
              The Rocky Mountain Lacrosse League recognizes outstanding contributions to the sport
              through annual awards presented at the AGM. These awards honour individuals who have
              made a lasting impact on lacrosse through volunteerism and coaching excellence.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Both awards were established in November 2018 and first presented at the 2018 AGM.
            </p>
          </div>
        </div>
      </div>

      {/* Award Cards */}
      {AWARDS.map(award => (
        <AwardCard key={award.id} award={award} />
      ))}
    </div>
  );
}