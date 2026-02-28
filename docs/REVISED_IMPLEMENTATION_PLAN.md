# Trust Travel - Revised Implementation Plan
## Cross-City Collaborative Filtering Recommender

**Date:** January 20, 2026  
**Core Idea:** Recommend places in new cities based on user similarity (users who rated similar places in their home city)

---

## 🎯 Scientific Contribution

**Two-Dimensional Modeling:**
1. **User dimension:** Model users by their concrete place preferences (not abstract categories)
2. **Review dimension:** Model review relevance based on reviewer similarity to target user

**Key Innovation:** Cross-city recommendation transfer using user similarity from shared place ratings

---

## 📊 Current State Assessment

### ✅ What We Have:
- Database schema (places, reviews, users, profiles)
- OpenStreetMap data for Trento (~867 places after cleanup)
- Basic onboarding system (budget, activity, environment preferences)
- Recommendation engine V2 (scoring-based: popularity, ratings, distance)
- Two UIs: ranked list + map, chatbot interface
- Review system (users can leave reviews)

### ❌ What We're Missing:
- **User-Place Matrix:** No sufficient rating data (need 100+ users × 4 cities)
- **Multi-city data:** Only have Trento places
- **User similarity scoring:** No collaborative filtering implementation
- **Place-based onboarding:** Current onboarding asks abstract questions
- **Cross-city transfer:** No mechanism to use similarity from City A to recommend in City B

### 🚨 Critical Blocker:
**We need rating data!** Currently we have ~5 users with ~10 reviews each. Need 100+ users with ratings across 4 cities.

---

## 📋 REVISED IMPLEMENTATION PLAN

### PHASE 0: Data Foundation (Week 1) 🔴 HIGHEST PRIORITY

**Goal:** Get the user × place rating matrix with real data

#### Task 0.1: Select Target Cities
**Time:** 1 hour
- ✅ **City 1:** Trento (home base - already have places)
- 🎯 **City 2:** Rome (popular tourist destination)
- 🎯 **City 3:** Milan (business + culture hub)
- 🎯 **City 4:** Florence or Venice (alternative Italian tourist city)

**Rationale:** Italian cities for consistency, different characters (small/large, tourist/business)

#### Task 0.2: Import Multi-City Places from OSM
**Time:** 2-3 hours
- Extend `scripts/import-osm-places.ts` to support multiple cities
- Import 200-300 top POI per city (restaurants, museums, cafes, parks)
- Add `city` field indexing for fast filtering
- **Deliverable:** ~1000 places across 4 cities in database

#### Task 0.3: TripAdvisor User-Review Mining
**Time:** 4-6 hours

**Strategy:** Find users who have reviewed places in all 4 cities

```typescript
// Algorithm:
1. Search for top 50 places in each city on TripAdvisor
2. For each place, get reviewers
3. Find users who appear in multiple cities
4. Download all their reviews for places in our 4 cities
5. Store: user_id, place_name, rating, review_text, city
```

**Target:** 100+ active users with 10+ reviews each across cities

**Files to create:**
- `scripts/mine-tripadvisor-users.ts` - Find cross-city reviewers
- `scripts/import-tripadvisor-reviews-multi-city.ts` - Bulk review import

**Fallback if API limits:**
- Use public TripAdvisor scraping (legal for research)
- Or use Google Reviews via Places API
- Or combine: TripAdvisor + Google + our own synthetic data

#### Task 0.4: Verify Data Quality
**Time:** 1 hour
- Create SQL queries to verify:
  - User count (>100)
  - Reviews per user (avg >10)
  - City coverage (all 4 cities represented)
  - Rating distribution (not all 5 stars)
- Create `scripts/verify-rating-matrix.ts`

**Deliverable:** Report showing data is sufficient for collaborative filtering

---

### PHASE 1: User Similarity Engine (Week 2)

**Goal:** Implement collaborative filtering based on place ratings

