import { Hono } from "npm:hono";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as db from "./db.ts";
import * as kv from "./kv_store.ts"; // Keep for division data and structured content
import { proxyDownload } from './proxy.ts';
import { tier2AwardsData } from "./tier2_awards_data.ts";
import { tier2ChampionshipsData } from "./tier2_championships_data.ts";
import { seniorBAwardsData } from "./seniorb_awards_data.ts";
import { seniorBChampionshipsData } from "./seniorb_championships_data.ts";
import { albertaMajorFemaleChampionshipsData } from "./albertamajorfemale_championships_data.ts";

const app = new Hono();

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// Helper to check if a field has meaningful content (not just empty/placeholder)
function hasRealContent(field: any): boolean {
  if (!field) return false;
  if (typeof field === 'string') {
    const trimmed = field.trim();
    if (!trimmed || trimmed === '{}' || trimmed === '""' || trimmed === 'null' || trimmed === '[]') return false;
    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed === 'object' && parsed !== null) {
        return Object.keys(parsed).length > 0;
      }
    } catch {
      // Not JSON, treat as real content if non-empty
    }
    return true;
  }
  if (typeof field === 'object') {
    return Object.keys(field).length > 0;
  }
  return false;
}

// ============================================
// SEED NEWS ARTICLES (idempotent — only inserts if missing)
// ============================================

const SEED_NEWS_ARTICLES = [
  {
    slug: 'calgary-sr-c-irish-2026-tryouts',
    title: 'Calgary Sr. C Irish 2026 Tryouts!',
    content: `<p>The Sr. C Calgary Irish will be holding open tryout for the 2026 season.</p>

<p><strong>Location:</strong> Calgary Soccer Centre 7000 48 St SE, Calgary, AB<br/>
<strong>Cost:</strong> $10 per floor time.</p>

<h3>Dates &amp; Times:</h3>
<ul>
<li>Friday, February 6th – 9:15 PM to 10:15 PM</li>
<li>Friday, February 13th – 9:15 PM to 10:15 PM</li>
<li>Friday, February 20th – 9:00 PM to 10:00 PM</li>
<li>Wednesday, February 25th – 9:30 PM to 10:30 PM</li>
<li>Friday, March 6th – 10:15 PM to 11:15 PM</li>
<li>Friday, March 13th – 10:15 PM to 11:15 PM</li>
<li>Friday, March 20th – 8:45 PM to 9:45 PM</li>
<li>Friday, March 27th – 8:15 PM to 9:15 PM</li>
</ul>

<p>Please contact Riley Damen at 403-771-5161 with any questions.</p>`,
    excerpt: 'The Sr. C Calgary Irish will be holding open tryouts for the 2026 season at Calgary Soccer Centre. Cost is $10 per floor time.',
    featured_image_url: null,
    author: 'RMLL Admin',
    published_date: '2026-02-05T12:00:00.000Z',
    category: 'team-news',
    division_id: null,
    tags: ['tryouts', 'senior-c', 'calgary-irish', '2026'],
    is_published: true,
    _image_asset_key: 'calgary-irish-logo',
  },
  {
    slug: 'rmll-intent-to-play-2026-open',
    title: 'RMLL Intent-to-Play is now OPEN!',
    content: `<p><strong>Welcome to the RMLL 2026 Box Season!</strong></p>

<h3>RMLL Player Registration</h3>
<p>In addition to registering directly with a RMLL Franchise, Alberta players must also complete the RMLL Intent-to-Play. The RMLL Intent-to-Play does not apply to players on RMLL out-of-province teams.</p>

<p>As per the ALA, only RMLL players completing this Intent-to-Play will be allowed to go on the floor with an Alberta RMLL Franchise. (Call-ups from Minor Lacrosse do not complete the Intent-to-Play).</p>

<p><strong>RMLL Intent-to-Play Link:</strong> <a href="http://rmll.rampregistrations.com" target="_blank" rel="noopener noreferrer">http://rmll.rampregistrations.com</a></p>

<ol>
<li>Enter your RAMP login. If you played lacrosse in Alberta in 2025 or if you played for another sport that RAMP hosts the registration for, you will have a RAMP login. If you are new to Alberta lacrosse in 2026 and do not currently have RAMP for registration for another sport, you will need to create a RAMP Account;</li>
<li>Select <strong>Register as a Participant</strong>;</li>
<li>Select <strong>2026 Box Transfer Season</strong>;</li>
<li>Select which Family Member you want to Register (enter or review that information is correct);</li>
<li>Select one of the four RMLL Divisions:
<ul>
<li><strong>Female Junior</strong> (DOB 2009, 2008, 2007, 2006, 2005)</li>
<li><strong>Female Senior</strong> (DOB 2004 or earlier)</li>
<li><strong>Senior</strong> (DOB 2004 or earlier) if you are intending to play Sr. B (ASL) or Sr. C</li>
<li><strong>Junior</strong> (DOB 2009, 2008, 2007, 2006, 2005) if you are intending to play Jr. A, Tier I or Tier II</li>
</ul></li>
<li>ALA Player Registration Fee &ndash; $87.00 plus admin fee (this payment is submitted directly to the ALA);</li>
<li>Players under 18 will need to have a Parent or Guardian sign the ALA and LC Waivers;</li>
<li>Please enter all the requested information.</li>
</ol>

<p>Once you have completed entering all the required information, you will receive a <strong>RMLL Registration Confirmation e-mail</strong>.</p>

<p>Please give a copy of this RMLL Registration Confirmation e-mail to each RMLL Franchise you are going on the floor with.</p>

<p>&nbsp;</p>
<p>Yours in Lacrosse,<br/>
<em>The Rocky Mountain Lacrosse League</em></p>`,
    excerpt: 'The RMLL Intent-to-Play for the 2026 Box Season is now open. All Alberta players must complete registration at rmll.rampregistrations.com. Deadline: March 1st.',
    featured_image_url: null,
    author: 'RMLL Admin',
    published_date: '2026-02-03T12:00:00.000Z',
    category: 'league-update',
    division_id: null,
    tags: ['registration', 'intent-to-play', '2026', 'ramp'],
    is_published: true,
    _image_asset_key: 'intent-to-play-2026',
  },
  {
    slug: 'axemen-pre-season-floor-times',
    title: 'Axemen Pre Season Floor Times',
    content: `<p><strong>Axemen Pre Season Floor Times</strong></p>

<p>Open to all returning Axemen Junior Players, Graduating U17 Players and Free Agents.<br/>
Full equipment is required to be on the floor.</p>

<p><strong>Location:</strong> Calgary Soccer Center, Annex Building<br/>
7000 &ndash; 48 Street SE</p>

<p><strong>Cost:</strong> $10 per floor time or $80 for all floor times</p>

<h3>Dates and Times:</h3>
<ul>
<li>Sunday November 30 &ndash; 2 pm to 3:30 pm</li>
<li>Sunday December 7 &ndash; 2 pm to 3:30 pm</li>
<li>Sunday December 14 &ndash; 3 pm to 4:30 pm</li>
<li>Sunday January 4 &ndash; 3 pm to 4:30 pm</li>
<li>Tuesday January 20 &ndash; 9 pm to 10:30 pm</li>
<li>Tuesday January 27 &ndash; 9 pm to 10:30 pm</li>
<li>Tuesday February 3 &ndash; 9 pm to 10:30 pm</li>
<li>Sunday February 8 &ndash; 6:30 pm to 8 pm</li>
<li>Tuesday February 10 &ndash; 9 pm to 10:30 pm</li>
<li>Tuesday February 24 &ndash; 9 pm to 10:30 pm</li>
</ul>`,
    excerpt: 'Axemen Pre Season Floor Times are open to all returning Junior Players, Graduating U17 Players and Free Agents. Calgary Soccer Center, $10 per session or $80 for all.',
    featured_image_url: null,
    author: 'RMLL Admin',
    published_date: '2025-11-28T12:00:00.000Z',
    category: 'team-news',
    division_id: null,
    tags: ['tryouts', 'pre-season', 'axemen', 'junior', 'calgary'],
    is_published: true,
    _image_asset_key: 'axemen-logo',
  },
];

