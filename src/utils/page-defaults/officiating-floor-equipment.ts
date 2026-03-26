import type { PageContentSchema } from '../page-content-types';

export const officiatingFloorEquipmentDefaults: PageContentSchema = {
  pageId: 'officiating-floor-equipment',
  title: 'Floor & Equipment',
  sections: [
    { id: 'header', title: 'Floor & Equipment', blocks: [
      { type: 'hero', icon: 'Wrench', title: 'Floor & Equipment Standards', subtitle: 'Standards and specifications for lacrosse floors and equipment used in RMLL play.' },
    ]},
    { id: 'content', title: 'Standards', blocks: [
      { type: 'paragraph', text: 'All RMLL games must be played on floors and with equipment that meets the standards established by the CLA and the RMLL. Officials are responsible for inspecting the floor and equipment before each game.' },
      { type: 'info-box', title: 'Official Standards', variant: 'info', content: 'Refer to the CLA Rulebook and RMLL Regulations for complete floor dimensions, goal specifications, and equipment requirements.' },
    ]},
  ],
};