#### Task 1.1: Create User-Place Rating Matrix
**Time:** 2-3 hours

**Database schema update:**
```sql
-- Already have reviews table, but add indexes:
CREATE INDEX idx_reviews_user_place ON reviews(user_id, place_id);
CREATE INDEX idx_reviews_city ON reviews(user_id, place_id, city);

-- Create materialized view for fast similarity calculation:
CREATE MATERIALIZED VIEW user_place_matrix AS
SELECT 
  user_id,
  place_id,
  rating,
  city
FROM reviews;

CREATE INDEX idx_matrix_user ON user_place_matrix(user_id);
CREATE INDEX idx_matrix_place ON user_place_matrix(place_id);
```

**File to create:** `src/core/database/create-rating-matrix.sql`

#### Task 1.2: User Similarity Calculation
**Time:** 4-6 hours

**Implementation:** Pearson correlation coefficient (or cosine similarity)

```typescript
// src/core/services/userSimilarityService.ts

function calculateUserSimilarity(user1: User, user2: User): number {
  // 1. Find places both users rated
  const commonPlaces = findCommonRatedPlaces(user1.id, user2.id);
  
  // 2. Calculate Pearson correlation on ratings
  const similarity = pearsonCorrelation(
    user1.ratings(commonPlaces),
    user2.ratings(commonPlaces)
  );
  
  // 3. Weight by number of common places
  const confidence = Math.min(commonPlaces.length / 10, 1.0);
  
  return similarity * confidence;
}

function findSimilarUsers(userId: string, city: string, k: number = 20) {
  // Find users who:
  // 1. Have rated places in target city
  // 2. Have high similarity score with current user
  // 3. Are not the current user
  
  // Use cached similarity scores for performance
}
```

**Files to create:**
- `src/core/services/userSimilarityService.ts` - Similarity calculation
- `src/core/services/similarityCache.ts` - Cache similarity scores
- `scripts/precompute-similarities.ts` - Batch compute similarities offline

#### Task 1.3: Collaborative Filtering Recommender
**Time:** 4-5 hours

```typescript
// src/core/services/recommendationEngineV3.ts

function getCollaborativeRecommendations(
  userId: string, 
  targetCity: string, 
  limit: number = 50
) {
  // 1. Find k most similar users who rated places in targetCity
  const similarUsers = findSimilarUsers(userId, targetCity, k=20);
  
  // 2. Get places they rated highly in targetCity
  const candidatePlaces = getCandidatePlaces(similarUsers, targetCity);
  
  // 3. Score each place by weighted average of similar users' ratings
  const scores = candidatePlaces.map(place => {
    const weightedSum = similarUsers.reduce((sum, user) => {
      const rating = user.getRating(place);
      const weight = user.similarity; // to target user
      return sum + (rating * weight);
    }, 0);
    
    const totalWeight = similarUsers.reduce((sum, u) => sum + u.similarity, 0);
    return weightedSum / totalWeight;
  });
  
  // 4. Rank by predicted score
  return rankByScore(candidatePlaces, scores);
}
```

**Files to create:**
- `src/core/services/recommendationEngineV3.ts` - Collaborative filtering
- `src/core/types/similarity.ts` - Type definitions

---

### PHASE 2: Place-Based Onboarding (Week 2-3)

**Goal:** Minimal onboarding that learns from concrete place preferences

#### Task 2.1: Design Onboarding Questions
**Time:** 2 hours

**New approach:** Ask about specific well-known places

**Question structure:**
```typescript
// Example questions:
Q1: "Have you visited any of these restaurants?"
    [Show 8-10 famous restaurants from different styles]
    User can select multiple + rate them

Q2: "What about these cafes?"
    [Show 8-10 cafes: chain vs local, cheap vs fancy]

Q3: "These museums?"
    [Show 8-10 museums: art, history, science, interactive]

Q4: "These outdoor spaces?"
    [Show 8-10: parks, viewpoints, trails, beaches]
```