async function seedNewsArticles() {
  try {
    for (const article of SEED_NEWS_ARTICLES) {
      const existing = await db.getNewsArticleBySlug(article.slug);
      if (!existing) {
        const { _image_asset_key, ...articleData } = article;
        const record = await db.createNewsArticle(articleData);
        console.log(`[Seed] Inserted news article: "${article.title}"`);
      } else {
        console.log(`[Seed] News article already exists: "${article.slug}"`);
      }
    }
  } catch (error) {
    console.error('[Seed] Error seeding news articles:', error);
  }
}

// Run seed in background
seedNewsArticles();

// PROXY DOWNLOAD ROUTE (for XML import)
app.post("/proxy-download", proxyDownload);

// ============================================
// NEWS ARTICLES ROUTES
// ============================================

// Get all news articles (with optional filters)
app.get("/news", async (c) => {
  try {
    const { division, category, limit, published } = c.req.query();

    const articles = await db.getNewsArticles({
      published: published === 'true' ? true : published === 'false' ? false : undefined,
      category,
      division: division ? parseInt(division) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });

    // Sort: spotlight first, then by published_date
    const sorted = articles.sort((a, b) => {
      if (a.is_spotlight && !b.is_spotlight) return -1;
      if (!a.is_spotlight && b.is_spotlight) return 1;
      const dateA = new Date(a.published_date || a.created_at);
      const dateB = new Date(b.published_date || b.created_at);
      return dateB.getTime() - dateA.getTime();
    });

    return c.json({
      success: true,
      data: sorted
    });
  } catch (error) {
    console.error("Error fetching news articles:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Get single news article by slug
app.get("/news/:slug", async (c) => {
  try {
    const slug = c.req.param("slug");
    const article = await db.getNewsArticleBySlug(slug);

    if (!article) {
      return c.json({ success: false, error: "Article not found" }, 404);
    }

    return c.json({ success: true, data: article });
  } catch (error) {
    console.error("Error fetching news article:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Create new news article
app.post("/news", async (c) => {
  try {
    const body = await c.req.json();

    // Validate required fields
    if (!body.title || !body.content) {
      return c.json({ success: false, error: "Title and content are required" }, 400);
    }

    // Generate slug from title
    const slug = body.slug || body.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Check if slug already exists
    const existing = await db.getNewsArticleBySlug(slug);
    if (existing) {
      return c.json({ success: false, error: "Article with this slug already exists" }, 400);
    }

    const article = await db.createNewsArticle({
      slug,
      title: body.title,
      content: body.content,
      excerpt: body.excerpt || body.content.substring(0, 200) + '...',
      featured_image_url: body.featured_image_url || null,
      image_position: body.image_position || 'center',
      author: body.author || 'RMLL Staff',
      published_date: body.published_date || new Date().toISOString(),
      category: body.category || 'general',
      division_id: body.division_id || null,
      tags: body.tags || [],
      is_published: body.is_published !== undefined ? body.is_published : true,
      is_spotlight: body.is_spotlight || false,
    });

    return c.json({ success: true, data: article }, 201);
  } catch (error) {
    console.error("Error creating news article:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Update news article
app.put("/news/:slug", async (c) => {
  try {
    const slug = c.req.param("slug");
    const body = await c.req.json();

    const existing = await db.getNewsArticleBySlug(slug);
    if (!existing) {
      return c.json({ success: false, error: "Article not found" }, 404);
    }

    const updated = await db.updateNewsArticle(existing.id, body);

    return c.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating news article:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Delete news article
app.delete("/news/:slug", async (c) => {
  try {
    const slug = c.req.param("slug");

    const existing = await db.getNewsArticleBySlug(slug);
    if (!existing) {
      return c.json({ success: false, error: "Article not found" }, 404);
    }

    await db.deleteNewsArticle(existing.id);

    return c.json({ success: true, message: "Article deleted" });
  } catch (error) {
    console.error("Error deleting news article:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================
// ANNOUNCEMENTS ROUTES
// ============================================

// Get active announcements
app.get("/announcements", async (c) => {
  try {
    const { division, active } = c.req.query();
    const now = new Date().toISOString();

    const announcements = await db.getAnnouncements({
      active: active === 'true' ? true : undefined,
      division: division ? parseInt(division) : undefined,
    });

    // Additional filtering for active status with dates
    const filtered = announcements.filter(item => {
      if (active === 'true') {
        if (!item.is_active) return false;
        if (item.start_date && item.start_date > now) return false;
        if (item.end_date && item.end_date < now) return false;
      }
      return true;
    });

    // Sort by priority
    const sorted = filtered.sort((a, b) => {
      const priorityA = typeof a.priority === 'number' ? a.priority : ({ high: 10, medium: 5, low: 0 }[a.priority] ?? 0);
      const priorityB = typeof b.priority === 'number' ? b.priority : ({ high: 10, medium: 5, low: 0 }[b.priority] ?? 0);
      const priorityDiff = priorityB - priorityA;
      if (priorityDiff !== 0) return priorityDiff;

      const dateA = new Date(a.created_at || a.start_date);
      const dateB = new Date(b.created_at || b.start_date);
      return dateB.getTime() - dateA.getTime();
    });

    return c.json({
      success: true,
      data: sorted
    });
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Create announcement
app.post("/announcements", async (c) => {
  try {
    const body = await c.req.json();

    if (!body.title || !body.content) {
      return c.json({ success: false, error: "Title and content are required" }, 400);
    }

    const announcement = await db.createAnnouncement({
      title: body.title,
      content: body.content,
      type: body.type || 'info',
      priority: body.priority || 'medium',
      display_frequency: body.display_frequency || 'once',
      target_pages: body.target_pages || [],
      start_date: body.start_date || null,
      end_date: body.end_date || null,
      button_text: body.button_text || null,
      button_link: body.button_link || null,
      image_url: body.image_url || null,
      division_id: body.division_id || null,
      is_active: body.is_active !== undefined ? body.is_active : true,
    });

    return c.json({ success: true, data: announcement }, 201);
  } catch (error) {
    console.error("Error creating announcement:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Update announcement
app.put("/announcements/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();

    const updated = await db.updateAnnouncement(id, body);

    return c.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating announcement:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Delete announcement
app.delete("/announcements/:id", async (c) => {
  try {
    const id = c.req.param("id");
    await db.deleteAnnouncement(id);

    return c.json({ success: true, message: "Announcement deleted" });
  } catch (error) {
    console.error("Error deleting announcement:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================
// PAGES ROUTES
// ============================================

// Get all pages
app.get("/pages", async (c) => {
  try {
    // Define component-based pages
    const componentPages = ['rmll-executive', 'affiliate-website-links'];

    // Get database pages
    const dbPages = await getPages();

    // Sort by nav_order for pages that show in nav, then by created date
    const pages = dbPages
      .map(page => {
        // Mark pages that use custom components
        if (componentPages.includes(page.slug)) {
          return {
            ...page,
            custom_component: page.slug === 'rmll-executive'
              ? 'RMLLExecutivePage'
              : page.slug === 'affiliate-website-links'
              ? 'AffiliateLinksPage'
              : undefined
          };
        }
        return page;
      })
      // Filter out the old archives page if it exists
      .filter(page => page.slug !== 'archives')
      .sort((a, b) => {
        if (a.show_in_nav && b.show_in_nav) {
          return (a.nav_order || 0) - (b.nav_order || 0);
        }
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        return dateB.getTime() - dateA.getTime();
      });

    return c.json({
      success: true,
      data: pages
    });
  } catch (error) {
    console.error("Error fetching pages:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Get single page by slug
app.get("/pages/:slug", async (c) => {
  try {
    const slug = c.req.param("slug");
    const page = await getPageBySlug(slug);

    if (!page) {
      return c.json({ success: false, error: "Page not found" }, 404);
    }

    return c.json({ success: true, data: page });
  } catch (error) {
    console.error("Error fetching page:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Create new page
app.post("/pages", async (c) => {
  try {
    const body = await c.req.json();

    if (!body.title || !body.content) {
      return c.json({ success: false, error: "Title and content are required" }, 400);
    }

    // Generate slug from title
    const slug = body.slug || body.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Check if slug already exists
    const existing = await getPageBySlug(slug);
    if (existing) {
      return c.json({ success: false, error: "Page with this slug already exists" }, 400);
    }

    const page = await createPage({
      slug,
      title: body.title,
      content: body.content,
      meta_description: body.meta_description || null,
      featured_image_url: body.featured_image_url || null,
      is_published: body.is_published !== undefined ? body.is_published : true,
      show_in_nav: body.show_in_nav !== undefined ? body.show_in_nav : false,
      nav_order: body.nav_order || 0,
      template: body.template || 'default',
    });

    return c.json({ success: true, data: page }, 201);
  } catch (error) {
    console.error("Error creating page:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Update page
app.put("/pages/:slug", async (c) => {
  try {
    const slug = c.req.param("slug");
    const body = await c.req.json();

    const existing = await getPageBySlug(slug);
    if (!existing) {
      return c.json({ success: false, error: "Page not found" }, 404);
    }

    const updated = await updatePage(slug, body);

    return c.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating page:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Bulk delete all pages - MUST come before /:slug route to avoid matching "bulk-delete" as a slug
app.delete("/pages/bulk-delete", async (c) => {
  try {
    console.log('[Pages] Bulk delete all pages requested');
    await db.deleteAllPages();

    console.log(`[Pages] Successfully deleted all pages`);

    return c.json({
      success: true,
      message: `Deleted all pages`,
    });
  } catch (error) {
    console.error("Error bulk deleting pages:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Delete page (handles both database pages and component pages with structured content)
app.delete("/pages/:slug", async (c) => {
  try {
    const slug = c.req.param("slug");

    // Delete from database
    await db.deletePage(slug);

    // Also delete any KV structured content
    const keysToDelete: string[] = [];
    const structuredData = await kv.get(`page-structured:${slug}`);
    if (structuredData) keysToDelete.push(`page-structured:${slug}`);

    if (keysToDelete.length > 0) {
      await kv.mdel(keysToDelete);
      console.log(`[Pages] Deleted KV keys for slug "${slug}": ${keysToDelete.join(', ')}`);
    }

    return c.json({ success: true, message: "Page deleted" });
  } catch (error) {
    console.error("Error deleting page:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================
// DIVISION ROUTES (kept in KV for now)
// ============================================

// Get division data
app.get("/division/:name", async (c) => {
  try {
    const name = c.req.param("name");
    const decodedName = decodeURIComponent(name);

    // Check if we have data for this division
    const key = `division:${decodedName}`;
    let data = await kv.get(key);

    // Inject defaults for Junior B Tier II if missing
    if (decodedName === 'Junior B Tier II') {
      if (!data) {
        data = {};
      }

      if (!hasRealContent(data.awards)) {
        data.awards = JSON.stringify(tier2AwardsData);
      }

      if (!hasRealContent(data.championships)) {
        data.championships = JSON.stringify(tier2ChampionshipsData);
      }

      // Inject default description if not set via CMS
      if (!data.divisionDescription) {
        data.divisionDescription = `RMLL Junior B Tier II
The Junior B Tier II Division of the Rocky Mountain Lacrosse League (RMLL) is an exciting and essential part of the Major lacrosse pathway. Known as the premier developmental division, Tier II provides players and teams with the perfect environment to grow, compete, and prepare for the next level of Junior lacrosse.
Since its creation in 2000 following the restructuring of lacrosse in 1999, the Tier II Division has experienced tremendous growth. What began with just five teams from the Edmonton and Calgary areas has expanded steadily over the years. By 2004, the league had grown to 16 teams and welcomed clubs from Grande Prairie, High River, Lethbridge, and Medicine Hat. This growth led to the creation of North and South Divisions, a structure that continues to evolve alongside the league. Today, Tier II typically features between 16 and 20 teams and, as of 2023, proudly competes in a North and South Division format.
The RMLL's four Junior divisions—Tier III, Tier II, Junior B Tier I, and Junior A—work together seamlessly to support both player and team development. Tier II plays a key role in this progression, with many clubs successfully advancing from Tier II to Tier I, and from Tier III into Tier II, showcasing the strength and opportunity within the RMLL system.
Junior lacrosse is open to players aged 17 to 21, with each division offering a competitive experience tailored to different stages of development. Tier II teams typically feature:
Clubs with only Tier II: Primarily 17–18-year-old players
Clubs with Tier II and Tier III: Mostly 18–19-year-old players
For comparison:
Tier I: Generally ages 18–20
Junior A: Typically ages 19–21
While players of various ages may appear across divisions, Tier II remains a welcoming and competitive home for developing athletes.
Tier II is the primary landing spot for graduating U17 players and serves as a vital training ground for those eager to reach their full potential in box lacrosse. Alongside returning Tier II athletes, these players compete in a fast-paced, physical, and skill-driven league that prepares them for the demands of Junior B Tier I and Junior A competition.
At the conclusion of Division Playoffs, the top two teams from each division face off in a Best-of-3 series to crown the Tier II Champion and earn the prestigious Alberta Lacrosse Jack Little Trophy.
Individual excellence is also celebrated:
The Dave Nyhuis Award is presented annually to the North Division's Regular Season points leader.
The Jim Lovgren Award is awarded annually to the South Division's Regular Season points leader.
RMLL Junior B Tier II is where development meets opportunity—and where the next generation of elite box lacrosse players takes the next step forward.`;
      }
    }

    // Inject defaults for Senior B - ALWAYS force inject from hardcoded data files
    // (these files contain the authoritative historical data)
    if (decodedName === 'Senior B') {
      if (!data) {
        data = {};
      }

      console.log(`[Division] Senior B - Force injecting awards and championships from hardcoded data files`);
      data.awards = JSON.stringify(seniorBAwardsData);
      data.championships = JSON.stringify(seniorBChampionshipsData);

      // Inject default description if not set via CMS
      if (!data.divisionDescription) {
        data.divisionDescription = `RMLL Alberta Series Lacrosse (ASL)
Alberta Series Lacrosse (ASL) is built on the powerful traditions of the game's original creators, the Haudenosaunee (widely known as the Iroquois). Respect, integrity, and inclusiveness are at the heart of lacrosse—and they are the foundation of everything we do. These values are not only core principles of our league, but shared responsibilities for everyone involved, both on and off the floor.
ASL proudly believes that every individual deserves to be treated with fairness and respect. We are committed to an inclusive environment where participants are valued regardless of age, ancestry, race, colour, citizenship, language, religion, athletic ability, disability, family or marital status, gender identity or expression, sex, or sexual orientation.
Upholding these standards is a shared responsibility. Players, coaches, managers, executives, trainers, and fans all play a role in fostering a positive, welcoming, and competitive lacrosse community.
The Alberta Series Lacrosse league features five franchises across the province—two based in Calgary and three in Edmonton. The level of play is fast-paced, highly competitive, and driven by passionate, dedicated athletes. Many ASL players also compete in the National Lacrosse League (NLL), making ASL one of the most exciting Senior "B" lacrosse leagues in Canada.
Each year, ASL franchises draft graduating Junior players, though being drafted does not automatically mean immediate placement on the roster. Competition is strong, and opportunities are earned.
At the end of every season, ASL teams battle it out in the provincial playoffs. The champion earns the honour of representing Alberta at the President's Cup—the national championship awarded by the Canadian Lacrosse Association to the top Senior "B" box lacrosse team in the country.`;
      }
    }

    // Inject defaults for Junior A
    if (decodedName === 'Junior A') {
      if (!data) {
        data = {};
      }

      // Inject default description if not set via CMS
      if (!data.divisionDescription) {
        data.divisionDescription = `RMJALL Website: https://www.thermjall.com
Rocky Mountain Junior A Lacrosse League (RMJALL)
Junior A represents the pinnacle of box lacrosse in Canada for players aged 17–21—much like the Western Hockey League (WHL). The RMJALL showcases five elite, highly competitive teams: the Calgary Mountaineers, Raiders Jr A Lacrosse, Edmonton Miners, Saskatchewan Swat, and the Winnipeg Blizzard.
Competing at this level takes exceptional skill, speed, and unwavering commitment. Players train 4–6 times a week and battle across Alberta, Saskatchewan, and Manitoba in a fast-paced season running from April through August.
While cracking a Junior A roster early in a player's junior years is rare, the development pathway is strong—many rising athletes get their first taste of high-level action as affiliate call-ups. Thanks to the league's outstanding caliber of play, countless Junior A athletes have gone on to excel in professional and collegiate lacrosse.
Every February, teams draft the next wave of standout talent, building and protecting a list of up to 50 players. The season climaxes with the thrilling chase for the Minto Cup—Canada's most prestigious Junior box lacrosse title. Year after year, the RMLL proves it belongs among the nation's best: ready to compete, ready to win.
Since its establishment in 2003, the RMJALL has proudly built a tradition of excellence, development, and opportunity for the next generation of lacrosse stars.`;
      }
    }

    // Inject defaults for Junior B Tier I
    if (decodedName === 'Junior B Tier I') {
      if (!data) {
        data = {};
      }

      // Inject default description if not set via CMS
      if (!data.divisionDescription) {
        data.divisionDescription = `RMLL Junior B Tier I
Junior "B" Tier I represents one of the most exciting and competitive levels of Junior box lacrosse in Alberta. With 13 high-caliber teams, this league delivers fast-paced action, elite competition, and an incredible development environment for aspiring players.
The league features 11 teams across Alberta—three in Calgary, one in Airdrie/Cochrane, one in Okotoks, one in Innisfail, one in Red Deer, three in the Edmonton area, and one in Fort Saskatchewan—along with teams from Saskatoon and Regina, Saskatchewan. This broad geographic footprint creates intense rivalries and memorable road trips.
Junior "B" Tier I is a key stepping stone for athletes aiming to advance to the Junior "A" level. Most players range from 17 to 21 years old, using this stage to sharpen their skills, gain valuable game experience, and showcase their potential for the next level.
League Highlights
Approximately 18 regular-season games
Rosters of 23–25 players per team
Unbalanced schedules featuring out-of-town competition
Overnight travel that builds team culture and resilience
Participation in Provincial playoffs
Top teams earn the opportunity to apply for the prestigious Founder's Cup, awarded annually to the Canadian Junior "B" National Champions
Player Draft & Development
The Junior "B" Tier I league also features regional player drafts. Each year, Alberta teams may draft up to 20 graduating U17 players based on geographic regions. While being drafted secures a team's playing rights to a player, it does not guarantee a roster spot—competition remains strong, and opportunities are earned, just like at the Junior "A" level.
Junior "B" Tier I is where commitment meets opportunity, and where the next generation of elite lacrosse players begins to rise.`;
      }
    }

    // Inject defaults for Junior B Tier III
    if (decodedName === 'Junior B Tier III') {
      if (!data) {
        data = {};
      }

      // Inject default description if not set via CMS
      if (!data.divisionDescription) {
        data.divisionDescription = `RMLL Tier III Division
In 2006, the RMLL created another level of Junior lacrosse, the Tier III Division. This Division is viewed as a stepping stone and developmental division for a player and/or team entering Major lacrosse. The implementation of this Junior Division enables both large and small centers to field teams with players, who are not yet ready to compete at the Tier II level.
The Tier III Division is very popular for those young men who wish to continue playing the game of box lacrosse at a good level but do not want to play at higher levels of lacrosse due to other commitments such as work and/or school, as well as for those young men who have only played a year or two in the Minor levels, and those who have never played lacrosse before.
Ten teams coming from Southern Alberta along with three teams from the Wheatland area played in the Division in the inaugural season. By 2009 the Division had grown to seventeen teams.
Over the years, the number of teams in the Tier III Division has steadily diminished. The Division achieved its goal of a developmental place to play for players and teams, as every year since its conception, both players and teams have moved up to higher levels.
A RMLL Award is handed out annually to the player who is the highest point leader from Regular Season.`;
      }
    }

    // Inject defaults for Alberta Major Senior Female
    if (decodedName === 'Alberta Major Senior Female') {
      if (!data) {
        data = {};
      }

      // Inject default description if not set via CMS
      if (!data.divisionDescription) {
        data.divisionDescription = `RMLL Senior Women Program
In 2010 there were enough players to implement a Senior Women Division in the RMLL. The inaugural Season for the Senior Women included three teams: one from Edmonton, one from Red Deer and one from Calgary. Prior to 2010, the Senior aged players wishing to continue to play lacrosse had to register to a Junior Ladies team.
The players in Senior Women are very committed and lacrosse at this level is very competitive. As the Division is still growing, to add variety, the Senior teams have two interlock games with the Junior teams in their local area.
The Senior Women Division is for any players over the age of twenty-one. Teams can register up to thirty players each. The Regular Season starts the last week of April and runs until the last week of June. Regular Season is followed by Playoffs and the RMLL Championship and all is completed by the end of the second week in July.
Every February, Graduating Junior players within the Region of their residence are drafted by the Senior teams within the same Region.
The "Stacey Dziwenko Award" is handed out annually to the player who is the highest point leader from Regular Season.`;
      }
    }

    // Inject defaults for Alberta Major Female (Junior Ladies)
    if (decodedName === 'Alberta Major Female') {
      if (!data) {
        data = {};
      }

      // Force inject championships data (authoritative hardcoded data)
      console.log(`[Division] Alberta Major Female - Force injecting championships from hardcoded data`);
      data.championships = JSON.stringify(albertaMajorFemaleChampionshipsData);

      // Inject default description if not set via CMS
      if (!data.divisionDescription) {
        data.divisionDescription = `RMLL Major Female Lacrosse
The Major Female Lacrosse Program has been a proud and growing division of the Rocky Mountain Lacrosse League (RMLL) since its introduction in 2005. The inaugural season featured six teams—two from Edmonton, one from Red Deer, and three from Calgary—marking an important milestone in the development of elite female box lacrosse in Alberta.
From 2005 to 2009, the Major Female Division included players aged 17 and older as of December 31 of the current playing year. As participation and depth continued to grow, the RMLL expanded in 2010 to introduce a Senior Division for players 22 years of age and older, allowing the Major Female pathway to better support long-term athlete development.
Junior Major Female Division
The Junior Major Female Division is a highly competitive environment that showcases some of the top female lacrosse talent in the province. Athletes competing at this level demonstrate a strong commitment to the sport, and games are fast-paced, physical, and skill-driven.
As the division continues to grow, Junior Major teams play two interlock games each season against Senior teams within their local region, providing valuable development opportunities and increased competitive variety.
The Junior Major Female Division is open to players who are:
– At least 17 years old
– Under 22 years of age as of December 31 in the year they wish to compete
Teams may register up to 30 players per roster.
Season Structure & Championships
The regular season begins in the last week of April and runs through the first week of July, followed by the Alberta Lacrosse Association (ALA) Provincial Tournament held on the third weekend in July.
The Provincial Tournament features:
– The host team
– The top three teams from the regular season
Hosting responsibilities rotate annually between the North and South regions.
Player Development & Recognition
In 2023, a Graduating U17 Player Draft was introduced to help maintain competitive balance among the three Major Female teams in Calgary and to support the transition of elite youth athletes into the program.
Each season, the Stacey Dziwenko Award is presented to the player who finishes the regular season as the league's leading point scorer, recognizing excellence and offensive achievement.
National Competition
Each year, the Alberta Lacrosse Association (ALA) selects players to form a team to represent the ALA at Lacrosse Canada's National Championship for Major Female athletes, where competitors battle for the prestigious Carol Patterson Trophy.
The RMLL Major Female Lacrosse Program continues to be a cornerstone of female box lacrosse development in Alberta, offering elite competition, meaningful progression opportunities, and a pathway to provincial and national success.`;
      }
    }

    if (!data) {
      // Return empty data structure if not found
      return c.json({
        divisionInfo: {},
        seasonInfo: "",
        drafts: "",
        protectedList: "",
        transactions: "",
        awards: "",
        championships: ""
      });
    }

    return c.json(data);
  } catch (error) {
    console.error("Error fetching division data:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Update division data
app.put("/division/:name", async (c) => {
  try {
    const name = c.req.param("name");
    const decodedName = decodeURIComponent(name);
    const body = await c.req.json();

    const key = `division:${decodedName}`;

    // Get existing data to merge or start fresh
    const existing = await kv.get(key) || {};

    const updated = {
      ...existing,
      ...body,
      updated_at: new Date().toISOString(),
    };

    await kv.set(key, updated);

    return c.json(updated);
  } catch (error) {
    console.error("Error updating division data:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================
// LEAGUE INFO ROUTES (kept in KV for now)
// ============================================

// Get navigation structure
app.get("/cms/league-info-navigation", async (c) => {
  try {
    // Try to get custom navigation structure
    let nav = await kv.get("league-info:navigation");
    console.log('[Navigation Debug] KV nav:', nav ? 'Found' : 'Not found');

    // Default navigation if not found
    if (!nav) {
      nav = [
        {
          title: "About",
          icon: "Briefcase",
          items: [
            { id: "rmll-executive", label: "Executive", slug: "rmll-executive" },
            { id: "mission-statement", label: "Mission Statement", slug: "mission-statement" },
            { id: "history", label: "History", slug: "history" },
            { id: "awards", label: "Awards", slug: "awards" },
            { id: "affiliate-links", label: "Affiliate Links", slug: "affiliate-links" }
          ]
        },
        {
          title: "Governance",
          icon: "Scale",
          items: [
            { id: "code-of-conduct", label: "Code of Conduct", slug: "code-of-conduct" },
            { id: "privacy-policy", label: "Privacy Policy", slug: "privacy-policy" },
            { id: "bylaws", label: "Bylaws", slug: "bylaws" },
            { id: "regulations", label: "Regulations", slug: "regulations" },
            { id: "rules-of-play", label: "Rules of Play", slug: "rules-of-play" },
            { id: "planning-meeting-agm", label: "Planning Meeting & AGM", slug: "planning-meeting-agm" },
            { id: "brand-guidelines", label: "Brand Guidelines", slug: "brand-guidelines" }
          ]
        },
        {
          title: "Resources",
          icon: "FileText",
          items: [
            { id: "documents", label: "Documents Library", slug: "documents" },
            { id: "facilities", label: "Facilities", slug: "facilities" },
            { id: "lcala-info", label: "LC & ALA Info", slug: "lcala-info" }
          ]
        },
        {
          title: "Players & Coaches",
          icon: "Users",
          items: [
            { id: "registration", label: "Intent-to-Play", slug: "registration" },
            { id: "new-player-info", label: "New Player Info", slug: "new-player-info" },
            { id: "new-player-info-female", label: "New Player Info (Female)", slug: "new-player-info-female" },
            { id: "graduating-u17-info", label: "Graduating U17 Info Sessions", slug: "graduating-u17-info" },
            { id: "super-coaching-clinic", label: "Super Coaching Clinic", slug: "super-coaching-clinic" },
            { id: "coaching-requirements", label: "Coaching Requirements", slug: "coaching-requirements" },
            { id: "combines", label: "Combines", slug: "combines" },
            { id: "suspension-guidelines", label: "Suspensions", slug: "suspension-guidelines" },
            { id: "bad-standing", label: "Bad Standing", slug: "bad-standing" },
            { id: "record-books", label: "Record Books", slug: "record-books" }
          ]
        },
        {
          title: "Officiating",
          icon: "BookOpen",
          items: [
            { id: "officiating-rulebook", label: "Rulebook", slug: "officiating-rulebook" },
            { id: "officiating-floor-equipment", label: "Floor & Equipment", slug: "officiating-floor-equipment" },
            { id: "officiating-rule-interpretations", label: "Rule Interpretations", slug: "officiating-rule-interpretations" },
            { id: "officiating-off-floor-officials", label: "Off-Floor Officials", slug: "officiating-off-floor-officials" },
            { id: "officiating-application-form", label: "Application Form", slug: "officiating-application-form" }
          ]
        }
      ];
    }

    // Ensure the Officiating section is always present (may be missing from older saved nav)
    if (Array.isArray(nav)) {
      const hasOfficiating = nav.some((section: any) => section.title === "Officiating");
      if (!hasOfficiating) {
        nav.push({
          title: "Officiating",
          icon: "BookOpen",
          items: [
            { id: "officiating-rulebook", label: "Rulebook", slug: "officiating-rulebook" },
            { id: "officiating-floor-equipment", label: "Floor & Equipment", slug: "officiating-floor-equipment" },
            { id: "officiating-rule-interpretations", label: "Rule Interpretations", slug: "officiating-rule-interpretations" },
            { id: "officiating-off-floor-officials", label: "Off-Floor Officials", slug: "officiating-off-floor-officials" },
            { id: "officiating-application-form", label: "Application Form", slug: "officiating-application-form" }
          ]
        });
      }

      // Also clean up: remove Forms, Insurance from Resources and Officiating from Players & Coaches
      // Remove brand-guidelines and record-books from About (should not be there)
      nav = nav.map((section: any) => {
        // Remove brand-guidelines and record-books from About section
        if (section.title === "About" && Array.isArray(section.items)) {
          let items = section.items.filter((item: any) =>
            item.id !== 'brand-guidelines' && item.id !== 'record-books'
          );
          return { ...section, items };
        }
        if (section.title === "Resources" && Array.isArray(section.items)) {
          let items = section.items.filter((item: any) =>
            item.id !== 'forms' && item.id !== 'insurance' &&
            item.id !== 'brand-guidelines' && item.id !== 'record-books'
          );
          // Ensure lcala-info is present
          if (!items.some((item: any) => item.id === 'lcala-info')) {
            items.push({ id: "lcala-info", label: "LC & ALA Info", slug: "lcala-info" });
          }
          return {
            ...section,
            items
          };
        }
        if (section.title === "Players & Coaches" && Array.isArray(section.items)) {
          // Remove old 'officiating' item if present
          let items = section.items.filter((item: any) => item.id !== 'officiating');
          // Ensure suspension-guidelines is present
          if (!items.some((item: any) => item.id === 'suspension-guidelines')) {
            items.push({ id: "suspension-guidelines", label: "Suspensions", slug: "suspension-guidelines" });
          }
          // Ensure bad-standing is present
          if (!items.some((item: any) => item.id === 'bad-standing')) {
            items.push({ id: "bad-standing", label: "Bad Standing", slug: "bad-standing" });
          }
          // Ensure new-player-info is present
          if (!items.some((item: any) => item.id === 'new-player-info')) {
            // Insert after registration
            const regIdx = items.findIndex((item: any) => item.id === 'registration');
            const insertAt = regIdx >= 0 ? regIdx + 1 : 1;
            items.splice(insertAt, 0, { id: "new-player-info", label: "New Player Info", slug: "new-player-info" });
          }
          // Ensure new-player-info-female is present
          if (!items.some((item: any) => item.id === 'new-player-info-female')) {
            const maleIdx = items.findIndex((item: any) => item.id === 'new-player-info');
            const insertAt = maleIdx >= 0 ? maleIdx + 1 : 2;
            items.splice(insertAt, 0, { id: "new-player-info-female", label: "New Player Info (Female)", slug: "new-player-info-female" });
          }
          // Ensure coaching-requirements is present
          if (!items.some((item: any) => item.id === 'coaching-requirements')) {
            const clinicIdx = items.findIndex((item: any) => item.id === 'super-coaching-clinic');
            const insertAt = clinicIdx >= 0 ? clinicIdx + 1 : items.length;
            items.splice(insertAt, 0, { id: "coaching-requirements", label: "Coaching Requirements", slug: "coaching-requirements" });
          }
          // Ensure graduating-u17-info is present
          if (!items.some((item: any) => item.id === 'graduating-u17-info')) {
            const femaleIdx = items.findIndex((item: any) => item.id === 'new-player-info-female');
            const insertAt = femaleIdx >= 0 ? femaleIdx + 1 : 3;
            items.splice(insertAt, 0, { id: "graduating-u17-info", label: "Graduating U17 Info Sessions", slug: "graduating-u17-info" });
          }
          // Ensure record-books is present at the end
          if (!items.some((item: any) => item.id === 'record-books')) {
            items.push({ id: "record-books", label: "Record Books", slug: "record-books" });
          }
          return { ...section, items };
        }
        // Remove suspension-guidelines from Governance (moved to Players & Coaches)
        if (section.title === "Governance" && Array.isArray(section.items)) {
          let items = section.items.filter((item: any) => item.id !== 'suspension-guidelines');
          // Ensure planning-meeting-agm is present
          if (!items.some((item: any) => item.id === 'planning-meeting-agm')) {
            items.push({ id: "planning-meeting-agm", label: "Planning Meeting & AGM", slug: "planning-meeting-agm" });
          }
          // Ensure brand-guidelines is present at the end
          if (!items.some((item: any) => item.id === 'brand-guidelines')) {
            items.push({ id: "brand-guidelines", label: "Brand Guidelines", slug: "brand-guidelines" });
          }
          return {
            ...section,
            items
          };
        }
        return section;
      });
    }

    return c.json({ success: true, navigation: nav });
  } catch (error) {
     console.error("Error fetching league info navigation:", error);
     return c.json({ success: false, error: error.message }, 500);
  }
});

// Reset navigation to default (delete KV entry)
app.delete("/cms/league-info-navigation", async (c) => {
  try {
    await kv.del("league-info:navigation");
    console.log('[Navigation] KV navigation deleted, will use default');
    return c.json({ success: true, message: "Navigation reset to default" });
  } catch (error) {
    console.error("Error resetting league info navigation:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Save navigation structure
app.post("/cms/league-info-navigation", async (c) => {
  try {
    const body = await c.req.json();
    const { navigation } = body;

    if (!navigation || !Array.isArray(navigation)) {
      return c.json({ success: false, error: "Invalid navigation data: expected an array" }, 400);
    }

    await kv.set("league-info:navigation", navigation);
    console.log(`[League Info] Navigation saved with ${navigation.length} sections`);
    return c.json({ success: true });
  } catch (error) {
    console.error("Error saving league info navigation:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ─── Component page registry ───
// Maps slug → { title, component, editable }
// editable=false means the page ALWAYS renders the React component (live data / interactive tool)
// editable=true means KV HTML content can override the default component
const COMPONENT_PAGES: Record<string, { title: string; component: string; editable: boolean }> = {
  'rmll-executive':                { title: 'RMLL Executive',                  component: 'RMLLExecutivePage',                   editable: true },
  'affiliate-links':               { title: 'Affiliate Links',                 component: 'AffiliateLinksPage',                  editable: true },
  'affiliate-website-links':       { title: 'Affiliate Links',                 component: 'AffiliateLinksPage',                  editable: true },
  'mission-statement':             { title: 'Mission Statement',               component: 'MissionStatementPage',                editable: true },
  'history':                       { title: 'League History',                   component: 'HistoryPage',                         editable: true },
  'documents':                     { title: 'Documents Library',                component: 'DocumentsLibraryContent',             editable: false },
  'code-of-conduct':               { title: 'Code of Conduct',                 component: 'CodeOfConductPage',                   editable: true },
  'privacy-policy':                { title: 'Privacy Policy',                   component: 'PrivacyPolicyPage',                   editable: true },
  'bylaws':                        { title: 'Bylaws',                           component: 'BylawsPage',                          editable: true },
  'regulations':                   { title: 'Regulations',                      component: 'RegulationsPage',                     editable: true },
  'rules-of-play':                 { title: 'Rules of Play',                    component: 'RulesOfPlayPage',                     editable: true },
  'facilities':                    { title: 'Facilities',                       component: 'FacilitiesPage',                      editable: false },
  'awards':                        { title: 'Awards',                           component: 'AwardsPage',                          editable: true },
  'registration':                  { title: 'Registration',                     component: 'RegistrationPage',                    editable: true },
  'suspension-guidelines':         { title: 'Current Season Suspensions',       component: 'SuspensionsPage',                     editable: false },
  'super-coaching-clinic':         { title: 'Super Coaching Clinic',            component: 'SuperCoachingClinicPage',              editable: true },
  'coaching-requirements':         { title: 'Coaching Requirements',            component: 'CoachingRequirementsPage',             editable: true },
  'combines':                      { title: 'Combines',                         component: 'CombinesPage',                        editable: true },
  'officiating-rulebook':          { title: 'Officiating Rulebook',             component: 'OfficiatingRulebookPage',              editable: true },
  'officiating-floor-equipment':   { title: 'Floor & Equipment',               component: 'OfficiatingFloorEquipmentPage',        editable: true },
  'officiating-rule-interpretations': { title: 'Rule Interpretations',          component: 'OfficiatingRuleInterpretationsPage',   editable: true },
  'officiating-off-floor-officials':  { title: 'Off-Floor Officials',           component: 'OfficiatingOffFloorOfficialsPage',     editable: true },
  'officiating-application-form':  { title: 'Officials Application Form',      component: 'OfficiatingApplicationFormPage',       editable: true },
  'bad-standing':                  { title: 'Players in Bad Standing',          component: 'BadStandingPage',                     editable: true },
  'new-player-info':               { title: 'New Player Information',           component: 'NewPlayerInfoPage',                   editable: true },
  'new-player-info-female':        { title: 'New Player Information (Female)',  component: 'NewPlayerInfoFemalePage',              editable: true },
  'graduating-u17-info':           { title: 'Graduating U17 Info Sessions',     component: 'GraduatingU17InfoPage',               editable: true },
  'lcala-info':                    { title: 'LC & ALA Info',                    component: 'LCALAInfoPage',                       editable: true },
  'brand-guidelines':              { title: 'Brand Guidelines',                 component: 'BrandGuidelinesPage',                 editable: true },
  'planning-meeting-agm':          { title: 'Planning Meeting & AGM',           component: 'PlanningMeetingAGMPage',              editable: true },
  'record-books':                  { title: 'Record Books',                     component: 'RecordBooksPage',                     editable: true },
};

// Get content for a specific page
app.get("/cms/league-info-content/:slug", async (c) => {
  try {
    const slug = c.req.param("slug");
    console.log(`[League Info] Fetching content for: ${slug}`);

    const componentInfo = COMPONENT_PAGES[slug];

    // ── 1. If it's a known component page ──
    if (componentInfo) {
      // For editable component pages, check for structured content FIRST
      if (componentInfo.editable) {
        const structuredContent = await kv.get(`page-structured:${slug}`);
        if (structuredContent && structuredContent.sections) {
          console.log(`[League Info] Serving structured content for: ${slug}`);
          return c.json({
            success: true,
            content: {
              title: structuredContent.title || componentInfo.title,
              structuredContent: structuredContent,
              isStructured: true,
              hasOverride: true,
              isDraft: false,
              customComponent: componentInfo.component,
            }
          });
        }

        // Then check KV for admin-saved HTML override
        const kvOverride = await kv.get(`page:${slug}`);
        if (kvOverride && kvOverride.content && typeof kvOverride.content === 'string' && kvOverride.content.trim().length > 0) {
          console.log(`[League Info] Serving KV override for component page: ${slug}`);
          return c.json({
            success: true,
            content: {
              title: kvOverride.title || componentInfo.title,
              content: kvOverride.content,
              htmlContent: true,
              isDraft: kvOverride.isDraft || false,
              hasKvOverride: true,
              defaultComponent: componentInfo.component,
            }
          });
        }
      }

      // No KV override (or not editable) — return the default component
      return c.json({
        success: true,
        content: {
          title: componentInfo.title,
          customComponent: componentInfo.component,
          isDraft: false,
          editable: componentInfo.editable,
        }
      });
    }

    // ── 2. Not a component page — fetch from database pages store ──
    const page = await getPageBySlug(slug);

    if (page) {
      return c.json({ success: true, content: page });
    }

    // Return a placeholder if not found
    return c.json({
      success: true,
      content: {
          title: slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' '),
          content: `<div class="p-4 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
            <h3 class="font-bold mb-2">Content Coming Soon</h3>
            <p>The content for <strong>${slug}</strong> is currently being updated.</p>
          </div>`,
          isDraft: true
      }
    });
  } catch (error) {
    console.error(`Error fetching league info content for ${c.req.param("slug")}:`, error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Get component page info for admin — returns editability status and whether KV override exists
app.get("/cms/component-page-info/:slug", async (c) => {
  try {
    const slug = c.req.param("slug");
    const componentInfo = COMPONENT_PAGES[slug];

    if (!componentInfo) {
      return c.json({ success: false, error: 'Not a component page' }, 404);
    }

    const kvOverride = await kv.get(`page:${slug}`);

    return c.json({
      success: true,
      info: {
        slug,
        title: componentInfo.title,
        component: componentInfo.component,
        editable: componentInfo.editable,
        hasKvOverride: !!(kvOverride && kvOverride.content && typeof kvOverride.content === 'string' && kvOverride.content.trim().length > 0),
        kvContent: kvOverride || null,
      }
    });
  } catch (error) {
    console.error(`Error fetching component page info for ${c.req.param("slug")}:`, error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Save KV override for a component page (or reset to default)
app.post("/cms/component-page-content/:slug", async (c) => {
  try {
    const slug = c.req.param("slug");
    const body = await c.req.json();
    const componentInfo = COMPONENT_PAGES[slug];

    if (!componentInfo) {
      return c.json({ success: false, error: 'Not a component page' }, 404);
    }
    if (!componentInfo.editable) {
      return c.json({ success: false, error: 'This component page is not editable (uses live data)' }, 403);
    }

    // If resetting to default component
    if (body.resetToDefault) {
      await kv.del(`page:${slug}`);
      console.log(`[League Info] Reset component page to default: ${slug}`);
      return c.json({ success: true, message: 'Reset to default component' });
    }

    // Save HTML content override
    const pageData = {
      title: body.title || componentInfo.title,
      content: body.content || '',
      htmlContent: true,
      isDraft: body.isDraft || false,
      meta_description: body.meta_description || null,
      is_published: body.is_published !== false,
      updated_at: new Date().toISOString(),
    };

    await kv.set(`page:${slug}`, pageData);
    console.log(`[League Info] Saved KV override for component page: ${slug}`);

    return c.json({ success: true, message: 'Content saved' });
  } catch (error) {
    console.error(`Error saving component page content for ${c.req.param("slug")}:`, error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================
// STRUCTURED CONTENT ENDPOINTS (kept in KV for now)
// ============================================

// Get structured content for a page (KV overrides or null)
app.get("/cms/structured-content/:slug", async (c) => {
  try {
    const slug = c.req.param("slug");
    console.log(`[Structured Content] Fetching for: ${slug}`);

    const data = await kv.get(`page-structured:${slug}`);

    return c.json({
      success: true,
      content: data || null,
      hasOverride: !!data,
    });
  } catch (error) {
    console.error(`Error fetching structured content for ${c.req.param("slug")}:`, error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Save structured content for a page
app.post("/cms/structured-content/:slug", async (c) => {
  try {
    const slug = c.req.param("slug");
    const body = await c.req.json();

    console.log(`[Structured Content] Saving for: ${slug}`);

    // If resetting to default
    if (body.resetToDefault) {
      await kv.del(`page-structured:${slug}`);
      // Also clear the HTML override if it exists
      await kv.del(`page:${slug}`);
      console.log(`[Structured Content] Reset to default: ${slug}`);
      return c.json({ success: true, message: 'Reset to default' });
    }

    // Save structured content
    const structuredData = {
      pageId: slug,
      title: body.title,
      sections: body.sections,
      updated_at: new Date().toISOString(),
      updated_by: body.updated_by || 'admin',
    };

    await kv.set(`page-structured:${slug}`, structuredData);

    // Also clear the old HTML override if it exists, since structured takes priority
    await kv.del(`page:${slug}`);

    console.log(`[Structured Content] Saved for: ${slug}`);
    return c.json({ success: true, message: 'Structured content saved' });
  } catch (error) {
    console.error(`Error saving structured content for ${c.req.param("slug")}:`, error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// List all pages with structured content overrides
app.get("/cms/structured-content-list", async (c) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Get structured content overrides
    const structuredResult = await supabase
      .from("kv_store_9a1ba23f")
      .select("key, value")
      .like("key", "page-structured:%");

    // Get HTML overrides
    const htmlResult = await supabase
      .from("kv_store_9a1ba23f")
      .select("key, value")
      .like("key", "page:%");

    const structuredPages = (structuredResult.data || []).map((item: any) => ({
      pageId: item.value.pageId || item.key.replace('page-structured:', ''),
      title: item.value.title || 'Unknown',
      updated_at: item.value.updated_at,
      type: 'structured',
    }));

    // Add HTML overrides that don't already have structured overrides
    const structuredIds = new Set(structuredPages.map((p: any) => p.pageId));
    const htmlPages = (htmlResult.data || [])
      .map((item: any) => ({
        pageId: item.key.replace('page:', ''),
        title: item.value.title || item.value.pageTitle || 'Unknown',
        updated_at: item.value.updated_at,
        type: 'html',
      }))
      .filter((p: any) => !structuredIds.has(p.pageId) && p.pageId !== 'home');

    return c.json({ success: true, pages: [...structuredPages, ...htmlPages] });
  } catch (error) {
    console.error("Error listing structured content:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Bulk reset all structured content to defaults
app.post("/cms/structured-content/reset-all", async (c) => {
  try {
    console.log("[Bulk Reset] Resetting all structured content to defaults");

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Get all structured content overrides
    const structuredResult = await supabase
      .from("kv_store_9a1ba23f")
      .select("key, value")
      .like("key", "page-structured:%");

    // Get all HTML overrides
    const htmlResult = await supabase
      .from("kv_store_9a1ba23f")
      .select("key, value")
      .like("key", "page:%");

    const structuredKeys = (structuredResult.data || []).map((item: any) => ({
      key: item.key,
      pageId: item.value.pageId || item.key.replace('page-structured:', ''),
    }));

    const htmlKeys = (htmlResult.data || [])
      .map((item: any) => ({
        key: item.key,
        pageId: item.key.replace('page:', ''),
      }))
      .filter((item: any) => item.pageId !== 'home');

    // Collect all page IDs for the response
    const pageIdsSet = new Set([
      ...structuredKeys.map((k: any) => k.pageId),
      ...htmlKeys.map((k: any) => k.pageId),
    ]);

    // Delete all overrides
    let deletedCount = 0;
    const allKeysToDelete = [...structuredKeys, ...htmlKeys].map((k: any) => k.key);

    if (allKeysToDelete.length > 0) {
      const { error } = await supabase
        .from("kv_store_9a1ba23f")
        .delete()
        .in("key", allKeysToDelete);

      if (error) {
        console.error("[Bulk Reset] Error deleting keys:", error);
      } else {
        deletedCount = allKeysToDelete.length;
        console.log(`[Bulk Reset] Deleted ${deletedCount} override(s)`);
      }
    }

    console.log(`[Bulk Reset] Completed: ${deletedCount} keys deleted for ${pageIdsSet.size} pages`);

    return c.json({
      success: true,
      message: `Reset ${pageIdsSet.size} pages to defaults`,
      pagesReset: Array.from(pageIdsSet),
    });
  } catch (error) {
    console.error("Error bulk resetting structured content:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Diagnostic: List all page-related KV entries
app.get("/cms/structured-content/diagnostic", async (c) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const structuredResult = await supabase
      .from("kv_store_9a1ba23f")
      .select("key, value")
      .like("key", "page-structured:%");

    const htmlResult = await supabase
      .from("kv_store_9a1ba23f")
      .select("key, value")
      .like("key", "page:%");

    return c.json({
      success: true,
      structuredOverrides: structuredResult.data || [],
      htmlOverrides: htmlResult.data || [],
    });
  } catch (error) {
    console.error("Error in diagnostic:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================
// HELPER FUNCTIONS (for pages - combining DB and KV)
// ============================================

async function getPages() {
  const dbPages = await db.getPages();
  const kvPages = await kv.getByPrefix("page:");

  // Merge KV pages with DB pages (KV takes precedence for component pages)
  const kvPageMap = new Map(kvPages.map((p: any) => [p.slug, p]));

  return dbPages.map((page: any) => {
    const kvPage = kvPageMap.get(page.slug);
    if (kvPage) {
      return { ...page, ...kvPage };
    }
    return page;
  });
}

async function getPageBySlug(slug: string) {
  // First check DB
  const dbPage = await db.getPageBySlug(slug);
  if (dbPage) return dbPage;

  // Then check KV
  const kvPage = await kv.get(`page:${slug}`);
  return kvPage;
}

async function createPage(pageData: any) {
  return await db.createPage(pageData);
}

async function updatePage(slug: string, updates: any) {
  return await db.updatePage(slug, updates);
}

export default app;