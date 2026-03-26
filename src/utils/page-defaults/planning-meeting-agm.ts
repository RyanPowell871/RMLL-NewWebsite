import type { PageContentSchema } from '../page-content-types';

export const planningMeetingAGMDefaults: PageContentSchema = {
  pageId: 'planning-meeting-agm',
  title: 'Planning Meeting & AGM',
  sections: [
    { id: 'header', title: 'Planning Meeting & AGM', blocks: [
      { type: 'hero', icon: 'Calendar', title: 'Planning Meeting & AGM', subtitle: 'Information about the RMLL\'s annual Planning Meeting and Annual General Meeting (AGM).' },
    ]},
    { id: 'planning-meeting', title: 'Planning Meeting', collapsible: true, defaultOpen: true, icon: 'Calendar', accentColor: '#013fac', blocks: [
      { type: 'paragraph', text: 'The RMLL Planning Meeting is held annually, typically in the fall, to discuss league operations, schedules, and planning for the upcoming season. All member associations are expected to attend.' },
      { type: 'info-box', title: 'Next Planning Meeting', variant: 'info', content: 'Details for the next Planning Meeting will be posted here when available.' },
    ]},
    { id: 'agm', title: 'Annual General Meeting', collapsible: true, defaultOpen: true, icon: 'Users', accentColor: '#b91c1c', blocks: [
      { type: 'paragraph', text: 'The Annual General Meeting (AGM) is held each year to review the previous season, elect executive members, approve financial statements, and conduct other official league business. The AGM is the highest governing body of the RMLL.' },
      { type: 'info-box', title: 'Next AGM', variant: 'info', content: 'Details for the next AGM will be posted here when available.' },
    ]},
  ],
};
