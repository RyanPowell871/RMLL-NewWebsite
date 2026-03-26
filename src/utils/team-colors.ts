
export interface TeamColors {
  primary: string;
  secondary: string;
  tertiary: string;
}

export const TEAM_COLOR_MAP: Record<string, TeamColors> = {
  // Senior B
  'Calgary Shamrocks': { primary: '#006847', secondary: '#FDB913', tertiary: '#FFFFFF' },
  'Shamrocks': { primary: '#006847', secondary: '#FDB913', tertiary: '#FFFFFF' },
  
  'Calgary Mountaineers': { primary: '#000000', secondary: '#FF6600', tertiary: '#FFFFFF' },
  'Calgary Rockies': { primary: '#000000', secondary: '#FF6600', tertiary: '#FFFFFF' },
  'Rockies': { primary: '#000000', secondary: '#FF6600', tertiary: '#FFFFFF' },
  
  'Rockyview Knights': { primary: '#000000', secondary: '#C0C0C0', tertiary: '#FFFFFF' },
  'Knights': { primary: '#000000', secondary: '#C0C0C0', tertiary: '#FFFFFF' },
  
  'Edmonton Warriors': { primary: '#1D428A', secondary: '#FFC72C', tertiary: '#FFFFFF' },
  
  // Junior B Tier I
  'Calgary Chill': { primary: '#003087', secondary: '#FFFFFF', tertiary: '#A2AAAD' },
  'Chill': { primary: '#003087', secondary: '#FFFFFF', tertiary: '#A2AAAD' },

  'Rockyview Silvertips': { primary: '#004C54', secondary: '#A2AAAD', tertiary: '#FFFFFF' }, // Teal/Silver
  'Silvertips': { primary: '#004C54', secondary: '#A2AAAD', tertiary: '#FFFFFF' },

  'Manitoba Blizzard': { primary: '#542583', secondary: '#FDB913', tertiary: '#FFFFFF' },
  
  'Saskatchewan SWAT': { primary: '#000000', secondary: '#C1C6C8', tertiary: '#FFFFFF' },

  'Calgary Crude': { primary: '#000000', secondary: '#CE1126', tertiary: '#FFFFFF' }, // Black/Red
  'Crude': { primary: '#000000', secondary: '#CE1126', tertiary: '#FFFFFF' },

  'Red Deer Rampage': { primary: '#CE1126', secondary: '#000000', tertiary: '#FFFFFF' }, // Red/Black
  'Rampage': { primary: '#CE1126', secondary: '#000000', tertiary: '#FFFFFF' },

  'Okotoks Marauders': { primary: '#000000', secondary: '#FFFFFF', tertiary: '#C0C0C0' },
  'Marauders': { primary: '#000000', secondary: '#FFFFFF', tertiary: '#C0C0C0' },

  'Edmonton Jaybirds': { primary: '#003087', secondary: '#FFC72C', tertiary: '#FFFFFF' }, // Blue/Yellow

  // Junior A
  'Calgary Mountaineers Jr A': { primary: '#000000', secondary: '#FF6600', tertiary: '#FFFFFF' },
  'Okotoks Raiders': { primary: '#000000', secondary: '#FDB913', tertiary: '#FFFFFF' }, // Black/Gold
  'Raiders': { primary: '#000000', secondary: '#FDB913', tertiary: '#FFFFFF' },
  'St. Albert Miners': { primary: '#000000', secondary: '#FDB913', tertiary: '#FFFFFF' },
  'Miners': { primary: '#000000', secondary: '#FDB913', tertiary: '#FFFFFF' },
  'Edmonton Miners': { primary: '#000000', secondary: '#FDB913', tertiary: '#FFFFFF' },

  // Senior C & Others
  'Airdrie Mohawks': { primary: '#CE1126', secondary: '#000000', tertiary: '#FFFFFF' }, // Red/Black
  'Mohawks': { primary: '#CE1126', secondary: '#000000', tertiary: '#FFFFFF' },
  
  'Calgary Irish': { primary: '#006847', secondary: '#FFFFFF', tertiary: '#FDB913' }, // Green/White/Gold
  'Irish': { primary: '#006847', secondary: '#FFFFFF', tertiary: '#FDB913' },
  
  'Calgary Bears': { primary: '#000000', secondary: '#FFFFFF', tertiary: '#CE1126' }, // Black/White/Red
  'Bears': { primary: '#000000', secondary: '#FFFFFF', tertiary: '#CE1126' },
  
  'Olds Stingers': { primary: '#FDB913', secondary: '#000000', tertiary: '#FFFFFF' }, // Yellow/Black
  'Stingers': { primary: '#FDB913', secondary: '#000000', tertiary: '#FFFFFF' },
  
  'Vermilion Rage': { primary: '#CE1126', secondary: '#000000', tertiary: '#FFFFFF' },
  'Rage': { primary: '#CE1126', secondary: '#000000', tertiary: '#FFFFFF' },
  
  'Lethbridge Pioneers': { primary: '#003087', secondary: '#FFFFFF', tertiary: '#C0C0C0' },
  'Pioneers': { primary: '#003087', secondary: '#FFFFFF', tertiary: '#C0C0C0' },
};

export const getTeamColors = (teamName: string): TeamColors | undefined => {
  if (!teamName) return undefined;
  
  const normalized = teamName.trim();
  
  // Exact match
  if (TEAM_COLOR_MAP[normalized]) {
    return TEAM_COLOR_MAP[normalized];
  }

  // Partial match
  const key = Object.keys(TEAM_COLOR_MAP).find(k => normalized.includes(k) || k.includes(normalized));
  if (key) {
    return TEAM_COLOR_MAP[key];
  }

  return undefined;
};
