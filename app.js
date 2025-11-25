// app.js
/*
README: PirateRuler.com Typing Test Application
This file contains all JavaScript functionality for both index.html and test.html.
- Theme toggle (dark/light)
- Off-canvas menu
- Typing test logic (timer, WPM, accuracy)
- Keyboard visualizer
- CSV export
- API fallback for passages
*/

// Theme Management
const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;

function initTheme() {
    const saved = localStorage.getItem('theme');
    if (saved) {
        html.setAttribute('data-theme', saved);
    }
}

function toggleTheme() {
    const current = html.getAttribute('data-theme');
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
}

function closeMenu() {
    menu.classList.remove('active');
    menuOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

if (menuToggle) menuToggle.addEventListener('click', openMenu);
if (menuClose) menuClose.addEventListener('click', closeMenu);
if (menuOverlay) menuOverlay.addEventListener('click', closeMenu);

// Typing Test Logic (only run on test.html)
const testPage = document.querySelector('.test-main');
if (testPage) {
    // Passages with fallbacks
    const passages = {
        short: "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.",
        medium: "JavaScript is a versatile programming language that powers the modern web. Developers use it to create interactive experiences, from simple animations to complex applications. Its flexibility and wide browser support make it essential for front-end development.",
        long: "In the realm of digital communication, typing speed remains a critical skill. Whether you're a programmer writing code, a writer crafting stories, or a professional sending emails, efficient keyboard use saves countless hours. Regular practice with accurate measurement tools helps build muscle memory and improve accuracy over time."
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

    // Load passage (with API attempt)
    async function loadPassage() {
        const length = passageSelect.value;
        try {
            const res = await fetch(`https://baconipsum.com/api/?type=meat-and-filler&paras=1&format=text`);
            if (res.ok) {
                const text = await res.text();
                // Limit length
                if (length === 'short') testState.passage = text.slice(0, 50);
                else if (length === 'medium') testState.passage = text.slice(0, 150);
                else testState.passage = text.slice(0, 300);
            } else {
                throw new Error('API failed');
            }
        } catch (e) {
            // Fallback to local passages
            testState.passage = passages[length];
        }
        renderPassage();
    }

    // Render passage with highlighting
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
        testState.timer = setInterval(() => {
            testState.timeLeft--;
            const minutes = Math.floor(testState.timeLeft / 60);
            const seconds = testState.timeLeft % 60;
            timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            if (testState.timeLeft <= 0) {
                endTest();
            }
        }, 1000);
    }

    // End test
    function endTest() {
        testState.isRunning = false;
        clearInterval(testState.timer);
        typingInput.disabled = true;
        
        // Calculate final stats
        const timeMinutes = parseInt(timerSelect.value) / 60;
        const wpm = Math.round((testState.correctChars / 5) / timeMinutes);
        const accuracy = testState.typed.length > 0 
            ? Math.round((testState.correctChars / testState.typed.length) * 100) 
            : 100;
        
        // Show modal
        finalWpm.textContent = wpm;
        finalAccuracy.textContent = accuracy + '%';
        finalMistakes.textContent = testState.mistakes;
        finalCorrect.textContent = testState.correctChars;
        
        modalOverlay.style.display = 'block';
        resultsModal.style.display = 'block';
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
        const elapsed = (Date.now() - testState.startTime) / 1000 / 60; // minutes
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
        
        // Handle backspace or delete
        if (newLen < prevLen) {
            testState.typed = newTyped;
            renderPassage();
            return;
        }
        
        // Process new character
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
            date: new Date().toISOString()
        };
        
        const csv = `Metric,Value\nWPM,${data.wpm}\nAccuracy,${data.accuracy}\nMistakes,${data.mistakes}\nCorrect,${data.correct}\nDate,${data.date}`;
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `typing-test-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // Event listeners
    startBtn.addEventListener('click', startTest);
    restartBtn.addEventListener('click', restartTest);
    passageSelect.addEventListener('change', loadPassage);
    exportBtn.addEventListener('click', exportCSV);
    tryAgainBtn.addEventListener('click', restartTest);

    // Initialize
    initTest();
}

// Initialize theme on page load
initTheme();
