import { useState } from 'react';
import { Scale, ChevronDown, ChevronRight, BookOpen } from 'lucide-react';

/* --- Collapsible Bylaw Section --- */
function BylawSection({
  number,
  title,
  children,
  defaultOpen = false,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 sm:px-5 py-3 bg-white hover:bg-gray-50 transition-colors text-left"
      >
        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded bg-[#013fac] text-white text-xs font-bold shrink-0">
          {number}
        </span>
        <span className="flex-1 font-bold text-gray-900 text-sm sm:text-base">{title}</span>
        {open ? (
          <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-4 sm:px-5 pb-5 pt-2 bg-white border-t border-gray-100 text-sm sm:text-base text-gray-700 leading-relaxed space-y-4">
          {children}
        </div>
      )}
    </div>
  );
}

/* --- Subsection heading --- */
function Sub({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h4 className="font-bold text-gray-900 mt-4 mb-1 text-sm sm:text-base">
      <span className="text-[#013fac] font-mono mr-1.5">{id}</span> {children}
    </h4>
  );
}

/* --- Indented paragraph --- */
function P({ children }: { children: React.ReactNode }) {
  return <p className="ml-0 sm:ml-2">{children}</p>;
}

/* --- Letter list item --- */
function Li({ letter, children }: { letter: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 ml-2 sm:ml-4">
      <span className="font-bold text-gray-500 shrink-0 w-5">{letter})</span>
      <span className="flex-1">{children}</span>
    </div>
  );
}

/* --- Numbered definition --- */
function Def({ num, children }: { num: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 ml-2 sm:ml-4 py-0.5">
      <span className="font-mono text-xs text-[#013fac] font-bold shrink-0 w-6 mt-0.5">{num})</span>
      <span className="flex-1">{children}</span>
    </div>
  );
}

