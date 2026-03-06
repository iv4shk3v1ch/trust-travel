/**
 * Content Script - Extracts TripAdvisor review contributions from user city pages.
 * Runs on: https://www.tripadvisor.com/members-citypage/USERNAME/gCITYID
 */

console.log('[TripAdvisor Extractor] Review extractor loaded');

const REVIEW_ROW_SELECTOR = '.listRow[data-ox-name*="ReviewsList"]';
const TILE_SELECTOR = '.contributionsTile';
const PLACE_SELECTOR = '.tileContent .placeName';
const RATING_SELECTOR = '.tileContent .ui_bubble_rating, .tileContent [class*="ui_bubble_rating"], .tileContent .ratingBubbles span, .tileContent [class*="bubble_"]';
const DATE_SELECTOR = '.tileContent .ratingTimestamp, .tileContent [class*="ratingTimestamp"], .tileContent time';
const REVIEW_TEXT_SELECTOR = '.tileContent .reviewText, .tileContent .reviewContent .reviewText, .tileContent .reviewContent';
const CATEGORY_SELECTOR = '.tileContent [class*="category"], .tileContent [class*="cuisine"], .tileContent [class*="type"], .tileContent [class*="detail"]';

const MONTH_MAP = {
  jan: '01',
  feb: '02',
  mar: '03',
  apr: '04',
  may: '05',
  jun: '06',
  jul: '07',
  aug: '08',
  sep: '09',
  oct: '10',
  nov: '11',
  dec: '12'
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function normalizeWhitespace(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

function extractUserAndCity() {
  const url = window.location.href;
  const match = url.match(/members-citypage\/([^\/]+)\/(g\d+)/);
  if (!match) return null;

  const cityMap = {
    g187849: 'Milan',
    g187791: 'Rome',
    g187895: 'Florence',
    g187861: 'Trento'
  };

  return {
    username: match[1],
    cityId: match[2],
    city: cityMap[match[2]] || 'Unknown'
  };
}

function parseRatingFromClass(className) {
  if (!className) return null;
  const match = className.match(/bubble[_-]?(\d)(\d)?/i);
  if (!match) return null;

  const first = parseInt(match[1], 10);
  const second = match[2] ? parseInt(match[2], 10) : null;

  if (second === null) return first;
  const value = (first * 10 + second) / 10;
  return Math.round(value);
}

function parseDate(dateText) {
  if (!dateText) return null;

  const cleaned = normalizeWhitespace(dateText).replace(/^Posted\s+/i, '');
  const parts = cleaned.match(/^([A-Za-z]{3,})\s+(\d{1,2}),\s+(\d{4})$/);
  if (parts) {
    const month = MONTH_MAP[parts[1].slice(0, 3).toLowerCase()];
    const day = parts[2].padStart(2, '0');
    const year = parts[3];
    if (month) return `${year}-${month}-${day}`;
  }

  const parsed = new Date(cleaned);
  if (!isNaN(parsed.getTime())) {
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return null;
}

function extractCategory(tile) {
  const categoryEl = tile.querySelector(CATEGORY_SELECTOR);
  if (categoryEl) {
    const text = normalizeWhitespace(categoryEl.textContent);
    if (text) return text;
  }

  const link = tile.querySelector('.tileContent a[href]');
  const href = link?.getAttribute('href') || '';
  if (/Restaurant_Review/i.test(href)) return 'Restaurant';
  if (/Attraction_Review/i.test(href)) return 'Attraction';
  if (/Hotel_Review/i.test(href)) return 'Hotel';

  return '';
}

function extractReviewText(tile) {
  const textEl = tile.querySelector(REVIEW_TEXT_SELECTOR);
  if (!textEl) return '';

  let reviewText = normalizeWhitespace(textEl.textContent);
  reviewText = reviewText.replace(/\s*read less\s*$/i, '').trim();
  return reviewText;
}

function extractTitleText(row) {
  const titleEl = row.querySelector('.titleCol .viewReview, .titleCol .listLink');
  return normalizeWhitespace(titleEl?.textContent || '');
}

function looksLikeReviewTile(tile) {
  const placeName = normalizeWhitespace(tile.querySelector(PLACE_SELECTOR)?.textContent);
  const rawDateText = normalizeWhitespace(tile.querySelector(DATE_SELECTOR)?.textContent);
  const ratingClass = tile.querySelector(RATING_SELECTOR)?.className || '';
  const reviewText = extractReviewText(tile);

  if (!placeName) return false;
  if (rawDateText && ratingClass) return true;
  if (reviewText) return true;

  return false;
}

function buildReviewFromTile(tile) {
  const placeName = normalizeWhitespace(tile.querySelector(PLACE_SELECTOR)?.textContent);
  if (!placeName) return null;

  const ratingClass = tile.querySelector(RATING_SELECTOR)?.className || '';
  const rating = parseRatingFromClass(ratingClass) || 3;

  const rawDateText = normalizeWhitespace(tile.querySelector(DATE_SELECTOR)?.textContent);
  const reviewDate = parseDate(rawDateText) || new Date().toISOString().split('T')[0];

  return {
    placeName,
    placeCategory: extractCategory(tile),
    rating,
    reviewText: extractReviewText(tile),
    reviewDate,
    rawDateText
  };
}

function buildReviewFromRow(row) {
  const placeName = normalizeWhitespace(row.querySelector('.locationCol')?.textContent);
  if (!placeName) return null;

  const ratingClass = row.querySelector('.ratingCol .ui_bubble_rating, .ratingCol [class*="bubble_"]')?.className || '';
  const rating = parseRatingFromClass(ratingClass) || 3;

  const rawDateText = normalizeWhitespace(row.querySelector('.dateCol')?.textContent);
  const reviewDate = parseDate(rawDateText) || new Date().toISOString().split('T')[0];
  const reviewTitle = extractTitleText(row);

  return {
    placeName,
    placeCategory: '',
    rating,
    reviewText: reviewTitle,
    reviewDate,
    rawDateText,
    reviewUrl: row.querySelector('.titleCol .viewReview, .titleCol .listLink')?.getAttribute('href') || ''
  };
}

function dedupeReviews(reviews) {
  const seen = new Set();
  const unique = [];
  let duplicatesRemoved = 0;

  for (const review of reviews) {
    const key = [
      review.placeName.toLowerCase(),
      review.reviewDate,
      review.rating,
      (review.reviewText || '').toLowerCase()
    ].join('|');

    if (seen.has(key)) {
      duplicatesRemoved += 1;
      continue;
    }

    seen.add(key);
    unique.push(review);
  }

  return { unique, duplicatesRemoved };
}

async function autoScrollContributions() {
  let previousCount = 0;
  let stablePasses = 0;

  for (let attempt = 0; attempt < 40; attempt += 1) {
    const currentCount = document.querySelectorAll(TILE_SELECTOR).length;
    window.scrollTo(0, document.body.scrollHeight);
    await sleep(700);

    const nextCount = document.querySelectorAll(TILE_SELECTOR).length;
    if (nextCount <= previousCount && nextCount <= currentCount) {
      stablePasses += 1;
    } else {
      stablePasses = 0;
      previousCount = nextCount;
    }

    if (stablePasses >= 3) break;
  }

  window.scrollTo(0, 0);
  await sleep(200);
}

async function autoScrollReviewRows() {
  let previousCount = 0;
  let stablePasses = 0;

  for (let attempt = 0; attempt < 40; attempt += 1) {
    const currentCount = document.querySelectorAll(REVIEW_ROW_SELECTOR).length;
    window.scrollTo(0, document.body.scrollHeight);
    await sleep(500);

    const nextCount = document.querySelectorAll(REVIEW_ROW_SELECTOR).length;
    if (nextCount <= previousCount && nextCount <= currentCount) {
      stablePasses += 1;
    } else {
      stablePasses = 0;
      previousCount = nextCount;
    }

    if (stablePasses >= 3) break;
  }

  window.scrollTo(0, 0);
  await sleep(200);
}

async function extractReviews() {
  try {
    const userInfo = extractUserAndCity();
    if (!userInfo) {
      return { error: 'Not a valid user profile page' };
    }

    const reviewRows = Array.from(document.querySelectorAll(REVIEW_ROW_SELECTOR));
    if (reviewRows.length > 0) {
      await autoScrollReviewRows();

      const rows = Array.from(document.querySelectorAll(REVIEW_ROW_SELECTOR));
      const rawReviews = rows
        .map(buildReviewFromRow)
        .filter(Boolean);

      const { unique, duplicatesRemoved } = dedupeReviews(rawReviews);

      return {
        user: userInfo,
        reviews: unique,
        stats: {
          total: unique.length,
          totalRows: rows.length,
          rawMatches: rawReviews.length,
          duplicatesRemoved,
          skippedNonReview: 0,
          skippedTransport: 0
        },
        extractedAt: new Date().toISOString(),
        url: window.location.href,
        sourceMode: 'reviews-list'
      };
    }

    await autoScrollContributions();

    const tiles = Array.from(document.querySelectorAll(TILE_SELECTOR));
    const rawReviews = [];
    let skippedNonReview = 0;

    for (const tile of tiles) {
      if (!looksLikeReviewTile(tile)) {
        skippedNonReview += 1;
        continue;
      }

      const review = buildReviewFromTile(tile);
      if (review) {
        rawReviews.push(review);
      } else {
        skippedNonReview += 1;
      }
    }

    const { unique, duplicatesRemoved } = dedupeReviews(rawReviews);

    return {
      user: userInfo,
      reviews: unique,
      stats: {
        total: unique.length,
        totalTiles: tiles.length,
        rawMatches: rawReviews.length,
        duplicatesRemoved,
        skippedNonReview,
        skippedTransport: 0
      },
      extractedAt: new Date().toISOString(),
      url: window.location.href,
      sourceMode: 'contributions-grid'
    };
  } catch (error) {
    return {
      error: error.message || 'Unknown error',
      stack: error.stack,
      user: null,
      reviews: [],
      stats: {
        total: 0,
        totalTiles: 0,
        rawMatches: 0,
        duplicatesRemoved: 0,
        skippedNonReview: 0,
        skippedTransport: 0
      }
    };
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractReviews') {
    extractReviews()
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ error: error.message || 'Unknown error', stack: error.stack }));
    return true;
  }
  return true;
});
