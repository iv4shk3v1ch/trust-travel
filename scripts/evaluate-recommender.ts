/**
 * Offline evaluation for thesis recommendation modes.
 *
 * Protocol:
 * - leave-one-city-out per user
 * - for each eligible user/city pair, remove all of that user's reviews in the target city
 * - recommend places in the target city using the remaining history
 * - evaluate against held-out positive items (rating >= 4)
 *
 * Metrics:
 * - Precision@10
 * - Recall@10
 * - HitRate@10
 * - NDCG@10
 * - coverage / empty-list rate
 *
 * Usage:
 *   npx tsx scripts/evaluate-recommender.ts
 *   npx tsx scripts/evaluate-recommender.ts --min-cross-city-users 30
 *   npx tsx scripts/evaluate-recommender.ts --limit-users 40
 */

import { supabaseAdmin } from '../src/core/database/supabase';
import {
  MAIN_CATEGORIES,
  PLACE_CATEGORIES,
  SUBCATEGORY_TO_MAIN,
  type MainCategory,
  type PlaceCategory
} from '../src/shared/utils/dataStandards';

type ReviewWithPlace = {
  id: string;
  user_id: string;
  place_id: string;
  overall_rating: number | null;
  visit_date: string | null;
  comment: string | null;
  places: {
    id: string;
    name: string;
    city: string | null;
    address: string | null;
    description: string | null;
    website: string | null;
    phone: string | null;
    latitude: number | null;
    longitude: number | null;
    price_level: string | null;
    indoor_outdoor: string | null;
    verified: boolean | null;
    created_at: string | null;
    place_type_id: string | null;
    place_types: {
      slug: string | null;
      name: string | null;
    } | null;
  } | null;
};

type RawReviewRow = {
  id: string;
  user_id: string;
  place_id: string;
  overall_rating: number | null;
  visit_date: string | null;
  comment: string | null;
  places: ReviewWithPlace['places'] | ReviewWithPlace['places'][] | null;
};

type UserSimilarity = {
  userId: string;
  similarity: number;
  overlapCount: number;
  meanRating: number;
};

type CandidateScore = {
  place: ReviewWithPlace['places'];
  predictedRating: number;
  collaborativeScore: number;
  categoryAffinity: number;
  qualityScore: number;
  popularityScore: number;
  noveltyScore: number;
  socialTrustScore: number;
  similarUsersCount: number;
  averageRating: number;
  reviewCount: number;
  mainCategory: MainCategory;
  diversityBoost: number;
  finalScore: number;
};

type EvalCase = {
  userId: string;
  userName: string;
  targetCity: string;
  sourceCities: string[];
  trainReviewCount: number;
  heldOutPositiveCount: number;
};

type Metrics = {
  cases: number;
  emptyLists: number;
  returned: number;
  precisionAt10: number;
  recallAt10: number;
  hitRateAt10: number;
  ndcgAt10: number;
};

type EvaluationSummary = {
  dataset: {
    usersEvaluated: number;
    casesEvaluated: number;
    totalReviews: number;
    totalPlaces: number;
  };
  metricsByMode: Record<'popular' | 'cf_only' | 'hybrid', Metrics>;
  metricsByCity: Record<string, Record<'popular' | 'cf_only' | 'hybrid', Metrics>>;
  sampleCases: Array<{
    userName: string;
    city: string;
    relevantCount: number;
    popularTop3: string[];
    cfOnlyTop3: string[];
    hybridTop3: string[];
  }>;
};

const TARGET_CITIES = ['Trento', 'Milan', 'Rome', 'Florence'] as const;

