import type { PageContentSchema } from '../page-content-types';

export const badStandingDefaults: PageContentSchema = {
  pageId: 'bad-standing',
  title: 'Players in Bad Standing',
  sections: [
    { id: 'header', title: 'Bad Standing', blocks: [
      { type: 'hero', icon: 'AlertTriangle', title: 'Players in Bad Standing', accentColor: '#dc2626', subtitle: 'Players listed in bad standing are ineligible to participate in RMLL activities until their obligations have been fulfilled.' },
    ]},
    { id: 'info', title: 'Information', blocks: [
      { type: 'paragraph', text: 'A player may be placed in bad standing for unpaid fines, outstanding suspensions, or other disciplinary matters. Players in bad standing cannot register, practice, or play until the matter is resolved.' },
      { type: 'info-box', title: 'Resolving Bad Standing', variant: 'warning', content: 'To resolve a bad standing status, contact the RMLL Executive Director or the Discipline and Appeal Commissioner. All outstanding fines must be paid and any suspension requirements completed before reinstatement.' },
    ]},
    { id: 'current-list', title: 'Current Bad Standing List', blocks: [
      { type: 'heading', text: 'Players Currently in Bad Standing', level: 2 },
      { type: 'table', headers: ['Date', 'Player', 'Team', 'Fees Owed'], rows: [
        ['20-Jan-26', 'Sarah Peever', 'Capital Region Saints', '2025 Season'],
        ['11-Jan-26', 'Tyler Johnson', 'Irish Sr. C', '2025 Season'],
        ['11-Jan-26', 'Cole Pederson', 'Irish Sr. C', '2025 Season'],
        ['11-Jan-26', 'Sam Morris', 'Irish Sr. C', '2025 Season'],
        ['11-Jan-26', 'Adam Stackard', 'Irish Sr. C', '2025 Season'],
        ['29-Dec-25', 'Taylor Burt', 'Pioneers Sr. C', '2025 Season'],
        ['29-Dec-25', 'Zach Kish', 'Pioneers Sr. C', '2025 Season'],
        ['21-Dec-25', 'Tyson Dziwenka', 'Crude Tier I', '2025 Season'],
        ['21-Dec-25', 'Hunter Cecka', 'Crude Tier I', '2025 Season'],
        ['21-Dec-25', 'Will Horne', 'Crude Tier I', '2024 & 2025 Seasons'],
        ['15-Dec-25', 'Declan McLaughlin', 'Bandits Tier II', '2025 Season'],
        ['13-Dec-25', 'Jay (JP) Telford', 'Bandits Tier II', '2025 Season'],
        ['5-Dec-25', 'Riley Robertson', 'Crude Tier II', '2025 Season'],
        ['31-Jan-24', 'Dawson Nielson', 'Warriors Sr. C', '2023 Season'],
        ['31-Jan-24', 'Karmen Ward', 'Warriors Sr. C', '2023 Season'],
        ['23-Jan-24', 'Maculay Brown', 'Calgary Irish', '2023 Season'],
        ['17-Jan-24', 'Bryton Seiersen', 'Crude Tier I', '2022 & 2023 Season'],
        ['10-Feb-19', 'Parker Read', 'Sabrecats Tier II', '2018 Season'],
        ['29-Jan-19', 'Taylor Dion', 'Crude Tier I', '2017 & 2018 Season'],
        ['24-Mar-18', 'Riley Lorenowicz', 'Crude Tier I', '2017 Season'],
        ['1-Mar-18', 'Duncan Smoot', 'Crude Tier I', '2017 Season'],
        ['1-Mar-18', 'Ben Holowaty', 'Crude Tier I', '2016 & 2017 Season'],
        ['5-Oct-17', 'Kirsten Kelly', 'Capital Region Saints', '2017 Season'],
        ['22-Mar-17', 'Cory Evans', 'Crude', '2016 Season'],
        ['9-Mar-17', 'Patrick McGinley', 'Crude', '2015 Season'],
        ['21-Jan-16', 'Chris Chysyk', 'Warriors Sr. B', '2015 Season'],
        ['28-Aug-15', 'Patrick Temple', 'Silvertips', '2015 Season'],
        ['23-Mar-15', 'Lochlan Munro', 'Tier II Titans', '2014 Season'],
        ['7-Mar-15', 'Patrick Temple', 'Shamrocks', '2014 Season'],
      ], note: 'List is updated as bad standing statuses are reported by Franchise Holders.'},
    ]},
  ],
};
