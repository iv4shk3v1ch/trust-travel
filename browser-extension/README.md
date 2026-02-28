# 🌍 TripAdvisor Review Extractor - Chrome Extension

A simple Chrome extension to extract reviews from TripAdvisor user profile pages for Trust Travel data collection.

## Features

- ✅ **One-Click Extraction**: Extract all reviews from a user's city page
- 🚂 **Auto-Filters Transport**: Automatically removes train stations, metros, airports, etc.
- 💾 **JSON Export**: Saves structured data to Downloads folder
- 📊 **Live Stats**: Shows review count and filtered items
- 🎨 **Beautiful UI**: Clean, modern interface

## Installation

### Step 1: Convert SVG Icons to PNG

The extension uses SVG icons, but Chrome requires PNG. Convert them:

**Option A: Online Converter**
1. Go to https://cloudconvert.com/svg-to-png
2. Upload `icon128.svg`, `icon48.svg`, `icon16.svg`
3. Convert each to PNG at their respective sizes (128x128, 48x48, 16x16)
4. Save as `icon128.png`, `icon48.png`, `icon16.png` in `browser-extension` folder

**Option B: Use Command (if you have ImageMagick)**
```bash
magick convert icon128.svg -resize 128x128 icon128.png
magick convert icon48.svg -resize 48x48 icon48.png
magick convert icon16.svg -resize 16x16 icon16.png
```

### Step 2: Load Extension in Chrome

1. Open Chrome and go to: `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **"Load unpacked"**
4. Select the `browser-extension` folder
5. Extension installed! You'll see the 📥 icon in your toolbar

## Usage

### Extracting Reviews from One User

1. **Go to TripAdvisor** (tripadvisor.com)

2. **Find a user profile**:
   - Search for a restaurant/attraction
   - Click on a review
   - Click the reviewer's username

3. **Click their city reviews**:
   - On their profile, you'll see tabs like "Milan (52)", "Rome (34)", etc.
   - Click one city to see all their reviews for that city
   - URL will be: `tripadvisor.com/members-citypage/USERNAME/gCITYID`

4. **Scroll to load all reviews**:
   - TripAdvisor loads reviews lazily
   - Scroll to the bottom to ensure all reviews are visible

5. **Click the extension icon** (📥) in Chrome toolbar

6. **Click "Extract Reviews"** button
   - Extension parses all reviews on the page
   - Filters out transport-related places
   - Saves JSON file to: `Downloads/tripadvisor-reviews/username-city.json`

7. **Repeat for all 122 users!**

### Processing All 122 Users

**Workflow:**
1. Open `milan-users.txt` in another window
2. Copy first URL
3. Paste in Chrome address bar
4. Wait for page to load
5. Scroll to bottom (load all reviews)
6. Click extension → Extract
7. Wait for "✅ Extracted X reviews!" message
8. Move to next URL

**Time Estimate**: ~1 minute per user = ~2 hours total for 122 users

## Output Format

Each extracted file contains:

```json
{
  "user": {
    "username": "Stefano91",
    "cityId": "g187849",
    "city": "Milan"
  },
  "reviews": [
    {
      "placeName": "Duomo di Milano",
      "placeCategory": "Church",
      "rating": 5,
      "reviewText": "Amazing cathedral...",
      "reviewDate": "2025-08-15",
      "rawDateText": "August 2025"
    }
  ],
  "stats": {
    "total": 45,
    "skippedTransport": 3
  },
  "extractedAt": "2026-01-27T10:30:00.000Z",
  "url": "https://www.tripadvisor.com/members-citypage/Stefano91/g187849"
}
```

## Importing to Database

After collecting all JSON files, use the importer script:

```bash
npx tsx scripts/import-json-reviews.ts
```

This script will:
1. Read all JSON files from `Downloads/tripadvisor-reviews/`
2. Check for duplicate users, places, and reviews
3. Map categories to your 18 subcategories
4. Create synthetic user profiles
5. Import to Supabase database

## Troubleshooting

### "Not a User Profile Page" Error
- Make sure you're on the city-specific review page
- URL must be: `tripadvisor.com/members-citypage/USERNAME/gCITYID`
- Not the main profile page

### No Reviews Extracted
- Scroll down to load all reviews first
- Some users have empty city pages (no reviews for that city)
- Try a different user

### Extension Not Appearing
- Go to `chrome://extensions/`
- Make sure extension is enabled
- Check for any error messages
- Try reloading the extension

### Icons Not Showing
- Convert SVG files to PNG (see Installation Step 1)
- Extension works without icons, just looks less polished

## Files Included

```
browser-extension/
├── manifest.json          # Extension configuration
├── content.js            # Review extraction logic
├── popup.html            # Extension popup UI
├── popup.js              # Popup interaction logic
├── icon16.svg/png        # Small icon
├── icon48.svg/png        # Medium icon
├── icon128.svg/png       # Large icon
└── README.md             # This file
```

## Transport Filtering

The extension automatically filters out these types of places:

- Train/railway stations (Centrale, Termini, etc.)
- Metro/subway stations
- Bus stations and terminals
- Airports
- Tram stops
- Transport services (Trenitalia, Italo, etc.)

**Result**: Only real POIs (restaurants, museums, landmarks, etc.) are extracted.

## Next Steps After Collection

1. **Collect 122 users** (~2 hours)
2. **Run importer** to load into database
3. **Verify data** with `verify-rating-matrix.ts`
4. **Build collaborative filtering** (Phase 1)

## Tips for Efficiency

- **Use keyboard shortcuts**: 
  - `Ctrl+T` new tab
  - `Ctrl+V` paste URL
  - `Alt+D` focus address bar
  
- **Keep a checklist**: Mark off users as you process them

- **Take breaks**: Every 20-30 users, take a 5-minute break

- **Check progress**: Files appear in Downloads/tripadvisor-reviews/

## Support

If you encounter issues:
1. Check browser console for errors (F12 → Console)
2. Check extension errors at `chrome://extensions/`
3. Try reloading the extension
4. Make sure you're on the correct page format

---

**Happy extracting! 🚀**

You're collecting valuable data for collaborative filtering. Every review counts!
