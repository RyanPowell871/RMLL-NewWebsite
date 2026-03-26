import type { PageContentSchema } from '../page-content-types';

export const officiatingApplicationFormDefaults: PageContentSchema = {
  pageId: 'officiating-application-form',
  title: 'Officials Application Form',
  sections: [
    { id: 'header', title: 'Officials Application', blocks: [
      { type: 'hero', icon: 'ClipboardList', title: 'Officials Application Form', subtitle: 'Interested in officiating in the RMLL? Complete the application form below to get started.' },
    ]},
    { id: 'content', title: 'Application Info', blocks: [
      { type: 'paragraph', text: 'The RMLL is always looking for qualified officials to join our ranks. Whether you are an experienced official looking to transition to the RMLL or a newcomer interested in learning the craft, we welcome your application.' },
      { type: 'info-box', title: 'Contact', variant: 'info', content: 'For more information about officiating opportunities, please contact the RMLL Official in Charge at <strong>rmll.ric@gmail.com</strong>.' },
    ]},
  ],
};
