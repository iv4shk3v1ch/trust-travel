# Offline Evaluation Summary

Generated on `2026-03-04` with:

```bash
npx tsx scripts/evaluate-recommender-offline.ts
```

Protocol:
- cross-city leave-one-city-out
- target cities: Trento, Milan, Rome, Florence
- `K = 10`
- positive held-out relevance threshold: rating `>= 4`
- eligible case: user has reviews in `>= 2` cities, at least `3` reviews in the held-out city, and at least `5` reviews in the remaining cities

Dataset snapshot used by the evaluator:
- users: `122`
- places: `4968`
- reviews: `9785`
- evaluation cases: `154`

## Overall

| Mode | Coverage | Precision@10 | Recall@10 | HitRate@10 | NDCG@10 | Avg list |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| popular | 1.000 | 0.319 | 0.136 | 0.864 | 0.350 | 10.000 |
| cf_only | 0.955 | 0.196 | 0.080 | 0.701 | 0.217 | 9.545 |
| hybrid | 1.000 | 0.267 | 0.110 | 0.857 | 0.286 | 10.000 |

## By City

### Trento

| Mode | Coverage | Precision@10 | Recall@10 | HitRate@10 | NDCG@10 |
| --- | ---: | ---: | ---: | ---: | ---: |
| popular | 1.000 | 0.281 | 0.203 | 0.813 | 0.401 |
| cf_only | 0.875 | 0.219 | 0.150 | 0.688 | 0.309 |
| hybrid | 1.000 | 0.275 | 0.203 | 0.875 | 0.376 |

### Milan

| Mode | Coverage | Precision@10 | Recall@10 | HitRate@10 | NDCG@10 |
| --- | ---: | ---: | ---: | ---: | ---: |
| popular | 1.000 | 0.298 | 0.145 | 0.773 | 0.342 |
| cf_only | 0.977 | 0.180 | 0.080 | 0.705 | 0.204 |
| hybrid | 1.000 | 0.241 | 0.108 | 0.795 | 0.276 |

### Rome

| Mode | Coverage | Precision@10 | Recall@10 | HitRate@10 | NDCG@10 |
| --- | ---: | ---: | ---: | ---: | ---: |
| popular | 1.000 | 0.261 | 0.063 | 0.889 | 0.279 |
| cf_only | 0.963 | 0.128 | 0.030 | 0.630 | 0.151 |
| hybrid | 1.000 | 0.215 | 0.051 | 0.852 | 0.223 |

### Florence

| Mode | Coverage | Precision@10 | Recall@10 | HitRate@10 | NDCG@10 |
| --- | ---: | ---: | ---: | ---: | ---: |
| popular | 1.000 | 0.438 | 0.199 | 0.950 | 0.436 |
| cf_only | 0.950 | 0.297 | 0.118 | 0.800 | 0.282 |
| hybrid | 1.000 | 0.362 | 0.154 | 0.925 | 0.347 |

## Main Takeaways

- The tuning pass substantially improved both personalized modes under the same evaluator.
- `hybrid` is now much closer to the popularity baseline while preserving full coverage.
- `cf_only` is no longer collapsing; it now recovers meaningful signal in all four cities, though it still trails the stronger baselines.
- `popular` remains the strongest overall mode on the current matrix.
- This is a more useful thesis result: the personalized modes are now competitive enough to compare seriously, even if they still do not surpass the popularity baseline.
