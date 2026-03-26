import { useEffect } from 'react';

const SITE_NAME = 'Rocky Mountain Lacrosse League';
const SITE_SHORT = 'RMLL';
const DEFAULT_DESCRIPTION = 'The Rocky Mountain Lacrosse League (RMLL) is Alberta\'s premier box lacrosse league, featuring competitive divisions from Junior to Senior across the province.';
const SITE_URL = 'https://rockymountainlax.com';

interface DocumentMetaOptions {
  title: string;
  description?: string;
  canonicalPath?: string;
  ogType?: 'website' | 'article';
  ogImage?: string;
  noIndex?: boolean;
}

function setMetaTag(name: string, content: string, attribute: 'name' | 'property' = 'name') {
  let tag = document.querySelector(`meta[${attribute}="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attribute, name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function setLinkTag(rel: string, href: string) {
  let tag = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!tag) {
    tag = document.createElement('link');
    tag.setAttribute('rel', rel);
    document.head.appendChild(tag);
  }
  tag.setAttribute('href', href);
}

function removeMetaTag(name: string, attribute: 'name' | 'property' = 'name') {
  const tag = document.querySelector(`meta[${attribute}="${name}"]`);
  if (tag) tag.remove();
}

export function useDocumentMeta({
  title,
  description = DEFAULT_DESCRIPTION,
  canonicalPath,
  ogType = 'website',
  ogImage,
  noIndex = false,
}: DocumentMetaOptions) {
  useEffect(() => {
    // Set document title
    const fullTitle = title === SITE_NAME ? title : `${title} | ${SITE_SHORT}`;
    document.title = fullTitle;

    // Standard meta tags
    setMetaTag('description', description);

    // Open Graph tags
    setMetaTag('og:title', fullTitle, 'property');
    setMetaTag('og:description', description, 'property');
    setMetaTag('og:type', ogType, 'property');
    setMetaTag('og:site_name', SITE_NAME, 'property');

    if (canonicalPath) {
      const fullUrl = `${SITE_URL}${canonicalPath}`;
      setLinkTag('canonical', fullUrl);
      setMetaTag('og:url', fullUrl, 'property');
    }

    if (ogImage) {
      setMetaTag('og:image', ogImage, 'property');
    }

    // Twitter Card tags
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:site', '@RMLaxL');
    setMetaTag('twitter:title', fullTitle);
    setMetaTag('twitter:description', description);
    if (ogImage) {
      setMetaTag('twitter:image', ogImage);
    }

    // Robots
    if (noIndex) {
      setMetaTag('robots', 'noindex, nofollow');
    } else {
      removeMetaTag('robots');
    }

    // Cleanup on unmount - reset to defaults
    return () => {
      document.title = SITE_NAME;
    };
  }, [title, description, canonicalPath, ogType, ogImage, noIndex]);
}

// Pre-defined meta configs for each page
export const PAGE_META = {
  home: {
    title: 'Rocky Mountain Lacrosse League',
    description: 'The Rocky Mountain Lacrosse League (RMLL) is Alberta\'s premier box lacrosse league. View schedules, standings, stats, and news for all divisions.',
    canonicalPath: '/',
  },
  schedule: {
    title: 'Game Schedule',
    description: 'View the complete RMLL game schedule across all divisions. Find upcoming games, scores, and venue information for Alberta box lacrosse.',
    canonicalPath: '/',
  },
  standings: {
    title: 'Standings',
    description: 'Current RMLL standings for all divisions. Track team records, points, and playoff positioning in Alberta box lacrosse.',
    canonicalPath: '/',
  },
  stats: {
    title: 'Player & Team Statistics',
    description: 'Detailed player and team statistics for the RMLL. View scoring leaders, goalie stats, and team performance across all divisions.',
    canonicalPath: '/',
  },
  teams: {
    title: 'Teams',
    description: 'Browse all RMLL teams across every division. View rosters, schedules, and team information for Alberta box lacrosse.',
    canonicalPath: '/',
  },
  divisionInfo: {
    title: 'Division Information',
    description: 'Explore RMLL divisions including Junior A, Junior B, Senior B, Senior C, and more. View season info, awards, championships, and transactions.',
    canonicalPath: '/',
  },
  news: {
    title: 'News',
    description: 'Latest news and updates from the Rocky Mountain Lacrosse League. Stay informed about Alberta box lacrosse events and announcements.',
    canonicalPath: '/',
  },
  documents: {
    title: 'Documents Library',
    description: 'Access RMLL official documents, bylaws, regulations, and league resources for Alberta box lacrosse.',
    canonicalPath: '/',
  },
  leagueInfo: {
    title: 'League Information',
    description: 'Learn about the Rocky Mountain Lacrosse League — our history, mission, executive team, rules, regulations, and resources for players and coaches.',
    canonicalPath: '/league-info',
  },
  contact: {
    title: 'Contact Us',
    description: 'Get in touch with the Rocky Mountain Lacrosse League. Find contact information for RMLL executives, division commissioners, and support.',
    canonicalPath: '/contact',
  },
  privacyPolicy: {
    title: 'Privacy Policy',
    description: 'Rocky Mountain Lacrosse League privacy policy. Learn how we collect, use, and protect your personal information.',
    canonicalPath: '/privacy-policy',
  },
  termsOfService: {
    title: 'Terms of Service',
    description: 'Rocky Mountain Lacrosse League terms of service. Review the terms and conditions for using the RMLL website.',
    canonicalPath: '/terms-of-service',
  },
  store: {
    title: 'Store',
    description: 'Shop official RMLL merchandise and gear. Support the Rocky Mountain Lacrosse League.',
    canonicalPath: '/',
  },
  cms: {
    title: 'Content Management',
    description: 'RMLL Content Management System.',
    noIndex: true,
  },
} as const;