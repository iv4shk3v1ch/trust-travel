import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ACCOMMODATION_PATTERNS = [
  /\bhotel\b/i,
  /\bhostel\b/i,
  /\bmotel\b/i,
  /\binn\b/i,
  /\bguest ?house\b/i,
  /\bb\s*&\s*b\b/i,
  /\bbnb\b/i,
  /\bbed and breakfast\b/i,
  /\bsuites?\b/i,
  /\bresidence\b/i,
  /\bresidenza\b/i,
  /\baparthotel\b/i,
  /\baccommodation\b/i,
  /\blodging\b/i,
  /\bresort\b/i,
  /\bholiday home\b/i,
  /\bholiday house\b/i
] as const;

const STRONG_RELIGIOUS_SITE_PATTERNS = [
  /\bchurch\b/i,
  /\bchiesa\b/i,
  /\bbasilica\b/i,
  /\bcattedrale\b/i,
  /\bcathedral\b/i,
  /\babbey\b/i,
  /\babbazia\b/i,
  /\bchapel\b/i,
  /\boratorio\b/i,
  /\bsantuario\b/i,
  /\bmonastery\b/i,
  /\bmonastero\b/i
] as const;

const TRANSPORT_PATTERNS = [
  /\btrain station\b/i,
  /\bbus station\b/i,
  /\brailway station\b/i,
  /\bstazione ferroviaria\b/i,
  /\bstazione centrale\b/i,
  /\bairport\b/i,
  /\baeroporto\b/i,
  /\bmetro\b/i,
  /\bsubway\b/i,
  /\bterminal\b/i,
  /\brailway\b/i,
  /\btrenitalia\b/i,
  /\btrenord\b/i,
  /\bfunivia\b/i,
  /\bautostazione\b/i,
  /^\s*stazione\b/i,
  /^\s*station\b/i
] as const;

const VENUE_CONTEXT_PATTERNS = [
  /\brestaurant\b/i,
  /\bristorante\b/i,
  /\btrattoria\b/i,
  /\bosteria\b/i,
  /\bhosteria\b/i,
  /\bpizzeria\b/i,
  /\bcafe\b/i,
  /\bcaff[eè]\b/i,
  /\bbar\b/i,
  /\bpub\b/i,
  /\bgelato\b/i,
  /\bpanino\b/i,
  /\bmarket\b/i,
  /\bshop\b/i,
  /\bboutique\b/i
] as const;

type PlaceTypeRow = {
  id: string;
  name: string;
  slug: string;
};

type PlaceRow = {
  id: string;
  name: string;
  city: string;
  address: string | null;
  description: string | null;
  website: string | null;
  latitude: number | null;
  longitude: number | null;
  place_type_id: string | null;
  place_types?: { slug?: string | null; name?: string | null } | null;
};

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

function normalize(value: string | null | undefined): string {
  return (value || '').replace(/\s+/g, ' ').trim();
}

