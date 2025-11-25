// app.js
/*
README: PirateRuler.com Ultimate Typing Test App
- Full-featured: gamification, analytics, achievements, history, sound, offline support
- Pure vanilla JavaScript, no external dependencies
- Production-ready with error handling, performance optimizations
*/

// ==================== GLOBAL STATE ====================
const State = {
    theme: 'dark',
    soundEnabled: true,
    user: {
        level: 1,
        xp: 0,
        xpToNext: 100,
        totalTests: 0,
        bestWPM: 0,
        streak: 0,
        achievements: [],
        history: []
    },
    test: {
        isRunning: false,
        isPaused: false,
        mode: 'time',
        difficulty: 'medium',
        duration: 60,
        passage: '',
        typed: '',
        correctChars: 0,
        mistakes: 0,
        startTime: null,
        timer: null,
        wpmData: [],
        consistency: []
    },
    leaderboard: []
};

// ==================== DOM ELEMENTS ====================
const Elements = {
    // Loading
    loadingOverlay: document.getElementById('loadingOverlay'),
    
    // Theme & UI
    themeToggle: document.getElementById('themeToggle'),
    soundToggle: document.getElementById('soundToggle'),
    html: document.documentElement,
    
    // Menu
    menuToggle: document.getElementById('menuToggle'),
    menuClose: document.getElementById('menuClose'),
    menu: document.getElementById('menu'),
    menuOverlay: document.getElementById('menuOverlay'),
    
    // Index page
    typewriter: document.getElementById('typewriter'),
    statCards: document.querySelectorAll('.stat-card'),
    
    // Test page
    modeSelect: document.getElementById('modeSelect'),
    difficultySelect: document.getElementById('difficultySelect'),
    timerSelect: document.getElementById('timerSelect'),
    passageSelect: document.getElementById('passageSelect'),
    customTextInput: document.getElementById('customTextInput'),
    customText: document.getElementById('customText'),
    useCustomBtn: document.getElementById('useCustomBtn'),
    
    startBtn: document.getElementById('startBtn'),
    pauseBtn: document.getElementById('pauseBtn'),
    skipBtn: document.getElementById('skipBtn'),
    restartBtn: document.getElementById('restartBtn'),
    
    wpmChart: document.getElementById('wpmChart'),
    typingArea: document.getElementById('typingArea'),
    passageDisplay: document.getElementById('passageDisplay'),
    typingInput: document.getElementById('typingInput'),
    keyboard: document.getElementById('keyboard'),
    timerDisplay: document.getElementById('timerDisplay'),
    
    // Stats
    wpmEl: document.getElementById('wpm'),
    accuracyEl: document.getElementById('accuracy'),
    consistencyEl: document.getElementById('consistency'),
    charsEl: document.getElementById('chars'),
    mistakesEl: document.getElementById('mistakes'),
    xpProgress: document.getElementById('xpProgress'),
    xpDisplay: document.getElementById('xpDisplay'),
    userLevel: document.getElementById('userLevel'),
    
    // Progress
    progressBar: document.getElementById('progressBar'),
    progressFill: document.getElementById('progressFill'),
    
    // Results
    modalOverlay: document.getElementById('modalOverlay'),
    resultsModal: document.getElementById('resultsModal'),
    finalWpm: document.getElementById('finalWpm'),
    finalAccuracy: document.getElementById('finalAccuracy'),
    finalMistakes: document.getElementById('finalMistakes'),
    finalConsistency: document.getElementById('finalConsistency'),
    resultBadge: document.getElementById('resultBadge'),
    
    // Other
    achievement: document.getElementById('achievement'),
    achievementName: document.getElementById('achievementName'),
    cookieConsent: document.getElementById('cookieConsent'),
    acceptCookies: document.getElementById('acceptCookies')
};

// ==================== INIT ====================
function init() {
    // Hide loading
    setTimeout(() => {
        if (Elements.loadingOverlay) {
            Elements.loadingOverlay.classList.add('hidden');
        }
    }, 500);

    // Load state
    loadState();
    
    // Init theme
    initTheme();
    
    // Init sounds
    initSounds();
    
    // Init page-specific features
    if (document.querySelector('.hero')) {
        initIndex();
    }
    if (document.querySelector('.test-main')) {
        initTest();
    }
    
    // Init menu
    initMenu();
    
    // Init cookie consent
    initCookieConsent();
    
    // Init scroll animations
    initScrollAnimations();
}

// ==================== THEME ====================
function initTheme() {
    const saved = localStorage.getItem('theme');
    if (saved) {
        State.theme = saved;
    } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
        State.theme = 'light';
    }
    Elements.html.setAttribute('data-theme', State.theme);
    
    if (Elements.themeToggle) {
        Elements.themeToggle.addEventListener('click', toggleTheme);
    }
}

function toggleTheme() {
    State.theme = State.theme === 'dark' ? 'light' : 'dark';
    Elements.html.setAttribute('data-theme', State.theme);
    localStorage.setItem('theme', State.theme);
    playSound('click');
}

