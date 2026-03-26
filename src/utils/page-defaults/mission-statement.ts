import type { PageContentSchema } from '../page-content-types';

export const missionStatementDefaults: PageContentSchema = {
  pageId: 'mission-statement',
  title: 'Mission Statement',
  sections: [
    {
      id: 'who-we-are',
      title: 'Who We Are',
      blocks: [
        {
          type: 'hero',
          icon: 'Shield',
          title: 'Who We Are',
          subtitle: 'The Rocky Mountain Lacrosse League is a non-profit organization that is the governing body for Alberta amateur post midget lacrosse.',
        },
      ],
    },
    {
      id: 'mission',
      title: 'Our Mission',
      blocks: [
        {
          type: 'hero',
          icon: 'Target',
          title: 'Our Mission',
        },
        {
          type: 'blockquote',
          text: '"To govern and promote Alberta amateur post midget box lacrosse and provide continual participant development opportunities for the pursuit of excellence and enjoyment while fostering fair play, sportsmanship and a general community spirit among our Members."',
        },
      ],
    },
    {
      id: 'core-values',
      title: 'Core Values',
      blocks: [
        {
          type: 'hero',
          icon: 'Heart',
          title: 'Core Values',
          accentColor: '#dc2626',
        },
        {
          type: 'card-grid',
          columns: 2,
          items: [
            {
              title: 'Pursuit of Excellence',
              description: 'We provide continual participant development opportunities for athletes striving for excellence at every level of competition.',
              icon: 'Star',
              color: 'blue',
            },
            {
              title: 'Fair Play & Sportsmanship',
              description: 'Fair play and sportsmanship are at the heart of everything we do — on the floor, on the bench, and in the stands.',
              icon: 'Handshake',
              color: 'red',
            },
            {
              title: 'Community Spirit',
              description: 'We foster a general community spirit among our Members, building connections through the game of lacrosse across Alberta.',
              icon: 'Users',
              color: 'red',
            },
            {
              title: 'Enjoyment',
              description: 'At every level — from Junior to Senior, Tier II to Sr. B — we believe lacrosse should be enjoyable for players, coaches, officials, and fans alike.',
              icon: 'Target',
              color: 'blue',
            },
            {
              title: 'Player Development',
              description: 'We are committed to providing pathways for athletes to develop their skills, from grassroots play through to national-level competition.',
              icon: 'Shield',
              color: 'blue',
            },
            {
              title: 'Volunteerism',
              description: 'Our league is built on the dedication of volunteers — coaches, managers, officials, and board members who give their time to strengthen lacrosse in our communities.',
              icon: 'Heart',
              color: 'red',
            },
          ],
        },
      ],
    },
    {
      id: 'commitment',
      title: 'Our Commitment',
      blocks: [
        {
          type: 'info-box',
          title: 'Our Commitment',
          variant: 'dark',
          content: '<p>The RMLL is committed to working collaboratively with the Alberta Lacrosse Association (ALA), the Canadian Lacrosse Association (CLA), and all member clubs to advance the sport of lacrosse in Western Canada.</p><p>We recognize that the strength of our league lies in the dedication of our member associations, the passion of our players, and the unwavering support of families and communities across Alberta. Together, we are building a legacy for future generations of lacrosse players.</p>',
        },
      ],
    },
  ],
};
