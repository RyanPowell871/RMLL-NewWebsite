/**
 * Advanced Document Analyzer
 * Analyzes documents to automatically categorize them with categories and subcategories
 * Tailored for the Rocky Mountain Lacrosse League (RMLL)
 */

export interface CategoryStructure {
  id: string;
  label: string;
  description: string;
  icon: string; // lucide icon name
  keywords: string[];
  subcategories?: SubCategory[];
}

export interface SubCategory {
  id: string;
  label: string;
  keywords: string[];
}

export interface AnalysisResult {
  category: string;
  subcategory?: string;
  confidence: 'high' | 'medium' | 'low';
  suggestedTitle: string;
  suggestedDescription: string;
  detectedKeywords: string[];
  detectedYear?: number;
  fileInfo: {
    type: string;
    extension: string;
    size: number | null;
  };
}

// Comprehensive category structure tailored for RMLL
export const DOCUMENT_CATEGORIES: CategoryStructure[] = [
  {
    id: 'governance',
    label: 'Governance',
    description: 'Bylaws, constitutions, policies, and governance documents',
    icon: 'Scale',
    keywords: ['bylaw', 'by-law', 'constitution', 'governance', 'charter', 'amendment', 'policy', 'procedure', 'protocol'],
    subcategories: [
      { id: 'bylaws', label: 'Bylaws & Amendments', keywords: ['bylaw', 'by-law', 'amendment'] },
      { id: 'constitution', label: 'Constitution', keywords: ['constitution', 'charter'] },
      { id: 'policies', label: 'Policies & Procedures', keywords: ['policy', 'procedure', 'protocol', 'guideline'] },
      { id: 'code-of-conduct', label: 'Code of Conduct', keywords: ['code of conduct', 'conduct', 'ethics', 'behaviour', 'behavior', 'discipline'] },
    ]
  },
  {
    id: 'rules-regulations',
    label: 'Rules & Regulations',
    description: 'Game rules, league regulations, and playing guidelines',
    icon: 'BookOpen',
    keywords: ['rule', 'regulation', 'playing', 'game rule', 'league rule', 'penalty', 'infraction', 'cla rule'],
    subcategories: [
      { id: 'playing-rules', label: 'Playing Rules', keywords: ['playing rule', 'game rule', 'field rule', 'rules of play', 'box lacrosse rule'] },
      { id: 'league-regulations', label: 'League Regulations', keywords: ['league regulation', 'league rule', 'competition rule', 'rmll regulation'] },
      { id: 'safety', label: 'Safety & Equipment', keywords: ['safety', 'protection', 'equipment', 'injury', 'helmet', 'concussion', 'medical'] },
      { id: 'penalties', label: 'Penalties & Suspensions', keywords: ['penalty', 'suspension', 'infraction', 'misconduct', 'ejection', 'match penalty'] },
    ]
  },
  {
    id: 'officiating',
    label: 'Officiating',
    description: 'Referee guidelines, game sheets, assignments, and CRA documents',
    icon: 'Whistle',
    keywords: ['referee', 'official', 'officiating', 'ref', 'umpire', 'game sheet', 'cra', 'arbiter', 'whistle', 'signal', 'mechanic'],
    subcategories: [
      { id: 'referee-manuals', label: 'Referee Manuals & Guidelines', keywords: ['referee manual', 'referee guide', 'official guide', 'officiating manual', 'ref manual', 'official handbook'] },
      { id: 'game-sheets', label: 'Game Sheets & Score Sheets', keywords: ['game sheet', 'score sheet', 'scoresheet', 'game report', 'box score'] },
      { id: 'referee-assignments', label: 'Referee Assignments', keywords: ['referee assignment', 'ref assignment', 'official assignment', 'arbiter', 'scheduling'] },
      { id: 'cra', label: 'CRA Documents', keywords: ['cra', 'canadian referee', 'referee association', 'lacrosse referee'] },
      { id: 'signals-mechanics', label: 'Signals & Mechanics', keywords: ['signal', 'mechanic', 'positioning', 'hand signal', 'flag signal'] },
      { id: 'officiating-forms', label: 'Officiating Forms', keywords: ['referee form', 'official form', 'incident report', 'game incident', 'misconduct report', 'ref report'] },
      { id: 'referee-training', label: 'Training & Clinics', keywords: ['referee clinic', 'ref clinic', 'official clinic', 'referee training', 'certification', 'level 1', 'level 2', 'level 3'] },
    ]
  },
  {
    id: 'forms',
    label: 'Forms',
    description: 'Registration, waivers, transfers, applications, and other league forms',
    icon: 'ClipboardList',
    keywords: ['form', 'application', 'template', 'blank', 'fillable', 'submission'],
    subcategories: [
      { id: 'registration', label: 'Registration & Intent-to-Play', keywords: ['registration', 'intent to play', 'intent-to-play', 'itp', 'sign up', 'signup', 'enroll', 'ramp'] },
      { id: 'waivers', label: 'Waivers & Release', keywords: ['waiver', 'release', 'liability', 'consent', 'assumption of risk', 'parental consent'] },
      { id: 'transfer', label: 'Transfer & Trade Forms', keywords: ['transfer', 'trade', 'player movement', 'release form', 'loan'] },
      { id: 'team-forms', label: 'Team & Franchise Forms', keywords: ['team form', 'franchise', 'team application', 'roster form', 'bench staff'] },
      { id: 'player-forms', label: 'Player Forms', keywords: ['player form', 'player card', 'eligibility', 'age verification', 'overage'] },
      { id: 'coaching-forms', label: 'Coaching Forms', keywords: ['coaching form', 'coach application', 'bench staff', 'nccp', 'coaching certification'] },
      { id: 'expense-forms', label: 'Expense & Reimbursement', keywords: ['expense', 'reimbursement', 'mileage', 'travel claim'] },
      { id: 'other-forms', label: 'Other Forms', keywords: ['form', 'template', 'blank'] },
    ]
  },
  {
    id: 'insurance',
    label: 'Insurance',
    description: 'Insurance certificates, claim forms, and coverage documents',
    icon: 'ShieldCheck',
    keywords: ['insurance', 'coverage', 'claim', 'certificate', 'liability insurance', 'cgl', 'directors and officers'],
    subcategories: [
      { id: 'certificates', label: 'Insurance Certificates', keywords: ['certificate', 'proof of insurance', 'cgl certificate', 'insurance cert'] },
      { id: 'claims', label: 'Claim Forms', keywords: ['claim', 'claim form', 'injury claim', 'accident claim', 'incident claim'] },
      { id: 'coverage', label: 'Coverage Documents', keywords: ['coverage', 'policy coverage', 'insurance policy', 'what is covered', 'liability'] },
      { id: 'facility-insurance', label: 'Facility Insurance', keywords: ['facility insurance', 'venue insurance', 'arena insurance', 'additional insured'] },
    ]
  },
  {
    id: 'meetings',
    label: 'Meetings & Minutes',
    description: 'Meeting minutes, agendas, and related documents',
    icon: 'Users',
    keywords: ['minute', 'meeting', 'agm', 'agenda', 'board', 'motion'],
    subcategories: [
      { id: 'board-minutes', label: 'Board Minutes', keywords: ['board minute', 'board meeting', 'directors meeting', 'executive meeting'] },
      { id: 'agm', label: 'Annual General Meetings', keywords: ['agm', 'annual general meeting', 'annual meeting'] },
      { id: 'committee-minutes', label: 'Committee Minutes', keywords: ['committee minute', 'committee meeting', 'subcommittee'] },
      { id: 'special-meetings', label: 'Special Meetings', keywords: ['special meeting', 'emergency meeting', 'extraordinary meeting'] },
    ]
  },
  {
    id: 'financial',
    label: 'Financial',
    description: 'Budgets, financial reports, and fee schedules',
    icon: 'DollarSign',
    keywords: ['budget', 'financial', 'fee', 'cost', 'payment', 'invoice', 'fs', 'compiled financial', 'treasurer', 'revenue', 'expense'],
    subcategories: [
      { id: 'budgets', label: 'Budgets', keywords: ['budget', 'financial plan', 'operating budget'] },
      { id: 'financial-reports', label: 'Financial Reports', keywords: ['financial report', 'financial statement', 'treasurer report', 'audit'] },
      { id: 'compiled-financial', label: 'Compiled Financial Info', keywords: ['fs', 'compiled financial', 'compiled fs'] },
      { id: 'fee-schedules', label: 'Fee Schedules', keywords: ['fee schedule', 'registration fee', 'cost', 'price', 'fee structure'] },
    ]
  },
  {
    id: 'schedules',
    label: 'Schedules & Calendars',
    description: 'Game schedules, season calendars, and event schedules',
    icon: 'Calendar',
    keywords: ['schedule', 'calendar', 'fixture', 'timetable', 'dates', 'season calendar'],
    subcategories: [
      { id: 'game-schedules', label: 'Game Schedules', keywords: ['game schedule', 'match schedule', 'fixture', 'weekly schedule'] },
      { id: 'season-calendars', label: 'Season Calendars', keywords: ['season calendar', 'season schedule', 'annual calendar', 'master calendar'] },
      { id: 'playoff-schedules', label: 'Playoff & Tournament Schedules', keywords: ['playoff', 'tournament', 'provincial', 'championship schedule', 'bracket'] },
      { id: 'event-schedules', label: 'Event Schedules', keywords: ['event schedule', 'combine schedule', 'clinic schedule', 'draft schedule'] },
    ]
  },
  {
    id: 'rosters',
    label: 'Rosters & Teams',
    description: 'Team rosters, player lists, protected lists, and draft information',
    icon: 'ListChecks',
    keywords: ['roster', 'lineup', 'team list', 'player list', 'squad', 'protected'],
    subcategories: [
      { id: 'team-rosters', label: 'Team Rosters', keywords: ['team roster', 'player roster', 'squad list', 'active roster'] },
      { id: 'protected-lists', label: 'Protected Lists', keywords: ['protected list', 'protected player', 'keeper list', 'protection list'] },
      { id: 'draft-lists', label: 'Draft Lists & Results', keywords: ['draft list', 'draft pick', 'draft order', 'draft result', 'draft selection'] },
    ]
  },
  {
    id: 'transactions',
    label: 'Transactions',
    description: 'Player transactions, trades, and roster moves',
    icon: 'ArrowLeftRight',
    keywords: ['transaction', 'trade', 'acquisition', 'release', 'waiver wire', 'free agent'],
    subcategories: [
      { id: 'trades', label: 'Trades', keywords: ['trade', 'traded', 'swap', 'deal'] },
      { id: 'signings', label: 'Signings', keywords: ['signing', 'signed', 'acquisition', 'acquired', 'free agent signing'] },
      { id: 'releases', label: 'Releases', keywords: ['release', 'released', 'waived', 'cut'] },
      { id: 'call-ups', label: 'Call-ups & Loans', keywords: ['call-up', 'callup', 'loan', 'affiliate', 'minor call'] },
    ]
  },
  {
    id: 'statistics',
    label: 'Statistics & Reports',
    description: 'Game stats, player statistics, and analytical reports',
    icon: 'BarChart3',
    keywords: ['stats', 'statistics', 'report', 'analysis', 'data', 'scoring', 'standings'],
    subcategories: [
      { id: 'player-stats', label: 'Player Statistics', keywords: ['player stat', 'individual stat', 'scoring leader', 'top scorer'] },
      { id: 'team-stats', label: 'Team Statistics', keywords: ['team stat', 'team performance', 'team ranking', 'standings'] },
      { id: 'season-reports', label: 'Season Reports', keywords: ['season report', 'annual report', 'year end', 'season summary'] },
      { id: 'game-reports', label: 'Game Reports', keywords: ['game report', 'match report', 'box score', 'game summary'] },
    ]
  },
  {
    id: 'communications',
    label: 'Communications',
    description: 'Newsletters, announcements, and league communications',
    icon: 'Mail',
    keywords: ['newsletter', 'announcement', 'communication', 'bulletin', 'notice', 'letter', 'memo'],
    subcategories: [
      { id: 'newsletters', label: 'Newsletters', keywords: ['newsletter', 'news letter', 'update'] },
      { id: 'announcements', label: 'Announcements', keywords: ['announcement', 'notice', 'alert'] },
      { id: 'press-releases', label: 'Press Releases', keywords: ['press release', 'media release'] },
      { id: 'memos', label: 'Memos & Letters', keywords: ['memo', 'memorandum', 'internal communication', 'letter to'] },
    ]
  },
  {
    id: 'historical',
    label: 'Historical',
    description: 'Archives, historical documents, and league history',
    icon: 'Clock',
    keywords: ['history', 'historical', 'archive', 'past', 'legacy', 'hall of fame'],
    subcategories: [
      { id: 'archives', label: 'Archives', keywords: ['archive', 'archived', 'old', 'previous season'] },
      { id: 'hall-of-fame', label: 'Hall of Fame', keywords: ['hall of fame', 'hof', 'legend', 'honour', 'honor'] },
      { id: 'championships', label: 'Championship Records', keywords: ['championship', 'champion', 'title', 'winner', 'banner', 'founders cup', 'minto cup'] },
      { id: 'milestones', label: 'Milestones', keywords: ['milestone', 'achievement', 'record'] },
    ]
  },
  {
    id: 'other',
    label: 'Other',
    description: 'Miscellaneous and uncategorized documents',
    icon: 'Folder',
    keywords: ['other', 'misc', 'miscellaneous', 'general'],
    subcategories: [
      { id: 'general', label: 'General Documents', keywords: ['general', 'misc'] },
      { id: 'uncategorized', label: 'Uncategorized', keywords: ['uncategorized', 'unclassified'] },
    ]
  }
];

