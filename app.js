/**
 * PirateRuler.com Typing Test - Main Application Logic
 * Vanilla JavaScript, no frameworks. Offline-first with localStorage persistence.
 * Features: Real-time WPM, accuracy, error heatmaps, keyboard visualizer, export CSV
 * External APIs: https://baconipsum.com/api/?type=meat-and-filler&paras=1 (with fallbacks)
 */

// Global state
const App = {
  isTestRunning: false,
  isPaused: false,
  startTime: null,
  elapsedTime: 0,
  timerDuration: 30,
  currentPassage: '',
  currentIndex: 0,
  errors: 0,
  correctChars: 0,
  totalChars: 0,
  errorMap: new Map(),
  settings: {
    theme: 'dark',
    showKeyboard: true,
    enableSound: false,
    language: 'en'
  },
  // Built-in fallback passages (offline support)
  fallbackPassages: {
    short: "The quick brown fox jumps over the lazy dog.",
    medium: "Typing is a skill that improves with consistent practice. Focus on accuracy first, then speed will follow naturally.",
    long: "In the digital age, typing proficiency is essential for productivity. This comprehensive test measures your words per minute, character accuracy, and provides detailed heatmaps of your performance. Regular practice sessions help build muscle memory and improve finger dexterity across all keys."
  }
};

// DOM Elements
const DOM = {
  // Theme and Menu
  themeToggle: document.getElementById('theme-toggle'),
  menuToggle: document.getElementById('menu-toggle'),
  closeMenu: document.getElementById('close-menu'),
  offCanvasMenu: document.getElementById('off-canvas-menu'),
  
  // Test elements
  passageText: document.getElementById('passage-text'),
  typingInput: document.getElementById('typing-input'),
  startBtn: document.getElementById('start-btn'),
  pauseBtn: document.getElementById('pause-btn'),
  restartBtn: document.getElementById('restart-btn'),
  randomPassage: document.getElementById('random-passage'),
  
  // Controls
  passageLengths: document.querySelectorAll('input[name="passage-length"]'),
  customPassageInput: document.getElementById('custom-passage-input'),
  customText: document.getElementById('custom-text'),
  useCustom: document.getElementById('use-custom'),
  timerControls: document.querySelectorAll('input[name="timer"]'),
  customTimer: document.getElementById('custom-timer'),
  
  // Stats
  wpmGross: document.getElementById('wpm-gross'),
  wpmNet: document.getElementById('wpm-net'),
  accuracy: document.getElementById('accuracy'),
  charsTyped: document.getElementById('chars-typed'),
  errorCount: document.getElementById('error-count'),
  correctChars: document.getElementById('correct-chars'),
  elapsedTime: document.getElementById('elapsed-time'),
  remainingTime: document.getElementById('remaining-time'),
  
  // Options
  showKeyboard: document.getElementById('show-keyboard'),
  enableSound: document.getElementById('enable-sound'),
  languageSelect: document.getElementById('language-select'),
  
  // Keyboard and heatmap
  keyboardViz: document.getElementById('keyboard-viz'),
  keyboardContainer: document.getElementById('keyboard-container'),
  heatmapContainer: document.getElementById('heatmap-container'),
  clearHeatmap: document.getElementById('clear-heatmap'),
  
  // Results modal
  resultsModal: document.getElementById('results-modal'),
  closeModal: document.getElementById('close-modal'),
  resultsContent: document.getElementById('results-content'),
  exportCsv: document.getElementById('export-csv'),
  shareResults: document.getElementById('share-results'),
  tryAgain: document.getElementById('try-again'),
  
  // Landing page
  scrollToFaq: document.getElementById('scroll-to-faq')
};

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  initializeEventListeners();
  initializeKeyboard();
  loadHeatmap();
  renderPassage();
});

/**
 * Load user settings from localStorage
 */
function loadSettings() {
  const saved = localStorage.getItem('typingTestSettings');
  if (saved) {
    App.settings = { ...App.settings, ...JSON.parse(saved) };
  }
  
  // Apply theme
  if (App.settings.theme === 'light') {
    document.documentElement.style.setProperty('--color-bg-primary', '#ffffff');
    document.documentElement.style.setProperty('--color-text-primary', '#000000');
  }
  
  // Apply options
  DOM.showKeyboard.checked = App.settings.showKeyboard;
  DOM.enableSound.checked = App.settings.enableSound;
  DOM.languageSelect.value = App.settings.language;
  
  // Load heatmap data
  const heatmapData = localStorage.getItem('typingHeatmap');
  if (heatmapData) {
    App.errorMap = new Map(JSON.parse(heatmapData));
  }
}

