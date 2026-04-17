import { useState, useEffect } from 'react';
import { Shield, Award, MapPin, Mail, Phone, User, Building2, Calendar, Loader2, AlertCircle, Users, Hash, CheckCircle2, XCircle, Clock, FileCheck, Landmark, ScrollText } from 'lucide-react';
import { fetchTeamFranchiseProtectedList, fetchFranchiseDetails, fetchTeamRaw } from '../services/sportzsoft/api';
import rmllShieldLogo from '../assets/mainlogo.png';

// Universal field resolver
function resolveStr(obj: any, ...fieldNames: string[]): string {
  if (!obj) return '';
  for (const name of fieldNames) {
    if (obj[name] !== undefined && obj[name] !== null) {
      const val = obj[name];
      if (typeof val === 'number' && val === 0) continue;
      return String(val);
    }
  }
  return '';
}

interface FranchiseCertificateProps {
  teamId: number;
  teamName: string;
  teamLogo?: string;
  divisionName?: string;
  primaryColor: string;
  secondaryColor: string;
  currentSeason?: string;
}

interface FranchiseContact {
  name: string;
  homePhone: string;
  workPhone: string;
  cellPhone: string;
  email: string;
  role: string;
}

type ApprovalStatus = 'approved' | 'pending' | 'inactive' | 'unknown';

interface FranchiseData {
  franchiseName: string;
  divGroupCommonCode: string;
  ageGroupName: string;
  orgName: string;
  isActive: boolean;
  firstYear: number;
  lastYear: number;
  teamCount: number;
  franchiseId: number | null;
  organizationId: number | null;
  currentTeamDivisionId: number | null;
  displayString: string;
  // Bond / approval fields
  bondSubmittedDate: string;
  approvalStatus: ApprovalStatus;
  approvalStatusRaw: string;
  franCertApprovedTimestamp: string;
  // Team-level data
  teamCity: string;
  teamProvince: string;
  teamWebsite: string;
  teamEmail: string;
  teamPhone: string;
  // Additional certificate fields
  chequesPayableTo: string;
  eftEmailAddress: string;
  memberSince: string;
  // New fields from raw Team endpoint — use exact API field names
  formationDate: string;
  formedByStatute: string;
  financialYearEnd: string;
  businessAccessNumber: string;
  facebookAccount: string;
  instagramAccount: string;
  homeSweaterColor: string;
  awaySweaterColor: string;
  shortName: string;
  teamCode: string;
  // Contact data
  primaryContact: FranchiseContact | null;
  secondaryContact: FranchiseContact | null;
  raw: any;
}

function parseContact(data: any, rolePrefix: string): FranchiseContact | null {
  if (!data) return null;
  const name = resolveStr(data,
    `${rolePrefix}Name`, `${rolePrefix}ContactName`, `${rolePrefix}PersonName`,
    `${rolePrefix}FirstName`, `${rolePrefix}Contact`
  );
  if (!name) return null;
  return {
    name,
    role: (rolePrefix === 'Primary' || rolePrefix === 'Prim') ? 'Team Primary' : 'Team Secondary',
    homePhone: resolveStr(data, `${rolePrefix}HomePhone`, `${rolePrefix}Phone`, `${rolePrefix}PhoneHome`),
    workPhone: resolveStr(data, `${rolePrefix}WorkPhone`, `${rolePrefix}PhoneWork`, `${rolePrefix}BusinessPhone`),
    cellPhone: resolveStr(data, `${rolePrefix}CellPhone`, `${rolePrefix}PhoneCell`, `${rolePrefix}MobilePhone`, `${rolePrefix}Cell`),
    email: resolveStr(data, `${rolePrefix}Email`, `${rolePrefix}EmailAddress`, `${rolePrefix}EMailAddress`),
  };
}