/**
 * Get the icon name for a category
 */
export function getCategoryIcon(categoryId: string): string {
  const category = DOCUMENT_CATEGORIES.find(c => c.id === categoryId);
  return category?.icon || 'Folder';
}

/**
 * Analyze a file to determine its category and subcategory
 */
export function analyzeDocument(file: File): AnalysisResult {
  const filename = file.name.toLowerCase();
  const extension = filename.split('.').pop() || '';
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
  
  // Clean up the filename for analysis
  const cleanName = nameWithoutExt
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  const words = cleanName.split(' ');
  const detectedKeywords: string[] = [];
  
  const bestMatch = findBestCategoryMatch(cleanName, detectedKeywords);
  
  // Determine confidence level
  let confidence: 'high' | 'medium' | 'low' = 'low';
  if (bestMatch.score >= 5) {
    confidence = 'high';
  } else if (bestMatch.score >= 2) {
    confidence = 'medium';
  }
  
  // Generate title
  const suggestedTitle = words
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  // Generate description
  const categoryData = DOCUMENT_CATEGORIES.find(c => c.id === bestMatch.category);
  const subcategoryData = categoryData?.subcategories?.find(s => s.id === bestMatch.subcategory);
  
  let suggestedDescription = categoryData?.description || 'League document';
  if (subcategoryData) {
    suggestedDescription = `${subcategoryData.label} - ${suggestedDescription}`;
  }
  
  // Detect year from filename
  const detectedYear = detectYear(file.name);
  
  return {
    category: bestMatch.category,
    subcategory: bestMatch.subcategory,
    confidence,
    suggestedTitle,
    suggestedDescription,
    detectedKeywords,
    detectedYear,
    fileInfo: {
      type: file.type,
      extension,
      size: file.size
    }
  };
}

