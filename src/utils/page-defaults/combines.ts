import type { PageContentSchema } from '../page-content-types';

export const combinesDefaults: PageContentSchema = {
  pageId: 'combines',
  title: 'Combines',
  sections: [
    { id: 'header', title: 'Combines', blocks: [
      { type: 'hero', icon: 'Users', title: 'RMLL Junior Combines', subtitle: 'The RMLL hosts annual combines in Northern and Southern Alberta for graduating U17 and Tier II players looking to showcase their skills for Junior teams.' },
    ]},
    { id: 'north-combine', title: 'North Junior Combine', collapsible: true, defaultOpen: true, icon: 'MapPin', accentColor: '#013fac', blocks: [
      { type: 'key-value', items: [
        { label: 'Date', value: 'Saturday, January 24, 2026', icon: 'Calendar' },
        { label: 'Time', value: '6:00 PM to 9:00 PM', icon: 'Clock' },
        { label: 'Location', value: 'Servus Credit Union Place — Place Orion Plastics S Field House, St. Albert', icon: 'MapPin' },
        { label: 'Cost', value: '$40.00', icon: 'DollarSign' },
        { label: 'Who', value: 'GELC, Wheatland, and Grande Prairie Graduating U17 and Tier II Players.', icon: 'Users' },
        { label: 'Deadline', value: 'Monday, January 19, 2026', icon: 'Calendar' },
      ]},
      { type: 'button-link', label: 'Register for North Combine', url: 'https://www.sportzsoft.com/regApp/Login?OrgId=4023', icon: 'ExternalLink' },
    ]},
    { id: 'south-combine', title: 'South Junior Combine', collapsible: true, defaultOpen: true, icon: 'MapPin', accentColor: '#b91c1c', blocks: [
      { type: 'key-value', items: [
        { label: 'Date', value: 'Sunday, February 15, 2026', icon: 'Calendar' },
        { label: 'Time', value: '11:30 AM to 2:30 PM', icon: 'Clock' },
        { label: 'Location', value: 'Scotiabank Saddledome, Calgary', icon: 'MapPin' },
        { label: 'Cost', value: '$70 — Includes a ticket to the Roughnecks/Georgia Swarm game at 6:00 PM.', icon: 'DollarSign' },
        { label: 'Who', value: 'CALL, CDLA, and SALA Graduating U17 and Tier II Players.', icon: 'Users' },
        { label: 'Deadline', value: 'Monday, February 9, 2026', icon: 'Calendar' },
      ]},
      { type: 'info-box', variant: 'warning', content: 'Registration for the South Combine is limited to 72 players and 12 goalies, so please register early.' },
      { type: 'button-link', label: 'Register for South Combine', url: 'https://www.sportzsoft.com/regApp/Login?OrgId=4023', icon: 'ExternalLink' },
    ]},
  ],
};
