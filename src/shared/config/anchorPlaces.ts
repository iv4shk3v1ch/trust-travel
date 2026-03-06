import {
  MAIN_CATEGORIES,
  PLACE_CATEGORIES,
  type ExperienceTag,
  type MainCategory,
  type PlaceCategory
} from '@/shared/utils/dataStandards';

export type SupportedCity = 'Trento' | 'Milan' | 'Florence' | 'Rome';
export type SeedRatingValue = 1 | 2 | 3 | 4 | 5 | null;

export interface AnchorPlaceDefinition {
  id: string;
  city: SupportedCity;
  title: string;
  concept: string;
  summary: string;
  rationale: string;
  category: PlaceCategory;
  mainCategory: MainCategory;
  experienceTags: ExperienceTag[];
}

function createAnchor(
  city: SupportedCity,
  slug: string,
  title: string,
  concept: string,
  summary: string,
  rationale: string,
  category: PlaceCategory,
  mainCategory: MainCategory,
  experienceTags: ExperienceTag[]
): AnchorPlaceDefinition {
  return {
    id: `${city.toLowerCase()}-${slug}`,
    city,
    title,
    concept,
    summary,
    rationale,
    category,
    mainCategory,
    experienceTags
  };
}

export const HOME_CITY_OPTIONS: SupportedCity[] = ['Trento', 'Milan', 'Florence', 'Rome'];

