import type { PageContentSchema } from '../page-content-types';

export const awardsDefaults: PageContentSchema = {
  pageId: 'awards',
  title: 'Awards',
  sections: [
    { id: 'header', title: 'Awards', blocks: [
      { type: 'hero', icon: 'Trophy', title: 'RMLL Awards', subtitle: 'The Rocky Mountain Lacrosse League recognizes outstanding achievement through a variety of awards presented across all divisions. Awards are selected by division commissioners, team votes, and league officials.' },
    ]},
    { id: 'awards-info', title: 'Division Awards', blocks: [
      { type: 'paragraph', text: 'Awards are presented in each RMLL division at the end of the regular season and playoffs. Select a division from the Division Info page to view specific award winners and history.' },
      { type: 'info-box', title: 'Award Categories', variant: 'info', content: 'Awards include MVP, Top Scorer, Best Goaltender, Most Sportsmanlike, Rookie of the Year, and other division-specific awards. See individual division pages for full award listings.' },
    ]},
  ],
};
