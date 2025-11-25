// app.js
/*
README: PirateRuler.com Typing Test Application
- FIXED: No more loading overlay issues
- FIXED: All DOM errors resolved
- Professional-grade functionality with zero dependencies
*/

// ==================== STATE ====================
const State = {
    theme: 'dark',
    soundEnabled: true,
    test: {
        isRunning: false,
        isPaused: false,
        duration: 60,
        difficulty: 'medium',
        passage: '',
        typed: '',
        correctChars: 0,
        mistakes: 0,
        startTime: null,
        timer: null,
        wpmData: [],
        consistency: []
    }
};

// ==================== DOM ELEMENTS (SAFE) ====================
function getEl(id) {
    return document.getElementById(id);
}

function getAll(selector) {
    return document.querySelectorAll(selector);
}

// ==================== INIT ====================
function init() {
    // Load saved state
    loadState();
    
    // Theme
    initTheme();
    
    // Sound
    initSound();
    
    // Menu
    initMenu();
    
    // Page-specific
    if (document.querySelector('.hero')) {
        initIndex();
    }
    if (document.querySelector('.test-main')) {
        initTest();
    }
}

// ==================== STATE MANAGEMENT ====================
function loadState() {
    const saved = localStorage.getItem('pirateruler-typing-state');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            State.theme = data.theme || 'dark';
            State.soundEnabled = data.soundEnabled !== false;
        } catch (e) {
            console.warn('Could not load saved state');
        }
    }
}

function saveState() {
    localStorage.setItem('pirateruler-typing-state', JSON.stringify({
        theme: State.theme,
        soundEnabled: State.soundEnabled
    }));
}

// ==================== THEME ====================
function initTheme() {
    getEl('themeToggle')?.addEventListener('click', toggleTheme);
    document.documentElement.setAttribute('data-theme', State.theme);
}

function toggleTheme() {
    State.theme = State.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', State.theme);
    saveState();
}

// ==================== SOUND ====================
function initSound() {
    const btn = getEl('soundToggle');
    if (!btn) return;
    
    btn.classList.toggle('active', State.soundEnabled);
    btn.addEventListener('click', () => {
        State.soundEnabled = !State.soundEnabled;
        btn.classList.toggle('active', State.soundEnabled);
        saveState();
    });
}

// ==================== MENU ====================
function initMenu() {
    const toggle = getEl('menuToggle');
    const close = getEl('menuClose');
    const overlay = getEl('menuOverlay');
    const menu = getEl('menu');
    
    if (!toggle || !close || !overlay || !menu) return;
    
    toggle.addEventListener('click', () => openMenu());
    close.addEventListener('click', () => closeMenu());
    overlay.addEventListener('click', () => closeMenu());
}

function openMenu() {
    const overlay = getEl('menuOverlay');
    const menu = getEl('menu');
    overlay.style.display = 'block';
    menu.style.display = 'block';
    setTimeout(() => {
        overlay.classList.add('active');
        menu.classList.add('active');
    }, 10);
    document.body.style.overflow = 'hidden';
}

function closeMenu() {
    const overlay = getEl('menuOverlay');
    const menu = getEl('menu');
    overlay.classList.remove('active');
    menu.classList.remove('active');
    setTimeout(() => {
        overlay.style.display = 'none';
        menu.style.display = 'none';
    }, 300);
    document.body.style.overflow = '';
}

