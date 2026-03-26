// Utility functions for generating iCal/ICS files for calendar export

interface CalendarEvent {
  title: string;
  description: string;
  location: string;
  startTime: Date;
  endTime: Date;
  url?: string;
}

// Format date for ICS file (YYYYMMDDTHHMMSSZ in UTC)
const formatICSDate = (date: Date): string => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
};

// Generate a single calendar event in ICS format
const generateICSEvent = (event: CalendarEvent, uid: string): string => {
  const now = new Date();
  
  return `BEGIN:VEVENT
UID:${uid}
DTSTAMP:${formatICSDate(now)}
DTSTART:${formatICSDate(event.startTime)}
DTEND:${formatICSDate(event.endTime)}
SUMMARY:${event.title}
DESCRIPTION:${event.description.replace(/\n/g, '\\n')}
LOCATION:${event.location}${event.url ? `\nURL:${event.url}` : ''}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT`;
};

// Generate complete ICS file with multiple events
export const generateICSFile = (events: CalendarEvent[]): string => {
  const header = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Rocky Mountain Lacrosse League//Schedule//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:RMLL Schedule
X-WR-TIMEZONE:America/Edmonton`;

  const eventStrings = events.map((event, index) => 
    generateICSEvent(event, `rmll-${Date.now()}-${index}@rmll.ca`)
  );

  const footer = `END:VCALENDAR`;

  return [header, ...eventStrings, footer].join('\n');
};

// Download ICS file
export const downloadICSFile = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

// Parse game time and date into a Date object
export const parseGameDateTime = (dateStr: string, timeStr: string): Date => {
  // Parse the date string (format: "Oct 23" or ISO format)
  let gameDate: Date;
  
  if (dateStr.includes('T') || dateStr.includes('-')) {
    // ISO format
    gameDate = new Date(dateStr);
  } else {
    // "Oct 23" format - assume current year
    const currentYear = new Date().getFullYear();
    gameDate = new Date(`${dateStr}, ${currentYear}`);
  }
  
  // Parse time string (format: "7:00 PM" or "19:00")
  const timeMatch = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    const meridiem = timeMatch[3];
    
    if (meridiem) {
      if (meridiem.toUpperCase() === 'PM' && hours !== 12) {
        hours += 12;
      } else if (meridiem.toUpperCase() === 'AM' && hours === 12) {
        hours = 0;
      }
    }
    
    gameDate.setHours(hours, minutes, 0, 0);
  }
  
  return gameDate;
};

// Generate calendar event from game data
export interface GameForCalendar {
  id: string;
  gameNumber?: string;
  homeTeam: string;
  awayTeam: string;
  venue: string;
  date: string;
  fullDate: string;
  time: string;
  division: string;
  status: string;
}

export const gameToCalendarEvent = (game: GameForCalendar): CalendarEvent => {
  const startTime = parseGameDateTime(game.fullDate, game.time);
  const endTime = new Date(startTime);
  endTime.setHours(endTime.getHours() + 2); // Assume 2-hour game duration
  
  return {
    title: `${game.awayTeam} @ ${game.homeTeam}`,
    description: `RMLL ${game.division}\nGame ${game.gameNumber || game.id}\n${game.awayTeam} at ${game.homeTeam}`,
    location: game.venue,
    startTime,
    endTime,
  };
};

// Export multiple games to calendar
export const exportGamesToCalendar = (games: GameForCalendar[], filename?: string) => {
  const events = games.map(gameToCalendarEvent);
  const icsContent = generateICSFile(events);
  const defaultFilename = filename || `RMLL_Schedule_${new Date().toISOString().split('T')[0]}.ics`;
  downloadICSFile(icsContent, defaultFilename);
};

// Export single game to calendar
export const exportGameToCalendar = (game: GameForCalendar) => {
  const event = gameToCalendarEvent(game);
  const icsContent = generateICSFile([event]);
  const filename = `RMLL_Game_${game.gameNumber || game.id}.ics`;
  downloadICSFile(icsContent, filename);
};
