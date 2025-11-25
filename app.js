// Theme Manager
const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;

function initTheme() {
    const saved = localStorage.getItem('theme');
    if (saved) {
        html.setAttribute('data-theme', saved);
    } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
        html.setAttribute('data-theme', 'light');
    }
}

function toggleTheme() {
    const current = html.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
}

if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
}

// Menu Manager
const menuToggle = document.getElementById('menuToggle');
const menuClose = document.getElementById('menuClose');
const menu = document.getElementById('menu');
const menuOverlay = document.getElementById('menuOverlay');

function openMenu() {
    menu.classList.add('active');
    if (menuOverlay) menuOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeMenu() {
    menu.classList.remove('active');
    if (menuOverlay) menuOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

if (menuToggle) menuToggle.addEventListener('click', openMenu);
if (menuClose) menuClose.addEventListener('click', closeMenu);
if (menuOverlay) menuOverlay.addEventListener('click', closeMenu);

// Typing Test Logic
const testPage = document.querySelector('.test-main');
if (testPage) {
    const passages = {
        short: "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. Bright vixens jump and dance.",
        medium: "JavaScript powers the modern web with dynamic interactions and smooth animations. Developers create amazing applications using its flexible ecosystem and extensive libraries.",
        long: "Consistent typing practice develops muscle memory and dramatically improves accuracy over time. Focus on proper finger placement, maintain excellent posture, and remember to take regular breaks. This comprehensive approach prevents strain while building long-term speed and precision for all professionals."
    };

    // Cache elements
    const elements = {
        startBtn: document.getElementById('startBtn'),
        restartBtn: document.getElementById('restartBtn'),
        passageSelect: document.getElementById('passageSelect'),
        timerSelect: document.getElementById('timerSelect'),
        timerDisplay: document.getElementById('timerDisplay'),
        typingArea: document.getElementById('typingArea'),
        passageDisplay: document.getElementById('passageDisplay'),
        typingInput: document.getElementById('typingInput'),
        keyboard: document.getElementById('keyboard'),
        wpm: document.getElementById('wpm'),
        accuracy: document.getElementById('accuracy'),
        chars: document.getElementById('chars'),
        mistakes: document.getElementById('mistakes'),
        modalOverlay: document.getElementById('modalOverlay'),
        resultsModal: document.getElementById('resultsModal'),
        finalWpm: document.getElementById('finalWpm'),
        finalAccuracy: document.getElementById('finalAccuracy'),
        finalMistakes: document.getElementById('finalMistakes'),
        finalCorrect: document.getElementById('finalCorrect'),
        exportBtn: document.getElementById('exportBtn'),
        tryAgainBtn: document.getElementById('tryAgainBtn')
    };

    // Test state
    let state = {
        isRunning: false,
        timeLeft: 60,
        timer: null,
        passage: '',
        typed: '',
        correctChars: 0,
        mistakes: 0,
        startTime: null
    };

    // Initialize
    function initTest() {
        loadPassage();
        updateDisplay();
    }

    function loadPassage() {
        const length = elements.passageSelect.value;
        state.passage = passages[length];
        renderPassage();
    }

    function renderPassage() {
        elements.passageDisplay.innerHTML = '';
        state.passage.split('').forEach((char, index) => {
            const span = document.createElement('span');
            span.className = 'char';
            span.textContent = char === ' ' ? '·' : char;
            if (index === state.typed.length) {
                span.classList.add('current');
            } else if (index < state.typed.length) {
                if (state.typed[index] === char) {
                    span.classList.add('correct');
                } else {
                    span.classList.add('incorrect');
                }
            }
            elements.passageDisplay.appendChild(span);
        });
    }

    function startTest() {
        state.isRunning = true;
        state.timeLeft = parseInt(elements.timerSelect.value);
        state.startTime = Date.now();
        state.typed = '';
        state.correctChars = 0;
        state.mistakes = 0;
        
        elements.startBtn.style.display = 'none';
        elements.restartBtn.style.display = 'inline-flex';
        elements.typingArea.style.display = 'block';
        elements.keyboard.style.display = 'block';
        elements.typingInput.disabled = false;
        elements.typingInput.focus();
        elements.typingInput.value = '';
        
        startTimer();
        updateDisplay();
    }

    function startTimer() {
        updateTimerDisplay();
        state.timer = setInterval(() => {
            state.timeLeft--;
            updateTimerDisplay();
            
            if (state.timeLeft <= 0) {
                endTest();
            }
        }, 1000);
    }

    function updateTimerDisplay() {
        const minutes = Math.floor(state.timeLeft / 60);
        const seconds = state.timeLeft % 60;
        elements.timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    function endTest() {
        state.isRunning = false;
        clearInterval(state.timer);
        elements.typingInput.disabled = true;
        
        const timeMinutes = parseInt(elements.timerSelect.value) / 60;
        const wpm = Math.round((state.correctChars / 5) / timeMinutes);
        const accuracy = state.typed.length > 0 
            ? Math.round((state.correctChars / state.typed.length) * 100) 
            : 100;
        
        elements.finalWpm.textContent = wpm;
        elements.finalAccuracy.textContent = accuracy + '%';
        elements.finalMistakes.textContent = state.mistakes;
        elements.finalCorrect.textContent = state.correctChars;
        
        elements.modalOverlay.classList.add('active');
        elements.resultsModal.classList.add('active');
    }

    function restartTest() {
        clearInterval(state.timer);
        initTest();
        elements.startBtn.style.display = 'inline-flex';
        elements.restartBtn.style.display = 'none';
        elements.typingArea.style.display = 'none';
        elements.keyboard.style.display = 'none';
        elements.modalOverlay.classList.remove('active');
        elements.resultsModal.classList.remove('active');
        elements.timerDisplay.textContent = '1:00';
    }

    function updateDisplay() {
        const wpm = state.isRunning ? Math.round((state.correctChars / 5) / ((Date.now() - state.startTime) / 1000 / 60)) : 0;
        elements.wpm.textContent = wpm;
        
        const accuracy = state.typed.length > 0 
            ? Math.round((state.correctChars / state.typed.length) * 100) 
            : 100;
        elements.accuracy.textContent = accuracy + '%';
        elements.chars.textContent = state.correctChars;
        elements.mistakes.textContent = state.mistakes;
    }

    // Event Listeners
    elements.typingInput.addEventListener('input', (e) => {
        if (!state.isRunning) return;
        
        const newTyped = e.target.value;
        const prevLen = state.typed.length;
        const newLen = newTyped.length;
        
        if (newLen < prevLen) {
            state.typed = newTyped;
            renderPassage();
            return;
        }
        
        const newChar = newTyped[newLen - 1];
        const expectedChar = state.passage[newLen - 1];
        
        if (newChar === expectedChar) {
            state.correctChars++;
        } else {
            state.mistakes++;
            highlightKey(newChar, true);
        }
        
        state.typed = newTyped;
        highlightKey(newChar, false);
        renderPassage();
        updateDisplay();
    });

    function highlightKey(char, isError) {
        const key = elements.keyboard.querySelector(`[data-key="${char.toLowerCase()}"]`);
        if (key) {
            key.classList.add(isError ? 'error' : 'active');
            setTimeout(() => {
                key.classList.remove('active', 'error');
            }, 200);
        }
    }

    function exportCSV() {
        const data = {
            wpm: elements.finalWpm.textContent,
            accuracy: elements.finalAccuracy.textContent,
            mistakes: elements.finalMistakes.textContent,
            correct: elements.finalCorrect.textContent,
            date: new Date().toLocaleString()
        };
        
        const csv = `Metric,Value\nWPM,${data.wpm}\nAccuracy,${data.accuracy}\nMistakes,${data.mistakes}\nCorrect Characters,${data.correct}\nDate,${data.date}`;
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `typing-test-${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    elements.startBtn.addEventListener('click', startTest);
    elements.restartBtn.addEventListener('click', restartTest);
    elements.passageSelect.addEventListener('change', loadPassage);
    elements.exportBtn.addEventListener('click', exportCSV);
    elements.tryAgainBtn.addEventListener('click', restartTest);
    
    initTest();
}

// Scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements
document.querySelectorAll('.stat-card, .feature-card, .usecase-card, .testimonial-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
});