export const ANCHOR_PLACES_BY_CITY: Record<SupportedCity, AnchorPlaceDefinition[]> = {
  Trento: [
    createAnchor('Trento', 'piazza-duomo', 'Piazza Duomo', 'Historic city icon', 'Main historic square and cathedral area.', 'Separates mainstream sightseeing from purely local taste.', PLACE_CATEGORIES.LANDMARK, MAIN_CATEGORIES.CULTURE_SIGHTS, ['afternoon', 'solo', 'authentic_local']),
    createAnchor('Trento', 'buonconsiglio', 'Castello del Buonconsiglio', 'Culture stop', 'Historic castle and culture-heavy indoor visit.', 'Strong signal for users who actively enjoy structured cultural visits.', PLACE_CATEGORIES.MUSEUM, MAIN_CATEGORIES.CULTURE_SIGHTS, ['afternoon', 'long_stay', 'solo', 'authentic_local']),
    createAnchor('Trento', 'busa-dei-orsi', 'Busa dei Orsi', 'Viewpoint', 'Panoramic natural stop with scenic emphasis.', 'Captures scenic preference without defaulting to classic sightseeing.', PLACE_CATEGORIES.VIEWPOINT, MAIN_CATEGORIES.NATURE_OUTDOOR, ['scenic_view', 'calm', 'solo']),
    createAnchor('Trento', 'le-gallerie', 'Le Gallerie', 'Museum', 'Curated exhibition-focused museum visit.', 'Useful for separating reflective museum taste from casual historic strolling.', PLACE_CATEGORIES.MUSEUM, MAIN_CATEGORIES.CULTURE_SIGHTS, ['afternoon', 'long_stay', 'solo']),
    createAnchor('Trento', 'lungadige', 'Lung’Adige', 'Slow outdoor', 'Relaxed riverside walk in the city.', 'Differentiates calm everyday outdoor taste from destination-only travel.', PLACE_CATEGORIES.PARK, MAIN_CATEGORIES.NATURE_OUTDOOR, ['calm', 'afternoon', 'quick_stop']),
    createAnchor('Trento', 'forsterbrau', 'Forsterbräu Trento', 'Classic sit-down restaurant', 'Longer local meal with a social city-center feel.', 'Strong discriminator for food-first users who value sit-down dining over fast sightseeing.', PLACE_CATEGORIES.RESTAURANT, MAIN_CATEGORIES.FOOD_DRINK, ['food', 'long_stay', 'evening', 'friends']),
    createAnchor('Trento', 'panificio-moderno', 'Panificio Moderno', 'Cafe / bakery', 'Coffee, pastry, and short-stay everyday city habit.', 'Useful for identifying low-friction food taste and bakery-oriented behavior.', PLACE_CATEGORIES.CAFE, MAIN_CATEGORIES.FOOD_DRINK, ['coffee', 'bakery', 'morning', 'quick_stop']),
    createAnchor('Trento', 'bar-duomo-bistrot', 'Bar Duomo Bistrot', 'Bar / aperitivo', 'Drinks and aperitivo close to the city core.', 'Separates evening-social users from strictly daytime travelers.', PLACE_CATEGORIES.BAR, MAIN_CATEGORIES.FOOD_DRINK, ['drinks', 'evening', 'friends', 'lively']),
    createAnchor('Trento', 'gustavo-modena', 'Multisala Gustavo Modena', 'Entertainment / event venue', 'Planned indoor entertainment for an evening out.', 'Captures event-oriented urban leisure rather than spontaneous sightseeing.', PLACE_CATEGORIES.ENTERTAINMENT_VENUE, MAIN_CATEGORIES.SHOPPING_ACTIVITIES, ['evening', 'friends', 'date']),
    createAnchor('Trento', 'albere', 'Le Albere', 'Trendy district', 'Contemporary neighborhood feel rather than classic heritage core.', 'Helps distinguish users who prefer modern urban atmosphere over only historic icons.', PLACE_CATEGORIES.SHOPPING_AREA, MAIN_CATEGORIES.SHOPPING_ACTIVITIES, ['afternoon', 'friends', 'lively'])
  ],
  Milan: [
    createAnchor('Milan', 'duomo', 'Duomo di Milano', 'Flagship landmark', 'Canonical must-see landmark in the city center.', 'Measures affinity for iconic headline attractions.', PLACE_CATEGORIES.HISTORICAL_SITE, MAIN_CATEGORIES.CULTURE_SIGHTS, ['afternoon', 'solo', 'authentic_local']),
    createAnchor('Milan', 'brera', 'Pinacoteca di Brera', 'Art-heavy museum visit', 'Focused fine-art visit with cultural depth.', 'Separates deep art interest from broad sightseeing.', PLACE_CATEGORIES.ART_GALLERY, MAIN_CATEGORIES.CULTURE_SIGHTS, ['afternoon', 'long_stay', 'solo']),
    createAnchor('Milan', 'biblioteca-alberi', 'Biblioteca degli Alberi', 'Contemporary urban park', 'Modern outdoor city break.', 'Captures preference for relaxed urban green spaces.', PLACE_CATEGORIES.PARK, MAIN_CATEGORIES.NATURE_OUTDOOR, ['calm', 'afternoon', 'quick_stop']),
    createAnchor('Milan', 'navigli-view', 'Navigli canal walk', 'Scenic urban social area', 'Walkable area with atmosphere and people-watching.', 'Useful for distinguishing lively urban exploration from formal culture.', PLACE_CATEGORIES.VIEWPOINT, MAIN_CATEGORIES.NATURE_OUTDOOR, ['friends', 'evening', 'lively']),
    createAnchor('Milan', 'mercato-centrale', 'Mercato Centrale Milano', 'Food market discovery', 'Multiple casual food options in one place.', 'Strong signal for exploratory eaters and local food sampling.', PLACE_CATEGORIES.MARKET, MAIN_CATEGORIES.SHOPPING_ACTIVITIES, ['food', 'friends', 'authentic_local', 'budget_friendly']),
    createAnchor('Milan', 'modern-trattoria', 'Modern Milanese restaurant', 'Intentional dining destination', 'Sit-down dinner with contemporary local style.', 'Distinguishes destination dining from quick-stop food behavior.', PLACE_CATEGORIES.RESTAURANT, MAIN_CATEGORIES.FOOD_DRINK, ['food', 'date', 'evening', 'long_stay']),
    createAnchor('Milan', 'pasticceria', 'Historic pastry cafe', 'Coffee and pastry ritual', 'Short but high-frequency food habit.', 'Useful because many users can judge it even with limited travel history.', PLACE_CATEGORIES.CAFE, MAIN_CATEGORIES.FOOD_DRINK, ['coffee', 'bakery', 'morning', 'quick_stop']),
    createAnchor('Milan', 'aperitivo-bar', 'Navigli aperitivo bar', 'Evening drinks and social energy', 'Cocktails and aperitivo in a lively area.', 'Separates nightlife/social taste from quiet cultural travel.', PLACE_CATEGORIES.BAR, MAIN_CATEGORIES.FOOD_DRINK, ['drinks', 'evening', 'friends', 'lively']),
    createAnchor('Milan', 'scala-or-stage', 'Theater / concert venue', 'Curated city-night activity', 'Formal evening culture.', 'Captures planned entertainment taste beyond museums.', PLACE_CATEGORIES.ENTERTAINMENT_VENUE, MAIN_CATEGORIES.SHOPPING_ACTIVITIES, ['evening', 'date', 'long_stay']),
    createAnchor('Milan', 'design-district', 'Contemporary design district', 'Trend and shopping exploration', 'Modern district experience rather than classic monument visit.', 'Helps detect users who prefer contemporary city culture over heritage icons.', PLACE_CATEGORIES.SHOPPING_AREA, MAIN_CATEGORIES.SHOPPING_ACTIVITIES, ['afternoon', 'friends', 'lively'])
  ],
  Florence: [
    createAnchor('Florence', 'duomo', 'Piazza del Duomo', 'Historic icon cluster', 'Central monument-heavy sightseeing area.', 'Measures comfort with canonical tourist heritage.', PLACE_CATEGORIES.HISTORICAL_SITE, MAIN_CATEGORIES.CULTURE_SIGHTS, ['afternoon', 'solo', 'authentic_local']),
    createAnchor('Florence', 'uffizi', 'Uffizi Galleries', 'High-intensity art museum', 'Serious art-centered visit.', 'Distinguishes deep art preference from lighter city wandering.', PLACE_CATEGORIES.ART_GALLERY, MAIN_CATEGORIES.CULTURE_SIGHTS, ['afternoon', 'long_stay', 'solo']),
    createAnchor('Florence', 'piazzale-michelangelo', 'Piazzale Michelangelo', 'Viewpoint for scenic reward', 'Classic panorama and sunset spot.', 'Strong scenic preference signal with romantic/outdoor bias.', PLACE_CATEGORIES.VIEWPOINT, MAIN_CATEGORIES.NATURE_OUTDOOR, ['scenic_view', 'date', 'afternoon']),
    createAnchor('Florence', 'boboli', 'Boboli Gardens', 'Garden and slow exploration', 'Longer green-space visit with calm pacing.', 'Separates slow outdoor taste from dense museum hopping.', PLACE_CATEGORIES.PARK, MAIN_CATEGORIES.NATURE_OUTDOOR, ['calm', 'long_stay', 'solo']),
    createAnchor('Florence', 'mercato-centrale', 'Mercato Centrale Firenze', 'Food-market exploration', 'Casual sampling and local food browsing.', 'Discriminates experiential eaters from attraction-only travelers.', PLACE_CATEGORIES.MARKET, MAIN_CATEGORIES.SHOPPING_ACTIVITIES, ['food', 'authentic_local', 'friends']),
    createAnchor('Florence', 'osteria', 'Traditional Florentine osteria', 'Long-stay local restaurant', 'Classic regional dinner choice.', 'Useful for identifying food-led travel behavior.', PLACE_CATEGORIES.RESTAURANT, MAIN_CATEGORIES.FOOD_DRINK, ['food', 'long_stay', 'evening', 'authentic_local']),
    createAnchor('Florence', 'cafe', 'Historic cafe / pastry stop', 'Coffee and pastry habit', 'Low-commitment but highly expressive preference signal.', 'Good discriminator for morning-routine and cafe-oriented users.', PLACE_CATEGORIES.CAFE, MAIN_CATEGORIES.FOOD_DRINK, ['coffee', 'bakery', 'morning', 'quick_stop']),
    createAnchor('Florence', 'wine-bar', 'Wine bar in Oltrarno', 'Evening social localism', 'Drinks in a neighborhood atmosphere.', 'Separates local-night vibe from museum-centered travel.', PLACE_CATEGORIES.BAR, MAIN_CATEGORIES.FOOD_DRINK, ['drinks', 'evening', 'friends', 'authentic_local']),
    createAnchor('Florence', 'artisan-quarter', 'Oltrarno artisan streets', 'Shopping and neighborhood wandering', 'Contemporary/local district feel over iconic monuments.', 'Captures exploratory urban taste and shopping/craft interest.', PLACE_CATEGORIES.SHOPPING_AREA, MAIN_CATEGORIES.SHOPPING_ACTIVITIES, ['afternoon', 'friends', 'authentic_local']),
    createAnchor('Florence', 'music-stage', 'Live music / performance venue', 'Night culture beyond museums', 'Ticketed or planned evening outing.', 'Helps identify entertainment-seeking users with urban night activity.', PLACE_CATEGORIES.ENTERTAINMENT_VENUE, MAIN_CATEGORIES.SHOPPING_ACTIVITIES, ['evening', 'friends', 'lively'])
  ],
  Rome: [
    createAnchor('Rome', 'colosseum', 'Colosseum area', 'Historic blockbuster attraction', 'Globally recognized must-see site.', 'Measures interest in classic large-scale heritage tourism.', PLACE_CATEGORIES.HISTORICAL_SITE, MAIN_CATEGORIES.CULTURE_SIGHTS, ['afternoon', 'solo', 'authentic_local']),
    createAnchor('Rome', 'borghese-gallery', 'Galleria Borghese', 'Curated art and museum visit', 'Structured art experience with planning required.', 'Separates deliberate cultural taste from casual sightseeing.', PLACE_CATEGORIES.MUSEUM, MAIN_CATEGORIES.CULTURE_SIGHTS, ['afternoon', 'long_stay', 'solo']),
    createAnchor('Rome', 'janiculum', 'Janiculum viewpoint', 'Scenic hill panorama', 'View-driven outdoor stop.', 'Captures scenic and romantic preference with low food bias.', PLACE_CATEGORIES.VIEWPOINT, MAIN_CATEGORIES.NATURE_OUTDOOR, ['scenic_view', 'date', 'afternoon']),
    createAnchor('Rome', 'villa-borghese', 'Villa Borghese', 'Urban park and breathing space', 'Slow outdoor reset inside a dense city.', 'Useful for distinguishing calm outdoor preference from monument collecting.', PLACE_CATEGORIES.PARK, MAIN_CATEGORIES.NATURE_OUTDOOR, ['calm', 'family', 'afternoon']),
    createAnchor('Rome', 'testaccio-market', 'Testaccio Market', 'Local food-market experience', 'Casual local eating and browsing.', 'Strong discriminator for authenticity-seeking food behavior.', PLACE_CATEGORIES.MARKET, MAIN_CATEGORIES.SHOPPING_ACTIVITIES, ['food', 'authentic_local', 'budget_friendly']),
    createAnchor('Rome', 'trastevere-trattoria', 'Trastevere trattoria', 'Classic Roman dining', 'Long dinner and local cuisine.', 'Separates food-led city exploration from sightseeing-first behavior.', PLACE_CATEGORIES.RESTAURANT, MAIN_CATEGORIES.FOOD_DRINK, ['food', 'evening', 'long_stay', 'authentic_local']),
    createAnchor('Rome', 'espresso-bar', 'Neighborhood espresso bar', 'Short coffee ritual', 'Everyday city habit rather than destination attraction.', 'Very useful low-friction signal for casual urban taste.', PLACE_CATEGORIES.CAFE, MAIN_CATEGORIES.FOOD_DRINK, ['coffee', 'morning', 'quick_stop']),
    createAnchor('Rome', 'campo-bar', 'Campo de Fiori evening bar', 'Social nightlife energy', 'Drinks and people in a lively square context.', 'Distinguishes socially driven evening taste.', PLACE_CATEGORIES.BAR, MAIN_CATEGORIES.FOOD_DRINK, ['drinks', 'evening', 'friends', 'lively']),
    createAnchor('Rome', 'auditorium-stage', 'Auditorium / theater venue', 'Planned evening entertainment', 'Formal event or performance outing.', 'Captures interest in city-night activities beyond food and monuments.', PLACE_CATEGORIES.ENTERTAINMENT_VENUE, MAIN_CATEGORIES.SHOPPING_ACTIVITIES, ['evening', 'date', 'friends']),
    createAnchor('Rome', 'monti-district', 'Monti neighborhood streets', 'Contemporary district wandering', 'Shops, cafes, and trend-driven walking.', 'Helps distinguish users who like modern neighborhood exploration.', PLACE_CATEGORIES.SHOPPING_AREA, MAIN_CATEGORIES.SHOPPING_ACTIVITIES, ['afternoon', 'friends', 'lively'])
  ]
};

export function getAnchorPlacesForCity(city: SupportedCity | ''): AnchorPlaceDefinition[] {
  if (!city) return [];
  return ANCHOR_PLACES_BY_CITY[city] || [];
}

export function ratingLabel(value: SeedRatingValue): string {
  switch (value) {
    case 5:
      return 'Love';
    case 4:
      return 'Like';
    case 3:
      return 'Neutral';
    case 2:
      return 'Dislike';
    case 1:
      return 'Strong dislike';
    default:
      return 'Skip';
  }
}
