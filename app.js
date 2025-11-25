// app.js
/*
README: PirateRuler.com Typing Test Application
- Fixed theme toggle with true monochrome light mode
- Improved responsive behavior and overflow prevention
- Enhanced keyboard visualizer and accessibility
- Added loading states and better error handling
*/

// Theme Management
const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;

function initTheme() {
    const saved = localStorage.getItem('theme');
    if (saved) {
        html.setAttribute('data-theme', saved);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
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

// Typing Test Logic
const testPage = document.querySelector('.test-main');
if (testPage) {
    // Passages with fallbacks
    const passages = {
        short: "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.",
        medium: "JavaScript powers the modern web with dynamic interactions. Developers create everything from simple animations to complex applications using its flexible syntax and extensive ecosystem.",
        long: "Consistent typing practice develops muscle memory and improves accuracy. Focus on proper finger placement, maintain good posture, and use wrist rests. Regular breaks prevent strain and improve long-term performance for programmers, writers, and professionals."
    };

    // DOM Elements
    const startBtn = document.getElementById('startBtn');
    const restartBtn = document.getElementById('restartBtn');
    const passageSelect = document.getElementById('passageSelect');
    const timerSelect = document.getElementById('timerSelect');
    const timerDisplay = document.getElementById('timerDisplay');
    const typingArea = document.getElementById('typingArea');
    const passageDisplay = document.getElementById('passageDisplay');
    const typingInput = document.getElementById('typingInput');
    const keyboard = document.getElementById('keyboard');
    const wpmEl = document.getElementById('wpm');
    const accuracyEl = document.getElementById('accuracy');
    const charsEl = document.getElementById('chars');
    const mistakesEl = document.getElementById('mistakes');
    const modalOverlay = document.getElementById('modalOverlay');
    const resultsModal = document.getElementById('resultsModal');
    const finalWpm = document.getElementById('finalWpm');
    const finalAccuracy = document.getElementById('finalAccuracy');
    const finalMistakes = document.getElementById('finalMistakes');
    const finalCorrect = document.getElementById('finalCorrect');
    const exportBtn = document.getElementById('exportBtn');
    const tryAgainBtn = document.getElementById('tryAgainBtn');

    // State
    let testState = {
        isRunning: false,
        timeLeft: 60,
        timer: null,
        passage: '',
        typed: '',
        correctChars: 0,
        mistakes: 0,
        startTime: null
    };

    // Initialize test
    async function initTest() {
        await loadPassage();
        updateDisplay();
    }

    // Load passage
    async function loadPassage() {
        const length = passageSelect.value;
        // Show loading state
        passageDisplay.innerHTML = '<div style="text-align: center; color: var(--text-muted);">Loading passage...</div>';
        
        try {
            const res = await fetch(`https://baconipsum.com/api/?type=meat-and-filler&paras=2&format=text`);
            if (res.ok) {
                const text = await res.text();
                let passage = text.replace(/\s+/g, ' ').trim();
                if (length === 'short') passage = passage.slice(0, 50);
                else if (length === 'medium') passage = passage.slice(0, 150);
                else passage = passage.slice(0, 300);
                testState.passage = passage;
            } else {
                throw new Error('API failed');
            }
        } catch (e) {
            // Fallback
            testState.passage = passages[length];
        }
        renderPassage();
    }

    // Render passage
    function renderPassage() {
        passageDisplay.innerHTML = '';
        testState.passage.split('').forEach((char, index) => {
            const span = document.createElement('span');
            span.className = 'char';
            span.textContent = char === ' ' ? '·' : char;
            if (index === testState.typed.length) {
                span.classList.add('current');
            } else if (index < testState.typed.length) {
                if (testState.typed[index] === char) {
                    span.classList.add('correct');
                } else {
                    span.classList.add('incorrect');
                }
            }
            passageDisplay.appendChild(span);
        });
    }

    // Start test
    function startTest() {
        testState.isRunning = true;
        testState.timeLeft = parseInt(timerSelect.value);
        testState.startTime = Date.now();
        testState.typed = '';
        testState.correctChars = 0;
        testState.mistakes = 0;
        
        startBtn.style.display = 'none';
        restartBtn.style.display = 'inline-flex';
        typingArea.style.display = 'block';
        keyboard.style.display = 'block';
        typingInput.disabled = false;
        typingInput.focus();
        typingInput.value = '';
        
        startTimer();
        updateDisplay();
    }

    // Timer
    function startTimer() {
        updateTimerDisplay();
        testState.timer = setInterval(() => {
            testState.timeLeft--;
            updateTimerDisplay();
            
            if (testState.timeLeft <= 0) {
                endTest();
            }
        }, 1000);
    }

    // Update timer display
    function updateTimerDisplay() {
        const minutes = Math.floor(testState.timeLeft / 60);
        const seconds = testState.timeLeft % 60;
        timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    // End test
    function endTest() {
        testState.isRunning = false;
        clearInterval(testState.timer);
        typingInput.disabled = true;
        
        const timeMinutes = parseInt(timerSelect.value) / 60;
        const wpm = Math.round((testState.correctChars / 5) / timeMinutes);
        const accuracy = testState.typed.length > 0 
            ? Math.round((testState.correctChars / testState.typed.length) * 100) 
            : 100;
        
        finalWpm.textContent = wpm;
        finalAccuracy.textContent = accuracy + '%';
        finalMistakes.textContent = testState.mistakes;
        finalCorrect.textContent = testState.correctChars;
        
        modalOverlay.style.display = 'block';
        resultsModal.style.display = 'block';
        resultsModal.focus();
    }

    // Restart test
    function restartTest() {
        clearInterval(testState.timer);
        initTest();
        startBtn.style.display = 'inline-flex';
        restartBtn.style.display = 'none';
        typingArea.style.display = 'none';
        keyboard.style.display = 'none';
        modalOverlay.style.display = 'none';
        resultsModal.style.display = 'none';
        timerDisplay.textContent = '1:00';
    }

    // Update display
    function updateDisplay() {
        wpmEl.textContent = calculateWPM();
        accuracyEl.textContent = calculateAccuracy();
        charsEl.textContent = testState.correctChars;
        mistakesEl.textContent = testState.mistakes;
    }

    // Calculate WPM
    function calculateWPM() {
        if (!testState.isRunning || !testState.startTime) return 0;
        const elapsed = (Date.now() - testState.startTime) / 1000 / 60;
        return Math.round((testState.correctChars / 5) / elapsed) || 0;
    }

    // Calculate accuracy
    function calculateAccuracy() {
        if (testState.typed.length === 0) return '100%';
        const acc = Math.round((testState.correctChars / testState.typed.length) * 100);
        return acc + '%';
    }

    // Handle typing
    typingInput.addEventListener('input', (e) => {
        if (!testState.isRunning) return;
        
        const newTyped = e.target.value;
        const prevLen = testState.typed.length;
        const newLen = newTyped.length;
        
        // Backspace
        if (newLen < prevLen) {
            testState.typed = newTyped;
            renderPassage();
            return;
        }
        
        // New character
        const newChar = newTyped[newLen - 1];
        const expectedChar = testState.passage[newLen - 1];
        
        if (newChar === expectedChar) {
            testState.correctChars++;
        } else {
            testState.mistakes++;
            highlightKey(newChar, true);
        }
        
        testState.typed = newTyped;
        highlightKey(newChar, false);
        renderPassage();
        updateDisplay();
        
        // Auto-scroll passage
        const currentChar = passageDisplay.querySelector('.char.current');
        if (currentChar) {
            currentChar.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        }
    });

    // Keyboard visualizer
    function highlightKey(char, isError) {
        const key = keyboard.querySelector(`[data-key="${char.toLowerCase()}"]`);
        if (key) {
            key.classList.add(isError ? 'error' : 'active');
            setTimeout(() => {
                key.classList.remove('active', 'error');
            }, 200);
        }
    }

    // Export CSV
    function exportCSV() {
        const data = {
            wpm: finalWpm.textContent,
            accuracy: finalAccuracy.textContent,
            mistakes: finalMistakes.textContent,
            correct: finalCorrect.textContent,
            date: new Date().toLocaleString(),
            duration: timerSelect.value + 's'
        };
        
        const csv = `Metric,Value\nWPM,${data.wpm}\nAccuracy,${data.accuracy}\nMistakes,${data.mistakes}\nCorrect Characters,${data.correct}\nDate,${data.date}\nTest Duration,${data.duration}`;
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `typing-test-results-${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Event listeners
    startBtn.addEventListener('click', startTest);
    restartBtn.addEventListener('click', restartTest);
    passageSelect.addEventListener('change', loadPassage);
    exportBtn.addEventListener('click', exportCSV);
    tryAgainBtn.addEventListener('click', restartTest);
    
    // Prevent spacebar scrolling
    window.addEventListener('keydown', e => {
        if (e.code === 'Space' && e.target === typingInput) {
            e.stopPropagation();
        }
    });

    // Initialize
    initTest();
}

// Global smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// Initialize theme on page load
initTheme();
