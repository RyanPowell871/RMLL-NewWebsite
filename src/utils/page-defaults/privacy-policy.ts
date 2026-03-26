import type { PageContentSchema } from '../page-content-types';

export const privacyPolicyDefaults: PageContentSchema = {
  pageId: 'privacy-policy',
  title: 'Privacy Policy',
  sections: [
    {
      id: 'header',
      title: 'Privacy Policy',
      blocks: [
        { type: 'hero', icon: 'Shield', title: 'Privacy Policy', subtitle: 'The Rocky Mountain Lacrosse League is committed to protecting the personal information of its members, participants, and stakeholders.' },
      ],
    },
    {
      id: 'policy-points',
      title: 'Policy Points',
      blocks: [
        {
          type: 'card-grid', columns: 2,
          items: [
            { title: 'Purpose of Collection', description: 'Personal information will be collected to determine eligibility for competitive and recreational opportunities, age related events, to facilitate enrollment, to disseminate information, to communicate, to administer and evaluate programs and promotions that benefit Members, and for insurance and statistical purposes.', icon: 'Eye', color: 'blue' },
            { title: 'Funding Requirements', description: 'In addition, personal information may be, from time to time, submitted to major funding bodies in order to verify registration and meeting funding requirements.', icon: 'FileText', color: 'blue' },
            { title: 'Consent', description: 'All information must be collected with the consent of the person or legal guardian.', icon: 'CheckCircle', color: 'green' },
            { title: 'Minimization', description: 'Personal information collection must be limited to what is absolutely necessary.', icon: 'Shield', color: 'purple' },
            { title: 'Accuracy', description: 'Personal information collected must be accurate, complete and up-to-date. Sources must be reliable.', icon: 'Target', color: 'blue' },
            { title: 'Access & Retention', description: 'All individuals whose information is maintained must be provided access to their personal information. Personal information must be retained only as long as it is required.', icon: 'Users', color: 'amber' },
          ],
        },
      ],
    },
    {
      id: 'contact',
      title: 'Contact',
      blocks: [
        { type: 'info-box', title: 'Questions?', variant: 'info', content: 'If you have any questions about the RMLL\'s privacy practices, please contact the Executive Director.' },
      ],
    },
  ],
};