/**
 * Analyze a document by filename only (for XML imports where we don't have File objects)
 */
export function analyzeDocumentByFilename(filename: string, fileUrl?: string): Omit<AnalysisResult, 'fileInfo'> & { fileInfo: { type: string; extension: string; size: number | null } } {
  const lowerFilename = filename.toLowerCase();
  const extension = lowerFilename.split('.').pop() || '';
  const nameWithoutExt = lowerFilename.replace(/\.[^/.]+$/, '');
  
  // Clean up the filename for analysis
  const cleanName = nameWithoutExt
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  const words = cleanName.split(' ');
  const detectedKeywords: string[] = [];
  
  // Also analyze the URL if provided
  const urlText = fileUrl ? fileUrl.toLowerCase() : '';
  const combinedText = `${cleanName} ${urlText}`;
  
  const bestMatch = findBestCategoryMatch(combinedText, detectedKeywords);
  
  // Determine confidence level
  let confidence: 'high' | 'medium' | 'low' = 'low';
  if (bestMatch.score >= 5) {
    confidence = 'high';
  } else if (bestMatch.score >= 2) {
    confidence = 'medium';
  }
  
  // Generate title
  const suggestedTitle = words
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  // Generate description
  const categoryData = DOCUMENT_CATEGORIES.find(c => c.id === bestMatch.category);
  const subcategoryData = categoryData?.subcategories?.find(s => s.id === bestMatch.subcategory);
  
  let suggestedDescription = categoryData?.description || 'League document';
  if (subcategoryData) {
    suggestedDescription = `${subcategoryData.label} - ${suggestedDescription}`;
  }
  
  // Detect year from filename/URL
  const detectedYear = detectYear(filename, fileUrl);
  
  return {
    category: bestMatch.category,
    subcategory: bestMatch.subcategory,
    confidence,
    suggestedTitle,
    suggestedDescription,
    detectedKeywords,
    detectedYear,
    fileInfo: {
      type: `application/${extension}`,
      extension,
      size: null
    }
  };
}

