# FINAL SCHEMA DESIGN - Trust Travel
**Date:** January 23, 2026  
**Status:** Ready for migration

---

## 🎯 Overview

Your **final semantic structure** for collaborative filtering:

```
5 Main Categories
  └─ 18 Subcategories
     └─ Places
        ├─ 25 Experience Tags (22 + 3 dietary)
        └─ service_type field (sit_down, takeaway, counter_service)
```

---

## 📦 5 MAIN CATEGORIES (Hierarchical)

| Category | Slug | Subcategories | Purpose |
|----------|------|---------------|---------|
| **Food & Drink** | `food_drink` | 4 | Eating & drinking establishments |
| **Nightlife** | `nightlife` | 1 | Late-night entertainment |
| **Culture & Sights** | `culture_sights` | 4 | Museums, art, historical sites |
| **Nature & Outdoor** | `nature_outdoor` | 4 | Parks, trails, natural attractions |
| **Shopping & Activities** | `shopping_activities` | 5 | Shopping, entertainment, wellness |

---

## 📂 18 SUBCATEGORIES

### 🍽️ Food & Drink (4)
1. **Restaurant** (`restaurant`) - Full-service dining, trattorias, pizzerias
2. **Street Food** (`street_food`) - Takeaway, food trucks, quick bites
3. **Cafe** (`cafe`) - Coffee shops, bakeries, light meals
4. **Bar** (`bar`) - Pubs, wine bars, aperitivo spots

### 🌙 Nightlife (1)
5. **Nightclub** (`nightclub`) - Dance clubs, DJ venues

### 🏛️ Culture & Sights (4)
6. **Museum** (`museum`) - Museums, cultural exhibitions
7. **Art Gallery** (`art_gallery`) - Art galleries, contemporary art spaces
8. **Historical Site** (`historical_site`) - Churches, castles, monuments
9. **Landmark** (`landmark`) - Iconic places, squares, towers, bridges

### 🌳 Nature & Outdoor (4)
10. **Park** (`park`) - Urban parks, gardens, green spaces
11. **Viewpoint** (`viewpoint`) - Scenic overlooks, panoramic views
12. **Hiking Trail** (`hiking_trail`) - Walking trails, nature routes
13. **Lake/River/Beach** (`lake_river_beach`) - Water bodies, waterfronts

### 🛍️ Shopping & Activities (5)
14. **Market** (`market`) - Local markets, food markets, artisan markets
15. **Shopping Area** (`shopping_area`) - Shopping streets, malls, boutiques
16. **Entertainment Venue** (`entertainment_venue`) - Theaters, cinemas, concert halls
17. **Spa Wellness** (`spa_wellness`) - Spas, thermal baths, yoga studios

---

## 🏷️ 25 EXPERIENCE TAGS

### 1️⃣ **What's Available** (4 tags) - Category: `offering`
- `food` - Place serves food
- `drinks` - Place serves drinks
- `coffee` - Place serves coffee
- `bakery` - Place has bakery items

### 2️⃣ **When to Visit** (4 tags) - Category: `timing`
- `morning` - Good for morning/breakfast
- `afternoon` - Good for afternoon/lunch
- `evening` - Good for evening/dinner
- `late_night` - Open late at night

### 3️⃣ **How Long to Stay** (2 tags) - Category: `duration`
- `quick_stop` - Fast visit, 15-30 min
- `long_stay` - Worth spending hours

### 4️⃣ **Who to Go With** (5 tags) - Category: `social`
- `solo` - Good for solo travelers
- `friends` - Fun with friends
- `date` - Romantic, good for couples
- `family` - Good for families
- `with_pet` - Pet-friendly

### 5️⃣ **Atmosphere & Vibe** (4 tags) - Category: `atmosphere`
- `calm` - Peaceful, quiet
- `lively` - Energetic, busy
- `romantic` - Intimate, romantic vibe
- `authentic_local` - Real local experience

### 6️⃣ **Practical Signals** (3 tags) - Category: `practical`
- `budget_friendly` - Good value, affordable
- `scenic_view` - Beautiful views
- `hidden_gem` - Off the beaten path