**Key insight:** Each selected place gives us a concrete data point to find similar users

#### Task 2.2: Cold Start User Profile
**Time:** 3-4 hours

```typescript
// src/core/services/coldStartService.ts

function createInitialProfile(onboardingResponses: PlaceRating[]) {
  // 1. User rated 5-10 well-known places during onboarding
  // 2. Find users with similar ratings on those same places
  // 3. Use their ratings as initial recommendations
  
  const similarUsers = findUsersBySeedPlaces(onboardingResponses);
  return {
    similarUsers,
    confidence: calculateConfidence(onboardingResponses.length),
    seedPlaces: onboardingResponses
  };
}
```

**Files to create:**
- `src/app/onboarding-v2/page.tsx` - New place-based onboarding UI
- `src/core/services/coldStartService.ts` - Initial profile creation
- `src/shared/components/PlaceRatingCard.tsx` - UI for rating places

#### Task 2.3: Update Database Schema
**Time:** 1 hour

```sql
-- Store onboarding responses as regular reviews
-- But mark them as "seed" ratings for tracking

ALTER TABLE reviews ADD COLUMN is_seed_rating BOOLEAN DEFAULT false;
CREATE INDEX idx_reviews_seed ON reviews(user_id, is_seed_rating);
```

---

### PHASE 3: Cross-City Recommendation (Week 3)

**Goal:** Demonstrate transfer learning from home city to travel city

#### Task 3.1: City Selection Interface
**Time:** 2-3 hours

**UI Flow:**
```
1. User completes onboarding (rates 5-10 seed places)
2. System shows: "Where would you like to travel?"
3. User selects: Rome / Milan / Florence / Venice
4. System finds similar users who reviewed places in that city
5. System shows ranked recommendations
```

**Files to update:**
- `src/app/explore/page.tsx` - Add city selector
- `src/app/api/recommendations/route.ts` - Accept city parameter

#### Task 3.2: Recommendation Explanation
**Time:** 3-4 hours

**Show user WHY they got this recommendation:**

```typescript
interface RecommendationExplanation {
  place: Place;
  predictedRating: number;
  basedOn: {
    similarUser: User;
    similarity: number;
    commonPlaces: Place[]; // Places both users rated
    theirRating: number;
  }[];
}
```

**UI display:**
```
🏛️ Galleria Borghese
⭐ Predicted rating: 4.8/5

Based on users similar to you:
• Maria (95% similar) rated it 5/5
  You both loved: Castello del Buonconsiglio, MUSE
• Giovanni (89% similar) rated it 5/5
  You both loved: Piazza Duomo, Caffè Letterario
```

**Files to create:**
- `src/features/recommendations/components/ExplanationPanel.tsx`
- `src/core/services/explainabilityService.ts`

---

### PHASE 4: Review Relevance Scoring (Week 4)

**Goal:** Rank reviews by reviewer similarity to user

#### Task 4.1: Personalized Review Display
**Time:** 3-4 hours

When user views a place, show reviews sorted by similarity:

```typescript
function getPersonalizedReviews(placeId: string, userId: string) {
  // 1. Get all reviews for this place
  const reviews = getReviewsForPlace(placeId);
  
  // 2. Calculate similarity between user and each reviewer
  const scoredReviews = reviews.map(review => ({
    review,
    similarity: calculateUserSimilarity(userId, review.user_id),
    relevance: similarity * review.helpfulness_score
  }));
  
  // 3. Sort by relevance
  return scoredReviews.sort((a, b) => b.relevance - a.relevance);
}
```

**Files to update:**
- `src/features/reviews/components/ReviewList.tsx` - Add similarity badges
- `src/app/api/reviews/route.ts` - Add personalization

#### Task 4.2: Review Similarity Badges
**Time:** 2 hours

