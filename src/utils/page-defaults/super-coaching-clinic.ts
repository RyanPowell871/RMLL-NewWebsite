import type { PageContentSchema } from '../page-content-types';

export const superCoachingClinicDefaults: PageContentSchema = {
  pageId: 'super-coaching-clinic',
  title: 'Super Coaching Clinic',
  sections: [
    { id: 'header', title: 'Super Coaching Clinic', blocks: [
      { type: 'hero', icon: 'GraduationCap', title: 'Super Coaching Clinic', subtitle: 'The RMLL\'s annual coaching development event bringing together coaches from across Alberta for skill development, networking, and certification opportunities.' },
    ]},
    { id: 'details', title: 'Clinic Details', blocks: [
      { type: 'paragraph', text: 'The Super Coaching Clinic is an annual event designed to provide coaches with practical tools, drills, and strategies to enhance their coaching abilities. The clinic covers topics ranging from fundamental skill development to advanced game strategy.' },
      { type: 'info-box', title: 'Next Clinic', variant: 'info', content: 'Details for the next Super Coaching Clinic will be announced when available. Check back for dates, location, and registration information.' },
    ]},
  ],
};
