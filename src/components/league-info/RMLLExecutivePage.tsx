import { useState } from 'react';
import { Users, FileText, Archive, ChevronDown } from 'lucide-react';

interface Executive {
  position: string;
  name: string;
  email: string;
}

interface Duty {
  position: string;
  responsibilities: string[];
}

interface HistoricalExecutive {
  position: string;
  name: string;
  email?: string;
}

// Current 2026 Executives
const CURRENT_EXECUTIVES: Executive[] = [
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
];

// Historical executives data organized by year
const EXECUTIVES_BY_YEAR: Record<string, HistoricalExecutive[]> = {
  '2025': [
    { position: 'President', name: 'Duane Bratt' },
    { position: 'Vice President', name: 'Greg Lintz' },
    { position: 'Executive Director', name: 'Christine Thielen' },
    { position: 'Treasurer', name: 'Earl Caron' },
    { position: 'ASL Commissioner', name: 'Norm Shaw' },
    { position: 'Sr. C Commissioner', name: 'Melinda Campbell' },
    { position: 'Interim Jr. A Commissioner', name: 'Greg Lintz' },
    { position: 'Jr. B Tier I Commissioner', name: 'Ian Stewart' },
    { position: 'Jr. B Tier II Commissioner', name: 'Mike Medhurst' },
    { position: 'Jr. B Tier II Assistant Commissioner', name: 'Josh Moore' },
    { position: 'Alberta Major Female Commissioner', name: 'Alex Traboulay' },
    { position: 'Development Commissioner', name: 'Greg Hart' },
    { position: 'Discipline and Appeal Commissioner', name: 'Vacant' },
    { position: 'Official In Charge', name: 'David Westwood' },
    { position: 'Web Master', name: 'Amanda Thielen' },
  ],
  '2024': [
    { position: 'President', name: 'Duane Bratt' },
    { position: 'Vice President', name: 'Greg Lintz' },
    { position: 'Executive Director', name: 'Christine Thielen' },
    { position: 'Treasurer', name: 'Earl Caron' },
    { position: 'ASL Commissioner', name: 'Norm Shaw' },
    { position: 'Sr. C Commissioner', name: 'Melinda Campbell' },
    { position: 'Interim Jr. A Commissioner', name: 'Greg Lintz' },
    { position: 'Jr. B Tier I Commissioner', name: 'Ian Stewart' },
    { position: 'Jr. B Tier II Commissioner', name: 'Darrel Knight' },
    { position: 'Jr. B Tier II Assistant Commissioner', name: 'Mike Medhurst' },
    { position: 'Alberta Major Female Commissioner', name: 'Alex Traboulay' },
    { position: 'Development Commissioner', name: 'Greg Hart' },
    { position: 'Discipline and Appeal Commissioner', name: 'Vacant' },
    { position: 'Referee In Chief', name: 'David Westwood' },
    { position: 'Web Master', name: 'Amanda Thielen' },
  ],
  '2023': [
    { position: 'President', name: 'Duane Bratt' },
    { position: 'Vice President', name: 'Greg Lintz' },
    { position: 'Executive Director', name: 'Christine Thielen' },
    { position: 'Treasurer', name: 'Earl Caron' },
    { position: 'ASL Commissioner', name: 'Norm Shaw' },
    { position: 'Sr. C Commissioner', name: 'Melinda Campbell' },
    { position: 'Interim Jr. A Commissioner', name: 'Greg Lintz' },
    { position: 'Jr. B Tier I Commissioner', name: 'Ian Stewart' },
    { position: 'Jr. B Tier II Commissioner', name: 'Darrel Knight' },
    { position: 'Alberta Major Female Commissioner', name: 'Alex Traboulay' },
    { position: 'Sr. Women\'s Commissioner', name: 'Alex Traboulay' },
    { position: 'Development Commissioner', name: 'Greg Hart' },
    { position: 'Discipline and Appeal Commissioner', name: 'John Tyrrell' },
    { position: 'Referee In Chief', name: 'David Westwood' },
    { position: 'Web Master', name: 'Amanda Thielen' },
  ],
  '2022': [
    { position: 'President', name: 'Duane Bratt' },
    { position: 'Interim Vice President', name: 'Greg Lintz' },
    { position: 'Executive Director', name: 'Christine Thielen' },
    { position: 'Treasurer', name: 'Earl Caron' },
    { position: 'Sr. B Commissioner', name: 'Norm Shaw' },
    { position: 'Sr. C Commissioner', name: 'Melinda Campbell' },
    { position: 'Interim Jr. A Commissioner', name: 'Greg Lintz' },
    { position: 'Interim Jr. B Tier I Commissioner', name: 'Jason Crook' },
    { position: 'Jr. B Tier II Commissioner', name: 'Pat Hanson' },
    { position: 'Interim Jr. Ladies Commissioner', name: 'Alex Traboulay' },
    { position: 'Sr. Women\'s Commissioner', name: 'Alex Traboulay' },
    { position: 'Development Commissioner', name: 'Greg Hart' },
    { position: 'Discipline and Appeal Commissioner', name: 'John Tyrrell' },
    { position: 'Referee In Chief', name: 'David Westwood' },
    { position: 'Web Master', name: 'Amanda Thielen' },
  ],
  '2021': [
    { position: 'President', name: 'Duane Bratt' },
    { position: 'Interim Vice President', name: 'Greg Lintz' },
    { position: 'Executive Director', name: 'Christine Thielen' },
    { position: 'Treasurer', name: 'Earl Caron' },
    { position: 'Sr. B Commissioner', name: 'Norm Shaw' },
    { position: 'Sr. C Commissioner', name: 'Tracey Haining' },
    { position: 'Jr. A Commissioner', name: 'Sean Aggus' },
    { position: 'Interim Jr. B Tier I Commissioner', name: 'Jason Crook' },
    { position: 'Jr. B Tier II Commissioner', name: 'Pat Hanson' },
    { position: 'Interim Jr. Ladies Commissioner', name: 'Alex Traboulay' },
    { position: 'Sr. Women\'s Commissioner', name: 'Alex Traboulay' },
    { position: 'Development Commissioner', name: 'Greg Hart' },
    { position: 'Discipline and Appeal Commissioner', name: 'John Tyrrell' },
    { position: 'Referee In Chief', name: 'David Westwood' },
    { position: 'Web Master', name: 'Amanda Thielen' },
  ],
  '2020': [
    { position: 'President', name: 'Duane Bratt' },
    { position: 'Vice President', name: 'Mike Fynn' },
    { position: 'Executive Director', name: 'Christine Thielen' },
    { position: 'Treasurer', name: 'Earl Caron' },
    { position: 'Sr. B Commissioner', name: 'Norm Shaw' },
    { position: 'Sr. C Commissioner', name: 'Tracey Haining' },
    { position: 'Jr. A Commissioner', name: 'Sean Aggus' },
    { position: 'Interim Jr. B Tier I Commissioner', name: 'Mike Fynn' },
    { position: 'Jr. B Tier II & Tier III Commissioner', name: 'Pat Hanson' },
    { position: 'Jr. Ladies Commissioner', name: 'Tammy Machado' },
    { position: 'Interim Sr. Ladies Commissioner', name: 'Alex Traboulay' },
    { position: 'Development Commissioner', name: 'Greg Hart' },
    { position: 'Discipline and Appeal Commissioner', name: 'John Tyrrell' },
    { position: 'Referee In Chief', name: 'David Westwood' },
    { position: 'Web Master', name: 'Amanda Thielen' },
  ],
  '2019': [
    { position: 'President', name: 'Duane Bratt' },
    { position: 'Vice President', name: 'Mike Fynn' },
    { position: 'Executive Director', name: 'Christine Thielen' },
    { position: 'Treasurer', name: 'Earl Caron' },
    { position: 'Sr. B Commissioner', name: 'Norm Shaw' },
    { position: 'Sr. C Commissioner', name: 'Tracey Haining' },
    { position: 'Jr. A Commissioner', name: 'Sean Aggus' },
    { position: 'Interim Jr. B Tier I Commissioner', name: 'Mike Fynn' },
    { position: 'Jr. B Tier II & Tier III Commissioner', name: 'Pat Hanson' },
    { position: 'Jr. Ladies Commissioner', name: 'Tammy Machado' },
    { position: 'Interim Sr. Ladies Commissioner', name: 'Alex Traboulay' },
    { position: 'Development Commissioner', name: 'Greg Hart' },
    { position: 'Discipline and Appeal Commissioner', name: 'John Tyrrell' },
    { position: 'Referee In Chief', name: 'David Westwood' },
    { position: 'Web Master', name: 'Amanda Thielen' },
  ],
  '2018': [
    { position: 'President', name: 'Duane Bratt', email: 'dbratt@mtroyal.ca' },
    { position: 'Vice-President', name: 'James Finkbeiner', email: 'james@calgarychill.ca' },
    { position: 'Executive Director', name: 'Christine Thielen', email: 'christinethielen@hotmail.com' },
    { position: 'Treasurer', name: 'Earl Caron', email: 'ecaron@atb.com' },
    { position: 'Sr. B Commissioner', name: 'Norm Shaw', email: 'rmllsrb@gmail.com' },
    { position: 'Sr. C Commissioner', name: 'Tracey Haining', email: 'laxergirl@outlook.com' },
    { position: 'Jr. A Commissioner', name: 'Mike Fynn', email: 'm.fynn27@gmail.com' },
    { position: 'Jr. B Tier I Commissioner', name: 'Tony Materi', email: 'trock@live.ca' },
    { position: 'Interim Jr. B Tier II Commissioner', name: 'James Finkbeiner', email: 'james@calgarychill.ca' },
    { position: 'Interim Jr. B Tier III Commissioner', name: 'James Finkbeiner', email: 'james@calgarychill.ca' },
    { position: 'Sr. Ladies Commissioner', name: 'Shauna Sterparn', email: 'sterparns@shaw.ca' },
    { position: 'Jr. Ladies Commissioner', name: 'Tammy Machado', email: 'abladieslaxcomish@gmail.com' },
    { position: 'Development Commissioner', name: 'Greg Hart', email: 'greghart@mac.com' },
    { position: 'Discipline and Appeal Commissioner', name: 'John Tyrrell', email: 'jetrmll@shaw.ca' },
    { position: 'Referee In Chief', name: 'David Westwood', email: 'rmll.ric@gmail.com' },
    { position: 'Web Master', name: 'Amanda Thielen' },
  ],
  '2017': [
    { position: 'President', name: 'Rioth Jomha', email: 'rjomha1@gmail.com' },
    { position: 'Vice-President', name: 'Duane Bratt', email: 'dbratt@mtroyal.ca' },
    { position: 'Executive Director', name: 'Christine Thielen', email: 'christinethielen@hotmail.com' },
    { position: 'Treasurer', name: 'Earl Caron', email: 'ecaron@atb.com' },
    { position: 'Sr. B Commissioner', name: 'Shauna Sterparn', email: 'sterparns@shaw.ca' },
    { position: 'Sr. C Commissioner', name: 'Tracey Haining', email: 'laxergirl@outlook.com' },
    { position: 'Jr. A Commissioner', name: 'Mike Fynn', email: 'm.fynn27@gmail.com' },
    { position: 'Jr. B Tier I Commissioner', name: 'Tony Materi', email: 'trock@live.ca' },
    { position: 'Jr. B Tier II Commissioner', name: 'Wayne Zadderey', email: 'wzadderey@gmail.com' },
    { position: 'Jr. B Tier III Commissioner', name: 'Rob Letendre', email: 'rrletendre@shaw.ca' },
    { position: 'Sr. Ladies Commissioner', name: 'Stacey Dziwenko', email: 'srladies@hotmail.com' },
    { position: 'Jr. Ladies Commissioner', name: 'Tom Perry', email: 'abladieslaxcomish@gmail.com' },
    { position: 'Development Commissioner', name: 'Greg Hart', email: 'greghart@mac.com' },
    { position: 'Discipline and Appeal Commissioner', name: 'John Tyrrell', email: 'jetrmll@shaw.ca' },
    { position: 'Referee In Chief', name: 'Warren Renden', email: 'netminerva@netscape.net' },
    { position: 'Web Master', name: 'Amanda Thielen' },
  ],
  '2016': [
    { position: 'President', name: 'Rioth Jomha', email: 'rjomha@telus.net' },
    { position: 'Vice-President', name: 'Duane Bratt', email: 'dbratt@mtroyal.ca' },
    { position: 'Executive Director', name: 'Christine Thielen', email: 'christinethielen@hotmail.com' },
    { position: 'Treasurer', name: 'Earl Caron', email: 'ecaron@atb.com' },
    { position: 'Sr. B Commissioner', name: 'Shauna Sterparn', email: 'sterparns@shaw.ca' },
    { position: 'Sr. C Interim Commissioner', name: 'Tracey Haining', email: 'laxergurl1@gmail.com' },
    { position: 'Jr. A Commissioner', name: 'Mike Fynn', email: 'm.fynn27@gmail.com' },
    { position: 'Jr. B Tier I Commissioner', name: 'Tony Materi', email: 'trock@live.ca' },
    { position: 'Jr. B Tier II Commissioner', name: 'Wayne Zadderey', email: 'wzadderey@gmail.com' },
    { position: 'Jr. B Tier III Commissioner', name: 'Tracey Haining', email: 'laxergurl1@gmail.com' },
    { position: 'Sr. & Jr. Ladies Commissioner', name: 'Tom Perry', email: 'abladieslaxcomish@gmail.com' },
    { position: 'Development Commissioner', name: 'Greg Hart', email: 'greghart@mac.com' },
    { position: 'Discipline and Appeal Commissioner', name: 'John Tyrrell', email: 'jetrmll@shaw.ca' },
    { position: 'Referee In Chief', name: 'Warren Renden', email: 'netminerva@netscape.net' },
    { position: 'Web Master', name: 'Amanda Thielen' },
  ],
  '2015': [
    { position: 'President', name: 'Rioth Jomha', email: 'rjomha@telus.net' },
    { position: 'Vice-President', name: 'Duane Bratt', email: 'dbratt@mtroyal.ca' },
    { position: 'Executive Director', name: 'Christine Thielen', email: 'christinethielen@hotmail.com' },
    { position: 'Treasurer', name: 'Earl Caron', email: 'ecaron@atb.com' },
    { position: 'Sr. B Commissioner', name: 'Shauna Sterparn', email: 'sterparns@shaw.ca' },
    { position: 'Sr. C Commissioner', name: 'Connie Hamilton', email: 'chamiltonlax@icloud.ca' },
    { position: 'Jr. A Interim Commissioner', name: 'Mike Fynn', email: 'mike.ultimatetradesmen@gmail.com' },
    { position: 'Jr. B Tier I Commissioner', name: 'Tony Materi', email: 'trock@live.ca' },
    { position: 'Jr. B Tier II Commissioner', name: 'Rob Letendre', email: 'rrletendre@shaw.ca' },
    { position: 'Jr. B Tier III Commissioner', name: 'Tracey Haining', email: 'laxergurl1@gmail.com' },
    { position: 'Sr. & Jr. Ladies Commissioner', name: 'Tom Perry', email: 'abladieslaxcomish@gmail.com' },
    { position: 'Development Commissioner', name: 'Greg Hart', email: 'greghart@mac.com' },
    { position: 'Discipline and Appeal Commissioner', name: 'Mike Fynn', email: 'mike.ultimatetradesmen@gmail.com' },
    { position: 'Referee In Chief', name: 'Warren Renden', email: 'netminerva@netscape.net' },
    { position: 'Web Master', name: 'Amanda Thielen' },
  ],
  '2014': [
    { position: 'President', name: 'Rioth Jomha', email: 'rjomha@telus.net' },
    { position: 'Vice-President', name: 'Duane Bratt', email: 'dbratt@mtroyal.ca' },
    { position: 'Executive Director', name: 'Christine Thielen', email: 'christinethielen@hotmail.com' },
    { position: 'Treasurer', name: 'Earl Caron', email: 'ecaron@atb.com' },
    { position: 'Sr. B Commissioner', name: 'Shauna Sterparn', email: 'sterparns@shaw.ca' },
    { position: 'Sr. C Commissioner', name: 'Connie Hamilton', email: 'chamiltonlax@shaw.ca' },
    { position: 'Jr. A Interim Commissioner', name: 'Mike Fynn', email: 'mike.ultimatetradesmen@gmail.com' },
    { position: 'Jr. B Tier I Commissioner', name: 'Tony Materi', email: 'trock@live.ca' },
    { position: 'Jr. B Tier II Commissioner', name: 'Rob Letendre', email: 'rrletendre@shaw.ca' },
    { position: 'Jr. B Tier III Commissioner', name: 'Tracey Haining', email: 'laxergurl1@gmail.com' },
    { position: 'Sr. & Jr. Ladies Commissioner', name: 'John Radford', email: 'radford1@shaw.ca' },
    { position: 'Development Commissioner', name: 'Greg Hart', email: 'greghart@mac.com' },
    { position: 'Discipline and Appeal Commissioner', name: 'Mike Fynn', email: 'mike.ultimatetradesmen@gmail.com' },
    { position: 'Referee In Chief', name: 'Warren Renden', email: 'netminerva@netscape.net' },
    { position: 'Web Master', name: 'Amanda Thielen' },
  ],
  '2013': [
    { position: 'President', name: 'Bill Sucha' },
    { position: 'Vice-President', name: 'Duane Bratt' },
    { position: 'Executive Director', name: 'Christine Thielen' },
    { position: 'Treasurer', name: 'Earl Caron' },
    { position: 'Sr. B Commissioner', name: 'Shauna Sterparn' },
    { position: 'Sr. C Commissioner', name: 'Connie Hamilton' },
    { position: 'Jr. A Commissioner', name: 'Glenn Tackaberry' },
    { position: 'Jr. B Tier I Commissioner', name: 'Tony Materi' },
    { position: 'Jr. B Tier II Commissioner', name: 'Rob Letendre' },
    { position: 'Jr. B Tier III Commissioner', name: 'Tracey Haining' },
    { position: 'Sr. & Jr. Ladies Commissioner', name: 'John Radford' },
    { position: 'Development Commissioner', name: 'Greg Hart' },
    { position: 'Discipline and Appeal Commissioner', name: 'Mike Fynn' },
    { position: 'Referee In Chief', name: 'Warren Renden' },
    { position: 'Web Master', name: 'Amanda Thielen' },
  ],
  '2012': [
    { position: 'President', name: 'Bill Sucha', email: 'suchafamily@shaw.ca' },
    { position: 'Vice-President', name: 'Duane Bratt', email: 'dbratt@mtroyal.ca' },
    { position: 'Executive Director', name: 'Christine Thielen', email: 'christinethielen@hotmail.com' },
    { position: 'Treasurer', name: 'Earl Caron', email: 'ecaron@shaw.ca' },
    { position: 'Sr. B Commissioner', name: 'Shauna Sterparn', email: 'sterparns@shaw.ca' },
    { position: 'Sr. C Commissioner', name: 'Connie Hamilton', email: 'chamiltonlax@shaw.ca' },
    { position: 'Jr. A Commissioner', name: 'Greg Lintz', email: 'greg@tarrabain.com' },
    { position: 'Jr. B Tier I Commissioner', name: 'Nathan Finkbeiner', email: 'nfinkbei@ucalgary.ca' },
    { position: 'Jr. B Tier II Commissioner', name: 'Rob Letendre', email: 'rrletendre@shaw.ca' },
    { position: 'Jr. B Tier III Commissioner', name: 'Linda Robertson', email: 'linda@tbcinc.ca' },
    { position: 'Sr. & Jr. Ladies Commissioner', name: 'John Radford', email: 'radford1@shaw.ca' },
    { position: 'Referee In Chief', name: 'Warren Renden', email: 'netminerva@netscape.net' },
    { position: 'Discipline and Appeal Commissioner', name: 'Mike Fynn', email: 'm.fynn27@gmail.com' },
    { position: 'Web Master', name: 'Amanda Thielen' },
  ],
  '2011': [
    { position: 'President', name: 'Bill Sucha' },
    { position: 'Vice-President', name: 'Duane Bratt' },
    { position: 'Executive Director', name: 'Christine Thielen' },
    { position: 'Assistant Executive Director', name: 'Taunya Garant' },
    { position: 'Treasurer', name: 'Earl Caron' },
    { position: 'Sr. B Commissioner', name: 'Shauna Sterparn' },
    { position: 'Sr. C Commissioner', name: 'Mike Fynn' },
    { position: 'Jr. A Commissioner', name: 'Greg Lintz' },
    { position: 'Jr. B Tier I Commissioner - Interim', name: 'Duane Bratt' },
    { position: 'Jr. B Tier II Commissioner', name: 'Rob Letendre' },
    { position: 'Jr. B Tier III Commissioner', name: 'Linda Robertson' },
    { position: 'Jr. & Sr. Ladies Commissioner', name: 'John Radford' },
    { position: 'Referee In Chief', name: 'Warren Renden' },
    { position: 'Discipline and Appeal Commissioner', name: 'Mike Fynn' },
    { position: 'Web Master', name: 'Amanda Thielen' },
  ],
  '2010': [
    { position: 'President', name: 'Bill Sucha' },
    { position: 'Vice-President', name: 'Greg Lintz' },
    { position: 'Executive Director', name: 'Christine Thielen' },
    { position: 'Assistant Executive Director', name: 'Taunya Garant' },
    { position: 'Treasurer', name: 'Earl Caron' },
    { position: 'Sr. Commissioner', name: 'Shauna Sterparn' },
    { position: 'Jr. A Commissioner', name: 'Greg Lintz' },
    { position: 'Jr. B Tier I Commissioner', name: 'Rob Kachor' },
    { position: 'Jr. B Tier II Commissioner', name: 'Cindy Garant' },
    { position: 'Jr. B Tier III Commissioner', name: 'Linda Robertson' },
    { position: 'Jr. Ladies Commissioner', name: 'Stacey Dziwenko' },
    { position: 'Referee In Chief', name: 'Warren Rendon' },
    { position: 'Discipline Chair', name: 'Mike Fynn' },
    { position: 'Web Master', name: 'Amanda Thielen' },
  ],
  '2009': [
    { position: 'President', name: 'Bill Sucha' },
    { position: 'Vice-President (North)', name: 'Greg Lintz' },
    { position: 'Vice-President (South)', name: 'Angus Jenkins' },
    { position: 'Executive Director', name: 'Christine Thielen' },
    { position: 'Treasurer', name: 'Harry Anders' },
    { position: 'Discipline Chair', name: 'Dave Wray' },
    { position: 'Sr. Commissioner', name: 'Mike Fynn' },
    { position: 'Jr. A Commissioner', name: 'Greg Lintz' },
    { position: 'Jr. B Tier I Commissioner', name: 'Robert Kachor' },
    { position: 'Jr. B Tier II Commissioner (Interim)', name: 'Taunya Garant' },
    { position: 'Jr. B Tier III Commissioner', name: 'Linda Robertson' },
    { position: 'Jr. B Tier III Assistant Commissioner', name: 'Cindy Dahms' },
    { position: 'Jr. Ladies Commissioner', name: 'Stacey Dziwenko' },
    { position: 'Referee In Chief', name: 'Warren Rendon' },
  ],
};

