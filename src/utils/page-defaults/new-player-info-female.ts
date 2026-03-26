import type { PageContentSchema } from '../page-content-types';

export const newPlayerInfoFemaleDefaults: PageContentSchema = {
  pageId: 'new-player-info-female',
  title: 'New Player Information (Female)',
  sections: [
    { id: 'header', title: 'New Player Info (Female)', blocks: [
      { type: 'hero', icon: 'Users', title: 'New Player Information (Female)', subtitle: 'Information for female players interested in joining the Alberta Major Female division of the RMLL.' },
    ]},
    { id: 'overview', title: 'Overview', blocks: [
      { type: 'paragraph', text: 'The Alberta Major Female division provides competitive lacrosse opportunities for female athletes across the province. The division includes both Junior and Senior categories.' },
      { type: 'card-grid', columns: 2, items: [
        { title: 'Female Junior', description: 'DOB 2009, 2008, 2007, 2006, 2005', icon: 'Users', color: 'red' },
        { title: 'Female Senior', description: 'DOB 2004 or earlier', icon: 'Users', color: 'red' },
      ]},
    ]},
    { id: 'getting-started', title: 'Getting Started', blocks: [
      { type: 'paragraph', text: 'Female players follow the same Intent-to-Play registration process as all RMLL players. Select the appropriate Female division when registering.' },
      { type: 'info-box', title: 'Contact', variant: 'info', content: 'For more information about the Alberta Major Female division, contact the Commissioner at <strong>abladieslaxcomish@gmail.com</strong>.' },
    ]},
  ],
};
