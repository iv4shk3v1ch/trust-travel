/**
 * Simple HTML Inspector
 * Run this in browser console (F12) on the TripAdvisor page
 * Copy and paste this entire script into console and press Enter
 */

console.clear();
console.log('='.repeat(80));
console.log('🔍 TRIPADVISOR PAGE INSPECTOR');
console.log('='.repeat(80));
console.log('URL:', window.location.href);
console.log('\n📊 STATISTICS:\n');

// Basic stats
console.log('Total links:', document.querySelectorAll('a').length);
console.log('Links with "Restaurant":', document.querySelectorAll('a[href*="Restaurant"]').length);
console.log('Links with "Attraction":', document.querySelectorAll('a[href*="Attraction"]').length);
console.log('Links with "Review":', document.querySelectorAll('a[href*="Review"]').length);
console.log('Links with "_Review-g":', document.querySelectorAll('a[href*="_Review-g"]').length);
console.log('Divs with "review":', document.querySelectorAll('div[class*="review" i]').length);
console.log('Divs with "card":', document.querySelectorAll('div[class*="card" i]').length);
console.log('Articles:', document.querySelectorAll('article').length);

// Sample links
console.log('\n🔗 SAMPLE LINKS (first 10):');
const allLinks = Array.from(document.querySelectorAll('a')).slice(0, 10);
allLinks.forEach((link, i) => {
  console.log(`${i + 1}. Text: "${link.textContent.trim().substring(0, 50)}" | Href: ${link.href.substring(0, 80)}`);
});

// Look for review-specific elements
console.log('\n🎯 REVIEW-SPECIFIC ELEMENTS:');
const reviewElements = document.querySelectorAll('[data-automation*="review"], [class*="memberReview"], [class*="reviewCard"]');
console.log('Elements with review attributes:', reviewElements.length);

if (reviewElements.length > 0) {
  console.log('\nFirst review element:');
  console.log(reviewElements[0].outerHTML.substring(0, 500));
}

// Check main content area
console.log('\n📦 MAIN CONTENT STRUCTURE:');
const mainContent = document.querySelector('main, #component_2, [role="main"]');
if (mainContent) {
  console.log('Main content found. Children:', mainContent.children.length);
  console.log('First child classes:', mainContent.children[0]?.className);
  console.log('First child HTML:', mainContent.children[0]?.outerHTML.substring(0, 300));
} else {
  console.log('No main content container found');
}

// Look for any elements that might contain place names
console.log('\n🏛️ PLACE NAME CANDIDATES:');
const h3s = document.querySelectorAll('h3, h2, h4');
console.log('Headings found:', h3s.length);
Array.from(h3s).slice(0, 5).forEach((h, i) => {
  console.log(`${i + 1}. ${h.tagName}: "${h.textContent.trim().substring(0, 50)}"`);
});

console.log('\n' + '='.repeat(80));
console.log('✅ Inspection complete! Copy output above and share it.');
console.log('='.repeat(80));