// Executive Member Duties
const EXECUTIVE_DUTIES: Duty[] = [
  {
    position: '7.01 PRESIDENT',
    responsibilities: [
      '7.01.1 The function of the President, with the assistance of and through the RMLL Executive, is to formulate and oversee RMLL policy and assist the Commissioners in achieving RMLL objectives in a business-like and timely manner.',
      '7.01.2 The President is responsible for the following duties:',
      'a) call and chair all meetings of the RMLL Executive and Members;',
      'b) on an emergent basis, to discipline any Franchise Holder, Member or Member of a Member for unseemly conduct on or off the playing surface for a breach of these Bylaws, the Rules or the Regulations, subject always to the right to appeal as hereinafter provided;',
      'c) assist the Commissioners in dealing with RMLL operations;',
      'd) fully exercise the authority of the Vice-President, in the absence or inaccessibility of the Vice-President;',
      'e) represent the RMLL at all ALA meetings;',
      'f) assist in preparing an annual budget; and',
      'g) represent the RMLL in all discussions with the ALRA.'
    ]
  },
  {
    position: '7.02 VICE-PRESIDENT',
    responsibilities: [
      '7.02.1 The Vice-President is responsible for the following duties:',
      'a) prepare changes for these Bylaws and the Regulations as directed by the RMLL Executive;',
      'b) provide interpretation of these Bylaws and the Regulations;',
      'c) provide support to the Commissioners;',
      'd) assist the Executive Director and Treasurer;',
      'e) fully exercise the authority of a Commissioner, in the absence, inaccessibility, or conflict of interest of a Commissioner; and',
      'f) act in the absence of the President.'
    ]
  },
  {
    position: '7.03 EXECUTIVE DIRECTOR',
    responsibilities: [
      '7.03.1 The function of the Executive Director is to carry out the administrative support of the RMLL on behalf of the RMLL Executive in a business-like and timely manner.',
      '7.03.2 The Executive Director is responsible for the following duties:',
      'a) arrange for the RMLL Executive passes to be printed and distributed;',
      'b) ensure the RMLL registration is complete with the ALA;',
      'c) ensure CLA negotiation lists are supplied to the ALA Office by applicable deadline;',
      'd) ensure ALRA Officials are assigned to all RMLL sanctioned games, in conjunction with the Referee-in-Chief;',
      'e) bill, or cause to be billed, each Member for RMLL fees, expenses, and/or fines;',
      'f) advise new team applicants of the conditions for entry into the RMLL and ensure each application is correctly prepared for consideration by the Division and the RMLL Executive;',
      'g) annually prepare and distribute these Bylaws and the Regulations to Members;',
      'h) ensure all changes to the Regulations, Rules and Division Operating Policies are made according to these Bylaws following ratification by the RMLL Executive;',
      'i) maintain a registry of all RMLL awards, trophies and personnel recognition under the direction of the Commissioners;',
      'j) provide RMLL schedules to Commissioners; and',
      'k) fully exercise the authority of the President and Vice-President, in the absence or inaccessibility of the President and Vice-President.'
    ]
  },
  {
    position: '7.04 TREASURER',
    responsibilities: [
      '7.04.1 The function of the Treasurer is to be responsible for the custody and maintenance of all books and records of RMLL finances, as required by these Bylaws and the law and ensuring the RMLL is properly financially managed.',
      '7.04.2 To be responsible for all fiscal matters pertaining to the RMLL, including the preparation of the Financial Statements and the appointment of an auditor (as required by the Societies Act (Alberta).'
    ]
  },
  {
    position: '7.05 COMMISSIONERS',
    responsibilities: [
      '7.05.1 The Commissioners are elected by the Members of their respective Division and are put forward for ratification to the RMLL Executive at the annual division planning meeting for a term of one (1) year.',
      '7.05.2 The function of the Commissioners is to implement these Bylaws, the Rules, and the Regulations in conjunction with the other members of the RMLL Executive in a business-like and timely manner.',
      '7.05.3 The Commissioners have the responsibility of administering their respective Divisions. The Commissioners are responsible for the following duties:',
      'a) administer the Division according to these Bylaws, the Regulations and any ratified Division Operating Policy;',
      'b) administer the technical standards of the RMLL including, but not limited to, the game, officiating and equipment;',
      'c) approve trades;',
      'd) provide the Executive Director with Protected Player lists;',
      'e) assist with the preparation of a schedule of all RMLL and playoff games within their respective Divisions;',
      'f) represent the RMLL at sanctioned games as required;',
      'g) administer and apply the standards of conduct for all Franchise Holders, Members and Members of Members within their respective Divisions;',
      'h) issue fines and suspensions in accordance these Bylaws, the Regulations and/or the Division\'s Operating Policy, and promptly notify parties, in writing, of any disciplinary actions; and',
      'i) chair all Division meetings in their respective Divisions.'
    ]
  },
  {
    position: '7.06 DISCIPLINE AND APPEALS COMMISSIONER',
    responsibilities: [
      '7.06.1 The Discipline and Appeals Commissioner is appointed by the RMLL Executive for a two-year term.',
      '7.06.2 The function of the Discipline and Appeals Commissioner is to:',
      'a) interpret these Bylaws, the Regulations and the Rules and the bylaws, regulations and policies of the ALA or CLA when the issue relates to a formal complaint, game protest or disciplinary action;',
      'b) appoint, on an annual basis, a discipline committee of up to twelve individuals to be ratified by the RMLL Executive to hear and rule on disciplinary matters and appeals from members of the RMLL Executive, Franchise Holders, Members or Members of Members; and',
      'c) ensure that appointees to appeal and discipline hearings fulfill their mandate and duties.'
    ]
  },
  {
    position: '7.07 DEVELOPMENT COMMISSIONER',
    responsibilities: [
      '7.07.1 The Development Commissioner is appointed by the RMLL Executive for a two-year term.',
      '7.07.2 The function of the Commissioner of Development is to:',
      'a) oversee and evaluate referee development and promotion in the RMLL (in conjunction with the RMLL Referee-in-Chief);',
      'b) conduct research into referee, coach and player development requirements;',
      'c) coordinate with other provincial, national, and international programs relating to the development of coaches, players, and officials;',
      'd) suggest direction to the RMLL Executive about initiatives that may be undertaken to enhance referee, coach, and player development (including integrated initiatives); and',
      'e) review effectiveness of RMLL coach, player, and referee development initiatives.'
    ]
  },
  {
    position: '7.08 REFEREE-IN-CHIEF',
    responsibilities: [
      '7.08.1 The Referee-in-Chief is accountable to the RMLL Executive and appointed by the ALRA for a term of two years. He or she must be a member of the ALRA.',
      '7.08.2 The function of the Referee-In-Chief is to provide the RMLL with the official interpretation of rules, to maintain a central registry of ALRA Officials qualified for RMLL sanctioned games and to oversee the completion of the assigning of the appropriate Referees and Officials to all RMLL games by the designated RMLL Assignor.'
    ]
  }
];