function determineApprovalStatus(
  data: any,
  teamData: any,
  currentSeason: string
): { status: ApprovalStatus; raw: string; bondDate: string } {
  // Search for bond/approval fields across both franchise and team data
  const bondDate = resolveStr(data,
    'BondedDate', 'BondSubmittedDate', 'BondDate', 'BondSubmitted', 'BondDt', 'BondSubmittedDt',
    'BondReceivedDate', 'BondReceived'
  ) || resolveStr(teamData,
    'BondedDate', 'BondSubmittedDate', 'BondDate', 'BondSubmitted', 'BondDt', 'BondSubmittedDt',
    'BondReceivedDate', 'BondReceived'
  );

  // Check for franchise certificate approval timestamp - this is the definitive indicator
  const approvedTimestamp = resolveStr(data,
    'FranCertApprovedTimestamp', 'ApprovedTimestamp', 'CertApprovedDate', 'CertificateApprovedDate'
  ) || resolveStr(teamData,
    'FranCertApprovedTimestamp', 'ApprovedTimestamp', 'CertApprovedDate', 'CertificateApprovedDate'
  );

  // If there's an approved timestamp, the franchise is definitely approved
  if (approvedTimestamp) {
    console.log('[FranchiseCert] Found approved timestamp:', approvedTimestamp);
    return { status: 'approved', raw: approvedTimestamp, bondDate };
  }

  // Look for explicit approval/status fields
  const statusField = resolveStr(data,
    'ApprovalStatus', 'Status', 'FranchiseStatus', 'ApprovalStatusCd',
    'StatusCd', 'FranchiseStatusCd', 'CurrentStatus', 'SeasonStatus',
    'Approved', 'IsApproved', 'ApprovedFlag', 'CertificateStatus', 'CertStatus',
    'FranchiseApproval', 'FranchiseApproved', 'SeasonApproval', 'FranchiseCertStatus'
  ) || resolveStr(teamData,
    'ApprovalStatus', 'Status', 'TeamStatus', 'ApprovalStatusCd',
    'StatusCd', 'TeamStatusCd', 'CurrentStatus', 'SeasonStatus',
    'Approved', 'IsApproved', 'ApprovedFlag', 'CertificateStatus', 'CertStatus',
    'FranchiseApproval', 'FranchiseApproved', 'SeasonApproval', 'FranchiseCertStatus'
  );

  // Determine status
  let status: ApprovalStatus = 'unknown';

  if (statusField) {
    const s = statusField.toLowerCase();
    console.log('[FranchiseCert] Status field found:', statusField, '- normalized:', s);
    if (s === 'approved' || s === 'active' || s === 'a' || s === '1' || s === 'true' || s === 'yes' || s === 'certified' || s === 'confirmed') {
      status = 'approved';
    } else if (s === 'pending' || s === 'p' || s === 'submitted' || s === 'review' || s === 'processing') {
      status = 'pending';
    } else if (s === 'inactive' || s === 'i' || s === '0' || s === 'false' || s === 'no' || s === 'denied' || s === 'rejected' || s === 'suspended') {
      status = 'inactive';
    }
  }

  // If no explicit status, infer from IsActive and current season
  if (status === 'unknown') {
    const isActive = data.IsActive === true || data.IsActive === 1;
    const lastYear = data.LastYear || 0;
    const currentYear = currentSeason ? parseInt(currentSeason) : new Date().getFullYear();

    console.log('[FranchiseCert] No explicit status, inferring. IsActive:', isActive, 'LastYear:', lastYear, 'CurrentYear:', currentYear, 'HasBond:', !!bondDate);

    if (isActive && lastYear >= currentYear) {
      status = bondDate ? 'approved' : 'pending';
    } else if (isActive) {
      status = 'pending'; // Active franchise but hasn't been confirmed for current season yet
    } else {
      status = 'inactive';
    }
  }

  return { status, raw: statusField, bondDate };
}

