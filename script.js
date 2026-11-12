// 1. Date & Streak Helpers
const dateDisplay = document.getElementById('date-display');
const today = new Date();
const todayKey = today.toLocaleDateString('en-CA'); // YYYY-MM-DD format
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);
const yesterdayKey = yesterday.toLocaleDateString('en-CA');

dateDisplay.textContent = today.toLocaleDateString('en-IN', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric'
});

// 2. Atmosphere Theme Switcher
const themeDots = document.querySelectorAll('.theme-dot');
const savedTheme = localStorage.getItem('focusSpace_theme') || 'midnight';
document.body.setAttribute('data-theme', savedTheme);
themeDots.forEach(dot => {
  dot.classList.toggle('active', dot.dataset.theme === savedTheme);
  dot.addEventListener('click', () => {
    const chosen = dot.dataset.theme;
    document.body.setAttribute('data-theme', chosen);
    localStorage.setItem('focusSpace_theme', chosen);
    themeDots.forEach(d => d.classList.remove('active'));
    dot.classList.add('active');
  });
});

// 3. Streak & Daily Session Counter Logic
const streakCountEl = document.getElementById('streak-count');
const sessionsTodayEl = document.getElementById('sessions-today');

let stats = JSON.parse(localStorage.getItem('focusSpace_stats')) || {
  streak: 0,
  lastActiveDate: null,
  todayDate: todayKey,
  sessionsToday: 0
};

// Reset today's session count if it's a new day
if (stats.todayDate !== todayKey) {
  stats.todayDate = todayKey;
  stats.sessionsToday = 0;
  // Reset streak if user missed yesterday
  if (stats.lastActiveDate !== yesterdayKey) {
    stats.streak = 0;
  }
  localStorage.setItem('focusSpace_stats', JSON.stringify(stats));
}

function updateStatsUI() {
  streakCountEl.textContent = stats.streak;
  sessionsTodayEl.textContent = stats.sessionsToday;
}

function recordCompletedFocusSession() {
  stats.sessionsToday += 1;
  if (stats.lastActiveDate !== todayKey) {
    stats.streak = (stats.lastActiveDate === yesterdayKey) ? stats.streak + 1 : 1;
    stats.lastActiveDate = todayKey;
  }
  localStorage.setItem('focusSpace_stats', JSON.stringify(stats));
  updateStatsUI();
  launchConfetti();
}

updateStatsUI();

// 4. Circular Progress Ring & Pomodoro Timer
const timerEl = document.getElementById('timer');
const statusEl = document.getElementById('timer-status');
const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');
const modeBtns = document.querySelectorAll('.mode-btn');
const progressBar = document.getElementById('progress-bar');

const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * 115;
progressBar.style.strokeDasharray = CIRCLE_CIRCUMFERENCE;

let currentMode = 'focus';
let defaultTime = 25 * 60;
let timeLeft = defaultTime;
let timerInterval = null;
let isRunning = false;

function updateTimerUI() {
  const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const secs = (timeLeft % 60).toString().padStart(2, '0');
  timerEl.textContent = `${mins}:${secs}`;
  document.title = `${mins}:${secs} — FocusSpace`;

  const progressRatio = (defaultTime - timeLeft) / defaultTime;
  progressBar.style.strokeDashoffset = progressRatio * CIRCLE_CIRCUMFERENCE;
}

function playCompletionChime() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(528, ctx.currentTime);
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
        updateTimerUI();
      } else {
        clearInterval(timerInterval);
        isRunning = false;
        startBtn.textContent = 'Start Session';
        statusEl.textContent = 'Session complete!';
        playCompletionChime();
        if (currentMode === 'focus') {
          recordCompletedFocusSession();
        }
      }
    }, 1000);
  }
});

