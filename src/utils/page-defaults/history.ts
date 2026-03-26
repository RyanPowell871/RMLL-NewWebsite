import type { PageContentSchema } from '../page-content-types';

export const historyDefaults: PageContentSchema = {
  pageId: 'history',
  title: 'League History',
  sections: [
    {
      id: 'intro',
      title: 'League History',
      blocks: [
        {
          type: 'hero', icon: 'History', title: 'League History',
          subtitle: 'Alberta has a rich history of lacrosse without many people even knowing it. Teams from Alberta have challenged for all four major trophies in Canadian box lacrosse and over the last 30 years Albertan teams have brought home five national championships. The following pages chronicle the history of lacrosse in this province — from the earliest pickup games in the 1880s to the modern RMLL and professional NLL franchises.',
        },
        { type: 'paragraph', text: '<em>Content referenced from the Outsider\'s Guide to the NLL, the Canadian Lacrosse Almanac by David Stewart-Candy, and the Canadian Lacrosse Association.</em>' },
      ],
    },
    {
      id: 'lacrosse-in-alberta',
      title: 'The History of Lacrosse in Alberta',
      collapsible: true, defaultOpen: true, icon: 'Landmark', accentColor: '#013fac',
      blocks: [
        { type: 'paragraph', text: 'Alberta has a rich history of lacrosse without many people even knowing it. In fact as part of the September 1st, 1905 Inauguration Celebrations as Alberta joined Canada, lacrosse (among other sports) was played to entertain the masses in Edmonton. One of our finest moments saw the Calgary Chinooks winning the Mann Cup for being the Senior Lacrosse Champions of Canada way back in 1914. In truth, teams from Alberta have challenged for all 4 major trophies in Canadian box lacrosse and over the last 30 years Albertan teams have brought home five national championships.' },
        { type: 'paragraph', text: 'Lacrosse was in Alberta even before the turn of the 20th century. In 1882 lacrosse equipment was available in Edmonton, and several pickup games were played there during the summer. The following March, the Edmonton Lacrosse Club was organized but, because of a lack of competition, it disbanded in 1885. The Calgary Lacrosse Club was organized in 1884 with Captain Boynton serving as the club\'s first president.' },
        { type: 'paragraph', text: 'After lagging interest, the Calgary Lacrosse Club was re-organized in 1887. Mr. Boag, a teacher who was to be elected as the club\'s president, organized a lacrosse meeting at the school house. A practice ground was secured on the prairie south of the railway tracks. Mr. Boag introduced the game to some of the older students in the school.' },
        { type: 'paragraph', text: 'Once the interest in the field game subsided and the interest of the box game grew. Teams sprung up from all over the province to battle for the provincial title until interest disappeared. Following the Second World War there is little recorded history dealing with lacrosse in Alberta.' },
      ],
    },
    {
      id: 'history-of-rmll',
      title: 'The History of the RMLL',
      collapsible: true, defaultOpen: true, icon: 'Shield', accentColor: '#b91c1c',
      blocks: [
        { type: 'paragraph', text: 'League play in this province has developed in many forms over the years and details are spotty at best. The Rocky Mountain Lacrosse League in its current form is a growing league with a bright future in the Sr. B ranks. As for its own origins, the RMLL in its current form dates to a 1998 introduction to Alberta lacrosse.' },
        { type: 'heading', text: 'Sr. B Champions', level: 4 },
        { type: 'championship-list', items: [
          { year: '2002', detail: 'Edmonton Outlaws defeated the Calgary Mountaineers 3 games to none' },
          { year: '2001', detail: 'Edmonton Outlaws' },
          { year: '2000', detail: 'Calgary Mountaineers' },
          { year: '1999', detail: 'Edmonton Outlaws' },
        ]},
        { type: 'heading', text: 'Jr. B Champions', level: 4 },
        { type: 'championship-list', items: [
          { year: '2002', detail: 'Edmonton Miners defeated the Edmonton Warriors 3 games to 0' },
          { year: '2001', detail: 'Edmonton Miners defeated the Calgary Jr. Mountaineers 4 games to 3' },
          { year: '2000', detail: 'Calgary Jr. Mountaineers defeated the Edmonton Miners 2 games to 1' },
          { year: '1999', detail: 'Edmonton Miners' },
          { year: '1998', detail: 'Edmonton Miners' },
          { year: '1997', detail: 'Edmonton Miners' },
          { year: '1996', detail: 'Edmonton Miners' },
          { year: '1995', detail: 'Edmonton Miners' },
        ]},
        { type: 'heading', text: 'Year by Year Standings', level: 3 },
        { type: 'table', title: '2002 Senior', headers: ['Team', 'GP', 'W', 'L', 'T', 'Pts', 'GF', 'GA', 'Stk.'], rows: [
          ['Edmonton Outlaws', '20', '17', '1', '2', '36', '249', '113', '1L'],
          ['Calgary Mountaineers', '20', '14', '3', '3', '31', '209', '146', '3W'],
          ['Red Deer Rage', '20', '9', '10', '1', '19', '184', '180', '5W'],
          ['Calgary Knights', '20', '2', '17', '1', '5', '126', '245', '5L'],
        ]},
        { type: 'table', title: '2002 Junior', headers: ['Team', 'GP', 'W', 'L', 'T', 'Pts', 'GF', 'GA', 'Stk.'], rows: [
          ['Edmonton Miners', '20', '14', '6', '0', '28', '205', '164', '1L'],
          ['Edmonton Warriors', '20', '8', '11', '1', '17', '160', '185', '2W'],
          ['Calgary Shamrocks', '20', '8', '12', '0', '16', '177', '210', '3L'],
          ['Calgary Warthogs', '20', '3', '15', '2', '8', '172', '247', '1W'],
        ]},
      ],
    },
    {
      id: 'previous-leagues',
      title: 'Previous Lacrosse Leagues in Alberta',
      collapsible: true, defaultOpen: false, icon: 'History', accentColor: '#6b21a8',
      blocks: [
        { type: 'paragraph', text: 'In 1979 a junior league in Alberta featured the <strong>Enoch Tomahawks</strong>, <strong>Calgary Clansmen</strong> and <strong>Calgary Mountaineers</strong>.' },
        { type: 'paragraph', text: 'In 1974 there was a junior league in southern Alberta comprised of the <strong>Calgary Irish</strong>, <strong>Calgary Royals</strong>, <strong>Calgary Shamrocks</strong>, <strong>Lethbridge Native</strong>, <strong>Nanton Blazers</strong> and <strong>Taber Ebony Hawks</strong>.' },
      ],
    },
    {
      id: 'amateur-lacrosse',
      title: 'Amateur Lacrosse in Alberta',
      collapsible: true, defaultOpen: false, icon: 'Award', accentColor: '#b45309',
      blocks: [
        { type: 'heading', text: "Challenging for the Founder's Cup", level: 4 },
        { type: 'paragraph', text: 'Competition for the National Championship in the Junior "B" classification was initiated by the Canadian Lacrosse Association in September, 1964. Alberta has been home to <strong>two Founder\'s Cup champions</strong> with the most recent in 1999.' },
        { type: 'championship-list', items: [
          { year: '2002', detail: "Edmonton Miners — Finished third at Founder's Cup" },
          { year: '2001', detail: "Edmonton Miners — Finished second at Founder's Cup" },
          { year: '1999', detail: "Edmonton Miners — WON FOUNDER'S CUP", highlight: true },
          { year: '1980', detail: "Enoch Tomahawks — WON FOUNDER'S CUP", highlight: true },
        ]},
        { type: 'heading', text: "Challenging for the President's Cup", level: 4 },
        { type: 'paragraph', text: 'The President\'s Cup is emblematic of Canadian Champions at the Senior "B" level. Alberta is home to <strong>three President\'s Cup championship squads</strong> since the inception of the Cup.' },
        { type: 'championship-list', items: [
          { year: '2002', detail: "Edmonton Outlaws — WON PRESIDENT'S CUP", highlight: true },
          { year: '1983', detail: "Calgary Mountaineers — WON PRESIDENT'S CUP", highlight: true },
          { year: '1975', detail: "Edmonton Fullers — WON PRESIDENT'S CUP", highlight: true },
        ]},
        { type: 'heading', text: 'Challenging for the Minto Cup', level: 4 },
        { type: 'paragraph', text: 'The Minto Cup is a beautiful silver cup donated by Lord Minto on May 31, 1901. In 1979 Alberta sent a team to the Minto Cup composed of primarily Edmonton based players.' },
        { type: 'heading', text: 'Challenging for the Mann Cup', level: 4 },
        { type: 'paragraph', text: 'Alberta\'s lone Mann Cup win came in 1914 when the Calgary Chinooks won the Senior Lacrosse Champions of Canada.' },
        { type: 'championship-list', items: [
          { year: '1914', detail: 'Calgary Chinooks — WON MANN CUP', highlight: true },
        ]},
      ],
    },
  ],
};
