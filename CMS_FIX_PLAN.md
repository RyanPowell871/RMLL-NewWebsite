# CMS Division Manager Fix Plan

## Problem Statement
The CMS Division Editor is showing incorrect data for divisions, particularly Alberta Major Female. The data currently displaying on the website is the source of truth and must be preserved.

## Current System Architecture

### Data Flow
```
KV Store (division:{name})
    ↓ GET (with default injection)
Backend (content_routes.ts)
    ↓
Frontend (DivisionInfoPage.tsx) ← Display on website

CMS (DivisionManager.tsx)
    ↓ PUT
KV Store (division:{name})
```

### Key Issue
- The KV store may contain old/inconsistent data
- The GET endpoint injects defaults when fields are empty
- The PUT endpoint merges with existing KV data (doesn't delete missing fields)

## Divisions to Fix

| Division | Default Data Injection | Current Status |
|----------|----------------------|----------------|
| Senior B | Awards & Championships (FORCED) | Likely OK |
| Senior C | None (description only) | Unknown |
| Junior A | Description only | Unknown |
| Junior B Tier I | Description only | Unknown |
| Junior B Tier II | Awards & Championships (if missing) | Unknown |
| Junior B Tier III | Description only (inactive) | Unknown |
| Alberta Major Senior Female | Description only | Unknown |
| Alberta Major Female | Championships (if missing) | **PROBLEMATIC** |

## Proposed Fix Approach

### Phase 1: Data Audit & Validation
1. For each division, capture what's currently displayed on the website
2. Compare with what the CMS shows
3. Document discrepancies

### Phase 2: Backend Cleanup
1. Ensure all default data is complete for each division
2. Add a "force refresh" endpoint that can reset division data to defaults
3. Add validation for JSON fields (awards, championships, seasonInfo)

### Phase 3: CMS Improvements
1. Fix the PUT endpoint to properly handle field deletions
2. Add better JSON validation in the editor
3. Show warnings when saving invalid JSON
4. Add a "Reset to Defaults" button for each division

### Phase 4: Data Migration
1. For divisions with incorrect KV data, reset to defaults
2. Apply any custom content from the live site back to the CMS

## Questions for User Before Proceeding

1. **Which specific divisions are showing incorrect data in the CMS?**
2. **For Alberta Major Female specifically, what data IS showing correctly on the website?**
3. **Are there any divisions where the CMS data should be different from defaults (i.e., custom content that must be preserved)?**

## Implementation Order

1. First, fix the Alberta Major Female issue (the reported problem)
2. Then, audit each remaining division
3. Finally, implement system-wide improvements to prevent future issues