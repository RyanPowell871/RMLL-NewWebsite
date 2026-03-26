# Division Data Audit

## Summary of Default Data Injection

| Division | Awards | Championships | Description | Injection Type |
|----------|--------|---------------|-------------|----------------|
| **Senior B** | `seniorBAwardsData.tsx` | `seniorBChampionshipsData.tsx` | ✅ | **FORCED** - always overrides KV |
| **Senior C** | None | None | ✅ | None (only description) |
| **Junior A** | None | None | ✅ | None (only description) |
| **Junior B Tier I** | None | None | ✅ | None (only description) |
| **Junior B Tier II** | `tier2AwardsData.tsx` | `tier2_championships_data.tsx` | ✅ | Conditional (if missing) |
| **Junior B Tier III** | None | None | ✅ | None (only description) |
| **Alberta Major Senior Female** | None | None | ✅ | None (only description) |
| **Alberta Major Female** | None | Carol Patterson | ✅ | Conditional (if missing) |

## Senior B - Default Data Expected

### Awards (force-injected)
- Point Leaders (Harris Toth Award) - 2000-2025
- Division Awards - 8 awards (Rookie of Year, MVP, Offensive, Defensive, Goalie, Community Builder, Lifetime MVP, Coach, Unsung Hero)
- Legacy 2009 Awards

### Championships (force-injected)
- Provincial: 1999-2025 (Sr. B Provincial Champions)
- National (Presidents' Cup): 1975-2025 (Bronze 2025, Silver 2024, etc.)

## Junior B Tier II - Default Data Expected

### Awards (injected if KV missing)
- North Conference (Jim Andrews):
  - Point Leaders (Dave Nyhuis Award) - 2000-2025
  - All-Star Teams (First & Second 2025)
- South Conference (Cindy Garant):
  - Point Leaders (Jim Lovgren Award) - 2000-2025
  - All-Star Teams (First & Second 2025)

### Championships (injected if KV missing)
- Provincial (Jack Little Trophy): 2000-2025
- North Conference Champions: 2002-2025
- North Subdivisions: North East, North Central (2013-2014)
- South Conference Champions: 2002-2025
- South Subdivisions: South West, South Central (2013-2014)

## Alberta Major Female - Default Data Expected

### Championships (injected if KV missing)
- National (Carol Patterson Trophy):
  - Description about ALA selecting players for national championship
  - Results: 2025, 2024, 2023 - Gold: Alberta

## The Problem

The CMS Division Manager loads data directly from KV store. If KV has old/incomplete data:
- The CMS shows wrong data
- The website may still show correct data (because backend injects defaults)

The **force-inject** approach for Senior B ensures it always works, but other divisions rely on conditional injection.

## What I Need You to Verify

For each division below, please tell me:

1. **What data IS showing correctly on the website** (especially Championships tab)?
2. **What data IS showing in the CMS** (if you can check)?
3. **Any custom content that must NOT be lost** (custom descriptions, etc.)?

### Division-Specific Questions:

**Senior B:**
- Are awards and championships showing correctly on the website?
- Is CMS showing correct data or different data?

**Senior C:**
- What's showing on the website? (Any championships, awards?)
- What's in CMS?

**Junior A:**
- What's showing on the website? (Championships tab content?)
- What's in CMS?

**Junior B Tier I:**
- What's showing on the website? (Championships tab content?)
- What's in CMS?

**Junior B Tier II:**
- Are awards and championships showing correctly on the website?
- Is CMS showing correct data or different data?

**Junior B Tier III:**
- What's showing on the website?
- What's in CMS?

**Alberta Major Senior Female:**
- What's showing on the website? (Championships tab content?)
- What's in CMS?

**Alberta Major Female:** ⚠️ Known Issue
- Is Carol Patterson Championship showing on the website? (2025, 2024, 2023 Gold medals?)
- What data is showing in the CMS?