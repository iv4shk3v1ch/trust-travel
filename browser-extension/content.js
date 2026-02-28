/**
 * Minimal Content Script - Extracts review metadata from TripAdvisor user city pages
 * Runs on: https://www.tripadvisor.com/members-citypage/USERNAME/gCITYID
 */

console.log('[TripAdvisor Extractor] Minimal content script loaded');

const PLACE_SELECTOR = '.placeName';
const RATING_SELECTOR = '.ui_bubble_rating, [class*="ui_bubble_rating"], .ratingBubbles span, [class*="bubble_"]';
const DATE_SELECTOR = '.ratingTimestamp, [class*="ratingTimestamp"], time';
const CATEGORY_SELECTOR = '[class*="category"], [class*="cuisine"], [class*="type"], [class*="detail"]';
const REVIEW_TEXT_SELECTOR = '.reviewText, .reviewContent .reviewText, .reviewContent';

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

function extractUserAndCity() {
  const url = window.location.href;
  const match = url.match(/members-citypage\/([^\/]+)\/(g\d+)/);
  if (!match) return null;

  const cityMap = {
    g187849: 'Milan',
    g187791: 'Rome',
    g187895: 'Florence',
    g187870: 'Trento'
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

  const cleaned = dateText.replace(/^Posted\s+/i, '').trim();
  const parts = cleaned.match(/^([A-Za-z]{3,})\s+(\d{1,2}),\s+(\d{4})$/);
  if (parts) {
    const month = MONTH_MAP[parts[1].slice(0, 3).toLowerCase()];
    const day = parts[2].padStart(2, '0');
    const year = parts[3];
    if (month) {
      return `${year}-${month}-${day}`;
    }
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

function normalizeWhitespace(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

function findReviewContainer(startEl) {
  let node = startEl;
  for (let depth = 0; depth < 8 && node; depth += 1) {
    if (node.querySelector) {
      const hasRating = node.querySelector(RATING_SELECTOR);
      const hasDate = node.querySelector(DATE_SELECTOR);
      if (hasRating || hasDate) {
        return node;
      }
    }
    node = node.parentElement;
  }
  return startEl.closest('.tileContent') || startEl.closest('.contributionsTile') || startEl.closest('div') || startEl.parentElement;
}

function extractCategory(container) {
  if (!container) return '';
  const categoryEl = container.querySelector(CATEGORY_SELECTOR);
  if (categoryEl) {
    const text = categoryEl.textContent.trim();
    if (text) return text;
  }

  const link = container.querySelector('a[href]');
  const href = link?.getAttribute('href') || '';
  if (/Restaurant_Review/i.test(href)) return 'Restaurant';
  if (/Attraction_Review/i.test(href)) return 'Attraction';
  if (/Hotel_Review/i.test(href)) return 'Hotel';

  return '';
}

function extractReviewText(container) {
  if (!container) return '';

  const textEl = container.querySelector(REVIEW_TEXT_SELECTOR);
  if (!textEl) return '';

  let reviewText = normalizeWhitespace(textEl.textContent);
  reviewText = reviewText.replace(/\s*read less\s*$/i, '').trim();
  return reviewText;
}

async function extractReviews() {
  try {
    const userInfo = extractUserAndCity();
    if (!userInfo) {
      return { error: 'Not a valid user profile page' };
    }

    const placeNodes = Array.from(document.querySelectorAll(PLACE_SELECTOR));
    const reviews = [];

    for (const placeEl of placeNodes) {
      const placeName = placeEl.textContent.trim();
      if (!placeName) continue;

      const container = findReviewContainer(placeEl);
      const ratingEl = container?.querySelector(RATING_SELECTOR);
      const rating = parseRatingFromClass(ratingEl?.className || '') || 3;

      const dateEl = container?.querySelector(DATE_SELECTOR);
      const rawDateText = dateEl?.textContent.trim() || '';
      const reviewDate = parseDate(rawDateText) || new Date().toISOString().split('T')[0];

      const placeCategory = extractCategory(container);
      const reviewText = extractReviewText(container);

      reviews.push({
        placeName,
        placeCategory,
        rating,
        reviewText,
        reviewDate,
        rawDateText
      });
    }

    return {
      user: userInfo,
      reviews,
      stats: { total: reviews.length },
      extractedAt: new Date().toISOString(),
      url: window.location.href
    };
  } catch (error) {
    return {
      error: error.message || 'Unknown error',
      stack: error.stack,
      user: null,
      reviews: [],
      stats: { total: 0 }
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
