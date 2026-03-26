import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// KV key helpers
const seasonKey = (year: number) => `suspensions:season:${year}`;
const indexKey = () => `suspensions:seasons-index`;

// ── GET all season years ──
app.get("/cms/suspensions/seasons", async (c) => {
  try {
    const index = await kv.get(indexKey());
    const seasons: number[] = index || [];
    return c.json({ success: true, seasons: seasons.sort((a: number, b: number) => b - a) });
  } catch (error) {
    console.log(`[Suspensions] Error fetching seasons: ${error}`);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ── GET season data (suspensions + carryovers + associationStatuses) ──
app.get("/cms/suspensions/season/:year", async (c) => {
  try {
    const year = parseInt(c.req.param("year"));
    if (isNaN(year)) return c.json({ success: false, error: "Invalid year" }, 400);

    const data = await kv.get(seasonKey(year));
    if (!data) {
      return c.json({ success: true, data: { season: year, suspensions: [], carryovers: [], associationStatuses: [] } });
    }
    return c.json({ success: true, data });
  } catch (error) {
    console.log(`[Suspensions] Error fetching season ${c.req.param("year")}: ${error}`);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ── GET all seasons' data at once (for the public page) ──
app.get("/cms/suspensions/all", async (c) => {
  try {
    const index = await kv.get(indexKey());
    const seasons: number[] = index || [];

    if (seasons.length === 0) {
      return c.json({ success: true, allSeasons: [], fromKv: false });
    }

    const allSeasons = [];
    for (const year of seasons) {
      const data = await kv.get(seasonKey(year));
      if (data) allSeasons.push(data);
    }

    allSeasons.sort((a: any, b: any) => b.season - a.season);
    return c.json({ success: true, allSeasons, fromKv: true });
  } catch (error) {
    console.log(`[Suspensions] Error fetching all suspensions: ${error}`);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ── POST add/update a suspension entry ──
app.post("/cms/suspensions/entry", async (c) => {
  try {
    const body = await c.req.json();
    const { season, entry, entryType, entryIndex } = body;
    // entryType: 'suspension' | 'carryover'
    // entryIndex: if present, update at index; if absent, append

    if (!season || !entry) {
      return c.json({ success: false, error: "season and entry are required" }, 400);
    }

    const year = parseInt(season);
    let data = await kv.get(seasonKey(year));
    if (!data) {
      data = { season: year, suspensions: [], carryovers: [], associationStatuses: [] };
    }

    const list = entryType === 'carryover' ? 'carryovers' : 'suspensions';
    if (!data[list]) data[list] = [];

    // Generate a unique id if the entry doesn't have one
    if (!entry.id) {
      entry.id = `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    }

    if (entryIndex !== undefined && entryIndex !== null && entryIndex >= 0 && entryIndex < data[list].length) {
      // Update existing
      data[list][entryIndex] = entry;
      console.log(`[Suspensions] Updated ${list}[${entryIndex}] in season ${year}`);
    } else {
      // Append new
      data[list].push(entry);
      console.log(`[Suspensions] Added new ${list} entry to season ${year}`);
    }

    await kv.set(seasonKey(year), data);

    // Ensure season is in index
    let index = await kv.get(indexKey()) || [];
    if (!index.includes(year)) {
      index.push(year);
      await kv.set(indexKey(), index);
    }

    return c.json({ success: true, data });
  } catch (error) {
    console.log(`[Suspensions] Error saving entry: ${error}`);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ── DELETE a suspension entry ──
app.delete("/cms/suspensions/entry", async (c) => {
  try {
    const body = await c.req.json();
    const { season, entryType, entryIndex } = body;

    if (!season || entryIndex === undefined) {
      return c.json({ success: false, error: "season and entryIndex are required" }, 400);
    }

    const year = parseInt(season);
    const data = await kv.get(seasonKey(year));
    if (!data) {
      return c.json({ success: false, error: "Season not found" }, 404);
    }

    const list = entryType === 'carryover' ? 'carryovers' : 'suspensions';
    if (!data[list] || entryIndex < 0 || entryIndex >= data[list].length) {
      return c.json({ success: false, error: "Entry not found" }, 404);
    }

    const removed = data[list].splice(entryIndex, 1);
    console.log(`[Suspensions] Deleted ${list}[${entryIndex}] from season ${year}: ${removed[0]?.name}`);

    await kv.set(seasonKey(year), data);
    return c.json({ success: true, data });
  } catch (error) {
    console.log(`[Suspensions] Error deleting entry: ${error}`);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ── POST save a full season (bulk update) ──
app.post("/cms/suspensions/season/:year", async (c) => {
  try {
    const year = parseInt(c.req.param("year"));
    if (isNaN(year)) return c.json({ success: false, error: "Invalid year" }, 400);

    const body = await c.req.json();
    const seasonData = {
      season: year,
      suspensions: body.suspensions || [],
      carryovers: body.carryovers || [],
      associationStatuses: body.associationStatuses || [],
    };

    await kv.set(seasonKey(year), seasonData);

    // Ensure season is in index
    let index = await kv.get(indexKey()) || [];
    if (!index.includes(year)) {
      index.push(year);
      await kv.set(indexKey(), index);
    }

    console.log(`[Suspensions] Saved full season ${year}: ${seasonData.suspensions.length} suspensions, ${seasonData.carryovers.length} carryovers`);
    return c.json({ success: true, message: `Season ${year} saved` });
  } catch (error) {
    console.log(`[Suspensions] Error saving season: ${error}`);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ── POST create a new season ──
app.post("/cms/suspensions/create-season", async (c) => {
  try {
    const { season } = await c.req.json();
    const year = parseInt(season);
    if (isNaN(year)) return c.json({ success: false, error: "Invalid year" }, 400);

    const existing = await kv.get(seasonKey(year));
    if (existing) {
      return c.json({ success: false, error: `Season ${year} already exists` }, 409);
    }

    const data = { season: year, suspensions: [], carryovers: [], associationStatuses: [] };
    await kv.set(seasonKey(year), data);

    let index = await kv.get(indexKey()) || [];
    if (!index.includes(year)) {
      index.push(year);
      await kv.set(indexKey(), index);
    }

    console.log(`[Suspensions] Created new season ${year}`);
    return c.json({ success: true, data });
  } catch (error) {
    console.log(`[Suspensions] Error creating season: ${error}`);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ── DELETE a season ──
app.delete("/cms/suspensions/season/:year", async (c) => {
  try {
    const year = parseInt(c.req.param("year"));
    if (isNaN(year)) return c.json({ success: false, error: "Invalid year" }, 400);

    await kv.del(seasonKey(year));

    let index = await kv.get(indexKey()) || [];
    index = index.filter((y: number) => y !== year);
    await kv.set(indexKey(), index);

    console.log(`[Suspensions] Deleted season ${year}`);
    return c.json({ success: true, message: `Season ${year} deleted` });
  } catch (error) {
    console.log(`[Suspensions] Error deleting season: ${error}`);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ── PUT update association statuses ──
app.put("/cms/suspensions/associations/:year", async (c) => {
  try {
    const year = parseInt(c.req.param("year"));
    if (isNaN(year)) return c.json({ success: false, error: "Invalid year" }, 400);

    const { associationStatuses } = await c.req.json();
    const data = await kv.get(seasonKey(year));
    if (!data) return c.json({ success: false, error: "Season not found" }, 404);

    data.associationStatuses = associationStatuses || [];
    await kv.set(seasonKey(year), data);

    console.log(`[Suspensions] Updated association statuses for season ${year}`);
    return c.json({ success: true });
  } catch (error) {
    console.log(`[Suspensions] Error updating associations: ${error}`);
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default app;