function extractFranchiseData(
  franchiseResponse: any,
  teamResponse: any,
  divisionName: string,
  currentSeason: string
): FranchiseData {
  const tf = franchiseResponse?.Response?.TeamFranchise || franchiseResponse?.Response || {};
  const team = teamResponse?.Response?.Team || teamResponse?.Response || {};

  // === DIAGNOSTIC: Log all contact-related data from both sources ===
  console.log('[FranchiseCert] === CONTACT DIAGNOSTIC ===');
  console.log('[FranchiseCert] TeamFranchise (tf) keys:', Object.keys(tf));
  console.log('[FranchiseCert] Team keys:', Object.keys(team));
  
  // Log all keys that contain "prim", "secd", "secondary", "contact", "role", "name" (case-insensitive)
  const contactKeyPatterns = /prim|secd|secondary|contact|role|name|person|email/i;
  const tfContactKeys: Record<string, any> = {};
  const teamContactKeys: Record<string, any> = {};
  for (const key of Object.keys(tf)) {
    if (contactKeyPatterns.test(key)) tfContactKeys[key] = tf[key];
  }
  for (const key of Object.keys(team)) {
    if (contactKeyPatterns.test(key)) teamContactKeys[key] = team[key];
  }
  console.log('[FranchiseCert] tf contact-related fields:', JSON.stringify(tfContactKeys, null, 2));
  console.log('[FranchiseCert] team contact-related fields:', JSON.stringify(teamContactKeys, null, 2));
  
  // Log roles arrays
  const roles_diag = tf.TeamFranchiseRoles || tf.FranchiseRoles || tf.Roles || tf.TeamFranchiseRole || tf.FranchiseRole;
  console.log('[FranchiseCert] tf roles array:', JSON.stringify(roles_diag, null, 2));
  const teamRoles_diag = team.TeamRoles || team.Roles || team.TeamRole || team.ContactRoles;
  console.log('[FranchiseCert] team roles array:', JSON.stringify(teamRoles_diag, null, 2));
  
  // Log ALL keys from the first TeamRole entry + the Team Primary/Secondary entries to find visibility flags
  if (Array.isArray(teamRoles_diag) && teamRoles_diag.length > 0) {
    console.log('[FranchiseCert] ALL KEYS on first TeamRole entry:', Object.keys(teamRoles_diag[0]));
    const primEntry = teamRoles_diag.find((r: any) => (r.Role || '').toUpperCase().includes('PRIMARY'));
    const secdEntry = teamRoles_diag.find((r: any) => (r.Role || '').toUpperCase().includes('SECONDARY'));
    if (primEntry) console.log('[FranchiseCert] FULL Team Primary entry:', JSON.stringify(primEntry, null, 2));
    if (secdEntry) console.log('[FranchiseCert] FULL Team Secondary entry:', JSON.stringify(secdEntry, null, 2));
  }
  
  // Also log ProtectedList if present
  console.log('[FranchiseCert] tf.ProtectedList:', JSON.stringify(tf.ProtectedList, null, 2));
  console.log('[FranchiseCert] === END CONTACT DIAGNOSTIC ===');

  // Contacts — start with flat-field parsing as initial fallback
  let primaryContact: FranchiseContact | null = null;
  let secondaryContact: FranchiseContact | null = null;
  primaryContact = parseContact(tf, 'Primary') || parseContact(tf, 'Prim');
  secondaryContact = parseContact(tf, 'Secondary') || parseContact(tf, 'Secd');

  // Also try on team data
  if (!primaryContact) primaryContact = parseContact(team, 'Primary') || parseContact(team, 'Prim');
  if (!secondaryContact) secondaryContact = parseContact(team, 'Secondary') || parseContact(team, 'Secd');

  // Check TeamFranchiseRoles array (from franchise data) — these are authoritative and OVERRIDE flat fields
  const roles = tf.TeamFranchiseRoles || tf.FranchiseRoles || tf.Roles ||
    tf.TeamFranchiseRole || tf.FranchiseRole || [];
  if (Array.isArray(roles) && roles.length > 0) {
    for (const role of roles) {
      const roleCd = role.FranchiseRoleCd || role.RoleCd || role.RoleCode || '';
      const personName = role.FullName || role.PersonName || role.Name || role.ContactName ||
        ((role.FirstName || '') + (role.LastName ? ' ' + role.LastName : '')).trim();
      if (!personName) continue;
      const contact: FranchiseContact = {
        name: personName,
        role: roleCd === 'PRIM' ? 'Team Primary' : roleCd === 'SECD' ? 'Team Secondary' : roleCd,
        homePhone: role.HomePhone || role.PhoneHome || '',
        workPhone: role.WorkPhone || role.PhoneWork || role.BusinessPhone || '',
        cellPhone: role.CellPhone || role.PhoneCell || role.MobilePhone || role.Cell || '',
        email: role.Email || role.EmailAddress || role.EMailAddress || '',
      };
      // Roles array is authoritative — override flat-field contacts
      if (roleCd === 'PRIM' || roleCd === 'PRIMARY') primaryContact = contact;
      else if (roleCd === 'SECD' || roleCd === 'SECONDARY') secondaryContact = contact;
    }
  }

  // Check TeamRoles array (from team data) — also authoritative, override if found
  const teamRoles = team.TeamRoles || team.Roles || team.TeamRole || team.ContactRoles || [];
  if (Array.isArray(teamRoles) && teamRoles.length > 0) {
    for (const role of teamRoles) {
      const roleCd = (role.TeamRoleCd || role.FranchiseRoleCd || role.RoleCd || role.RoleCode || role.Role || '').toUpperCase().trim();
      const personName = role.FullName || role.PersonName || role.Name || role.ContactName ||
        ((role.FirstName || '') + (role.LastName ? ' ' + role.LastName : '')).trim();
      if (!personName) continue;
      const isPrimary = roleCd === 'PRIM' || roleCd === 'PRIMARY' || roleCd === 'TEAM PRIMARY';
      const isSecondary = roleCd === 'SECD' || roleCd === 'SECONDARY' || roleCd === 'TEAM SECONDARY';
      const contact: FranchiseContact = {
        name: personName,
        role: isPrimary ? 'Team Primary' : isSecondary ? 'Team Secondary' : role.TeamRoleDescription || role.RoleDescription || role.Description || role.Role || roleCd,
        homePhone: role.HomePhone || role.PhoneHome || '',
        workPhone: role.WorkPhone || role.PhoneWork || role.BusinessPhone || '',
        cellPhone: role.CellPhone || role.PhoneCell || role.MobilePhone || role.Cell || '',
        email: role.PrimaryEmail || role.Email || role.EmailAddress || role.EMailAddress || '',
      };
      // TeamRoles are authoritative — override flat-field contacts
      if (isPrimary) primaryContact = contact;
      else if (isSecondary) secondaryContact = contact;
      // If no primary/secondary yet, assign by order
      else if (!primaryContact) { contact.role = 'Team Primary'; primaryContact = contact; }
      else if (!secondaryContact) { contact.role = 'Team Secondary'; secondaryContact = contact; }
    }
  }

  // Approval / Bond
  const { status, raw: statusRaw, bondDate } = determineApprovalStatus(tf, team, currentSeason);

  return {
    franchiseName: tf.FranchiseName || tf.TeamFranchiseName || tf.Name || '',
    divGroupCommonCode: tf.DivGroupCommonCode || tf.DivisionGroupCode || '',
    ageGroupName: tf.AgeGroupName || '',
    orgName: tf.OrgName || tf.OrganizationName || '',
    isActive: tf.IsActive === true || tf.IsActive === 1,
    firstYear: tf.FirstYear || 0,
    lastYear: tf.LastYear || 0,
    teamCount: tf.TeamCount || 0,
    franchiseId: tf.TeamFranchiseId || null,
    organizationId: tf.OrganizationId || null,
    currentTeamDivisionId: tf.CurrentTeamDivisionId || null,
    displayString: tf.DisplayString || '',
    bondSubmittedDate: bondDate,
    approvalStatus: status,
    approvalStatusRaw: statusRaw,
    franCertApprovedTimestamp: resolveStr(tf, 'FranCertApprovedTimestamp', 'ApprovedTimestamp'),
    teamCity: team.City || team.CityName || team.HomeTown || '',
    teamProvince: team.Province || team.ProvinceName || team.State || team.StateName || '',
    teamWebsite: team.WebSite || team.Website || team.WebsiteUrl || team.WebUrl || '',
    teamEmail: team.Email || team.TeamEmail || team.EMailAddress || '',
    teamPhone: team.Phone || team.TeamPhone || team.PhoneNumber || '',
    // Additional certificate fields
    chequesPayableTo: resolveStr(tf,
      'ChequesPayableTo', 'ChequePayableTo', 'PayableTo', 'ChequesPayable',
      'ChequePayable', 'PayableToName', 'ChqPayableTo'
    ) || resolveStr(team,
      'ChequesPayableTo', 'ChequePayableTo', 'PayableTo', 'ChequesPayable',
      'ChequePayable', 'PayableToName', 'ChqPayableTo'
    ),
    eftEmailAddress: resolveStr(tf,
      'EtransferEmail', 'EFTEMailAddress', 'EFTEmailAddress', 'EftEmail', 'EFTEmail',
      'EFT_Email', 'EftEMailAddress', 'EFTEMail'
    ) || resolveStr(team,
      'EtransferEmail', 'EFTEMailAddress', 'EFTEmailAddress', 'EftEmail', 'EFTEmail',
      'EFT_Email', 'EftEMailAddress', 'EFTEMail'
    ),
    memberSince: resolveStr(tf,
      'MemberSinceYear', 'MemberSince', 'RMLLMemberSince', 'MemberYear'
    ) || resolveStr(team,
      'MemberSinceYear', 'MemberSince', 'RMLLMemberSince', 'MemberYear'
    ) || (tf.FirstYear && tf.FirstYear > 0 ? String(tf.FirstYear) : ''),
    // New fields from raw Team endpoint — use exact API field names
    formationDate: resolveStr(team, 'FormationDate'),
    formedByStatute: resolveStr(team, 'FormedByStatute'),
    financialYearEnd: resolveStr(team, 'FinancialYearEnd'),
    businessAccessNumber: resolveStr(team, 'BusinessAccessNumber'),
    facebookAccount: resolveStr(team, 'FaceBookAccount', 'FacebookAccount'),
    instagramAccount: resolveStr(team, 'InstagramAccount'),
    homeSweaterColor: resolveStr(team, 'HomeSweaterColor'),
    awaySweaterColor: resolveStr(team, 'AwaySweaterColor'),
    shortName: resolveStr(team, 'ShortName'),
    teamCode: resolveStr(team, 'TeamCode'),
    primaryContact,
    secondaryContact,
    raw: { teamFranchise: tf, team },
  };
}