/**
 * Core matching logic - finds the best category/subcategory match for given text
 */
function findBestCategoryMatch(text: string, detectedKeywords: string[]): {
  category: string;
  subcategory?: string;
  score: number;
} {
  let bestMatch = {
    category: 'other',
    subcategory: 'uncategorized' as string | undefined,
    score: 0
  };
  
  for (const category of DOCUMENT_CATEGORIES) {
    let categoryScore = 0;
    
    // Check category-level keywords
    for (const keyword of category.keywords) {
      if (text.includes(keyword)) {
        categoryScore += 2;
        if (!detectedKeywords.includes(keyword)) {
          detectedKeywords.push(keyword);
        }
      }
    }
    
    // Check subcategories
    let bestSubcategoryMatch: { id: string; score: number } | null = null;
    
    if (category.subcategories) {
      for (const subcategory of category.subcategories) {
        let subcategoryScore = 0;
        
        for (const keyword of subcategory.keywords) {
          if (text.includes(keyword)) {
            subcategoryScore += 3;
            if (!detectedKeywords.includes(keyword)) {
              detectedKeywords.push(keyword);
            }
          }
        }
        
        if (subcategoryScore > 0 && (!bestSubcategoryMatch || subcategoryScore > bestSubcategoryMatch.score)) {
          bestSubcategoryMatch = { id: subcategory.id, score: subcategoryScore };
        }
      }
    }
    
    const totalScore = categoryScore + (bestSubcategoryMatch?.score || 0);
    
    if (totalScore > bestMatch.score) {
      bestMatch = {
        category: category.id,
        subcategory: bestSubcategoryMatch?.id,
        score: totalScore
      };
    }
  }
  
  return bestMatch;
}

