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
  
  // Valid page - show extract UI
  showExtractUI(tab);
}

function showNotValid() {
  document.getElementById('content').innerHTML = `
    <div class="not-valid">
      <div class="not-valid-icon">⚠️</div>
      <h2>Not a User Profile Page</h2>
      <p>Please navigate to a TripAdvisor user's city review page first.</p>
      <div class="instructions">
        <strong>How to use:</strong>
        1. Go to tripadvisor.com<br>
        2. Find a user profile<br>
        3. Click their city reviews (e.g., "Milan (52)")<br>
        4. Click this extension icon<br>
        5. Extract reviews!
      </div>
    </div>
  `;
}

function showExtractUI(tab) {
  document.getElementById('content').innerHTML = `
    <div class="card">
      <div class="user-info">
        <div class="user-icon">👤</div>
        <div class="user-details">
          <h3 id="username">Loading...</h3>
          <p id="city">Detecting city...</p>
        </div>
      </div>
      
      <button id="extractBtn">
        <span>📥</span>
        <span>Extract Reviews</span>
      </button>
      
      <div class="stats" id="stats" style="display: none;">
        <div class="stat">
          <div class="stat-value" id="reviewCount">0</div>
          <div class="stat-label">Reviews</div>
        </div>
        <div class="stat">
          <div class="stat-value" id="transportCount">0</div>
          <div class="stat-label">Filtered</div>
        </div>
      </div>
      
      <div id="status" style="display: none;"></div>
    </div>
    
    <div class="instructions">
      <strong>💡 Tips:</strong>
      • Scroll down to load all reviews first<br>
      • Extension auto-filters transport places<br>
      • JSON files saved to Downloads folder<br>
      • Process one user at a time
    </div>
  `;
  
  // Extract user info from URL
  const match = tab.url.match(/members-citypage\/([^\/]+)\/(g\d+)/);
  if (match) {
    const cityMap = {
      'g187849': 'Milan',
      'g187791': 'Rome',
      'g187895': 'Florence',
      'g187870': 'Trento'
    };
    
    document.getElementById('username').textContent = match[1];
    document.getElementById('city').textContent = `${cityMap[match[2]] || 'Unknown'} Reviews`;
  }
  
  // Set up extract button
  document.getElementById('extractBtn').addEventListener('click', extractReviews);
  
  // Set up debug button
  if (document.getElementById('debugBtn')) {
    document.getElementById('debugBtn').addEventListener('click', debugPage);
  }
}

async function debugPage() {
  const status = document.getElementById('status');
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Inject debug script
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        console.log('='.repeat(60));
        console.log('🔍 DEBUG PAGE STRUCTURE');
        console.log('='.repeat(60));
        console.log('URL:', window.location.href);
        console.log('Body classes:', document.body.className);
        console.log('');
        console.log('Links to restaurants:', document.querySelectorAll('a[href*="/Restaurant"]').length);
        console.log('Links to attractions:', document.querySelectorAll('a[href*="/Attraction"]').length);
        console.log('Links to hotels:', document.querySelectorAll('a[href*="/Hotel"]').length);
        console.log('');
        console.log('Divs with "review":', document.querySelectorAll('div[class*="review" i]').length);
        console.log('Divs with "card":', document.querySelectorAll('div[class*="card" i]').length);
        console.log('Articles:', document.querySelectorAll('article').length);
        console.log('');
        
        // Sample first restaurant link
        const firstLink = document.querySelector('a[href*="/Restaurant"], a[href*="/Attraction"]');
        if (firstLink) {
          console.log('First place link:', firstLink.href);
          console.log('First place name:', firstLink.textContent.trim());
          console.log('Parent classes:', firstLink.parentElement?.className);
          console.log('Parent HTML:', firstLink.parentElement?.outerHTML.substring(0, 300));
        } else {
          console.log('⚠️ No place links found!');
        }
        console.log('='.repeat(60));
      }
    });
    
    status.className = 'status info';
    status.textContent = '✅ Debug info logged to Console! Press F12 to see.';
    status.style.display = 'block';
    
  } catch (error) {
    status.className = 'status error';
    status.textContent = `❌ ${error.message}`;
    status.style.display = 'block';
  }
}

async function extractReviews() {
  const btn = document.getElementById('extractBtn');
  const status = document.getElementById('status');
  const stats = document.getElementById('stats');
  
  // Disable button and show loading
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner"></div><span>Extracting...</span>';
  status.style.display = 'none';
  
  // Show info message about console
  status.className = 'status info';
  status.textContent = '🔍 Check browser console (F12) for debug info...';
  status.style.display = 'block';
  
  try {
    // Get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Send message to content script
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractReviews' });
    
    // Check if we got a response
    if (!response) {
      throw new Error('No response from content script. Try reloading the page.');
    }
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    currentData = response;
    
    // Show stats
    stats.style.display = 'grid';
    document.getElementById('reviewCount').textContent = response.stats.total;
    document.getElementById('transportCount').textContent = response.stats.skippedTransport;
    
    if (response.stats.total === 0) {
      // No reviews found - show debug info
      status.className = 'status error';
      status.innerHTML = `
        ⚠️ No reviews extracted!<br><br>
        <strong>Debug:</strong><br>
        • Press F12 to open Console<br>
        • Look for [Extractor] logs<br>
        • Check if selectors matched<br>
        • Try scrolling down first<br>
      `;
      status.style.display = 'block';
      
      btn.disabled = false;
      btn.innerHTML = '<span>🔄</span><span>Try Again</span>';
      return;
    }
    
    // Save to file
    const filename = `${response.user.username}-${response.user.city.toLowerCase()}.json`;
    const blob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    await chrome.downloads.download({
      url: url,
      filename: `tripadvisor-reviews/${filename}`,
      saveAs: false
    });
    
    // Show success
    status.className = 'status success';
    status.textContent = `✅ Extracted ${response.stats.total} reviews! Saved to Downloads/tripadvisor-reviews/${filename}`;
    status.style.display = 'block';
    
    // Re-enable button
    btn.disabled = false;
    btn.innerHTML = '<span>✓</span><span>Extract Again</span>';
    
  } catch (error) {
    console.error('Extraction error:', error);
    
    status.className = 'status error';
    status.textContent = `❌ Error: ${error.message}`;
    status.style.display = 'block';
    
    btn.disabled = false;
    btn.innerHTML = '<span>🔄</span><span>Try Again</span>';
  }
}

// Initialize
checkCurrentTab();
