import { useState, useEffect, useCallback } from 'react';
import { CalendarDays, MapPin, Clock, FileText, ExternalLink, Download, Loader2, RefreshCw } from 'lucide-react';
import { fetchDocuments, type Document } from '../../services/cms-api';

/* --- Document Matcher --- */
function findDocument(docs: Document[], ...keywords: string[]): Document | null {
  const lowerKeywords = keywords.map(k => k.toLowerCase());
  for (const doc of docs) {
    const title = doc.title.toLowerCase();
    const fileName = doc.file_name?.toLowerCase() || '';
    const allMatch = lowerKeywords.every(kw => title.includes(kw) || fileName.includes(kw));
    if (allMatch) return doc;
  }
  if (lowerKeywords.length > 0 && lowerKeywords[0].length > 6) {
    for (const doc of docs) {
      const title = doc.title.toLowerCase();
      const fileName = doc.file_name?.toLowerCase() || '';
      if (title.includes(lowerKeywords[0]) || fileName.includes(lowerKeywords[0])) return doc;
    }
  }
  return null;
}

/* --- Styled document link --- */
function CellLink({ doc, label, className = '' }: { doc: Document | null; label: string; className?: string }) {
  if (doc) {
    return (
      <a
        href={doc.file_url}
        target="_blank"
        rel="noopener noreferrer"
        className={`text-[#013fac] hover:text-blue-800 hover:underline transition-colors font-medium ${className}`}
      >
        {label}
      </a>
    );
  }
  return <span className={`text-gray-400 italic ${className}`}>{label}</span>;
}

/* --- Section header for table panels --- */
function TableHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-center py-3 px-4 bg-[#013fac]">
      <h4 className="text-base sm:text-lg font-bold text-white uppercase tracking-wider">
        {children}
      </h4>
    </div>
  );
}

