import jsPDF from 'jspdf';

/** Parse game clock time (e.g. "15:52", "4:58") to total seconds for sorting */
function parseClockTimeToSeconds(timeStr: string): number {
  if (!timeStr) return -1;
  const parts = timeStr.split(':').map(Number);
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 1 && !isNaN(parts[0])) {
    return parts[0] * 60;
  }
  return -1;
}

interface RosterPlayer {
  number: string;
  name: string;
  flag?: string;
  goals: { period: number; time: string }[];
  assists: number;
  points: number;
  penaltyMinutes?: number;
  isInHome?: boolean;
  servingSuspension?: boolean;
  suspensionNote?: string;
}

interface Penalty {
  period: number;
  playerNumber: string;
  playerName: string;
  offence: string;
  minutes: number;
  startTime: string;
  finishTime: string;
}

interface GoalieDisplay {
  number: string;
  name: string;
  period1: number;
  period2: number;
  period3: number;
  ot: number;
  totalSaves: number;
  totalShots: number;
}

interface TeamStats {
  shots: number;
  saves: number;
  savePercentage: number;
  powerPlays: string;
  penalties: number;
  penaltyMinutes: number;
}

interface CoachingStaff {
  headCoach: string;
  assistantCoaches: string[];
  trainer: string;
  manager: string;
}

interface PeriodScore {
  period: string;
  homeScore: number;
  awayScore: number;
}

interface OfficialInfo {
  role: string;
  name: string;
  number: string;
  signOffTimestamp?: string;
}

interface ScoringDetail {
  period: number;
  time: string;
  scorerNum: string;
  a1Num: string;
  a2Num: string;
  type: string;
  isHome: boolean;
}

interface GoalieEntry {
  number: string;
  name: string;
  periodIn: number;
  timeIn: string;
  periodOut: number;
  timeOut: string;
  minsPlayed: string;
  shots: number;
  saves: number;
}

export interface GameSheetPDFData {
  gameNumber: string | number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  date: string;
  time: string;
  venue: string;
  division: string;
  status: string;
  homeRoster: RosterPlayer[];
  awayRoster: RosterPlayer[];
  homePenalties: Penalty[];
  awayPenalties: Penalty[];
  homeGoalies: GoalieDisplay[];
  awayGoalies: GoalieDisplay[];
  homeStats: TeamStats;
  awayStats: TeamStats;
  homeCoaching: CoachingStaff;
  awayCoaching: CoachingStaff;
  periodScores: PeriodScore[];
  homeLogo?: string;
  awayLogo?: string;
  rmllLogo?: string;
  officials?: OfficialInfo[];
  officialScorerName?: string;
  officialGameTimerName?: string;
  officialShotTimerName?: string;
  officialAlternateRefereeName?: string;
  gameStartTime?: string;
  gameEndTime?: string;
  timeOuts?: { period: number; timeOnClock: string; isHome: boolean }[];
  suspendedPlayers?: { number: string; name: string; team: string; note: string }[];
  scoringDetails?: ScoringDetail[];
  homeGoalieEntries?: GoalieEntry[];
  awayGoalieEntries?: GoalieEntry[];
}

async function imgToB64(url: string): Promise<string | null> {
  if (!url) return null;
  try {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const ctx = c.getContext('2d');
        if (ctx) { ctx.drawImage(img, 0, 0); resolve(c.toDataURL('image/png')); }
        else resolve(null);
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  } catch { return null; }
}

function trunc(doc: jsPDF, text: string, maxW: number): string {
  if (!text) return '';
  if (doc.getTextWidth(text) <= maxW) return text;
  let t = text;
  while (doc.getTextWidth(t + '..') > maxW && t.length > 1) t = t.slice(0, -1);
  return t + '..';
}

