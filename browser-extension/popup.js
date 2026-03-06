/**
 * Popup Script - UI logic for the extension popup
 */

let currentData = null;

async function checkCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab.url || !tab.url.includes('tripadvisor.com/members-citypage/')) {
    showNotValid();
    return;
  }

  showExtractUI(tab);
}

function showNotValid() {
  document.getElementById('content').innerHTML = `
    <div class="not-valid">
      <div class="not-valid-icon">!</div>
      <h2>Not a User Profile Page</h2>
      <p>Please navigate to a TripAdvisor user's city review page first.</p>
      <div class="instructions">
        <strong>How to use:</strong>
        1. Go to tripadvisor.com<br>
        2. Find a user profile<br>
        3. Click their city reviews (for example, Milan)<br>
        4. Click this extension icon<br>
        5. Extract reviews
      </div>
    </div>
  `;
}

function showExtractUI(tab) {
  document.getElementById('content').innerHTML = `
    <div class="card">
      <div class="user-info">
        <div class="user-icon">User</div>
        <div class="user-details">
          <h3 id="username">Loading...</h3>
          <p id="city">Detecting city...</p>
        </div>
      </div>

      <button id="extractBtn">
        <span>Extract</span>
      </button>

      <div class="stats" id="stats" style="display: none;">
        <div class="stat">
          <div class="stat-value" id="reviewCount">0</div>
          <div class="stat-label">Reviews</div>
        </div>
        <div class="stat">
          <div class="stat-value" id="filteredCount">0</div>
          <div class="stat-label">Skipped</div>
        </div>
      </div>

      <div id="status" style="display: none;"></div>
    </div>

    <div class="instructions">
      <strong>Tips:</strong>
      - Extension prefers the reviews list when available<br>
      - It auto-scrolls to load more rows or contributions<br>
      - Non-review and duplicate tiles are removed automatically<br>
      - JSON files are saved to the Downloads folder<br>
      - Process one user at a time
    </div>
  `;

  const match = tab.url.match(/members-citypage\/([^\/]+)\/(g\d+)/);
  if (match) {
    const cityMap = {
      g187849: 'Milan',
      g187791: 'Rome',
      g187895: 'Florence',
      g187861: 'Trento'
    };

    document.getElementById('username').textContent = match[1];
    document.getElementById('city').textContent = `${cityMap[match[2]] || 'Unknown'} Reviews`;
  }

  document.getElementById('extractBtn').addEventListener('click', extractReviews);
}

async function extractReviews() {
  const btn = document.getElementById('extractBtn');
  const status = document.getElementById('status');
  const stats = document.getElementById('stats');

  btn.disabled = true;
  btn.innerHTML = '<div class="spinner"></div><span>Extracting...</span>';
  status.style.display = 'none';

  status.className = 'status info';
  status.textContent = 'Running extraction...';
  status.style.display = 'block';

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractReviews' });

    if (!response) {
      throw new Error('No response from content script. Try reloading the page.');
    }

    if (response.error) {
      throw new Error(response.error);
    }

    currentData = response;

    stats.style.display = 'grid';
    document.getElementById('reviewCount').textContent = response.stats.total;
    document.getElementById('filteredCount').textContent =
      (response.stats.skippedNonReview || 0) + (response.stats.duplicatesRemoved || 0);

    if (response.stats.total === 0) {
      status.className = 'status error';
      status.innerHTML = `
        No reviews extracted.<br><br>
        <strong>Debug:</strong><br>
        - Reload the page and try again<br>
        - Make sure this is a user city reviews page<br>
        - Open DevTools if you need selector debugging<br>
      `;
      status.style.display = 'block';

      btn.disabled = false;
      btn.innerHTML = '<span>Try Again</span>';
      return;
    }

    const filename = `${response.user.username}-${response.user.city.toLowerCase()}.json`;
    const blob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    await chrome.downloads.download({
      url,
      filename: `tripadvisor-reviews/${filename}`,
      saveAs: false
    });

    status.className = 'status success';
    status.textContent =
      `Extracted ${response.stats.total} reviews ` +
      `(removed ${response.stats.duplicatesRemoved || 0} duplicates, ` +
      `skipped ${response.stats.skippedNonReview || 0} non-review tiles, ` +
      `mode: ${response.sourceMode || 'unknown'}). ` +
      `Saved to Downloads/tripadvisor-reviews/${filename}`;
    status.style.display = 'block';

    btn.disabled = false;
    btn.innerHTML = '<span>Extract Again</span>';
  } catch (error) {
    console.error('Extraction error:', error);

    status.className = 'status error';
    status.textContent = `Error: ${error.message}`;
    status.style.display = 'block';

    btn.disabled = false;
    btn.innerHTML = '<span>Try Again</span>';
  }
}

checkCurrentTab();