function ContactCard({ contact, color }: { contact: FranchiseContact; color: string }) {
  return (
    <div className="bg-white rounded-lg border p-4 space-y-2" style={{ borderColor: `${color}30` }}>
      <div className="flex items-center gap-2 mb-3">
        <User className="w-4 h-4" style={{ color }} />
        <span className="font-bold text-xs uppercase tracking-wider" style={{ color }}>
          {contact.role}
        </span>
      </div>
      <p className="text-base font-bold text-gray-800 pl-6">{contact.name}</p>
      <div className="pl-6 space-y-1">
        {contact.email && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-500 font-medium w-12 text-xs">Email</span>
            <a href={`mailto:${contact.email}`} className="hover:underline text-sm truncate" style={{ color }}>
              {contact.email}
            </a>
          </div>
        )}
        {!contact.email && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>No contact information available</span>
          </div>
        )}
      </div>
    </div>
  );
}

function formatDivisionCode(code: string, fallbackDivision: string): string {
  if (fallbackDivision) return fallbackDivision;
  const map: Record<string, string> = {
    'Sr': 'Senior', 'Jr': 'Junior', 'JrA': 'Junior A', 'JrB': 'Junior B',
    'JrT': 'Junior Tier', 'SrA': 'Senior A', 'SrB': 'Senior B', 'SrC': 'Senior C', 'Mn': 'Minor',
  };
  return map[code] || code || '---';
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function StatusBadge({ status, currentSeason, bondDate }: { status: ApprovalStatus; currentSeason: string; bondDate: string }) {
  const configs: Record<ApprovalStatus, { bg: string; text: string; border: string; icon: React.ReactNode; label: string }> = {
    approved: {
      bg: 'bg-green-50',
      text: 'text-green-700',
      border: 'border-green-200',
      icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
      label: `Approved for ${currentSeason} Season`,
    },
    pending: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      icon: <Clock className="w-5 h-5 text-amber-500" />,
      label: `Pending Approval — ${currentSeason} Season`,
    },
    inactive: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200',
      icon: <XCircle className="w-5 h-5 text-red-400" />,
      label: `Inactive — ${currentSeason} Season`,
    },
    unknown: {
      bg: 'bg-gray-50',
      text: 'text-gray-600',
      border: 'border-gray-200',
      icon: <Shield className="w-5 h-5 text-gray-400" />,
      label: `Status Unknown — ${currentSeason} Season`,
    },
  };
  const c = configs[status];

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${c.bg} ${c.border}`}>
      {c.icon}
      <div className="flex-1">
        <p className={`font-bold text-sm ${c.text}`}>{c.label}</p>
      </div>
    </div>
  );
}

export function FranchiseCertificate({
  teamId, teamName, teamLogo, divisionName, primaryColor, secondaryColor, currentSeason
}: FranchiseCertificateProps) {
  const [franchiseData, setFranchiseData] = useState<FranchiseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const seasonYear = currentSeason || String(new Date().getFullYear());

  useEffect(() => {
    const fetchData = async () => {
      if (!teamId) return;
      setLoading(true);
      setError(null);

      try {
        // Step 1: Get TeamFranchiseId + team-level data from the Team endpoint
        // LimiterCode=BI returns basic fields (incl. TeamFranchiseId) + info fields.
        // ChildCodes=B returns TeamRoles (where PRIM/SECD contacts live).

        const [teamResponse, rawTeamResponse] = await Promise.all([
          fetchTeamFranchiseProtectedList(teamId, 'BI', 'B'),
          fetchTeamRaw(teamId),
        ]);

        // Merge raw team data into team response so extractFranchiseData can find all fields
        const rawTeam = rawTeamResponse?.Response?.Team || rawTeamResponse?.Response || {};
        if (teamResponse.Success && teamResponse.Response) {
          const teamObj = teamResponse.Response.Team || teamResponse.Response;
          // Merge raw fields into the team object (raw has BondedDate, ChequesPayableTo, etc.)
          Object.keys(rawTeam).forEach(key => {
            if (teamObj[key] === undefined || teamObj[key] === null) {
              teamObj[key] = rawTeam[key];
            }
          });
          // Ensure Team sub-object also gets the merge
          if (teamResponse.Response.Team) {
            Object.keys(rawTeam).forEach(key => {
              if (teamResponse.Response.Team[key] === undefined || teamResponse.Response.Team[key] === null) {
                teamResponse.Response.Team[key] = rawTeam[key];
              }
            });
          }

        }

        let franchiseId: number | null = null;
        if (teamResponse.Success && teamResponse.Response) {
          const resp = teamResponse.Response;
          franchiseId = resp.Team?.TeamFranchiseId || resp.TeamFranchiseId ||
            resp.Team?.FranchiseId || resp.FranchiseId || null;

        }

        if (!franchiseId) {
          setError('No franchise information available for this team.');
          setLoading(false);
          return;
        }

        // Step 2: Fetch franchise details with multiple strategies to get ALL data

        
        let franchiseResponse: any = null;

        // Strategy A: Try comprehensive fetch — LimiterCode=BIC (Basic + Info + Contact), ChildCodes=THC
        try {
          franchiseResponse = await fetchFranchiseDetails(franchiseId, 'BIC', 'THC');

        } catch (e) {
          console.warn('[FranchiseCert] BIC/THC failed:', e);
        }

        // Fallback: basic info only
        if (!franchiseResponse?.Success) {
          try {
            franchiseResponse = await fetchFranchiseDetails(franchiseId, 'BI', '');

          } catch (e) {
            console.warn('[FranchiseCert] BI/ failed:', e);
          }
        }

        // Strategy B: Fetch franchise with LimiterCode=I specifically for contact/info fields
        if (franchiseResponse?.Success) {
          try {
            const detailResp = await fetchFranchiseDetails(franchiseId, 'I', '');
            if (detailResp?.Success && detailResp?.Response) {

              
              // Merge new fields
              const mainTf = franchiseResponse.Response?.TeamFranchise || franchiseResponse.Response;
              const detailTf = detailResp.Response?.TeamFranchise || detailResp.Response || {};
              if (mainTf && detailTf) {
                Object.keys(detailTf).forEach(key => {
                  if (mainTf[key] === undefined || mainTf[key] === null) {
                    mainTf[key] = detailTf[key];
                  }
                });
              }
            }
          } catch (e) {
            console.warn('[FranchiseCert] Franchise I fetch failed:', e);
          }
        }

        // Strategy C: Fetch franchise ProtectedList (ChildCodes=P) — roles include PRIM/SECD contacts
        if (franchiseResponse?.Success) {
          try {
            const protResp = await fetchFranchiseDetails(franchiseId, 'C', 'P');
            if (protResp?.Success && protResp?.Response) {
              const tf = protResp.Response?.TeamFranchise || protResp.Response || {};
              const protList = tf.ProtectedList || tf.Roles || tf.TeamFranchiseRoles || [];
              if (Array.isArray(protList) && protList.length > 0) {
                // Look for PRIM and SECD entries in the protected/roles list
                const contactRoles = protList.filter((r: any) => {
                  const cd = (r.FranchiseRoleCd || r.RoleCd || '').toUpperCase();
                  return cd === 'PRIM' || cd === 'SECD' || cd === 'PRIMARY' || cd === 'SECONDARY' ||
                         cd === 'GM' || cd === 'COACH' || cd === 'CONTACT' || cd === 'MANAGER';
                });

                
                // Store contact roles in franchise response for extractFranchiseData to find
                const mainTf = franchiseResponse.Response?.TeamFranchise || franchiseResponse.Response;
                if (mainTf && contactRoles.length > 0) {
                  mainTf.TeamFranchiseRoles = contactRoles;
                }
                // Also store the full protected list for role discovery
                if (mainTf && !mainTf.ProtectedList) {
                  mainTf.ProtectedList = protList;
                }
              }
            }
          } catch (e) {
            console.warn('[FranchiseCert] Protected list fetch failed:', e);
          }
        }

        if (franchiseResponse?.Success && franchiseResponse?.Response) {
          const parsed = extractFranchiseData(franchiseResponse, teamResponse, divisionName || '', seasonYear);
          setFranchiseData(parsed);
        } else {
          setError('Could not load franchise certificate data.');
        }
      } catch (err: any) {
        console.error('[FranchiseCert] Error:', err);
        setError(err.message || 'Failed to load franchise data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [teamId, divisionName, seasonYear]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="w-12 h-12 animate-spin mb-4" style={{ color: primaryColor }} />
        <p className="text-gray-400 font-bold text-lg">Loading Franchise Certificate...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle className="w-12 h-12 text-gray-300 mb-4" />
        <p className="text-gray-500 font-bold text-lg mb-1">Franchise Certificate</p>
        <p className="text-gray-400 text-sm">{error}</p>
      </div>
    );
  }

  if (!franchiseData) return null;

  const displayName = franchiseData.franchiseName || teamName;
  const displayDivision = formatDivisionCode(franchiseData.divGroupCommonCode, divisionName || '');
  const yearRange = franchiseData.firstYear && franchiseData.firstYear > 0
    ? (franchiseData.lastYear && franchiseData.lastYear > 0 && franchiseData.lastYear !== franchiseData.firstYear
      ? `${franchiseData.firstYear} – ${franchiseData.lastYear}`
      : `${franchiseData.firstYear} – Present`)
    : '';

  return (
    <div className="max-w-3xl mx-auto">
      {/* Certificate Container */}
      <div className="relative bg-white rounded-xl shadow-2xl overflow-hidden border-2" style={{ borderColor: primaryColor }}>

        {/* Decorative top border */}
        <div className="h-3" style={{ background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor || primaryColor}, ${primaryColor})` }} />

        {/* Inner certificate with ornate border */}
        <div className="m-4 sm:m-6 md:m-8 border-2 border-double rounded-lg p-4 sm:p-6 md:p-8 relative" style={{ borderColor: `${primaryColor}60` }}>

          {/* Corner ornaments */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 rounded-tl-lg -translate-x-px -translate-y-px" style={{ borderColor: primaryColor }} />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 rounded-tr-lg translate-x-px -translate-y-px" style={{ borderColor: primaryColor }} />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 rounded-bl-lg -translate-x-px translate-y-px" style={{ borderColor: primaryColor }} />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 rounded-br-lg translate-x-px translate-y-px" style={{ borderColor: primaryColor }} />

          {/* Header with logos */}
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 flex-shrink-0">
              <img src={rmllShieldLogo} alt="RMLL Shield" className="w-full h-full object-contain" />
            </div>
            <div className="flex-1 text-center px-3 sm:px-6">
              <div className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] mb-1 sm:mb-2" style={{ color: primaryColor }}>
                Rocky Mountain Lacrosse League
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight" style={{ color: primaryColor }}>
                Franchise Certificate
              </h1>
              <div className="mt-2 sm:mt-3 h-0.5 mx-auto" style={{
                background: `linear-gradient(90deg, transparent, ${primaryColor}, transparent)`,
                maxWidth: '200px'
              }} />
            </div>
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 flex-shrink-0">
              {teamLogo ? (
                <img src={teamLogo} alt={teamName} className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full rounded-full flex items-center justify-center text-white text-xl sm:text-2xl font-black"
                  style={{ backgroundColor: primaryColor }}>
                  {teamName.charAt(0)}
                </div>
              )}
            </div>
          </div>

          {/* Official Franchise Name */}
          <div className="text-center mb-5 sm:mb-6 py-3 sm:py-4 rounded-lg" style={{ backgroundColor: `${primaryColor}08` }}>
            <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
              Official Franchise Name
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black" style={{ color: primaryColor }}>
              {displayName}
            </h2>
            {franchiseData.displayString && franchiseData.displayString !== displayName && (
              <p className="text-sm text-gray-500 mt-1">{franchiseData.displayString}</p>
            )}
          </div>

          {/* Season Status Badge */}
          <div className="mb-6 sm:mb-8">
            <StatusBadge
              status={franchiseData.approvalStatus}
              currentSeason={seasonYear}
              bondDate={franchiseData.bondSubmittedDate}
            />
          </div>

          {/* Franchise Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 mb-6 sm:mb-8 px-2 sm:px-4">
            <InfoRow
              icon={<Shield className="w-4 h-4" />}
              label="Division"
              value={displayDivision}
              color={primaryColor}
            />
            {franchiseData.memberSince && (
              <InfoRow
                icon={<Calendar className="w-4 h-4" />}
                label="RMLL Member Since"
                value={franchiseData.memberSince}
                color={primaryColor}
              />
            )}
            {franchiseData.teamCity && (
              <InfoRow
                icon={<MapPin className="w-4 h-4" />}
                label="City"
                value={franchiseData.teamCity}
                color={primaryColor}
              />
            )}
            <InfoRow
              icon={<Building2 className="w-4 h-4" />}
              label="Cheques Payable To"
              value={franchiseData.chequesPayableTo || '---'}
              color={primaryColor}
            />
            <InfoRow
              icon={<Mail className="w-4 h-4" />}
              label="EFT E-Mail Address"
              value={franchiseData.eftEmailAddress || '---'}
              color={primaryColor}
              isEmail={!!franchiseData.eftEmailAddress}
            />
            {/* Franchise ID removed per league request */}
            <InfoRow
              icon={<Building2 className="w-4 h-4" />}
              label="Organization"
              value={franchiseData.orgName || '---'}
              color={primaryColor}
            />
            {franchiseData.ageGroupName && (
              <InfoRow
                icon={<Users className="w-4 h-4" />}
                label="Age Group"
                value={franchiseData.ageGroupName}
                color={primaryColor}
              />
            )}
            {yearRange && (
              <InfoRow
                icon={<Calendar className="w-4 h-4" />}
                label="Years Active"
                value={yearRange}
                color={primaryColor}
              />
            )}
            {franchiseData.teamProvince && (
              <InfoRow
                icon={<MapPin className="w-4 h-4" />}
                label="Province"
                value={franchiseData.teamProvince}
                color={primaryColor}
              />
            )}
            {franchiseData.teamWebsite && (
              <InfoRow
                icon={<Building2 className="w-4 h-4" />}
                label="Website"
                value={franchiseData.teamWebsite}
                color={primaryColor}
                isLink
              />
            )}
            {franchiseData.teamEmail && (
              <InfoRow
                icon={<Mail className="w-4 h-4" />}
                label="Team Email"
                value={franchiseData.teamEmail}
                color={primaryColor}
                isEmail
              />
            )}
            {/* Formation Date, Formed By Statute, Financial Year End, Team Code removed per league request */}
          </div>

          {/* Contact Information */}
          {(franchiseData.primaryContact || franchiseData.secondaryContact) && (
            <>
              <div className="my-6 sm:my-8 flex items-center gap-4">
                <div className="flex-1 h-px" style={{ backgroundColor: `${primaryColor}30` }} />
                <Award className="w-5 h-5" style={{ color: primaryColor }} />
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: primaryColor }}>Franchise Contacts</span>
                <Award className="w-5 h-5" style={{ color: primaryColor }} />
                <div className="flex-1 h-px" style={{ backgroundColor: `${primaryColor}30` }} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {franchiseData.primaryContact && <ContactCard contact={franchiseData.primaryContact} color={primaryColor} />}
                {franchiseData.secondaryContact && <ContactCard contact={franchiseData.secondaryContact} color={primaryColor} />}
              </div>
            </>
          )}

          {/* Footer seal */}
          <div className="mt-8 sm:mt-10 pt-4 sm:pt-6 border-t text-center" style={{ borderColor: `${primaryColor}20` }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider"
              style={{ backgroundColor: `${primaryColor}10`, color: primaryColor }}>
              <Shield className="w-3.5 h-3.5" />
              Official RMLL Franchise Document
              <Shield className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Decorative bottom border */}
        <div className="h-3" style={{ background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor || primaryColor}, ${primaryColor})` }} />
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value, color, isEmail, isLink }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  isEmail?: boolean;
  isLink?: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5 py-1.5">
      <div className="mt-0.5 text-gray-400">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</div>
        {isEmail && value !== '---' ? (
          <a href={`mailto:${value}`} className="text-sm font-semibold hover:underline truncate block" style={{ color }}>
            {value}
          </a>
        ) : isLink && value !== '---' ? (
          <a href={value.startsWith('http') ? value : `https://${value}`} target="_blank" rel="noopener noreferrer"
            className="text-sm font-semibold hover:underline truncate block" style={{ color }}>
            {value}
          </a>
        ) : (
          <div className="text-sm font-semibold text-gray-800 truncate">{value}</div>
        )}
      </div>
    </div>
  );
}