function getArgValue(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function normalizeWhitespace(value: string | null | undefined): string {
  return (value || '').replace(/\s+/g, ' ').trim();
}

function parseSortableDate(value: string | null | undefined): number {
  const normalized = normalizeWhitespace(value);
  if (!normalized) return 0;
  const timestamp = Date.parse(normalized);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function normalizeCategorySlug(value: string | null | undefined): PlaceCategory | null {
  const normalized = normalizeWhitespace(value).toLowerCase().replace(/\s+/g, '_');
  if (!normalized) return null;

  const legacyMap: Record<string, PlaceCategory> = {
    'coffee-shop': PLACE_CATEGORIES.CAFE,
    'fast-food': PLACE_CATEGORIES.STREET_FOOD,
    'historical-site': PLACE_CATEGORIES.HISTORICAL_SITE,
    'hiking-trail': PLACE_CATEGORIES.HIKING_TRAIL,
    'shopping': PLACE_CATEGORIES.SHOPPING_AREA,
    'attraction': PLACE_CATEGORIES.LANDMARK,
    'theater': PLACE_CATEGORIES.ENTERTAINMENT_VENUE,
    'theatre': PLACE_CATEGORIES.ENTERTAINMENT_VENUE,
    'music-venue': PLACE_CATEGORIES.ENTERTAINMENT_VENUE,
    'opera': PLACE_CATEGORIES.ENTERTAINMENT_VENUE,
    'cinema': PLACE_CATEGORIES.ENTERTAINMENT_VENUE,
    'hotel': PLACE_CATEGORIES.ACCOMMODATION,
    'beach': PLACE_CATEGORIES.LAKE_RIVER_BEACH,
    'lake': PLACE_CATEGORIES.LAKE_RIVER_BEACH,
    'river': PLACE_CATEGORIES.LAKE_RIVER_BEACH
  };

  if (normalized in legacyMap) return legacyMap[normalized];
  if (Object.values(PLACE_CATEGORIES).includes(normalized as PlaceCategory)) return normalized as PlaceCategory;
  return null;
}

function inferCategoryFromPlaceMetadata(place: ReviewWithPlace['places'], fallback?: PlaceCategory | null): PlaceCategory | null {
  const combined = `${normalizeWhitespace(place?.name)} ${normalizeWhitespace(place?.description)}`.toLowerCase();
  if (!combined) return fallback || null;

  if (/(cafe|caf[eé]|coffee|pasticceria|panificio|bakery|gelateria|gelato|cioccolateria)/.test(combined)) {
    return PLACE_CATEGORIES.CAFE;
  }
  if (/(ristorante|restaurant|trattoria|osteria|pizzeria|bistro|bistrot)/.test(combined)) {
    return PLACE_CATEGORIES.RESTAURANT;
  }
  if (/(enoteca|wine bar|cocktail|pub|bar\b|aperitivo)/.test(combined)) {
    return PLACE_CATEGORIES.BAR;
  }
  if (/(mercato|market\b|mercati)/.test(combined)) {
    return PLACE_CATEGORIES.MARKET;
  }
  if (/(cinema|theater|theatre|auditorium|arena|multisala|teatro|concert)/.test(combined)) {
    return PLACE_CATEGORIES.ENTERTAINMENT_VENUE;
  }
  if (/(museum|museo|pinacoteca|gallerie|gallery|fondazione)/.test(combined)) {
    return PLACE_CATEGORIES.MUSEUM;
  }
  if (/(park|parco|giardini|gardens|garden\b)/.test(combined)) {
    return PLACE_CATEGORIES.PARK;
  }
  if (/(piazzale|panorama|viewpoint|belvedere|terrace|terrazza)/.test(combined)) {
    return PLACE_CATEGORIES.VIEWPOINT;
  }

  return fallback || null;
}

function getEffectiveCategory(place: ReviewWithPlace['places']): PlaceCategory {
  const normalized = normalizeCategorySlug(place?.place_types?.slug);
  if (!normalized || normalized === PLACE_CATEGORIES.LANDMARK || normalized === PLACE_CATEGORIES.HISTORICAL_SITE) {
    return inferCategoryFromPlaceMetadata(place, normalized) || PLACE_CATEGORIES.LANDMARK;
  }
  return normalized;
}

function getMainCategory(category: PlaceCategory): MainCategory {
  return (SUBCATEGORY_TO_MAIN[category] || MAIN_CATEGORIES.CULTURE_SIGHTS) as MainCategory;
}

function shouldExcludePlace(place: ReviewWithPlace['places'], category: PlaceCategory): boolean {
  const combined = `${normalizeWhitespace(place?.name)} ${normalizeWhitespace(place?.description)}`.toLowerCase();
  if (!combined) return false;
  if (combined.includes('permanently closed') || combined.includes('temporarily closed') || combined.includes(' - closed')) {
    return true;
  }
  if (
    [PLACE_CATEGORIES.LANDMARK, PLACE_CATEGORIES.HISTORICAL_SITE, PLACE_CATEGORIES.MUSEUM].includes(category) &&
    (combined.includes('travel') || combined.includes('tour') || combined.includes('agency') || combined.includes('excursion'))
  ) {
    return true;
  }
  return false;
}

function computeMeanRating(reviews: ReviewWithPlace[]): number {
  if (!reviews.length) return 3.5;
  return reviews.reduce((sum, review) => sum + (review.overall_rating || 0), 0) / reviews.length;
}

function computeUserCategoryAffinities(reviews: ReviewWithPlace[], userMean: number): Map<string, number> {
  const byCategory = new Map<string, { total: number; count: number }>();

  for (const review of reviews) {
    const category = getEffectiveCategory(review.places);
    if (!category || typeof review.overall_rating !== 'number') continue;

    const adjusted = 0.5 + ((review.overall_rating - userMean) / 4);
    const bucket = byCategory.get(category) || { total: 0, count: 0 };
    bucket.total += clamp(adjusted, 0, 1);
    bucket.count += 1;
    byCategory.set(category, bucket);
  }

  return new Map(Array.from(byCategory.entries()).map(([category, bucket]) => [category, bucket.total / bucket.count]));
}

function computeUserMainCategoryAffinities(categoryAffinities: Map<string, number>): Map<string, number> {
  const grouped = new Map<string, { total: number; count: number }>();
  for (const [category, affinity] of categoryAffinities.entries()) {
    const mainCategory = getMainCategory(category as PlaceCategory);
    const bucket = grouped.get(mainCategory) || { total: 0, count: 0 };
    bucket.total += affinity;
    bucket.count += 1;
    grouped.set(mainCategory, bucket);
  }

  return new Map(Array.from(grouped.entries()).map(([key, bucket]) => [key, bucket.total / bucket.count]));
}

function computeSimilarity(
  currentReviews: ReviewWithPlace[],
  candidateReviews: ReviewWithPlace[],
  currentMean: number,
  candidateMean: number
): UserSimilarity | null {
  const currentByPlace = new Map(currentReviews.map(review => [review.place_id, review]));
  const overlap = candidateReviews.filter(review => currentByPlace.has(review.place_id));
  if (overlap.length < 2) return null;

  let numerator = 0;
  let currentMagnitude = 0;
  let candidateMagnitude = 0;

  for (const review of overlap) {
    const currentRating = currentByPlace.get(review.place_id)?.overall_rating;
    const candidateRating = review.overall_rating;
    if (typeof currentRating !== 'number' || typeof candidateRating !== 'number') continue;
    const currentCentered = currentRating - currentMean;
    const candidateCentered = candidateRating - candidateMean;
    numerator += currentCentered * candidateCentered;
    currentMagnitude += currentCentered ** 2;
    candidateMagnitude += candidateCentered ** 2;
  }

  if (!currentMagnitude || !candidateMagnitude) return null;

  const rawSimilarity = numerator / (Math.sqrt(currentMagnitude) * Math.sqrt(candidateMagnitude));
  const overlapWeight = Math.min(overlap.length / 5, 1);
  const similarity = rawSimilarity * overlapWeight;
  if (similarity <= 0) return null;

  return {
    userId: overlap[0].user_id,
    similarity,
    overlapCount: overlap.length,
    meanRating: candidateMean
  };
}

function getQualityScore(averageRating: number, reviewCount: number, globalAverage: number): number {
  const priorWeight = 5;
  const bayesianAverage = ((reviewCount * averageRating) + (priorWeight * globalAverage)) / (reviewCount + priorWeight);
  return clamp((bayesianAverage - 1) / 4, 0, 1);
}

function getPopularityScore(reviewCount: number): number {
  if (reviewCount <= 0) return 0;
  return clamp(Math.log(reviewCount + 1) / Math.log(26), 0, 1);
}

function getNoveltyScore(place: ReviewWithPlace['places'], reviewCount: number): number {
  const freshnessBase = (() => {
    const createdAt = parseSortableDate(place?.created_at);
    if (!createdAt) return 0.4;
    const days = (Date.now() - createdAt) / (1000 * 60 * 60 * 24);
    if (days <= 60) return 1;
    if (days <= 180) return 0.7;
    return 0.35;
  })();

  const hiddenGemBase = 1 - clamp(reviewCount / 25, 0, 1);
  return clamp((freshnessBase * 0.5) + (hiddenGemBase * 0.5), 0, 1);
}

function getCandidateDedupKey(score: CandidateScore): string {
  const city = normalizeWhitespace(score.place?.city).toLowerCase();
  const name = normalizeWhitespace(score.place?.name).toLowerCase();
  const address = normalizeWhitespace(score.place?.address).toLowerCase();
  return `${city}::${name}::${address || 'no-address'}`;
}

function diversifyRecommendations(
  scores: CandidateScore[],
  limit: number,
  strategy: 'popular' | 'cf_only' | 'hybrid'
): CandidateScore[] {
  const uniqueScores = new Map<string, CandidateScore>();
  for (const score of [...scores].sort((a, b) => b.finalScore - a.finalScore)) {
    const dedupKey = getCandidateDedupKey(score);
    if (!uniqueScores.has(dedupKey)) uniqueScores.set(dedupKey, score);
  }

  const sorted = Array.from(uniqueScores.values());
  const selected: CandidateScore[] = [];
  const categoryCounts = new Map<string, number>();
  const mainCategoryCounts = new Map<string, number>();

  if (strategy === 'hybrid') {
    const minimumTargets = [
      MAIN_CATEGORIES.FOOD_DRINK,
      MAIN_CATEGORIES.CULTURE_SIGHTS,
      MAIN_CATEGORIES.NATURE_OUTDOOR,
      MAIN_CATEGORIES.SHOPPING_ACTIVITIES
    ];

    for (const mainCategory of minimumTargets) {
      const candidate = sorted.find(item => !selected.some(s => s.place?.id === item.place?.id) && item.mainCategory === mainCategory);
      if (!candidate) continue;
      const category = getEffectiveCategory(candidate.place);
      selected.push(candidate);
      categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
      mainCategoryCounts.set(mainCategory, (mainCategoryCounts.get(mainCategory) || 0) + 1);
    }
  }

  for (const candidate of sorted) {
    if (selected.some(item => item.place?.id === candidate.place?.id)) continue;
    const category = getEffectiveCategory(candidate.place);
    const count = categoryCounts.get(category) || 0;
    const maxPerCategory = strategy === 'hybrid' ? (selected.length < 10 ? 2 : 4) : (selected.length < 8 ? 2 : 4);
    if (count >= maxPerCategory) continue;

    if (strategy === 'hybrid') {
      const mainCount = mainCategoryCounts.get(candidate.mainCategory) || 0;
      if (mainCount >= 6 && candidate.mainCategory === MAIN_CATEGORIES.CULTURE_SIGHTS) continue;
    }

    selected.push(candidate);
    categoryCounts.set(category, count + 1);
    mainCategoryCounts.set(candidate.mainCategory, (mainCategoryCounts.get(candidate.mainCategory) || 0) + 1);
    if (selected.length >= limit) break;
  }

  if (selected.length < limit) {
    for (const candidate of sorted) {
      if (selected.some(item => item.place?.id === candidate.place?.id)) continue;
      selected.push(candidate);
      if (selected.length >= limit) break;
    }
  }

  return selected.sort((a, b) => b.finalScore - a.finalScore);
}

async function fetchAllReviewsWithPlaces(): Promise<ReviewWithPlace[]> {
  const rows: ReviewWithPlace[] = [];
  const pageSize = 1000;
  let offset = 0;

  while (true) {
    const { data, error } = await supabaseAdmin
      .from('reviews')
      .select(`
        id,
        user_id,
        place_id,
        overall_rating,
        visit_date,
        comment,
        places!inner(
          id,
          name,
          city,
          address,
          description,
          website,
          phone,
          latitude,
          longitude,
          price_level,
          indoor_outdoor,
          verified,
          created_at,
          place_type_id,
          place_types(slug,name)
        )
      `)
      .range(offset, offset + pageSize - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;

    const normalizedRows = (data as unknown as RawReviewRow[]).map(row => ({
      ...row,
      places: Array.isArray(row.places) ? (row.places[0] || null) : row.places
    }));

    rows.push(...(normalizedRows as ReviewWithPlace[]));
    if (data.length < pageSize) break;
    offset += pageSize;
  }

  return rows.filter(row => row.places && typeof row.overall_rating === 'number');
}

async function fetchProfiles(userIds: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const batchSize = 200;

  for (let index = 0; index < userIds.length; index += batchSize) {
    const batch = userIds.slice(index, index + batchSize);
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name')
      .in('id', batch);
    if (error) throw error;
    for (const row of data || []) {
      map.set(row.id, row.full_name || row.id);
    }
  }

  return map;
}

function rankPopular(targetCityReviews: ReviewWithPlace[], excludedPlaceIds: Set<string>): string[] {
  const reviewsByPlace = new Map<string, ReviewWithPlace[]>();
  for (const review of targetCityReviews) {
    if (excludedPlaceIds.has(review.place_id)) continue;
    const bucket = reviewsByPlace.get(review.place_id) || [];
    bucket.push(review);
    reviewsByPlace.set(review.place_id, bucket);
  }

  const globalAverage = computeMeanRating(targetCityReviews);
  const candidates: CandidateScore[] = [];

  for (const reviews of reviewsByPlace.values()) {
    const place = reviews[0].places;
    if (!place) continue;
    const category = getEffectiveCategory(place);
    if (shouldExcludePlace(place, category)) continue;
    if (category === PLACE_CATEGORIES.ACCOMMODATION) continue;

    const averageRating = computeMeanRating(reviews);
    const reviewCount = reviews.length;
    const qualityScore = getQualityScore(averageRating, reviewCount, globalAverage);
    const popularityScore = getPopularityScore(reviewCount);
    const noveltyScore = getNoveltyScore(place, reviewCount);
    const finalScore = clamp((qualityScore * 0.45) + (popularityScore * 0.35) + (noveltyScore * 0.05), 0, 1);

    candidates.push({
      place,
      predictedRating: averageRating,
      collaborativeScore: 0,
      categoryAffinity: 0.5,
      qualityScore,
      popularityScore,
      noveltyScore,
      socialTrustScore: 0,
      similarUsersCount: 0,
      averageRating,
      reviewCount,
      mainCategory: getMainCategory(category),
      diversityBoost: 0,
      finalScore
    });
  }

  return diversifyRecommendations(candidates, 10, 'popular').map(candidate => candidate.place?.id || '');
}

function prepareCollaborativeContext(
  trainReviews: ReviewWithPlace[],
  userId: string,
  targetCity: string
) {
  const currentUserReviews = trainReviews.filter(review => review.user_id === userId);
  const targetCityReviews = trainReviews.filter(review => review.places?.city === targetCity);
  const currentReviewedPlaceIds = new Set(currentUserReviews.map(review => review.place_id));
  const currentMean = computeMeanRating(currentUserReviews);
  const categoryAffinities = computeUserCategoryAffinities(currentUserReviews, currentMean);
  const mainCategoryAffinities = computeUserMainCategoryAffinities(categoryAffinities);

  const userReviewsByUser = new Map<string, ReviewWithPlace[]>();
  for (const review of trainReviews) {
    const bucket = userReviewsByUser.get(review.user_id) || [];
    bucket.push(review);
    userReviewsByUser.set(review.user_id, bucket);
  }

  const similarities: UserSimilarity[] = [];
  if (currentUserReviews.length >= 5) {
    for (const [candidateUserId, reviews] of userReviewsByUser.entries()) {
      if (candidateUserId === userId) continue;
      const candidateMean = computeMeanRating(reviews);
      const similarity = computeSimilarity(currentUserReviews, reviews, currentMean, candidateMean);
      if (similarity) similarities.push(similarity);
    }
  }

  similarities.sort((a, b) => b.similarity - a.similarity);
  const topSimilarUsers = similarities.slice(0, 30);

  return {
    currentUserReviews,
    targetCityReviews,
    currentReviewedPlaceIds,
    categoryAffinities,
    mainCategoryAffinities,
    topSimilarUsers,
    similarityByUser: new Map(topSimilarUsers.map(item => [item.userId, item])),
    globalAverage: computeMeanRating(targetCityReviews)
  };
}

function rankCFOrHybrid(
  trainReviews: ReviewWithPlace[],
  userId: string,
  targetCity: string,
  mode: 'cf_only' | 'hybrid'
): string[] {
  const prepared = prepareCollaborativeContext(trainReviews, userId, targetCity);
  if (prepared.currentUserReviews.length < 5 || !prepared.topSimilarUsers.length) {
    return mode === 'hybrid'
      ? rankPopular(trainReviews.filter(review => review.places?.city === targetCity), prepared.currentReviewedPlaceIds)
      : [];
  }

  const reviewsByPlace = new Map<string, ReviewWithPlace[]>();
  for (const review of prepared.targetCityReviews) {
    if (prepared.currentReviewedPlaceIds.has(review.place_id)) continue;
    const bucket = reviewsByPlace.get(review.place_id) || [];
    bucket.push(review);
    reviewsByPlace.set(review.place_id, bucket);
  }

  const candidates: CandidateScore[] = [];

  for (const [placeId, reviews] of reviewsByPlace.entries()) {
    const place = reviews[0].places;
    if (!place) continue;

    const category = getEffectiveCategory(place);
    if (shouldExcludePlace(place, category)) continue;
    if (category === PLACE_CATEGORIES.ACCOMMODATION) continue;

    const mainCategory = getMainCategory(category);
    const averageRating = computeMeanRating(reviews);
    const reviewCount = reviews.length;
    const qualityScore = getQualityScore(averageRating, reviewCount, prepared.globalAverage);
    const popularityScore = getPopularityScore(reviewCount);
    const noveltyScore = getNoveltyScore(place, reviewCount);
    const categoryAffinity = prepared.categoryAffinities.get(category) ?? 0.5;
    const mainCategoryAffinity = prepared.mainCategoryAffinities.get(mainCategory) ?? (mainCategory === MAIN_CATEGORIES.FOOD_DRINK ? 0.58 : 0.5);

    let weightedDeviationSum = 0;
    let similarityWeightSum = 0;
    let similarUsersCount = 0;

    for (const review of reviews) {
      const similarity = prepared.similarityByUser.get(review.user_id);
      if (!similarity || typeof review.overall_rating !== 'number') continue;
      weightedDeviationSum += similarity.similarity * (review.overall_rating - similarity.meanRating);
      similarityWeightSum += Math.abs(similarity.similarity);
      similarUsersCount += 1;
    }

    if (similarityWeightSum <= 0) continue;

    const predictedRating = clamp(computeMeanRating(prepared.currentUserReviews) + (weightedDeviationSum / similarityWeightSum), 1, 5);
    const collaborativeScore = clamp((predictedRating - 1) / 4, 0, 1);
    const diversityBoost = mode === 'hybrid'
      ? clamp(
          (mainCategory === MAIN_CATEGORIES.FOOD_DRINK ? 0.10 : 0) +
          (mainCategory === MAIN_CATEGORIES.SHOPPING_ACTIVITIES || mainCategory === MAIN_CATEGORIES.NIGHTLIFE ? 0.08 : 0) +
          Math.max(mainCategoryAffinity - 0.5, 0) * 0.45,
          0,
          0.20
        )
      : 0;
    const mainstreamPenalty = mode === 'hybrid' &&
      mainCategory === MAIN_CATEGORIES.CULTURE_SIGHTS &&
      popularityScore > 0.82 &&
      collaborativeScore < 0.72 &&
      categoryAffinity < 0.62
        ? 0.08
        : 0;

    if (mode === 'cf_only' && similarUsersCount < 2 && collaborativeScore < 0.78) continue;
    if (qualityScore < 0.45 && collaborativeScore < 0.45) continue;

    const finalScore = mode === 'cf_only'
      ? clamp(collaborativeScore * 0.92 + noveltyScore * 0.03, 0, 1)
      : clamp(
          collaborativeScore * 0.36 +
          categoryAffinity * 0.16 +
          mainCategoryAffinity * 0.08 +
          noveltyScore * 0.08 +
          qualityScore * 0.08 +
          popularityScore * 0.03 +
          diversityBoost * 0.08 -
          mainstreamPenalty,
          0,
          1
        );

    candidates.push({
      place,
      predictedRating,
      collaborativeScore,
      categoryAffinity,
      qualityScore,
      popularityScore,
      noveltyScore,
      socialTrustScore: 0,
      similarUsersCount,
      averageRating,
      reviewCount,
      mainCategory,
      diversityBoost,
      finalScore
    });
  }

  const strategy = mode === 'cf_only' ? 'cf_only' : 'hybrid';
  return diversifyRecommendations(candidates, 10, strategy).map(candidate => candidate.place?.id || '');
}

function precisionAtK(recommended: string[], relevant: Set<string>, k: number): number {
  const topK = recommended.slice(0, k);
  const hits = topK.filter(placeId => relevant.has(placeId)).length;
  return hits / k;
}

function recallAtK(recommended: string[], relevant: Set<string>, k: number): number {
  if (!relevant.size) return 0;
  const topK = recommended.slice(0, k);
  const hits = topK.filter(placeId => relevant.has(placeId)).length;
  return hits / relevant.size;
}

function hitRateAtK(recommended: string[], relevant: Set<string>, k: number): number {
  return recommended.slice(0, k).some(placeId => relevant.has(placeId)) ? 1 : 0;
}

function ndcgAtK(recommended: string[], relevant: Set<string>, k: number): number {
  const topK = recommended.slice(0, k);
  let dcg = 0;
  for (let i = 0; i < topK.length; i++) {
    if (relevant.has(topK[i])) {
      dcg += 1 / Math.log2(i + 2);
    }
  }

  const idealHits = Math.min(relevant.size, k);
  let idcg = 0;
  for (let i = 0; i < idealHits; i++) {
    idcg += 1 / Math.log2(i + 2);
  }

  return idcg > 0 ? dcg / idcg : 0;
}

function emptyMetrics(): Metrics {
  return {
    cases: 0,
    emptyLists: 0,
    returned: 0,
    precisionAt10: 0,
    recallAt10: 0,
    hitRateAt10: 0,
    ndcgAt10: 0
  };
}

function addMetrics(target: Metrics, recommended: string[], relevant: Set<string>) {
  target.cases += 1;
  target.returned += recommended.length;
  if (!recommended.length) target.emptyLists += 1;
  target.precisionAt10 += precisionAtK(recommended, relevant, 10);
  target.recallAt10 += recallAtK(recommended, relevant, 10);
  target.hitRateAt10 += hitRateAtK(recommended, relevant, 10);
  target.ndcgAt10 += ndcgAtK(recommended, relevant, 10);
}

function finalizeMetrics(metrics: Metrics): Metrics {
  if (!metrics.cases) return metrics;
  return {
    ...metrics,
    precisionAt10: metrics.precisionAt10 / metrics.cases,
    recallAt10: metrics.recallAt10 / metrics.cases,
    hitRateAt10: metrics.hitRateAt10 / metrics.cases,
    ndcgAt10: metrics.ndcgAt10 / metrics.cases,
    returned: metrics.returned / metrics.cases
  };
}

function buildEvaluationCases(allReviews: ReviewWithPlace[], profileById: Map<string, string>, limitUsers: number): EvalCase[] {
  const reviewsByUser = new Map<string, ReviewWithPlace[]>();
  for (const review of allReviews) {
    const bucket = reviewsByUser.get(review.user_id) || [];
    bucket.push(review);
    reviewsByUser.set(review.user_id, bucket);
  }

  const candidateUsers = Array.from(reviewsByUser.entries())
    .map(([userId, reviews]) => {
      const cityCounts = new Map<string, number>();
      for (const review of reviews) {
        const city = review.places?.city;
        if (!city) continue;
        cityCounts.set(city, (cityCounts.get(city) || 0) + 1);
      }
      return { userId, reviews, cityCounts };
    })
    .filter(item => {
      const nonEmptyCities = Array.from(item.cityCounts.values()).filter(count => count > 0).length;
      return nonEmptyCities >= 2 && (profileById.get(item.userId) || '').startsWith('TripAdvisor ');
    })
    .sort((a, b) => b.reviews.length - a.reviews.length)
    .slice(0, limitUsers);

  const cases: EvalCase[] = [];
  for (const candidate of candidateUsers) {
    for (const city of TARGET_CITIES) {
      const targetCityReviews = candidate.reviews.filter(review => review.places?.city === city);
      const heldOutPositives = targetCityReviews.filter(review => (review.overall_rating || 0) >= 4);
      const sourceCities = Array.from(new Set(candidate.reviews.filter(review => review.places?.city !== city).map(review => review.places?.city || ''))).filter(Boolean);

      if (heldOutPositives.length < 2) continue;
      if (sourceCities.length < 1) continue;
      if (candidate.reviews.length - targetCityReviews.length < 5) continue;

      cases.push({
        userId: candidate.userId,
        userName: profileById.get(candidate.userId) || candidate.userId,
        targetCity: city,
        sourceCities,
        trainReviewCount: candidate.reviews.length - targetCityReviews.length,
        heldOutPositiveCount: heldOutPositives.length
      });
    }
  }

  return cases;
}

async function main() {
  const limitUsers = Number(getArgValue('--limit-users') || '50');
  const allReviews = await fetchAllReviewsWithPlaces();
  const uniqueUserIds = Array.from(new Set(allReviews.map(review => review.user_id)));
  const profileById = await fetchProfiles(uniqueUserIds);
  const evaluationCases = buildEvaluationCases(allReviews, profileById, limitUsers);

  const metricsByMode: EvaluationSummary['metricsByMode'] = {
    popular: emptyMetrics(),
    cf_only: emptyMetrics(),
    hybrid: emptyMetrics()
  };
  const metricsByCity: EvaluationSummary['metricsByCity'] = {};
  const sampleCases: EvaluationSummary['sampleCases'] = [];

  for (const city of TARGET_CITIES) {
    metricsByCity[city] = {
      popular: emptyMetrics(),
      cf_only: emptyMetrics(),
      hybrid: emptyMetrics()
    };
  }

  for (const evaluationCase of evaluationCases) {
    const trainReviews = allReviews.filter(
      review => !(review.user_id === evaluationCase.userId && review.places?.city === evaluationCase.targetCity)
    );
    const heldOutRelevant = new Set(
      allReviews
        .filter(
          review =>
            review.user_id === evaluationCase.userId &&
            review.places?.city === evaluationCase.targetCity &&
            (review.overall_rating || 0) >= 4
        )
        .map(review => review.place_id)
    );

    const popular = rankPopular(
      trainReviews.filter(review => review.places?.city === evaluationCase.targetCity),
      new Set()
    );
    const cfOnly = rankCFOrHybrid(trainReviews, evaluationCase.userId, evaluationCase.targetCity, 'cf_only');
    const hybrid = rankCFOrHybrid(trainReviews, evaluationCase.userId, evaluationCase.targetCity, 'hybrid');

    addMetrics(metricsByMode.popular, popular, heldOutRelevant);
    addMetrics(metricsByMode.cf_only, cfOnly, heldOutRelevant);
    addMetrics(metricsByMode.hybrid, hybrid, heldOutRelevant);

    addMetrics(metricsByCity[evaluationCase.targetCity].popular, popular, heldOutRelevant);
    addMetrics(metricsByCity[evaluationCase.targetCity].cf_only, cfOnly, heldOutRelevant);
    addMetrics(metricsByCity[evaluationCase.targetCity].hybrid, hybrid, heldOutRelevant);

    if (sampleCases.length < 5) {
      sampleCases.push({
        userName: evaluationCase.userName,
        city: evaluationCase.targetCity,
        relevantCount: heldOutRelevant.size,
        popularTop3: popular.slice(0, 3),
        cfOnlyTop3: cfOnly.slice(0, 3),
        hybridTop3: hybrid.slice(0, 3)
      });
    }
  }

  const summary: EvaluationSummary = {
    dataset: {
      usersEvaluated: new Set(evaluationCases.map(item => item.userId)).size,
      casesEvaluated: evaluationCases.length,
      totalReviews: allReviews.length,
      totalPlaces: new Set(allReviews.map(review => review.place_id)).size
    },
    metricsByMode: {
      popular: finalizeMetrics(metricsByMode.popular),
      cf_only: finalizeMetrics(metricsByMode.cf_only),
      hybrid: finalizeMetrics(metricsByMode.hybrid)
    },
    metricsByCity: Object.fromEntries(
      Object.entries(metricsByCity).map(([city, metrics]) => [
        city,
        {
          popular: finalizeMetrics(metrics.popular),
          cf_only: finalizeMetrics(metrics.cf_only),
          hybrid: finalizeMetrics(metrics.hybrid)
        }
      ])
    ),
    sampleCases
  };

  console.log('Offline evaluation summary');
  console.log(JSON.stringify(summary, null, 2));
}

main().catch(error => {
  console.error('Evaluation failed:', error);
  process.exit(1);
});