/**
 * Save settings to localStorage
 */
function saveSettings() {
  localStorage.setItem('typingTestSettings', JSON.stringify(App.settings));
}

/**
 * Load or generate heatmap
 */
function loadHeatmap() {
  if (App.errorMap.size === 0) {
    // Initialize with common keys
    'abcdefghijklmnopqrstuvwxyz'.split('').forEach(key => {
      App.errorMap.set(key, 0);
    });
    '1234567890'.split('').forEach(key => {
      App.errorMap.set(key, 0);
    });
  }
  renderHeatmap();
}

/**
 * Initialize all event listeners
 */
function initializeEventListeners() {
  // Theme toggle
  DOM.themeToggle.addEventListener('click', toggleTheme);
  
  // Menu
  DOM.menuToggle.addEventListener('click', () => openMenu());
  DOM.closeMenu.addEventListener('click', closeMenu);
  
  // Test controls
  DOM.startBtn.addEventListener('click', startTest);
  DOM.pauseBtn.addEventListener('click', pauseTest);
  DOM.restartBtn.addEventListener('click', restartTest);
  DOM.randomPassage.addEventListener('click', fetchRandomPassage);
  
  // Passage selection
  DOM.passageLengths.forEach(radio => {
    radio.addEventListener('change', handlePassageLengthChange);
  });
  
  DOM.useCustom.addEventListener('click', useCustomPassage);
  
  // Timer controls
  DOM.timerControls.forEach(radio => {
    radio.addEventListener('change', handleTimerChange);
  });
  
  // Typing input
  DOM.typingInput.addEventListener('input', handleTyping);
  DOM.typingInput.addEventListener('keydown', handleKeydown);
  
  // Options
  DOM.showKeyboard.addEventListener('change', toggleKeyboard);
  DOM.enableSound.addEventListener('change', (e) => {
    App.settings.enableSound = e.target.checked;
    saveSettings();
  });
  DOM.languageSelect.addEventListener('change', (e) => {
    App.settings.language = e.target.value;
    saveSettings();
  });
  
  // Heatmap
  DOM.clearHeatmap.addEventListener('click', clearHeatmap);
  
  // Modal
  DOM.closeModal.addEventListener('click', closeResultsModal);
  DOM.exportCsv.addEventListener('click', exportCSV);
  DOM.shareResults.addEventListener('click', shareResults);
  DOM.tryAgain.addEventListener('click', () => {
    closeResultsModal();
    restartTest();
  });
  
  // Landing page
  if (DOM.scrollToFaq) {
    DOM.scrollToFaq.addEventListener('click', () => {
      document.querySelector('.features-section')?.scrollIntoView({ behavior: 'smooth' });
    });
  }
  
  // Close menu on outside click
  document.addEventListener('click', (e) => {
    if (!DOM.offCanvasMenu.contains(e.target) && !DOM.menuToggle.contains(e.target)) {
      closeMenu();
    }
  });
  
  // Keyboard events for visualizer
  document.addEventListener('keydown', (e) => updateKeyboardVisualizer(e.code, true));
  document.addEventListener('keyup', (e) => updateKeyboardVisualizer(e.code, false));
}

/**
 * Toggle theme and save preference
 */
function toggleTheme() {
  const isDark = getComputedStyle(document.documentElement)
    .getPropertyValue('--color-bg-primary').trim() === '#000000';
  
  if (isDark) {
    document.documentElement.style.setProperty('--color-bg-primary', '#ffffff');
    document.documentElement.style.setProperty('--color-text-primary', '#000000');
    App.settings.theme = 'light';
  } else {
    document.documentElement.style.setProperty('--color-bg-primary', '#000000');
    document.documentElement.style.setProperty('--color-text-primary', '#ffffff');
    App.settings.theme = 'dark';
  }
  
  saveSettings();
}

/**
 * Menu controls
 */
function openMenu() {
  DOM.offCanvasMenu.setAttribute('aria-hidden', 'false');
  DOM.offCanvasMenu.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
}

