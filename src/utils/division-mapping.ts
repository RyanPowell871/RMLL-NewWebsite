/**
 * Division mapping utilities for converting API division names
 * to the broad division categories and sub-divisions used in the UI.
 */

// Map API subdivision names to broader division categories
export function mapToBroadDivision(divisionName: string): string {
  if (divisionName === 'Alberta Major Female') return 'Alberta Major Female';
  if (divisionName === 'Alberta Major Senior Female') return 'Alberta Major Senior Female';
  if (divisionName === 'Jr. A') return 'Junior A';

  // Check Tier III and Tier II BEFORE Tier I since they contain "Tier I" as a substring
  if (divisionName.includes('Jr. Tier III')) return 'Junior B Tier III';
  if (divisionName.includes('Jr. B Tier II')) return 'Junior B Tier II';
  if (divisionName.includes('Jr. B Tier I')) return 'Junior B Tier I';

  if (divisionName === 'Sr. B') return 'Senior B';
  if (divisionName.includes('Sr. C')) return 'Senior C';

  return divisionName;
}

// Extract subdivision from API division name
export function extractSubDivision(apiDivisionName: string): string | undefined {
  // For Junior B Tier I: "Jr. B Tier I Central" -> "Central"
  if (apiDivisionName.includes('Jr. B Tier I')) {
    if (apiDivisionName.includes('Central')) return 'Central';
    if (apiDivisionName.includes('East')) return 'East';
    if (apiDivisionName.includes('North')) return 'North';
    if (apiDivisionName.includes('South')) return 'South';
    if (apiDivisionName.includes('Provincials')) return 'Provincials';
  }

  // For Junior B Tier II: "Jr. B Tier II North" -> "North"
  if (apiDivisionName.includes('Jr. B Tier II')) {
    // Check compound regions first before single-word matches
    if (apiDivisionName.includes('North Central')) return 'North Central';
    if (apiDivisionName.includes('North East')) return 'North East';
    if (apiDivisionName.includes('North') && !apiDivisionName.includes('North Central') && !apiDivisionName.includes('North East')) return 'North';
    if (apiDivisionName.includes('South Central')) return 'South Central';
    if (apiDivisionName.includes('South West')) return 'South West';
    if (apiDivisionName.includes('South') && !apiDivisionName.includes('South Central') && !apiDivisionName.includes('South West')) return 'South';
    if (apiDivisionName.includes('Provincials')) return 'Provincials';
  }

  // For Senior C: "Sr. C North" -> "North"
  if (apiDivisionName.includes('Sr. C')) {
    if (apiDivisionName.includes('North')) return 'North';
    if (apiDivisionName.includes('South')) return 'South';
    if (apiDivisionName.includes('Provincials')) return 'Provincials';
  }

  return undefined;
}