// Email Templates for RMLL
// All templates use responsive, modern design with the RMLL logo

// Use the actual RMLL logo from the hero section
const LOGO_URL = 'https://supabase.figmainternal.com/storage/v1/object/public/figma-assets/fdfcb8e6c2b97967b54febaebf3bb794e8d4e2db.png';

// Base template wrapper with header and footer
const createEmailTemplate = (content: string, preheader?: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  ${preheader ? `<meta name="description" content="${preheader}">` : ''}
  <title>Rocky Mountain Lacrosse League</title>
  <style>
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .mobile-padding { padding: 20px !important; }
      .mobile-text { font-size: 14px !important; }
      .mobile-heading { font-size: 24px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  ${preheader ? `<div style="display: none; max-height: 0; overflow: hidden;">${preheader}</div>` : ''}
  
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f3f4f6; padding: 20px 0;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table role="presentation" class="container" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; margin: 0 auto; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          
          <!-- Header with Logo -->
          <tr>
            <td style="background: linear-gradient(135deg, #013fac 0%, #0149c9 100%); padding: 40px 30px; text-align: center;">
              <img src="${LOGO_URL}" alt="RMLL Logo" style="max-width: 200px; height: auto; margin-bottom: 15px; display: block; margin-left: auto; margin-right: auto;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                Rocky Mountain Lacrosse League
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td class="mobile-padding" style="padding: 40px 40px;">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #1f2937; padding: 30px 40px; text-align: center; color: #9ca3af;">
              <p style="margin: 0 0 10px 0; font-size: 14px;">
                <strong style="color: #ffffff;">Rocky Mountain Lacrosse League</strong>
              </p>
              <p style="margin: 0 0 15px 0; font-size: 13px;">
                Alberta, Canada | Season 2025
              </p>
              <p style="margin: 0 0 15px 0; font-size: 12px;">
                <a href="{{unsubscribe_url}}" style="color: #60a5fa; text-decoration: none;">Unsubscribe</a> | 
                <a href="mailto:info@rmll.ca" style="color: #60a5fa; text-decoration: none;">Contact Us</a> | 
                <a href="https://rmll.ca" style="color: #60a5fa; text-decoration: none;">Visit Website</a>
              </p>
              <p style="margin: 0; font-size: 11px; color: #6b7280;">
                © ${new Date().getFullYear()} Rocky Mountain Lacrosse League. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// Template 1: Season Announcement
export const seasonAnnouncementTemplate = {
  subject: '🏒 2025 RMLL Season Kicks Off March 22!',
  html: createEmailTemplate(`
    <h2 style="margin: 0 0 20px 0; color: #013fac; font-size: 28px; font-weight: 700;">
      The Wait is Over! Season 2025 Starts Soon
    </h2>
    
    <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.7; color: #374151;">
      We're thrilled to announce that the <strong>2025 Rocky Mountain Lacrosse League season</strong> 
      officially begins on <strong>March 22, 2025</strong>!
    </p>
    
    <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-left: 4px solid #013fac; padding: 25px; margin: 30px 0; border-radius: 8px;">
      <h3 style="margin: 0 0 15px 0; color: #013fac; font-size: 20px;">Season Highlights</h3>
      <ul style="margin: 0; padding-left: 20px; color: #374151; font-size: 15px; line-height: 1.8;">
        <li>12 exciting teams across multiple divisions</li>
        <li>Games every weekend at premier venues including Taber Arena and Cardston Arena</li>
        <li>Championship playoffs in August</li>
        <li>Special fan events and promotions throughout the season</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin: 35px 0;">
      <a href="https://rmll.ca/schedule" style="display: inline-block; background: #013fac; color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(1, 63, 172, 0.3);">
        View Full Schedule
      </a>
    </div>
    
    <p style="margin: 30px 0 0 0; font-size: 15px; color: #6b7280; line-height: 1.6;">
      Get ready for an incredible season of box lacrosse action! We can't wait to see you at the rink.
    </p>
  `, 'RMLL Season 2025 starts March 22! View the schedule and get ready for action.'),
};

// Template 2: Game Reminder
export const gameReminderTemplate = {
  subject: '🏒 Game Tonight: [Team A] vs [Team B] at [Venue]',
  html: createEmailTemplate(`
    <div style="background: #013fac; color: #ffffff; padding: 25px; text-align: center; border-radius: 8px; margin-bottom: 30px;">
      <p style="margin: 0 0 5px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.9;">Game Day</p>
      <h2 style="margin: 0; font-size: 32px; font-weight: 700;">
        [Team A] vs [Team B]
      </h2>
    </div>
    
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 25px 0;">
      <tr>
        <td style="padding: 20px; background-color: #f9fafb; border-radius: 8px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                <span style="color: #6b7280; font-size: 14px;">📅 Date & Time</span><br>
                <strong style="color: #111827; font-size: 16px;">[Date] at [Time]</strong>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                <span style="color: #6b7280; font-size: 14px;">📍 Venue</span><br>
                <strong style="color: #111827; font-size: 16px;">[Venue Name], Alberta</strong>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0;">
                <span style="color: #6b7280; font-size: 14px;">🎫 Division</span><br>
                <strong style="color: #111827; font-size: 16px;">[Division Name]</strong>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    
    <p style="margin: 25px 0; font-size: 16px; line-height: 1.7; color: #374151;">
      Don't miss this exciting matchup! Both teams are bringing their A-game in what promises to be 
      an intense battle on the floor.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://rmll.ca/schedule" style="display: inline-block; background: #013fac; color: #ffffff; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; margin-right: 10px;">
        View Game Details
      </a>
      <a href="https://rmll.ca/standings" style="display: inline-block; background: #ffffff; color: #013fac; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; border: 2px solid #013fac;">
        View Standings
      </a>
    </div>
  `, 'Game tonight! [Team A] vs [Team B] at [Venue]. Don\'t miss it!'),
};

// Template 3: Game Recap
export const gameRecapTemplate = {
  subject: '📊 Game Recap: [Team A] defeats [Team B] [Score A]-[Score B]',
  html: createEmailTemplate(`
    <h2 style="margin: 0 0 25px 0; color: #013fac; font-size: 28px; font-weight: 700; text-align: center;">
      Game Recap
    </h2>
    
    <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); padding: 30px; text-align: center; border-radius: 12px; margin-bottom: 30px; border: 2px solid #86efac;">
      <p style="margin: 0 0 10px 0; color: #166534; font-size: 15px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Final Score</p>
      <div style="display: flex; justify-content: center; align-items: center; gap: 20px; flex-wrap: wrap;">
        <div>
          <p style="margin: 0 0 5px 0; color: #166534; font-size: 16px; font-weight: 600;">[Team A]</p>
          <p style="margin: 0; color: #15803d; font-size: 48px; font-weight: 700; line-height: 1;">[Score A]</p>
        </div>
        <span style="color: #166534; font-size: 32px; font-weight: 300;">-</span>
        <div>
          <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 16px; font-weight: 600;">[Team B]</p>
          <p style="margin: 0; color: #9ca3af; font-size: 48px; font-weight: 700; line-height: 1;">[Score B]</p>
        </div>
      </div>
      <p style="margin: 15px 0 0 0; color: #166534; font-size: 14px;">
        [Date] at [Venue]
      </p>
    </div>
    
    <h3 style="margin: 30px 0 15px 0; color: #013fac; font-size: 22px; font-weight: 600;">
      🎯 Game Highlights
    </h3>
    <ul style="margin: 0 0 25px 0; padding-left: 20px; color: #374151; font-size: 15px; line-height: 1.9;">
      <li>[Highlight 1 - e.g., "John Smith scored 4 goals in the first period"]</li>
      <li>[Highlight 2 - e.g., "Outstanding goaltending performance by Mike Johnson"]</li>
      <li>[Highlight 3 - e.g., "Team A dominated possession with 65% face-off wins"]</li>
      <li>[Add more highlights as needed]</li>
    </ul>
    
    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 25px 0; border-radius: 6px;">
      <h4 style="margin: 0 0 10px 0; color: #92400e; font-size: 18px; font-weight: 600;">
        ⭐ Player of the Game
      </h4>
      <p style="margin: 0; color: #78350f; font-size: 15px; line-height: 1.7;">
        <strong>[Player Name]</strong> - [Team Name]<br>
        [Stats and performance details]
      </p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://rmll.ca/schedule" style="display: inline-block; background: #013fac; color: #ffffff; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
        View Full Stats & Recap
      </a>
    </div>
  `, '[Team A] defeats [Team B] [Score A]-[Score B]. View the full game recap and highlights.'),
};

// Template 4: Monthly Newsletter
export const newsletterTemplate = {
  subject: '📰 RMLL Newsletter - [Month] 2025',
  html: createEmailTemplate(`
    <h2 style="margin: 0 0 10px 0; color: #013fac; font-size: 28px; font-weight: 700;">
      Monthly Newsletter
    </h2>
    <p style="margin: 0 0 30px 0; color: #6b7280; font-size: 16px;">[Month] 2025 Edition</p>
    
    <!-- League Updates -->
    <div style="margin-bottom: 35px;">
      <h3 style="margin: 0 0 15px 0; color: #013fac; font-size: 22px; font-weight: 600; padding-bottom: 10px; border-bottom: 3px solid #dbeafe;">
        📢 League Updates
      </h3>
      <p style="margin: 15px 0; font-size: 15px; line-height: 1.7; color: #374151;">
        [Your league news and updates here. Include important announcements, rule changes, 
        upcoming events, or any other league-related information.]
      </p>
    </div>
    
    <!-- Upcoming Games -->
    <div style="margin-bottom: 35px;">
      <h3 style="margin: 0 0 15px 0; color: #013fac; font-size: 22px; font-weight: 600; padding-bottom: 10px; border-bottom: 3px solid #dbeafe;">
        🗓️ This Week's Games
      </h3>
      
      <div style="background: #f9fafb; padding: 18px; margin: 12px 0; border-radius: 8px; border-left: 4px solid #013fac;">
        <div style="margin-bottom: 8px;">
          <strong style="color: #111827; font-size: 16px;">[Team A] vs [Team B]</strong>
        </div>
        <div style="color: #6b7280; font-size: 14px;">
          📅 [Date & Time]<br>
          📍 [Venue Name], Alberta
        </div>
      </div>
      
      <div style="background: #f9fafb; padding: 18px; margin: 12px 0; border-radius: 8px; border-left: 4px solid #013fac;">
        <div style="margin-bottom: 8px;">
          <strong style="color: #111827; font-size: 16px;">[Team C] vs [Team D]</strong>
        </div>
        <div style="color: #6b7280; font-size: 14px;">
          📅 [Date & Time]<br>
          📍 [Venue Name], Alberta
        </div>
      </div>
      
      <p style="margin: 20px 0 0 0; text-align: center;">
        <a href="https://rmll.ca/schedule" style="color: #013fac; font-weight: 600; text-decoration: none;">
          View Full Schedule →
        </a>
      </p>
    </div>
    
    <!-- Standings Snapshot -->
    <div style="margin-bottom: 35px;">
      <h3 style="margin: 0 0 15px 0; color: #013fac; font-size: 22px; font-weight: 600; padding-bottom: 10px; border-bottom: 3px solid #dbeafe;">
        📊 Standings Snapshot
      </h3>
      <p style="margin: 15px 0; font-size: 15px; line-height: 1.7; color: #374151;">
        [Brief standings update or notable position changes]
      </p>
      <p style="margin: 15px 0 0 0; text-align: center;">
        <a href="https://rmll.ca/standings" style="color: #013fac; font-weight: 600; text-decoration: none;">
          View Full Standings →
        </a>
      </p>
    </div>
    
    <!-- Player Spotlight -->
    <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 25px; border-radius: 12px; margin-bottom: 35px;">
      <h3 style="margin: 0 0 15px 0; color: #92400e; font-size: 22px; font-weight: 600;">
        ⭐ Player Spotlight
      </h3>
      <p style="margin: 0; color: #78350f; font-size: 15px; line-height: 1.7;">
        <strong style="font-size: 18px;">[Player Name]</strong> - [Team Name]<br><br>
        [Featured player information, recent performance, achievements, or interesting background.]
      </p>
    </div>
    
    <!-- Community -->
    <div>
      <h3 style="margin: 0 0 15px 0; color: #013fac; font-size: 22px; font-weight: 600; padding-bottom: 10px; border-bottom: 3px solid #dbeafe;">
        🤝 Community Corner
      </h3>
      <p style="margin: 15px 0; font-size: 15px; line-height: 1.7; color: #374151;">
        [Community news, volunteer opportunities, fan events, or other community engagement content.]
      </p>
    </div>
  `, 'RMLL Monthly Newsletter - League updates, game schedule, player spotlight and more!'),
};

// Template 5: Registration Open
export const registrationTemplate = {
  subject: '🎉 Player Registration Now Open for 2025 Season!',
  html: createEmailTemplate(`
    <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 30px; text-align: center; border-radius: 12px; margin-bottom: 30px;">
      <h2 style="margin: 0 0 10px 0; color: #92400e; font-size: 32px; font-weight: 700;">
        🎉 Registration is Open!
      </h2>
      <p style="margin: 0; color: #78350f; font-size: 18px;">
        Secure your spot for the 2025 RMLL Season
      </p>
    </div>
    
    <p style="margin: 0 0 25px 0; font-size: 16px; line-height: 1.7; color: #374151;">
      We're excited to announce that <strong>player registration for the 2025 season is now open</strong>! 
      Whether you're a returning player or new to the league, we'd love to have you join us.
    </p>
    
    <div style="background: #eff6ff; border: 2px solid #3b82f6; padding: 25px; margin: 25px 0; border-radius: 10px;">
      <h3 style="margin: 0 0 15px 0; color: #1e40af; font-size: 20px; font-weight: 600;">
        📋 Registration Details
      </h3>
      <ul style="margin: 0; padding-left: 20px; color: #1e3a8a; font-size: 15px; line-height: 1.9;">
        <li><strong>Early Bird Deadline:</strong> [Date] - Save $50!</li>
        <li><strong>Regular Registration:</strong> [Date] to [Date]</li>
        <li><strong>Late Registration:</strong> [Date] onwards (additional $25 fee)</li>
        <li><strong>Season Start:</strong> March 22, 2025</li>
      </ul>
    </div>
    
    <h3 style="margin: 30px 0 15px 0; color: #013fac; font-size: 22px; font-weight: 600;">
      What's Included
    </h3>
    <ul style="margin: 0 0 25px 0; padding-left: 20px; color: #374151; font-size: 15px; line-height: 1.9;">
      <li>Full season of competitive box lacrosse</li>
      <li>Official RMLL jersey and shorts</li>
      <li>Insurance coverage</li>
      <li>Access to all league facilities</li>
      <li>Year-end awards and championship rings</li>
    </ul>
    
    <div style="text-align: center; margin: 35px 0;">
      <a href="https://rmll.ca/register" style="display: inline-block; background: #15803d; color: #ffffff; padding: 18px 45px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 17px; box-shadow: 0 4px 8px rgba(21, 128, 61, 0.3); text-transform: uppercase; letter-spacing: 0.5px;">
        Register Now
      </a>
    </div>
    
    <p style="margin: 25px 0 0 0; font-size: 14px; color: #6b7280; text-align: center; line-height: 1.6;">
      Questions? Contact us at <a href="mailto:registration@rmll.ca" style="color: #013fac; text-decoration: none;">registration@rmll.ca</a>
    </p>
  `, 'Player registration now open for 2025! Early bird pricing available. Register today!'),
};

// Template 6: Championship Finals
export const championshipTemplate = {
  subject: '🏆 Championship Finals This Weekend!',
  html: createEmailTemplate(`
    <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 40px 30px; text-align: center; border-radius: 12px; margin-bottom: 30px;">
      <div style="font-size: 60px; margin-bottom: 10px;">🏆</div>
      <h2 style="margin: 0 0 10px 0; color: #ffffff; font-size: 36px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
        Championship Finals
      </h2>
      <p style="margin: 0; color: #e9d5ff; font-size: 20px; font-weight: 600;">
        The Battle for the Title Begins
      </p>
    </div>
    
    <p style="margin: 0 0 25px 0; font-size: 17px; line-height: 1.7; color: #374151; text-align: center;">
      After an incredible season, we're down to the final two teams. Don't miss the most exciting 
      game of the year as we crown the <strong>2025 RMLL Champions</strong>!
    </p>
    
    <div style="background: #fafafa; border: 3px solid #7c3aed; padding: 30px; margin: 30px 0; border-radius: 12px; text-align: center;">
      <h3 style="margin: 0 0 20px 0; color: #7c3aed; font-size: 28px; font-weight: 700;">
        [Team A] vs [Team B]
      </h3>
      <div style="display: inline-block; text-align: left;">
        <p style="margin: 8px 0; color: #1f2937; font-size: 16px;">
          <strong>📅 Date:</strong> [Championship Date]
        </p>
        <p style="margin: 8px 0; color: #1f2937; font-size: 16px;">
          <strong>⏰ Time:</strong> [Game Time]
        </p>
        <p style="margin: 8px 0; color: #1f2937; font-size: 16px;">
          <strong>📍 Venue:</strong> [Championship Venue], Alberta
        </p>
        <p style="margin: 8px 0; color: #1f2937; font-size: 16px;">
          <strong>🎫 Tickets:</strong> Available at the door or online
        </p>
      </div>
    </div>
    
    <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 25px; border-radius: 10px; margin: 30px 0;">
      <h3 style="margin: 0 0 15px 0; color: #92400e; font-size: 20px; font-weight: 600;">
        🎊 Championship Day Events
      </h3>
      <ul style="margin: 0; padding-left: 20px; color: #78350f; font-size: 15px; line-height: 1.8;">
        <li>Pre-game Fan Fest starting at [Time]</li>
        <li>Live music and entertainment</li>
        <li>Food trucks and concessions</li>
        <li>Kids' lacrosse activities and giveaways</li>
        <li>Post-game trophy presentation ceremony</li>
      </ul>
    </div>
    
    <p style="margin: 25px 0; font-size: 16px; line-height: 1.7; color: #374151;">
      This promises to be an unforgettable day of lacrosse action. Bring your family, friends, and 
      your loudest voice to cheer on the teams as they compete for glory!
    </p>
    
    <div style="text-align: center; margin: 35px 0;">
      <a href="https://rmll.ca/tickets" style="display: inline-block; background: #7c3aed; color: #ffffff; padding: 18px 45px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 17px; box-shadow: 0 4px 8px rgba(124, 58, 237, 0.4); text-transform: uppercase; letter-spacing: 0.5px;">
        Get Your Tickets
      </a>
    </div>
  `, 'Championship Finals this weekend! Don\'t miss the biggest game of the year.'),
};

// Template 7: Weather/Schedule Update
export const scheduleUpdateTemplate = {
  subject: '⚠️ Important Schedule Update - [Date]',
  html: createEmailTemplate(`
    <div style="background: #fef3c7; border-left: 6px solid #f59e0b; padding: 25px; margin-bottom: 30px; border-radius: 8px;">
      <h2 style="margin: 0 0 15px 0; color: #92400e; font-size: 26px; font-weight: 700;">
        ⚠️ Schedule Update
      </h2>
      <p style="margin: 0; color: #78350f; font-size: 16px; font-weight: 600;">
        Important changes to this week's games
      </p>
    </div>
    
    <p style="margin: 0 0 25px 0; font-size: 16px; line-height: 1.7; color: #374151;">
      We wanted to inform you of some changes to the schedule due to [reason - weather, facility issue, etc.].
    </p>
    
    <div style="background: #fee2e2; border: 2px solid #ef4444; padding: 20px; margin: 25px 0; border-radius: 8px;">
      <h3 style="margin: 0 0 15px 0; color: #991b1b; font-size: 20px; font-weight: 600;">
        ❌ Cancelled Games
      </h3>
      <div style="color: #7f1d1d; font-size: 15px; line-height: 1.8;">
        <p style="margin: 8px 0;"><strong>[Team A] vs [Team B]</strong> - [Original Date/Time]</p>
        <p style="margin: 8px 0;"><strong>[Team C] vs [Team D]</strong> - [Original Date/Time]</p>
      </div>
    </div>
    
    <div style="background: #dbeafe; border: 2px solid #3b82f6; padding: 20px; margin: 25px 0; border-radius: 8px;">
      <h3 style="margin: 0 0 15px 0; color: #1e40af; font-size: 20px; font-weight: 600;">
        📅 Rescheduled Games
      </h3>
      <div style="color: #1e3a8a; font-size: 15px; line-height: 1.8;">
        <p style="margin: 8px 0;">
          <strong>[Team A] vs [Team B]</strong><br>
          New Date: [Rescheduled Date/Time]<br>
          Venue: [Venue Name]
        </p>
        <p style="margin: 8px 0;">
          <strong>[Team C] vs [Team D]</strong><br>
          New Date: [Rescheduled Date/Time]<br>
          Venue: [Venue Name]
        </p>
      </div>
    </div>
    
    <p style="margin: 25px 0; font-size: 15px; line-height: 1.7; color: #374151;">
      We apologize for any inconvenience this may cause. All other games remain on schedule as planned.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://rmll.ca/schedule" style="display: inline-block; background: #013fac; color: #ffffff; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
        View Updated Schedule
      </a>
    </div>
    
    <p style="margin: 25px 0 0 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
      Questions? Contact us at <a href="mailto:info@rmll.ca" style="color: #013fac; text-decoration: none;">info@rmll.ca</a>
    </p>
  `, 'Important schedule update: Some games have been rescheduled. View the latest schedule.'),
};

// Export all templates
export const emailTemplates = {
  'season-announcement': seasonAnnouncementTemplate,
  'game-reminder': gameReminderTemplate,
  'game-recap': gameRecapTemplate,
  'newsletter': newsletterTemplate,
  'registration': registrationTemplate,
  'championship': championshipTemplate,
  'schedule-update': scheduleUpdateTemplate,
};

export type EmailTemplateType = keyof typeof emailTemplates;