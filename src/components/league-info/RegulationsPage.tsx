import { useState } from 'react';
import { Scale, ChevronDown, ChevronRight, BookOpen, List } from 'lucide-react';

function Section({ id, title, children, open, onToggle }: { id: string; title: string; children: React.ReactNode; open: boolean; onToggle: () => void }) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm" id={`reg-${id}`}>
      <button onClick={onToggle} className="w-full flex items-center gap-3 px-4 sm:px-5 py-3 bg-white hover:bg-gray-50 transition-colors text-left">
        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded bg-[#013fac] text-white text-xs font-bold shrink-0">{id}</span>
        <span className="flex-1 font-bold text-gray-900 text-sm sm:text-base">{title}</span>
        {open ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />}
      </button>
      {open && <div className="px-4 sm:px-5 pb-5 pt-2 bg-white border-t border-gray-100 text-sm text-gray-700 leading-relaxed space-y-3">{children}</div>}
    </div>
  );
}

function S({ n, children }: { n: string; children?: React.ReactNode }) {
  return <p><strong className="text-gray-900 font-mono text-xs">{n}</strong> {children}</p>;
}

function GroupHeader({ title, icon }: { title: string; icon?: string }) {
  return (
    <div className="flex items-center gap-2 mt-6 mb-3 first:mt-0">
      <div className="h-0.5 flex-1 bg-gradient-to-r from-[#013fac] to-transparent"></div>
      <h3 className="text-sm font-bold text-[#013fac] uppercase tracking-wider whitespace-nowrap">{title}</h3>
      <div className="h-0.5 flex-1 bg-gradient-to-l from-[#013fac] to-transparent"></div>
    </div>
  );
}