resetBtn.addEventListener('click', () => {
  clearInterval(timerInterval);
  isRunning = false;
  timeLeft = defaultTime;
  startBtn.textContent = 'Start Session';
  statusEl.textContent = currentMode === 'focus' ? 'Ready to focus' : 'Ready for break';
  updateTimerUI();
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
    startBtn.textContent = 'Start Session';
    statusEl.textContent = currentMode === 'focus' ? 'Ready to focus' : 'Ready for break';
    updateTimerUI();
  });
});

// 5. Daily Top 3 Priorities (Auto-Resets Daily + Confetti on 3/3)
const TASK_STORAGE_KEY = 'focusSpace_dailyTasks';
const priorityBadge = document.getElementById('priority-badge');
let savedTasks = JSON.parse(localStorage.getItem(TASK_STORAGE_KEY));

if (!savedTasks || savedTasks.date !== todayKey) {
  savedTasks = {
    date: todayKey,
    tasks: [
      { text: '', done: false },
      { text: '', done: false },
      { text: '', done: false }
    ]
  };
  localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(savedTasks));
}

function updatePriorityProgress(triggerCelebration = false) {
  const completedCount = savedTasks.tasks.filter(t => t.done).length;
  priorityBadge.textContent = `${completedCount} / 3 Done`;
  if (completedCount === 3 && triggerCelebration) {
    launchConfetti();
  }
}

for (let i = 0; i < 3; i++) {
  const checkbox = document.getElementById(`check-${i}`);
  const textInput = document.getElementById(`text-${i}`);

  checkbox.checked = savedTasks.tasks[i].done;
  textInput.value = savedTasks.tasks[i].text;

  checkbox.addEventListener('change', () => {
    savedTasks.tasks[i].done = checkbox.checked;
    localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(savedTasks));
    updatePriorityProgress(checkbox.checked);
  });

  textInput.addEventListener('input', () => {
    savedTasks.tasks[i].text = textInput.value;
    localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(savedTasks));
  });
}

updatePriorityProgress(false);

// 6. Procedural Ambient Soundscapes (4 Modes)
let audioCtx = null;
let noiseNode = null;
let gainNode = null;
let activeSound = null;

const soundBtns = document.querySelectorAll('.sound-btn');
const volumeSlider = document.getElementById('volume-slider');

function stopSound() {
  if (noiseNode) {
    noiseNode.disconnect();
    noiseNode = null;
  }
  soundBtns.forEach(b => b.classList.remove('active'));
  activeSound = null;
}

function playAmbientNoise(type, btnEl) {
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
    } else if (type === 'rain') {
      output[i] = (lastOut + (0.09 * white)) / 1.09;
      lastOut = output[i];
      output[i] *= 1.8;
    } else if (type === 'cafe') {
      const rumble = Math.sin(i * 0.008) * 0.15;
      output[i] = ((lastOut + (0.04 * white)) / 1.04) * 2.2 + rumble * 0.2;
      lastOut = output[i] * 0.4;
    } else if (type === 'wind') {
      const breeze = (Math.sin(i * 0.00015) + 1.2) * 0.5;
      output[i] = ((lastOut + (0.03 * white)) / 1.03) * 2.5 * breeze;
      lastOut = output[i] * 0.5;
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
  btnEl.classList.add('active');
}

soundBtns.forEach(btn => {
  btn.addEventListener('click', () => playAmbientNoise(btn.dataset.sound, btn));
});

volumeSlider.addEventListener('input', (e) => {
  if (gainNode) {
    gainNode.gain.value = e.target.value;
  }
});

// 7. Lightweight Confetti Animation
function launchConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#06b6d4'];
  const pieces = Array.from({ length: 90 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height - canvas.height,
    size: Math.random() * 7 + 4,
    color: colors[Math.floor(Math.random() * colors.length)],
    speedY: Math.random() * 3 + 2,
    speedX: Math.random() * 2 - 1,
    angle: Math.random() * 360
  }));

  let frame = 0;
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      p.y += p.speedY;
      p.x += p.speedX;
      p.angle += 4;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    frame++;
    if (frame < 140) {
      requestAnimationFrame(animate);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
  animate();
}

// Initialize Timer Display
updateTimerUI();