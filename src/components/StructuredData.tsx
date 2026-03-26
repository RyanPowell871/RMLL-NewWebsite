import { useEffect } from 'react';

const ORGANIZATION_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'SportsOrganization',
  name: 'Rocky Mountain Lacrosse League',
  alternateName: 'RMLL',
  description: "Alberta's premier box lacrosse league featuring competitive divisions from Junior to Senior across the province.",
  url: 'https://rmll.com',
  sport: 'Box Lacrosse',
  location: {
    '@type': 'Place',
    name: 'Alberta',
    address: {
      '@type': 'PostalAddress',
      addressRegion: 'Alberta',
      addressCountry: 'CA',
    },
  },
  sameAs: [
    'https://x.com/RMLaxL',
  ],
  memberOf: {
    '@type': 'SportsOrganization',
    name: 'Alberta Lacrosse Association',
  },
};

const WEBSITE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Rocky Mountain Lacrosse League',
  alternateName: 'RMLL',
  url: 'https://rmll.com',
};

export function StructuredData() {
  useEffect(() => {
    // Add Organization schema
    const orgScript = document.createElement('script');
    orgScript.type = 'application/ld+json';
    orgScript.id = 'rmll-org-schema';
    orgScript.textContent = JSON.stringify(ORGANIZATION_SCHEMA);

    // Add WebSite schema
    const siteScript = document.createElement('script');
    siteScript.type = 'application/ld+json';
    siteScript.id = 'rmll-site-schema';
    siteScript.textContent = JSON.stringify(WEBSITE_SCHEMA);

    // Only add if not already present
    if (!document.getElementById('rmll-org-schema')) {
      document.head.appendChild(orgScript);
    }
    if (!document.getElementById('rmll-site-schema')) {
      document.head.appendChild(siteScript);
    }

    return () => {
      document.getElementById('rmll-org-schema')?.remove();
      document.getElementById('rmll-site-schema')?.remove();
    };
  }, []);

  return null;
}