**UI enhancement:**
```
⭐⭐⭐⭐⭐ by Maria 👥 95% similar to you
"Amazing art collection, especially the Caravaggio room..."

⭐⭐⭐⭐ by John 👥 45% similar to you  
"Nice but crowded, go early morning..."
```

---

### PHASE 5: Evaluation & Metrics (Week 4)

**Goal:** Measure recommendation quality scientifically

#### Task 5.1: Offline Evaluation
**Time:** 3-4 hours

**Metrics to implement:**

1. **RMSE (Root Mean Square Error):**
   - Predict ratings using k-fold cross-validation
   - Compare predicted vs actual ratings

2. **Precision@K:**
   - How many of top-K recommendations would user actually like?
   - Use threshold: predicted rating > 4.0

3. **Coverage:**
   - What % of places get recommended?
   - Avoid filter bubble

4. **Diversity:**
   - Are recommendations from different categories?
   - Measure inter-list diversity

**Files to create:**
- `scripts/evaluate-recommendations.ts` - Evaluation suite
- `scripts/cross-validation.ts` - K-fold validation
- `docs/EVALUATION_RESULTS.md` - Document findings

#### Task 5.2: A/B Test Framework (Optional)
**Time:** 2-3 hours

Compare V2 (scoring-based) vs V3 (collaborative filtering):

```typescript
// Randomly assign users to control vs treatment
const variant = userId % 2 === 0 ? 'V2' : 'V3';

// Track metrics per variant:
// - Click-through rate
// - Time on recommendation page
// - Reviews left after visiting
// - User satisfaction ratings
```

---

### PHASE 6: UI/UX Polish (Week 5)

**Goal:** Make the system intuitive and thesis-presentable

#### Task 6.1: Improve Explore Page
**Time:** 3-4 hours

**Features:**
- City selector dropdown (prominent)
- Filter by category (still useful)
- Toggle: "Show all" vs "Personalized for me"
- Similarity score display: "Based on users 85% similar to you"

#### Task 6.2: Chatbot Enhancement
**Time:** 2-3 hours

**Update chatbot to use collaborative filtering:**

```
User: "Find me a romantic restaurant in Rome"

Bot: "Based on users similar to you who loved Ristorante Al Vo in Trento,
     I recommend Ristorante Aroma (4.8/5 predicted for you).
     
     Similar users said:
     • 'Perfect for date night, amazing views of Colosseum'
     • 'Excellent service and authentic Italian cuisine'"
```

#### Task 6.3: Dashboard for Insights
**Time:** 2-3 hours

Show user their profile:
- Similar users (anonymized)
- Common taste patterns
- Cities where predictions are strongest
- Confidence levels

---

### PHASE 7: Testing & Deployment (Week 5-6)

#### Task 7.1: User Testing
**Time:** 3-4 hours
- Recruit 5-10 testers
- Record: onboarding time, recommendation satisfaction, UI feedback
- Iterate based on feedback

#### Task 7.2: Performance Optimization
**Time:** 2-3 hours
- Cache similarity scores (update daily)
- Index database properly
- Optimize SQL queries for matrix operations
- Target: <500ms response time for recommendations

#### Task 7.3: Documentation
**Time:** 3-4 hours
- Update README with new architecture
- Document collaborative filtering algorithm
- Create diagrams: user similarity flow, recommendation pipeline
- Write API documentation

---

## 📊 TIMELINE SUMMARY

| Week | Focus | Key Deliverables |
|------|-------|-----------------|
| **Week 1** | Data Foundation | Multi-city places, 100+ users, rating matrix |
| **Week 2** | Core Algorithm | User similarity, CF recommender, place-based onboarding |
| **Week 3** | Cross-City Transfer | City selection, explanations, demo working |
| **Week 4** | Personalization | Review ranking, evaluation metrics |
| **Week 5** | Polish & Test | UI improvements, user testing, optimization |
| **Week 6** | Finalization | Bug fixes, documentation, thesis prep |