export function RegulationsPage() {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const [showTOC, setShowTOC] = useState(false);

  const toggle = (id: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    const all = new Set<string>();
    for (let i = 1; i <= 50; i++) all.add(String(i));
    for (let i = 1; i <= 11; i++) all.add(`S${i}`);
    setOpenSections(all);
  };

  const collapseAll = () => setOpenSections(new Set());

  const TOC_ITEMS = [
    { id: '1', label: 'General' }, { id: '2', label: 'Playing Divisions' }, { id: '3', label: 'Franchises' },
    { id: '4', label: 'Annual Filings' }, { id: '5', label: 'Fees and Bonds' }, { id: '6', label: 'Facilities' },
    { id: '7', label: 'Emergency Action Plan' }, { id: '8', label: 'Division Play' }, { id: '9', label: 'Season Schedules' },
    { id: '10', label: 'Postponements' }, { id: '11', label: 'Defaults' }, { id: '12', label: 'Uniforms' },
    { id: '13', label: 'Rules of Play' }, { id: '14', label: 'Maintenance of Order' }, { id: '15', label: 'ALRA Official Assignment' },
    { id: '16', label: 'Official Game Fee Payment' }, { id: '17', label: 'ALRA Official Reimbursement' },
    { id: '18', label: 'Game Sheets' }, { id: '19', label: 'Post-Game Referee Evaluation' }, { id: '20', label: 'Statistics' },
    { id: '21', label: 'Bench Personnel and Managers' }, { id: '22', label: 'Rostering Minor Lacrosse Player' },
    { id: '23', label: 'Rostered Players' }, { id: '24', label: 'Player Eligibility' },
    { id: '25', label: 'Franchise Responsibility - Player Eligibility' }, { id: '26', label: 'Player Movement' },
    { id: '27', label: 'Trades' }, { id: '28', label: 'Player Lists' }, { id: '29', label: 'Tampering' },
    { id: '30', label: 'Rosters' }, { id: '31', label: 'Inter-Division Use of Players (Call-ups)' },
    { id: '32', label: 'Division, Franchise and Player Affiliations' },
    { id: '33', label: 'Roster Exception for Jr. B Tier II' }, { id: '34', label: 'Travel Permits' },
    { id: '35', label: 'Exhibition Games' }, { id: '36', label: 'Tournaments' }, { id: '37', label: 'Division Standings' },
    { id: '38', label: 'Playoff, RMLL Championship and Provincial Play' }, { id: '39', label: 'Trophies' },
    { id: '40', label: 'National Competitions' }, { id: '41', label: 'Suspensions and Fines' },
    { id: '42', label: 'Player Suspensions and Fines' }, { id: '43', label: 'Franchise Suspensions and Fines' },
    { id: '44', label: 'Game Protest' }, { id: '45', label: 'Discipline Hearing Process' },
    { id: '46', label: 'Appeal Process' }, { id: '47', label: 'Expenses' }, { id: '48', label: 'Social Media' },
    { id: '49', label: 'Privacy of Personal Information' }, { id: '50', label: 'Electronic Voting' },
  ];

  const SCHEDULE_ITEMS = [
    { id: 'S1', label: 'LC, ALA, RMLL Calendar - Due Dates' }, { id: 'S2', label: 'New Franchise Certificate Request' },
    { id: 'S3', label: 'Division Tier Change Request' }, { id: 'S4', label: 'Franchise Transfer Request' },
    { id: 'S5', label: 'Franchise Certificate' }, { id: 'S6', label: 'Home Facility Specifications' },
    { id: 'S7', label: 'Senior B Drafts and Protected Lists' }, { id: 'S8', label: 'Junior A Drafts and Protected Lists' },
    { id: 'S9', label: 'Junior B Tier I Drafts and Protected List' },
    { id: 'S10', label: 'Junior Major Female Draft and Protected Lists' },
    { id: 'S11', label: 'RMLL Modified Rules of Play (2024)' },
  ];

  const isOpen = (id: string) => openSections.has(id);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#013fac]/5 via-white to-red-50 border-2 border-[#013fac]/20 rounded-lg p-6 sm:p-8">
        <div className="flex items-start gap-4 mb-4">
          <div className="p-3 bg-[#013fac] rounded-lg shadow-md"><Scale className="w-6 h-6 text-white" /></div>
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">RMLL Regulations</h2>
            <div className="h-1 w-20 bg-[#013fac] rounded"></div>
          </div>
        </div>
        <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
          Rocky Mountain Lacrosse League — Alberta Amateur Major Lacrosse Regulations. These regulations govern playing divisions, franchises, fees, facilities, player eligibility, rosters, trades, playoffs, discipline, and all operational aspects of the RMLL.
        </p>
        <p className="text-xs text-gray-500 mt-2 italic">Revised — December 1, 2024</p>
        <div className="flex flex-wrap gap-2 mt-4">
          <button onClick={() => setShowTOC(!showTOC)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded border-2 border-[#013fac] text-[#013fac] hover:bg-[#013fac] hover:text-white transition-colors">
            <List className="w-3.5 h-3.5" />{showTOC ? 'Hide' : 'Show'} Table of Contents
          </button>
          <button onClick={expandAll} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded border-2 border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors">
            <BookOpen className="w-3.5 h-3.5" />Expand All
          </button>
          <button onClick={collapseAll} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded border-2 border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors">
            Collapse All
          </button>
        </div>
      </div>

      {/* Table of Contents */}
      {showTOC && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-3">Table of Contents</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0.5 text-xs">
            {TOC_ITEMS.map(item => (
              <a key={item.id} href={`#reg-${item.id}`} onClick={() => { toggle(item.id); setShowTOC(false); }}
                className="text-[#013fac] hover:underline py-0.5">
                <span className="font-mono font-bold mr-1">{item.id}.</span> {item.label}
              </a>
            ))}
          </div>
          <h4 className="font-bold text-gray-900 mt-4 mb-2 text-sm">Schedules</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0.5 text-xs">
            {SCHEDULE_ITEMS.map(item => (
              <a key={item.id} href={`#reg-${item.id}`} onClick={() => { toggle(item.id); setShowTOC(false); }}
                className="text-[#013fac] hover:underline py-0.5">
                <span className="font-mono font-bold mr-1">{item.id.replace('S','Sch. ')}.</span> {item.label}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ═══ GENERAL & STRUCTURE ═══ */}
      <GroupHeader title="General & Structure" />

      <Section id="1" title="General" open={isOpen('1')} onToggle={() => toggle('1')}>
        <S n="1.1">The Regulations of the RMLL are subject to the Bylaws, Regulations, and Policies imposed by Lacrosse Canada ("LC") and the Alberta Lacrosse Association ("ALA"). Where a conflict arises between these Regulations and the Bylaws, Regulations, and Policies of the ALA or LC, the ALA or LC rules will govern.</S>
        <S n="1.2">Each RMLL primary contact, secondary contact, coach, manager, and trainer, as an official of the Franchise, is responsible for reading, understanding, and the proper observance of the RMLL Bylaws and Regulations as well as LC and ALA Bylaws, Regulations, and Policies.</S>
        <S n="1.3">RMLL Regulations are the general rules which govern all the Divisions within the RMLL.</S>
        <S n="1.3.1">These Regulations of the RMLL shall not be amended except as described within the Bylaws of the RMLL.</S>
        <S n="1.3.2">Each Member shall be entitled to a copy of the Regulations of the RMLL as published by the RMLL from time to time.</S>
        <S n="1.4">A Division Operating Policy, ratified annually by the RMLL Executive, may have further additions to and/or establish certain rules within the jurisdiction and sanction of the RMLL Mission Statement, Bylaws, and Regulations.</S>
        <S n="1.4.1">A Division Operating Policy shall only include the additional regulations specific to the Division and shall not include regulations stated elsewhere.</S>
        <S n="1.4.2">A Division Operating Policy shall not be amended except as described within the Bylaws of the RMLL.</S>
        <S n="1.4.3">If a conflict arises between a Division Operating Policy and these Regulations, these Regulations will govern.</S>
        <S n="1.5">Any Division may elect an Assistant Commissioner by a majority vote of the Franchises in their Division to be put forward for ratification to the RMLL Executive.</S>
        <S n="1.5.1">The term of the Assistant Commissioner shall be from the date of their ratification by the RMLL Executive until the next succeeding annual division planning meeting of the Division.</S>
        <S n="1.5.2">The function of the Assistant Commissioner shall be to assist the Commissioner of the Division which such administrative and other functions as determined by the Commissioner, provided same does not conflict with those functions assigned to the Commissioner pursuant to the provisions of Section 7.05.3 of the Bylaws of the RMLL.</S>
      </Section>

      <Section id="2" title="Playing Divisions" open={isOpen('2')} onToggle={() => toggle('2')}>
        <S n="2.1">The RMLL governs the following playing Divisions: Senior A (when established), Senior B, Senior C, Junior A, Junior B Tier I, Junior B Tier II, Junior B Tier III, Senior Major Female and Junior Major Female.</S>
        <S n="2.2">The RMLL, through the Executive, reserves to itself the right to move a Franchise from one Division to another if the Executive deems to be in the best interest of the lacrosse.</S>
        <S n="2.3">An RMLL Division with more than five (5) Franchises may establish sub-divisions of no less than three (3) Franchises in each sub-division.</S>
        <S n="2.4">A RMLL Division may play Regular Season interlock games with another RMLL Division with the approval of each of the affected Divisions and the RMLL Executive.</S>
      </Section>

      <Section id="3" title="Franchises" open={isOpen('3')} onToggle={() => toggle('3')}>
        <S n="3.1">A Franchise is a group of persons comprised of not less than twenty (20) players with at least one Coach, all of whom are registered with the RMLL. At the discretion of the Division Commissioner, the minimum of 20 players may be waived. Each Franchise accepted by the RMLL Executive shall be entitled to a Franchise Certificate certifying the Franchise Holder holds a Franchise in the RMLL.</S>
        <S n="3.2">To apply for a Franchise Certificate or to request a Franchise Certificate reinstatement, the potential Franchise Holder must submit a completed "New Franchise Certificate Request" signed by the duly authorized Officers of the registered body corporate to the RMLL Executive Director as per the annual deadline. See Schedule 2.</S>
        <S n="3.3">To request a transfer to another RMLL Division for the upcoming season the Franchise Holder must submit a completed "Division Tier Change Request" signed by a duly authorized Officer to the RMLL Executive Director as per the annual deadline. See Schedule 3.</S>
        <S n="3.4">Each Franchise Holder must complete on an annual basis a Franchise Certificate in the RMLL Franchise Management System by the annual deadline.</S>
        <S n="3.4.1">The Franchise Certificate contacts include but are not limited to the Board of Directors and/or Officers/Executive, primary Franchise contact, secondary Franchise contact, financial contact, scheduling contact, Franchise registrar, manager, head coach, assistant coaches, and trainers.</S>
        <S n="3.4.2">Name, mailing address, home number or cell number, and e-mail address are required for each contact. In addition, the NCCP number is required for both Head and Assistant Coaches.</S>
        <S n="3.5">A duly authorized Officer of the Franchise Holder must complete and sign the Franchise Certificate Form and return it to the RMLL Executive Director. See Schedule 5.</S>
        <S n="3.6">The Primary or the Secondary Contact holds the one vote for the Franchise and one person may not represent more than one RMLL Franchise as a Primary Contact.</S>
        <S n="3.7">The Franchise may be sold or transferred subject to the approval of the majority of the teams of that Division and the RMLL Executive.</S>
        <S n="3.7.1">Application for approval of a Franchise transfer must be submitted in writing to the RMLL Executive Director prior to November 1 of the past playing Season. See Schedule 4.</S>
        <S n="3.8">The approval process for a transfer of a RMLL Franchise requires minutes of each body approving the transfer, filing of the contract or agreement, and the proposed Franchise transferee becomes a member of a member association of the LC.</S>
        <S n="3.9">A Franchise Holder will continue to hold the Franchise Certificate unless: the member association of the LC does not approve its application; the Franchise is expelled by the RMLL Executive; or the Franchise Holder submits written notification relinquishing their Franchise Certificate.</S>
      </Section>

      <Section id="4" title="Annual Filings" open={isOpen('4')} onToggle={() => toggle('4')}>
        <S n="4.1">Each Franchise Holder must file with the RMLL Executive Director on an annual basis proof of filings of their annual return and Schedule 5.</S>
      </Section>

      {/* ═══ FINANCIAL ═══ */}
      <GroupHeader title="Financial" />

      <Section id="5" title="Fees and Bonds" open={isOpen('5')} onToggle={() => toggle('5')}>
        <S n="5.1">An application for a new Franchise Certificate, a Tier Change request and a Franchise Transfer request must include a refundable application bond of $1,500.00.</S>
        <S n="5.1.1">The bond will be held by the RMLL for a probationary period the later of twenty-four (24) months or two (2) playing seasons. At the end of the probationary period the entire bond will be refunded if the Franchise has not defaulted a game and has no money owing to the RMLL.</S>
        <S n="5.2">The annual Franchise Fee of $950.00 and a $200.00 contingency fund is payable by March 1. Failure to pay fees when due may result in a Franchise being denied the ability to participate in all sanctioned RMLL activities.</S>
        <S n="5.3">For New Franchise Requests, the Franchise Fee must accompany the submission request and will not be refunded if the Franchise is withdrawn after a Franchise Certificate has been granted.</S>
        <S n="5.4">The annual Franchise Fee for a Franchise holding an existing Franchise will not be refunded if a team withdraws after February 1.</S>
        <S n="5.5">Each Franchise Holder is required to submit a performance bond of $2,000.00 with the Franchise request.</S>
        <S n="5.5.1">If a Franchise Holder voluntarily withdraws between September 1 and December 31, the performance bond will be refunded if the Franchise has no money owing to the RMLL.</S>
        <S n="5.5.2">If a Franchise Holder withdraws between February 1 and prior to the end of the current playing Season, the performance bond will not be refunded.</S>
        <S n="5.6">Interest earned on bond monies shall become revenue of the RMLL and be allocated to general funds.</S>
        <S n="5.7">The RMLL will invoice each Franchise Holder in a Division qualifying for Provincials the ALA Provincial Entry Fee as set annually by the ALA.</S>
        <S n="5.8">Each Franchise in the Senior B Division must submit a Presidents' Cup Travel Fund Levy of $500.00, payable by March 1.</S>
        <S n="5.9">Each Franchise in the Junior A Division will be invoiced $3,000.00 for the Junior A Division Minto Travel Equalization Account payable by March 1.</S>
        <S n="5.10">Each Alberta Franchise in the Junior B Tier I Division must submit a Founders' Cup Travel Fund Levy of $500.00, payable by March 1.</S>
        <S n="5.11">When the Larry Bishop Memorial Cup is a Junior B Tier I playoff format, floor, Referee fees, per diem, travel and accommodation expenses will be split by the number of Franchises in the Division.</S>
        <S n="5.12">Each Alberta Franchise in the Junior B Tier I Division must submit $3,000.00 for the Jr. B Tier I Travel Account, split into two invoices of $1,500.00 each over two years, payable by March 1.</S>
        <S n="5.13">Each Jr. B Tier II Franchise will be invoiced a Playoff Floor and Official Funding Fee of $150.00 and a Playoff/Provincial Travelling Fee of $250.00, both payable by March 1.</S>
        <S n="5.14-5.15">During the Season, a Franchise will be invoiced for Official accommodation and/or Official airfare. At end of Season, each Franchise is invoiced for ALRA Assigning Fee and fees for mileage and per diems. Fee rates are as per ALA Regulations.</S>
        <S n="5.16">All fees shall be paid to: Rocky Mountain Lacrosse League, PO Box 47083 Creekside, Calgary, Alberta, T3P 0B9</S>
        <S n="5.17">All RMLL invoices are due thirty (30) days from invoice date except invoices for fines, Provincial Entry Fees, Official accommodation, Official airfare and RMLL/ALRA End of Season Fees which are due ten (10) days.</S>
        <S n="5.18">Any Franchise which presents an NSF cheque will be fined $50.00.</S>
        <S n="5.19-5.22">Additional fees from other groups are in addition to RMLL fees. All fees and fines go into the RMLL General Account. 90% of casino profits allotted to the RMLL. An annual player registration fee may be established for each Division.</S>
      </Section>

      {/* ═══ FACILITIES & SAFETY ═══ */}
      <GroupHeader title="Facilities & Safety" />

      <Section id="6" title="Facilities" open={isOpen('6')} onToggle={() => toggle('6')}>
        <S n="6.1">Each Franchise is responsible for acquiring their home arena and booking the arena for their home games. The arena must conform to RMLL facility requirements (Schedule 6), have an Official Change Room with a shower, and be approved by the RMLL Executive.</S>
        <S n="6.1.1">Games may not be held in Soccer Centres or Field Houses unless the ALA has approved the facility, the majority of teams in the Division vote in favour, and the RMLL Executive has ratified the use.</S>
        <S n="6.2-6.3">All Franchises must send facility specifications to the RMLL Executive Director and enter their home and back-up arena in the RMLL Franchise Management System prior to January 1.</S>
        <S n="6.4">The home Franchise is responsible for: correct floor line markings, LC approved nets of correct size, good condition black mesh, two LC approved shot clocks, operational score clock with electronic buzzer, and score clock to count down penalty minutes.</S>
        <S n="6.5">The home Franchise shall be held responsible for assuring the playing area is suitable for all games.</S>
        <S n="6.6">No Franchise may change its home game from one arena to another without prior permission of the Division Commissioner.</S>
        <S n="6.7">As per ALA Regulation 6B.03 all facility contracts for Major Lacrosse Provincials must be in the name of Alberta Lacrosse Association unless approved by the ALA Executive Director.</S>
      </Section>

      <Section id="7" title="Emergency Action Plan" open={isOpen('7')} onToggle={() => toggle('7')}>
        <S n="7.1">Every year, each Franchise is required to complete an EAP for their home arena(s). Must be submitted to Division Commissioner and RMLL Executive Director by April 20.</S>
        <S n="7.2">The Division Commissioner will send each Franchise the EAPs for all Franchises in their Division by April 30.</S>
      </Section>

      {/* ═══ SEASON OPERATIONS ═══ */}
      <GroupHeader title="Season Operations" />

      <Section id="8" title="Division Play" open={isOpen('8')} onToggle={() => toggle('8')}>
        <S n="8.1">Regular Season play will commence no earlier than the last weekend of April and no later than the middle of the second week in May and be finished no later than the last week in July.</S>
        <S n="8.2">Division Game Days:</S>
        <div className="ml-4 space-y-1 text-xs">
          <p><strong>Senior B:</strong> Mon, Wed, Fri, Sat, Sun</p>
          <p><strong>Senior C:</strong> Mon, Thu, Fri, Sat, Sun</p>
          <p><strong>Junior A:</strong> Wed, Fri, Sat, Sun</p>
          <p><strong>Tier I:</strong> Tue, Thu, Fri, Sat, Sun</p>
          <p><strong>Tier II:</strong> Mon, Wed, Fri, Sat, Sun</p>
          <p><strong>Senior Major Female:</strong> Mon, Tue, Fri, Sat, Sun</p>
          <p><strong>Junior Major Female:</strong> Mon, Wed, Fri, Sat, Sun</p>
        </div>
        <S n="8.3">Junior A and Junior B Tier I Pre-Season Practice Days — Junior A will not schedule floor times on Tuesday and Thursday and Junior B Tier I will not schedule floor times on Monday and Wednesday for January through April.</S>
        <S n="8.4">Division Playoffs will commence no earlier than five (5) days following the completion of Regular Season play.</S>
        <S n="8.5">ALA Provincials or RMLL Championships will be finished no later than seven (7) days before a scheduled National Championship.</S>
      </Section>

      <Section id="9" title="Season Schedules" open={isOpen('9')} onToggle={() => toggle('9')}>
        <S n="9.1">Off Season/Pre-Season: Each Franchise must complete a Team Event entry in the RMLL Team Management System for all Franchise lacrosse activities held in Alberta during the off season/pre-season.</S>
        <S n="9.2">Regular Season: Each Division must determine scheduling constraints at annual Division Planning Meeting. "In Progress" schedule completed by March 1. Schedules moved to "final" by March 15.</S>
        <S n="9.3">Division Playoffs, RMLL Championships and ALA Provincials: Provincial format confirmed by August 15. Facilities confirmed 5 days prior to start of each round.</S>
        <S n="9.4">All games are to be played as scheduled unless determined otherwise by the Division Commissioner.</S>
        <S n="9.5">If the start of the game is delayed more than thirty (30) minutes, the Officials may determine if the game will or will not be played.</S>
      </Section>

      <Section id="10" title="Postponements" open={isOpen('10')} onToggle={() => toggle('10')}>
        <S n="10.1">No game may be postponed without the approval of the Division Commissioner, otherwise such games will be considered as defaults.</S>
        <S n="10.2">In the event of severe weather, the home Franchise shall immediately call the Division Commissioner to report conditions and request postponement.</S>
        <S n="10.3">If the Visiting Franchise has left for the game, the Home Franchise must pay the Officials both the game rate and mileage/per diem rate. The Visiting Franchise will not be reimbursed for "an act of God".</S>
        <S n="10.4">If rain or other condition makes the playing area unfit after the game has started, the Official may stop the game; if forty minutes have been played, it will constitute a Regular Season game.</S>
        <S n="10.4.1">For Playoff/Provincial games: less than 40 min = rescheduled; more than 40 min with 6+ goal spread = constitutes a game; more than 40 min with less than 6 goal spread = rescheduled with restrictions (same roster, original game doesn't count for suspensions, major infractions valid).</S>
        <S n="10.5-10.6">In the event of a game awarded before completion, scoring records at time of award are official. If conditions make play impossible before 40 minutes, the Official may cancel and the game will be rescheduled.</S>
      </Section>

      <Section id="11" title="Defaults" open={isOpen('11')} onToggle={() => toggle('11')}>
        <S n="11.1.1">A defaulting Franchise shall pay all legitimate expenses. The non-defaulting Franchise shall be awarded two (2) points in standings.</S>
        <S n="11.1.2">A Franchise which defaults a game in a Provincial, RMLL Championship or Playoff series shall be suspended immediately.</S>
        <S n="11.2.1">In the event a Franchise folds after their Division Schedule has been created, in addition to a RMLL fine, the Franchise will be responsible for all costs incurred for creating a revised Division Schedule.</S>
      </Section>

      <Section id="12" title="Uniforms" open={isOpen('12')} onToggle={() => toggle('12')}>
        <S n="12.1">As per LC Rules.</S>
        <S n="12.2">All RMLL Franchises must have home and away uniforms. Home is the dark colour and away is the light colour.</S>
        <S n="12.3">Any Franchise showing up to a game without their proper colour jerseys will be subject to a fine.</S>
      </Section>

      <Section id="13" title="Rules of Play" open={isOpen('13')} onToggle={() => toggle('13')}>
        <S n="13.1">Rules of play in RMLL shall be those of the LC Rule Book, in RMLL Regulations (including Schedule 11), and in the ALA Regulations for the current season.</S>
        <S n="13.2">Overtime — Regular Season: 2-minute rest then 5-minute sudden victory overtime. If still tied, game declared a tie (1 point each). Playoff/Provincial: Continue after 2-minute rest for full 10-minute stop time. If still tied, 10-minute rest then 20-minute periods until sudden victory goal.</S>
        <S n="13.3-13.6">Official Report required for straight time or shortened intermissions. Officials must record bench count. Home Franchise gets delay of game penalty if Off Floor Officials not in place. Water breaks may be allowed on goalie request.</S>
      </Section>

      {/* ═══ GAME OPERATIONS ═══ */}
      <GroupHeader title="Game Operations" />

      <Section id="14" title="Maintenance of Order" open={isOpen('14')} onToggle={() => toggle('14')}>
        <S n="14.1">Home Franchise must supply all Off-Floor Officials (18+ years old, trained, unbiased). ALRA assigns shot clock Official for Playoff/Championship/Provincial games.</S>
        <S n="14.2">Off-Floor Officials are under supervision of On-Floor Officials and must remain neutral.</S>
        <S n="14.3-14.5">Timekeepers in place 15 min prior. Two copies of game sheet to scorekeeper 15 min before. Home Franchise responsible for cleaning blood, water and sweat from playing surface.</S>
        <S n="14.6">Any person under 18 going on the floor during game periods must wear a helmet and facemask.</S>
        <S n="14.7-14.9">Home Franchise responsible for police protection if deemed necessary. Spectator interference may result in game being called off. All persons attending games subject to RMLL rules.</S>
        <S n="14.10">Home Franchise provides 20 warm-up balls to the visiting Franchise.</S>
        <S n="14.11-14.12">Music allowed only during dead ball stoppages. Arena horns only when a goal is scored. Noncompliance results in warning for first offence and $1,000 fine for each additional offence.</S>
      </Section>

      <Section id="15" title="ALRA Official Assignment" open={isOpen('15')} onToggle={() => toggle('15')}>
        <S n="15.1">The Official Assignor will assign Officials with appropriate qualifications and minimize the number of times the same Official officiates the same Franchise.</S>
        <S n="15.2">In Playoffs/Championships/Provincials, the best Officials available will be assigned. Normally a Franchise will not have the same Official crew assigned to each game.</S>
        <S n="15.3-15.5">Shot clock Official must have qualifications to officiate. Officials will not officiate games where a relative is playing or coaching. Travel expenses will be minimized where possible.</S>
      </Section>

      <Section id="16" title="Official Game Fee Payment" open={isOpen('16')} onToggle={() => toggle('16')}>
        <S n="16.1-16.3">All Officials to be paid prior to the start of each game by the Home Franchise. Each Official paid by cheque or cash (exact amount).</S>
        <p className="font-semibold text-gray-900 mt-2">Official Game Fees (per Official):</p>
        <div className="ml-4 space-y-1 text-xs">
          <p>Junior A and Senior B — $85.00</p>
          <p>Senior C and Junior B Tier I — $79.00</p>
          <p>Junior B Tier II, Tier III, Sr. & Jr. Major Female — $73.00</p>
        </div>
        <S n="16.5">NSF cheque: Franchise fined $50.00 plus all bank charges; fine doubles with each additional occurrence.</S>
        <S n="16.6">If Officials not paid before game start, Officials will not proceed and game will be declared a default.</S>
        <S n="16.7">Official "No Show" procedures: If only one Official shows, contact Assignor. If no Officials, contact Assignor and Commissioner. If Visiting Franchise not present, Officials paid and game defaulted.</S>
      </Section>

      <Section id="17" title="ALRA Official Reimbursement" open={isOpen('17')} onToggle={() => toggle('17')}>
        <S n="17.1">Official Driver Mileage — $0.53/km round-trip, first 50 km not paid until round-trip exceeds 50 km.</S>
        <S n="17.2">Official Passenger Mileage — $0.15/km round-trip, first 50 km not paid until round-trip exceeds 50 km.</S>
        <S n="17.3">Official Per Diem — $30.00 when round-trip exceeds 200 km (no overnight). For overnight trips, $70.00/day.</S>
        <S n="17.4">Official Hotel Accommodation — ALRA VP books accommodation; RMLL invoices split between Franchises.</S>
        <S n="17.5">Officials assigned to inter-provincial games submit expense claims for parking, flights, hotel, mileage and per diem.</S>
      </Section>

      <Section id="18" title="Game Sheets" open={isOpen('18')} onToggle={() => toggle('18')}>
        <S n="18.1">Each Franchise receives game sheets at the annual RMLL Planning Meeting and AGM.</S>
        <S n="18.2">Manager responsible for completion. Players listed, including call-ups, cannot exceed 18 runners and 2 goalies.</S>
        <S n="18.3">Call-ups identified with "AP", in-home with "IH", captain with "C", assistant captains with "AC".</S>
        <S n="18.4">All game sheets scanned and e-mailed by noon the day after the game to the RMLL Statistician, Division Commissioner and RMLL Executive Director. Submitting is the home Franchise's responsibility.</S>
      </Section>

      <Section id="19" title="RMLL Post-Game Referee Evaluation Form" open={isOpen('19')} onToggle={() => toggle('19')}>
        <S n="19.1-19.3">Form located on RMLL website. Head Coach from both Franchises must complete after game. Forms submitted with game sheet.</S>
      </Section>

      <Section id="20" title="Statistics" open={isOpen('20')} onToggle={() => toggle('20')}>
        <S n="20.1">Each Home Franchise must enter stats from game sheet for Division home games. Stats not entered for Exhibition Games.</S>
        <S n="20.2-20.4">Franchises not using app must enter box score first. Person entering stats must be set up with "game sheet entry" role. All stats verified by RMLL Statistician.</S>
        <S n="20.5">Game sheet information cannot be changed unless: wrong player credited, additional game misconduct not recorded, too many game misconducts recorded, or penalty recorded doesn't exist.</S>
      </Section>

      {/* ═══ PERSONNEL & PLAYERS ═══ */}
      <GroupHeader title="Personnel & Players" />

      <Section id="21" title="Bench Personnel and Managers" open={isOpen('21')} onToggle={() => toggle('21')}>
        <S n="21.1">Each Franchise must designate one person as Head Coach on their Franchise Certificate and game sheet.</S>
        <S n="21.2">Each Junior and Senior Major Female Franchise must have one female coach registered as Bench Personnel.</S>
        <S n="21.3">All coaches and trainers must comply with LC minimum standard certification requirements.</S>
        <S n="21.5">All Alberta Franchise Bench Personnel and managers must be registered in the RMLL RAMP Intent-to-Play Staff Registration. Opens December 1, closes July 15 – 11:59 PM. Late registration subject to $50.00 ALA fee.</S>
        <S n="21.7">Coaches, Managers, and Trainers must be on their Franchise roster. Only roster coaches and trainers allowed on bench during games.</S>
        <S n="21.8">Player Coaches only allowed in Senior C and Senior Major Female Divisions.</S>
        <S n="21.9">In Senior B, an individual can be both a player and a coach, but cannot be listed as both on the same game sheet.</S>
        <S n="21.10">For Playoff/Championship/Provincial play, only coaches and trainers with LC minimum standards allowed on bench.</S>
      </Section>

      <Section id="22" title="Rostering of a Minor Lacrosse Aged Player in Major" open={isOpen('22')} onToggle={() => toggle('22')}>
        <S n="22.1">No player required to register with a Minor Association shall register with a RMLL Franchise unless there is not a U17 team available (may apply for underage exemption for Junior B Tier II).</S>
        <S n="22.2">Any Minor aged player registered to a RMLL Franchise without approved underage exemption shall result in suspension of the player and the coach.</S>
      </Section>

      <Section id="23" title="Rostered Players" open={isOpen('23')} onToggle={() => toggle('23')}>
        <S n="23.1">The RMLL shall have jurisdiction over all amateur Box players who are a minimum of 17 years of age as of December 31 in the year they wish to compete.</S>
        <S n="23.2">Senior Divisions open to players 22+ years of age. No player under 22 on December 31 shall be on a Senior Franchise roster. Active professional players not eligible to play Senior C.</S>
        <S n="23.3-23.6">Senior B Franchise holds playing rights per 50/40 Player Protected List. Senior C holds rights per previous season final roster until released, traded or not on roster as of May 1.</S>
        <S n="23.7-23.8">Senior Major Female — same rights structure as Senior C.</S>
        <S n="23.9">Junior Divisions open to players under 22 and minimum 17 years of age on December 31. Proof of age by birth certificate or equivalent.</S>
        <S n="23.10">If a player resides outside approved boundaries of all Franchises in a Division, the player is a Free Agent for that Division.</S>
        <S n="23.11">A Junior or Senior player who last played outside Alberta or never played in Alberta is a Free Agent unless on a Protected List.</S>
        <S n="23.12">Each year the ALA provides lists of Female and Male Graduating U17 players. Specific draft eligibility rules apply.</S>
        <S n="23.13-23.16">Junior A — 60/50 Player Protected List. Junior B Tier I — 45/35 Player Protected List (rights held until released, traded, or not on final roster for 2 consecutive seasons).</S>
        <S n="23.17">Junior B Tier II Playing Rights — detailed boundary rules for Wheatland Area, GELC Area, CALL Area, CDLA Area, and SALA Area.</S>
        <S n="23.18">All first-year Junior Eligible players must register with a Junior B Tier II Franchise.</S>
        <S n="23.19-23.21">Junior Major Female — playing rights and Protected Lists for Calgary and surrounding area Franchises (40/35 Player Protected List).</S>
        <S n="23.20">New Junior Players to Non-Drafting Franchises — geographical boundaries defined for St. Albert Drillers, Sherwood Park Titans, Capital Region Saints, and Red Deer Riot.</S>
      </Section>

      <Section id="24" title="Player Eligibility" open={isOpen('24')} onToggle={() => toggle('24')}>
        <S n="24.1">RMLL Intent to Play: All Alberta RMLL players must complete an Intent-to-Play. Opens December 1, closes July 15 11:59 PM. Late registrations not allowed. Link: rmll.rampregistrations.com</S>
        <S n="24.2">To be eligible to play, a player must be listed on the Franchise roster in the RMLL Franchise Management System with all contact information and RAMP Registration Number entered.</S>
        <S n="24.3">A player who last played in a LC Jurisdiction outside Alberta must have a completed LC Transfer on file with the ALA.</S>
      </Section>

      <Section id="25" title="Franchise Responsibility - Player Eligibility Violations" open={isOpen('25')} onToggle={() => toggle('25')}>
        <S n="25.1">Any Franchise playing an ineligible player shall default all games won during which said player was a participant.</S>
        <S n="25.2">Non-defaulting team awarded two (2) points; player stats credited except for the ineligible player.</S>
        <S n="25.3">A Franchise that willfully conceals knowledge of ineligible players shall be considered equally guilty.</S>
      </Section>

      <Section id="26" title="Player Movement" open={isOpen('26')} onToggle={() => toggle('26')}>
        <S n="26.1">The RMLL Executive reserves discretionary powers to disallow any proposed player movement not in the best interests of lacrosse.</S>
        <S n="26.2">A player on a roster shall not play for another Franchise without first being properly released. Release required for lateral moves; not required Feb 1 to day before first game for moves to higher/lower Division.</S>
        <S n="26.3">Release by Primary or Secondary Contact sending e-mail to Division Commissioner and Executive Director.</S>
        <S n="26.4">Once released, a player becomes a Free Agent and property of the RMLL.</S>
        <S n="26.5">Any rostered player who plays more than ten (10) games and is then released cannot register with a lower Division in that year. (Goalies: only games with playing minutes count.)</S>
        <S n="26.6-26.8">Lateral moves require release and Commissioner approval. Players returning to RMLL within 2 years remain property of last Franchise. Players turning out to practice but not playing in more than 1 of first 6 games may appeal for release.</S>
        <S n="26.9">A player refused a release may appeal to Division Commissioner. No appeal from Commissioner's decision.</S>
        <S n="26.10">Close relatives on different Franchises — if Franchises can't agree on trade, submit to final offer arbitration.</S>
        <S n="26.11">If a Franchise ceases to operate, the Division will decide whether to hold a dispersal draft or allow players to become free agents.</S>
      </Section>

      <Section id="27" title="Trades" open={isOpen('27')} onToggle={() => toggle('27')}>
        <S n="27.1">Both Franchises send written acknowledgement to Division Commissioner for approval.</S>
        <S n="27.2">Trade must be approved by Division Commissioner or President in case of conflict of interest.</S>
        <S n="27.3">Draft picks cannot be traded to a Franchise not in the same draft boundary.</S>
        <S n="27.4">A traded player cannot end up back on the original Franchise in the same Season.</S>
        <S n="27.5">"Future Consideration" trades should be avoided. Details must be on file with Executive Director.</S>
        <S n="27.6-27.7">Upon approval, Commissioner forwards trade to Executive Director for posting. Trade must be kept on file.</S>
      </Section>

      <Section id="28" title="Player Lists" open={isOpen('28')} onToggle={() => toggle('28')}>
        <S n="28.1">Entry Draft Lists — Draft process documented in separate schedules. Senior Entry Drafts for aged-out Juniors. Junior Entry Drafts for U17 Graduating players.</S>
        <S n="28.2">LC Negotiation List — Senior B, Junior A, and Junior B Tier I must submit maximum 25 players prior to February 23.</S>
        <S n="28.3">Division Team XX Player Protected Lists — management documented in Schedules 7-10.</S>
        <S n="28.5">Franchise Roster — entered in RMLL Franchise Management System. Maximum players: Jr. A & Tier I = 25; Sr. B & Jr. Major Female = 30; Sr. C & Sr. Major Female = 40; Jr. B Tier II = 25 + 5 Tier III.</S>
        <S n="28.5.4">Must be entered by April 27 (or 4 days before first game if season starts before May 1). Player not registered until Intent-to-Play completed and all mandatory fields entered.</S>
        <S n="28.8">After May 1, a higher-level Franchise may not approach a player from a lower Franchise if it would leave the lower Franchise below 18 players and one goalie.</S>
        <S n="28.9">A player becomes a Free Agent at 12:00 am on May 1 if not listed on any Division Protected List.</S>
      </Section>

      <Section id="29" title="Tampering" open={isOpen('29')} onToggle={() => toggle('29')}>
        <S n="29.1">No Franchise may contact, influence, practice or play in exhibition games, players who do not come under their jurisdiction.</S>
        <S n="29.2">Complaints submitted in writing to Division Commissioner. If determined to have merit, forwarded to Discipline and Appeals Commissioner.</S>
      </Section>

      <Section id="30" title="Rosters" open={isOpen('30')} onToggle={() => toggle('30')}>
        <S n="30.1">Maximum roster sizes: Jr. A & Tier I = 25; Sr. B & Jr. Major Female = 30; Jr. B Tier II = 25 + 5 Tier III; Sr. C & Sr. Major Female = 40.</S>
        <S n="30.3">Unless otherwise agreed, a player shall pay all fees of the team they are rostered to.</S>
        <S n="30.4">Player Signing Dates: Start = February 1 (or when Protected List unfreezes). New Player End = July 1, 11:59 pm. Release Date = July 1, 11:59 pm. Released Player Signing End = July 15, 11:59 pm. Trade Dates = February 1 through July 1, 11:59 pm.</S>
        <S n="30.5">Each Franchise must dress a minimum of eleven (11) players. May still play with 11 or less (LC minimum 6) but may be fined.</S>
        <S n="30.6">Playoff/Provincial Play: Player must participate in 4 Regular Season games to qualify (medical exemptions available). Commissioner signs off on rosters for each series.</S>
      </Section>

      <Section id="31" title="Inter-Division Use of Players (Call-ups)" open={isOpen('31')} onToggle={() => toggle('31')}>
        <S n="31.1">No player rostered in higher Division may be a call-up in a lower Division.</S>
        <S n="31.2">No player on an approved LC Transfer can be a call-up in their first Season (with exceptions).</S>
        <S n="31.3">Maximum of four (4) call-ups per game in Regular Season (except Junior A: unlimited for 2025 Season).</S>
        <S n="31.4">All call-ups must be properly sanctioned, not suspended, rostered to an Alberta team with all permissions obtained.</S>
        <S n="31.6">A Senior B Franchise may not scratch a healthy player in place of a call-up.</S>
        <S n="31.8">A player cannot miss their rostered team's practice or game to attend a higher-level team's practice (with exceptions for Tier II players).</S>
        <S n="31.9">U17 call-ups: May play for Tier I, Tier II, Junior Major Female and Senior Major Female (not Junior A, except goalies). Requires parent approval through head coach chain.</S>
        <S n="31.10">Playoff/Provincial Play: Maximum 4 call-ups per game. Player list cannot exceed 25 (or 26 with third goalie) for Junior/Tier divisions, 30 for Senior. Call-up must have played 4 Regular Season games. Player can only be called up to one Franchise per Division per playoff.</S>
      </Section>

      <Section id="32" title="Division, Franchise and Player Affiliations" open={isOpen('32')} onToggle={() => toggle('32')}>
        <S n="32.1">Allowed Division Affiliations:</S>
        <div className="overflow-x-auto mt-2">
          <table className="text-xs border-collapse w-full">
            <thead><tr className="bg-gray-100"><th className="border border-gray-300 px-2 py-1 text-left">Upper Division</th><th className="border border-gray-300 px-2 py-1 text-left">Call-up From</th></tr></thead>
            <tbody>
              <tr><td className="border border-gray-300 px-2 py-1">Senior B</td><td className="border border-gray-300 px-2 py-1">Senior C, Jr. A, Jr. B Tier I, Jr. B Tier II</td></tr>
              <tr><td className="border border-gray-300 px-2 py-1">Junior A</td><td className="border border-gray-300 px-2 py-1">Jr. B Tier I (Protected List), U17 Goalie (emergency)</td></tr>
              <tr><td className="border border-gray-300 px-2 py-1">Junior B Tier I</td><td className="border border-gray-300 px-2 py-1">Jr. B Tier II, U17</td></tr>
              <tr><td className="border border-gray-300 px-2 py-1">Junior B Tier II</td><td className="border border-gray-300 px-2 py-1">U17, Jr. Major Female</td></tr>
              <tr><td className="border border-gray-300 px-2 py-1">Senior Major Female</td><td className="border border-gray-300 px-2 py-1">Jr. Major Female, Female U17</td></tr>
              <tr><td className="border border-gray-300 px-2 py-1">Junior Major Female</td><td className="border border-gray-300 px-2 py-1">Female U17, Female Tier I & Tier II</td></tr>
            </tbody>
          </table>
        </div>
        <S n="32.2">Currently the RMLL does not have team affiliations.</S>
        <S n="32.3">Player affiliations exist only in Divisions with a XX Player Protected List.</S>
      </Section>

      <Section id="33" title="Roster Exception for Junior B Tier II Teams" open={isOpen('33')} onToggle={() => toggle('33')}>
        <S n="33.1">The Tier II Division utilizes a Tier III playing card to allow Tier II Franchises to call-up Tier III players when short.</S>
        <S n="33.2-33.4">Tier III card keeps players in lacrosse in areas where Tier II Franchises have full rosters. Players sign an RMLL Tier III card (not a specific team card), allowing call-up to all Tier II Franchises.</S>
        <S n="33.5">Any Tier III carded player is considered a Tier II Free Agent and can be added to any Tier II roster.</S>
        <S n="33.6">Tier III player eligible for Playoffs if they have played 4 Regular Season Tier II games.</S>
        <S n="33.7">Tier III player can play for more than one team in Playoffs but cannot play against a team they played for in a previous round.</S>
      </Section>

      {/* ═══ TRAVEL & EXHIBITION ═══ */}
      <GroupHeader title="Travel & Exhibition" />

      <Section id="34" title="Travel Permits" open={isOpen('34')} onToggle={() => toggle('34')}>
        <S n="34.1">All Franchises participating in games outside Alberta must obtain approval from their Division Commissioner.</S>
        <S n="34.2">Must complete ALA Travel Permit and Roster forms. Request filed 15 days prior to departure.</S>
        <S n="34.3">Travel Permit not required for RMLL away games with out-of-province RMLL Members.</S>
      </Section>

      <Section id="35" title="Exhibition Games" open={isOpen('35')} onToggle={() => toggle('35')}>
        <S n="35.1">An Exhibition Game is any game/scrimmage between players from two different Franchises.</S>
        <S n="35.4-35.7">Permission required from Division Commissioner. Six (6) day minimum notice. Both Franchises enter game details in RMLL System. RMLL Executive Director forwards notification to OIC at least 4 days prior.</S>
        <p className="font-semibold text-gray-900 mt-2">ALRA Exhibition Game Fee Rates (per Official):</p>
        <div className="ml-4 space-y-1 text-xs mt-1">
          <p><strong>Games &gt; 45 min:</strong> Jr. B Tier II & Jr/Sr Female = $73; Jr. B Tier I & Sr. C = $79; Jr. A & Sr. B = $85</p>
          <p><strong>Games &lt; 46 min:</strong> All = $65</p>
          <p>Higher Division rate applies when teams from different Divisions play. Scheduling fee: $6.</p>
        </div>
        <S n="35.9">Franchise initiating the Exhibition Game pays game fees. Officials paid before game start. ALRA assigning fee, travel and per diem split between Franchises.</S>
        <S n="35.11-35.14">Players must have completed Intent-to-Play. No suspended player may participate. Suspensions in Exhibition Games must be served in RMLL League games. Rosters: max 22 runners and 3 goalies.</S>
      </Section>

      <Section id="36" title="Tournaments" open={isOpen('36')} onToggle={() => toggle('36')}>
        <S n="36.1-36.4">As per ALA Regulation 6. Discipline Chair is the Division Commissioner. Team Event not required. ALA Regulation 6 does not apply to RMLL Playoff/Championship/Provincial Tournament Formats.</S>
      </Section>

      {/* ═══ STANDINGS & PLAYOFFS ═══ */}
      <GroupHeader title="Standings & Playoffs" />

      <Section id="37" title="Division Standings" open={isOpen('37')} onToggle={() => toggle('37')}>
        <S n="37.1">Refer to Division Operating Policy for interlocking game tiebreakers.</S>
        <S n="37.2">A win = 2 points. A tie = 1 point each.</S>
        <p className="font-semibold text-gray-900 mt-2">Balanced Schedule Tiebreakers:</p>
        <div className="ml-4 space-y-1 text-xs">
          <p>1. Head-to-head record</p>
          <p>2. Goal Average Formula: GF / (GF + GA) — using only games between tied teams</p>
          <p>3. Goals Against Formula using all games</p>
          <p>4. Lowest penalty minutes</p>
        </div>
        <p className="font-semibold text-gray-900 mt-2">Unbalanced Schedule Tiebreakers:</p>
        <div className="ml-4 space-y-1 text-xs">
          <p>1. If played equally: head-to-head, then Goal Average between tied teams</p>
          <p>2. If not played equally: Goal Average using all games</p>
          <p>3. For 3+ teams: same structure, then Goals Against all games, then lowest PIM</p>
        </div>
      </Section>

      <Section id="38" title="Playoff, RMLL Championship and Provincial Play" open={isOpen('38')} onToggle={() => toggle('38')}>
        <S n="38.1">All qualifying Franchises must participate. Failure to participate will result in immediate suspensions and fines.</S>
        <S n="38.2">Overtime rules: 2-minute rest, 10-minute stop time; if still tied, 10-minute rest then 20-minute periods until sudden victory.</S>
        <S n="38.3">Each Division decides playoff format at annual Planning Meeting. Tournament tiebreakers follow same Goal Average Formula.</S>
        <S n="38.4-38.6">Provincial format confirmed by August 15. Tournament style hosting rotation or bid submissions.</S>
        <S n="38.7">The Senior B and Alberta Junior B Tier I Champions represent the ALA at Presidents' Cup and Founders' Cup respectively.</S>
      </Section>

      <Section id="39" title="Trophies" open={isOpen('39')} onToggle={() => toggle('39')}>
        <S n="39.1">Franchises responsible for care and safekeeping. Trophies returned to Executive Director at November Planning Meeting and AGM.</S>
        <S n="39.1.2">Failure to return may result in a fine of $100 plus $25/month up to twice the replacement cost.</S>
      </Section>

      <Section id="40" title="National Competitions" open={isOpen('40')} onToggle={() => toggle('40')}>
        <S n="40.1-40.3">Hosting bids due to Commissioner and Executive Director by December 1, two years prior. RMLL selects bid and forwards to ALA by January 15 of year prior.</S>
        <S n="40.4">Franchise attending National Championship may add players from same Division after that player's Franchise is eliminated. In Senior B, the lending Franchise's consent is required (not unreasonably withheld).</S>
        <S n="40.5">LC Anti-Doping: All athletes and personnel must complete CCES True Sport Clean 101 online education course.</S>
      </Section>

      {/* ═══ DISCIPLINE ═══ */}
      <GroupHeader title="Discipline" />

      <Section id="41" title="Suspensions and Fines" open={isOpen('41')} onToggle={() => toggle('41')}>
        <S n="41.1">Official Game Reports: Exhibition/Regular Season = 24 hours; Playoff = 6 hours; Tournament Provincial = 30 minutes.</S>
        <S n="41.2">Division Commissioner can decrease or increase suspension (max 5 games) and/or fine (max $500). No appeal from suggested suspensions/fines in Regulations 42 and 43.</S>
        <S n="41.3">Commissioner cannot levy more than 5 games; may recommend further to Discipline and Appeals Commissioner.</S>
        <S n="41.7">Immediate suspension for physical contact with an Official. Must appear before Discipline and Appeal Commissioner.</S>
        <S n="41.10">Match penalty/gross misconduct = suspended until dealt with by Commissioner. Only league games count against suspension.</S>
        <S n="41.13">No discipline unless infraction is recorded on game sheet by referee.</S>
        <S n="41.14">Video evidence may be accepted on case-by-case basis, but only for infractions recorded on game sheet.</S>
        <S n="41.15">Control and discipline of spectators and family members is the Franchise's responsibility.</S>
      </Section>

      <Section id="42" title="Player Suspensions and Fines" open={isOpen('42')} onToggle={() => toggle('42')}>
        <S n="42.1">Outstanding fees = "bad standing" = suspended until paid. Must be outstanding 90+ days with documented collection attempts.</S>
        <S n="42.3">Match penalty = minimum 3 games + $100 fine (2 games for leagues with ≤12 Regular Season games).</S>
        <S n="42.4">Match penalty for Abuse of Official = minimum 3 games + $100 fine + referral to Discipline. Franchise also fined.</S>
        <S n="42.5">Game misconduct for Abuse of Official = minimum 1 additional game (2 games if at 0:00 remaining).</S>
        <S n="42.6">Gross misconduct = $50 fine + minimum 2 games.</S>
        <S n="42.7">Fighting off playing surface = $50 fine + minimum 3 games.</S>
        <S n="42.8">Leaving bench during altercation = minimum 2 games.</S>
        <S n="42.9">Third man in = minimum 1 game.</S>
        <S n="42.10">Failing to proceed to bench (LC Rule 45e) = minimum 1 game.</S>
        <S n="42.11">Game misconduct with 0:00 left = minimum 1 game.</S>
        <S n="42.12">Non-playing personnel entering surface without permission = $50 fine + minimum 2 games.</S>
        <S n="42.13">5 game misconducts in 1 season = 2 game suspension on 5th offence; may be referred to Discipline.</S>
        <S n="42.14">Aggressor/instigator in last game of season = suspended for first 2 games of upcoming season.</S>
        <S n="42.15">100 cumulative PIM in Regular Season = 2 game suspension.</S>
        <S n="42.16">150 cumulative PIM in Regular Season = 3 game suspension + sent to Discipline.</S>
        <S n="42.17-42.19">Playoff PIM: 60 = 1 game; 80 = 2 games; 100 = 3 games.</S>
      </Section>

      <Section id="43" title="Franchise Suspensions and Fines" open={isOpen('43')} onToggle={() => toggle('43')}>
        <p className="font-semibold text-gray-900">Key Fines Summary:</p>
        <div className="overflow-x-auto mt-2">
          <table className="text-xs border-collapse w-full">
            <thead><tr className="bg-gray-100"><th className="border border-gray-300 px-2 py-1 text-left">Offence</th><th className="border border-gray-300 px-2 py-1 text-right">Fine</th></tr></thead>
            <tbody>
              {[
                ['Failing to enter Franchise contacts by deadline', '$100'],
                ['Not entering scheduling constraints', '$100'],
                ['Not entering Exhibition Game in System', '$100'],
                ['Late draft Protected List submissions', '$100/day'],
                ['Late roster entry', '$250 + $50/day after'],
                ['Missing player contact info', '$25/field'],
                ['Game default — 1st offence', '$1,500'],
                ['Game default — 2nd offence', '$2,000'],
                ['Game default — 3rd offence', '$3,000 + suspension'],
                ['Season default (withdrawal after schedule posted)', '$2,000'],
                ['Delay of game (30+ min)', '$250 minimum'],
                ['Removing from floor / refusing to play', '$250'],
                ['Not participating in Playoffs/Championship/Provincials', 'Immediate suspension'],
                ['Playing ineligible player', '$100/offence + loss of game'],
                ['Call-up violations', '$100/offence + loss of game'],
                ['Using players without proper approvals', '$50'],
                ['Abuse of Official (Franchise fine)', '$50'],
                ['Bench clearing brawl (Head Coach)', '$50 + 2 games'],
                ['Improper nets, warm-up or game balls', '$50'],
                ['Music noncompliance', '$1,000/offence after warning'],
                ['Arena horn noncompliance', '$1,000/offence after warning'],
                ['Under-18 on floor without helmet', '$250 (1st) to $500'],
                ['Tampering', 'Up to $500'],
                ['Player on game sheet not dressed', '$50'],
                ['No Head Coach on Franchise Certificate', '$100'],
                ['Non-registered bench personnel', '$100/game'],
                ['Bench personnel without LC certification in Playoffs', '$500/game'],
                ['Not supplying game sheet to visiting team', '$25'],
                ['Late game sheet', '$50'],
                ['Late coach evaluation form', '$50'],
                ['Improperly completed game sheet', '$50'],
                ['Late stat entry (48 hrs)', '$50/offence'],
                ['Wrong player number on game sheet', '$100/occurrence'],
                ['Wrong colour jerseys', '$500'],
                ['Late trophy return', '$100 + $25/month'],
                ['650+ PIM in Regular Season', '$250'],
                ['750+ PIM in Regular Season', 'Franchise hearing review'],
                ['Off Floor Official — Abuse of Official game misconduct', 'Suspended remainder of Season'],
                ['Monies owing to RMLL', '"Bad standing" — no voting, no drafts, no games'],
              ].map(([offence, fine], i) => (
                <tr key={i} className={i % 2 ? 'bg-gray-50' : ''}><td className="border border-gray-300 px-2 py-1">{offence}</td><td className="border border-gray-300 px-2 py-1 text-right font-mono whitespace-nowrap">{fine}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="44" title="Game Protest" open={isOpen('44')} onToggle={() => toggle('44')}>
        <S n="44.1">Regular Season protest: written, within 24 hours, $200 fee. Playoff/Provincial series: 6 hours. Round Robin: 2 hours. Fee returned if protest successful.</S>
        <S n="44.2">Written protest must set out applicable Bylaws/Regulations and details of non-compliance.</S>
        <S n="44.3">Division Commissioner and two RMLL Executive members rule on protest.</S>
        <S n="44.4">Decision within 48 hours (Regular Season) or 12 hours (Playoff/Provincial).</S>
        <S n="44.5">There is no appeal from the protest decision. Forfeit results in 2 points to non-forfeiting Franchise; stats still recorded.</S>
      </Section>

      <Section id="45" title="Discipline Hearing Process" open={isOpen('45')} onToggle={() => toggle('45')}>
        <S n="45.1">Complaint/referral submitted in writing to Executive Director within 5 days. Forwarded to Discipline and Appeals Commissioner within 3 days.</S>
        <S n="45.2">Panel of 3 members appointed. Hearing within 10 days of panel formation (may be by conference call).</S>
        <S n="45.3-45.6">Both parties given reasonable notice, entitled to attend at own expense. Parties have right to receive all written material, hear witnesses, present evidence, and cross-examine.</S>
        <S n="45.7">Panel may: dismiss complaint; fine, suspend, expel or impose probation; impose other orders; or if complaint found unreasonable, impose orders on the complaining party.</S>
        <S n="45.8">Decision communicated within 3 days; written reasons within 10 days.</S>
        <S n="45.9-45.12">Automatic referrals may be decided without hearing by unanimous panel vote. Further discipline may be imposed even after automatic suspension expires. ALA appeals in accordance with their Bylaws.</S>
      </Section>

      <Section id="46" title="Appeal Process" open={isOpen('46')} onToggle={() => toggle('46')}>
        <S n="46.1">Notice of Appeal: Written, to Executive Director, within 7 days. By mail, courier, electronic format (not SMS).</S>
        <S n="46.2">Must contain: statement of decision being appealed, grounds for appeal (jurisdiction or bias), facts, and summary of evidence.</S>
        <S n="46.3">Appeal Fee: $300.00, refundable if appeal successful.</S>
        <S n="46.4">Commissioner may dismiss without hearing if grounds not met. Panel of 3 appointed. Hearing within 10 days. Parties have full rights to evidence, witnesses, and cross-examination. Panel may dismiss or allow appeal and impose any decision the original body could have imposed. Costs may be awarded for unreasonable or bad faith conduct.</S>
      </Section>

      {/* ═══ ADMINISTRATIVE ═══ */}
      <GroupHeader title="Administrative" />

      <Section id="47" title="Expenses" open={isOpen('47')} onToggle={() => toggle('47')}>
        <S n="47.1">Expenses limited to approved scale for transportation, meals and mileage. RMLL Executive entitled to claim for official meetings and legitimate duties.</S>
        <S n="47.2">Travel: Controlled through Treasurer. Take advantage of reduced rates. Receipts required. Mileage rate: $0.53/km.</S>
        <S n="47.3">Accommodations: Booked by RMLL Executive member, approved by RMLL Executive.</S>
        <S n="47.4">Food and Beverage: Up to $60.00/day, excluding alcoholic beverages. Receipts required.</S>
        <S n="47.5">Entertainment: Subject to RMLL Executive approval unless budgeted.</S>
        <S n="47.8">Expense Claims submitted on RMLL Expense Claim Form to PO Box 47083 Creekside, Calgary, Alberta, T3P 0B9. Must be claimed in the Season they occur, prior to fiscal year end (September 30).</S>
      </Section>

      <Section id="48" title="Social Media" open={isOpen('48')} onToggle={() => toggle('48')}>
        <S n="48.1">The RMLL encourages engagement in social media using sound judgment and common sense, adhering to League values and ensuring all RMLL, ALA and LC Bylaws and Regulations are not breached.</S>
        <S n="48.2">All Members expected to be aware of the ALA Social Media Policy.</S>
        <S n="48.3">Non-compliance may be considered misconduct, harassment, discrimination, or contravention of the law. Those who fail to comply may be disciplined.</S>
      </Section>

      <Section id="49" title="Privacy of Personal Information" open={isOpen('49')} onToggle={() => toggle('49')}>
        <S n="49.1">Personal information collected for eligibility, enrollment, communication, programs, insurance and statistical purposes.</S>
        <S n="49.2">All information collected with consent of the person or legal guardian.</S>
        <S n="49.3">Collection limited to what is absolutely necessary.</S>
        <S n="49.4">Efforts made to verify accuracy, completeness, and timeliness.</S>
        <S n="49.5">Reasonable steps taken to protect privacy of all personal information.</S>
        <S n="49.6">The President of the RMLL is the Privacy Officer.</S>
        <S n="49.7">Contact: PO Box 47083 Creekside, Calgary, Alberta, T3P 0B9 or e-mail the RMLL President at www.rockymountainlax.com</S>
      </Section>

      <Section id="50" title="Electronic Voting" open={isOpen('50')} onToggle={() => toggle('50')}>
        <S n="50">At the President's discretion, electronic votes may be held between meetings. Process: President circulates motion by e-mail; motion must be moved and seconded; 2-day discussion period; 24-hour voting window. Non-response = vote in favour. Only e-mail votes from addresses on file accepted. President may suspend electronic voting if more discussion needed.</S>
      </Section>

      {/* ═══ SCHEDULES ═══ */}
      <GroupHeader title="Schedules" />

      <Section id="S1" title="Schedule 1: LC, ALA, RMLL Calendar — Due Dates" open={isOpen('S1')} onToggle={() => toggle('S1')}>
        <div className="overflow-x-auto">
          <table className="text-xs border-collapse w-full">
            <thead><tr className="bg-gray-100"><th className="border border-gray-300 px-2 py-1 text-left">Due Date</th><th className="border border-gray-300 px-2 py-1 text-left">Division</th><th className="border border-gray-300 px-2 py-1 text-left">Item</th></tr></thead>
            <tbody>
              {[
                ['Jan 5', 'Sr. B, Jr. A, Tier I, Major Female', 'Draft dates posted'],
                ['Jan 15', 'All', 'Host Bid for National Competition submitted to ALA'],
                ['Jan 15', 'Sr. B, Sr. C, Tier I, Sr./Jr. Major Female, Tier II', 'Home game arena timeslots and constraints due'],
                ['Jan 15', 'All', 'Franchise Certificate info due'],
                ['Jan 30', 'All', 'Regulations revised due to ALA changes'],
                ['Feb 1', 'Sr. C, Tier II, Sr. Major Female, Non-Drafting Jr. Major Female', 'First day to add players to roster'],
                ['Feb 13', 'Sr. B, Jr. A, Tier I', 'Drafts completed'],
                ['Feb 15', 'Jr. A', 'LC Negotiation lists due'],
                ['Feb 20', 'Sr. B & Tier I', 'LC Negotiation lists due'],
                ['Feb 24', 'Sr. B, Jr. A, Tier I', 'LC Negotiation lists due at LC'],
                ['Mar 1', 'All', 'Franchise & Division fees due'],
                ['Mar 1', 'All', '"In Progress" schedule issued'],
                ['Mar 15', 'All', 'Final schedule issued'],
                ['Apr 20', 'All', 'EAP due'],
                ['Apr 27', 'If season starts after Apr 30', 'Rosters and Bench Personnel entered in System'],
                ['May 1', 'All', 'Unsigned/unprotected players become Free Agents'],
                ['Jul 1', 'All', 'New player signing and trade deadline'],
                ['Jul 15', 'All', 'RAMP Intent-to-Play closes'],
                ['Jul 16', 'All', 'All rosters frozen for current Season'],
                ['Aug 15', 'All', 'Provincial format for next season due'],
                ['Nov 1', 'All', 'New Team Application, Tier Change, Transfer deadlines'],
                ['Nov 30', 'All', 'Regulations issued; Division Planning Minutes due'],
                ['Dec 1', 'All', 'RAMP opens; Division Operating Policy modifications due'],
              ].map(([date, div, item], i) => (
                <tr key={i} className={i % 2 ? 'bg-gray-50' : ''}><td className="border border-gray-300 px-2 py-1 whitespace-nowrap font-semibold">{date}</td><td className="border border-gray-300 px-2 py-1">{div}</td><td className="border border-gray-300 px-2 py-1">{item}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500 italic mt-2">See full Regulations document for complete calendar with all items.</p>
      </Section>

      <Section id="S2" title="Schedule 2: New Franchise Certificate Request" open={isOpen('S2')} onToggle={() => toggle('S2')}>
        <p>A new Franchise may request an RMLL Franchise Certificate. Requires written submission of:</p>
        <ol className="list-decimal ml-6 space-y-1 mt-2">
          <li><strong>Financial Stability</strong> — Evidence of financing for at least one full year, including Season budget</li>
          <li><strong>Exposure</strong> — Proof entry won't impose unwarranted burden; coaching certification; number of qualified Officials; access to call-ups; travel constraints</li>
          <li><strong>Operational Personnel</strong> — Primary/Secondary contact, Financial/Scheduling contact, Registrar, Head Coach, Assistant Coaches, Franchise Holder Directors/Officers</li>
          <li><strong>Players</strong> — List of potential players with years played, birth year, U17/Junior level</li>
          <li><strong>Future Players</strong> — Where future players will come from for 2-3 years</li>
          <li><strong>Facility</strong> — Comparable facility available with suitable dates/times. Complete Facility Specification Form</li>
          <li><strong>Local Support</strong> — Evidence of local lacrosse infrastructure</li>
          <li><strong>Reason(s) for Request</strong></li>
          <li><strong>Acceptance of RMLL Bylaws and Regulations</strong></li>
        </ol>
        <p className="mt-2"><strong>Cost:</strong> $2,000 Performance Bond + $950 Franchise Fee + $200 Contingency Fund + $1,500 Refundable Application Bond = <strong>$4,650 total</strong></p>
        <p><strong>Deadline:</strong> November 1</p>
        <p className="mt-2">Process: RMLL Executive Director reviews → Division Commissioner → Division Planning Meeting vote → RMLL Executive ratification</p>
      </Section>

      <Section id="S3" title="Schedule 3: Division Tier Change Request" open={isOpen('S3')} onToggle={() => toggle('S3')}>
        <p>An existing Franchise may request to change Division Tier. Same submission requirements as Schedule 2 plus: win/loss record for last two seasons, championship history, and exhibition game results.</p>
        <p><strong>Cost:</strong> $1,500 Refundable Application Bond. <strong>Deadline:</strong> November 1.</p>
        <p>Same approval process as new Franchise request.</p>
      </Section>

      <Section id="S4" title="Schedule 4: Franchise Transfer Request" open={isOpen('S4')} onToggle={() => toggle('S4')}>
        <p>A Franchise may be sold or transferred. Same submission requirements as Schedule 2 for the Franchise Transferee plus reasons for transfer.</p>
        <p><strong>Cost:</strong> $1,500 Refundable Transfer Bond. <strong>Deadline:</strong> November 1.</p>
        <p>Same approval process as new Franchise request.</p>
      </Section>

      <Section id="S5" title="Schedule 5: Franchise Certificate" open={isOpen('S5')} onToggle={() => toggle('S5')}>
        <p>The Franchise Certificate is a certified declaration by a duly elected Officer of the Franchise Holder confirming:</p>
        <ol className="list-decimal ml-6 space-y-1 mt-2">
          <li>Authority to execute and deliver the Certificate</li>
          <li>Review of the Franchise Certificate filed with the RMLL</li>
          <li>Information is complete, true and correct</li>
          <li>Franchise Holder is fully responsible and liable for all dues, fees, fines and amounts owing</li>
          <li>Authorization for RMLL to make payments to the designated entity</li>
        </ol>
      </Section>

      <Section id="S6" title="Schedule 6: Home Facility Specifications" open={isOpen('S6')} onToggle={() => toggle('S6')}>
        <p>Specification form covers: Facility name, availability, playing surface dimensions, ceiling height (minimum 17 feet), surface material, non-slip application, LC lacrosse lines, lighting, air conditioning, players' box dimensions, timekeeper box, spectator seating, concession, sound system, internet access, admission gate, LC approved nets with black mesh, shot clocks, score clock with penalty minutes, dressing rooms, referee dressing rooms with shower, AED defibrillator.</p>
      </Section>

      <Section id="S7" title="Schedule 7: Senior B Drafts and Protected Lists" open={isOpen('S7')} onToggle={() => toggle('S7')}>
        <p className="font-semibold">Senior B Graduating Junior Draft:</p>
        <S n="">Players north of Leduc southern boundary: Beaumont Outlaws, Fort Saskatchewan Rebels, Edmonton Miners. Players south of Didsbury northern boundary: Rockyview Knights, Calgary Senior Mountaineers. Players between: Central Alberta (if established).</S>
        <S n="">Once drafted, a player is property of that team until released or traded. If a player goes to a higher league (WLA, MSL), rights remain with drafting team.</S>
        <p className="font-semibold mt-3">Senior B 40 Player Protected List:</p>
        <S n="">50 players allowed Feb 1 – Apr 15; 40 players from Apr 16 – Feb 1 of following year. No Hold-out or Injured Reserve Lists. Frozen from July 1 to February 1. Published on RMLL website. All changes communicated to Commissioner and Executive Director.</S>
      </Section>

      <Section id="S8" title="Schedule 8: Junior A Drafts and Protected Lists" open={isOpen('S8')} onToggle={() => toggle('S8')}>
        <p className="font-semibold">Junior A Graduating U17 Draft:</p>
        <S n="">10-round open draft. Draft order based on previous season standings. North draft (Edmonton), South draft (Calgary), Saskatchewan draft. Players north of Lacombe = Edmonton; south of/including Red Deer = Calgary; Saskatchewan = Saskatchewan team.</S>
        <p className="font-semibold mt-3">Junior A 50 Player Protected List:</p>
        <S n="">50-Player Protected List (not a 50-man roster; roster max 25). No hold-out or injury list. Playing rights for full 5 years of junior eligibility while on Protected List. Frozen from July 1 to draft date. Expanded to 60 from draft date until second Sunday in April.</S>
      </Section>

      <Section id="S9" title="Schedule 9: Junior B Tier I Drafts and Protected List" open={isOpen('S9')} onToggle={() => toggle('S9')}>
        <p className="font-semibold">Alberta Tier I Drafts (4 separate drafts):</p>
        <div className="ml-4 space-y-2 mt-2 text-xs">
          <p><strong>Draft 1 — North:</strong> Fort Saskatchewan Rebels, Crude Lacrosse Club, Edmonton Warriors, Beaumont Outlaws. 20 rounds. Players from GELC area associations.</p>
          <p><strong>Draft 2 — Central:</strong> Red Deer Rampage, Mountain View Mavericks. 20 rounds. Rampage drafts from Red Deer; Mavericks from Olds/Innisfail; rounds 9-20 shared from CALL area.</p>
          <p><strong>Draft 3 — South:</strong> Calgary Chill, Calgary Shamrocks, Calgary Mountaineers, Rockyview Silvertips, Okotoks Marauders. 20 rounds from CDLA area clubs.</p>
          <p><strong>Draft 4 — Southern Alberta:</strong> Southern Alberta Rockies. 20 rounds from Brooks, Crowsnest, Claresholm, Lethbridge, Taber, Medicine Hat.</p>
        </div>
        <p className="font-semibold mt-3">35 Player Protected List:</p>
        <S n="">35 players (not a roster; roster max 25). No Hold-out or Injury Lists. Players remain until released, traded, or not on final roster for 2 consecutive seasons. Expanded to 45 from draft date to April 10. Frozen from July 16 to next draft date. Published on RMLL website.</S>
        <p className="font-semibold mt-3">Out-of-Province Tier I:</p>
        <S n="">Same 35-Player Protected List structure. Frozen from July 16 to February 1.</S>
      </Section>

      <Section id="S10" title="Schedule 10: Junior Major Female Draft and Protected Lists" open={isOpen('S10')} onToggle={() => toggle('S10')}>
        <p className="font-semibold">Junior Major Female Graduating U17 Draft — Calgary and Surrounding Area:</p>
        <S n="">Draft held prior to February 12 each year. Host alternates among Rockyview Silvertips, Calgary Cardinals, and Okotoks Raiders. Three teams draft from ALA Graduating U17 Female List (Fury and female CDLA U17 players). Rounds continue until all eligible players drafted or each Franchise reaches 40-player limit.</S>
        <p className="font-semibold mt-3">35 Player Protected List — Calgary Area:</p>
        <S n="">35 players (roster max 30). No Hold-out or Injury Lists. Players remain until released, traded, or not on final roster for 2 consecutive seasons. Expanded to 40 from draft date to April 5. Frozen from July 1 to next draft date.</S>
      </Section>

      <Section id="S11" title="Schedule 11: RMLL Modified Rules of Play (2024)" open={isOpen('S11')} onToggle={() => toggle('S11')}>
        <p className="text-gray-500 italic">Modified rules of play implemented in 2024. Refer to the full Regulations document for specific rule modifications.</p>
      </Section>
    </div>
  );
}
