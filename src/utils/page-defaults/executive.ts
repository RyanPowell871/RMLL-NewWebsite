import type { PageContentSchema } from '../page-content-types';

export const executiveDefaults: PageContentSchema = {
  pageId: 'rmll-executive',
  title: 'RMLL Executive',
  sections: [
    {
      id: 'header',
      title: 'RMLL Executive',
      blocks: [
        {
          type: 'hero',
          icon: 'Users',
          title: 'RMLL Executive',
          subtitle: 'The Rocky Mountain Lacrosse League is governed by an Executive comprised of volunteers from across Alberta who donate their time and expertise to administer and grow the sport of lacrosse in the province.',
        },
      ],
    },
    {
      id: 'current-executive',
      title: '2026 Executive',
      blocks: [
        {
          type: 'heading',
          text: '2026 Executive',
          level: 2,
        },
        {
          type: 'contact-table',
          items: [
            { position: 'President', name: 'Duane Bratt', email: 'dbratt@mtroyal.ca' },
            { position: 'Vice President', name: 'Greg Lintz', email: 'greg@purdonlaw.com' },
            { position: 'Executive Director', name: 'Christine Thielen', email: 'christinethielen@hotmail.com' },
            { position: 'Treasurer', name: 'Earl Caron', email: 'noracme79@gmail.com' },
            { position: 'ASL Commissioner', name: 'Norm Shaw', email: 'rmllsrb@gmail.com' },
            { position: 'Sr. C Commissioner', name: 'Melinda Campbell', email: 'rmllsrc@gmail.com' },
            { position: 'Jr. A Commissioner', name: 'Darrel Knight', email: 'darrelk1@me.com' },
            { position: 'Jr. B Tier I Commissioner', name: 'Ian Stewart', email: 'rmlljrbtierone@gmail.com' },
            { position: 'Jr. B Tier II Commissioner', name: 'Mike Medhurst', email: 'mmdhrst@gmail.com' },
            { position: 'Jr. B Tier II Assistant Commissioner', name: 'Josh Moore', email: 'josh.moore@sabrecatslax.com' },
            { position: 'Alberta Major Female Commissioner', name: 'Alex Traboulay', email: 'abladieslaxcomish@gmail.com' },
            { position: 'Development Commissioner', name: 'Greg Hart', email: 'greghart@mac.com' },
            { position: 'Discipline and Appeal Commissioner', name: 'Greg Lintz', email: 'greg@purdonlaw.com' },
            { position: 'Official in Charge', name: 'David Westwood', email: 'rmll.ric@gmail.com' },
            { position: 'Web Master', name: 'Amanda Thielen', email: '' },
          ],
        },
      ],
    },
    {
      id: 'duties',
      title: 'Duties & Responsibilities',
      collapsible: true,
      defaultOpen: false,
      icon: 'FileText',
      accentColor: '#013fac',
      blocks: [
        {
          type: 'paragraph',
          text: 'Each member of the RMLL Executive holds specific responsibilities as outlined in the RMLL Bylaws and Regulations. Below is a summary of the key duties for each position.',
        },
        {
          type: 'card-grid',
          columns: 1,
          items: [
            { title: 'President', description: 'Presides over all Executive and general meetings. Acts as the official spokesperson for the RMLL. Oversees all league operations and ensures compliance with bylaws.', icon: 'Shield', color: 'blue' },
            { title: 'Vice President', description: 'Assists the President and assumes presidential duties in the President\'s absence. Chairs special committees as assigned.', icon: 'Users', color: 'blue' },
            { title: 'Executive Director', description: 'Manages day-to-day league operations. Coordinates communications between the Executive, member associations, and external stakeholders.', icon: 'Briefcase', color: 'blue' },
            { title: 'Treasurer', description: 'Manages the financial affairs of the RMLL. Prepares financial statements and budgets. Ensures proper accounting of all league funds.', icon: 'DollarSign', color: 'green' },
            { title: 'Division Commissioners', description: 'Oversee operations within their respective divisions. Manage scheduling, standings, and playoff coordination. Serve as the primary contact for teams within their division.', icon: 'Trophy', color: 'red' },
          ],
        },
      ],
    },
  ],
};