/**
 * Batch analyze multiple files and suggest optimal categorization
 */
export function batchAnalyzeDocuments(files: File[]): AnalysisResult[] {
  return files.map(file => analyzeDocument(file));
}

/**
 * Get category label by ID
 */
export function getCategoryLabel(categoryId: string): string {
  const category = DOCUMENT_CATEGORIES.find(c => c.id === categoryId);
  return category?.label || categoryId;
}

/**
 * Get subcategory label by category and subcategory ID
 */
export function getSubcategoryLabel(categoryId: string, subcategoryId: string): string {
  const category = DOCUMENT_CATEGORIES.find(c => c.id === categoryId);
  const subcategory = category?.subcategories?.find(s => s.id === subcategoryId);
  return subcategory?.label || subcategoryId;
}

/**
 * Get full category path (e.g., "Governance > Bylaws")
 */
export function getCategoryPath(categoryId: string, subcategoryId?: string): string {
  const categoryLabel = getCategoryLabel(categoryId);
  if (!subcategoryId) return categoryLabel;
  
  const subcategoryLabel = getSubcategoryLabel(categoryId, subcategoryId);
  return `${categoryLabel} › ${subcategoryLabel}`;
}

/**
 * Export flat list of all categories for backward compatibility
 */
export function getAllCategoryIds(): string[] {
  return DOCUMENT_CATEGORIES.map(c => c.id);
}

/**
 * Get category statistics from analysis results
 */
export function getCategoryStatistics(results: AnalysisResult[]) {
  const stats: Record<string, { count: number; subcategories: Record<string, number> }> = {};
  
  for (const result of results) {
    if (!stats[result.category]) {
      stats[result.category] = { count: 0, subcategories: {} };
    }
    
    stats[result.category].count++;
    
    if (result.subcategory) {
      if (!stats[result.category].subcategories[result.subcategory]) {
        stats[result.category].subcategories[result.subcategory] = 0;
      }
      stats[result.category].subcategories[result.subcategory]++;
    }
  }
  
  return stats;
}

/**
 * Detect year from filename and content
 * Looks for 4-digit years (2000-2099) in filename
 */
export function detectYear(filename: string, fileUrl?: string): number | undefined {
  const combinedText = `${filename} ${fileUrl || ''}`;
  
  // Match 4-digit years between 2000 and 2099
  const yearMatches = combinedText.match(/\b(20\d{2}|202[0-9])\b/g);
  
  if (yearMatches && yearMatches.length > 0) {
    // If multiple years found, use the most recent one
    const years = yearMatches.map(y => parseInt(y, 10));
    return Math.max(...years);
  }
  
  return undefined;
}