### 7️⃣ **Dietary Options** (3 tags) - Category: `dietary`
- `vegan` - Vegan food available
- `halal` - Halal certified
- `gluten_free` - Gluten-free options available

---

## 🍴 SERVICE TYPE (Place Feature, NOT Tag)

**New field:** `places.service_type` (TEXT ARRAY)

**Values:**
- `sit_down` - Table service, sit and eat
- `takeaway` - Get food to go
- `counter_service` - Order at counter, casual dining

**Why separate?**
- This is a **factual property** of the place, not an experience
- Places can have **multiple** service types (e.g., `['sit_down', 'takeaway']`)
- Used for **filtering**, not recommendations

**Example:**
```sql
-- Cafe with both sit-down and takeaway
service_type: ['sit_down', 'takeaway']

-- Pure takeaway food truck
service_type: ['takeaway']

-- Restaurant with all options
service_type: ['sit_down', 'takeaway', 'counter_service']
```

---

## 📊 OLD → NEW MAPPING

### Categories (62 → 18)

| Your Old Category | → | New Subcategory | Main Category |
|-------------------|---|-----------------|---------------|
| Local Trattoria | → | Restaurant | Food & Drink |
| Pizzeria | → | Restaurant | Food & Drink |
| Specialty Coffee Bar | → | Cafe | Food & Drink |
| Gelateria | → | Cafe | Food & Drink |
| Aperitivo Bar | → | Bar | Food & Drink |
| Craft Beer Pub | → | Bar | Food & Drink |
| Rooftop Bar | → | Bar | Food & Drink |
| Food Market | → | Market | Shopping & Activities |
| Underground Club | → | Nightclub | Nightlife |
| Art Gallery | → | Art Gallery | Culture & Sights |
| Contemporary Art | → | Art Gallery | Culture & Sights |
| Castle | → | Historical Site | Culture & Sights |
| Church | → | Historical Site | Culture & Sights |
| Old Town | → | Landmark | Culture & Sights |
| City Square | → | Landmark | Culture & Sights |
| Tower | → | Landmark | Culture & Sights |
| Botanical Garden | → | Park | Nature & Outdoor |
| Mountain Peak | → | Hiking Trail | Nature & Outdoor |
| Waterfall | → | Lake/River/Beach | Nature & Outdoor |
| Beach | → | Lake/River/Beach | Nature & Outdoor |
| Vintage Store | → | Shopping Area | Shopping & Activities |
| Bookstore | → | Shopping Area | Shopping & Activities |
| Theatre | → | Entertainment Venue | Shopping & Activities |
| Cinema | → | Entertainment Venue | Shopping & Activities |
| Spa | → | Spa Wellness | Shopping & Activities |
| Thermal Bath | → | Spa Wellness | Shopping & Activities |
| Yoga Studio | → | Spa Wellness | Shopping & Activities |

*...and 35 more categories mapped*

### Experience Tags (35 → 25)

| Your Old Tag | → | New Tag | Notes |
|--------------|---|---------|-------|
| Romantic | → | `romantic` | ✅ Direct |
| Hidden Gem | → | `hidden_gem` | ✅ Direct |
| Lively | → | `lively` | ✅ Direct |
| Authentic Local | → | `authentic_local` | ✅ Direct |
| Budget Friendly | → | `budget_friendly` | ✅ Direct |
| Solo Friendly | → | `solo` | Simplified |
| Great for Friends | → | `friends` | Simplified |
| Date Spot | → | `date` | Simplified |
| Family Friendly | → | `family` | Simplified |
| Pet Friendly | → | `with_pet` | Clarified |
| Peaceful | → | `calm` | Merged |
| Cozy | → | `calm` | Merged |
| Simple | → | `calm` | Merged |
| Elegant | → | `romantic` | Merged |
| Artsy | → | `authentic_local` | Merged |
| Trendy | → | `lively` | Merged |
| Great Food | → | `food` | Role tag |
| Great Drinks | → | `drinks` | Role tag |
| Best at Night | → | `late_night` | Timing tag |
| Great for Daytime | → | `afternoon` | Timing tag |
| Quick Service | → | `quick_stop` | Duration tag |
| Gluten-free | → | `gluten_free` | Dietary tag |
| Vegetarian | → | `vegan` | Dietary tag (close) |
| Halal | → | `halal` | Dietary tag |
| Vegan | → | `vegan` | Dietary tag |

