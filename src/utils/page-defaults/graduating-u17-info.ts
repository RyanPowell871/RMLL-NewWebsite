import type { PageContentSchema } from '../page-content-types';

export const graduatingU17InfoDefaults: PageContentSchema = {
  pageId: 'graduating-u17-info',
  title: 'Graduating U17 Info Sessions',
  sections: [
    { id: 'header', title: 'Graduating U17 Info', blocks: [
      { type: 'hero', icon: 'GraduationCap', title: 'Graduating U17 Info Sessions', subtitle: 'Information sessions for U17 players transitioning to Junior-level lacrosse in the RMLL.' },
    ]},
    { id: 'overview', title: 'Overview', blocks: [
      { type: 'paragraph', text: 'If you are a U17 (Midget) player aging out of minor lacrosse, the RMLL offers information sessions to help you understand the transition to Junior-level play. These sessions cover the draft process, team expectations, and what to expect at the Junior level.' },
    ]},
    { id: 'sessions', title: 'Upcoming Sessions', blocks: [
      { type: 'info-box', title: 'Session Details', variant: 'info', content: 'Details for upcoming Graduating U17 Info Sessions will be posted here when available. Sessions are typically held in the fall/winter before the upcoming season.' },
    ]},
    { id: 'contact', title: 'Contact', blocks: [
      { type: 'info-box', title: 'Questions?', variant: 'info', content: 'Contact the RMLL Development Commissioner at <strong>greghart@mac.com</strong> for more information about the U17 transition process.' },
    ]},
  ],
};