function closeMenu() {
  DOM.offCanvasMenu.setAttribute('aria-hidden', 'true');
  DOM.offCanvasMenu.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

/**
 * Handle passage length selection
 */
function handlePassageLengthChange(e) {
  if (e.target.value === 'custom') {
    DOM.customPassageInput.hidden = false;
  } else {
    DOM.customPassageInput.hidden = true;
    renderPassage();
  }
}

/**
 * Use custom passage
 */
function useCustomPassage() {
  const text = DOM.customText.value.trim();
  if (text) {
    App.currentPassage = text;
    renderPassage();
    DOM.customPassageInput.hidden = true;
    document.querySelector('input[name="passage-length"][value="custom"]').checked = true;
  }
}

/**
 * Handle timer change
 */
function handleTimerChange(e) {
  if (e.target.value === 'custom') {
    DOM.customTimer.hidden = false;
    DOM.customTimer.focus();
  } else {
    DOM.customTimer.hidden = true;
    App.timerDuration = parseInt(e.target.value);
    DOM.remainingTime.textContent = `${App.timerDuration}s`;
  }
}

/**
 * Fetch random passage from API with fallback
 */
async function fetchRandomPassage() {
  try {
    const response = await fetch('https://baconipsum.com/api/?type=meat-and-filler&paras=1&format=text');
    if (!response.ok) throw new Error('API failed');
    
    const text = await response.text();
    App.currentPassage = text.trim().substring(0, 500); // Limit length
    renderPassage();
    
    // Update UI to indicate random passage
    DOM.passageLengths.forEach(radio => radio.checked = false);
  } catch (error) {
    console.warn('Failed to fetch random passage:', error);
    // Use fallback passage
    App.currentPassage = App.fallbackPassages.medium;
    renderPassage();
  }
}

/**
 * Render passage with character spans
 */
function renderPassage() {
  const length = document.querySelector('input[name="passage-length"]:checked')?.value;
  
  if (!App.currentPassage || !length) {
    App.currentPassage = App.fallbackPassages.medium;
  }
  
  // Clear previous
  DOM.passageText.innerHTML = '';
  
  // Create character spans
  App.currentPassage.split('').forEach((char, index) => {
    const span = document.createElement('span');
    span.className = 'char';
    span.textContent = char === ' ' ? '\u00A0' : char; // Use non-breaking space
    span.dataset.index = index;
    DOM.passageText.appendChild(span);
  });
  
  // Reset test state
  App.currentIndex = 0;
  App.errors = 0;
  App.correctChars = 0;
  App.totalChars = App.currentPassage.length;
}

/**
 * Start test
 */
function startTest() {
  App.isTestRunning = true;
  App.isPaused = false;
  App.startTime = Date.now() - App.elapsedTime;
  
  // Enable input and focus
  DOM.typingInput.disabled = false;
  DOM.typingInput.value = '';
  DOM.typingInput.focus();
  
  // Update buttons
  DOM.startBtn.disabled = true;
  DOM.pauseBtn.disabled = false;
  DOM.restartBtn.disabled = false;
  
  // Mark first character
  updatePassageDisplay();
  
  // Start timer
  startTimer();
  
  // Hide keyboard on mobile if needed
  if (window.innerWidth <= 768 && !DOM.showKeyboard.checked) {
    DOM.keyboardViz.hidden = true;
  }
}

/**
 * Pause test
 */
function pauseTest() {
  App.isPaused = !App.isPaused;
  DOM.pauseBtn.textContent = App.isPaused ? 'Resume' : 'Pause';
  
  if (App.isPaused) {
    App.elapsedTime = Date.now() - App.startTime;
  } else {
    App.startTime = Date.now() - App.elapsedTime;
  }
}

/**
 * Restart test
 */
function restartTest() {
  App.isTestRunning = false;
  App.isPaused = false;
  App.elapsedTime = 0;
  App.currentIndex = 0;
  App.errors = 0;
  App.correctChars = 0;
  
  // Clear input
  DOM.typingInput.value = '';
  DOM.typingInput.disabled = true;
  
  // Reset buttons
  DOM.startBtn.disabled = false;
  DOM.pauseBtn.disabled = true;
  DOM.restartBtn.disabled = true;
  DOM.pauseBtn.textContent = 'Pause';
  
  // Reset display
  renderPassage();
  updateStats();
  
  // Clear keyboard
  clearKeyboard();
}

/**
 * Timer logic
 */
function startTimer() {
  const tick = () => {
    if (!App.isTestRunning || App.isPaused) return;
    
    App.elapsedTime = Date.now() - App.startTime;
    const remaining = App.timerDuration * 1000 - App.elapsedTime;
    
    DOM.elapsedTime.textContent = `${Math.floor(App.elapsedTime / 1000)}s`;
    DOM.remainingTime.textContent = `${Math.max(0, Math.floor(remaining / 1000))}s`;
    
    if (remaining <= 0) {
      endTest();
      return;
    }
    
    requestAnimationFrame(tick);
  };
  
  tick();
}

/**
 * Handle typing input
 */
function handleTyping(e) {
  if (!App.isTestRunning || App.isPaused) return;
  
  const typedText = e.target.value;
  const typedChar = typedText[typedText.length - 1];
  const expectedChar = App.currentPassage[App.currentIndex];
  
  if (typedChar === undefined) return; // Backspace handled separately
  
  // Play sound if enabled
  if (App.settings.enableSound) {
    playKeySound();
  }
  
  // Check character
  if (typedChar === expectedChar) {
    App.correctChars++;
    markCharacter(App.currentIndex, 'correct');
  } else {
    App.errors++;
    markCharacter(App.currentIndex, 'incorrect');
    recordError(expectedChar);
  }
  
  App.currentIndex++;
  updateStats();
  updatePassageDisplay();
  
  // Check completion
  if (App.currentIndex >= App.currentPassage.length) {
    endTest();
  }
}

/**
 * Handle backspace and special keys
 */
function handleKeydown(e) {
  if (!App.isTestRunning || App.isPaused) return;
  
  // Prevent backspace from going back in browser
  if (e.key === 'Backspace') {
    e.preventDefault();
    return; // Don't allow backspace during test
  }
  
  // Update keyboard visualizer
  updateKeyboardVisualizer(e.code, true);
}

/**
 * Mark character status in passage
 */
function markCharacter(index, status) {
  const char = DOM.passageText.children[index];
  if (char) {
    char.classList.remove('correct', 'incorrect', 'current');
    char.classList.add(status);
  }
}

/**
 * Update passage display with current position
 */
function updatePassageDisplay() {
  // Clear previous current
  document.querySelectorAll('.char.current').forEach(el => {
    el.classList.remove('current');
  });
  
  // Mark current character
  if (App.currentIndex < App.totalChars) {
    const currentChar = DOM.passageText.children[App.currentIndex];
    if (currentChar) {
      currentChar.classList.add('current');
    }
  }
  
  // Scroll to current if needed
  const currentEl = document.querySelector('.char.current');
  if (currentEl) {
    currentEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

/**
 * Record error in heatmap
 */
function recordError(char) {
  if (!char || char === ' ') return;
  
  const key = char.toLowerCase();
  const current = App.errorMap.get(key) || 0;
  App.errorMap.set(key, current + 1);
  
  // Update heatmap display
  renderHeatmap();
  
  // Save to localStorage
  localStorage.setItem('typingHeatmap', JSON.stringify(Array.from(App.errorMap.entries())));
}

/**
 * Render heatmap visualization
 */
function renderHeatmap() {
  DOM.heatmapContainer.innerHTML = '';
  
  // Get all letters and numbers
  const keys = 'abcdefghijklmnopqrstuvwxyz0123456789'.split('');
  
  keys.forEach(key => {
    const count = App.errorMap.get(key) || 0;
    const max = Math.max(...App.errorMap.values(), 1);
    const intensity = count / max;
    
    const keyEl = document.createElement('div');
    keyEl.className = 'heatmap-key';
    keyEl.textContent = key;
    keyEl.title = `${key}: ${count} errors`;
    
    if (intensity > 0.7) {
      keyEl.dataset.intensity = 'high';
    } else if (intensity > 0.3) {
      keyEl.dataset.intensity = 'medium';
    } else if (intensity > 0) {
      keyEl.dataset.intensity = 'low';
    }
    
    DOM.heatmapContainer.appendChild(keyEl);
  });
}

/**
 * Clear heatmap
 */
function clearHeatmap() {
  if (confirm('Clear all heatmap data?')) {
    App.errorMap.clear();
    loadHeatmap();
    localStorage.removeItem('typingHeatmap');
  }
}

/**
 * Update statistics display
 */
function updateStats() {
  const elapsedSec = App.elapsedTime / 1000;
  
  // WPM calculations
  const wordsTyped = App.currentIndex / 5;
  const grossWPM = elapsedSec > 0 ? (wordsTyped / elapsedSec) * 60 : 0;
  const netWPM = Math.max(0, grossWPM - (App.errors / elapsedSec));
  
  // Accuracy
  const accuracy = App.currentIndex > 0 
    ? ((App.correctChars / App.currentIndex) * 100).toFixed(1) 
    : 100;
  
  // Update DOM
  DOM.wpmGross.textContent = Math.round(grossWPM);
  DOM.wpmNet.textContent = Math.round(netWPM);
  DOM.accuracy.textContent = `${accuracy}%`;
  DOM.charsTyped.textContent = `${App.currentIndex}/${App.totalChars}`;
  DOM.errorCount.textContent = App.errors;
  DOM.correctChars.textContent = App.correctChars;
}

/**
 * Initialize keyboard visualizer
 */
function initializeKeyboard() {
  const keyboardLayout = [
    ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='],
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'"],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/']
  ];
  
  const codeMap = {
    'Backquote': '`', 'Digit1': '1', 'Digit2': '2', 'Digit3': '3', 'Digit4': '4',
    'Digit5': '5', 'Digit6': '6', 'Digit7': '7', 'Digit8': '8', 'Digit9': '9',
    'Digit0': '0', 'Minus': '-', 'Equal': '=', 'KeyQ': 'q', 'KeyW': 'w',
    'KeyE': 'e', 'KeyR': 'r', 'KeyT': 't', 'KeyY': 'y', 'KeyU': 'u',
    'KeyI': 'i', 'KeyO': 'o', 'KeyP': 'p', 'BracketLeft': '[', 'BracketRight': ']',
    'KeyA': 'a', 'KeyS': 's', 'KeyD': 'd', 'KeyF': 'f', 'KeyG': 'g',
    'KeyH': 'h', 'KeyJ': 'j', 'KeyK': 'k', 'KeyL': 'l', 'Semicolon': ';',
    'Quote': "'", 'KeyZ': 'z', 'KeyX': 'x', 'KeyC': 'c', 'KeyV': 'v',
    'KeyB': 'b', 'KeyN': 'n', 'KeyM': 'm', 'Comma': ',', 'Period': '.',
    'Slash': '/', 'Space': ' '
  };
  
  DOM.keyboardContainer.innerHTML = '';
  DOM.keyboardContainer.dataset.codeMap = JSON.stringify(codeMap);
  
  keyboardLayout.forEach(row => {
    const rowEl = document.createElement('div');
    rowEl.className = 'keyboard-row';
    
    row.forEach(key => {
      const keyEl = document.createElement('div');
      keyEl.className = 'keyboard-key';
      keyEl.textContent = key;
      keyEl.dataset.key = key;
      rowEl.appendChild(keyEl);
    });
    
    // Add space bar on last row
    if (row[0] === 'z') {
      const spaceEl = document.createElement('div');
      spaceEl.className = 'keyboard-key space';
      spaceEl.textContent = 'Space';
      spaceEl.dataset.key = ' ';
      rowEl.appendChild(spaceEl);
    }
    
    DOM.keyboardContainer.appendChild(rowEl);
  });
}

/**
 * Update keyboard visualizer
 */
function updateKeyboardVisualizer(code, isPressed) {
  const codeMap = JSON.parse(DOM.keyboardContainer.dataset.codeMap);
  const key = codeMap[code];
  
  if (!key) return;
  
  const keyEl = DOM.keyboardContainer.querySelector(`[data-key="${key}"]`);
  if (!keyEl) return;
  
  if (isPressed) {
    keyEl.classList.add('pressed');
    
    // Check if it's an error
    if (App.isTestRunning && !App.isPaused) {
      const expectedChar = App.currentPassage[App.currentIndex];
      if (key !== expectedChar) {
        keyEl.classList.add('error');
        setTimeout(() => keyEl.classList.remove('error'), 200);
      }
    }
  } else {
    keyEl.classList.remove('pressed');
  }
}

/**
 * Clear keyboard visualizer
 */
function clearKeyboard() {
  document.querySelectorAll('.keyboard-key').forEach(key => {
    key.classList.remove('pressed', 'error');
  });
}

/**
 * Toggle keyboard display
 */
function toggleKeyboard(e) {
  App.settings.showKeyboard = e.target.checked;
  DOM.keyboardViz.hidden = !App.settings.showKeyboard;
  saveSettings();
}

/**
 * Play key sound (Web Audio API)
 */
function playKeySound() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = 800;
  oscillator.type = 'sine';
  gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.1);
}