// ==================== INDEX PAGE ====================
function initIndex() {
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

// ==================== TEST PAGE ====================
function initTest() {
    // Controls
    getEl('timerSelect')?.addEventListener('change', (e) => {
        State.test.duration = parseInt(e.target.value);
        getEl('timerDisplay').textContent = formatTime(State.test.duration);
    });
    
    getEl('difficultySelect')?.addEventListener('change', (e) => {
        State.test.difficulty = e.target.value;
    });
    
    // Buttons
    getEl('startBtn')?.addEventListener('click', startTest);
    getEl('restartBtn')?.addEventListener('click', restartTest);
    
    // Typing
    getEl('typingInput')?.addEventListener('input', handleTyping);
    
    // Load passage
    loadPassage();
    
    // Chart
    if (getEl('wpmChart')) {
        State.chart = getEl('wpmChart').getContext('2d');
    }
}

function loadPassage() {
    const display = getEl('passageDisplay');
    if (!display) return;
    
    display.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 2rem;">Loading passage...</div>';
    
    const passages = {
        easy: "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. A journey of a thousand miles begins with a single step. The early bird catches the worm. Practice makes perfect.",
        medium: "JavaScript is a versatile programming language that powers the modern web. Developers create interactive experiences from simple animations to complex applications. Its flexibility and browser support make it essential for front-end development. The ecosystem grows daily.",
        hard: "Constitutional democracy requires active participation from informed citizens. The interplay between institutions and individual rights shapes societies. Philosophical debates about governance continue evolving, reflecting our deepest values. Technology transforms democratic participation."
    };
    
    // Simulate loading
    setTimeout(() => {
        State.test.passage = passages[State.test.difficulty];
        renderPassage();
    }, 200);
}

function renderPassage() {
    const display = getEl('passageDisplay');
    if (!display) return;
    
    display.innerHTML = '';
    State.test.passage.split('').forEach((char, index) => {
        const span = document.createElement('span');
        span.className = 'char';
        span.textContent = char === ' ' ? '·' : char;
        if (index === State.test.typed.length) {
            span.classList.add('current');
        } else if (index < State.test.typed.length) {
            span.classList.add(State.test.typed[index] === char ? 'correct' : 'incorrect');
        }
        display.appendChild(span);
    });
}

function startTest() {
    State.test.isRunning = true;
    State.test.typed = '';
    State.test.correctChars = 0;
    State.test.mistakes = 0;
    State.test.wpmData = [];
    State.test.consistency = [];
    State.test.startTime = Date.now();
    
    // UI
    getEl('startBtn').style.display = 'none';
    getEl('restartBtn').style.display = 'inline-flex';
    getEl('typingArea').style.display = 'block';
    getEl('keyboard').style.display = 'block';
    getEl('typingInput').disabled = false;
    getEl('typingInput').focus();
    getEl('typingInput').value = '';
    
    // Start timer
    State.test.timeLeft = State.test.duration;
    updateTimerDisplay();
    State.test.timer = setInterval(updateTimer, 1000);
}

function updateTimer() {
    State.test.timeLeft--;
    updateTimerDisplay();
    
    if (State.test.timeLeft <= 0) {
        endTest();
    }
}

function updateTimerDisplay() {
    const display = getEl('timerDisplay');
    if (!display) return;
    display.textContent = formatTime(State.test.timeLeft);
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function handleTyping(e) {
    if (!State.test.isRunning) return;
    
    const newTyped = e.target.value;
    const prevLen = State.test.typed.length;
    const newLen = newTyped.length;
    
    // Backspace
    if (newLen < prevLen) {
        State.test.typed = newTyped;
        renderPassage();
        return;
    }
    
    // New character
    const newChar = newTyped[newLen - 1];
    const expectedChar = State.test.passage[newLen - 1];
    
    if (newChar === expectedChar) {
        State.test.correctChars++;
    } else {
        State.test.mistakes++;
    }
    
    State.test.typed = newTyped;
    renderPassage();
    updateStats();
    
    // Scroll to current character
    const current = getEl('passageDisplay')?.querySelector('.char.current');
    if (current) {
        current.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    }
}

function updateStats() {
    // WPM
    const elapsed = (Date.now() - State.test.startTime) / 1000 / 60;
    const wpm = Math.round((State.test.correctChars / 5) / elapsed) || 0;
    if (getEl('wpm')) getEl('wpm').textContent = wpm;
    
    // Accuracy
    const accuracy = State.test.typed.length > 0 
        ? Math.round((State.test.correctChars / State.test.typed.length) * 100) 
        : 100;
    if (getEl('accuracy')) getEl('accuracy').textContent = accuracy + '%';
    
    // Characters
    if (getEl('chars')) getEl('chars').textContent = State.test.correctChars;
    if (getEl('mistakes')) getEl('mistakes').textContent = State.test.mistakes;
    
    // Consistency (simplified)
    if (getEl('consistency')) {
        const consistency = Math.max(0, 100 - (State.test.mistakes * 2));
        getEl('consistency').textContent = consistency + '%';
    }
}

function endTest() {
    State.test.isRunning = false;
    clearInterval(State.test.timer);
    getEl('typingInput').disabled = true;
    
    // Show results
    updateStats();
    const wpm = parseInt(getEl('wpm')?.textContent || '0');
    const accuracy = parseInt(getEl('accuracy')?.textContent || '0');
    
    if (getEl('finalWpm')) getEl('finalWpm').textContent = wpm;
    if (getEl('finalAccuracy')) getEl('finalAccuracy').textContent = accuracy + '%';
    if (getEl('finalMistakes')) getEl('finalMistakes').textContent = State.test.mistakes;
    if (getEl('finalConsistency')) getEl('finalConsistency').textContent = Math.max(0, 100 - (State.test.mistakes * 2)) + '%';
    
    // Badge
    let badge = 'Beginner';
    if (wpm >= 100) badge = 'Expert';
    else if (wpm >= 80) badge = 'Advanced';
    else if (wpm >= 60) badge = 'Intermediate';
    if (getEl('resultBadge')) getEl('resultBadge').textContent = badge;
    
    // Show modal
    if (getEl('modalOverlay')) getEl('modalOverlay').style.display = 'block';
    if (getEl('resultsModal')) getEl('resultsModal').style.display = 'block';
}

function restartTest() {
    clearInterval(State.test.timer);
    State.test.isRunning = false;
    
    // Reset UI
    getEl('startBtn').style.display = 'inline-flex';
    getEl('restartBtn').style.display = 'none';
    getEl('typingArea').style.display = 'none';
    getEl('keyboard').style.display = 'none';
    if (getEl('modalOverlay')) getEl('modalOverlay').style.display = 'none';
    if (getEl('resultsModal')) getEl('resultsModal').style.display = 'none';
    
    loadPassage();
}

// ==================== EXPORT ====================
function exportCSV() {
    const wpm = getEl('finalWpm')?.textContent || '0';
    const accuracy = getEl('finalAccuracy')?.textContent || '0%';
    const mistakes = getEl('finalMistakes')?.textContent || '0';
    
    const csv = `Metric,Value\nWPM,${wpm}\nAccuracy,${accuracy}\nMistakes,${mistakes}\nDate,${new Date().toLocaleString()}\nDuration,${State.test.duration}s`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `typing-test-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

getEl('exportBtn')?.addEventListener('click', exportCSV);

// ==================== START APP ====================
// Run init when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
