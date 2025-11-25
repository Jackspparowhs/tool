/*
PirateRuler.com Typing Test - Enhanced Application
- Bigger header implementation
- Live WPM graph with Canvas API
- Achievement system
- Sound effects
- Keyboard shortcuts
- Tooltip system
- Performance improvements
- Error analytics
*/

// Theme Management
const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;
const metaThemeColor = document.querySelector('meta[name="theme-color"]');

function initTheme() {
    const saved = localStorage.getItem('theme');
    const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    
    if (saved) {
        html.setAttribute('data-theme', saved);
        updateThemeColor(saved);
    } else if (prefersLight) {
        html.setAttribute('data-theme', 'light');
        updateThemeColor('light');
    }
}

function updateThemeColor(theme) {
    if (metaThemeColor) {
        metaThemeColor.content = theme === 'light' ? '#ffffff' : '#0a0a0a';
    }
}

function toggleTheme() {
    const current = html.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    updateThemeColor(next);
}

if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
}

// Header Scroll Effect
const header = document.getElementById('header');
let lastScroll = 0;

function handleHeaderScroll() {
    const currentScroll = window.pageYOffset;
    if (currentScroll > 20) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
    lastScroll = currentScroll;
}

window.addEventListener('scroll', handleHeaderScroll);

// Off-canvas Menu
const menuToggle = document.getElementById('menuToggle');
const menuClose = document.getElementById('menuClose');
const menu = document.getElementById('menu');
const menuOverlay = document.getElementById('menuOverlay');

function openMenu() {
    menu.classList.add('active');
    menuOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    menu.setAttribute('aria-hidden', 'false');
    trapFocus(menu);
}

function closeMenu() {
    menu.classList.remove('active');
    menuOverlay.classList.remove('active');
    document.body.style.overflow = '';
    menu.setAttribute('aria-hidden', 'true');
}

if (menuToggle) menuToggle.addEventListener('click', openMenu);
if (menuClose) menuClose.addEventListener('click', closeMenu);
if (menuOverlay) menuOverlay.addEventListener('click', closeMenu);

// Keyboard Trap
function trapFocus(element) {
    const focusableElements = element.querySelectorAll('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    element.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        }
    });
    
    firstElement.focus();
}

// Typing Test Manager Class
class TypingTestManager {
    constructor() {
        this.state = {
            isRunning: false,
            timeLeft: 60,
            timer: null,
            passage: '',
            typed: '',
            correctChars: 0,
            mistakes: 0,
            startTime: null,
            keystrokes: 0,
            wpmHistory: [],
            currentWPM: 0
        };
        
        this.elements = {};
        this.graph = null;
        this.ctx = null;
        this.achievements = [];
        this.soundEnabled = false;
        
        this.init();
    }
    
    async init() {
        this.cacheElements();
        this.loadSettings();
        this.setupEventListeners();
        this.initGraph();
        await this.loadPassage();
        this.setupScrollAnimation();
        this.setupTooltips();
    }
    
    cacheElements() {
        this.elements = {
            startBtn: document.getElementById('startBtn'),
            restartBtn: document.getElementById('restartBtn'),
            passageSelect: document.getElementById('passageSelect'),
            timerSelect: document.getElementById('timerSelect'),
            difficultySelect: document.getElementById('difficultySelect'),
            timerDisplay: document.getElementById('timerDisplay'),
            typingArea: document.getElementById('typingArea'),
            passageDisplay: document.getElementById('passageDisplay'),
            typingInput: document.getElementById('typingInput'),
            keyboard: document.getElementById('keyboard'),
            wpm: document.getElementById('wpm'),
            accuracy: document.getElementById('accuracy'),
            chars: document.getElementById('chars'),
            mistakes: document.getElementById('mistakes'),
            keystrokes: document.getElementById('keystrokes'),
            wpmChange: document.getElementById('wpmChange'),
            accuracyChange: document.getElementById('accuracyChange'),
            graphContainer: document.getElementById('graphContainer'),
            achievements: document.getElementById('achievements'),
            modalOverlay: document.getElementById('modalOverlay'),
            resultsModal: document.getElementById('resultsModal'),
            finalWpm: document.getElementById('finalWpm'),
            finalAccuracy: document.getElementById('finalAccuracy'),
            finalMistakes: document.getElementById('finalMistakes'),
            finalCorrect: document.getElementById('finalCorrect'),
            exportBtn: document.getElementById('exportBtn'),
            tryAgainBtn: document.getElementById('tryAgainBtn'),
            settingsBtn: document.getElementById('