/**
 * End test and show results
 */
function endTest() {
  App.isTestRunning = false;
  App.elapsedTime = App.timerDuration * 1000;
  
  // Disable input
  DOM.typingInput.disabled = true;
  
  // Update final stats
  updateStats();
  
  // Show results modal
  showResultsModal();
  
  // Clear keyboard
  clearKeyboard();
}

/**
 * Show results modal with detailed stats
 */
function showResultsModal() {
  const elapsedSec = App.elapsedTime / 1000;
  const wordsTyped = App.currentIndex / 5;
  const grossWPM = (wordsTyped / elapsedSec) * 60;
  const netWPM = Math.max(0, grossWPM - (App.errors / elapsedSec));
  const accuracy = App.currentIndex > 0 ? (App.correctChars / App.currentIndex) * 100 : 100;
  
  DOM.resultsContent.innerHTML = `
    <div class="results-summary">
      <div class="result-stat">
        <span class="label">Gross WPM</span>
        <span class="value">${Math.round(grossWPM)}</span>
      </div>
      <div class="result-stat">
        <span class="label">Net WPM</span>
        <span class="value">${Math.round(netWPM)}</span>
      </div>
      <div class="result-stat">
        <span class="label">Accuracy</span>
        <span class="value">${accuracy.toFixed(1)}%</span>
      </div>
      <div class="result-stat">
        <span class="label">Errors</span>
        <span class="value">${App.errors}</span>
      </div>
    </div>
    
    <div class="accuracy-chart">
      <h3>Accuracy Breakdown</h3>
      <div class="accuracy-bar">
        <div class="correct" style="width: ${accuracy}%"></div>
        <div class="incorrect" style="width: ${100 - accuracy}%"></div>
      </div>
      <p style="font-size: 0.85rem; color: var(--color-text-muted); margin-top: var(--spacing-sm);">
        ${accuracy.toFixed(1)}% correct · ${(100 - accuracy).toFixed(1)}% errors
      </p>
    </div>
    
    <div style="margin-top: var(--spacing-lg);">
      <h3>Passage</h3>
      <p style="font-size: 0.85rem; color: var(--color-text-muted);">
        "${App.currentPassage.substring(0, 100)}${App.currentPassage.length > 100 ? '...' : ''}"
      </p>
    </div>
  `;
  
  DOM.resultsModal.setAttribute('aria-hidden', 'false');
}

