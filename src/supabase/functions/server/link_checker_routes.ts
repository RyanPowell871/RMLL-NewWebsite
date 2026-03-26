import { Hono } from "npm:hono";

const app = new Hono();

// ============================================
// LINK CHECKER ROUTES
// ============================================

interface UrlCheckResult {
  url: string;
  status: number | null;
  statusText: string;
  ok: boolean;
  redirected: boolean;
  finalUrl: string | null;
  responseTimeMs: number;
  error: string | null;
}

// Check a single URL
async function checkUrl(url: string, timeoutMs = 10000): Promise<UrlCheckResult> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    // Try HEAD first (lighter), fall back to GET
    let response: Response;
    try {
      response = await fetch(url, {
        method: "HEAD",
        signal: controller.signal,
        redirect: "follow",
        headers: {
          "User-Agent": "RMLL-LinkChecker/1.0",
        },
      });
    } catch {
      // Some servers reject HEAD, try GET
      response = await fetch(url, {
        method: "GET",
        signal: controller.signal,
        redirect: "follow",
        headers: {
          "User-Agent": "RMLL-LinkChecker/1.0",
        },
      });
    }

    clearTimeout(timeout);
    const elapsed = Date.now() - start;

    return {
      url,
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      redirected: response.redirected,
      finalUrl: response.redirected ? response.url : null,
      responseTimeMs: elapsed,
      error: null,
    };
  } catch (err: any) {
    const elapsed = Date.now() - start;
    const isTimeout = err.name === "AbortError";
    return {
      url,
      status: null,
      statusText: isTimeout ? "Timeout" : "Network Error",
      ok: false,
      redirected: false,
      finalUrl: null,
      responseTimeMs: elapsed,
      error: isTimeout ? `Request timed out after ${timeoutMs}ms` : (err.message || "Unknown error"),
    };
  }
}

// POST /link-checker/check - Check a batch of URLs
app.post("/link-checker/check", async (c) => {
  try {
    const body = await c.req.json();
    const urls: string[] = body.urls;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return c.json({ success: false, error: "No URLs provided" }, 400);
    }

    // Limit batch size to prevent abuse
    const MAX_BATCH = 25;
    const urlsToCheck = urls.slice(0, MAX_BATCH);

    // Check all URLs concurrently (with concurrency limit)
    const CONCURRENCY = 5;
    const results: UrlCheckResult[] = [];

    for (let i = 0; i < urlsToCheck.length; i += CONCURRENCY) {
      const batch = urlsToCheck.slice(i, i + CONCURRENCY);
      const batchResults = await Promise.all(batch.map((url) => checkUrl(url)));
      results.push(...batchResults);
    }

    return c.json({
      success: true,
      data: {
        results,
        checked: results.length,
        total: urls.length,
        truncated: urls.length > MAX_BATCH,
      },
    });
  } catch (error: any) {
    console.log(`[LinkChecker] Error checking URLs: ${error.message}`);
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default app;