/* =============== MAIN COMPONENT =============== */
export function BylawsPage() {
  const [expandAll, setExpandAll] = useState(false);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#013fac]/5 via-white to-red-50 border-2 border-[#013fac]/20 rounded-lg p-6 sm:p-8">
        <div className="flex items-start gap-4 mb-4">
          <div className="p-3 bg-[#013fac] rounded-lg shadow-md">
            <Scale className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">RMLL Bylaws</h2>
            <div className="h-1 w-20 bg-[#013fac] rounded"></div>
          </div>
        </div>
        <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
          Rocky Mountain Lacrosse League - Alberta Amateur Major Lacrosse Bylaws. These bylaws govern the organization,
          membership, executive structure, meetings, discipline, and operations of the RMLL.
        </p>
        <p className="text-xs text-gray-500 mt-2 italic">Revised - December 1, 2024</p>

        <button
          onClick={() => setExpandAll(!expandAll)}
          className="mt-4 flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded border-2 border-[#013fac] text-[#013fac] hover:bg-[#013fac] hover:text-white transition-colors"
        >
          <BookOpen className="w-3.5 h-3.5" />
          {expandAll ? 'Collapse All Sections' : 'Expand All Sections'}
        </button>
      </div>

      {/* BYLAW 1 */}
      <BylawSection number="1" title="Name" defaultOpen={expandAll} key={`1-${expandAll}`}>
        <P>The name of the organization is the Rocky Mountain Lacrosse League (the "RMLL").</P>
      </BylawSection>

      {/* BYLAW 2 */}
      <BylawSection number="2" title="Interpretation" defaultOpen={expandAll} key={`2-${expandAll}`}>
        <Sub id="2.01">INDEX AND HEADINGS</Sub>
        <P>
          The insertion of headings is for convenience of reference only and shall not affect the construction or
          interpretation hereof.
        </P>

        <Sub id="2.02">TERMS</Sub>
        <P>
          The terms "Bylaws", "hereof", "herein", "hereunder" and similar expressions refer to these Bylaws taken as a
          whole and not to any particular Bylaw or section and include any document or instrument which amends or is
          supplementary to these Bylaws. The word "Bylaw" followed by a number shall mean the particular Bylaw being
          part of these Bylaws.
        </P>

        <Sub id="2.03">SINGULAR, PLURAL, GENDER</Sub>
        <P>
          Words importing the singular number only include the plural and vice versa, and words importing the use of any
          gender include all genders.
        </P>

        <Sub id="2.04">NOTICE</Sub>
        <P>
          Whenever a period of notice is required under these Bylaws, the day on which notice is given shall not be
          counted as part of the notice period, but the day appointed by the notice for the event to which the notice
          relates shall be counted as part of the notice period.
        </P>

        <Sub id="2.05">DEFINITIONS</Sub>
        <P>
          Unless the subject matter or context requires a different interpretation, the following words and phrases
          shall, in these Bylaws, have the following meanings:
        </P>
        <div className="space-y-1 mt-2">
          <Def num="1">"ALA" shall mean the Alberta Lacrosse Association;</Def>
          <Def num="2">"ALRA" shall mean Alberta Lacrosse Referees Association;</Def>
          <Def num="3">"Amateur" shall have that meaning as defined by the LC from time to time;</Def>
          <Def num="4">"AGM" means the Annual General Meeting as provided for in these Bylaws;</Def>
          <Def num="5">"Appeal" means an appeal pursuant to these Bylaws;</Def>
          <Def num="6">
            "Appeal Fee" means that fee as defined and set out in these Bylaws and/or the Regulations;
          </Def>
          <Def num="7">
            "Bond" shall mean any amount of money to be held to cover all or part of any expense as security for the
            performance by a Franchise Holder of its obligations hereunder and under the Regulations;
          </Def>
          <Def num="8">"Bylaws" means these Bylaws, as amended from time to time;</Def>
          <Def num="9">"LC" means the Canadian Lacrosse Association;</Def>
          <Def num="10">
            "Coach" means an individual meeting LC Box Coaching Minimum Standards registered with the RMLL as a coach
            of a Franchise;
          </Def>
          <Def num="11">
            "Discipline" means correction, punishment, penalty, and without limiting the generality of the foregoing,
            shall include but not limited to suspension, fine, expulsion, loss of a Bond or Franchise Fee;
          </Def>
          <Def num="12">"Divisions" means levels of play in the RMLL;</Def>
          <Def num="13">
            "Division Commissioner" means an individual elected by the Franchises of the applicable Division, or in
            the absence of an elected individual, the individual appointed by the RMLL Executive as the interim
            commissioner to govern and administer a Division;
          </Def>
          <Def num="14">
            "Division Operating Policy" means the policy of a specific Division as defined in these Bylaws;
          </Def>
          <Def num="15">
            "Expulsion" means a permanent removal of the privileges of a Franchise, Franchise Holder, or a Member of
            a Franchise to participate in any RMLL sanctioned activity;
          </Def>
          <Def num="16">"Financial Statement" means the financial statements of the RMLL;</Def>
          <Def num="17">"Fiscal Year" shall have that meaning as defined in these Bylaws;</Def>
          <Def num="18">
            "Franchise" shall mean a team for which a Franchise Certificate has been issued by the RMLL;
          </Def>
          <Def num="19">
            "Franchise Holder" shall mean the body corporate to which a Franchise Certificate for a Franchise has been
            issued by the RMLL;
          </Def>
          <Def num="20">
            "Franchise Fee" shall mean the fee required to be paid annually to the RMLL by a Franchise Holder for a
            Franchise;
          </Def>
          <Def num="21">
            "Franchise Certificate" shall mean the certificate issued by the RMLL to a Franchise Holder for each
            Franchise held by such Franchise Holder;
          </Def>
          <Def num="22">
            "In writing" or "written" include printing, typewriting, or any electronic means of communication by which
            words are capable of being visibly reproduced at a distant point of reception, including facsimile, and/or
            e-mail, excluding instant messaging and SMS;
          </Def>
          <Def num="23">
            "Manager" means an individual registered with the RMLL as a manager of a Franchise;
          </Def>
          <Def num="24">
            "Member" shall mean each Franchise for which a Franchise Certificate has been issued by the RMLL;
          </Def>
          <Def num="25">
            "Member in Good Standing" shall mean a Member whose Franchise Holder has paid all monies owing to the RMLL
            (in the absence of approval from the RMLL Treasurer) or whose rights have not been suspended;
          </Def>
          <Def num="26">
            "Members of Member" shall mean the officers and directors of a Franchise Holder, the Players, Coaches,
            Managers and Trainers of a Member and the Off-Floor Officials acting on behalf of a Member;
          </Def>
          <Def num="27">
            "Off-Floor Officials" means those individuals who work as time-keepers, goal judges, penalty-box attendants
            and other individuals who may be required off the floor from time to time for the organized conduct of a
            game of Lacrosse;
          </Def>
          <Def num="28">"Notice of Appeal" means that notice as provided for in these Bylaws;</Def>
          <Def num="29">
            "Ordinary Resolution" means a resolution passed by 50% plus one of such parties entitled to vote on such
            resolution and who are present at a meeting;
          </Def>
          <Def num="30">
            "Parties to the Appeal" means the Appellant, Respondent, and such other persons as the Discipline and
            Appeals Commissioner, acting reasonably, shall direct and name;
          </Def>
          <Def num="31">
            "Person" and other references to persons, includes any individual, firm, body corporate, unincorporated
            body of persons, or association;
          </Def>
          <Def num="32">
            "Player" means an individual registered with the RMLL as a player on a Franchise;
          </Def>
          <Def num="33">
            "Player in Good Standing" shall mean a player who is not in arrears in any payments owing to their Member
            or whose rights have not been suspended;
          </Def>
          <Def num="34">"Quorum" shall have that meaning as defined in these Bylaws;</Def>
          <Def num="35">
            "Regulations" means the regulations of the RMLL for the governance, administration and advancement of
            Lacrosse;
          </Def>
          <Def num="36">"RMLL" shall mean the Rocky Mountain Lacrosse League;</Def>
          <Def num="37">
            "RMLL Executive" means the individuals elected or appointed pursuant to Section 6.01 of these Bylaws;
          </Def>
          <Def num="38">
            "Rules" means those rules of the game of Lacrosse as made from time to time by LC, ALA, RMLL and any
            applicable Division Operating Policy;
          </Def>
          <Def num="39">
            "Special General Meeting" means a meeting held in accordance with Section 8.04 of these Bylaws;
          </Def>
          <Def num="40">
            "Special Resolution" means a resolution passed by a majority of not less than three-fourths (3/4) of such
            parties entitled to vote on such resolution and are present at a meeting; and
          </Def>
          <Def num="41">
            "Suspension" means a temporary removal of a Franchise Holder, Member or a Member of a Member privileges
            to participate in RMLL sanctioned activities.
          </Def>
        </div>
      </BylawSection>

      {/* BYLAW 3 */}
      <BylawSection number="3" title="Membership and Fees" defaultOpen={expandAll} key={`3-${expandAll}`}>
        <Sub id="3.01">MEMBERSHIP</Sub>
        <P><strong>3.01.1</strong> Membership in the RMLL shall consist of all the Franchises.</P>

        <Sub id="3.02">EXPULSION AND SUSPENSION BY DIVISION</Sub>
        <P>
          <strong>3.02.1</strong> A Member may be expelled or suspended from membership in the RMLL by a Special
          Resolution passed by the Members of that Division in a meeting of Members of that Division called for that
          purpose. No Member shall be expelled or suspended without being notified of the complaint against it and
          without having first been given a fair hearing by the Members of that Division.
        </P>
        <P>
          <strong>3.02.2</strong> Any decision by a Division to suspend or expel a Member shall not be effective until
          ratified by the RMLL Executive which shall hold a hearing for that purpose. Any ratification must be by a
          resolution of the RMLL Executive which is approved by a two-thirds (2/3) majority of the RMLL Executive at
          such meeting.
        </P>

        <Sub id="3.03">EXPULSION AND SUSPENSION BY RMLL EXECUTIVE</Sub>
        <P>
          <strong>3.03.1</strong> The RMLL Executive may, by a resolution approved by a two-thirds (2/3) majority of
          the RMLL Executive at a meeting expel or suspend any Franchise Holder, Member, or Member of a Member where
          the Franchise Holder or Member has failed to pay monies owed to the RMLL. No Franchise Holder, Member or
          Member of a Member shall be expelled or suspended without being notified of the complaint against it and
          without having first been given a fair hearing by the RMLL Executive.
        </P>
        <P>
          <strong>3.03.2</strong> The RMLL Executive may, by a resolution approved by a two-thirds (2/3) majority of
          the RMLL Executive at a meeting, put any Franchise Holder, Member, or Member of Member on probation, or may
          expel or suspend any Franchise Holder, Member or Member of a Member for conduct unbecoming or detrimental to
          the game of lacrosse. No Franchise Holder, Member, or Member of Member shall be put on probation, suspended
          or expelled without being notified of the complaint against it and without first being given a fair hearing
          by the RMLL Executive.
        </P>

        <Sub id="3.04">&nbsp;</Sub>
        <P>
          A Franchise Holder, Member or Member of a Member who withdraws, is suspended or expelled loses the rights
          and privileges of membership in the RMLL.
        </P>

        <Sub id="3.05">FRANCHISE FEES</Sub>
        <Li letter="a">
          An annual Franchise Fee will be assessed to each Franchise Holder for each Franchise held.
        </Li>
        <Li letter="b">
          The annual Franchise Fee shall be determined annually by the RMLL Executive prior to the AGM. The fees so
          determined shall be subject to ratification by an ordinary resolution of the Members at the AGM and upon
          such ratification, the fees so determined shall become the annual Franchise Fees for Membership until the
          following AGM.
        </Li>
        <Li letter="c">
          In the event the Members do not ratify the Franchise Fee proposed by the RMLL at the AGM, the amount of
          the Franchise Fee for the upcoming year shall be the then current Franchise Fee or the Franchise Fee as
          determined by the Members at the AGM.
        </Li>
        <Li letter="d">
          The RMLL Executive shall, twenty-one (21) days prior to the AGM, notify the Members of a change to the
          Franchise Fee for the forthcoming year.
        </Li>
      </BylawSection>

      {/* BYLAW 4 */}
      <BylawSection number="4" title="Bonds" defaultOpen={expandAll} key={`4-${expandAll}`}>
        <Sub id="4.01">&nbsp;</Sub>
        <P>
          Each applicant for a Franchise is required to post with the Treasurer, a Bond in the amount set forth in the
          Regulations, with its Franchise application to the RMLL. This Bond will be retained by the RMLL in
          accordance with the Regulations.
        </P>
        <Sub id="4.02">&nbsp;</Sub>
        <P>
          Interest earned on Bond monies held by the RMLL (whether they be performance Bonds or other) shall become
          revenue of the RMLL and be allocated to general funds as earned.
        </P>
        <Sub id="4.03">&nbsp;</Sub>
        <P>
          The RMLL Executive may make withdrawals from the Bonds on deposit for fines assessed to any Franchise Holder
          or Member and charge that withdrawal to the specific Franchise Holder or Member fined. During the playing
          season, any deficit to a Member's Bond must be paid within seven (7) days after receiving notice of the
          deficit. If after the playing season, the deficit must be paid within fourteen (14) days after receiving
          notice of the deficit.
        </P>
      </BylawSection>

      {/* BYLAW 5 */}
      <BylawSection number="5" title="Conflict of Interest" defaultOpen={expandAll} key={`5-${expandAll}`}>
        <Sub id="5.01">DISCLOSURE OF CONFLICT OF INTEREST</Sub>
        <P>
          Any member of the RMLL Executive, RMLL committee member, Franchise Holder, Member or Member of a Member who
          has, directly or indirectly, any interest in any contract or transaction to which the RMLL is or is to be a
          party, shall declare his, her or its interest in such contract or transaction at a meeting of the RMLL
          Executive or Division or Committee, as the case may be, and shall at that time disclose the nature and
          extent of such interest.
        </P>

        <Sub id="5.02">&nbsp;</Sub>
        <P>
          No member of the RMLL Executive or an RMLL committee, Franchise Holder, Member or Member of a Member shall
          vote on any question:
        </P>
        <Li letter="a">effecting a private company of which they are a shareholder;</Li>
        <Li letter="b">
          effecting a public company in which they hold more than one percent of the issued and outstanding shares;
        </Li>
        <Li letter="c">
          effecting a partnership or firm of which they are members or in which they have an interest;
        </Li>
        <Li letter="d">
          relating to a contract for the sale of goods or merchandise, or the provision of services to which they are
          a party;
        </Li>
        <Li letter="e">
          in which they have direct or indirect pecuniary interest, except questions of general benefit to a class of
          which they are, by statute, necessarily members; or
        </Li>
        <Li letter="f">
          effecting the placement or discipline of any player or personnel to whom they are directly related.
        </Li>

        <Sub id="5.03">&nbsp;</Sub>
        <P>
          Any member of the RMLL Executive, RMLL committee member, Franchise Holder, Member or Member of a Member
          excluded because of the above shall so declare before the discussion of the question and shall not
          participate in the discussion or debate relating to such questions, and shall not vote on such question,
          provided that such party shall be included in the quorum with respect to such meeting.
        </P>
      </BylawSection>

      {/* BYLAW 6 */}
      <BylawSection number="6" title="RMLL Executive" defaultOpen={expandAll} key={`6-${expandAll}`}>
        <Sub id="6.01">EXECUTIVE POSITIONS AND TERMS</Sub>
        <P>The RMLL Executive shall consist of the following positions with the following term of office:</P>
        <div className="ml-4 space-y-0.5 mt-1">
          <Def num="1">President (2 years)</Def>
          <Def num="2">Vice-President (2 years)</Def>
          <Def num="3">Executive Director (2 years)</Def>
          <Def num="4">Treasurer (2 years)</Def>
          <Def num="5">Commissioners for each Division (1 year)</Def>
          <Def num="6">Official-in-Chief (2 years)</Def>
          <Def num="7">Discipline and Appeals Commissioner (2 years)</Def>
          <Def num="8">Development Commissioner (2 years)</Def>
        </div>
        <P>
          <strong>6.01.1</strong> The term of the office of President and Treasurer shall start in the same year, and
          the term of Vice-President and Executive-Director shall start in the term following or preceding the former
          terms of office. Each of the President, the Executive Director, the Vice-President and the Treasurer shall
          be elected by the Members at the AGM. The Commissioners shall be elected by the respective Divisions, the
          Official-in-Chief is appointed by the ALRA and the Discipline and Appeals Commissioner and Development
          Commissioner shall be appointed by the RMLL Executive.
        </P>

        <Sub id="6.02">RESIGNATION</Sub>
        <P>
          A member of the RMLL Executive may resign from office upon giving notice thereof in writing to the Executive
          Director and such resignation becomes effective in accordance with its terms or upon acceptance by the RMLL
          Executive.
        </P>

        <Sub id="6.03">EXPULSION</Sub>
        <P>
          The Members may, by Special Resolution remove any member of the RMLL Executive before the expiration of his
          or her term of office and may, by Special Resolution elect another individual in his or her stead for the
          remainder of the term of the RMLL Executive member so removed.
        </P>
        <P>
          <strong>6.03.1</strong> The RMLL Executive may, by a resolution approved by a two-thirds (2/3) majority of
          the RMLL Executive present at such meeting, remove a member of the RMLL Executive who, in the opinion of
          the RMLL Executive has been or is being remiss or neglectful of duty or by conduct which impairs his/her
          performance as a RMLL Executive member. No member of the RMLL Executive shall be removed without being
          notified of the complaint against him or her and without first being given a fair hearing by the RMLL
          Executive.
        </P>
        <P>
          <strong>6.03.2</strong> Where a vacancy occurs on the RMLL Executive or in the event that the office is not
          elected, and a quorum then exists, the RMLL Executive then in office may appoint an individual to fill the
          vacancy for the remainder of the term of such office. If there is not then a quorum in office, the RMLL
          Executive then in office shall forthwith call a meeting of the Members to fill the vacancies, and, in
          default or if there are no RMLL Executive members then in office, the meeting may be called by any Member.
        </P>

        <Sub id="6.04">MEETINGS OF THE RMLL EXECUTIVE</Sub>
        <P>
          Meetings of the RMLL Executive shall be held in Alberta and follow these Bylaws and where applicable
          Roberts Rules of Order.
        </P>
        <P>
          <strong>6.04.1</strong> Any RMLL Executive member may participate in a meeting of the RMLL Executive by
          conference call or other communications equipment by means of which all individuals participating in the
          meeting can hear each other, and any member of the RMLL Executive participating in a meeting pursuant to
          this subsection shall be deemed for the purposes of these Bylaws to be present in person at the meeting.
        </P>
        <P>
          <strong>6.04.2</strong> Meetings of the RMLL Executive shall be held at such place, at such time and on
          such day as the President or any four (4) RMLL Executive members may determine, and the President shall
          call meetings when directed or authorized by any four (4) RMLL Executive members, who shall state the
          business which is to be conducted at the said meeting. Notice of every meeting so called shall be given to
          each RMLL Executive member not less than forty-eight (48) hours (excluding any part of a Sunday and of a
          holiday as defined by the Interpretation Act) before the time when the meeting is to be held, except that
          no notice of a meeting shall be necessary if all the RMLL Executive members are present or if those absent
          have waived notice or otherwise signified their consent.
        </P>
        <P><strong>6.04.3</strong> The order of business at any regular meeting of the RMLL Executive shall be as follows:</P>
        <Li letter="a">Call to order;</Li>
        <Li letter="b">Roll call;</Li>
        <Li letter="c">Reading and Approval of Agenda;</Li>
        <Li letter="d">Reading and Approval of minutes;</Li>
        <Li letter="e">Reports of RMLL Executive members;</Li>
        <Li letter="f">Business arising from minutes;</Li>
        <Li letter="g">Financial review;</Li>
        <Li letter="h">Policy change;</Li>
        <Li letter="i">New Business;</Li>
        <Li letter="j">Next Meeting; and</Li>
        <Li letter="k">Adjournment.</Li>

        <P>
          <strong>6.04.4</strong> If there are agenda items which require specific RMLL Executive or committee members
          to be present, and they are not present, the Chair shall immediately have those items tabled to the end of
          the meeting. If at the end of all other business, those RMLL Executive or committee members are still not
          present, those items shall be tabled until the next meeting.
        </P>
        <P>
          <strong>6.04.5</strong> The minutes of the RMLL Executive meetings shall include motions considered and
          their disposition, reports received either explicitly or as attachments and shall be distributed to all
          members of the RMLL Executive.
        </P>
        <P>
          <strong>6.04.6</strong> All members of the RMLL Executive shall vote on every motion of an executive
          meeting, unless excused by resolution of the meeting from voting on a specific motion, or unless
          disqualified from voting by reason of a conflict of interest as provided for pursuant to these Bylaws.
        </P>
        <P>
          <strong>6.04.7</strong> The President shall not vote at meetings of Members, or the RMLL Executive, except
          in the case of a tie vote on any question, the President shall have the deciding vote.
        </P>
        <P><strong>6.04.8</strong> No absentee voting shall be allowed.</P>
        <P>
          <strong>6.04.9</strong> An RMLL Executive member may request his/her vote to be recorded in the minutes.
        </P>

        <Sub id="6.05">MOTIONS</Sub>
        <Li letter="a">
          Each RMLL Executive member, excluding the President or in his absence the Vice-President, shall have the
          privilege of proposing motions for consideration with requirement of a seconder. The President or in his
          absence the Vice-President shall rule on the validity of any point of order. If a motion is ruled
          "out-of-order" by the President or Vice-President it shall be so recorded in the minutes along with the
          reasons stated for the ruling.
        </Li>
        <Li letter="b">
          Between meetings the President may elect to have a motion determined by email/fax ballot.
        </Li>
        <Li letter="c">
          E-mail votes/responses will only be accepted from the email address of the RMLL Executive member which is
          on file with the Executive Director. Otherwise, a faxed vote must be sent.
        </Li>
        <Li letter="d">
          A non-response to a ballot shall be deemed to be a vote in favor of the resolution.
        </Li>
        <Li letter="e">
          A resolution signed by all RMLL Executive members, shall be as valid and effectual as if it has been
          passed at a meeting of the RMLL Executive, duly called and constituted, and shall be held to relate back
          to any date therein stated to be the date thereof.
        </Li>

        <Sub id="6.06">POWERS OF THE RMLL EXECUTIVE</Sub>
        <P>
          For the purpose of carrying out the Mission Statement of the RMLL, the RMLL Executive shall manage the
          affairs of the RMLL, and shall implement all of the resolutions, exercise all of the powers and do all
          such acts and things as may be exercised or done by the RMLL and are not by these Bylaws expressly
          directed or required to be done at a meeting of the Members or otherwise. The powers and duties of the
          RMLL Executive includes, without limiting the generality of the foregoing, the following:
        </P>
        <Li letter="a">supervision of the collection of fees and funds of the RMLL;</Li>
        <Li letter="b">approval of the annual RMLL budget;</Li>
        <Li letter="c">supervision of the expenditure of funds of the RMLL;</Li>
        <Li letter="d">
          to monitor and ensure that the Regulations of the RMLL are consistent to the Mission Statement of the
          RMLL;
        </Li>
        <Li letter="e">
          to borrow, raise or secure the repayment of money in such manner, and upon such terms and conditions as
          the RMLL Executive deems fit, and in particular by the issue of bonds, debentures, security agreements,
          mortgage, charge or other security on the whole or any part of the present and future property (both real
          and personal) of the RMLL, provided, however, that none of these powers shall be exercised except in
          accordance with the sanction of a resolution passed by a Special Resolution of the Members;
        </Li>
        <Li letter="f">to approve all playoff schedules and formats;</Li>
        <Li letter="g">
          to interpret and enforce these Bylaws, the Regulations and Rules and the bylaws, regulations and policies
          of LC and ALA, for the betterment of lacrosse in the RMLL;
        </Li>
        <Li letter="h">
          to recommend, draft and prepare changes to these Bylaws, for approval of the Members at the AGM;
        </Li>
        <Li letter="i">
          to impose and enforce appropriate penalties upon the Franchise Holders, Members, Members of Members or
          other persons for violations or breaches of these Bylaws, the Regulations and the Rules and the bylaws,
          regulations and policies of LC and ALA, or for any violation or breach of a decision or ruling of the RMLL
          Executive; and
        </Li>
        <Li letter="j">
          to appoint those RMLL Executive members who are not elected pursuant to the Bylaws and, from time to time,
          define the duties of RMLL Executive members and employees of the RMLL.
        </Li>

        <Sub id="6.07">RMLL EXECUTIVE'S AUTHORITY - FINAL AND BINDING</Sub>
        <P>
          Subject only to those rights of appeal as provided for herein and bylaws and regulations of the ALA and LC,
          all decisions, rulings and interpretations of the RMLL Executive are final and binding upon Franchise
          Holders, Members and Members of Members.
        </P>
      </BylawSection>

      {/* BYLAW 7 */}
      <BylawSection number="7" title="Duties of the RMLL Executive Members" defaultOpen={expandAll} key={`7-${expandAll}`}>
        <Sub id="7.01">PRESIDENT</Sub>
        <P>
          <strong>7.01.1</strong> The function of the President, with the assistance of and through the RMLL
          Executive, is to formulate and oversee RMLL policy and assist the Commissioners in achieving RMLL
          objectives in a business-like and timely manner.
        </P>
        <P><strong>7.01.2</strong> The President is responsible for the following duties:</P>
        <Li letter="a">call and chair all meetings of the RMLL Executive and Members;</Li>
        <Li letter="b">
          on an emergent basis, to discipline any Franchise Holder, Member or Member of a Member for unseemly
          conduct on or off the playing surface for a breach of these Bylaws, the Rules or the Regulations, subject
          always to the right to appeal as hereinafter provided;
        </Li>
        <Li letter="c">assist the Commissioners in dealing with RMLL operations;</Li>
        <Li letter="d">
          fully exercise the authority of the Vice-President, in the absence or inaccessibility of the
          Vice-President;
        </Li>
        <Li letter="e">represent the RMLL at all ALA meetings;</Li>
        <Li letter="f">assist in preparing an annual budget; and</Li>
        <Li letter="g">represent the RMLL in all discussions with the ALRA.</Li>

        <Sub id="7.02">VICE-PRESIDENT</Sub>
        <P><strong>7.02.1</strong> The Vice-President is responsible for the following duties:</P>
        <Li letter="a">
          prepare changes for these Bylaws and the Regulations as directed by the RMLL Executive;
        </Li>
        <Li letter="b">provide interpretation of these Bylaws and the Regulations;</Li>
        <Li letter="c">provide support to the Commissioners;</Li>
        <Li letter="d">assist the Executive Director and Treasurer;</Li>
        <Li letter="e">
          fully exercise the authority of a Commissioner, in the absence, inaccessibility, or conflict of interest of
          a Commissioner; and
        </Li>
        <Li letter="f">act in the absence of the President.</Li>

        <Sub id="7.03">EXECUTIVE DIRECTOR</Sub>
        <P>
          <strong>7.03.1</strong> The function of the Executive Director is to carry out the administrative support of
          the RMLL on behalf of the RMLL Executive in a business-like and timely manner.
        </P>
        <P><strong>7.03.2</strong> The Executive Director is responsible for the following duties:</P>
        <Li letter="a">arrange for the RMLL Executive passes to be printed and distributed;</Li>
        <Li letter="b">ensure the RMLL registration is complete with the ALA;</Li>
        <Li letter="c">ensure LC negotiation lists are supplied to the ALA Office by applicable deadline;</Li>
        <Li letter="d">
          ensure ALRA Officials are assigned to all RMLL sanctioned games, in conjunction with the Official-in-Chief;
        </Li>
        <Li letter="e">bill, or cause to be billed, each Member for RMLL fees, expenses, and/or fines;</Li>
        <Li letter="f">
          advise new team applicants of the conditions for entry into the RMLL and ensure each application is
          correctly prepared for consideration by the Division and the RMLL Executive;
        </Li>
        <Li letter="g">
          annually prepare and distribute these Bylaws and the Regulations to Members;
        </Li>
        <Li letter="h">
          ensure all changes to the Regulations, Rules and Division Operating Policies are made according to these
          Bylaws following ratification by the RMLL Executive;
        </Li>
        <Li letter="i">
          maintain a registry of all RMLL awards, trophies and personnel recognition under the direction of the
          Commissioners;
        </Li>
        <Li letter="j">provide RMLL schedules to Commissioners; and</Li>
        <Li letter="k">
          fully exercise the authority of the President and Vice-President, in the absence or inaccessibility of the
          President and Vice-President.
        </Li>

        <Sub id="7.04">TREASURER</Sub>
        <P>
          <strong>7.04.1</strong> The function of the Treasurer is to be responsible for the custody and maintenance of
          all books and records of RMLL finances, as required by these Bylaws and the law and ensuring the RMLL is
          properly financially managed.
        </P>
        <P>
          <strong>7.04.2</strong> To be responsible for all fiscal matters pertaining to the RMLL, including the
          preparation of the Financial Statements and the appointment of an auditor (as required by the Societies Act
          (Alberta)).
        </P>

        <Sub id="7.05">COMMISSIONERS</Sub>
        <P>
          <strong>7.05.1</strong> The Commissioners are elected by the Members of their respective Division and are
          put forward for ratification to the RMLL Executive at the annual division planning meeting for a term of
          one (1) year.
        </P>
        <P>
          <strong>7.05.2</strong> The function of the Commissioners is to implement these Bylaws, the Rules, and the
          Regulations in conjunction with the other members of the RMLL Executive in a business-like and timely
          manner.
        </P>
        <P>
          <strong>7.05.3</strong> The Commissioners have the responsibility of administering their respective
          Divisions. The Commissioners are responsible for the following duties:
        </P>
        <Li letter="a">
          administer the Division according to these Bylaws, the Regulations and any ratified Division Operating
          Policy;
        </Li>
        <Li letter="b">
          administer the technical standards of the RMLL including, but not limited to, the game, officiating and
          equipment;
        </Li>
        <Li letter="c">approve trades;</Li>
        <Li letter="d">provide the Executive Director with Protected Player lists;</Li>
        <Li letter="e">
          assist with the preparation of a schedule of all RMLL and playoff games within their respective Divisions;
        </Li>
        <Li letter="f">represent the RMLL at sanctioned games as required;</Li>
        <Li letter="g">
          administer and apply the standards of conduct for all Franchise Holders, Members and Members of Members
          within their respective Divisions, in accordance with these By-laws, the Regulations and/or Division's
          Operating Policy;
        </Li>
        <Li letter="h">
          issue fines and suspensions in accordance these Bylaws, the Regulations and/or the Division's Operating
          Policy, and promptly notify parties, in writing, of any disciplinary actions; and
        </Li>
        <Li letter="i">chair all Division meetings in their respective Divisions.</Li>

        <Sub id="7.06">DISCIPLINE AND APPEALS COMMISSIONER</Sub>
        <P>
          <strong>7.06.1</strong> The Discipline and Appeals Commissioner is appointed by the RMLL Executive for a
          two-year term.
        </P>
        <P><strong>7.06.2</strong> The function of the Discipline and Appeals Commissioner is to:</P>
        <Li letter="a">
          interpret these Bylaws, the Regulations and the Rules and the bylaws, regulations and policies of the ALA
          or LC when the issue relates to a formal complaint, game protest or disciplinary action;
        </Li>
        <Li letter="b">
          appoint, on an annual basis, a discipline committee of up to twelve individuals to be ratified by the RMLL
          Executive to hear and rule on disciplinary matters and appeals from members of the RMLL Executive, Franchise
          Holders, Members or Members of Members; and
        </Li>
        <Li letter="c">
          ensure that appointees to appeal and discipline hearings fulfill their mandate and duties.
        </Li>

        <Sub id="7.07">DEVELOPMENT COMMISSIONER</Sub>
        <P>
          <strong>7.07.1</strong> The Development Commissioner is appointed by the RMLL Executive for a two-year term.
        </P>
        <P><strong>7.07.2</strong> The function of the Commissioner of Development is to:</P>
        <Li letter="a">
          oversee and evaluate referee development and promotion in the RMLL (in conjunction with the RMLL
          Official-in-Chief);
        </Li>
        <Li letter="b">
          conduct research into referee, coach and player development requirements;
        </Li>
        <Li letter="c">
          coordinate with other provincial, national, and international programs relating to the development of
          coaches, players, and officials;
        </Li>
        <Li letter="d">
          suggest direction to the RMLL Executive about initiatives that may be undertaken to enhance referee, coach,
          and player development (including integrated initiatives); and
        </Li>
        <Li letter="e">
          review effectiveness of RMLL coach, player, and referee development initiatives.
        </Li>

        <Sub id="7.08">OFFICIAL-IN-CHIEF</Sub>
        <P>
          <strong>7.08.1</strong> The Official-in-Chief is accountable to the RMLL Executive and appointed by the ALRA
          for a term of two years. He or she must be a member of the ALRA.
        </P>
        <P>
          <strong>7.08.2</strong> The function of the Official-In-Chief is to provide the RMLL with the official
          interpretation of rules, to maintain a central registry of ALRA Officials qualified for RMLL sanctioned
          games and to oversee the completion of the assigning of the appropriate Referees and Officials to all RMLL
          games by the designated RMLL Assignor.
        </P>

        <Sub id="7.09">APPOINTMENT OF COMMITTEES</Sub>
        <P>
          The RMLL Executive has the ability to appoint committees as is deemed necessary from time to time.
        </P>

        <Sub id="7.10">REMUNERATION</Sub>
        <P>The RMLL Executive shall serve without remuneration.</P>

        <Sub id="7.11">EXPENSES</Sub>
        <P>
          All members of the RMLL Executive shall be entitled to reimbursement for their reasonable expenses incurred
          while engaged in business required by their duties as documented in these Bylaws and the Regulations. The
          Treasurer shall approve and document all expense claims to ensure their validity.
        </P>

        <Sub id="7.12">RMLL STAFF</Sub>
        <P>Paid staff/employees of the RMLL cannot be members of the RMLL Executive.</P>

        <Sub id="7.13">INDEMNITY OF RMLL EXECUTIVE</Sub>
        <P>
          Except in respect of an action on behalf of the RMLL to procure a judgment, the RMLL shall indemnify any
          member of the RMLL Executive or RMLL committee member, and his/her heirs and legal representatives against
          all costs, charges, and expenses, including an amount paid to settle an action or satisfy a judgment,
          reasonably incurred by him in respect of being or having been a member of the RMLL Executive or an RMLL
          committee member, if:
        </P>
        <Li letter="a">
          he/she acted honestly and in good faith with a view of the best interests of the RMLL, and;
        </Li>
        <Li letter="b">
          in the case of a criminal or administrative action or proceeding that is enforced by a monetary penalty,
          he/she had reasonable grounds for believing that his/her conduct was lawful.
        </Li>
      </BylawSection>

      {/* BYLAW 8 */}
      <BylawSection number="8" title="Meetings of Members and Voting" defaultOpen={expandAll} key={`8-${expandAll}`}>
        <Sub id="8.01">GENERAL MEETING</Sub>
        <P>
          General meetings of the Members will be held from time to time as decided by the RMLL Executive on not less
          than twenty-one (21) days written notice. The order of business in 8.03.2 shall apply, with the necessary
          changes in points of detail.
        </P>

        <Sub id="8.02">DIVISION MEETINGS</Sub>
        <P>
          Meetings of a Division shall be called by the Commissioner of that Division. Unless documented otherwise in
          the Division Operating Policy, meetings of a Division:
        </P>
        <Li letter="a">will be conducted in accordance with Robert's Rules of Order; and</Li>
        <Li letter="b">a tied vote will be considered a defeated motion.</Li>

        <Sub id="8.03">AGM</Sub>
        <P>
          <strong>8.03.1</strong> The RMLL Executive shall call an AGM of the Members on not less than twenty-one (21)
          days written notice to be held within Alberta within 120 days of fiscal year end.
        </P>
        <P><strong>8.03.2</strong> At every AGM, the following shall be in the order of business:</P>
        <Li letter="a">Call to order;</Li>
        <Li letter="b">Roll call of member delegates;</Li>
        <Li letter="c">Reading and approval of agenda;</Li>
        <Li letter="d">Adoption of minutes, from the previous AGM;</Li>
        <Li letter="e">Auditors Report and appointment of auditor for upcoming year;</Li>
        <Li letter="f">Business arising from minutes;</Li>
        <Li letter="g">RMLL Executive reports, including Annual Financial Review and Budget;</Li>
        <Li letter="h">Notices of Motion;</Li>
        <Li letter="i">Elections in the following order: President, Vice-President, Executive Director, Treasurer;</Li>
        <Li letter="j">New Business; and</Li>
        <Li letter="k">Adjournment.</Li>

        <Sub id="8.04">SPECIAL GENERAL MEETINGS</Sub>
        <P>
          The RMLL Executive, upon receipt of a written request for a Special General Meeting signed by twelve (12)
          Members in Good Standing, shall convene a Special General Meeting within sixty (60) days of the receipt of
          the request. The order of business in 8.03.2 shall apply, with the necessary changes in points of detail.
        </P>

        <Sub id="8.05">QUORUM</Sub>
        <P>
          A majority of the Members in Good Standing must be present in person to form a quorum at the AGM or any
          General or Special General Meeting. In the event that a quorum is not present within one (1) hour of the
          time given in the notice of the said meeting, the Chairperson of the meeting shall adjourn the meeting to a
          date, time and time not less than twenty-one (21) days from the date of the original meeting. The Executive
          Director shall give seven (7) days written notice to the Members of the date and place to which the meeting
          has been adjourned. A quorum for the adjourned meeting shall be those present.
        </P>

        <Sub id="8.06">RIGHT AND OBLIGATION TO VOTE AT MEMBER'S MEETINGS</Sub>
        <P>
          At each General, AGM, or Special General Meeting the voting rights are as follows:
        </P>
        <Li letter="a">each Member shall have one (1) vote; and</Li>
        <Li letter="b">
          each member of the RMLL Executive shall have one (1) vote; unless the member of the RMLL Executive is
          voting on behalf of a Member, in which case that RMLL Executive member would not have a vote as a member
          of the RMLL Executive.
        </Li>

        <Sub id="8.07">QUALIFICATIONS</Sub>
        <P>In order for a Member to qualify for voting privileges at a meeting of Members, the Member must:</P>
        <Li letter="a">have participated in the playing season immediately preceding the AGM;</Li>
        <Li letter="b">be a Member in Good Standing with the RMLL;</Li>
        <Li letter="c">
          be represented in person by the individual listed as its Primary or Secondary in its Franchise Certificate;
        </Li>
        <Li letter="d">
          each member has only one vote, which shall be cast by either the Primary or Secondary contact set forth in
          its Franchise Certificate; and
        </Li>
        <Li letter="e">no individual can be the Primary contact for more than one Member.</Li>

        <Sub id="8.08">VOTING</Sub>
        <P>
          At all meetings of the Members of the RMLL, except for matters that require approval by a Special
          Resolution, every question shall be decided by an Ordinary Resolution. Except as provided herein, every
          question shall be decided in the first instance by a show of hands unless a poll is demanded by a Member.
          Unless a poll is demanded, a declaration by the Chair of the meeting that a resolution has been carried or
          not carried and an entry to that effect in the minutes of the RMLL shall be sufficient evidence of the
          fact without proof of the number or proportion of the votes accorded in favor of or against such
          resolution.
        </P>
        <Li letter="a">
          all elections for members of the RMLL Executive will be done by ballot;
        </Li>
        <Li letter="b">no proxy voting is allowed; and</Li>
        <Li letter="c">
          with the exception of a tied vote, the President shall not vote. In the case of a tied vote, the President
          shall cast his vote as the deciding vote. In the event that the vote for the election of the President is
          tied, the Vice-President shall cast the deciding vote.
        </Li>
      </BylawSection>

      {/* BYLAW 9 */}
      <BylawSection number="9" title="Non-Attendance at Meetings" defaultOpen={expandAll} key={`9-${expandAll}`}>
        <Sub id="9.01">&nbsp;</Sub>
        <P>
          A fine of three hundred dollars ($300) shall be assessed to Members for non-attendance at the AGM unless
          excused by the President.
        </P>
        <Sub id="9.02">&nbsp;</Sub>
        <P>
          A fine of three hundred dollars ($300) shall be assessed to Members for non-attendance at their annual
          Division planning meeting unless excused by the President.
        </P>
      </BylawSection>

      {/* BYLAW 10 */}
      <BylawSection number="10" title="Regulations" defaultOpen={expandAll} key={`10-${expandAll}`}>
        <Sub id="10.01">&nbsp;</Sub>
        <P>
          The RMLL Executive may, from time to time, pass Regulations for the betterment of Lacrosse in the RMLL,
          including, without limiting the foregoing, the better organization and administration of Lacrosse as the
          RMLL Executive, in its sole and absolute discretion may consider desirable. Upon the RMLL Executive
          approving and adopting a Regulation, the Executive Director shall forthwith give notice in writing of the
          said Regulation to the Members.
        </P>
        <Sub id="10.02">&nbsp;</Sub>
        <P>
          Each Division may have its own Division Operating Policy which may be amended from time to time. The
          Division Operating Policy and any amendments must be ratified by the RMLL Executive. The RMLL Executive may
          reject a Division Operating Policy or any provision thereof or amendment thereto for justifiable cause and
          return it to the Division for further consideration. If the Division does not amend the Division Operating
          Policy or amendment as requested by the RMLL Executive, the Division Operating Policy or amendment shall
          not be ratified. The RMLL Executive may enact Regulations to deal with any disagreement with a Division
          Operating Policy, which Regulations shall be paramount to and take precedence over any Division Operating
          Policy.
        </P>
        <Sub id="10.03">&nbsp;</Sub>
        <P>
          Unless a specific Regulation provides a Commissioner discretion with respect to the application of such
          Regulation, a Commissioner cannot exercise any discretion with respect to the application and enforcement
          of same, and for further clarity cannot grant to any Franchise Holder, Member or Member of a Member an
          exemption with respect to same.
        </P>
      </BylawSection>

      {/* BYLAW 11 */}
      <BylawSection number="11" title="Violations of Bylaws and Regulations" defaultOpen={expandAll} key={`11-${expandAll}`}>
        <Sub id="11.01">VIOLATION AND DISCIPLINE</Sub>
        <P>
          Any member of the RMLL Executive, Franchise Holder, Member or Member of a Member, that violates or breaches
          these Bylaws, the Rules and/or the Regulations is subject to discipline as set out herein and therein.
        </P>

        <Sub id="11.02">CODE OF CONDUCT</Sub>
        <P>
          Each member of the RMLL Executive, Franchise Holder, Member and Member of Member shall:
        </P>
        <Li letter="a">
          at all times work toward the goals and Mission Statement of the RMLL and the game of Lacrosse;
        </Li>
        <Li letter="b">
          strive to heighten the image and dignity of the RMLL and the sport of Lacrosse as a whole;
        </Li>
        <Li letter="c">
          always be courteous and objective in all dealings with respect to participating within the RMLL;
        </Li>
        <Li letter="d">
          except when made through proper channels, refrain from unfavorable criticism of other Franchise Holders,
          Members, Members of Members, Referees, or members of the RMLL Executive;
        </Li>
        <Li letter="e">
          strive to achieve excellence in the sport while supporting the concepts of "Fair Play" and a Drug-Free
          sport;
        </Li>
        <Li letter="f">
          show respect for the cultural, social and political values of all participants in the sport; and
        </Li>
        <Li letter="g">
          as a guest in a foreign country, other province or other Association, abide by the laws of the host and
          adhere to any social customs concerning conduct.
        </Li>
        <P>
          All Franchise Holders must take reasonable efforts to require all persons involved, or associated with,
          their Franchises to comply with the above code of conduct.
        </P>

        <Sub id="11.03">SUSPENSIONS AND FINES</Sub>
        <P>
          The RMLL Executive may establish suspensions and fines with respect to any RMLL sanctioned event. Subject to
          any right of appeal to the ALA, there is no appeal from suspensions and fines.
        </P>

        <Sub id="11.04">DISCIPLINE AND APPEALS COMMITTEE</Sub>
        <P>
          The Discipline and Appeals Committee is composed of up to twelve individuals approved by the RMLL Executive
          on an annual basis. Such individuals shall include individuals nominated by the Discipline and Appeals
          Commissioner and each of the Divisions. The Committee shall rule on disciplinary issues submitted to the
          Committee as provided for herein or in the Regulations. The Commissioner of Discipline and Appeals or his
          or her delegate, when requested, shall also interpret these By-laws and the Regulations and the Rules and
          the bylaws, regulations and policies of LC and ALA when the issue relates to disciplinary action. The
          Committee shall also act as an Appeals Committee to hear Appeals pursuant to Bylaw 11.06, provided no
          member of the Appeals Committee was a member of the Discipline Committee which dealt with the matter which
          is the subject of the appeal. If a Division does not appoint an individual to sit on the Discipline or
          Appeals Committee, the Commissioner of Discipline and Appeals may, in his or her discretion, appoint
          additional individuals to sit on Discipline or Appeal panels as required. There is no appeal from the
          exercise of discretion of the Commissioner of the Discipline and Appeals Committee with respect to the
          appointment of persons to sit on a Discipline or Appeals panel.
        </P>

        <Sub id="11.05">JURISDICTION OF DISCIPLINE COMMITTEE</Sub>
        <P>
          A discipline matter may come within the jurisdiction of the Discipline Committee in the following ways:
        </P>
        <Li letter="a">
          receipt of a written complaint from a member of the RMLL Executive, Franchise Holder, a Member, or Member
          of a Member;
        </Li>
        <Li letter="b">
          referral by the President, Vice-President or a Commissioner for discipline in excess or in addition to the
          prescribed minimum penalties as set out in the Regulations;
        </Li>
        <Li letter="c">game infractions which are subject to automatic referral to the Committee; or</Li>
        <Li letter="d">
          receipt of a written complaint in respect of a Code of Conduct violation from a member of the RMLL
          Executive, Franchise Holder, Member or Member of a Member.
        </Li>

        <Sub id="11.06">JURISDICTION OF APPEALS COMMITTEE</Sub>
        <P>
          A decision or ruling may be appealed to the Appeals Committee by the person or entity making the original
          complaint or referral or the person against whom such decision or ruling was made, only if it is an appeal
          from a decision of:
        </P>
        <Li letter="a">
          the President, the Vice President, Executive Director or a Commissioner pursuant to Bylaw 7.01.2 b) or d),
          7.02.1 e) and f), 7.03.2 k) and 7.05.3 g) and h); or
        </Li>
        <Li letter="b">the RMLL Discipline Committee; and</Li>
        <Li letter="c">
          any appeal made pursuant to either 11.06 (a) or (b) above, can only be made if the Appeals Committee has
          first determined that in making a decision or ruling that the person or entity making the decision or
          ruling being appealed from: (i) made a decision or ruling that they had no authority or jurisdiction to
          make or exceeded their authority or jurisdiction in making such decision or ruling; or (ii) the person or
          a member of the committee making such a decision or ruling was biased or had a conflict of interest.
        </Li>

        <Sub id="11.07">EFFECT OF APPEAL</Sub>
        <P>
          An appeal to the Appeals Committee does not operate as a stay of the decision or ruling appealed from,
          except so far as the Commissioner of Discipline and Appeals or the President, as the case may be, may
          direct, upon written application of the person making the appeal.
        </P>

        <Sub id="11.08">APPEALS TO THE RMLL EXECUTIVE</Sub>
        <P>
          There is no appeal to the RMLL Executive from the whole or any part of a decision or ruling made by the
          Discipline and Appeals Commissioner, Discipline Committee or the Appeals Committee.
        </P>
      </BylawSection>

      {/* BYLAW 12 */}
      <BylawSection number="12" title="Exclusive Jurisdiction" defaultOpen={expandAll} key={`12-${expandAll}`}>
        <Sub id="12.01">RMLL EXECUTIVE DECISIONS - FINAL AND BINDING</Sub>
        <P>
          All members of the RMLL Executive, Franchise Holders, Members, and Members of a Member shall accept as
          final and binding the decisions of the RMLL Executive including, without limiting the generality of the
          foregoing, the RMLL Executive's interpretation or construction of the Mission Statement, these Bylaws, the
          Regulations and the Rules subject only to a right of Appeal to the ALA and LC as provided for in these
          Bylaws and the bylaws of LC, and the ALA.
        </P>

        <Sub id="12.02">COURT ACTIONS</Sub>
        <P>
          All members of the RMLL Executive, Franchise Holders, Members and Members of Members, by virtue and because
          of their status as such, agree that any recourse to the law courts of any jurisdiction before all rights
          and remedies as provided by these Bylaws, the Regulations and the Rules and the bylaws of LC and ALA have
          been exhausted, shall be prohibited.
        </P>
      </BylawSection>

      {/* BYLAW 13 */}
      <BylawSection number="13" title="General" defaultOpen={expandAll} key={`13-${expandAll}`}>
        <Sub id="13.01">FISCAL YEAR</Sub>
        <P>
          The fiscal year of the RMLL shall commence on the 1st day of October of every year up to and including the
          30th day of September the following year.
        </P>

        <Sub id="13.02">ANNUAL FINANCIAL REVIEW</Sub>
        <P>
          <strong>13.02.1</strong> The books and financial records of the RMLL shall be compiled annually by an
          accredited external accountant and the Financial Statements shall be audited annually as required by the
          Societies Act (Alberta).
        </P>
        <P>
          <strong>13.02.2</strong> The auditor appointed by the Members at the AGM shall make such examination of the
          books, records and affairs of the RMLL as will enable him or her to report to the Members as to the
          financial condition of the RMLL at the AGM.
        </P>
        <P>
          <strong>13.02.3</strong> The auditor shall have access at all reasonable times to all records, documents,
          books, accounts and vouchers of the RMLL and is entitled to require from the RMLL Executive such
          information and explanations as may be necessary for the performance of his or her duties as the auditor.
        </P>

        <Sub id="13.03">CUSTODY AND USE OF THE SEAL</Sub>
        <Li letter="a">
          The RMLL Executive may adopt a seal which shall be the common seal of the RMLL.
        </Li>
        <Li letter="b">
          The common seal of the RMLL shall be under the control of the RMLL Executive and the person(s) responsible
          for its custody and use from time to time shall be determined by the RMLL Executive.
        </Li>

        <Sub id="13.04">AMENDMENTS TO BYLAWS</Sub>
        <P>
          <strong>13.04.1</strong> Subject to compliance with the requirements of the laws of the Province of Alberta,
          these Bylaws may be rescinded, altered or added to by a Special Resolution of the Members provided that
          notice to the Members of such Special Resolution has been given not less than twenty-one (21) days prior to
          the meeting at which it is intended to present such resolution and such Special Resolution, if passed by
          the Members, shall take effect upon approval of the Registrar of the Societies Act (Alberta).
        </P>

        <Sub id="13.05">ALA MEMBERSHIP</Sub>
        <P>The RMLL is a member of the ALA.</P>

        <Sub id="13.06">INSPECTION OF RECORDS</Sub>
        <P>
          <strong>13.06.1</strong> The Franchise Holders and Members have the right to inspect the books and records
          of the RMLL. The Franchise Holder and Members also have the right to obtain copies, at their expense, of
          the books and records of the RMLL. The RMLL shall produce the books and records for inspection within a
          reasonable time after being requested.
        </P>
        <P>
          <strong>13.06.2</strong> The RMLL Executive has the authority to require Franchise Holders and Members to
          provide their books and records for inspection by the RMLL. Such books and records shall be produced upon
          request of the RMLL and in any event not to exceed sixty (60) days after the request has been made.
        </P>

        <Sub id="13.07">SIGNING AUTHORITY</Sub>
        <P>
          All cheques shall be required to be signed by two members of the elected RMLL Executive members.
        </P>

        <Sub id="13.08">MEMBER FINANCES</Sub>
        <P>
          The RMLL is not responsible for the finances or debts of any Franchise Holder or Member.
        </P>

        <Sub id="13.09">DISSOLUTION</Sub>
        <P>The RMLL shall be dissolved upon Special Resolution of Members.</P>

        <Sub id="13.10">DISTRIBUTION OF ASSETS</Sub>
        <P>
          After the payment of all debts and liabilities of the RMLL, the remaining assets shall be transferred to
          such organizations with the same or similar objectives of the RMLL as determined by the dissolving Special
          Resolution or as may be otherwise required by law.
        </P>
      </BylawSection>
    </div>
  );
}
