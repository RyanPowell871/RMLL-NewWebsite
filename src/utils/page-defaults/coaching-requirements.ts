import type { PageContentSchema } from '../page-content-types';

export const coachingRequirementsDefaults: PageContentSchema = {
  pageId: 'coaching-requirements',
  title: 'Coaching Requirements',
  sections: [
    { id: 'header', title: 'Coaching Requirements', blocks: [
      { type: 'hero', icon: 'GraduationCap', title: 'Coaching Requirements', subtitle: 'All coaches in the RMLL must meet minimum certification and screening requirements as established by the ALA and Lacrosse Canada.' },
    ]},
    { id: 'requirements', title: 'Requirements by Division', blocks: [
      { type: 'heading', text: 'Certification Requirements', level: 2 },
      { type: 'paragraph', text: 'Coaching certification requirements vary by division level. All coaches must hold a valid coaching certification appropriate to their division and must complete the required screening checks.' },
      {
        type: 'card-grid', columns: 1,
        items: [
          { title: 'Junior B Tier II', description: 'Minimum Community Sport – Initiation certification (NCCP). Head coaches must complete the Competition – Introduction course within their first year.', icon: 'Users', color: 'blue' },
          { title: 'Junior B Tier I', description: 'Minimum Competition – Introduction certification. Head coaches must be working toward Competition – Development.', icon: 'Users', color: 'blue' },
          { title: 'Junior A', description: 'Minimum Competition – Development certification. Head coaches must hold or be actively pursuing Competition – Development Trained status.', icon: 'Trophy', color: 'red' },
          { title: 'Senior (ASL / Sr. C)', description: 'Minimum Competition – Introduction certification. Requirements align with ALA Senior division standards.', icon: 'Shield', color: 'green' },
        ],
      },
    ]},
    { id: 'screening', title: 'Screening', blocks: [
      { type: 'heading', text: 'Screening Requirements', level: 2 },
      { type: 'paragraph', text: 'All coaches must complete a Criminal Record Check (CRC) with Vulnerable Sector Search and the Respect in Sport Activity Leader certification before being permitted on the bench.' },
      { type: 'info-box', title: 'Important Deadline', variant: 'warning', content: 'All coaching certifications and screening requirements must be completed <strong>before the start of the regular season</strong>. Coaches who have not met the requirements will not be permitted on the bench.' },
    ]},
    { id: 'resources', title: 'Resources', blocks: [
      { type: 'heading', text: 'Coaching Resources', level: 2 },
      { type: 'link-list', items: [
        { label: 'Lacrosse Canada Coach Education', url: 'https://lacrosse.ca/development/coaching/', description: 'NCCP coaching courses and certification' },
        { label: 'Respect in Sport', url: 'https://www.respectinsport.com/', description: 'Online Activity Leader certification' },
        { label: 'ALA Coaching Page', url: 'https://www.albertalacrosse.com/', description: 'Alberta-specific coaching information' },
      ]},
    ]},
  ],
};
