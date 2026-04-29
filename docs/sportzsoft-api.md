# SportzSoft API Documentation (RMLL)

> RMLL-specific documentation for the SportzSoft TeamRest API. Cross-referenced with official SportzSoft source documentation (`dm_TeamRest_API.md`).

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Base URL & URL Structure](#base-url--url-structure)
4. [LimiterCode & ChildCodes](#limitercode--childcodes)
5. [Response Wrapper](#response-wrapper)
6. [Endpoints](#endpoints)
7. [Caching](#caching)
8. [Inconsistencies & Quirks](#inconsistencies--quirks)
9. [Confirmed Field Names](#confirmed-field-names)
10. [Game Status Codes](#game-status-codes)
11. [Standing Category Codes](#standing-category-codes)
12. [Division Mapping](#division-mapping)
13. [Image URLs](#image-urls)

---

## Overview

SportzSoft is a Delphi-based REST service (`TsrsRestServer` in `dm_TeamRest.pas`) that serves as the back-end for the SportzSoft Member Portal, League/Club Portal, registration flows, and administrative operations. RMLL (Org ID `520`) uses it for scheduling, standings, rosters, drafts, and more.

The API follows loose conventions — responses vary in structure, field names are inconsistent across endpoints, and some endpoints behave differently depending on which query parameters you include.

**Organization ID**: `520` (RMLL)

---

## Authentication

### How RMLL uses the API

RMLL's public website uses the **API key** authentication mode. The `ApiKey` header bypasses session requirements — the server sets `FNoSessionOp = true` and uses a pseudo-session (`12345`). This limits RMLL to the `IsValidEntry` allow-list of endpoints.

The API key is retrieved at runtime from a Supabase edge function:

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

### Other authentication modes (not used by RMLL)

The API supports 6 credential modes. RMLL only uses `apiKey`. The others exist for the Member Portal and admin tools:

| Mode | Header / Query | Notes |
|------|----------------|-------|
| Session | `SessionId` HTTP header | Primary for logged-in users. Created by `POST /Login/{orgId}` or `GET /StartSession`. |
| API key | `apiKey` header | **Used by RMLL.** Validates caller domain. Sets `FNoSessionOp = true`. |
| Back-door refresh | `BackDoorPW: 84np` | Force-refreshes session. Admin only. |
| Stripe webhook | `Stripe-Signature` | HMAC-SHA256 checked against webhook secrets. |
| Magic sessions | `7Uec42tn3` / `7Uec42tn2` | Auto-creates or limited-access sessions. |
| Query-string | `?SessionId=...` or `?pw=7Uec42tn2` | Fallback when no header supplied. |

### Endpoints available with API key (`IsValidEntry` allow-list)

`/organization` (certain queries), `/widget`, `/facilities`, `/startsession`, `/topscoringleaders`, `/uploadtournamentdoc`, `/uploadeventdoc`, `/gridlayout`, `/meetsinfo`, `/preparevideoaccess`, `/lookupdataset`, `/registrations`, `/exchangerate`, `/scorevideo`, `/functionalarea`, `/systemdoc`, `/applicationprospect`, `/product` (GET), `/login`, `/logapperror`, `/emailcheck`, `/member` (POST), `/playerstatscareer`, `/usagregistrations`, `/create-payment-intent`, `/validateloginpassword`, `/validatemeetjudgeaccess`, `/validatejudgepin`.

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

> The test endpoint uses `/getSeasons?OrgID=520` — a legacy URL pattern that predates the standard `/Organization/520/Seasons` endpoint.

---

## Base URL & URL Structure

```
https://www.sportzsoft.com/ssRest/TeamRest.dll
```

All endpoints below are relative to this base.

### URL parsing

The server parses URLs into:
```
/{EndPoint}/{EndPointArg}[/{EndPointArg2}]/{SubEndPoint}[/{SubPointArg}]
```

- **EndPoint** — the primary resource (`Organization`, `Season`, `Team`, `Game`, etc.)
- **EndPointArg** — typically a numeric ID. Values ≥32 characters are treated as AES-encrypted hex IDs and auto-decrypted via `SsDecryptFromHex`.
- **EndPointArg2** — a secondary numeric key (e.g. `/Meet/123/456/levels`)
- **SubEndPoint** — a sub-resource or action (`Seasons`, `Schedule`, `Team`, etc.)
- **SubPointArg** — argument for the sub-endpoint

### Case sensitivity

Varies by handler. Most comparisons use `ToLower` but several routes use `AnsiSameText` or exact-case matching (e.g. `ActiveVideoStreams`, `EncryptID`). Always use the exact casing shown in this documentation.

### Common query-string parameters

| Parameter | Purpose |
|-----------|---------|
| `LimiterCode` | Field-set selector — limits which fields each record returns. Typical values: `B` (basic), `F` (full), `Q` (quick). |
| `ChildCodes` | Single-letter flags instructing handlers to embed child datasets (e.g. `D` = divisions, `P` = player stats, `G` = games). |
| `PrimaryKeyProperties` | Slash-separated field names used to decode composite keys embedded in the URL path. |
| `tzo` | Client-side timezone offset in minutes. |
| `LocalTime` | Client local time for session activity tracking. |

### Date formatting

- Date format: `yyyy-mm-dd` (used in `BindContentFields` with `'ymd'` mode)
- DateTime format: `yyyy-mm-ddThh:nn:ss.zzz`
- Currency fields are serialized as numbers unless added to `SendAsTextFields`

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

A string of single-character codes requesting related child objects. The `JsonProducer.AddDataSet` method inlines these into the parent response.

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
| **E** | Events | `Events[]` |
| **O** | Officials | `GameOfficials[]` |
| **T** | Timeouts | `GameTimeOuts[]` |

> **Code collision**: `G` means "Groups" in some endpoints and "Goalie stats" in others. Context determines the meaning.

**Examples**:
- `ChildCodes=GDC` → Groups + Divisions + StandingCodes (used with Seasons)
- `ChildCodes=SGPROT` → Scoring + Goalie + Penalty + Roster + Officials + Timeouts (used with Game details)
- `ChildCodes=HSYPG` → GamesPlayed + PlayerStats + Penalty + PlayerStats(?) + Goalie (used with Player profiles)

---

## Response Wrapper

`TsrsRestServer.Execute` wraps handler output in a standard envelope unless the handler is flagged `bDirect`:

**Success:**
```json
{
  "Success": true,
  "SessionId": "<current session id>",
  "Response": { /* handler-produced JSON fragment */ }
}
```

**Failure:**
```json
{
  "Success": false,
  "SessionId": "<id>",
  "ErrorCode": "<code>",
  "Error": "<HTML-encoded message>"
}
```

### Direct endpoints (no wrapper)

These endpoints skip the `{ Success, Response }` wrapper and return raw data:
`EmailCheck`, `PeopleSearch`, `MeetsInfo`, `ValidateEmail`, `ValidateMeetJudgeAccess`, `TopScoringLeaders`, `Facilities`, `Facility` (GET), `ExchangeRate`, `SessionValue`, `MerchandiseSystemInfo`, `RegistrationStatsByProduct`, `USAGMeetScores`, `Meet/photogallery`.

### Error codes

| Code | Meaning |
|------|---------|
| `95` | Invalid EndPoint for TeamRest API |
| `96` | Security violation / invalid apiKey |
| `99` | Session has expired |
| `100` | No REST EndPoint defined |
| `102` | Endpoint argument required (PUT/DELETE) |
| `109` | Invalid login / password |
| `800` | No SessionId provided |

### HTTP headers returned

- `Content-Type: application/json; charset=UTF-8`
- `Pragma: no-cache`
- `Cache-Control: no-store, no-cache, must-revalidate`

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
    "Season": { ... },
    "Seasons": [ ... ]
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
        "HomeFacilityName": "Okotoks Arena"
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

> **Inconsistency**: The division-level endpoint may NOT wrap the response in `{ Success, Response }`. If `Success` is undefined, treat the entire response body as the data. This endpoint may also be a "Direct" endpoint that skips the wrapper.

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
        "TrasactionTypeName": "Trade"
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
          "Name": "John Smith"
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

### 14. Team Events

The code tries multiple URL patterns to find team events:

1. `/Team/{teamId}?LimiterCode={code}&ChildCodes=E`
2. `/Team/{teamId}/Event?LimiterCode={code}`
3. `/Team/{teamId}/Schedule?Games=false&Practices=false&LimiterCode={code}&ChildCodes=E`
4. `/TeamEvent?TeamId={teamId}&LimiterCode={code}`

All four are called and results collected.

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

**Response**: The facilities array may be under `Data`, `Facilities`, `Result`, or any array-valued key. This is a **Direct** endpoint — it skips the `{ Success, Response }` wrapper.

---

### 18. Top Scoring Leaders

```
GET /TopScoringLeaders
```

**Direct** endpoint — skips the response wrapper. Available via API key (in `IsValidEntry` allow-list).

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

## Inconsistencies & Quirks

### Critical (will break your code if unhandled)

| # | Issue | Affected Endpoints | Workaround |
|---|-------|--------------------|------------|
| 1 | **`Season` vs `Seasons`** | `/Seasons` | Check both `Response.Season` and `Response.Seasons` |
| 2 | **Missing response wrapper** | `/SportsDivision` (standings), `/Facilities` | Some endpoints are "Direct" and skip the wrapper. If `Success` is undefined, treat entire body as data. |
| 3 | **Nested vs top-level stats** | `/Game/{id}` | Stats may be under `Response.Game.*` or `Response.*` |
| 4 | **Player stats response keys** | `/PlayerStats` | Check 7+ possible key names (see endpoint docs) |
| 5 | **API typo `TrasactionTypeName`** | `/TeamFranchiseTransaction` | Check both `TrasactionTypeName` and `TransactionTypeName` |
| 6 | **`"Trade Date"` with space** | `/DivisionDraft` | Access with bracket notation: `obj["Trade Date"]` |
| 7 | **Encrypted IDs** | Any `EndPointArg` ≥32 chars | Auto-decrypted by the server. Don't try to parse encrypted IDs client-side — just pass them through. |

### Moderate (annoying but predictable)

| # | Issue | Details |
|---|-------|---------|
| 8 | **Roster field name varies** | `Roster` or `RosterView` |
| 9 | **Officials field name varies** | `GameOfficials` or `Officials` |
| 10 | **Timeouts field name varies** | `GameTimeOuts` or `TimeOuts` |
| 11 | **Player ID vs Person ID** | The `Player` endpoint uses `PlayerId`; game stats use `PersonId`. Different IDs for the same person. |
| 12 | **Goalie stats are per-period** | Must aggregate across period entries to get game totals |
| 13 | **Protected list `IsActive` missing** | `IsActive === undefined` means active |
| 14 | **Boolean field variants** | `true`, `"true"`, `"True"`, `1`, `"1"`, `"Y"`, `"Yes"` are all valid truthy values |
| 15 | **StandingCategoryCode variations** | 25+ variants: `regu`, `REG`, `plyo`, `PLAYOFFS`, `prov`, `PROSS`, `(PROVINCIAL)`, etc. |
| 16 | **Case sensitivity varies by endpoint** | Most use case-insensitive matching, but some require exact case (e.g. `ActiveVideoStreams`, `EncryptID`) |

### Minor (worth knowing)

| # | Issue | Details |
|---|-------|---------|
| 17 | **`fetchTeamRaw` bypasses cache** | Always hits the live API — use sparingly |
| 18 | **LimiterCode double-append** | `fetchPlayerCareerStats` appends `I` to limiterCode. Passing `"BI"` becomes `"BII"`. |
| 19 | **Legacy endpoint exists** | `/getSeasons?OrgID=520` works alongside `/Organization/520/Seasons` |
| 20 | **Goalie child code missing real goalie stats** | The `G` child code on Player endpoint returns only basic fields, not saves/GA/GAA/SV% |
| 21 | **Game status code overlap** | Codes 114–115 both mean "In Progress"; 116–117 both "Completed"; 118–120 both "Final" |
| 22 | **API key domain validation** | The server validates the caller domain against the `apiKeys` table. Failures are logged to `apiKeyFailures`. |
| 23 | **API request logging** | When `rAPILogEnabled` is set, every request inserts a `RestAPILog` row capturing session, method, endpoint, query, thread id, and client org. Payment endpoints redact data values. |

---

## Confirmed Field Names

The RMLL codebase was partly generated by Figma Make's AI, which used a "shotgun approach" — trying every plausible field name variant to discover API shapes at runtime. The speculative variants have been removed from the codebase. This section documents the confirmed API field names only.

### Player Stats Fields

| Concept | Confirmed API Field | Notes |
|---------|--------------------|-------|
| Games Played | `GamesPlayed` | — |
| Goals | `Goals` | — |
| Assists | `Assists` | — |
| Points | `Points` | — |
| PIM | `PenaltyMin` | API truncates "Minutes" to "Min" |
| Plus/Minus | `PlusMinus` | — |
| Game Winning Goals | `GameWinningGoals` | — |
| Power Play Goals | `PPGoals` | API uses abbreviation |
| Short Handed Goals | `SHGoals` | API uses abbreviation |
| Shots | `Shots` | — |
| Position | `SportPositionName` | API uses specific name; `Position` also seen |
| Position Code | `PositionCode` | — |

### Goalie Stats Fields (varies by endpoint)

| Concept | PlayerStats Bulk Endpoint | Game Detail Per-Period |
|---------|--------------------------|----------------------|
| Saves | `SaversTotal` / `Saves` | `ShotsStopped` / `Saves` |
| Shots Against | `ShotsTotal` / `ShotsAgainst` | `TotalShots` / `ShotsTotal` / `ShotsAgainst` |
| Goals Against | `GoalsAgainst` | (same) |
| GAA | `GoalsAgainstAverage` / `GAA` | (computed) |
| Save Percentage | `SavePercentage` | (computed) |
| Minutes Played | `MinutesPlayed` / `Min` | `MinutesPlayed` / `Min` |
| Games Dressed | `GamesDressed` / `GD` | — |
| Wins | `Wins` / `W` | — |
| Losses | `Losses` / `L` | — |
| Ties | `Ties` | — |
| Overtime Losses | `OvertimeLosses` | — |
| Shutouts | `Shutouts` | — |

> **Key difference**: The bulk `PlayerStats` endpoint uses `SaversTotal`/`ShotsTotal`, while the per-period `Game` detail endpoint uses `ShotsStopped`/`TotalShots`. Your resolver functions must check both sets.

### Penalty Stats Fields (Game Detail)

| Concept | Confirmed |
|---------|-----------|
| Penalty Name | `PenaltyName` |
| Penalty Minutes | `PenaltyMin` |
| Team ID | `PenaltyTeamId` (NOT `TeamId`) |
| Time In | `TimeIn` |
| Time Out | `TimeOut` |
| Minor/Major | `MinorMajor` |

### Contact & Social Fields (Team Raw Endpoint)

The raw Team endpoint (no LimiterCode) returns social fields. Confirmed names use non-standard capitalization.

| Concept | Confirmed | Notes |
|---------|-----------|-------|
| Facebook | `FaceBookAccount` | Capital B is correct |
| Twitter/X | `TwitterAccount` | — |
| Instagram | `InstagramAccount` | — |
| YouTube | `YouTubeUrl` / `YoutubeUrl` | — |
| TikTok | (none confirmed) | — |
| Website | `WebSite` | Capital S is correct |
| Home Sweater Color | `HomeSweaterColor` / `TeamColor1` | Both used |
| Away Sweater Color | `AwaySweaterColor` / `TeamColor2` | Both used |
| Home Facility | `HomeFacilityName` / `HomeFacility1Name` / `HomeFacility2Name` | All used |
| Contact Name | `ContactName` | — |
| Contact Email | `ContactEmail` | — |
| Contact Phone | `ContactPhone` | — |
| Head Coach | `HeadCoach` | — |
| City | `City` | — |

### Team/Player Identity Fields

| Concept | Confirmed | Notes |
|---------|-----------|-------|
| Player ID | `PlayerId` | Registration-level |
| Person ID | `PersonId` | Person-level, used in Game API |
| Team Player ID | `TeamPlayerId` | — |
| Team ID | `TeamId` | — |
| Home Team ID | `HomeTeamId` | — |
| Visitor Team ID | `VisitorTeamId` | — |
| Game ID | `GameId` | — |
| Season ID | `SeasonId` | — |
| Division ID | `DivisionId` | — |
| Team Name | `TeamName` / `TeamShortName` / `FullTeamName` | Context-dependent |
| Standing Code | `StandingCategoryCode` | — |
| Division Name | `DivisionName` | — |
| Photo Doc ID | `PhotoDocId` | — |

### Roster Entry Fields (Game Detail)

| Concept | Confirmed | Notes |
|---------|-----------|-------|
| Player ID | `PlayerId` | — |
| Person ID | `PersonId` | — |
| Team Player ID | `TeamPlayerId` | — |
| Jersey Number | `JerseyNumber` / `PlayerNumber` | Both used |
| Position | `SportPositionName` | — |
| Serving Suspension | `ServingSuspension` | — |
| Suspension Note | `SuspensionNote` | — |
| Alternate Captain | `IsAlternate` / `IsAssistantCaptain` | Both used |
| Affiliate | `IsAffiliate` / `AffiliateFlag` | Both used |

### Game Detail Fields

| Concept | Confirmed | Notes |
|---------|-----------|-------|
| Game Status | `GameStatus` | String: "Final", "In Progress", "Scheduled", etc. |
| Home Score | `HomeScore` | Populated when `S` in LimiterCode |
| Visitor Score | `VisitorScore` | Populated when `S` in LimiterCode |
| Home Team Name | `HomeTeamName` | — |
| Visitor Team Name | `VisitorTeamName` | — |
| Opposing Team | `OpposingTeam` / `OpponentName` | Both used |
| Is Home | `IsHome` | Boolean |
| Shutout | `Shutout` | Boolean |
| Power Play | `PowerPlay` | Boolean |
| Standing Category | `StandingCategoryCode` | `regu`, `plyo`, `exhb`, etc. |
| Game Score Info | `GameScoreInfo` | Formatted score string |
| Decision | `Decision` | Goalie decision (W/L/T) |

### Player Bio Fields

| Concept | Confirmed | Notes |
|---------|-----------|-------|
| First Name | `FirstName` | — |
| Last Name | `LastName` | — |
| Player Name | `PlayerName` / `Name` | Both used |
| Birth Date | `BirthDate` | — |
| Birth Year | `BirthYear` | — |
| Age | `Age` | — |
| Height | `Height` | — |
| Weight | `Weight` | — |
| Shoots | `Shoots` | — |
| Home City | `HomeCityName` | — |
| Home Province | `HomeProvStateCd` | — |

### Standings Fields

| Concept | Confirmed | Notes |
|---------|-----------|-------|
| Rank | `Rank` / `StandingRank` / `Position` / `R` | From API, not calculated locally |
| Games Won | `GamesWon` / `Wins` / `W` | All used |
| Games Lost | `GamesLost` / `Losses` / `L` | All used |
| Games Tied | `GamesTied` / `Ties` | Both used |
| Goals For | `GoalsFor` / `GF` | Both used |
| Goals Against | `GoalsAgainst` / `GA` | Both used |
| Overtime Losses | `OvertimeLosses` | — |
| Games Defaulted | `GamesDefaulted` / `Defaults` / `Def` | All used |
| Points | `Points` / `Pts` | Both used — no local fallback |
| PIM | `PenaltyMins` / `PIM` | Both used |
| Points Percentage | `PointsPercentage` | — |
| Streak | `StreakInfo` / `Streak` | Both used |
| Goal Differential | `GoalDifferential` / `GoalDiff` / `GD` / computed | API field preferred, fallback to `gf - ga` |

### TypeScript Interface vs. Raw API Names

The `PlayerSeasonStats` interface in `types.ts` uses **normalized** field names that differ from the actual API:

| Interface Field | Actual API Field | Notes |
|----------------|-----------------|-------|
| `PenaltyMinutes` | `PenaltyMin` | Interface uses full word; API truncates |
| `PowerPlayGoals` | `PPGoals` | Interface uses long form; API uses abbreviation |
| `ShortHandedGoals` | `SHGoals` | Interface uses long form; API uses abbreviation |
| `JerseyNumber` | `PlayerNo` | Interface uses conventional name; API uses different term |
| `Position` | `SportPositionName` | Interface uses generic name; API uses specific |

This mismatch means the resolver functions must exist to bridge `types.ts` names to API names.

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

The API returns standing category codes in many formats:

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
- `PhotoDocId` (players)

Team logos may also be provided as full URLs via the `PrimaryTeamLogoURL` field on the Team object. The code checks whether the value is already a full URL before prepending the image server base.

---

## Quick Reference: All RMLL Endpoints

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
| GET | `/PlayerStatsCareer` | Career stats summary |
| GET | `/TeamFranchiseTransaction` | Trades, signings, releases |
| GET | `/TeamFranchise/{id}` | Franchise details, protected list |
| GET | `/DivisionDraft` | Draft picks and entries |
| GET | `/Facilities/{id}` | Organization facilities (Direct) |
| GET | `/TopScoringLeaders` | Scoring leaders (Direct) |
| GET | `/getSeasons?OrgID={id}` | Legacy seasons endpoint |