**Total:** 5-6 weeks to complete prototype

---

## 🚨 CRITICAL SUCCESS FACTORS

### 1. Data Acquisition (BLOCKER)
**Must solve this first!** Options:
- ✅ TripAdvisor API (if rate limits allow)
- ✅ Google Places API reviews
- ✅ Web scraping (legal for research)
- ✅ Synthetic data generation (last resort)

**Action:** Start with TripAdvisor API, have fallback ready

### 2. Computational Efficiency
- Precompute similarity matrix (N×N where N=100+)
- Store in database or Redis cache
- Update incrementally, not full recalculation

### 3. Cold Start Problem
- New users: Use onboarding seed places
- New places: Use content-based fallback (category, tags)
- New cities: Transfer from similar cities

### 4. Scientific Rigor
- Document all assumptions
- Compare against baselines (random, popularity, V2)
- Use proper evaluation metrics (RMSE, Precision@K)

---

## 🔄 WHAT CHANGES FROM CURRENT SYSTEM?

### Keep (Don't Break):
- ✅ Database schema (places, reviews, users, profiles)
- ✅ Authentication system
- ✅ Review submission UI
- ✅ Map interface
- ✅ Routing structure

### Replace:
- ❌ Category-based onboarding → Place-based onboarding
- ❌ Scoring-based ranking → Collaborative filtering
- ❌ Abstract preferences → Concrete place ratings
- ❌ Single-city → Multi-city

### Add:
- ➕ User similarity calculation
- ➕ Rating matrix
- ➕ City selector
- ➕ Explanation panel
- ➕ Review relevance scoring

---

## 📝 NEXT IMMEDIATE STEPS (This Week)

1. **Day 1-2:** Import Rome, Milan, Florence places from OSM
2. **Day 3-4:** Mine TripAdvisor for cross-city users
3. **Day 5:** Import reviews and verify data quality
4. **Day 6-7:** Build user similarity service

**Then** proceed with collaborative filtering implementation.

---

## 🎓 THESIS ALIGNMENT

**Research Questions:**
1. Can we transfer user preferences across cities using similarity?
2. How does place-based onboarding compare to category-based?
3. How much does reviewer similarity improve review relevance?

**Contributions:**
1. Novel cross-city collaborative filtering approach
2. Minimal onboarding via place-based questions
3. Two-dimensional personalization (users + reviews)

**Evaluation:**
1. Quantitative: RMSE, Precision@K, Coverage
2. Qualitative: User satisfaction, explanation quality
3. Comparative: V2 vs V3, cold start performance

---

## ✅ SUCCESS CRITERIA

**Prototype is complete when:**
- [ ] 100+ users with 10+ reviews across 4 cities in database
- [ ] User similarity calculation working (<1s latency)
- [ ] Collaborative filtering recommender deployed
- [ ] Cross-city recommendations demonstrable (Trento → Rome)
- [ ] Place-based onboarding implemented
- [ ] Evaluation metrics calculated and documented
- [ ] UI polished and user-tested
- [ ] Documentation complete

**MVP Demo scenario:**
1. New user signs up
2. Rates 8 well-known places during onboarding
3. Selects "Rome" as travel destination
4. Sees personalized ranked list with explanations
5. Clicks on place, sees reviews sorted by similarity
6. Leaves own review after visiting
7. System becomes more accurate with more data

---

## 🎯 DELIVERABLES FOR THESIS

1. **Working Prototype** (deployed web app)
2. **Technical Documentation** (architecture, algorithms)
3. **Evaluation Report** (metrics, comparisons, findings)
4. **User Study Results** (if time allows)
5. **Source Code** (GitHub repository)
6. **Demo Video** (5-10 minute walkthrough)

---

**This plan is realistic, achievable, and scientifically rigorous. The biggest risk is data acquisition - tackle that first!**