type TabType = 'current' | 'duties' | 'archives';

export function RMLLExecutivePage() {
  const [activeTab, setActiveTab] = useState<TabType>('current');
  const [selectedYear, setSelectedYear] = useState<string>('2025');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const years = Object.keys(EXECUTIVES_BY_YEAR).sort((a, b) => parseInt(b) - parseInt(a));
  const historicalExecutives = EXECUTIVES_BY_YEAR[selectedYear] || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-5 sm:p-8 text-white">
        <h2 className="text-2xl sm:text-4xl font-bold mb-2 sm:mb-3">RMLL Executive</h2>
        <p className="text-sm sm:text-lg text-red-50 leading-relaxed">
          The dedicated leaders who govern and operate the Rocky Mountain Lacrosse League
        </p>
      </div>

{/* Tab Navigation */}
      <div className="flex flex-col md:flex-row border-b-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <button
          onClick={() => setActiveTab('current')}
          className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-3 sm:py-4 font-bold text-sm sm:text-lg transition-all border-b-2 md:border-b-0 md:border-r-2 border-black ${
            activeTab === 'current'
              ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-inner'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Users className="w-5 h-5 shrink-0" />
          Current Executives
        </button>
        
        <button
          onClick={() => setActiveTab('duties')}
          className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-3 sm:py-4 font-bold text-sm sm:text-lg transition-all border-b-2 md:border-b-0 md:border-r-2 border-black ${
            activeTab === 'duties'
              ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-inner'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <FileText className="w-5 h-5 shrink-0" />
          Executive Member Duties
        </button>
        
        <button
          onClick={() => setActiveTab('archives')}
          className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-3 sm:py-4 font-bold text-sm sm:text-lg transition-all ${
            activeTab === 'archives'
              ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-inner'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Archive className="w-5 h-5 shrink-0" />
          Archives
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 sm:p-6">
        {activeTab === 'current' && (
          <div className="space-y-6">
            <div className="mb-6">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 pb-3 border-b-4 border-red-600">
                2026 Executive Members
              </h3>
              <p className="text-gray-700 leading-relaxed">
                The RMLL Executive is elected annually at the Annual General Meeting. 
                These dedicated volunteers work year-round to ensure the success and growth of lacrosse in Alberta.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {CURRENT_EXECUTIVES.map((exec, index) => (
                <div
                  key={index}
                  className="bg-gray-50 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] p-4 sm:p-6 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  <div className="flex items-start justify-between mb-2 sm:mb-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base sm:text-xl font-bold text-gray-900 mb-1">
                        {exec.position}
                      </h4>
                      <p className="text-base sm:text-lg text-red-600 font-bold mb-2">
                        {exec.name}
                      </p>
                    </div>
                  </div>
                  
                  {exec.email && (
                    <a
                      href={`mailto:${exec.email}`}
                      className="inline-block text-sm font-semibold text-red-600 hover:text-red-700 hover:underline break-all"
                    >
                      {exec.email}
                    </a>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8 bg-red-50 border-2 border-red-600 shadow-[3px_3px_0px_0px_rgba(220,38,38,1)] p-6">
              <h4 className="text-lg font-bold text-gray-900 mb-2">Contact the Executive</h4>
              <p className="text-gray-700 text-sm leading-relaxed">
                For general inquiries, please contact the President at{' '}
                <a href="mailto:dbratt@mtroyal.ca" className="text-red-600 font-semibold hover:underline">
                  dbratt@mtroyal.ca
                </a>
                . For specific matters, please reach out to the appropriate executive member using their individual email address.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'duties' && (
          <div className="space-y-6">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-3 pb-3 border-b-4 border-red-600">
                Roles and Responsibilities
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Each executive position carries specific duties and responsibilities essential to league operations. 
                Below is a comprehensive overview of what each role entails.
              </p>
            </div>

            <div className="space-y-6">
              {EXECUTIVE_DUTIES.map((duty, index) => (
                <div
                  key={index}
                  className="bg-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
                >
                  <div className="bg-gradient-to-r from-gray-100 to-gray-50 border-b-2 border-black px-4 sm:px-6 py-3 sm:py-4">
                    <h4 className="text-lg sm:text-xl font-bold text-gray-900">
                      {duty.position}
                    </h4>
                  </div>
                  <div className="p-4 sm:p-6">
                    <ul className="space-y-3">
                      {duty.responsibilities.map((responsibility, rIndex) => (
                        <li key={rIndex} className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-red-600 rounded-full mt-2 flex-shrink-0" />
                          <span className="text-gray-700 leading-relaxed flex-1">
                            {responsibility}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 bg-gray-50 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] p-6">
              <h4 className="text-lg font-bold text-gray-900 mb-2">Interested in Serving?</h4>
              <p className="text-gray-700 text-sm leading-relaxed">
                Executive positions are elected annually at the RMLL Annual General Meeting, typically held in January. 
                Any member in good standing is eligible to run for executive positions. For more information about 
                joining the executive, please contact the current President.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'archives' && (
          <div className="space-y-6">
            {/* Archives Header */}
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-3 pb-3 border-b-4 border-red-600">
                RMLL Executive Archives
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Browse historical information about the Rocky Mountain Lacrosse League executive members by year.
              </p>
            </div>

            {/* Year Selector Dropdown */}
            <div className="bg-gray-50 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] p-4 sm:p-6">
              <label className="block text-lg font-bold text-gray-900 mb-3">
                Select Year
              </label>
              <div className="relative inline-block w-full max-w-xs">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all font-bold text-lg"
                >
                  <span>{selectedYear}</span>
                  <ChevronDown className={`w-5 h-5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isDropdownOpen && (
                  <div className="absolute z-10 w-full mt-2 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-h-96 overflow-y-auto">
                    {years.map((year) => (
                      <button
                        key={year}
                        onClick={() => {
                          setSelectedYear(year);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 hover:bg-red-50 transition-colors border-b-2 border-black last:border-b-0 font-semibold ${
                          selectedYear === year ? 'bg-red-100 text-red-900' : 'text-gray-900'
                        }`}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Executive Members Table */}
            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 sm:px-6 py-3 sm:py-4 border-b-2 border-black">
                <h3 className="text-xl sm:text-2xl font-bold">
                  {selectedYear} RMLL Executive
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b-2 border-black">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left font-bold text-gray-900 uppercase tracking-wide text-xs sm:text-sm border-r-2 border-black">
                        Position
                      </th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left font-bold text-gray-900 uppercase tracking-wide text-xs sm:text-sm">
                        Name
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {historicalExecutives.map((exec, index) => (
                      <tr
                        key={index}
                        className={`border-b-2 border-gray-200 last:border-b-0 ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        }`}
                      >
                        <td className="px-3 sm:px-6 py-3 sm:py-4 font-bold text-gray-900 border-r-2 border-gray-200 text-sm">
                          {exec.position}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-gray-700 text-sm">
                          {exec.email ? (
                            <div className="flex flex-col gap-1">
                              <span>{exec.name}</span>
                              <a 
                                href={`mailto:${exec.email}`} 
                                className="text-sm text-red-600 hover:text-red-700 hover:underline font-semibold break-all"
                              >
                                {exec.email}
                              </a>
                            </div>
                          ) : (
                            <span>{exec.name}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Additional Info */}
            <div className="bg-gray-50 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] p-4 sm:p-6">
              <p className="text-sm text-gray-600">
                <strong className="text-gray-900 font-bold">Note:</strong> The RMLL Executive is responsible for the governance and operations of the league. 
                Executive members are elected annually and serve one-year terms. For current executive information, please see the Current Executives tab.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}