// ==================== SOUNDS ====================
function initSounds() {
    if (Elements.soundToggle) {
        const saved = localStorage.getItem('soundEnabled');
        State.soundEnabled = saved !== 'false';
        Elements.soundToggle.classList.toggle('active', State.soundEnabled);
        Elements.soundToggle.addEventListener('click', toggleSound);
    }
}

function toggleSound() {
    State.soundEnabled = !State.soundEnabled;
    localStorage.setItem('soundEnabled', State.soundEnabled);
    Elements.soundToggle.classList.toggle('active', State.soundEnabled);
    playSound('click');
}

function playSound(type) {
    if (!State.soundEnabled) return;
    const audio = new Audio();
    const sounds = {
        click: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE',
        key: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE',
        error: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE',
        achievement: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE'
    };
    audio.src = sounds[type] || sounds.click;
    audio.volume = 0.3;
    audio.play().catch(() => {});
}

// ==================== INDEX PAGE ====================
function initIndex() {
    // Typewriter effect
    const phrases = [
        'Measure Your Typing Speed',
        'Fast, Private & Beautiful',
        'AI-Powered Analytics',
        'Unlock Your Potential'
    ];
    typewriter(phrases, 0, 0);
    
    // Animate stats on scroll
    animateStats();
}

function typewriter(phrases, phraseIndex, charIndex) {
    if (!Elements.typewriter) return;
    
    if (charIndex < phrases[phraseIndex].length) {
        Elements.typewriter.innerHTML = `<span class="gradient-text">${phrases[phraseIndex].substring(0, charIndex + 1)}</span>`;
        setTimeout(() => typewriter(phrases, phraseIndex, charIndex + 1), 100);
    } else {
        setTimeout(() => {
            Elements.typewriter.innerHTML = `<span class="gradient-text"></span>`;
            setTimeout(() => {
                typewriter(phrases, (phraseIndex + 1) % phrases.length, 0);
            }, 200);
        }, 2000);
    }
}

function animateStats() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const card = entry.target;
                const target = parseFloat(card.dataset.target);
                const suffix = card.dataset.suffix || '';
                const label = card.dataset.label || '';
                
                let current = 0;
                const increment = target / 100;
                const timer = setInterval(() => {
                    current += increment;
                    if (current >= target) {
                        current = target;
                        clearInterval(timer);
                    }
                    card.innerHTML = `${label}${Math.floor(current).toLocaleString()}${suffix}`;
                }, 20);
                
                observer.unobserve(card);
            }
        });
    });
    
    document.querySelectorAll('.stat-card').forEach(card => {
        card.dataset.label = card.querySelector('.stat-label')?.textContent || '';
        card.dataset.suffix = card.querySelector('.stat-number')?.textContent.match(/[^\d]/)?.[0] || '';
        observer.observe(card);
    });
}

// ==================== TEST PAGE ====================
function initTest() {
    // Load user state
    updateXPBar();
    
    // Mode controls
    if (Elements.modeSelect) {
        Elements.modeSelect.addEventListener('change', handleModeChange);
    }
    
    // Passage controls
    if (Elements.passageSelect) {
        Elements.passageSelect.addEventListener('change', loadPassage);
    }
    
    // Test controls
    Elements.startBtn.addEventListener('click', startTest);
    Elements.pauseBtn.addEventListener('click', pauseTest);
    Elements.skipBtn.addEventListener('click', skipTest);
    Elements.restartBtn.addEventListener('click', restartTest);
    
    // Typing input
    Elements.typingInput.addEventListener('input', handleTyping);
    Elements.typingInput.addEventListener('keydown', handleKeyDown);
    
    // Custom text
    if (Elements.useCustomBtn) {
        Elements.useCustomBtn.addEventListener('click', loadCustomText);
    }
    
    // Canvas chart setup
    if (Elements.wpmChart) {
        State.chart = Elements.wpmChart.getContext('2d');
    }
    
    // Load passage
    loadPassage();
    
    // Daily challenge
    initDailyChallenge();
}

function handleModeChange() {
    State.test.mode = Elements.modeSelect.value;
    Elements.customTextInput.style.display = State.test.mode === 'custom' ? 'block' : 'none';
    Elements.timerSelect.style.display = State.test.mode === 'time' ? 'block' : 'none';
    Elements.passageSelect.style.display = State.test.mode === 'quote' ? 'block' : 'none';
    loadPassage();
}

function loadPassage() {
    if (State.test.mode === 'custom') {
        Elements.passageDisplay.innerHTML = '<div style="text-align: center; color: var(--text-muted);">Enter custom text below</div>';
        return;
    }
    
    Elements.passageDisplay.innerHTML = '<div style="text-align: center; color: var(--text-muted);">Loading passage...</div>';
    
    let passage = '';
    const length = Elements.passageSelect?.value || 'medium';
    
    if (State.test.mode === 'quote') {
        const quotes =