function normalizeName(value: string | null | undefined): string {
  return normalize(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function matchesPattern(value: string, patterns: readonly RegExp[]): boolean {
  return patterns.some(pattern => pattern.test(value));
}

function looksAccommodation(place: PlaceRow): boolean {
  const nameSignals = normalize(place.name);
  const rankingSignals = normalize(place.description);

  return matchesPattern(nameSignals, ACCOMMODATION_PATTERNS)
    || /\bhotel\b/i.test(rankingSignals)
    || /\b(b&bs|inns|specialty lodging)\b/i.test(rankingSignals);
}

function looksReligiousSite(place: PlaceRow): boolean {
  const nameSignals = normalize(place.name);
  const rankingSignals = normalize(place.description);

  if (matchesPattern(nameSignals, STRONG_RELIGIOUS_SITE_PATTERNS)) {
    return true;
  }

  if (/\bduomo di\b/i.test(nameSignals) || /^\s*duomo\b/i.test(nameSignals)) {
    return true;
  }

  return /\bchurch(es)?\b/i.test(rankingSignals) || /\bcathedrals?\b/i.test(rankingSignals);
}

function looksTransport(place: PlaceRow): boolean {
  const nameSignals = normalize(place.name);
  const rankingSignals = normalize(place.description);
  if (/\btransport\b/i.test(rankingSignals)) {
    return true;
  }

  if (matchesPattern(nameSignals, VENUE_CONTEXT_PATTERNS)) {
    return false;
  }

  return matchesPattern(nameSignals, TRANSPORT_PATTERNS);
}

async function ensurePlaceType(slug: string, name: string): Promise<PlaceTypeRow> {
  const { data: existing, error: existingError } = await supabase
    .from('place_types')
    .select('id, name, slug')
    .eq('slug', slug)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) return existing as PlaceTypeRow;

  const { data, error } = await supabase
    .from('place_types')
    .insert({ slug, name })
    .select('id, name, slug')
    .single();

  if (error) throw error;
  return data as PlaceTypeRow;
}

async function getPlaceType(slug: string): Promise<PlaceTypeRow> {
  const { data, error } = await supabase
    .from('place_types')
    .select('id, name, slug')
    .eq('slug', slug)
    .single();

  if (error) throw error;
  return data as PlaceTypeRow;
}

async function loadPlaces(): Promise<PlaceRow[]> {
  const rows: PlaceRow[] = [];
  const pageSize = 1000;
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from('places')
      .select('id,name,city,address,description,website,latitude,longitude,place_type_id,place_types(slug,name)')
      .range(offset, offset + pageSize - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;
    rows.push(...(data as PlaceRow[]));
    if (data.length < pageSize) break;
    offset += pageSize;
  }

  return rows;
}

async function updatePlaceType(placeIds: string[], placeTypeId: string): Promise<void> {
  const chunkSize = 500;
  for (let index = 0; index < placeIds.length; index += chunkSize) {
    const chunk = placeIds.slice(index, index + chunkSize);
    const { error } = await supabase
      .from('places')
      .update({ place_type_id: placeTypeId, updated_at: new Date().toISOString() })
      .in('id', chunk);

    if (error) throw error;
  }
}

function buildDuplicateReport(places: PlaceRow[]): Array<{ city: string; name: string; ids: string[] }> {
  const groups = new Map<string, PlaceRow[]>();

  for (const place of places) {
    const key = `${place.city}|${normalizeName(place.name)}`;
    const bucket = groups.get(key) || [];
    bucket.push(place);
    groups.set(key, bucket);
  }

  return Array.from(groups.entries())
    .filter(([, rows]) => rows.length > 1)
    .map(([key, rows]) => {
      const [city, name] = key.split('|');
      return { city, name, ids: rows.map(row => row.id) };
    })
    .sort((a, b) => b.ids.length - a.ids.length);
}

async function main() {
  const apply = hasFlag('--apply');
  const removeTransport = hasFlag('--remove-transport');

  const accommodationType = await ensurePlaceType('accommodation', 'Accommodation');
  const historicalSiteType = await getPlaceType('historical_site');
  const places = await loadPlaces();

  const accommodationPlaces = places.filter(place => looksAccommodation(place));
  const religiousPlaces = places.filter(place => !looksAccommodation(place) && looksReligiousSite(place));
  const transportPlaces = places.filter(place => !looksAccommodation(place) && looksTransport(place));
  const duplicateGroups = buildDuplicateReport(places);

  const accommodationToUpdate = accommodationPlaces.filter(place => place.place_types?.slug !== 'accommodation');
  const religiousToUpdate = religiousPlaces.filter(place => place.place_types?.slug !== 'historical_site');

  console.log(`Accommodation places detected: ${accommodationPlaces.length}`);
  console.log(`Accommodation places needing update: ${accommodationToUpdate.length}`);
  console.log(`Religious places detected: ${religiousPlaces.length}`);
  console.log(`Religious places needing update: ${religiousToUpdate.length}`);
  console.log(`Transport-like places detected for manual review: ${transportPlaces.length}`);
  console.log(`Exact normalized-name duplicate groups: ${duplicateGroups.length}`);

  for (const place of accommodationToUpdate.slice(0, 15)) {
    console.log(`- [accommodation] ${place.city}: ${place.name} (${place.place_types?.slug || 'unknown'})`);
  }

  for (const place of religiousToUpdate.slice(0, 15)) {
    console.log(`- [church->historical_site] ${place.city}: ${place.name} (${place.place_types?.slug || 'unknown'})`);
  }

  for (const place of transportPlaces.slice(0, 15)) {
    console.log(`- [transport-review] ${place.city}: ${place.name} (${place.place_types?.slug || 'unknown'})`);
  }

  for (const group of duplicateGroups.slice(0, 15)) {
    console.log(`- [duplicate] ${group.city}: ${group.name} -> ${group.ids.length} rows`);
  }

  if (!apply) {
    console.log('Dry run only. Re-run with --apply to update accommodation and church taxonomy.');
    return;
  }

  if (accommodationToUpdate.length > 0) {
    await updatePlaceType(accommodationToUpdate.map(place => place.id), accommodationType.id);
  }

  if (religiousToUpdate.length > 0) {
    await updatePlaceType(religiousToUpdate.map(place => place.id), historicalSiteType.id);
  }

  console.log('Taxonomy repair applied.');

  if (removeTransport) {
    console.log('Transport cleanup is not automated in this script. Review the transport report first.');
  }
}

main().catch(error => {
  console.error('Place taxonomy repair failed:', error);
  process.exit(1);
});
