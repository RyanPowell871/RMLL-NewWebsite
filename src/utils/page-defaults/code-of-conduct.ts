import type { PageContentSchema } from '../page-content-types';

export const codeOfConductDefaults: PageContentSchema = {
  pageId: 'code-of-conduct',
  title: 'Code of Conduct',
  sections: [
    {
      id: 'header',
      title: 'Code of Conduct',
      blocks: [
        {
          type: 'hero',
          icon: 'Shield',
          title: 'Code of Conduct',
          subtitle: 'All Members, Members of Members, Officials, or other persons associated with the Rocky Mountain Lacrosse League are expected to uphold the following standards of conduct.',
        },
      ],
    },
    {
      id: 'conduct-items',
      title: 'Standards of Conduct',
      blocks: [
        {
          type: 'lettered-list',
          items: [
            { letter: 'A', text: 'Attempt at all times to work toward the goals and Mission Statement of the RMLL and the game of Lacrosse, and towards the betterment of its Members;' },
            { letter: 'B', text: 'Strive to heighten the image and dignity of the RMLL and the sport of Lacrosse as a whole, and to refrain from behavior which may discredit or embarrass the RMLL or the Game;' },
            { letter: 'C', text: 'Always be courteous and objective in dealings with other Members;' },
            { letter: 'D', text: 'Except when made through proper channels, refrain from unfavorable criticism of other Members or representatives of the RMLL;' },
            { letter: 'E', text: 'Strive to achieve excellence in the sport while supporting the concepts of Fair Play and a Drug-Free sport;' },
            { letter: 'F', text: 'Show respect for the cultural, social and political values of all participants in the sport;' },
            { letter: 'G', text: 'As a guest in a foreign country, other province or other Association, abide by the laws of the host and adhere to any social customs concerning conduct.' },
          ],
        },
      ],
    },
  ],
};
