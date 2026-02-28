/**
 * Aggressive HTML Dumper
 * Run this in console to see the ACTUAL HTML structure of reviews
 */

console.clear();
console.log('🔍 FINDING VISIBLE REVIEWS ON PAGE\n');

// Get all visible text on the page
const allElements = document.querySelectorAll('*');
const reviewCandidates = [];

// Look for elements that contain substantial text (likely review text)
allElements.forEach(el => {
  const text = el.textContent?.trim() || '';
  const ownText = Array.from(el.childNodes)
    .filter(node => node.nodeType === 3) // Text nodes only
    .map(node => node.textContent.trim())
    .join(' ');
  
  // If this element has text between 20-500 chars, it might be a review
  if (text.length > 20 && text.length < 500 && el.children.length < 10) {
    reviewCandidates.push({
      tag: el.tagName,
      class: el.className,
      text: text.substring(0, 100),
      html: el.outerHTML.substring(0, 400)
    });
  }
});

console.log(`Found ${reviewCandidates.length} text elements that might be reviews\n`);

// Show first 5
reviewCandidates.slice(0, 5).forEach((item, i) => {
  console.log(`${i + 1}. <${item.tag}> class="${item.class}"`);
  console.log(`   Text: "${item.text}..."`);
  console.log(`   HTML: ${item.html}...\n`);
});

console.log('\n📍 LOOKING FOR PLACE NAMES (headings/links):\n');

// Find all elements with text that might be place names (short text, 3-50 chars)
const placeNameCandidates = [];
allElements.forEach(el => {
  const text = el.textContent?.trim() || '';
  // Skip if has children (we want leaf nodes)
  if (el.children.length > 0) return;
  // Must be reasonable length for a place name
  if (text.length < 3 || text.length > 80) return;
  // Skip common UI text
  if (['See all', 'Hotels', 'Restaurants', 'Things to do', 'Photos', 'Reviews'].includes(text)) return;
  
  placeNameCandidates.push({
    tag: el.tagName,
    class: el.className,
    text: text,
    parent: el.parentElement?.tagName,
    parentClass: el.parentElement?.className
  });
});

console.log(`Found ${placeNameCandidates.length} potential place names\n`);

// Show first 20
placeNameCandidates.slice(0, 20).forEach((item, i) => {
  console.log(`${i + 1}. "${item.text}"`);
  console.log(`   Tag: <${item.tag}> class="${item.class}"`);
  console.log(`   Parent: <${item.parent}> class="${item.parentClass}"\n`);
});

console.log('\n⭐ LOOKING FOR RATINGS:\n');

// Find elements that might be ratings
const ratingCandidates = Array.from(document.querySelectorAll('svg, [class*="bubble"], [class*="rating"], [class*="star"], [aria-label*="circle"]'));
console.log(`Found ${ratingCandidates.length} potential rating elements\n`);

ratingCandidates.slice(0, 5).forEach((item, i) => {
  console.log(`${i + 1}. <${item.tagName}> class="${item.className}"`);
  console.log(`   aria-label: "${item.getAttribute('aria-label')}"`);
  console.log(`   HTML: ${item.outerHTML.substring(0, 200)}...\n`);
});

console.log('\n✅ INSPECTION COMPLETE - Share all output above!');
