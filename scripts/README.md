# Scripts

Utility scripts for database management and data import.

## Available Scripts

### `add-test-places.ts`
Adds 12 curated test places to the database for development and testing.

**Usage:**
```bash
npm run add:test-places
```

**What it does:**
- Adds 12 real Trento locations (restaurants, museums, parks, etc.)
- Safe to run multiple times (skips duplicates)
- All places have valid coordinates and data

---

### `import-tripadvisor-places.ts`
Imports places from TripAdvisor API for Trento, Italy.

**Requirements:**
- Valid TripAdvisor API key in `.env.local`
- Supabase service role key in `.env.local`

**Usage:**
```bash
npm run import:tripadvisor
```

**What it does:**
- Fetches POI within 10km of Trento
- Filters out non-POI (schools, medical, etc.)
- Maps TripAdvisor categories to your place types
- Expected import: 300-500 places

---

### `test-tripadvisor-api.ts`
Tests TripAdvisor API connection and validates API key.

**Usage:**
```bash
npm run test:tripadvisor
```

**What it does:**
- Verifies API key is valid
- Tests location search
- Shows sample results
- Useful for debugging API issues

---

### `update-recommendation-function.ts`
Updates the PostgreSQL recommendation function in Supabase.

**Usage:**
```bash
npx tsx scripts/update-recommendation-function.ts
```

**What it does:**
- Deploys/updates `get_recommended_places()` SQL function
- Used during development when SQL logic changes
- Not needed for normal operation

---

## Environment Variables Required

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# TripAdvisor (for import)
TRIPADVISOR_API_KEY=your_api_key
```

## Notes

- All scripts load environment variables from `.env.local`
- Scripts use `dotenv` to read environment variables
- Service role key required for database writes
- Test places script is safe to run anytime