*...and 10 more tags mapped*

---

## 🔧 DATABASE CHANGES

### New Tables Created:
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY,
  name TEXT UNIQUE,
  slug TEXT UNIQUE,
  description TEXT,
  icon TEXT
);

-- place_types now has category_id FK
ALTER TABLE place_types 
  ADD COLUMN category_id UUID REFERENCES categories(id);
```

### New Fields Added to `places`:
```sql
-- Service type (replaces sit-down/takeaway/counter-service tags)
ALTER TABLE places ADD COLUMN service_type TEXT[];

-- Price improvements
ALTER TABLE places ADD COLUMN price_range_min INTEGER;
ALTER TABLE places ADD COLUMN price_range_max INTEGER;
ALTER TABLE places ADD COLUMN price_category TEXT;

-- Dynamic rating/review count via places_with_stats view
```

### Deprecated Fields:
```sql
-- Still exists but deprecated
places.price_level -- Use price_category + price_range instead
places.avg_rating -- Use places_with_stats view
places.review_count -- Use places_with_stats view
```

---

## 📝 CODE CHANGES NEEDED

### 1. TypeScript Types

**File:** `src/shared/types/place.ts`

```typescript
// Main categories
export type MainCategory = 
  | 'food_drink'
  | 'nightlife'
  | 'culture_sights'
  | 'nature_outdoor'
  | 'shopping_activities';

// Subcategories (18 total)
export type PlaceSubcategory =
  | 'restaurant' | 'street_food' | 'cafe' | 'bar' 
  | 'nightclub'
  | 'museum' | 'art_gallery' | 'historical_site' | 'landmark'
  | 'park' | 'viewpoint' | 'hiking_trail' | 'lake_river_beach'
  | 'market' | 'shopping_area' | 'entertainment_venue' | 'spa_wellness';

// Service type (place feature)
export type ServiceType = 'sit_down' | 'takeaway' | 'counter_service';

export interface Place {
  id: string;
  name: string;
  place_type_id: string; // FK to subcategory
  category_id?: string; // FK to main category (via join)
  
  // NEW FIELDS
  service_type?: ServiceType[]; // Can have multiple
  price_category?: 'budget' | 'moderate' | 'expensive' | 'luxury';
  price_range_min?: number; // in euros
  price_range_max?: number; // in euros
  
  // Location
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  
  // Dynamic fields (from places_with_stats view)
  avg_rating?: number;
  review_count?: number;
}
```

### 2. Experience Tags

**File:** `src/shared/types/review.ts`

```typescript
// 25 experience tags (22 + 3 dietary)
export type ExperienceTag =
  // Offering (4)
  | 'food' | 'drinks' | 'coffee' | 'bakery'
  // Timing (4)
  | 'morning' | 'afternoon' | 'evening' | 'late_night'
  // Duration (2)
  | 'quick_stop' | 'long_stay'
  // Social (5)
  | 'solo' | 'friends' | 'date' | 'family' | 'with_pet'
  // Atmosphere (4)
  | 'calm' | 'lively' | 'romantic' | 'authentic_local'
  // Practical (3)
  | 'budget_friendly' | 'scenic_view' | 'hidden_gem'
  // Dietary (3)
  | 'vegan' | 'halal' | 'gluten_free';

export interface ExperienceTagGroup {
  offering: ExperienceTag[];
  timing: ExperienceTag[];
  duration: ExperienceTag[];
  social: ExperienceTag[];
  atmosphere: ExperienceTag[];
  practical: ExperienceTag[];
  dietary: ExperienceTag[];
}
```

### 3. Database Queries

**Use `places_with_stats` view instead of `places` table:**

```typescript
// OLD:
const { data } = await supabase.from('places').select('*');

