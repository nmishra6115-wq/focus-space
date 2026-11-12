// 1. Display Today's Date
const dateDisplay = document.getElementById('date-display');
const todayKey = new Date().toLocaleDateString('en-IN');
dateDisplay.textContent = new Date().toLocaleDateString('en-IN', {
  weekday: 'long',
  day: 'numeric',
  month: 'short',
  year: 'numeric'
});

// 2. Circular Progress Ring & Pomodoro Timer Setup
const timerEl = document.getElementById('timer');
const statusEl = document.getElementById('timer-status');
const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');
const modeBtns = document.querySelectorAll('.mode-btn');
const progressBar = document.getElementById('progress-bar');

const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * 115; // r = 115 -> ~722.5
progressBar.style.strokeDasharray = CIRCLE_CIRCUMFERENCE;

const MODE_THEMES = {
  focus: { accent: '#6366f1', hover: '#4f46e5', label: 'Ready to focus' },
  short: { accent: '#10b981', hover: '#059669', label: 'Take a quick breather' },
  long:  { accent: '#0ea5e9', hover: '#0284c7', label: 'Recharge your mind' }
};

let currentMode = 'focus';
let defaultTime = 25 * 60;
let timeLeft = defaultTime;
let timerInterval = null;
let isRunning = false;

function updateUI() {
  const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const secs = (timeLeft % 60).toString().padStart(2, '0');
  timerEl.textContent = `${mins}:${secs}`;
  document.title = `${mins}:${secs} — FocusSpace`;

  // Update SVG circular progress ring
  const progressRatio = (defaultTime - timeLeft) / defaultTime;
  const offset = progressRatio * CIRCLE_CIRCUMFERENCE;
  progressBar.style.strokeDashoffset = offset;
}

function playCompletionChime() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(528, ctx.currentTime); // Calming 528Hz chime
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 1.5);
}

startBtn.addEventListener('click', () => {
  if (isRunning) {
    clearInterval(timerInterval);
    isRunning = false;
    startBtn.textContent = 'Resume';
    statusEl.textContent = 'Paused';
  } else {
    isRunning = true;
    startBtn.textContent = 'Pause';
    statusEl.textContent = currentMode === 'focus' ? 'Deep work in progress...' : 'Break time...';

    timerInterval = setInterval(() => {
      if (timeLeft > 0) {
        timeLeft--;
        updateUI();
      } else {
        clearInterval(timerInterval);
        isRunning = false;
        startBtn.textContent = 'Start Session';
        statusEl.textContent = 'Session complete!';
        playCompletionChime();
      }
    }, 1000);
  }
});

resetBtn.addEventListener('click', () => {
  clearInterval(timerInterval);
  isRunning = false;
  timeLeft = defaultTime;
  startBtn.textContent = 'Start Session';
  statusEl.textContent = MODE_THEMES[currentMode].label;
  updateUI();
});

modeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    modeBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    clearInterval(timerInterval);
    isRunning = false;

    currentMode = btn.dataset.mode;
    defaultTime = parseInt(btn.dataset.time) * 60;
    timeLeft = defaultTime;

    // Apply dynamic theme colour
    const theme = MODE_THEMES[currentMode];
    document.documentElement.style.setProperty('--accent', theme.accent);
    document.documentElement.style.setProperty('--accent-hover', theme.hover);
    statusEl.textContent = theme.label;
    startBtn.textContent = 'Start Session';
    updateUI();
  });
});

// 3. Daily Top 3 Priorities (Auto-Resets Every Morning)
const STORAGE_KEY = 'focusSpace_dailyTasks';
let savedData = JSON.parse(localStorage.getItem(STORAGE_KEY));

if (!savedData || savedData.date !== todayKey) {
  savedData = {
    date: todayKey,
    tasks: [
      { text: '', done: false },
      { text: '', done: false },
      { text: '', done: false }
    ]
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(savedData));
}

for (let i = 0; i < 3; i++) {
  const checkbox = document.getElementById(`check-${i}`);
  const textInput = document.getElementById(`text-${i}`);

  checkbox.checked = savedData.tasks[i].done;
  textInput.value = savedData.tasks[i].text;

  checkbox.addEventListener('change', () => {
    savedData.tasks[i].done = checkbox.checked;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedData));
  });

  textInput.addEventListener('input', () => {
    savedData.tasks[i].text = textInput.value;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedData));
  });
}

// 4. Web Audio API Ambient Sound Generator
let audioCtx = null;
let noiseNode = null;
let gainNode = null;
let activeSound = null;

const rainBtn = document.getElementById('rain-btn');
const brownBtn = document.getElementById('brown-btn');
const volumeSlider = document.getElementById('volume-slider');

function stopSound() {
  if (noiseNode) {
    noiseNode.disconnect();
    noiseNode = null;
  }
  rainBtn.classList.remove('active');
  brownBtn.classList.remove('active');
  activeSound = null;
}

function playAmbientNoise(type) {
  if (activeSound === type) {
    stopSound();
    return;
  }
  stopSound();

  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }

  const bufferSize = 2 * audioCtx.sampleRate;
  const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const output = noiseBuffer.getChannelData(0);

  let lastOut = 0.0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    if (type === 'brown') {
      output[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5;
    } else {
      output[i] = (lastOut + (0.08 * white)) / 1.08;
      lastOut = output[i];
      output[i] *= 1.8;
    }
  }

  noiseNode = audioCtx.createBufferSource();
  noiseNode.buffer = noiseBuffer;
  noiseNode.loop = true;

  gainNode = audioCtx.createGain();
  gainNode.gain.value = volumeSlider.value;

  noiseNode.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  noiseNode.start(0);

  activeSound = type;
  if (type === 'rain') rainBtn.classList.add('active');
  if (type === 'brown') brownBtn.classList.add('active');
}

rainBtn.addEventListener('click', () => playAmbientNoise('rain'));
brownBtn.addEventListener('click', () => playAmbientNoise('brown'));

volumeSlider.addEventListener('input', (e) => {
  if (gainNode) {
    gainNode.gain.value = e.target.value;
  }
});

// Initialize display
updateUI();