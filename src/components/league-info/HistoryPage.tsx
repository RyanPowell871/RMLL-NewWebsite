import { useState } from 'react';
import { History, Trophy, Star, ChevronDown, ChevronRight, Shield, Award, Landmark, Users } from 'lucide-react';

/* --------------- Section Toggle --------------- */
function CollapsibleSection({
  title,
  icon,
  children,
  defaultOpen = false,
  accentColor = '#013fac',
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  accentColor?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 sm:px-6 py-4 bg-white hover:bg-gray-50 transition-colors text-left"
      >
        <div className="p-2 rounded-lg shrink-0" style={{ backgroundColor: accentColor }}>
          {icon}
        </div>
        <span className="flex-1 font-bold text-gray-900 text-base sm:text-lg">{title}</span>
        {open ? (
          <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
        )}
      </button>
      {open && <div className="px-4 sm:px-6 pb-6 pt-2 bg-white border-t border-gray-100">{children}</div>}
    </div>
  );
}

/* --------------- Prose Block --------------- */
function Prose({ children }: { children: React.ReactNode }) {
  return <div className="prose-section space-y-4 text-sm sm:text-base text-gray-700 leading-relaxed">{children}</div>;
}

/* --------------- Standings Table --------------- */
function StandingsTable({
  title,
  headers,
  rows,
  note,
}: {
  title: string;
  headers: string[];
  rows: string[][];
  note?: string;
}) {
  return (
    <div className="my-4">
      <h5 className="font-bold text-gray-800 text-sm mb-2">{title}</h5>
      <div className="overflow-x-auto">
        <table className="w-full text-xs sm:text-sm border border-gray-200 rounded">
          <thead>
            <tr className="bg-gray-50">
              {headers.map((h) => (
                <th key={h} className="px-2 sm:px-3 py-2 text-left font-bold text-gray-600 border-b border-gray-200 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}>
                {row.map((cell, j) => (
                  <td key={j} className="px-2 sm:px-3 py-1.5 border-b border-gray-100 whitespace-nowrap">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {note && <p className="text-xs text-gray-500 mt-1.5 italic">{note}</p>}
    </div>
  );
}

/* --------------- Championship List --------------- */
function ChampionshipList({ items }: { items: { year: string; detail: string; highlight?: boolean }[] }) {
  return (
    <div className="space-y-1 my-3">
      {items.map((item, i) => (
        <div
          key={i}
          className={`flex items-start gap-2 px-3 py-1.5 rounded text-sm ${
            item.highlight ? 'bg-yellow-50 border border-yellow-200 font-bold text-gray-900' : 'text-gray-700'
          }`}
        >
          <span className="font-mono font-bold text-gray-500 shrink-0 w-10">{item.year}</span>
          <span className="flex-1">
            {item.highlight && <Trophy className="w-3.5 h-3.5 inline mr-1 text-yellow-600 -mt-0.5" />}
            {item.detail}
          </span>
        </div>
      ))}
    </div>
  );
}

/* =============== MAIN COMPONENT =============== */
export function HistoryPage() {
  return (
    <div className="space-y-6">
      {/* Intro */}
      <div className="bg-gradient-to-br from-[#013fac]/5 via-white to-red-50 border-2 border-[#013fac]/20 rounded-lg p-6 sm:p-8">
        <div className="flex items-start gap-4 mb-4">
          <div className="p-3 bg-[#013fac] rounded-lg shadow-md">
            <History className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">League History</h2>
            <div className="h-1 w-20 bg-[#013fac] rounded"></div>
          </div>
        </div>
        <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
          Alberta has a rich history of lacrosse without many people even knowing it. Teams from Alberta have challenged
          for all four major trophies in Canadian box lacrosse and over the last 30 years Albertan teams have brought
          home five national championships. The following pages chronicle the history of lacrosse in this province - from
          the earliest pickup games in the 1880s to the modern RMLL and professional NLL franchises.
        </p>
        <p className="text-xs text-gray-500 mt-3 italic">
          Content referenced from the Outsider's Guide to the NLL, the Canadian Lacrosse Almanac by David Stewart-Candy,
          and the Canadian Lacrosse Association.
        </p>
      </div>

      {/* --- 1. LACROSSE IN ALBERTA --- */}
      <CollapsibleSection
        title="The History of Lacrosse in Alberta"
        icon={<Landmark className="w-5 h-5 text-white" />}
        defaultOpen={true}
        accentColor="#013fac"
      >
        <Prose>
          <p>
            Alberta has a rich history of lacrosse without many people even knowing it. In fact as part of the September
            1st, 1905 Inauguration Celebrations as Alberta joined Canada, lacrosse (among other sports) was played to
            entertain the masses in Edmonton. One of our finest moments saw the Calgary Chinooks winning the Mann Cup for
            being the Senior Lacrosse Champions of Canada way back in 1914. In truth, teams from Alberta have challenged
            for all 4 major trophies in Canadian box lacrosse and over the last 30 years Albertan teams have brought home
            five national championships.
          </p>
          <p>
            Lacrosse was in Alberta even before the turn of the 20th century. In 1882 lacrosse equipment was available in
            Edmonton, and several pickup games were played there during the summer. The following March, the Edmonton
            Lacrosse Club was organized but, because of a lack of competition, it disbanded in 1885. The Calgary Lacrosse
            Club was organized in 1884 with Captain Boynton serving as the club's first president. The club's membership
            swelled to thirty, with games among the club members being held periodically on weekends and, on several
            occasions, competitions took place between the citizens and the police.
          </p>
          <p>
            After lagging interest, the Calgary Lacrosse Club was re-organized in 1887. Mr. Boag, a teacher who was to
            be elected as the club's president, organized a lacrosse meeting at the school house. A practice ground was
            secured on the prairie south of the railway tracks. Mr. Boag introduced the game to some of the older
            students in the school. The Calgary Lacrosse Club operated in a local manner for several years.
          </p>
          <p>
            Once the interest in the field game subsided and the interest of the box game grew. Teams sprung up from all
            over the province to battle for the provincial title until interest disappeared. Following the Second World
            War there is little recorded history dealing with lacrosse in Alberta. The teams likely didn't vanish - just,
            compared to world events, didn't draw much attention at the time.
          </p>
        </Prose>
      </CollapsibleSection>

      {/* --- 2. HISTORY OF THE RMLL --- */}
      <CollapsibleSection
        title="The History of the RMLL"
        icon={<Shield className="w-5 h-5 text-white" />}
        defaultOpen={true}
        accentColor="#b91c1c"
      >
        <Prose>
          <p>
            League play in this province has developed in many forms over the years and details are spotty at best. The
            Rocky Mountain Lacrosse League in its current form is a growing league with a bright future in the Sr. B
            ranks. As for its own origins, the RMLL in its current form dates to a 1998 introduction to Alberta lacrosse.
          </p>
        </Prose>

        {/* Sr. B Champions */}
        <h4 className="font-bold text-gray-900 mt-6 mb-2 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-600" /> Sr. B Champions
        </h4>
        <ChampionshipList
          items={[
            { year: '2002', detail: 'Edmonton Outlaws defeated the Calgary Mountaineers 3 games to none' },
            { year: '2001', detail: 'Edmonton Outlaws' },
            { year: '2000', detail: 'Calgary Mountaineers' },
            { year: '1999', detail: 'Edmonton Outlaws' },
          ]}
        />

        {/* Jr. B Champions */}
        <h4 className="font-bold text-gray-900 mt-6 mb-2 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-600" /> Jr. B Champions
        </h4>
        <ChampionshipList
          items={[
            { year: '2002', detail: 'Edmonton Miners defeated the Edmonton Warriors 3 games to 0' },
            { year: '2001', detail: 'Edmonton Miners defeated the Calgary Jr. Mountaineers 4 games to 3' },
            { year: '2000', detail: 'Calgary Jr. Mountaineers defeated the Edmonton Miners 2 games to 1' },
            { year: '1999', detail: 'Edmonton Miners' },
            { year: '1998', detail: 'Edmonton Miners' },
            { year: '1997', detail: 'Edmonton Miners' },
            { year: '1996', detail: 'Edmonton Miners' },
            { year: '1995', detail: 'Edmonton Miners' },
          ]}
        />

        {/* Tier II Champions */}
        <h4 className="font-bold text-gray-900 mt-6 mb-2 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-600" /> Tier II Champions
        </h4>
        <ChampionshipList
          items={[
            { year: '2002', detail: 'Sherwood Park Titans' },
            { year: '2001', detail: 'Edmonton Warriors' },
            { year: '2000', detail: 'Edmonton Warriors' },
          ]}
        />

        {/* Year by Year Standings */}
        <h4 className="font-bold text-gray-900 mt-8 mb-3 text-base sm:text-lg border-b border-gray-200 pb-2">
          Year by Year Standings
        </h4>

        <h5 className="font-bold text-[#013fac] mt-4 mb-1 text-sm uppercase tracking-wide">Senior Teams</h5>

        <StandingsTable
          title="2002 Senior"
          headers={['Team', 'GP', 'W', 'L', 'T', 'Pts', 'GF', 'GA', 'Stk.']}
          rows={[
            ['Edmonton Outlaws', '20', '17', '1', '2', '36', '249', '113', '1L'],
            ['Calgary Mountaineers', '20', '14', '3', '3', '31', '209', '146', '3W'],
            ['Red Deer Rage', '20', '9', '10', '1', '19', '184', '180', '5W'],
            ['Calgary Knights', '20', '2', '17', '1', '5', '126', '245', '5L'],
          ]}
        />

        <StandingsTable
          title="2001 Senior"
          headers={['Team', 'GP', 'W', 'L', 'T', 'Pts', 'GF', 'GA']}
          rows={[
            ['Edmonton Outlaws', '17', '15', '0', '2', '32', '219', '107'],
            ['Calgary Mountaineers', '16', '11', '3', '2', '24', '138', '103'],
            ['*Edmonton Jr. Miners', '17', '8', '7', '2', '18', '151', '132'],
            ['Red Deer Rage', '17', '7', '9', '1', '15', '158', '174'],
            ['*Cgy Jr. Mountaineers', '16', '4', '11', '1', '9', '112', '171'],
            ['Calgary Knights', '17', '0', '15', '2', '2', '72', '164'],
          ]}
          note="* Junior teams were listed in standings with the Senior teams."
        />

        <StandingsTable
          title="1999 Senior"
          headers={['Team']}
          rows={[
            ['Edmonton Outlaws'],
            ['Calgary Knights'],
            ['Calgary Mountaineers'],
            ['*Edmonton Jr. Miners'],
            ['*Cgy Jr. Mountaineers'],
          ]}
          note="* Junior teams were listed in standings with the Senior teams."
        />

        <StandingsTable
          title="1998 Senior"
          headers={['Team']}
          rows={[
            ['Edmonton Outlaws'],
            ['Calgary Mountaineers'],
            ['*Edmonton Jr. Miners'],
            ['*Cgy Jr. Mountaineers'],
          ]}
          note="* Junior teams were listed in standings with the Senior teams."
        />

        <h5 className="font-bold text-[#013fac] mt-6 mb-1 text-sm uppercase tracking-wide">Junior Teams</h5>

        <StandingsTable
          title="2002 Junior"
          headers={['Team', 'GP', 'W', 'L', 'T', 'Pts', 'GF', 'GA', 'Stk.']}
          rows={[
            ['Edmonton Miners', '20', '14', '6', '0', '28', '205', '164', '1L'],
            ['Edmonton Warriors', '20', '8', '11', '1', '17', '160', '185', '2W'],
            ['Calgary Shamrocks', '20', '8', '12', '0', '16', '177', '210', '3L'],
            ['Calgary Warthogs', '20', '3', '15', '2', '8', '172', '247', '1W'],
          ]}
        />

        <h5 className="font-bold text-[#013fac] mt-6 mb-1 text-sm uppercase tracking-wide">Junior Tier II</h5>

        <StandingsTable
          title="2002 Junior Tier II - North Division"
          headers={['Team', 'GP', 'W', 'L', 'T', 'Pts', 'GF', 'GA']}
          rows={[
            ['Titans', '17', '15', '1', '1', '31', '190', '89'],
            ['Rams', '17', '12', '3', '2', '26', '177', '105'],
            ['Renegades', '17', '9', '5', '3', '21', '190', '169'],
            ['Warriors', '17', '6', '9', '2', '14', '165', '159'],
            ['Blues', '17', '1', '15', '1', '3', '101', '208'],
          ]}
        />

        <StandingsTable
          title="2002 Junior Tier II - South Division"
          headers={['Team', 'GP', 'W', 'L', 'T', 'Pts', 'GF', 'GA']}
          rows={[
            ['Mustangs', '17', '11', '4', '2', '24', '161', '128'],
            ['Bandits', '17', '9', '8', '0', '18', '138', '134'],
            ['Chill', '17', '7', '6', '3', '17', '135', '115'],
            ['Rustlers', '17', '5', '10', '2', '12', '116', '178'],
            ['Rockies', '17', '1', '14', '2', '4', '139', '215'],
          ]}
        />

        <StandingsTable
          title="2001 Junior Tier II"
          headers={['Team', 'GP', 'W', 'L', 'T', 'Pts', 'GF', 'GA']}
          rows={[
            ['Warriors', '15', '9', '5', '1', '19', '151', '126'],
            ['Titans', '15', '8', '4', '3', '19', '113', '105'],
            ['Rockies', '15', '8', '7', '0', '16', '147', '129'],
            ['Bandits', '15', '6', '8', '1', '13', '135', '136'],
            ['Rustlers', '15', '5', '7', '3', '13', '120', '163'],
            ['Rams', '15', '4', '9', '2', '10', '129', '140'],
          ]}
        />
      </CollapsibleSection>

      {/* --- 3. PREVIOUS LEAGUES --- */}
      <CollapsibleSection
        title="Previous Lacrosse Leagues in Alberta"
        icon={<History className="w-5 h-5 text-white" />}
        accentColor="#6b21a8"
      >
        <Prose>
          <p>
            In 1979 a junior league in Alberta featured the <strong>Enoch Tomahawks</strong>,{' '}
            <strong>Calgary Clansmen</strong> and <strong>Calgary Mountaineers</strong>.
          </p>
          <p>
            In 1974 there was a junior league in southern Alberta comprised of the <strong>Calgary Irish</strong>,{' '}
            <strong>Calgary Royals</strong>, <strong>Calgary Shamrocks</strong>, <strong>Lethbridge Native</strong>,{' '}
            <strong>Nanton Blazers</strong> and <strong>Taber Ebony Hawks</strong>.
          </p>
        </Prose>
      </CollapsibleSection>

      {/* --- 4. AMATEUR LACROSSE --- */}
      <CollapsibleSection
        title="Amateur Lacrosse in Alberta"
        icon={<Award className="w-5 h-5 text-white" />}
        accentColor="#b45309"
      >
        {/* Founder's Cup */}
        <h4 className="font-bold text-gray-900 mt-2 mb-2 text-base flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-600" /> Challenging for the Founder's Cup
        </h4>
        <Prose>
          <p>
            Competition for the National Championship in the Junior "B" classification was initiated by the Canadian
            Lacrosse Association in September, 1964. A silver cup donated by Castrol Oils Limited served as the winner's
            trophy (1964-1971) but was retired to the Canadian Lacrosse Hall of Fame, New Westminster, B.C. in 1972.
          </p>
          <p>
            In 1972, the C.L.A. inaugurated the Founder's Trophy (1972-Present) as emblematic of the Junior "B"
            Championship of Canada. This beautiful handcrafted unique trophy commemorates the founders of organized
            lacrosse, particularly the contributions of "The Father of Organized Lacrosse", Dr. George W. Beers of
            Montreal, Quebec who wrote the first rulebook and in 1867 was instrumental in organizing the National
            Lacrosse Association, predecessor to the Canadian Lacrosse Association.
          </p>
          <p>
            Alberta has been home to <strong>two Founder's Cup champions</strong> with the most recent in 1999 and last
            hosted the Founder's Cup tournament in 2001.
          </p>
        </Prose>
        <ChampionshipList
          items={[
            { year: '2002', detail: 'Edmonton Miners - Finished third at Founder\'s Cup' },
            { year: '2001', detail: 'Edmonton Miners - Finished second at Founder\'s Cup' },
            { year: '2000', detail: 'Calgary Jr. Mountaineers - Finished fourth at Founder\'s Cup' },
            { year: '1999', detail: 'Edmonton Miners - WON FOUNDER\'S CUP', highlight: true },
            { year: '1998', detail: 'Edmonton Miners' },
            { year: '1997', detail: 'Edmonton Miners' },
            { year: '1996', detail: 'Edmonton Miners - Finished third at Founder\'s Cup' },
            { year: '1995', detail: 'Edmonton Miners - Finished second at Founder\'s Cup' },
            { year: '1983', detail: 'Enoch Tomahawks - Finished second at Founder\'s Cup' },
            { year: '1982', detail: 'Calgary' },
            { year: '1981', detail: 'Calgary' },
            { year: '1980', detail: 'Enoch Tomahawks - WON FOUNDER\'S CUP', highlight: true },
          ]}
        />
        <p className="text-sm text-gray-600 mt-2">
          The 1981 Calgary team that went to the Founder's Cup also represented Alberta at the Canada Games. They
          returned with a 4th place finish.
        </p>

        {/* President's Cup */}
        <h4 className="font-bold text-gray-900 mt-8 mb-2 text-base flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-600" /> Challenging for the President's Cup
        </h4>
        <Prose>
          <p>
            The President's Cup is emblematic of Canadian Champions at the Senior "B" level. It is in honour of the
            Canadian Lacrosse Association President and recognizes the contributions of all Past Presidents of the C.L.A.
            This beautiful silver trophy was donated to the Canadian Lacrosse Association in September 1964 by Mr. K.G.
            Thompson.
          </p>
          <p>
            The original Presidents Cup was retired to the Canadian Lacrosse Hall of Fame in New Westminster, B.C. in the
            early 1980's. The current trophy commemorates the history of leadership of the C.L.A. and lists the
            Presidents of the Association and the Chair of the Board of Directors under the new structure of the C.L.A.
          </p>
          <p>
            Alberta is home to <strong>three President's Cup championship squads</strong> since the inception of the Cup.
            2002 was the first year the Cup tournament was hosted in Alberta.
          </p>
        </Prose>
        <ChampionshipList
          items={[
            { year: '2002', detail: 'Edmonton Outlaws - 4-1 record - WON PRESIDENT\'S CUP', highlight: true },
            { year: '2001', detail: 'Edmonton Outlaws - 1-3 record - finished 5th out of 6' },
            { year: '2000', detail: 'Did not send team' },
            { year: '1999', detail: 'Edmonton Outlaws' },
            { year: '1995', detail: 'Edmonton Miners - finished third' },
            { year: '1994', detail: 'Edmonton Miners' },
            { year: '1993', detail: 'Edmonton Miners - finished second' },
            { year: '1992', detail: 'Edmonton Miners - finished third' },
            { year: '1991', detail: 'Edmonton Miners - finished second' },
            { year: '1990', detail: 'Edmonton Miners - finished second' },
            { year: '1989', detail: 'Edmonton Miners - finished third' },
            { year: '1983', detail: 'Calgary Mountaineers - WON PRESIDENT\'S CUP', highlight: true },
            { year: '1978', detail: 'Sherwood Park Capitals - finished second' },
            { year: '1976', detail: 'Edmonton Fullers - finished second' },
            { year: '1975', detail: 'Edmonton Fullers - WON PRESIDENT\'S CUP', highlight: true },
          ]}
        />

        {/* Alcan Cup */}
        <h4 className="font-bold text-gray-900 mt-8 mb-2 text-base flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-600" /> Challenging for the Alcan Cup
        </h4>
        <Prose>
          <p>
            The Alcan is an interesting trophy. It has been set up to be an invitational tournament hosted by the
            Okanagan Xtreme Lacrosse League. Normally it is attended by teams not going to the President's Cup. Alberta
            last won the Alcan Cup in 2000 when the Calgary Mountaineers brought home the hardware.
          </p>
        </Prose>
        <ChampionshipList
          items={[{ year: '2000', detail: 'Calgary Mountaineers - WON ALCAN CUP', highlight: true }]}
        />

        {/* Minto Cup */}
        <h4 className="font-bold text-gray-900 mt-8 mb-2 text-base flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-600" /> Challenging for the Minto Cup
        </h4>
        <Prose>
          <p>
            The Minto Cup is a beautiful silver cup donated by Lord Minto on May 31, 1901, for competition among the
            lacrosse teams in the Dominion. Lord Minto was Governor General of Canada at the time. The amateur status of
            the competition continued until 1904.
          </p>
          <p>
            The cup was placed under control of trustees and in possession of C.A. Welsh, of New Westminster, B.C., the
            last surviving trustee. When he died, the present Lord Minto of England, whose father donated the cup, was
            informed of the circumstances. He officially transferred the Minto Cup to the care and management of the
            Canadian Lacrosse Association, who placed it into competition for the Junior Championship of Canada.
          </p>
          <p>
            The Duke and Duchess of York (later King George V and Queen Mary) were present at the first game played for
            the Minto Cup between the Capitals of Ottawa and Cornwall in 1901. It continued as a Senior Championship
            until 1934. When the Minto Cup was originally placed into Junior competition in 1937, All-Star teams were
            built around Provincial Championship teams. This practice was soon discontinued and in 1960 the trophy became
            emblematic of the Canadian Junior "A" Championship.
          </p>
          <p>
            In 1979 Alberta sent a team that has been referred to in different publications by three names. The Alberta
            All-Stars, Alberta Tomahawks or Edmonton Tomahawks were composed of primarily Edmonton based players with a
            few Calgary Mountaineers and Calgary Clansmen added to the team for depth. Instead of the familiar best of
            seven series format that we are accustomed to today the Minto Cup was made into a round robin tournament
            followed by a single game final. The bulk of this team went on to form the Enoch Tomahawks that won the
            Founder's Cup the following season.
          </p>
        </Prose>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 my-4">
          <h5 className="font-bold text-gray-800 text-sm mb-2">1979 Minto Cup - Round-Robin Scores</h5>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>Peterborough defeated Alberta 8-5</li>
            <li>Peterborough defeated Burnaby 11-7</li>
            <li>Burnaby defeated Alberta 18-7</li>
            <li>Peterborough defeated Alberta 11-5</li>
            <li>Burnaby defeated Peterborough 10-4</li>
            <li className="font-bold text-green-700">Alberta defeated Burnaby 14-10</li>
          </ul>
          <h5 className="font-bold text-gray-800 text-sm mt-3 mb-1">Championship (Single Game)</h5>
          <p className="text-sm text-gray-700">Burnaby 8, Peterborough 6</p>
        </div>

        {/* Mann Cup */}
        <h4 className="font-bold text-gray-900 mt-8 mb-2 text-base flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-600" /> Challenging for the Mann Cup
        </h4>
        <Prose>
          <p>
            In previous years there was more to the Mann Cup championships than the current East-West set up. Before the
            current system came into play, the host team, from British Columbia or Ontario, went straight to the Mann Cup
            while the opposition teams went through the Dominion Playoffs. The leagues of Alberta, Manitoba, Quebec and
            one of BC or Ontario would send their champions to the Dominion Playoffs for the chance to reach the Mann
            Cup. The last recorded Alberta based squad to reach the Dominion Playoffs was the Medicine Hat Badmen in 1939
            when they faced off against the St. Catherine's Athletics and lost 32-8.
          </p>
          <p>
            The Mann Cup was presented by the late Sir Donald Mann, builder of the Canadian Northern Railway, for the
            Senior Amateur Championship of Canada and was originally a challenge cup. It is a gold cup valued at $25,000
            and is one of the most valuable trophies in sport.
          </p>
          <p>
            In September, 1925, when the Canadian Lacrosse Association was organized and uniform rules adopted for all
            competing teams, the Mann Cup was turned over to the C.L.A. by the New Westminster Club who held the trophy
            at that time. It was then placed into annual competition, with the series alternating from east to west.
          </p>
          <p>
            Alberta's lone Mann Cup win came on the heels of a protest surrounding a Vancouver player and the questioning
            of if he was given funds to play that series with the Vancouver club.
          </p>
        </Prose>
        <ChampionshipList
          items={[
            { year: '1939', detail: 'Medicine Hat Badmen - lost in Dominion Playoffs - 32-8 to St. Catherine\'s' },
            { year: '1938', detail: 'Medicine Hat Badmen - lost Western Final - 25-8 to New West. Adanacs' },
            { year: '1937', detail: 'Calgary Rangers - lost in Dominion Playoffs - 28-8 to Orillia' },
            { year: '1936', detail: 'Calgary Pontiacs - lost in Dominion Playoffs - 19-5 to North Shore' },
            { year: '1934', detail: 'Calgary Shamrocks - lost Western Semi-Final by default to Winnipeg' },
            { year: '1933', detail: 'Calgary Shamrocks - lost in Dominion Playoffs - 15-4 to Hamilton' },
            {
              year: '1932',
              detail:
                'Calgary Shamrocks - lost Western Semi-Final - two game total goal series 32-11 to North Vancouver (17-6; 15-5)',
            },
            { year: '1931', detail: 'Calgary All-Stars - lost in Dominion Playoffs - 8-5 to Brampton' },
            { year: '1930', detail: 'Edmonton Native Sons - lost in Dominion Playoffs - 17-0 to New West.' },
            { year: '1929', detail: 'Edmonton Native Sons - lost in Dominion Playoffs - 14-1 to Oshawa' },
            { year: '1928', detail: 'Edmonton Native Sons - lost in Dominion Playoffs - 13-1 to Winnipeg' },
            { year: '1927', detail: 'Edmonton Native Sons - lost in Dominion Playoffs - 13-3 to Toronto' },
            {
              year: '1919',
              detail:
                'Edmonton Eskimos - made Mann Cup round robin - defeated Lawson 13-3, lost two game series to Victoria 28-5 (19-4; 9-1)',
            },
            {
              year: '1914',
              detail:
                'Calgary Chinooks - AWARDED MANN CUP - A disputed Mann Cup Playoffs regarding a Vancouver player; the Mann Cup Trustees awarded the Cup to Calgary',
              highlight: true,
            },
          ]}
        />

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 my-4">
          <h5 className="font-bold text-gray-800 text-sm mb-2">Inter-League Exhibitions of Note</h5>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>1908 - New Westminster Salmonbellies defeated Calgary 6-2</li>
            <li>1906 - Vancouver Maple Leafs defeated Calgary Strathcona 15-4</li>
          </ul>
        </div>

        <p className="text-xs text-gray-500 italic mt-3">
          Information sources: Canadian Lacrosse Almanac by David Stewart-Candy, 2002 Vancouver; Canadian Lacrosse
          Association website.
        </p>
      </CollapsibleSection>

      {/* --- 5. PROFESSIONAL LACROSSE --- */}
      <CollapsibleSection
        title="Professional Lacrosse in Alberta"
        icon={<Star className="w-5 h-5 text-white" />}
        accentColor="#dc2626"
      >
        {/* Calgary Roughnecks */}
        <h4 className="font-bold text-gray-900 mt-2 mb-2 text-base flex items-center gap-2">
          <Shield className="w-4 h-4 text-red-600" /> Calgary Roughnecks
        </h4>
        <Prose>
          <p>
            The first truly professional lacrosse team in Alberta is the Calgary Roughnecks of the National Lacrosse
            League. They entered the NLL during the 2001-2002 season as an expansion franchise. At the halfway mark of
            their initial season they had managed a 4-4 record with a couple of tight games but ultimately fell off the
            pace in the second half and hit a streak with 9 losses in a row to finish at 4-12. Two of those losses came
            in overtime while another saw the game winning goal scored with a mere 19 seconds remaining.
          </p>
          <p>
            In 2004, the Roughnecks won the League Championship and Champion's Cup. The Calgary Roughnecks have made
            playoffs every season since 2004.
          </p>
        </Prose>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 my-4">
          <h5 className="font-bold text-gray-800 text-sm mb-3">Roughnecks Firsts</h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-gray-700">
            <div><span className="font-semibold text-gray-900">First Roughneck:</span> Jason Wulder</div>
            <div><span className="font-semibold text-gray-900">First Goal:</span> John Kilbride, Nov. 24, 2001 vs. Montreal</div>
            <div><span className="font-semibold text-gray-900">First PP Goal:</span> John Kilbride, Nov. 24, 2001 vs. Montreal</div>
            <div><span className="font-semibold text-gray-900">First SH Goal:</span> Kaleb Toth, Nov. 29, 2001 @ Montreal</div>
            <div><span className="font-semibold text-gray-900">First Home Goal:</span> John Kilbride, Nov. 24, 2001 vs. Montreal</div>
            <div><span className="font-semibold text-gray-900">First Road Goal:</span> Jason Wulder, Nov. 29, 2001 @ Montreal</div>
            <div><span className="font-semibold text-gray-900">First Starting Goalie:</span> Derek Collins, Nov. 24, 2001 vs. Montreal</div>
            <div><span className="font-semibold text-gray-900">First Goaltender Win:</span> Matt King, Dec. 2, 2001 @ Ottawa</div>
          </div>
          <div className="border-t border-gray-200 mt-3 pt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-gray-700">
            <div><span className="font-semibold text-gray-900">First Team Win:</span> 17-11 @ Ottawa, Dec. 2, 2001</div>
            <div><span className="font-semibold text-gray-900">First Home Win:</span> 20-13 vs. Columbus, Dec. 14, 2001</div>
            <div><span className="font-semibold text-gray-900">First Road Win:</span> 17-11 @ Ottawa, Dec. 2, 2001</div>
            <div><span className="font-semibold text-gray-900">First OT Win:</span> 14-13 @ New Jersey, Dec. 28, 2001</div>
          </div>
        </div>

        <StandingsTable
          title="Calgary Roughnecks Season Records"
          headers={['Year', 'W', 'L', 'GF', 'GA']}
          rows={[
            ['2001', '4', '12', '224', '264'],
            ['2002', '6', '3', '116', '111'],
            ['2005', '10', '6', '216', '208'],
            ['2006', '9', '7', '183', '178'],
            ['2007', '9', '7', '-', '-'],
            ['2008', '7', '9', '183', '178'],
            ['2009', '12', '4', '206', '167'],
          ]}
        />

        {/* Edmonton Rush */}
        <h4 className="font-bold text-gray-900 mt-8 mb-2 text-base flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-600" /> Edmonton Rush
        </h4>
        <Prose>
          <p>
            The Edmonton Rush's first season in the National Lacrosse League was in 2006. The Rush became Alberta's
            second professional lacrosse team. They finished with a final record of 1-15 in their first season of play,
            finishing last in the Western Division out of playoffs.
          </p>
        </Prose>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 my-4">
          <h5 className="font-bold text-gray-800 text-sm mb-3">Rush Firsts</h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-gray-700">
            <div><span className="font-semibold text-gray-900">First Goal:</span> Jamey Bowen, Jan. 6, 2006 vs. San Jose</div>
            <div><span className="font-semibold text-gray-900">First PP Goal:</span> Tyler Heavenor, Jan. 6, 2006 vs. San Jose</div>
            <div><span className="font-semibold text-gray-900">First SH Goal:</span> Chris Stachniak, Jan. 21, 2006 vs. Calgary</div>
            <div><span className="font-semibold text-gray-900">First Home Goal:</span> Jamey Bowen, Jan. 6, 2006 vs. San Jose</div>
            <div><span className="font-semibold text-gray-900">First Road Goal:</span> Jordan Cornfield, Jan. 13, 2006 @ Calgary</div>
            <div><span className="font-semibold text-gray-900">First Starting Goalie:</span> Pat Campbell, Jan. 6, 2006 vs. San Jose</div>
            <div><span className="font-semibold text-gray-900">First Goaltender Win:</span> Pat Campbell, Feb. 17, 2006 @ Calgary</div>
          </div>
          <div className="border-t border-gray-200 mt-3 pt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-gray-700">
            <div><span className="font-semibold text-gray-900">First Team Win:</span> 12-11 @ Calgary, Feb. 17, 2006</div>
            <div><span className="font-semibold text-gray-900">First Home Win:</span> 13-12 vs. Philadelphia, Jan. 6, 2007</div>
            <div><span className="font-semibold text-gray-900">First Road Win:</span> 12-11 @ Calgary, Feb. 17, 2006</div>
            <div><span className="font-semibold text-gray-900">First OT Win:</span> 9-8 vs. Portland, Feb. 23, 2007</div>
          </div>
        </div>

        <StandingsTable
          title="Edmonton Rush Season Records"
          headers={['Year', 'W', 'L', 'GF', 'GA']}
          rows={[
            ['2006', '1', '15', '150', '202'],
            ['2007', '6', '10', '-', '-'],
            ['2008', '4', '12', '141', '197'],
            ['2009', '5', '11', '159', '200'],
          ]}
        />

        <p className="text-xs text-gray-500 italic mt-3">Information from www.nll.com</p>
      </CollapsibleSection>

      {/* Attribution */}
      <div className="bg-gradient-to-r from-[#0F2942] to-[#1a3a5c] text-white rounded-lg p-6 sm:p-8 shadow-lg">
        <h3 className="text-lg sm:text-xl font-bold mb-3">Sources & Acknowledgements</h3>
        <div className="text-sm text-blue-100 leading-relaxed space-y-2">
          <p>
            The historical content on this page is referenced from the <em>Outsider's Guide to the NLL</em>, the{' '}
            <em>Canadian Lacrosse Almanac</em> by David Stewart-Candy (2002, Vancouver), and the Canadian Lacrosse
            Association website.
          </p>
          <p>
            The Rocky Mountain Lacrosse League is grateful to the historians and volunteers who have worked to preserve
            the record of lacrosse in Alberta - from the earliest days of the Calgary and Edmonton Lacrosse Clubs in the
            1880s to the modern era of professional and amateur competition.
          </p>
        </div>
      </div>
    </div>
  );
}

function Users2() {
  return null; // placeholder removed
}
