import type { PageContentSchema } from '../page-content-types';

export const officiatingRulebookDefaults: PageContentSchema = {
  pageId: 'officiating-rulebook',
  title: 'Officiating Rulebook',
  sections: [
    {
      id: 'header',
      title: 'Officiating Rulebook',
      blocks: [
        { type: 'paragraph', text: 'The RMLL follows the rules of Box Lacrosse as established by the <strong>Canadian Lacrosse Association (CLA)</strong>. All officials, coaches, players, and team staff are expected to be familiar with the current rulebook.' },
      ],
    },
    {
      id: 'rulebook-link',
      title: 'CLA Box Lacrosse Rulebook',
      blocks: [
        { type: 'heading', text: 'CLA Box Lacrosse Rulebook', level: 2 },
        { type: 'paragraph', text: 'The official CLA Box Lacrosse rulebook is the governing document for all RMLL play. It covers all aspects of the game including playing rules, penalties, equipment standards, and officiating mechanics.' },
        { type: 'button-link', label: 'View Box Lacrosse Rulebook', sublabel: 'Lacrosse Canada', url: 'https://lacrosse.ca/development/officials/rule-books/', icon: 'BookOpen' },
      ],
    },
    {
      id: 'resources',
      title: 'Key Resources for Officials',
      blocks: [
        { type: 'heading', text: 'Key Resources for Officials', level: 2 },
        {
          type: 'link-list',
          items: [
            { label: 'CLA Rule Books & Casebooks', url: 'https://lacrosse.ca/development/officials/rule-books/', description: 'Official rules, casebooks, and supplementary materials' },
            { label: 'Lacrosse Canada', url: 'https://lacrosse.ca', description: 'National governing body for lacrosse in Canada' },
          ],
        },
        { type: 'blockquote', text: '<strong>Note:</strong> The RMLL may adopt additional regulations that supplement or modify the CLA rules for league play. Refer to the <strong>RMLL Regulations</strong> page under Governance for league-specific rules.' },
      ],
    },
  ],
};