// NEW:
const { data } = await supabase
  .from('places_with_stats')
  .select(`
    *,
    place_types!inner(name, slug, category_id),
    categories!inner(name, slug)
  `);
```

### 4. Place Form Updates

**Add service_type selector for food/drink places:**

```typescript
// When place_type is restaurant, cafe, bar, or street_food
<MultiSelect
  label="Service Type"
  options={[
    { value: 'sit_down', label: 'Sit-down dining' },
    { value: 'takeaway', label: 'Takeaway available' },
    { value: 'counter_service', label: 'Counter service' }
  ]}
  value={serviceType}
  onChange={setServiceType}
/>
```

### 5. Review Tag Selector

**Update to new 25 tags grouped by category:**

```typescript
const TAG_GROUPS: ExperienceTagGroup = {
  offering: ['food', 'drinks', 'coffee', 'bakery'],
  timing: ['morning', 'afternoon', 'evening', 'late_night'],
  duration: ['quick_stop', 'long_stay'],
  social: ['solo', 'friends', 'date', 'family', 'with_pet'],
  atmosphere: ['calm', 'lively', 'romantic', 'authentic_local'],
  practical: ['budget_friendly', 'scenic_view', 'hidden_gem'],
  dietary: ['vegan', 'halal', 'gluten_free']
};

// Group tags by category in UI
{Object.entries(TAG_GROUPS).map(([category, tags]) => (
  <TagGroup key={category} title={category}>
    {tags.map(tag => <TagChip key={tag} tag={tag} />)}
  </TagGroup>
))}
```

---

## ✅ MIGRATION CHECKLIST

### Before Migration:
- [ ] Backup database
- [ ] Review all 62 → 18 category mappings
- [ ] Review all 35 → 25 tag mappings
- [ ] Test migration on staging environment

### Run Migration:
- [ ] Open Supabase Dashboard → SQL Editor
- [ ] Copy `supabase/migrations/20260120_schema_optimization.sql`
- [ ] Execute migration
- [ ] Check for errors in output
- [ ] Verify success message shows:
  - 5 main categories
  - 18 subcategories  
  - 25 experience tags
  - All places migrated

### After Migration:
- [ ] Run `npm run verify:migration`
- [ ] Update TypeScript types
- [ ] Update place form (add service_type)
- [ ] Update review form (new 25 tags)
- [ ] Update category selectors (hierarchical)
- [ ] Update queries to use `places_with_stats`
- [ ] Test place creation
- [ ] Test review submission
- [ ] Test filtering
- [ ] Notify users to re-select preferences

---

## 🎯 BENEFITS OF FINAL STRUCTURE

### For Collaborative Filtering:
✅ **Cleaner signals** - 18 subcategories vs 62 (less noise)  
✅ **Semantic grouping** - 5 main categories help clustering  
✅ **Focused tags** - 22 core tags capture what matters  
✅ **Dietary as separate** - Can filter without affecting CF model  
✅ **Service type as feature** - Not mixed with experience data

### For User Experience:
✅ **Hierarchical browsing** - "Show me Food & Drink → Restaurants"  
✅ **Clear tag meanings** - `solo` vs `solo-friendly` (simpler)  
✅ **Dietary transparency** - Vegan/Halal/Gluten-free clearly marked  
✅ **Service clarity** - Users know if they can sit down or take away

### For Recommendations:
✅ **Better user similarity** - Fewer categories = more overlap  
✅ **Tag consistency** - 22 focused tags = clearer patterns  
✅ **Multi-city transfer** - Semantic structure works across cities  
✅ **Cold start** - 18 subcategories easier to ask about in onboarding

---

## 🚀 NEXT STEPS AFTER MIGRATION

1. **Test the new structure** thoroughly
2. **Import multi-city data** (Rome, Milan, Florence) with new categories
3. **Download TripAdvisor reviews** (100+ users across 4 cities)
4. **Build collaborative filtering** using new semantic structure
5. **Implement place-based onboarding** with 18 subcategories

---

**Ready to migrate?** The SQL script is production-ready! 🎉