export async function exportGameSheetPDF(data: GameSheetPDFData): Promise<void> {
  const [rmllB64, homeLogoB64, awayLogoB64] = await Promise.all([
    data.rmllLogo ? imgToB64(data.rmllLogo) : null,
    data.homeLogo ? imgToB64(data.homeLogo) : null,
    data.awayLogo ? imgToB64(data.awayLogo) : null,
  ]);

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' });
  const PW = 279.4;
  const PH = 215.9;
  const M = 3;

  // ── Layout constants ──
  const sideW = 97;
  const centerW = PW - 2 * M - 2 * sideW;
  const LX = M;
  const CX = M + sideW;
  const RX = M + sideW + centerW;

  // ── Palette ──
  type C3 = [number, number, number];
  const BLK: C3 = [0, 0, 0];
  const NAVY: C3 = [1, 23, 65];
  const RED: C3 = [190, 0, 0];
  const WHT: C3 = [255, 255, 255];
  const LTGRAY: C3 = [245, 245, 245];
  const MGRAY: C3 = [200, 200, 200];
  const DKGRAY: C3 = [100, 100, 100];
  const CRIM: C3 = [165, 28, 48];       // Crimson accent for totals
  const NAVYLT: C3 = [20, 50, 100];     // Lighter navy for sub-headers

  // ── Shorthand ──
  const setC = (c: C3) => doc.setTextColor(...c);
  const setF = (c: C3) => doc.setFillColor(...c);
  const setD = (c: C3) => doc.setDrawColor(...c);
  const bold = () => doc.setFont('helvetica', 'bold');
  const norm = () => doc.setFont('helvetica', 'normal');
  const ital = () => doc.setFont('helvetica', 'italic');
  const sz = (s: number) => doc.setFontSize(s);
  const hLine = (x1: number, y1: number, x2: number) => { doc.line(x1, y1, x2, y1); };

  // ════════════════════════════════════════════════════════
  //  HEADER BAND — matches physical gamesheet
  // ════════════════════════════════════════════════════════
  let y = M;
  const hdrH = 10;

  // HOME header — thin top row with "Verification" left, "HOME" center, "COLOUR:" right
  setD(BLK); doc.setLineWidth(0.4);
  doc.rect(LX, y, sideW, hdrH);
  sz(4); ital(); setC(DKGRAY);
  doc.text('Verification', LX + 1.5, y + 3);
  sz(3.5); doc.text('Team Rep Signature', LX + 1.5, y + 5.5);
  // Signature line
  setD(BLK); doc.setLineWidth(0.15);
  hLine(LX + 1.5, y + 8, LX + 28);
  // HOME label
  sz(12); bold(); setC(BLK);
  doc.text('HOME', LX + sideW / 2, y + 6.5, { align: 'center' });
  if (homeLogoB64) {
    try { doc.addImage(homeLogoB64, 'PNG', LX + sideW / 2 - 18, y + 1, 8, 8); } catch {}
  }

  // CENTER header
  setD(BLK); doc.setLineWidth(0.4);
  doc.rect(CX, y, centerW, hdrH);
  // RMLL logo centered
  if (rmllB64) {
    try { doc.addImage(rmllB64, 'PNG', CX + centerW / 2 - 4.5, y + 0.5, 9, 9); } catch {}
  } else {
    sz(10); bold(); setC(NAVY);
    doc.text('RMLL', CX + centerW / 2, y + 6.5, { align: 'center' });
  }
  // Game No box — top right of center
  sz(5); bold(); setC(BLK);
  doc.text('GAME', CX + centerW - 22, y + 3.5);
  doc.text('NO.', CX + centerW - 22, y + 6.5);
  setD(BLK); doc.setLineWidth(0.3);
  doc.rect(CX + centerW - 16, y + 1, 14, 8);
  sz(9); bold(); setC(RED);
  doc.text(String(data.gameNumber), CX + centerW - 9, y + 7, { align: 'center' });

  // VISITOR header
  setD(BLK); doc.setLineWidth(0.4);
  doc.rect(RX, y, sideW, hdrH);
  sz(4); ital(); setC(DKGRAY);
  doc.text('Verification', RX + sideW - 22, y + 3);
  sz(3.5); doc.text('Team Rep Signature', RX + sideW - 28, y + 5.5);
  hLine(RX + sideW - 28, y + 8, RX + sideW - 2);
  sz(12); bold(); setC(BLK);
  doc.text('VISITOR', RX + sideW / 2, y + 6.5, { align: 'center' });
  if (awayLogoB64) {
    try { doc.addImage(awayLogoB64, 'PNG', RX + sideW / 2 + 10, y + 1, 8, 8); } catch {}
  }

  y += hdrH;

  // ════════════════════════════════════════════════════════
  //  ROSTER + GOALS (side by side within each side column)
  // ════════════════════════════════════════════════════════
  const rosterY = y;
  const rowH = 3.6;
  const maxRows = 20;

  // Roster portion column widths (left half of side column)
  const flagW = 7;   // Flag column (G, C, A, AP, IN)
  const nameW = 38;  // PLAYERS (First & Last) column
  const noW = 7;     // No. column
  const rosterPartW = flagW + nameW + noW; // ~52mm

  // Goals portion column widths (right half of side column)
  const goalPartW = sideW - rosterPartW; // ~45mm
  const gPerW = 6;
  const gTimeW = 10;
  const gGW = 6;
  const gA1W = 6;
  const gA2W = 6;
  const gTypeW = goalPartW - gPerW - gTimeW - gGW - gA1W - gA2W; // remainder ~11mm

  function drawRosterAndGoals(
    roster: RosterPlayer[],
    scoringDetails: ScoringDetail[],
    isHome: boolean,
    sx: number,
    teamName: string,
    logoB64: string | null,
    totalScore: number
  ): number {
    let ry = rosterY;
    const gx = sx + rosterPartW; // absolute x where goals section starts

    // ── Top header row: ROSTER label left, GOALS label right ──
    const topH = 4;
    setD(BLK); doc.setLineWidth(0.3);
    doc.rect(sx, ry, rosterPartW, topH);
    doc.rect(gx, ry, goalPartW, topH);
    // ROSTER header
    setF(NAVY); doc.rect(sx, ry, rosterPartW, topH, 'F');
    setC(WHT); sz(5); bold();
    doc.text('ROSTER', sx + rosterPartW / 2, ry + 2.8, { align: 'center' });
    // GOALS header (dark bg)
    setF(CRIM); doc.rect(gx, ry, goalPartW, topH, 'F');
    setC(WHT); sz(5); bold();
    doc.text('GOALS', gx + goalPartW / 2, ry + 2.8, { align: 'center' });
    ry += topH;

    // ── Sub-header row: Flag | PLAYERS (First & Last) | No. || PER | TIME | G | A1 | A2 | Type ──
    const subH = 3.5;
    setF(WHT); setD(BLK); doc.setLineWidth(0.2);
    doc.rect(sx, ry, rosterPartW, subH);
    setF(LTGRAY); doc.rect(gx, ry, goalPartW, subH, 'F');
    setD(BLK); doc.rect(gx, ry, goalPartW, subH);

    sz(3.5); bold(); setC(BLK);
    // Roster sub-headers
    doc.text('POS', sx + flagW / 2, ry + 2.5, { align: 'center' });
    doc.text('PLAYERS (First & Last)', sx + flagW + 1, ry + 2.5);
    doc.text('No.', sx + flagW + nameW + noW / 2, ry + 2.5, { align: 'center' });
    // Vertical lines for roster sub-cols
    doc.line(sx + flagW, ry, sx + flagW, ry + subH);
    doc.line(sx + flagW + nameW, ry, sx + flagW + nameW, ry + subH);

    // Goals sub-headers
    let gcx = gx;
    const goalColWidths = [gPerW, gTimeW, gGW, gA1W, gA2W, gTypeW];
    const goalLabels = ['PER', 'TIME', 'G', 'A1', 'A2', 'Type'];
    goalLabels.forEach((lbl, i) => {
      doc.text(lbl, gcx + goalColWidths[i] / 2, ry + 2.5, { align: 'center' });
      if (i < goalLabels.length - 1) {
        doc.line(gcx + goalColWidths[i], ry, gcx + goalColWidths[i], ry + subH);
      }
      gcx += goalColWidths[i];
    });
    ry += subH;

    // ── Data rows ──
    const players = roster.slice(0, maxRows);
    // Collect and sort goals for this team
    const teamGoals = scoringDetails
      .filter(g => g.isHome === isHome)
      .sort((a, b) => {
        if (a.period !== b.period) return a.period - b.period;
        return parseClockTimeToSeconds(b.time) - parseClockTimeToSeconds(a.time);
      });

    for (let i = 0; i < maxRows; i++) {
      const isEven = i % 2 === 0;
      // Roster cell background
      if (isEven) { setF(WHT); } else { setF(LTGRAY); }
      doc.rect(sx, ry, rosterPartW, rowH, 'F');
      // Goals cell background
      if (isEven) { setF(WHT); } else { setF(LTGRAY); }
      doc.rect(gx, ry, goalPartW, rowH, 'F');

      setD(MGRAY); doc.setLineWidth(0.06);
      doc.rect(sx, ry, sideW, rowH);
      // Vertical dividers — roster
      doc.line(sx + flagW, ry, sx + flagW, ry + rowH);
      doc.line(sx + flagW + nameW, ry, sx + flagW + nameW, ry + rowH);
      doc.line(gx, ry, gx, ry + rowH); // main divider between roster and goals
      // Vertical dividers — goals
      let gdx = gx;
      for (let j = 0; j < goalColWidths.length - 1; j++) {
        gdx += goalColWidths[j];
        doc.line(gdx, ry, gdx, ry + rowH);
      }

      // LEFT SIDE: Player roster
      if (i < players.length) {
        const p = players[i];
        // Flag column
        if (p.flag) {
          sz(4); bold();
          setC(p.flag === 'GL' || p.flag === 'G' ? BLK : p.flag === 'C' || p.flag === 'A' ? NAVY : p.flag === 'AP' ? RED : p.flag === 'IN' ? RED : DKGRAY);
          doc.text(p.flag, sx + flagW / 2, ry + 2.6, { align: 'center' });
        }
        // Player name
        norm(); sz(4); setC(BLK);
        doc.text(trunc(doc, p.name, nameW - 2), sx + flagW + 1, ry + 2.6);
        // Jersey number
        bold(); sz(4.5);
        doc.text(p.number, sx + flagW + nameW + noW / 2, ry + 2.6, { align: 'center' });
      }

      // RIGHT SIDE: Goal entries
      if (i < teamGoals.length) {
        const goal = teamGoals[i];
        let gdx2 = gx;
        sz(4); norm(); setC(BLK);
        doc.text(String(goal.period), gdx2 + gPerW / 2, ry + 2.6, { align: 'center' }); gdx2 += gPerW;
        doc.text(goal.time || '', gdx2 + gTimeW / 2, ry + 2.6, { align: 'center' }); gdx2 += gTimeW;
        bold(); setC(RED); sz(4.5);
        doc.text(goal.scorerNum, gdx2 + gGW / 2, ry + 2.6, { align: 'center' }); gdx2 += gGW;
        norm(); setC(BLK); sz(4);
        doc.text(goal.a1Num || '', gdx2 + gA1W / 2, ry + 2.6, { align: 'center' }); gdx2 += gA1W;
        doc.text(goal.a2Num || '', gdx2 + gA2W / 2, ry + 2.6, { align: 'center' }); gdx2 += gA2W;
        if (goal.type) {
          sz(3.5); bold(); setC(DKGRAY);
          doc.text(goal.type, gdx2 + gTypeW / 2, ry + 2.6, { align: 'center' });
        }
      }
      ry += rowH;
    }

    // ── Footer: "Total Players on Bench" + Total Goals ──
    setF(NAVY); doc.rect(sx, ry, sideW, 5, 'F');
    setD(BLK); doc.setLineWidth(0.3);
    doc.rect(sx, ry, sideW, 5);
    sz(4.5); bold(); setC(WHT);
    doc.text('Total Players on Bench:', sx + 2, ry + 3.2);
    sz(6); bold(); setC(WHT);
    doc.text(String(roster.length), sx + 42, ry + 3.5);
    // Total Goals on the right side
    sz(4.5); setC(WHT);
    doc.text('Total Goals:', sx + sideW - 28, ry + 3.2);
    sz(7); bold(); setC(WHT);
    doc.text(String(totalScore), sx + sideW - 5, ry + 3.5, { align: 'right' });

    ry += 5;
    return ry;
  }

  const allScoringDetails = data.scoringDetails || [];
  const homeEnd = drawRosterAndGoals(data.homeRoster, allScoringDetails, true, LX, data.homeTeam, homeLogoB64, data.homeScore);
  const awayEnd = drawRosterAndGoals(data.awayRoster, allScoringDetails, false, RX, data.awayTeam, awayLogoB64, data.awayScore);

  // ════════════════════════════════════════════════════════
  //  CENTER COLUMN
  // ════════════════════════════════════════════════════════
  let cy = rosterY;
  const cp = 1; // center padding
  const cx = CX + cp;
  const cw = centerW - 2 * cp;

  // ── Instructions ──
  sz(3.5); bold(); setC(RED);
  doc.text('\u2022 PRINT ALL ENTRIES LEGIBLY', cx + 1, cy + 2.5);
  doc.text('\u2022 INDICATE CAPTAIN, 2 ALTERNATES, GOALIES, AND AFFILIATE PLAYERS (AP)', cx + 1, cy + 5);
  doc.text('\u2022 GOAL TYPES: Shorthanded - SH, Power Play - PP', cx + 1, cy + 7.5);
  cy += 9;

  // ── Game Info Box ──
  setD(BLK); doc.setLineWidth(0.3);
  const infoBoxH = 16;
  doc.rect(cx, cy, cw, infoBoxH);

  const infoFields = [
    { lbl: 'HOME', val: data.homeTeam, lbl2: 'VISITOR', val2: data.awayTeam },
    { lbl: 'DATE', val: data.date, lbl2: 'TIME', val2: data.time },
    { lbl: 'ARENA', val: data.venue, lbl2: 'LEVEL', val2: data.division },
  ];
  infoFields.forEach((row, i) => {
    const fy = cy + 2.5 + i * 4.5;
    sz(4); bold(); setC(BLK);
    doc.text(row.lbl, cx + 2, fy);
    norm(); setC(RED); sz(4.5);
    doc.text(trunc(doc, row.val, cw * 0.3), cx + 14, fy);
    bold(); setC(BLK); sz(4);
    doc.text(row.lbl2, cx + cw * 0.52, fy);
    norm(); setC(RED); sz(4.5);
    doc.text(trunc(doc, row.val2, cw * 0.3), cx + cw * 0.68, fy);
    if (i < infoFields.length - 1) {
      setD(MGRAY); doc.setLineWidth(0.06);
      hLine(cx + 1, fy + 2, cx + cw - 1);
    }
  });
  cy += infoBoxH + 0.3;

  // ── Referees Section ──
  const officials = data.officials || [];
  const refLabels = ['1st REFEREE', '2nd REFEREE', '3rd REFEREE'];
  const refRowH = 8;

  for (let i = 0; i < 3; i++) {
    setD(BLK); doc.setLineWidth(0.2);
    doc.rect(cx, cy, cw, refRowH);

    const ref = officials[i];
    const leftHalf = cw / 2;

    sz(4); bold(); setC(BLK);
    doc.text(refLabels[i], cx + 2, cy + 2.5);

    // Print Name label + value
    sz(3.5); ital(); setC(DKGRAY);
    doc.text('Print Name', cx + 2, cy + 5);
    if (ref) {
      sz(4.5); norm(); setC(BLK);
      doc.text(trunc(doc, ref.name, leftHalf - 20), cx + 16, cy + 5);
    }

    // Sign-off timestamp
    sz(3.5); ital(); setC(DKGRAY);
    doc.text('Signed Off', cx + 2, cy + 7.2);
    if (ref && ref.signOffTimestamp) {
      sz(4); norm(); setC(NAVY);
      doc.text(ref.signOffTimestamp, cx + 16, cy + 7.2);
    } else {
      sz(3.5); ital(); setC(MGRAY);
      doc.text('\u2014 Not signed \u2014', cx + 16, cy + 7.2);
    }

    // Referee Number
    sz(3.5); ital(); setC(DKGRAY);
    doc.text('Referee Number', cx + leftHalf + 2, cy + 2.5);
    if (ref && ref.number) {
      sz(6); bold(); setC(BLK);
      doc.text(String(ref.number), cx + leftHalf + 2, cy + 6.5);
    }
    // Number box
    setD(BLK); doc.setLineWidth(0.2);
    doc.rect(cx + leftHalf, cy + 3.5, leftHalf - 2, 4);

    // Divider
    doc.line(cx + leftHalf, cy, cx + leftHalf, cy + refRowH);

    cy += refRowH;
  }

  // ── Alternate Referee (if provided) ──
  if (data.officialAlternateRefereeName) {
    const altRefH = 5;
    setD(BLK); doc.setLineWidth(0.2);
    doc.rect(cx, cy, cw, altRefH);
    sz(4); bold(); setC(BLK);
    doc.text('ALT. REFEREE', cx + 2, cy + 2.5);
    sz(3.5); ital(); setC(DKGRAY);
    doc.text('Print Name', cx + 2, cy + 4.5);
    norm(); sz(4.5); setC(BLK);
    doc.text(trunc(doc, data.officialAlternateRefereeName, cw - 8), cx + 16, cy + 4.5);
    cy += altRefH;
  }

  // ── Additional Officials (OFF. SCORER, 30 SEC. TIMER, GAME TIMER) ──
  const addlOfficialH = 4;
  const addlOfficialsData: [string, string][] = [
    ['OFF. SCORER', data.officialScorerName || ''],
    ['30 SEC. TIMER', data.officialShotTimerName || ''],
    ['GAME TIMER', data.officialGameTimerName || ''],
  ];
  addlOfficialsData.forEach(([lbl, name]) => {
    setD(BLK); doc.setLineWidth(0.15);
    doc.rect(cx, cy, cw, addlOfficialH);
    sz(3.5); bold(); setC(BLK);
    doc.text(lbl, cx + 2, cy + 2.8);
    if (name) {
      norm(); sz(4); setC(RED);
      doc.text(trunc(doc, name, cw - 26), cx + 22, cy + 2.8);
    } else {
      // Blank line for name
      setD(MGRAY); doc.setLineWidth(0.1);
      hLine(cx + 22, cy + 2.8, cx + cw - 2);
    }
    cy += addlOfficialH;
  });

  // ── Game Time ──
  setF(NAVY); doc.rect(cx, cy, cw, 4, 'F');
  setC(WHT); sz(5.5); bold();
  doc.text('GAME TIME', cx + cw / 2, cy + 2.8, { align: 'center' });
  cy += 4;

  setD(BLK); doc.setLineWidth(0.2);
  doc.rect(cx, cy, cw, 6);
  const halfCW = cw / 2;
  doc.line(cx + halfCW, cy, cx + halfCW, cy + 6);
  sz(4.5); bold(); setC(BLK);
  doc.text('STARTED', cx + 3, cy + 3);
  doc.text('ENDED', cx + halfCW + 3, cy + 3);
  norm(); setC(RED); sz(5);
  doc.text(data.gameStartTime || data.time || '', cx + 20, cy + 3);
  doc.text(data.gameEndTime || '', cx + halfCW + 16, cy + 3);
  cy += 6 + 0.3;

  // ── Suspensions ──
  setF(NAVY); doc.rect(cx, cy, cw, 3.5, 'F');
  setC(WHT); sz(5); bold();
  doc.text('SUSPENSIONS', cx + cw / 2, cy + 2.5, { align: 'center' });
  cy += 3.5;

  const suspPlayers = data.suspendedPlayers || [];
  if (suspPlayers.length > 0) {
    suspPlayers.forEach((sp, idx) => {
      if (idx % 2 === 0) { setF(WHT); } else { setF(LTGRAY); }
      setD(MGRAY); doc.setLineWidth(0.06);
      doc.rect(cx, cy, cw, 3.5, 'FD');
      sz(4); bold(); setC(BLK);
      doc.text(`#${sp.number}`, cx + 2, cy + 2.5);
      norm(); sz(3.5);
      doc.text(trunc(doc, sp.name, cw * 0.3), cx + 10, cy + 2.5);
      setC(DKGRAY); sz(3);
      doc.text(trunc(doc, sp.note, cw * 0.35), cx + cw * 0.5, cy + 2.5);
      cy += 3.5;
    });
  } else {
    setD(BLK); doc.setLineWidth(0.15);
    doc.rect(cx, cy, cw, 5);
    sz(3.5); ital(); setC(DKGRAY);
    doc.text('(None Reported)', cx + cw / 2, cy + 3.2, { align: 'center' });
    cy += 5;
  }
  cy += 0.3;

  // ── Bench Personnel ──
  setF(NAVY); doc.rect(cx, cy, cw, 3.5, 'F');
  setC(WHT); sz(5); bold();
  doc.text('Bench Personnel', cx + cw / 2, cy + 2.5, { align: 'center' });
  cy += 3.5;

  // Table header
  const roleW = cw * 0.22;
  const teamColW = (cw - roleW) / 2;
  setF(LTGRAY); setD(BLK); doc.setLineWidth(0.15);
  doc.rect(cx, cy, cw, 3, 'F');
  doc.rect(cx, cy, cw, 3);
  doc.line(cx + roleW, cy, cx + roleW, cy + 3);
  doc.line(cx + roleW + teamColW, cy, cx + roleW + teamColW, cy + 3);
  sz(4); bold(); setC(BLK);
  doc.text('', cx + roleW / 2, cy + 2.2, { align: 'center' }); // role col header (blank like screenshot)
  doc.text('HOME', cx + roleW + teamColW / 2, cy + 2.2, { align: 'center' });
  doc.text('AWAY', cx + roleW + teamColW + teamColW / 2, cy + 2.2, { align: 'center' });
  cy += 3;

  // Build bench rows — flat coach list, no "Head Coach" label
  const benchRows: [string, string, string][] = [];
  const homeStaff = (data.homeCoaching as any).allStaff || [];
  const awayStaff = (data.awayCoaching as any).allStaff || [];

  if (homeStaff.length > 0 || awayStaff.length > 0) {
    const roles = ['COACH', 'TRAINER', 'MANAGER'];
    roles.forEach((role: string) => {
      const homeForRole = homeStaff.filter((s: any) => s.role === role);
      const awayForRole = awayStaff.filter((s: any) => s.role === role);
      const maxForRole = Math.max(homeForRole.length, awayForRole.length);
      for (let i = 0; i < maxForRole; i++) {
        benchRows.push([role, homeForRole[i]?.name || '', awayForRole[i]?.name || '']);
      }
    });
    const otherHome = homeStaff.filter((s: any) => !['COACH', 'TRAINER', 'MANAGER'].includes(s.role));
    const otherAway = awayStaff.filter((s: any) => !['COACH', 'TRAINER', 'MANAGER'].includes(s.role));
    const maxOther = Math.max(otherHome.length, otherAway.length);
    for (let i = 0; i < maxOther; i++) {
      benchRows.push([otherHome[i]?.role || otherAway[i]?.role || 'STAFF', otherHome[i]?.name || '', otherAway[i]?.name || '']);
    }
  } else {
    const allHomeCoaches = [data.homeCoaching.headCoach, ...data.homeCoaching.assistantCoaches].filter(c => c && c !== 'TBD');
    const allAwayCoaches = [data.awayCoaching.headCoach, ...data.awayCoaching.assistantCoaches].filter(c => c && c !== 'TBD');
    const maxCoaches = Math.max(allHomeCoaches.length, allAwayCoaches.length, 1);
    for (let i = 0; i < maxCoaches; i++) {
      benchRows.push(['COACH', allHomeCoaches[i] || '', allAwayCoaches[i] || '']);
    }
    if (data.homeCoaching.trainer || data.awayCoaching.trainer) {
      benchRows.push(['TRAINER', data.homeCoaching.trainer || '', data.awayCoaching.trainer || '']);
    }
    if (data.homeCoaching.manager || data.awayCoaching.manager) {
      benchRows.push(['MANAGER', data.homeCoaching.manager || '', data.awayCoaching.manager || '']);
    }
  }
  while (benchRows.length < 4) benchRows.push(['', '', '']);

  const benchRH = 3.2;
  benchRows.forEach((row, idx) => {
    if (idx % 2 === 0) { setF(WHT); } else { setF(LTGRAY); }
    setD(MGRAY); doc.setLineWidth(0.06);
    doc.rect(cx, cy, cw, benchRH, 'FD');
    doc.line(cx + roleW, cy, cx + roleW, cy + benchRH);
    doc.line(cx + roleW + teamColW, cy, cx + roleW + teamColW, cy + benchRH);
    sz(3.5); bold(); setC(BLK);
    doc.text(row[0], cx + 1.5, cy + 2.3);
    norm(); setC(RED); sz(3.5);
    doc.text(trunc(doc, row[1], teamColW - 3), cx + roleW + 1.5, cy + 2.3);
    doc.text(trunc(doc, row[2], teamColW - 3), cx + roleW + teamColW + 1.5, cy + 2.3);
    cy += benchRH;
  });

  // Total on Bench row
  setD(BLK); doc.setLineWidth(0.15);
  doc.rect(cx, cy, cw, 3);
  doc.line(cx + roleW, cy, cx + roleW, cy + 3);
  doc.line(cx + roleW + teamColW, cy, cx + roleW + teamColW, cy + 3);
  sz(3.5); bold(); setC(BLK);
  doc.text('Total on Bench', cx + 1.5, cy + 2.2);
  sz(4); setC(RED);
  const homeBenchCount = ((data.homeCoaching as any).allStaff || []).length || [data.homeCoaching.headCoach, ...data.homeCoaching.assistantCoaches, data.homeCoaching.trainer, data.homeCoaching.manager].filter(c => c && c !== 'TBD').length;
  const awayBenchCount = ((data.awayCoaching as any).allStaff || []).length || [data.awayCoaching.headCoach, ...data.awayCoaching.assistantCoaches, data.awayCoaching.trainer, data.awayCoaching.manager].filter(c => c && c !== 'TBD').length;
  doc.text(String(homeBenchCount), cx + roleW + teamColW / 2, cy + 2.2, { align: 'center' });
  doc.text(String(awayBenchCount), cx + roleW + teamColW + teamColW / 2, cy + 2.2, { align: 'center' });
  cy += 3;

  // ── Referee Report ──
  const refReportAvail = PH - M - 0.5 - cy; // remaining space estimate
  if (cy < rosterY + 130) { // only if space
    setF(NAVY); doc.rect(cx, cy, cw, 3.5, 'F');
    setC(WHT); sz(4.5); bold();
    doc.text('Referee Report', cx + cw / 2, cy + 2.5, { align: 'center' });
    cy += 3.5;
    // A few lines for writing
    const rptH = Math.min(12, Math.max(homeEnd, awayEnd) - cy);
    if (rptH > 0) {
      setD(BLK); doc.setLineWidth(0.15);
      doc.rect(cx, cy, cw, rptH);
      for (let i = 1; i < 4; i++) {
        setD(MGRAY); doc.setLineWidth(0.06);
        hLine(cx + 1, cy + i * 3, cx + cw - 1);
      }
      cy += rptH;
    }
  }

  // ════════════════════════════════════════════════════════
  //  PENALTIES SECTION (full width, two halves)
  // ════════════════════════════════════════════════════════
  const penY = Math.max(homeEnd, awayEnd, cy) + 0.5;
  const penGap = 3;
  const penW = (PW - 2 * M - penGap) / 2;
  const penRX = M + penW + penGap;

  function drawPenalties(penalties: Penalty[], stats: TeamStats, sx: number, w: number, label: string, logoB64: string | null): number {
    let py = penY;

    // Header
    setF(NAVY); doc.rect(sx, py, w, 4, 'F');
    setC(WHT); sz(5.5); bold();
    doc.text(`PENALTIES`, sx + 3, py + 2.8);
    py += 4;

    // Column headers
    setF(LTGRAY); setD(BLK); doc.setLineWidth(0.15);
    doc.rect(sx, py, w, 3.5, 'F');
    doc.rect(sx, py, w, 3.5);
    sz(4); bold(); setC(BLK);
    doc.text('PER', sx + 5, py + 2.5, { align: 'center' });
    doc.text('No.', sx + 12, py + 2.5, { align: 'center' });
    doc.text('NAME', sx + 20, py + 2.5);
    doc.text('OFFENCE', sx + 45, py + 2.5);
    doc.text('MIN.', sx + w - 26, py + 2.5, { align: 'center' });
    doc.text('START', sx + w - 15, py + 2.5, { align: 'center' });
    doc.text('FINISH', sx + w - 5, py + 2.5, { align: 'center' });
    py += 3.5;

    const penRowH = 3.3;
    const maxPen = 12;
    for (let i = 0; i < maxPen; i++) {
      if (i % 2 === 0) { setF(WHT); } else { setF(LTGRAY); }
      doc.rect(sx, py, w, penRowH, 'F');
      setD(MGRAY); doc.setLineWidth(0.06); doc.rect(sx, py, w, penRowH);

      if (i < penalties.length) {
        const p = penalties[i];
        sz(4); setC(BLK); norm();
        doc.text(String(p.period), sx + 5, py + 2.4, { align: 'center' });
        bold(); doc.text(p.playerNumber, sx + 12, py + 2.4, { align: 'center' });
        norm(); doc.text(trunc(doc, p.playerName, 22), sx + 20, py + 2.4);
        doc.text(trunc(doc, p.offence, 22), sx + 45, py + 2.4);
        doc.text(String(p.minutes), sx + w - 26, py + 2.4, { align: 'center' });
        doc.text(p.startTime, sx + w - 15, py + 2.4, { align: 'center' });
        doc.text(p.finishTime, sx + w - 5, py + 2.4, { align: 'center' });
      }
      py += penRowH;
    }

    // Footer — Total PIM summary
    setF(NAVY); doc.rect(sx, py, w, 5, 'F');
    setD(BLK); doc.setLineWidth(0.3);
    doc.rect(sx, py, w, 5);
    sz(5); bold(); setC(WHT);
    doc.text('Total PIM:', sx + 3, py + 3.2);
    sz(7); bold(); setC(WHT);
    doc.text(String(stats.penaltyMinutes), sx + 24, py + 3.5);
    sz(4.5); norm(); setC(WHT);
    doc.text(`(${stats.penalties} infractions)`, sx + 38, py + 3.2);

    return py + 5;
  }

  const penLE = drawPenalties(data.homePenalties, data.homeStats, M, penW, 'HOME', homeLogoB64);
  const penRE = drawPenalties(data.awayPenalties, data.awayStats, penRX, penW, 'VISITOR', awayLogoB64);

  // ════════════════════════════════════════════════════════
  //  BOTTOM: GOALIE STATS + SUMMARY (three columns)
  // ════════════════════════════════════════════════════════
  const botY = Math.max(penLE, penRE) + 0.5;
  const botGap = 1.5;
  const sumW2 = 60; // center summary width
  const goalieW = (PW - 2 * M - sumW2 - 2 * botGap) / 2;
  const botCX2 = M + goalieW + botGap;
  const botRX2 = M + goalieW + botGap + sumW2 + botGap;

  // ── Home Goalie Stats ──
  function drawGoalieStats(entries: GoalieEntry[], sx: number, w: number, label: string) {
    let gy = botY;
    setF(NAVY); doc.rect(sx, gy, w, 3.5, 'F');
    setC(WHT); sz(4); bold();
    doc.text(label, sx + w / 2, gy + 2.5, { align: 'center' });
    gy += 3.5;

    // Columns: NAME | PER IN | TIME IN | PER OUT | TIME OUT | MINS PLAYED | SHOTS | SAVES
    setF(LTGRAY); setD(BLK); doc.setLineWidth(0.1);
    doc.rect(sx, gy, w, 3, 'F');
    doc.rect(sx, gy, w, 3);
    sz(3); bold(); setC(BLK);
    const gcols = [
      { lbl: 'NAME', w: w * 0.22 },
      { lbl: 'PER IN', w: w * 0.09 },
      { lbl: 'TIME IN', w: w * 0.12 },
      { lbl: 'PER OUT', w: w * 0.09 },
      { lbl: 'TIME OUT', w: w * 0.12 },
      { lbl: 'MINS PLAYED', w: w * 0.14 },
      { lbl: 'SHOTS', w: w * 0.11 },
      { lbl: 'SAVES', w: w * 0.11 },
    ];
    let gcolX = sx;
    gcols.forEach((col, i) => {
      doc.text(col.lbl, gcolX + col.w / 2, gy + 2.2, { align: 'center' });
      if (i < gcols.length - 1) doc.line(gcolX + col.w, gy, gcolX + col.w, gy + 3);
      gcolX += col.w;
    });
    gy += 3;

    // Data rows
    const maxGRows = Math.max(entries.length, 2);
    const gRowH = 3.2;
    for (let i = 0; i < maxGRows; i++) {
      if (i % 2 === 0) { setF(WHT); } else { setF(LTGRAY); }
      doc.rect(sx, gy, w, gRowH, 'F');
      setD(MGRAY); doc.setLineWidth(0.06); doc.rect(sx, gy, w, gRowH);
      // Vertical dividers
      let vx = sx;
      gcols.forEach((col, j) => {
        if (j < gcols.length - 1) doc.line(vx + col.w, gy, vx + col.w, gy + gRowH);
        vx += col.w;
      });

      if (i < entries.length) {
        const e = entries[i];
        let ex = sx;
        sz(3); norm(); setC(BLK);
        doc.text(trunc(doc, e.name, gcols[0].w - 2), ex + 1, gy + 2.3); ex += gcols[0].w;
        doc.text(e.periodIn ? String(e.periodIn) : '', ex + gcols[1].w / 2, gy + 2.3, { align: 'center' }); ex += gcols[1].w;
        doc.text(e.timeIn || '', ex + gcols[2].w / 2, gy + 2.3, { align: 'center' }); ex += gcols[2].w;
        doc.text(e.periodOut ? String(e.periodOut) : '', ex + gcols[3].w / 2, gy + 2.3, { align: 'center' }); ex += gcols[3].w;
        doc.text(e.timeOut || '', ex + gcols[4].w / 2, gy + 2.3, { align: 'center' }); ex += gcols[4].w;
        doc.text(e.minsPlayed || '', ex + gcols[5].w / 2, gy + 2.3, { align: 'center' }); ex += gcols[5].w;
        bold();
        doc.text(String(e.shots), ex + gcols[6].w / 2, gy + 2.3, { align: 'center' }); ex += gcols[6].w;
        setC(RED);
        doc.text(String(e.saves), ex + gcols[7].w / 2, gy + 2.3, { align: 'center' });
      }
      gy += gRowH;
    }
  }

  const homeGEntries = data.homeGoalieEntries || [];
  const awayGEntries = data.awayGoalieEntries || [];
  drawGoalieStats(homeGEntries, M, goalieW, 'HOME TEAM GOALIE STATS - Shots on Home');
  drawGoalieStats(awayGEntries, botRX2, goalieW, 'AWAY TEAM GOALIE STATS - Shots on Away');

  // ── Summary Table (center bottom) ──
  let sy = botY;
  setF(NAVY); doc.rect(botCX2, sy, sumW2, 3.5, 'F');
  setC(WHT); sz(5.5); bold();
  doc.text('SUMMARY', botCX2 + sumW2 / 2, sy + 2.5, { align: 'center' });
  sy += 3.5;

  // Column headers: label | 1 | 2 | 3 | OT | T
  setF(LTGRAY); setD(BLK); doc.setLineWidth(0.1);
  doc.rect(botCX2, sy, sumW2, 3, 'F');
  doc.rect(botCX2, sy, sumW2, 3);
  const sLblW = sumW2 * 0.32;
  const sColW = (sumW2 - sLblW) / 5;
  sz(4); bold(); setC(BLK);
  ['1', '2', '3', 'OT', 'T'].forEach((lbl, i) => {
    doc.text(lbl, botCX2 + sLblW + sColW * i + sColW / 2, sy + 2.2, { align: 'center' });
  });
  sy += 3;

  const sumRowH = 3.2;
  const timeOuts = data.timeOuts || [];

  // TIME OUT VISITOR
  setF(WHT); doc.rect(botCX2, sy, sumW2, sumRowH, 'F');
  setD(MGRAY); doc.setLineWidth(0.06); doc.rect(botCX2, sy, sumW2, sumRowH);
  sz(3.5); bold(); setC(BLK);
  doc.text('TIME OUT VISITOR', botCX2 + 1.5, sy + 2.3);
  for (let p = 1; p <= 3; p++) {
    const vis = timeOuts.filter(t => t.period === p && !t.isHome);
    norm(); sz(3.5);
    doc.text(vis.length > 0 ? vis.map(t => t.timeOnClock || 'X').join(',') : '-', botCX2 + sLblW + sColW * (p - 1) + sColW / 2, sy + 2.3, { align: 'center' });
  }
  doc.text('-', botCX2 + sLblW + sColW * 3 + sColW / 2, sy + 2.3, { align: 'center' });
  bold(); doc.text(String(timeOuts.filter(t => !t.isHome).length), botCX2 + sLblW + sColW * 4 + sColW / 2, sy + 2.3, { align: 'center' });
  sy += sumRowH;

  // TIME OUT HOME
  setF(LTGRAY); doc.rect(botCX2, sy, sumW2, sumRowH, 'F');
  setD(MGRAY); doc.setLineWidth(0.06); doc.rect(botCX2, sy, sumW2, sumRowH);
  sz(3.5); bold(); setC(BLK);
  doc.text('TIME OUT HOME', botCX2 + 1.5, sy + 2.3);
  for (let p = 1; p <= 3; p++) {
    const hm = timeOuts.filter(t => t.period === p && t.isHome);
    norm(); sz(3.5);
    doc.text(hm.length > 0 ? hm.map(t => t.timeOnClock || 'X').join(',') : '-', botCX2 + sLblW + sColW * (p - 1) + sColW / 2, sy + 2.3, { align: 'center' });
  }
  doc.text('-', botCX2 + sLblW + sColW * 3 + sColW / 2, sy + 2.3, { align: 'center' });
  bold(); doc.text(String(timeOuts.filter(t => t.isHome).length), botCX2 + sLblW + sColW * 4 + sColW / 2, sy + 2.3, { align: 'center' });
  sy += sumRowH;

  // VISITOR SCORE
  const otPeriod = data.periodScores.find(p => p.period === 'OT');
  setF(WHT); doc.rect(botCX2, sy, sumW2, sumRowH, 'F');
  setD(MGRAY); doc.setLineWidth(0.06); doc.rect(botCX2, sy, sumW2, sumRowH);
  sz(3.5); bold(); setC(BLK);
  doc.text('VISITOR SCORE', botCX2 + 1.5, sy + 2.3);
  data.periodScores.slice(0, 3).forEach((ps, i) => {
    norm(); sz(4);
    doc.text(String(ps.awayScore), botCX2 + sLblW + sColW * i + sColW / 2, sy + 2.3, { align: 'center' });
  });
  doc.text(otPeriod ? String(otPeriod.awayScore) : '-', botCX2 + sLblW + sColW * 3 + sColW / 2, sy + 2.3, { align: 'center' });
  bold(); setC(RED); sz(5);
  doc.text(String(data.awayScore), botCX2 + sLblW + sColW * 4 + sColW / 2, sy + 2.5, { align: 'center' });
  sy += sumRowH;

  // HOME SCORE
  setF(LTGRAY); doc.rect(botCX2, sy, sumW2, sumRowH, 'F');
  setD(MGRAY); doc.setLineWidth(0.06); doc.rect(botCX2, sy, sumW2, sumRowH);
  sz(3.5); bold(); setC(BLK);
  doc.text('HOME SCORE', botCX2 + 1.5, sy + 2.3);
  data.periodScores.slice(0, 3).forEach((ps, i) => {
    norm(); sz(4);
    doc.text(String(ps.homeScore), botCX2 + sLblW + sColW * i + sColW / 2, sy + 2.3, { align: 'center' });
  });
  doc.text(otPeriod ? String(otPeriod.homeScore) : '-', botCX2 + sLblW + sColW * 3 + sColW / 2, sy + 2.3, { align: 'center' });
  bold(); setC(RED); sz(5);
  doc.text(String(data.homeScore), botCX2 + sLblW + sColW * 4 + sColW / 2, sy + 2.5, { align: 'center' });
  sy += sumRowH;

  // Footer
  setD(BLK); doc.setLineWidth(0.1); doc.rect(botCX2, sy, sumW2, 3);

  // ════════════════════════════════════════════════════════
  //  OUTER BORDER
  // ════════════════════════════════════════════════════════
  setD(BLK); doc.setLineWidth(0.7);
  doc.rect(M - 0.5, M - 0.5, PW - 2 * M + 1, PH - 2 * M + 1);

  // ── Save ──
  const safe = (s: string) => s.replace(/[^a-zA-Z0-9]/g, '');
  doc.save(`GameSheet_${data.gameNumber || 'NoNum'}_${safe(data.homeTeam)}_vs_${safe(data.awayTeam)}.pdf`);
}