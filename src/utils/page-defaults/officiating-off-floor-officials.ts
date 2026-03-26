import type { PageContentSchema } from '../page-content-types';

export const officiatingOffFloorOfficialsDefaults: PageContentSchema = {
  pageId: 'officiating-off-floor-officials',
  title: 'Off-Floor Officials',
  sections: [
    { id: 'header', title: 'Off-Floor Officials', blocks: [
      { type: 'hero', icon: 'Users', title: 'Off-Floor Officials', subtitle: 'Information and requirements for off-floor officials including timekeepers, scorekeepers, and shot clock operators.' },
    ]},
    { id: 'content', title: 'Requirements', blocks: [
      { type: 'paragraph', text: 'Off-floor officials play a critical role in the administration of RMLL games. Each game requires qualified timekeepers, scorekeepers, and — where applicable — shot clock operators.' },
      { type: 'info-box', title: 'Training', variant: 'info', content: 'Off-floor officials must complete the required training as outlined by the RMLL and ALA. Contact the Official in Charge for training opportunities.' },
    ]},
  ],
};