export function PlanningMeetingAGMPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const docs = await fetchDocuments();
      setDocuments(docs);
    } catch (err) {
      console.error('Failed to fetch documents for Planning Meeting/AGM page:', err);
      setError('Could not load documents from library');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // --- Match documents ---
  const floorMap = findDocument(documents, 'floor', 'map') || findDocument(documents, 'atrium');

  const divisionAgendas: { label: string; keywords: string[][] }[] = [
    { label: 'ASL (Sr. B)', keywords: [['asl', 'agenda'], ['sr. b', 'agenda'], ['sr b', 'agenda'], ['senior b', 'agenda']] },
    { label: 'Sr. C', keywords: [['sr. c', 'agenda'], ['sr c', 'agenda'], ['senior c', 'agenda']] },
    { label: 'Jr. A', keywords: [['jr. a', 'agenda'], ['jr a', 'agenda'], ['junior a', 'agenda']] },
    { label: 'Jr. B Tier I', keywords: [['tier i', 'agenda'], ['tier 1', 'agenda'], ['jr. b tier i', 'agenda']] },
    { label: 'Jr. B Tier II', keywords: [['tier ii', 'agenda'], ['tier 2', 'agenda'], ['jr. b tier ii', 'agenda']] },
    { label: 'Major Female', keywords: [['female', 'agenda'], ['major female', 'agenda'], ['ladies', 'agenda']] },
  ];

  const getDivisionDoc = (entry: typeof divisionAgendas[0]): Document | null => {
    for (const kws of entry.keywords) {
      const doc = findDocument(documents, ...kws);
      if (doc) return doc;
    }
    return null;
  };

  const statsDoc = findDocument(documents, '2025', 'stats') || findDocument(documents, 'rmll', 'stats');
  const graduatingSummaries = findDocument(documents, 'graduating', 'summar');
  const minorBoxReg = findDocument(documents, 'minor', 'box', 'registration') || findDocument(documents, 'minor box');
  const u17Retention = findDocument(documents, 'u17', 'retention') || findDocument(documents, 'graduating', 'retention');

  const memberVotes = findDocument(documents, 'member', 'vote') || findDocument(documents, 'possible', 'vote');
  const treasurerReport = findDocument(documents, 'treasurer', 'report');
  const compilationReport = findDocument(documents, 'compilation') || findDocument(documents, 'engagement', 'report');
  const agmMinutes2024 = findDocument(documents, '2024', 'agm', 'minute') || findDocument(documents, 'agm', 'minute', '2024');
  const qbFinancials = findDocument(documents, 'qb', 'financials') || findDocument(documents, 'quickbooks') || findDocument(documents, 'ye financial');
  const memberReview = findDocument(documents, 'member', 'review');
  const budget2026 = findDocument(documents, '2026', 'budget') || findDocument(documents, 'budget', '2026');

  const presidentReport = findDocument(documents, 'president', 'report');
  const vpReport = findDocument(documents, 'vice president', 'report') || findDocument(documents, 'vp', 'report') || findDocument(documents, 'jr. a', 'commissioner', 'report');
  const edReport = findDocument(documents, 'executive director', 'report') || findDocument(documents, 'ed report');
  const aslReport = findDocument(documents, 'asl', 'report') || findDocument(documents, 'sr. b', 'commissioner', 'report');
  const presCupReport = findDocument(documents, "presidents'", 'cup') || findDocument(documents, 'president', 'cup', 'report');
  const srcReport = findDocument(documents, 'sr. c', 'commissioner', 'report') || findDocument(documents, 'sr c', 'report');
  const jrb1Report = findDocument(documents, 'tier i', 'commissioner', 'report') || findDocument(documents, 'jr. b tier i', 'report');
  const foundersCupReport = findDocument(documents, "founders'", 'cup') || findDocument(documents, 'founder', 'cup', 'report');
  const jrb2Report = findDocument(documents, 'tier ii', 'commissioner', 'report') || findDocument(documents, 'jr. b tier ii', 'report');
  const femaleReport = findDocument(documents, 'female', 'commissioner', 'report') || findDocument(documents, 'major female', 'report');
  const oicReport = findDocument(documents, 'oic', 'report') || findDocument(documents, 'official in charge', 'report');

  const planningMinutes = findDocument(documents, 'planning', 'meeting', 'minute') || findDocument(documents, '2025', 'planning', 'minute');

  const executiveReports = [
    { doc: presidentReport, label: 'President Report' },
    { doc: vpReport, label: 'Vice President and Jr. A Commissioner Report' },
    { doc: edReport, label: 'Executive Director Report' },
    { doc: aslReport, label: 'ASL (Sr. B) Commissioner Report' },
    { doc: presCupReport, label: "Presidents' Cup Report" },
    { doc: srcReport, label: 'Sr. C Commissioner Report' },
    { doc: jrb1Report, label: 'Jr. B Tier I Commissioner Report' },
    { doc: foundersCupReport, label: "Founders' Cup Report" },
    { doc: jrb2Report, label: 'Jr. B Tier II Commissioner Report' },
    { doc: femaleReport, label: 'Major Female Commissioner Report' },
    { doc: oicReport, label: 'OIC Report' },
  ];

  const minutesUrl = planningMinutes?.file_url || 'https://rockymountainlax.com/2025-planning-meeting-minutes/';

  return (
    <div className="space-y-8">
      {/* === Page Title === */}
      <div className="text-center py-2">
        <div className="flex items-center gap-4">
          <div className="flex-1 h-[2px] bg-[#013fac]"></div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 uppercase tracking-wide whitespace-nowrap">
            2026 Planning Meeting &amp; 2025 AGM Info
          </h2>
          <div className="flex-1 h-[2px] bg-[#013fac]"></div>
        </div>
      </div>

      {/* Document status */}
      {loading && (
        <div className="flex items-center justify-center gap-2 py-3 text-sm text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading documents from library...
        </div>
      )}
      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-sm text-amber-800 flex items-center gap-2">
          <span>⚠️ {error}</span>
          <button onClick={loadDocuments} className="ml-auto text-xs font-semibold text-amber-900 hover:underline">Retry</button>
        </div>
      )}
      {!loading && (
        <div className="flex justify-end">
          <button
            onClick={loadDocuments}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-[#013fac] transition-colors"
            title="Refresh documents"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh documents
          </button>
        </div>
      )}

      {/* === Overview Section === */}
      <div className="space-y-3">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
          RMLL Planning and 2025 Annual General Meeting
        </h3>

        <div className="space-y-2 text-sm text-gray-800">
          <p>
            <span className="font-semibold">Date:</span>{' '}
            Friday, November 14 (evening), Saturday, November 15 and Sunday, November 16, 2025
          </p>
          <p className="italic text-gray-600">
            Friday evening will be the Awards Social, Saturday the Division Planning Meetings and the 2025 AGM will be Sunday morning.
          </p>
          <p>
            <span className="font-semibold">Location:</span>{' '}
            Delta Hotel by Marriott Calgary South - Atrium Building - 135 Southland Drive S.E., Calgary
          </p>
          <p>
            <span className="font-semibold">Atrium Building Floor Map:</span>{' '}
            {floorMap ? (
              <a
                href={floorMap.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#013fac] font-semibold hover:underline inline-flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Download Floor Map
              </a>
            ) : (
              <span className="text-gray-400 italic">Not yet uploaded</span>
            )}
          </p>
        </div>
      </div>

      {/* === RMLL 2026 PLANNING MEETING === */}
      <div className="space-y-4">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
          RMLL 2026 Planning Meeting
        </h3>

        {/* Two-column panel: Agendas | Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 rounded-lg overflow-hidden border border-gray-200">
          {/* Left: Planning Meeting Agendas */}
          <div className="bg-white">
            <TableHeader>Planning Meeting Agendas</TableHeader>
            <div className="px-5 py-4 text-center space-y-3">
              <p className="text-sm text-gray-500 font-medium">RMLL Planning Meeting Agenda (Nov. 14 &amp; 15)</p>
              <div className="flex flex-col items-center gap-1.5">
                {divisionAgendas.map(entry => (
                  <CellLink key={entry.label} doc={getDivisionDoc(entry)} label={entry.label} className="text-sm" />
                ))}
              </div>
            </div>
            {/* Planning Minutes */}
            <div className="border-t border-gray-200 px-5 py-4 text-center space-y-2">
              <p className="text-sm text-gray-600">2025 Division Planning Meeting Minutes posted here:</p>
              <a
                href={minutesUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#013fac] text-white text-sm font-semibold rounded-lg hover:bg-blue-800 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                View 2025 Planning Meeting Minutes
              </a>
            </div>
          </div>

          {/* Right: Stats */}
          <div className="bg-white border-t md:border-t-0 md:border-l border-gray-200">
            <TableHeader>Stats</TableHeader>
            <div className="px-5 py-4 text-center space-y-3">
              <p className="text-sm text-gray-500 font-medium">RMLL Stats</p>
              <div className="flex flex-col items-center gap-1.5">
                <CellLink doc={statsDoc} label="2025 Stats" className="text-sm" />
                <CellLink doc={graduatingSummaries} label="Graduating Summaries" className="text-sm" />
                <CellLink doc={minorBoxReg} label="Minor Box Registration" className="text-sm" />
                <CellLink doc={u17Retention} label="Graduating U17 Retention" className="text-sm" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* === 2025 RMLL ANNUAL GENERAL MEETING === */}
      <div className="space-y-4">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
          2025 RMLL Annual General Meeting
        </h3>

        <div className="space-y-1 text-sm text-gray-800">
          <p><span className="font-semibold">Date:</span> Sunday, November 16, 2025</p>
          <p><span className="font-semibold">Location:</span> Delta Hotel by Marriott Calgary South - Atrium - Nakiska Ballroom</p>
          <p><span className="font-semibold">Time:</span> 9:30 A.M.</p>
        </div>

        {/* Two-column panel: AGM Agenda | Financial Review */}
        <div className="grid grid-cols-1 md:grid-cols-2 rounded-lg overflow-hidden border border-gray-200">
          {/* Left: AGM Agenda, Possible Member Votes, 2024 AGM Minutes */}
          <div className="bg-white">
            <TableHeader>2025 AGM Agenda</TableHeader>
            <div className="px-5 py-2 text-center text-sm text-gray-500 border-b border-gray-200">
              (November 16, 2025)
            </div>
            <div className="border-b border-gray-200 py-3 text-center">
              <CellLink doc={memberVotes} label="2025 Possible Member Votes" className="text-sm font-bold" />
            </div>
            <div className="py-3 text-center">
              <CellLink doc={agmMinutes2024} label="2024 AGM Minutes" className="text-sm font-bold" />
            </div>
          </div>

          {/* Right: Financial Review */}
          <div className="bg-white border-t md:border-t-0 md:border-l border-gray-200">
            <TableHeader>Financial Review</TableHeader>
            <div className="px-5 py-4 text-center">
              <div className="flex flex-col items-center gap-1.5">
                <CellLink doc={treasurerReport} label="Treasurer Report" className="text-sm" />
                <CellLink doc={compilationReport} label="Compilation Engagement Report" className="text-sm" />
                <CellLink doc={qbFinancials} label="2025 QB YE Financials" className="text-sm" />
                <CellLink doc={memberReview} label="Member Review" className="text-sm" />
                <CellLink doc={budget2026} label="2026 Budget" className="text-sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Executive Reports - full-width panel */}
        <div className="rounded-lg overflow-hidden border border-gray-200 bg-white">
          <TableHeader>Executive Reports</TableHeader>
          <div className="flex flex-col items-center gap-1.5 py-5 px-4">
            {executiveReports.map(({ doc, label }) => (
              <CellLink key={label} doc={doc} label={label} className="text-sm" />
            ))}
          </div>
        </div>
      </div>

      {/* === 2025 ELECTIONS === */}
      <div className="space-y-3">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 underline">
          2025 Elections
        </h3>
        <div className="text-sm text-gray-800 space-y-1 ml-1">
          <p>President</p>
          <p>Treasurer</p>
        </div>
      </div>

      {/* === BYLAW REFERENCES === */}
      <div className="space-y-5 border-t border-gray-200 pt-6">
        <div>
          <h4 className="font-bold text-gray-900 text-sm mb-2">
            8.05 <span className="underline">QUORUM</span>
          </h4>
          <p className="text-sm text-gray-700 leading-relaxed">
            A majority of the Members in Good Standing must be present in person to form a quorum at the AGM or any General or Special General Meeting. In the event that a quorum is not present within one (1) hour of the time given in the notice of the said meeting, the Chairperson of the meeting shall adjourn the meeting to a date, time and time not less than twenty-one (21) days from the date of the original meeting. The Executive Director shall give seven (7) days written notice to the Members of the date and place to which the meeting has been adjourned. A quorum for the adjourned meeting shall be those present.
          </p>
        </div>

        <div>
          <h4 className="font-bold text-gray-900 text-sm mb-2">
            8.06 <span className="underline">RIGHT AND OBLIGATION TO VOTE AT MEMBER'S MEETINGS</span>
          </h4>
          <p className="text-sm text-gray-700 mb-2">
            At each General, AGM, or Special General Meeting the voting rights are as follows:
          </p>
          <div className="ml-8 space-y-1 text-sm text-gray-700">
            <p>a) each Member shall have one (1) vote; and</p>
            <p>b) each member of the RMLL Executive shall have one (1) vote; unless the member of the RMLL Executive is voting on behalf of a Member, in which case that RMLL Executive member would not have a vote as a member of the RMLL Executive.</p>
          </div>
        </div>

        <div>
          <h4 className="font-bold text-gray-900 text-sm mb-2">
            8.07 <span className="underline">QUALIFICATIONS</span>
          </h4>
          <p className="text-sm text-gray-700 mb-2">
            In order for a Member to qualify for voting privileges at a meeting of Members, the Member must:
          </p>
          <div className="ml-8 space-y-1 text-sm text-gray-700">
            <p>a) have participated in the playing season immediately preceding the AGM;</p>
            <p>b) be a Member in Good Standing with the RMLL;</p>
            <p>c) be represented in person by the individual listed as its Primary or Secondary in its Franchise Certificate;</p>
            <p>d) each member has only one vote, which shall be cast by either the Primary or Secondary contact set forth in its Franchise Certificate; and</p>
            <p>e) no individual can be the Primary contact for more than one Member.</p>
          </div>
        </div>

        <div>
          <h4 className="font-bold text-gray-900 text-sm mb-2">
            8.08 <span className="underline">VOTING</span>
          </h4>
          <p className="text-sm text-gray-700 mb-2 leading-relaxed">
            At all meetings of the Members of the RMLL, except for matters that require approval by a Special Resolution, every question shall be decided by an Ordinary Resolution. Except as provided herein, every question shall be decided in the first instance by a show of hands unless a poll is demanded by a Member. Unless a poll is demanded, a declaration by the Chair of the meeting that a resolution has been carried or not carried and an entry to that effect in the minutes of the RMLL shall be sufficient evidence of the fact without proof of the number or proportion of the votes accorded in favor of or against such resolution.
          </p>
          <div className="ml-8 space-y-1 text-sm text-gray-700">
            <p>a) all elections for members of the RMLL Executive will be done by ballot</p>
            <p>b) no proxy voting is allowed; and</p>
            <p>c) with the exception of a tied vote, the President shall not vote. In the case of a tied vote, the President shall cast his vote as the deciding vote. In the event that the vote for the election of the President is tied, the Vice-President shall cast the deciding vote.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
