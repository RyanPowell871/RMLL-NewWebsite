import type { PageContentSchema } from '../page-content-types';

export const newPlayerInfoDefaults: PageContentSchema = {
  pageId: 'new-player-info',
  title: 'New Player Information',
  sections: [
    { id: 'header', title: 'New Player Info', blocks: [
      { type: 'hero', icon: 'Users', title: 'New Player Information', subtitle: 'Welcome to lacrosse! Everything you need to know about getting started in the Rocky Mountain Lacrosse League.' },
    ]},
    { id: 'overview', title: 'Overview', blocks: [
      { type: 'paragraph', text: 'The RMLL welcomes players of all experience levels. Whether you\'re a seasoned athlete looking to try a new sport or completely new to lacrosse, there\'s a place for you in our league.' },
    ]},
    { id: 'getting-started', title: 'Getting Started', collapsible: true, defaultOpen: true, icon: 'ArrowRight', accentColor: '#013fac', blocks: [
      { type: 'steps', items: [
        { step: 1, title: 'Attend a Combine or Info Session', description: 'The RMLL hosts annual combines and info sessions for new players. These events are a great way to meet teams and learn about opportunities.' },
        { step: 2, title: 'Complete Intent-to-Play', description: 'Register through RAMP Interactive to express your intent to play in the RMLL. This is required before being placed on a team roster.' },
        { step: 3, title: 'Connect with a Team', description: 'Contact your local lacrosse association or the appropriate RMLL Division Commissioner to find a team in your area.' },
        { step: 4, title: 'Get Your Equipment', description: 'Box lacrosse requires specific equipment including a helmet with face cage, gloves, arm pads, shoulder pads, kidney pads, and a stick.' },
      ]},
    ]},
    { id: 'equipment', title: 'Equipment', collapsible: true, defaultOpen: false, icon: 'Shield', accentColor: '#b91c1c', blocks: [
      { type: 'paragraph', text: 'New players will need the following equipment to participate in box lacrosse:' },
      { type: 'list', items: [
        'CSA-certified lacrosse helmet with full face cage',
        'Lacrosse gloves',
        'Shoulder pads (lacrosse-specific recommended)',
        'Arm guards/elbow pads',
        'Kidney/rib pads',
        'Athletic cup (mandatory)',
        'Lacrosse stick (field or box — check with your team for specifications)',
        'Running shoes (non-marking soles for indoor floors)',
      ]},
      { type: 'info-box', variant: 'info', content: 'Many teams and associations have loaner equipment available for new players. Contact your local association to inquire about equipment programs.' },
    ]},
    { id: 'contact', title: 'Questions?', blocks: [
      { type: 'info-box', title: 'Need Help?', variant: 'info', content: 'Contact the RMLL Executive Director at <strong>christinethielen@hotmail.com</strong> or the Development Commissioner at <strong>greghart@mac.com</strong> for more information about getting started in the RMLL.' },
    ]},
  ],
};