/**
 * Close results modal
 */
function closeResultsModal() {
  DOM.resultsModal.setAttribute('aria-hidden', 'true');
}

/**
 * Export results as CSV
 */
function exportCSV() {
  const elapsedSec = App.elapsedTime / 1000;
  const timestamp = new Date().toISOString();
  const accuracy = App.currentIndex > 0 ? (App.correctChars / App.currentIndex) * 100 : 100;
  
  const csvData = [
    ['Timestamp', 'Duration (s)', 'WPM (Gross)', 'WPM (Net)', 'Accuracy (%)', 'Errors', 'Characters Typed', 'Passage Type'],
    [timestamp, elapsedSec.toFixed(1), DOM.wpmGross.textContent, DOM.wpmNet.textContent, accuracy.toFixed(1), App.errors, App.currentIndex, 'typing-test']
  ];
  
  const csvContent = csvData.map(row => row.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  
  // Download file
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `typing-test-results-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Share results using Web Share API
 */
function shareResults() {
  const elapsedSec = App.elapsedTime / 1000;
  const text = `I scored ${DOM.wpmGross.textContent} WPM with ${DOM.accuracy.textContent} accuracy on PirateRuler's typing test!`;
  const url = window.location.href;
  
  if (navigator.share) {
    navigator.share({
      title: 'Typing Test Results',
      text: text,
      url: url
    }).catch(() => {
      // Fallback to clipboard
      copyToClipboard(`${text} ${url}`);
    });
  } else {
    // Fallback to clipboard
    copyToClipboard(`${text} ${url}`);
  }
}

/**
 * Copy text to clipboard
 */
function copyToClipboard(text) {
  navigator.clipboard?.writeText(text).then(() => {
    alert('Results copied to clipboard!');
  }).catch(() => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    alert('Results copied to clipboard!');
  });
}

/**
 * Expose functions to global scope for debugging
 */
window.startTest = startTest;
window.stopTest = () => { App.isTestRunning = false; };
window.computeWPM = () => updateStats();
window.computeAccuracy = () => updateStats();
window.exportCSV = exportCSV;
window.fetchRandomPassage = fetchRandomPassage;
