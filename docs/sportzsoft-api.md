# SportzSoft API Documentation (RMLL)

> **Unofficial documentation** — SportzSoft provides no public API docs. This was reverse-engineered from the RMLL website codebase and live API responses.

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Base URL & Headers](#base-url--headers)
4. [LimiterCode & ChildCodes](#limitercode--childcodes)
5. [Endpoints](#endpoints)
6. [Caching](#caching)
7. [Response Wrapper](#response-wrapper)
8. [Inconsistencies & Quirks](#inconsistencies--quirks)
9. [Field Name Variants](#field-name-variants)
10. [Game Status Codes](#game-status-codes)
11. [Standing Category Codes](#standing-category-codes)
12. [Division Mapping](#division-mapping)
13. [Image URLs](#image-urls)

---

## Overview

SportzSoft is a sports management platform that RMLL uses for scheduling, standings, rosters, drafts, and more. The API is a REST-like service hosted at `sportzsoft.com`. It follows loose conventions — responses vary in structure, field names are inconsistent, and some endpoints behave differently depending on which query parameters you include.

**Organization ID**: `520` (RMLL)

---

## Authentication

Every request requires an `ApiKey` header. The key is not hardcoded — it's retrieved at runtime from a Supabase edge function:

```
GET https://{supabase-project}.supabase.co/functions/v1/make-server-9a1ba23f/config/sportzsoft-key
```

The edge function checks (in order):
1. Supabase database (`db.getSportzSoftApiKey()`)
2. Environment variable `SPORTZSOFT_API_KEY`
3. Fallback `SUPABASE_SPORTZSOFT_API_KEY`

The key is cached in-memory on the frontend (`window.__SPORTZSOFT_API_KEY__`) so subsequent requests don't re-fetch it. A shared promise pattern ensures only one key fetch happens even if multiple API calls start simultaneously.

### Required Headers

| Header | Value | Example |
|--------|-------|---------|
| `Content-Type` | `application/json` | — |
| `ApiKey` | The SportzSoft API key | (retrieved at runtime) |
| `TZO` | Timezone offset in minutes | `-420` (MST) |
| `LocalTime` | ISO 8601 timestamp | `2026-04-17T10:30:00.000Z` |

### Admin: Key Management

**Update the key** (requires auth):
```
PUT https://{supabase-project}.supabase.co/functions/v1/make-server-9a1ba23f/cms/settings/sportzsoft-key
Body: { "apiKey": "new-key-here" }
```

**Test a key** (direct call, no Supabase):
```
GET https://www.sportzsoft.com/ssRest/TeamRest.dll/getSeasons?OrgID=520
Headers: { ApiKey: "key-to-test" }
```

> **Note**: The test endpoint uses `/getSeasons?OrgID=520` — a different URL pattern than the standard `/Organization/520/Seasons` endpoint. This appears to be a legacy endpoint.

---

## Base URL & Headers

```
https://www.sportzsoft.com/ssRest/TeamRest.dll
```

All endpoints below are relative to this base.

---

## LimiterCode & ChildCodes

These are SportzSoft's filter parameters. They control which data subsets the API includes in the response.

### LimiterCode

A string of single-character codes concatenated together (e.g. `"BIC"` = Basic + Images + Contacts).

| Code | Meaning | Commonly Used With |
|------|---------|--------------------|
| **B** | Basic data — always include | Nearly every endpoint |
| **I** | Images / logos | Teams, Player profiles |
| **C** | Contacts / constraints | Teams, Team constraints |
| **P** | Schedule data | Seasons |
| **S** | Scores (enables `HomeScore`/`VisitorScore` on games) | Schedule |

**Examples**:
- `LimiterCode=B` → basic info only
- `LimiterCode=BI` → basic info + logos
- `LimiterCode=BPS` → basic + schedule + scores

### ChildCodes

A string of single-character codes requesting related child objects.

| Code | Meaning | Returns |
|------|---------|---------|
| **G** | Groups (DivisionGroups) | `DivisionGroups[]` |
| **D** | Divisions | `Divisions[]` |
| **C** | Standing codes / Constraints | `StandingCodes[]` or constraints |
| **S** | Standings | `Standings[]` |
| **T** | Standings + Teams | `Standings[]` with team data |
| **R** | Roster | `Roster[]` |
| **H** | Games played stats / Seasonal teams | `GamesPlayedStats[]` or `SeasonalTeams[]` |
| **P** | Player stats / Protected list | `PlayerStats[]` or `TeamFranchiseRoles[]` |
| **G** | Goalie stats | `GoalieStats[]` |
| **Y** | Penalty stats | `PenaltyStats[]` |
| **L** | Links (social media, websites) | `TeamLinks[]` |
| **B** | Bench personnel (TeamRoles) | `TeamRoles[]` |
| **E** | Events | `Events[]` (experimental) |
| **O** | Officials | `GameOfficials[]` |
| **T** | Timeouts | `GameTimeOuts[]` |

> **Code collision**: `G` means "Groups" in some endpoints and "Goalie stats" in others. Context determines the meaning.

**Examples**:
- `ChildCodes=GDC` → Groups + Divisions + StandingCodes (used with Seasons)
- `ChildCodes=SGPROT` → Scoring + Goalie + Penalty + Roster + Officials + Timeouts (used with Game details)
- `ChildCodes=HSYPG` → GamesPlayed + PlayerStats + Penalty + PlayerStats(?) + Goalie (used with Player profiles)

---

## Endpoints

### 1. Organization Seasons

```
GET /Organization/{organizationId}/Seasons
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `LimiterCode` | `BP` | Basic + Schedule |
| `ChildCodes` | `GDC` | Groups + Divisions + StandingCodes |
| `IncludeInActive` | `true` | Include past/inactive seasons |

**Response**:
```json
{
  "Success": true,
  "Response": {
    "Season": { ... },    // single season (when only one)
    "Seasons": [ ... ]    // OR array of seasons
  }
}
```

> **Inconsistency**: The response may use `Season` (singular object) or `Seasons` (array). You must check both.

---

### 2. Season Schedule

```
GET /Season/{seasonId}/Schedule
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `LimiterCode` | `BPS` | Basic + Schedule + Scores |
| `Start` | — | Start date (YYYY-MM-DD) |
| `End` | — | End date (YYYY-MM-DD) |
| `Practices` | — | `true`/`false` |
| `Games` | — | `true`/`false` |
| `Constraints` | — | `true`/`false` |

**Response**:
```json
{
  "Success": true,
  "Response": {
    "Schedule": {
      "Games": [ ... ],
      "Practices": [ ... ]
    }
  }
}
```

> Including `S` in `LimiterCode` populates `HomeScore` and `VisitorScore` on game objects.

---

### 3. Season Teams

```
GET /Season/{seasonId}/Team
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `LimiterCode` | `BI` | Basic + Images |
| `ChildCodes` | — | Optional, e.g. `CLB` for Contacts + Links + TeamRoles |

**Response**:
```json
{
  "Success": true,
  "Response": {
    "Teams": [
      {
        "TeamId": 153672,
        "TeamName": "Okotoks Erratic",
        "DivisionName": "Senior C",
        "DivisionId": 81999,
        "PrimaryTeamLogoURL": "https://...",
        "SubDivision": "North",
        "HomeFacilityName": "Okotoks Arena",
        ...
      }
    ]
  }
}
```

---

### 4. Standings

Two URL patterns — use whichever works for your case.

#### Division-level (preferred)

```
GET /SportsDivision/{divisionId}?LimiterCode=BS&ChildCodes=S
```

#### Season-level (fallback)

```
GET /Season/{seasonId}?LimiterCode=B&ChildCodes=TS&StandingsCode=regu
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `LimiterCode` | `B` (season) / `BS` (division) | — |
| `ChildCodes` | `TS` (season) / `S` (division) | — |
| `StandingsCode` | `regu` | `regu`=Regular, `plyo`=Playoff, `prov`=Provincial |

**Response**:
```json
{
  "Success": true,
  "Response": {
    "Standings": [ ... ]
  }
}
```

> **Inconsistency**: The division-level endpoint may NOT wrap the response in `{ Success, Response }`. If `Success` is undefined, treat the entire response body as the data.

---

### 5. Game Details (with Stats)

```
GET /Game/{gameId}
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `LimiterCode` | `B` | Basic |
| `ChildCodes` | `SGPROT` | Scoring + Goalie + Penalty + Roster + Officials + Timeouts |

**Response**:
```json
{
  "Success": true,
  "Response": {
    "Game": {
      "GameId": 12345,
      "ScoringStats": [ ... ],
      "GoalieStats": [ ... ],
      "PenaltyStats": [ ... ],
      "Roster": [ ... ],
      "GameOfficials": [ ... ],
      "GameTimeOuts": [ ... ]
    }
  }
}
```

> **Inconsistencies**:
> - Roster may be `Roster` or `RosterView`
> - Officials may be `GameOfficials` or `Officials`
> - Timeouts may be `GameTimeOuts` or `TimeOuts`
> - Stats may be nested under `Response.Game.*` or at `Response.*` (top level)

> **Goalie stats are per-period**: Each goalie gets one entry per period. To get totals, aggregate across periods (sum `ShotsStopped` and `TotalShots`).

---

### 6. Team Schedule

```
GET /Team/{teamId}/Schedule
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `Games` | — | `true`/`false` |
| `Practices` | — | `true`/`false` |
| `LimiterCode` | `B` | Basic |
| `ChildCodes` | `RB` | Roster + TeamRoles |
| `Start` | — | Optional, YYYY-MM-DD |
| `End` | — | Optional, YYYY-MM-DD |

**Response**: Same shape as Season Schedule — `Response.Schedule.Games[]` and `Response.Schedule.Practices[]`.

---

### 7. Team Roster & Details

```
GET /Team/{teamId}
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `LimiterCode` | `B` | Basic |
| `ChildCodes` | `HSRBPG` | GamesPlayed + Schedule + Roster + TeamRoles + PlayerStats + GoalieStats |

**Response**:
```json
{
  "Success": true,
  "Response": {
    "Team": {
      "TeamId": 153672,
      "TeamName": "Okotoks Erratic",
      "Roster": [ ... ],
      "SeasonalTeams": [ ... ],
      "TeamRoles": [ ... ],
      "PlayerStats": [ ... ],
      "GoalieStats": [ ... ]
    }
  }
}
```

> **Note**: The `G` child code on the Player endpoint returns basic goalie fields (GP, G, A, PTS, PIM) but NOT saves, GA, minutes, GAA, SV%. Those must come from the `/PlayerStats` endpoint.

---

### 8. Team Raw (No Filters)

```
GET /Team/{teamId}
```

No `LimiterCode`, no `ChildCodes`. Returns ALL available fields, including social media links (`FaceBookAccount`, `TwitterAccount`, etc.) that are omitted by filtered requests.

> This endpoint is not cached — every call hits the SportzSoft API. Use sparingly.

---

### 9. Player Stats (Bulk)

```
GET /PlayerStats
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `LimiterCode` | `B` | Basic |
| `SeasonId` | — | Filter by season |
| `DivisionId` | — | Filter by division |
| `DivisionGroupId` | — | Filter by division group |
| `TeamId` | — | Filter by team |
| `StandingCode` | — | `regu`, `plyo`, `prov`, etc. |
| `PlayersOnly` | — | `1` = skaters only |
| `GoaliesOnly` | — | `1` = goalies only |

**Response**: Highly inconsistent. The data may be under any of:
- `Response.PlayerSeasonStats`
- `Response.PlayerStats`
- `Response.GoalieSeasonStats`
- `Response.GoalieStats`
- `Response.Players`
- `Response.Goalies`
- Or a raw array at the top level

You must check all possible keys.

---

### 10. Player Profile

```
GET /Player/{playerId}?LimiterCode=BI&ChildCodes=HSYPG
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `LimiterCode` | `BI` | Basic + Images |
| `ChildCodes` | `HSYPG` | GamesPlayed + PlayerStats + Penalty + PlayerStats(?) + Goalie |
| `StatsFilterSeasonId` | — | Filter stats to a specific season |

**Response**: `Response.Player` with nested arrays. Field names for nested arrays also vary:
- Stats: `PlayerStats`, `Stats`, or `SeasonStats`
- Games played: `GamesPlayedStats` or `PlayerGamesPlayedStats`
- Penalties: `PenaltyStats` or `PlayerPenaltyStats`
- Scoring: `ScoringStats`

---

### 11. Franchise Transactions

```
GET /TeamFranchiseTransaction
```

| Parameter | Description |
|-----------|-------------|
| `DivisionId` | Filter by division |
| `TeamId` | Filter by team |
| `FranchiseId` | Filter by franchise |
| `Type` | `T`=Trade, `P`=Protected, `R`=Release, `D`=Draft, `W`=Waiver, `S`=Suspension |
| `FromDate` | yyyymmdd format |
| `ToDate` | yyyymmdd format |

**Response**:
```json
{
  "Success": true,
  "Response": {
    "FranchiseTransactions": [
      {
        "FranchiseTransactionId": 123,
        "TrasactionTypeName": "Trade",
        ...
      }
    ]
  }
}
```

> **API typo**: The field is `TrasactionTypeName` (missing the 'n' in "Transaction"). This is a SportzSoft bug — your code must check both `TrasactionTypeName` and `TransactionTypeName`.

---

### 12. Franchise Details & Protected List

Two-step process:

**Step 1** — Get the team's `TeamFranchiseId`:
```
GET /Team/{teamId}?LimiterCode={code}
```

**Step 2** — Get franchise details with protected list:
```
GET /TeamFranchise/{franchiseId}?LimiterCode=C&ChildCodes=P
```

**Response**:
```json
{
  "Success": true,
  "Response": {
    "TeamFranchise": {
      "TeamFranchiseId": 456,
      "TeamFranchiseRoles": [
        {
          "FranchiseRoleCd": "PROT",
          "Name": "John Smith",
          ...
        }
      ]
    }
  }
}
```

> **Inconsistency**: Protected list entries may not include an `IsActive` field. Treat `IsActive === undefined` as active.

---

### 13. Division Draft

```
GET /DivisionDraft
```

| Parameter | Description |
|-----------|-------------|
| `FranchiseId` | Filter by franchise |
| `TeamId` | Filter by team |
| `DivisionId` | Filter by division |
| `DivisionGroupId` | Filter by division group |
| `SeasonId` | Filter by season |

**Response**: Flexible — may be flat draft entries or nested draft containers.

> **Quirk**: The response includes a field named `"Trade Date"` (with a literal space in the key name), not `TradeDate`.

---

### 14. Team Events (Experimental)

The correct SportzSoft events endpoint is unknown. The code tries four patterns:

1. `/Team/{teamId}?LimiterCode={code}&ChildCodes=E`
2. `/Team/{teamId}/Event?LimiterCode={code}`
3. `/Team/{teamId}/Schedule?Games=false&Practices=false&LimiterCode={code}&ChildCodes=E`
4. `/TeamEvent?TeamId={teamId}&LimiterCode={code}`

All four are called and results collected. This is exploratory — not for production use.

---

### 15. Division Schedule Status

```
GET /SportsDivision/{divisionId}?LimiterCode=BS
```

**Response**: Boolean fields (`GameScheduleReady`, `GameScheduleFinal`) that may come in many forms:
- `true`, `false` (boolean)
- `"true"`, `"false"` (string)
- `"True"`, `"False"` (capitalized string)
- `1`, `0` (number)
- `"1"`, `"0"` (string number)
- `"Y"`, `"Yes"` (affinitive strings)

Your code must robustly parse all variants.

---

### 16. Team Schedule Constraints

```
GET /Team/{teamId}?LimiterCode={code}&ChildCodes=C
```

**Response**: `SportzSoftResponse<any>` — shape varies by division.

---

### 17. Facilities

```
GET /Facilities/{organizationId}
```

**Response**: The facilities array may be under `Data`, `Facilities`, `Result`, or any array-valued key.

---

## Caching

The RMLL app implements a centralized in-memory cache with these features:

- **TTL per entry** — each cache entry has its own expiration
- **In-flight deduplication** — if the same URL is requested while a fetch is in progress, the second caller shares the same promise (no duplicate requests)
- **Only successful responses are cached** — `Success: false` responses are not stored

### Default TTLs

| Data Type | TTL |
|-----------|-----|
| Most endpoints | 5 minutes |
| Seasons | 30 seconds |
| Division schedule status | 2 minutes |
| Team constraints | 10 minutes |
| Facilities | 30 minutes |

### Additional Cache Layers

| Hook | Cache | TTL |
|------|-------|-----|
| `useCurrentTeamsData` | localStorage (`rmll_current_teams_cache_v6`) | 5 min |
| `useLeagueStats` | In-module `Map` | 5 min |

---

## Response Wrapper

Most endpoints wrap responses in a standard structure:

```json
{
  "Success": true,
  "Response": { ... }
}
```

**But not always.** The division-level standings endpoint may return data directly without the wrapper. If `Success` is `undefined`, treat the entire response as the data.

Failed requests return:
```json
{
  "Success": false,
  "Response": "Error message here"
}
```

---

## Inconsistencies & Quirks

### Critical (will break your code if unhandled)

| # | Issue | Affected Endpoints | Workaround |
|---|-------|--------------------|------------|
| 1 | **`Season` vs `Seasons`** | `/Seasons` | Check both `Response.Season` and `Response.Seasons` |
| 2 | **Missing response wrapper** | `/SportsDivision` (standings) | If `Success === undefined`, treat entire body as data |
| 3 | **Nested vs top-level stats** | `/Game/{id}` | Stats may be under `Response.Game.*` or `Response.*` |
| 4 | **Player stats response keys** | `/PlayerStats` | Check 7+ possible key names (see endpoint docs) |
| 5 | **API typo `TrasactionTypeName`** | `/TeamFranchiseTransaction` | Check both `TrasactionTypeName` and `TransactionTypeName` |
| 6 | **`"Trade Date"` with space** | `/DivisionDraft` | Access with bracket notation: `obj["Trade Date"]` |

### Moderate (annoying but predictable)

| # | Issue | Details |
|---|-------|---------|
| 7 | **Roster field name varies** | `Roster` or `RosterView` |
| 8 | **Officials field name varies** | `GameOfficials` or `Officials` |
| 9 | **Timeouts field name varies** | `GameTimeOuts` or `TimeOuts` |
| 10 | **Player ID vs Person ID** | The `Player` endpoint uses `PlayerId`; game stats use `PersonId`. Different IDs for the same person. |
| 11 | **Goalie stats are per-period** | Must aggregate across period entries to get game totals |
| 12 | **Protected list `IsActive` missing** | `IsActive === undefined` means active |
| 13 | **Boolean field variants** | `true`, `"true"`, `"True"`, `1`, `"1"`, `"Y"`, `"Yes"` are all valid truthy values |
| 14 | **StandingCategoryCode variations** | 25+ variants: `regu`, `REG`, `plyo`, `PLAYOFFS`, `prov`, `PROSS`, `(PROVINCIAL)`, etc. |

### Minor (worth knowing)

| # | Issue | Details |
|---|-------|---------|
| 15 | **`fetchTeamRaw` bypasses cache** | Always hits the live API — use sparingly |
| 16 | **LimiterCode double-append** | `fetchPlayerCareerStats` appends `I` to limiterCode. Passing `"BI"` becomes `"BII"`. |
| 17 | **Legacy endpoint exists** | `/getSeasons?OrgID=520` works alongside `/Organization/520/Seasons` |
| 18 | **Goalie child code missing real goalie stats** | The `G` child code on Player endpoint returns only basic fields, not saves/GA/GAA/SV% |
| 19 | **Game status code overlap** | Codes 114–115 both mean "In Progress"; 116–117 both "Completed"; 118–120 both "Final" |

---

## Confirmed vs. Speculative Field Names

The RMLL codebase was partly generated by Figma Make's AI, which used a "shotgun approach" — trying every plausible field name variant to discover API shapes at runtime. Many of these variants are **speculative guesses that the API never actually returns**. This section separates what's confirmed from what's likely AI-generated noise.

### How to Read This

- **Confirmed** — Seen in real API responses, verified by explicit "API uses X" code comments, or the only field name used in direct access patterns (no fallback chain).
- **Speculative** — Appears deep in `resolveStr`/`resolveNum`/`deepResolveStr` fallback chains with no corroborating evidence. Likely AI-generated.

---

### Player Stats Fields

| Concept | Confirmed API Field | Speculative Variants in Codebase |
|---------|--------------------|---------------------------------|
| Games Played | `GamesPlayed` | `GP`, `Games`, `GamesPlayedCount` |
| Goals | `Goals` | `G`, `Goal`, `GoalsTotal` |
| Assists | `Assists` | `A`, `Assist`, `AssistsTotal` |
| Points | `Points` | `PTS`, `Pts`, `PointTotal` |
| PIM | `PenaltyMin` | `PenaltyMinutes`, `PIM`, `Min`, `PIMTotal`, `Penalties`, `TM_PIM`, `PenMin` |
| Plus/Minus | `PlusMinus` | `Plus_Minus`, `PLMI`, `PM` |
| Game Winning Goals | `GameWinningGoals` | `GWG`, `GameWinning` |
| Power Play Goals | `PPGoals` | `PowerPlayGoals`, `PPG`, `PP` |
| Short Handed Goals | `SHGoals` | `ShortHandedGoals`, `SHG`, `SH` |
| Overtime Goals | `OTGoals` | `OvertimeGoals`, `OTG` |
| Shots | `Shots` | `SOG`, `ShotsOnGoal` |
| Jersey Number | `PlayerNo` | `JerseyNumber`, `No`, `Jersey`, `Number`, `Num`, `JerseyNo` |
| Position | `SportPositionName` | `Position`, `PositionName`, `Pos` |

### Goalie Stats Fields (varies by endpoint)

| Concept | PlayerStats Bulk Endpoint | Game Detail Per-Period |
|---------|--------------------------|----------------------|
| Saves | `SaversTotal` | `ShotsStopped` |
| Shots Against | `ShotsTotal` | `TotalShots` |
| Goals Against | `GoalsAgainst` | (same) |
| GAA | `GoalsAgainstAverage` / `GAA` | (computed) |
| Save Percentage | `SavePercentage` | (computed) |
| Minutes Played | `MinutesPlayed` | `MinutesPlayed` |

| Concept | Speculative Variants |
|---------|---------------------|
| Saves | `SV`, `Svs`, `SVS`, `SavesMade`, `TotalSaves`, `SavesTotal`, `Saves` |
| Shots Against | `ShotsAgainst`, `SA`, `ShotAgainst`, `ShotsReceived` |
| Save Percentage | `SavePct`, `SvPct`, `SVPct`, `SV_PCT`, `Svpct`, `SavePctg`, `SVPCT`, `SavePercent`, `Sv_Pct` |
| Minutes Played | `Min`, `Minutes`, `Mins`, `MP`, `TOI`, `TimeOnIce`, `TotalMinutes`, `TimePlayed` |
| Goals Against | `GA`, `GATotal` |
| Games Dressed | `GD`, `Dressed` (after confirmed `GamesDressed`) |

### Penalty Stats Fields (Game Detail)

| Concept | Confirmed | Speculative |
|---------|-----------|-------------|
| Penalty Name | `PenaltyName` | `OffenseName`, `Offense`, `Penalty`, `PenaltyType`, `PenaltyDescription`, `InfractionName`, `Infraction`, `OffenseDescription`, `PenaltyCode`, `OffenseCode`, `Description` |
| Penalty Minutes | `PenaltyMin` | (same PIM variants as above) |
| Team ID | `PenaltyTeamId` | `TeamId` (confirmed to be WRONG — the API uses `PenaltyTeamId`, not `TeamId`) |
| Time In | `TimeIn` | `TimeOff`, `Time`, `Start`, `StartTime`, `PenaltyTime`, `InfractionTime`, etc. |
| Time Out | `TimeOut` | `TimeOn`, `End`, `EndTime`, `TimeServed`, `ReleaseTime`, etc. |

### Contact & Social Fields (Team Raw Endpoint)

The raw Team endpoint (no LimiterCode) returns social fields. Confirmed names use non-standard capitalization.

| Concept | Confirmed | Speculative |
|---------|-----------|-------------|
| Facebook | `FaceBookAccount` | `FacebookAccount`, `FacebookUrl`, `FacebookURL`, `Facebook`, `FacebookPage`, `FacebookLink`, `SocialFacebook` |
| Twitter/X | `TwitterAccount` | `TwitterUrl`, `TwitterURL`, `Twitter`, `TwitterHandle`, `TwitterLink`, `XUrl`, `XURL`, `SocialTwitter`, `SocialX` |
| Instagram | `InstagramAccount` | `InstagramUrl`, `InstagramURL`, `Instagram`, `InstagramHandle`, `InstagramLink`, `SocialInstagram` |
| YouTube | `YouTubeUrl` / `YoutubeUrl` | `YouTubeURL`, `YoutubeURL`, `YouTube`, `Youtube`, `YouTubeChannel`, `SocialYouTube` |
| TikTok | (none confirmed) | `TikTokUrl`, `TiktokUrl`, `TikTokURL`, `TikTok`, `Tiktok`, `TikTokLink`, `SocialTikTok` |
| Website | `WebSite` (capital S) | `WebsiteUrl`, `TeamWebsiteUrl`, `Website`, `TeamUrl`, `TeamWebsite`, `Url`, `WebsiteURL`, `WebAddress`, `HomePage`, `HomePageUrl` |
| Home Sweater Color | `HomeSweaterColor` | `TeamColor1`, `TeamColour1`, `HomeColor`, `HomeColour1`, `PrimaryColor` |
| Away Sweater Color | `AwaySweaterColor` | `TeamColor2`, `TeamColour2`, `AwayColor`, `AwayColour1`, `SecondaryColor` |
| Home Facility | `HomeFacilityName` | `HomeFacility1Name`, `HomeFacility2Name`, `HomeFacility`, `HomeArena`, `HomeVenue` |

### Team/Player Identity Fields

| Concept | Confirmed | Speculative |
|---------|-----------|-------------|
| Player ID | `PlayerId` (registration-level) | `Id`, `MemberId`, `MemberPlayerId` |
| Person ID | `PersonId` (person-level, used in Game API) | — |
| Team Name | `TeamName` / `TeamShortName` / `FullTeamName` | — |
| Standing Code | `StandingCategoryCode` | `StandingCode`, `CategoryCode` |

### Roster Entry Fields (Game Detail)

| Concept | Confirmed | Notes |
|---------|-----------|-------|
| Player ID | `PlayerId` | — |
| Person ID | `PersonId` | — |
| Team Player ID | `TeamPlayerId` | — |
| Jersey Number | `JerseyNumber` / `PlayerNumber` | Both used |
| Serving Suspension | `ServingSuspension` | — |
| Suspension Note | `SuspensionNote` | — |

### Nested Container Searches (Highly Speculative)

The `deepResolveStr` function in `TeamsPageV1.tsx` searches through 15+ nested container names for contact data. **None of these are confirmed to exist** — they were AI-generated guesses:

```
TeamContacts, Contacts, Contact, ContactInfo, TeamContact,
TeamLinks, Links, Link, TeamLink, SocialMedia, Social,
TeamInfo, Info, Details, TeamDetails, TeamData,
TeamWebLinks, WebLinks, ExternalLinks
```

The `findLinkByType` function searches 9 array containers for typed link objects. **Also unconfirmed**:

```
TeamLinks, Links, Link, WebLinks, TeamWebLinks, ExternalLinks,
SocialMediaLinks, SocialLinks, TeamContacts, Contacts
```

### Standings Fields

| Concept | Confirmed | Speculative |
|---------|-----------|-------------|
| Games Won | `GamesWon` / `Wins` / `W` | `MatchesWon` |
| Games Lost | `GamesLost` / `Losses` / `L` | `MatchesLost` |
| Games Tied | `GamesTied` / `Ties` / `T` | `MatchesTied` |
| Goals For | `GoalsFor` / `GF` | — |
| Goals Against | `GoalsAgainst` / `GA` | — |
| Overtime Losses | `OvertimeLosses` / `OTL` | `OTLosses` |
| Games Defaulted | `GamesDefaulted` / `Defaults` / `Def` | — |
| Points | `Points` / `Pts` | — |
| Goal Differential | (none confirmed) | `GoalDifference`, `GoalsDifference`, `GoalDifferential`, `Diff` |
| PIM | (unconfirmed — codebase logs at runtime to discover) | `PenaltyMins`, `PenaltyMinutes`, `Penalties`, `PIM` |

### Franchise Certificate Fields

The `FranchiseCertificate` component tries many variants for financial fields. **All are speculative** — none confirmed:

| Concept | Variants Tried |
|---------|----------------|
| Cheque Payable To | `ChequePayableTo`, `PayableTo`, `ChequesPayable`, `ChequePayable`, `PayableToName`, `ChqPayableTo` |
| E-Transfer Email | `EtransferEmail`, `EFTEMailAddress`, `EFTEmailAddress`, `EftEmail`, `EFTEmail`, `EFT_Email`, `EftEMailAddress`, `EFTEMail` |
| Member Since | `MemberSinceYear`, `MemberSince`, `RMLLMemberSince`, `MemberYear` |

### TypeScript Interface vs. Raw API Names

The `PlayerSeasonStats` interface in `types.ts` uses **normalized** field names that differ from the actual API:

| Interface Field | Actual API Field | Notes |
|----------------|-----------------|-------|
| `PenaltyMinutes` | `PenaltyMin` | Interface uses full word; API truncates |
| `PowerPlayGoals` | `PPGoals` | Interface uses long form; API uses abbreviation |
| `ShortHandedGoals` | `SHGoals` | Interface uses long form; API uses abbreviation |
| `JerseyNumber` | `PlayerNo` | Interface uses conventional name; API uses different term |
| `Position` | `SportPositionName` | Interface uses generic name; API uses specific |

This mismatch means the resolver functions must exist to bridge `types.ts` names to API names — but most of the extra variants beyond the confirmed fields are unnecessary.

---

## Game Status Codes

The API uses numeric status codes on game objects.

| Code | Meaning | Notes |
|------|---------|-------|
| 100 | Not Played | Default for future games |
| 101 | Scheduled | Game is scheduled |
| 102 | Pre-Game | Warmup / pre-game |
| 103 | Period 1 | — |
| 104 | Period 1 Intermission | — |
| 105 | Period 2 | — |
| 106 | Period 2 Intermission | — |
| 107 | Period 3 | — |
| 108 | Overtime | — |
| 109 | Shootout | — |
| 110 | Final | Regulation final |
| 111 | Final (OT) | Overtime final |
| 112 | Final (SO) | Shootout final |
| 113 | Suspended | Game suspended |
| 114 | In Progress | — |
| 115 | In Progress | Duplicate of 114 |
| 116 | Completed | — |
| 117 | Completed | Duplicate of 116 |
| 118 | Final | Duplicate of 110 |
| 119 | Forfeit | — |
| 120 | Final | Duplicate of 110/118 |

> Codes 114–115, 116–117, and 118–120 overlap, suggesting deprecated or duplicate codes added over time.

---

## Standing Category Codes

The API returns standing category codes in many formats. Here are the known variants:

| Standard Code | API Variants | Meaning |
|---------------|-------------|---------|
| `regu` | `regu`, `REG`, `Regu`, `REGU`, `Regular`, `REGULAR` | Regular Season |
| `plyo` | `plyo`, `PLYO`, `Plyo`, `PLAYOFFS`, `Playoffs`, `Playoff`, `PO` | Playoffs |
| `prov` | `prov`, `PROV`, `Prov`, `PROSS`, `(PROVINCIAL)`, `Provincial` | Provincial |
| `exhb` | `exhb`, `EXHB`, `Exhibition`, `EXHIBITION` | Exhibition |
| `tourn` | `tourn`, `TOURN`, `Tournament` | Tournament |

---

## Division Mapping

RMLL division names map to SportzSoft division IDs. These are not static — they can change between seasons. The app loads them dynamically:

| RMLL Division Name | Typical Division ID |
|---------------------|---------------------|
| Senior A | 81991 |
| Senior B | 81992 |
| Senior C | 81999 |
| Junior A | 81993 |
| Junior B Tier I | 81994 |
| Junior B Tier II | 81995 |
| Junior B Tier III | 81996 |
| Alberta Major Female | 81997 |
| Alberta Major Senior Female | 81998 |

> These IDs come from the `DivisionGroups` in the Season response and are stored in `DivisionContext`.

---

## Image URLs

Player photos and team logos use a separate image server:

```
https://www.sportzsoft.com/admin/webAdmin.dll/GetImageDoc?DocId={docId}
```

The `DocId` comes from fields like:
- `PrimaryTeamLogoURL` (teams) — may be a full URL or just a DocId
- `PhotoDocId` or `PersonPhotoDocId` (players)

Team logos may also be provided as full URLs via the `PrimaryTeamLogoURL` field on the Team object. The code checks whether the value is already a full URL before prepending the image server base.

---

## Quick Reference: All Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/Organization/{id}/Seasons` | List seasons |
| GET | `/Season/{id}/Schedule` | Games & practices |
| GET | `/Season/{id}/Team` | Teams in season |
| GET | `/Season/{id}` | Standings (season-level) |
| GET | `/SportsDivision/{id}` | Standings (division-level) / Schedule status |
| GET | `/Game/{id}` | Game details with stats |
| GET | `/Team/{id}` | Team details, roster, stats |
| GET | `/Team/{id}/Schedule` | Team-specific schedule |
| GET | `/Player/{id}` | Player profile with career stats |
| GET | `/PlayerStats` | Bulk player/goalie stats |
| GET | `/TeamFranchiseTransaction` | Trades, signings, releases |
| GET | `/TeamFranchise/{id}` | Franchise details, protected list |
| GET | `/DivisionDraft` | Draft picks and entries |
| GET | `/Facilities/{id}` | Organization facilities |
| GET | `/getSeasons?OrgID={id}` | Legacy seasons endpoint |