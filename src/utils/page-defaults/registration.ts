import type { PageContentSchema } from '../page-content-types';

export const registrationDefaults: PageContentSchema = {
  pageId: 'registration',
  title: 'Intent-to-Play',
  sections: [
    {
      id: 'header',
      title: 'Intent-to-Play Registration',
      blocks: [
        {
          type: 'hero',
          icon: 'ClipboardList',
          title: 'RMLL Intent-to-Play Registration',
          subtitle: 'All players wishing to play in the Rocky Mountain Lacrosse League must complete the Intent-to-Play registration process through RAMP Interactive.',
        },
      ],
    },
    {
      id: 'divisions',
      title: 'Division Breakdown',
      blocks: [
        { type: 'heading', text: 'RMLL Divisions', level: 2 },
        {
          type: 'card-grid',
          columns: 2,
          items: [
            { title: 'Female Junior', description: 'DOB 2009, 2008, 2007, 2006, 2005', icon: 'Users', color: 'red' },
            { title: 'Female Senior', description: 'DOB 2004 or earlier', icon: 'Users', color: 'red' },
            { title: 'Senior', description: 'DOB 2004 or earlier — Sr. B (ASL) or Sr. C', icon: 'Users', color: 'blue' },
            { title: 'Junior', description: 'DOB 2009, 2008, 2007, 2006, 2005 — Jr. A, Tier I or Tier II', icon: 'Users', color: 'blue' },
          ],
        },
      ],
    },
    {
      id: 'steps',
      title: 'Registration Steps',
      blocks: [
        { type: 'heading', text: 'How to Register', level: 2 },
        {
          type: 'steps',
          items: [
            { step: 1, title: 'Log in to RAMP', description: 'Enter your RAMP login. If you played lacrosse in Alberta in 2025 or if you played for another sport that RAMP hosts the registration for, you will have a RAMP login. If you are new to Alberta lacrosse in 2026 and do not currently have RAMP for registration for another sport, you will need to create a RAMP Account.' },
            { step: 2, title: 'Register as a Participant', description: 'Select "Register as a Participant" from the options.' },
            { step: 3, title: 'Select Season', description: 'Select "2026 Box Transfer Season".' },
            { step: 4, title: 'Select Family Member', description: 'Select which Family Member you want to Register (enter or review that information is correct).' },
            { step: 5, title: 'Select Your Division', description: 'Select one of the four RMLL Divisions (see division breakdown below).' },
            { step: 6, title: 'Pay Registration Fee', description: 'ALA Player Registration Fee — $87.00 plus admin fee (this payment is submitted directly to the ALA).' },
            { step: 7, title: 'Waivers (Under 18)', description: 'Players under 18 will need to have a Parent or Guardian sign the ALA and LC Waivers.' },
            { step: 8, title: 'Complete Registration', description: 'Please enter all the requested information. Once complete, you will receive an RMLL Registration Confirmation e-mail.' },
          ],
        },
        {
          type: 'button-link',
          label: 'Register on RAMP Interactive',
          sublabel: 'Intent-to-Play',
          url: 'https://www.rframp.com/rmll/',
          icon: 'ExternalLink',
        },
      ],
    },
    {
      id: 'important-notes',
      title: 'Important Notes',
      blocks: [
        {
          type: 'info-box',
          title: 'Important',
          variant: 'warning',
          content: '<p><strong>Intent-to-Play registration is NOT a team registration.</strong> You are registering your intent to play in the RMLL. Team selection and rostering is handled separately by each member association.</p><p>Players must complete Intent-to-Play <strong>before</strong> being placed on a team roster.</p>',
        },
        {
          type: 'info-box',
          title: 'Transfer Players',
          variant: 'info',
          content: 'If you are transferring from another province or league, please contact the RMLL Executive Director for transfer requirements before completing your Intent-to-Play registration.',
        },
      ],
    },
  ],
};
