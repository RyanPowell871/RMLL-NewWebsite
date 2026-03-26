import type { PageContentSchema } from '../page-content-types';

export const lcalaInfoDefaults: PageContentSchema = {
  pageId: 'lcala-info',
  title: 'LC & ALA Info',
  sections: [
    { id: 'header', title: 'LC & ALA Info', blocks: [
      { type: 'hero', icon: 'Globe', title: 'Lacrosse Canada & ALA Information', subtitle: 'The RMLL operates under the governance of the Alberta Lacrosse Association (ALA) and Lacrosse Canada (LC). Here you\'ll find key information about both organizations.' },
    ]},
    { id: 'lacrosse-canada', title: 'Lacrosse Canada', collapsible: true, defaultOpen: true, icon: 'Globe', accentColor: '#013fac', blocks: [
      { type: 'paragraph', text: 'Lacrosse Canada is the national governing body for the sport of lacrosse in Canada. It oversees all aspects of the game including box lacrosse, field lacrosse, and inter-lacrosse at the national level.' },
      { type: 'link-list', items: [
        { label: 'Lacrosse Canada Website', url: 'https://lacrosse.ca', description: 'Official website of Lacrosse Canada' },
      ]},
    ]},
    { id: 'ala', title: 'Alberta Lacrosse Association', collapsible: true, defaultOpen: true, icon: 'Shield', accentColor: '#b91c1c', blocks: [
      { type: 'paragraph', text: 'The Alberta Lacrosse Association (ALA) is the provincial governing body for lacrosse in Alberta. The ALA oversees minor, junior, and senior lacrosse across the province.' },
      { type: 'link-list', items: [
        { label: 'Alberta Lacrosse Association', url: 'https://www.albertalacrosse.com/', description: 'Official website of the ALA' },
      ]},
    ]},
  ],
};
