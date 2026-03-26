// Import team logos
import shamrocksLogo from '../assets/team-logos/shamrocks.png';

// Import actual team logos from figma assets
import shamrocksFigma from 'figma:asset/451bbc9cb0dc69d999248789df7937a5d31b2bc3.png';
import rockiesFigma from 'figma:asset/7731aebae94e152f358806079868cc4565ee122c.png';
import silvertipsFigma from 'figma:asset/684000dca4c85b66ba1fc0229c1108f3ed19c423.png';
import coloradoFigma from 'figma:asset/7b200b07ad33b0b371963d2489b2746b0467043c.png';
import crudeFigma from 'figma:asset/624710d201f00439999e5d9f4d18a983f346e1b2.png';
import rampageFigma from 'figma:asset/c2b0866dd6acd5ea1a4ca18182e137eb37131c88.png';
import minersFigma from 'figma:asset/c3375bd0e02fabde77ddb66c0a787ba94e764633.png'; // Using player1 image as placeholder for Miners/Warriors
import mohawksFigma from 'figma:asset/d0bd194ae7fedd351b458800991877caa16cc04e.png'; // Using player2 image as placeholder
import genericFigma from 'figma:asset/9b091c3d4bd03bfbc83d38b4b13f1f631f7e7d98.png'; // Using player3 image as generic placeholder

// Team logo mapping - maps team names to their logo images
const TEAM_LOGO_MAP: Record<string, string> = {
  // Senior B
  'Calgary Shamrocks': shamrocksFigma,
  'Shamrocks': shamrocksFigma,
  'Calgary Mountaineers': rockiesFigma,
  'Calgary Rockies': rockiesFigma,
  'Rockies': rockiesFigma,
  'Rockyview Knights': silvertipsFigma, // Placeholder
  // Junior B Tier I
  'Calgary Chill': silvertipsFigma, // Placeholder
  'Rockyview Silvertips': silvertipsFigma,
  'Silvertips': silvertipsFigma,
  'Calgary Crude': crudeFigma,
  'Crude': crudeFigma,
  'Red Deer Rampage': rampageFigma,
  'Rampage': rampageFigma,
  // Junior A
  'Calgary Mountaineers Jr A': rockiesFigma,
  // Senior C & Others (Generic Matching)
  'Miners': minersFigma,
  'St. Albert Miners': minersFigma,
  'Edmonton Miners': minersFigma,
  'Sr.C Miners': minersFigma,
  'Mohawks': mohawksFigma,
  'Airdrie Mohawks': mohawksFigma,
  'Irish': shamrocksFigma, // Reuse Shamrocks for Irish (Green)
  'Bears': genericFigma,
  'Warriors': minersFigma, // Reuse Miners for Warriors
  'Edmonton Warriors': minersFigma,
  'Jaybirds': genericFigma,
  'Outlaws': mohawksFigma,
  'Raiders': mohawksFigma,
  'Okotoks Raiders': mohawksFigma,
  'Marauders': mohawksFigma,
};

// Normalize team name for lookup
const normalizeTeamName = (name: string): string => {
  if (!name) return '';
  return name.trim();
};

/**
 * Get team logo URL by team name
 * @param teamName - Name of the team
 * @param apiLogoUrl - Optional logo URL from API
 * @returns Logo URL
 */
export const getTeamLogo = (teamName: string, apiLogoUrl?: string): string => {
  // First try the API logo URL if it's valid (not a placeholder or empty)
  if (apiLogoUrl && apiLogoUrl.length > 10) {
    return apiLogoUrl;
  }
  
  const normalized = normalizeTeamName(teamName);
  
  // Try exact match
  if (TEAM_LOGO_MAP[normalized]) {
    return TEAM_LOGO_MAP[normalized];
  }
  
  // Try partial match
  const key = Object.keys(TEAM_LOGO_MAP).find(k => normalized.includes(k) || k.includes(normalized));
  if (key) {
    return TEAM_LOGO_MAP[key];
  }
  
  // Final fallback to default logo
  return shamrocksFigma;
};