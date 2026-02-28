/**
 * HTML Debug Script - Save TripAdvisor Profile Page
 * 
 * This saves a single user's profile HTML so we can inspect selectors.
 */

import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import * as fs from 'fs';
import * as path from 'path';

puppeteerExtra.use(StealthPlugin());

async function saveUserHTML(url: string, filename: string) {
  console.log(`📥 Fetching: ${url}`);
  
  const browser = await puppeteerExtra.launch({ 
    headless: false,  // Show browser for debugging
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
  
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });
  
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise(resolve => setTimeout(resolve, 3000)); // Let everything load
  
  const html = await page.content();
  
  // Save HTML
  fs.writeFileSync(
    path.join(__dirname, filename),
    html,
    'utf-8'
  );
  
  console.log(`✅ Saved to: ${filename}`);
  console.log(`📄 Size: ${(html.length / 1024).toFixed(2)} KB`);
  
  await browser.close();
}

// Test URL
const testUrl = 'https://www.tripadvisor.com/members-citypage/Stefano91/g187849';
saveUserHTML(testUrl, 'tripadvisor-page-sample.html').catch(console.error);
