// 1. Curated Daily Quotes
const QUOTES = [
  "Focus on being productive instead of busy.",
  "Small daily improvements are the key to staggering long-term results.",
  "Starve your distractions, feed your focus.",
  "Your future is created by what you do today, not tomorrow.",
  "Deep work is the superpower of the 21st century.",
  "Win the morning, win the day."
];
const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
document.getElementById('daily-quote').textContent = `"${QUOTES[dayOfYear % QUOTES.length]}"`;

// 2. Date Keys
const today = new Date();
const todayKey = today.toLocaleDateString('en-CA');
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);
const yesterdayKey = yesterday.toLocaleDateString('en-CA');

// 3. Live Animated Background Canvas (Cosmos / Rain / Aurora / Zen)
const bgCanvas = document.getElementById('bg-canvas');
const bgCtx = bgCanvas.getContext('2d');
let currentScene = localStorage.getItem('focusSpace_scene') || 'cosmos';
let particles = [];

function resizeBgCanvas() {
  bgCanvas.width = window.innerWidth;
  bgCanvas.height = window.innerHeight;
  initSceneParticles();
}
window.addEventListener('resize', resizeBgCanvas);

function initSceneParticles() {
  particles = [];
  if (currentScene === 'cosmos') {
    for (let i = 0; i < 85; i++) {
      particles.push({
        x: Math.random() * bgCanvas.width,
        y: Math.random() * bgCanvas.height,
        r: Math.random() * 1.8 + 0.4,
        speedY: Math.random() * 0.25 + 0.05,
        alpha: Math.random()
      });
    }
  } else if (currentScene === 'rain') {
    for (let i = 0; i < 110; i++) {
      particles.push({
        x: Math.random() * bgCanvas.width,
        y: Math.random() * bgCanvas.height,
        len: Math.random() * 18 + 10,
        speedY: Math.random() * 7 + 6
      });
    }
  }
}

let auroraPhase = 0;
function renderBackground() {
  bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);

  if (currentScene === 'cosmos') {
    particles.forEach(p => {
      p.y -= p.speedY;
      if (p.y < 0) p.y = bgCanvas.height;
      bgCtx.fillStyle = `rgba(255, 255, 255, ${0.25 + Math.sin(Date.now() * 0.002 + p.alpha * 10) * 0.25})`;
      bgCtx.beginPath();
      bgCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      bgCtx.fill();
    });
  } else if (currentScene === 'rain') {
    bgCtx.strokeStyle = 'rgba(56, 189, 248, 0.22)';
    bgCtx.lineWidth = 1.2;
    particles.forEach(p => {
      p.y += p.speedY;
      if (p.y > bgCanvas.height) {
        p.y = -20;
        p.x = Math.random() * bgCanvas.width;
      }
      bgCtx.beginPath();
      bgCtx.moveTo(p.x, p.y);
      bgCtx.lineTo(p.x - 1.5, p.y + p.len);
      bgCtx.stroke();
    });
  } else if (currentScene === 'aurora') {
    auroraPhase += 0.008;
    const grad = bgCtx.createRadialGradient(
      bgCanvas.width * (0.5 + Math.sin(auroraPhase) * 0.2),
      bgCanvas.height * 0.2,
      40,
      bgCanvas.width * 0.5,
      bgCanvas.height * 0.4,
      bgCanvas.width * 0.7
    );
    grad.addColorStop(0, 'rgba(16, 185, 129, 0.16)');
    grad.addColorStop(0.5, 'rgba(6, 182, 212, 0.07)');
    grad.addColorStop(1, 'transparent');
    bgCtx.fillStyle = grad;
    bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
  }
  requestAnimationFrame(renderBackground);
}

const sceneBtns = document.querySelectorAll('.scene-btn');
function applyScene(scene) {
  currentScene = scene;
  document.body.setAttribute('data-scene', scene);
  localStorage.setItem('focusSpace_scene', scene);
  sceneBtns.forEach(b => b.classList.toggle('active', b.dataset.scene === scene));
  initSceneParticles();
}
sceneBtns.forEach(btn => btn.addEventListener('click', () => applyScene(btn.dataset.scene)));
applyScene(currentScene);
resizeBgCanvas();
renderBackground();

// 4. RPG XP, Streak & Weekly Focus Chart
const RANKS = [
  { minXp: 0, title: 'Novice' },
  { minXp: 300, title: 'Apprentice' },
  { minXp: 800, title: 'Deep Worker' },
  { minXp: 1600, title: 'Flow Master' },
  { minXp: 3000, title: 'Zen Legend' }
];

let profile = JSON.parse(localStorage.getItem('focusSpace_profile')) || {
  xp: 0,
  streak: 0,
  lastActiveDate: null,
  weeklyMinutes: {} // { 'YYYY-MM-DD': 50 }
};

if (profile.lastActiveDate && profile.lastActiveDate !== todayKey && profile.lastActiveDate !== yesterdayKey) {
  profile.streak = 0;
  localStorage.setItem('focusSpace_profile', JSON.stringify(profile));
}

function addXP(amount) {
  profile.xp += amount;
  localStorage.setItem('focusSpace_profile', JSON.stringify(profile));
  renderProfileUI();
}

function renderProfileUI() {
  // Rank calculation
  let level = 1;
  let rankName = RANKS[0].title;
  let nextThreshold = 300;
  let prevThreshold = 0;

  for (let i = 0; i < RANKS.length; i++) {
    if (profile.xp >= RANKS[i].minXp) {
      level = i + 1;
      rankName = RANKS[i].title;
      prevThreshold = RANKS[i].minXp;
      nextThreshold = RANKS[i + 1] ? RANKS[i + 1].minXp : RANKS[i].minXp + 1500;
    }
  }

  document.getElementById('rank-title').textContent = `Lvl ${level} • ${rankName}`;
  document.getElementById('xp-current').textContent = profile.xp;
  document.getElementById('xp-next').textContent = nextThreshold;
  const pct = Math.min(100, Math.round(((profile.xp - prevThreshold) / (nextThreshold - prevThreshold)) * 100));
  document.getElementById('xp-fill').style.width = `${pct}%`;
  document.getElementById('streak-count').textContent = profile.streak;

  // Weekly Chart
  const chartEl = document.getElementById('weekly-chart');
  chartEl.innerHTML = '';
  const todayMins = profile.weeklyMinutes[todayKey] || 0;
  document.getElementById('today-mins-label').textContent = `${todayMins}m today`;

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString('en-CA');
    const dayName = d.toLocaleDateString('en-IN', { weekday: 'short' }).slice(0, 2);
    const mins = profile.weeklyMinutes[key] || 0;
    const heightPct = Math.min(100, Math.round((mins / 120) * 100)); // 120m = full bar

    const col = document.createElement('div');
    col.className = `day-col ${i === 0 ? 'today' : ''}`;
    col.innerHTML = `
      <div class="bar-track" title="${mins} mins">
        <div class="bar-fill" style="height: ${Math.max(6, heightPct)}%;"></div>
      </div>
      <span class="day-label">${dayName}</span>
    `;
    chartEl.appendChild(col);
  }
}
renderProfileUI();

// 5. Circular Pomodoro Timer
const timerEl = document.getElementById('timer');
const statusEl = document.getElementById('timer-status');
const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');
const modeBtns = document.querySelectorAll('.mode-btn');
const progressBar = document.getElementById('progress-bar');

const CIRCUMFERENCE = 2 * Math.PI * 102;
progressBar.style.strokeDasharray = CIRCUMFERENCE;

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
  progressBar.style.strokeDashoffset = ((defaultTime - timeLeft) / defaultTime) * CIRCUMFERENCE;
}

function playChime() {
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
    statusEl.textContent = currentMode === 'focus' ? 'In the zone...' : 'Recharging...';

    timerInterval = setInterval(() => {
      if (timeLeft > 0) {
        timeLeft--;
        updateTimerUI();
      } else {
        clearInterval(timerInterval);
        isRunning = false;
        startBtn.textContent = 'Start Focus';
        statusEl.textContent = 'Session complete! +100 XP';
        playChime();

        if (currentMode === 'focus') {
          const completedMins = Math.round(defaultTime / 60);
          profile.weeklyMinutes[todayKey] = (profile.weeklyMinutes[todayKey] || 0) + completedMins;
          if (profile.lastActiveDate !== todayKey) {
            profile.streak = (profile.lastActiveDate === yesterdayKey) ? profile.streak + 1 : 1;
            profile.lastActiveDate = todayKey;
          }
          addXP(100);
          launchConfetti();
        }
      }
    }, 1000);
  }
});

resetBtn.addEventListener('click', () => {
  clearInterval(timerInterval);
  isRunning = false;
  timeLeft = defaultTime;
  startBtn.textContent = 'Start Focus';
  statusEl.textContent = 'Ready for deep work';
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
    startBtn.textContent = currentMode === 'focus' ? 'Start Focus' : 'Start Break';
    statusEl.textContent = currentMode === 'focus' ? 'Ready for deep work' : 'Take a breather';
    updateTimerUI();
  });
});

// 6. Daily Top 3 Priorities
const TASK_KEY = 'focusSpace_tasks_v2';
const priorityBadge = document.getElementById('priority-badge');
let savedTasks = JSON.parse(localStorage.getItem(TASK_KEY));

if (!savedTasks || savedTasks.date !== todayKey) {
  savedTasks = {
    date: todayKey,
    tasks: [
      { text: '', done: false, rewarded: false },
      { text: '', done: false, rewarded: false },
      { text: '', done: false, rewarded: false }
    ]
  };
  localStorage.setItem(TASK_KEY, JSON.stringify(savedTasks));
}

function updatePriorityUI(celebrate = false) {
  const doneCount = savedTasks.tasks.filter(t => t.done).length;
  priorityBadge.textContent = `${doneCount} / 3`;
  if (doneCount === 3 && celebrate) launchConfetti();
}

for (let i = 0; i < 3; i++) {
  const cb = document.getElementById(`check-${i}`);
  const inp = document.getElementById(`text-${i}`);
  cb.checked = savedTasks.tasks[i].done;
  inp.value = savedTasks.tasks[i].text;

  cb.addEventListener('change', () => {
    savedTasks.tasks[i].done = cb.checked;
    if (cb.checked && !savedTasks.tasks[i].rewarded) {
      savedTasks.tasks[i].rewarded = true;
      addXP(25);
    }
    localStorage.setItem(TASK_KEY, JSON.stringify(savedTasks));
    updatePriorityUI(cb.checked);
  });

  inp.addEventListener('input', () => {
    savedTasks.tasks[i].text = inp.value;
    localStorage.setItem(TASK_KEY, JSON.stringify(savedTasks));
  });
}
updatePriorityUI(false);

// 7. Auto-Saving Brain Dump Scratchpad
const scratchpad = document.getElementById('scratchpad');
const saveStatus = document.getElementById('save-status');
scratchpad.value = localStorage.getItem('focusSpace_notes') || '';

scratchpad.addEventListener('input', () => {
  localStorage.setItem('focusSpace_notes', scratchpad.value);
  saveStatus.textContent = 'Saving...';
  setTimeout(() => { saveStatus.textContent = 'Auto-saved'; }, 500);
});

// 8. Multi-Track Layerable Ambient Sound Mixer
let mixerCtx = null;
const channels = {};

function initAudioChannel(type) {
  if (!mixerCtx) mixerCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (channels[type]) return channels[type];

  const gainNode = mixerCtx.createGain();
  gainNode.gain.value = 0;
  gainNode.connect(mixerCtx.destination);

  if (type === 'binaural') {
    // 40Hz Gamma Focus Beat (200Hz Left + 240Hz Right)
    const merger = mixerCtx.createChannelMerger(2);
    const oscL = mixerCtx.createOscillator();
    const oscR = mixerCtx.createOscillator();
    oscL.frequency.value = 200;
    oscR.frequency.value = 240;
    oscL.connect(merger, 0, 0);
    oscR.connect(merger, 0, 1);
    merger.connect(gainNode);
    oscL.start();
    oscR.start();
  } else {
    const bufferSize = 2 * mixerCtx.sampleRate;
    const buffer = mixerCtx.createBuffer(1, bufferSize, mixerCtx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      if (type === 'brown') {
        data[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5;
      } else if (type === 'rain') {
        data[i] = (lastOut + 0.09 * white) / 1.09;
        lastOut = data[i];
        data[i] *= 1.8;
      } else if (type === 'wind') {
        const mod = (Math.sin(i * 0.00015) + 1.2) * 0.5;
        data[i] = ((lastOut + 0.03 * white) / 1.03) * 2.5 * mod;
        lastOut = data[i] * 0.5;
      }
    }
    const source = mixerCtx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(gainNode);
    source.start();
  }

  channels[type] = gainNode;
  return gainNode;
}

function setChannelVolume(type, val) {
  const gain = initAudioChannel(type);
  gain.gain.setTargetAtTime(val * 0.4, mixerCtx.currentTime, 0.05);

  const card = document.querySelector(`.sound-channel[data-sound="${type}"]`);
  const slider = card.querySelector('.channel-slider');
  const pct = card.querySelector('.vol-pct');

  slider.value = val;
  pct.textContent = `${Math.round(val * 100)}%`;
  card.classList.toggle('active', val > 0);
}

document.querySelectorAll('.channel-slider').forEach(slider => {
  slider.addEventListener('input', e => {
    setChannelVolume(e.target.dataset.sound, parseFloat(e.target.value));
  });
});

document.querySelectorAll('.channel-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const type = btn.dataset.sound;
    const slider = document.querySelector(`.channel-slider[data-sound="${type}"]`);
    const currentVal = parseFloat(slider.value);
    setChannelVolume(type, currentVal > 0 ? 0 : 0.5);
  });
});

document.getElementById('mute-all-btn').addEventListener('click', () => {
  ['rain', 'brown', 'binaural', 'wind'].forEach(type => {
    if (channels[type]) setChannelVolume(type, 0);
  });
});

// 9. Confetti Celebration
function launchConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#38bdf8'];
  const pieces = Array.from({ length: 100 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height - canvas.height,
    size: Math.random() * 7 + 4,
    color: colors[Math.floor(Math.random() * colors.length)],
    speedY: Math.random() * 3.5 + 2,
    speedX: Math.random() * 2 - 1
  }));

  let frame = 0;
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      p.y += p.speedY;
      p.x += p.speedX;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    frame++;
    if (frame < 140) requestAnimationFrame(animate);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  animate();
}

updateTimerUI();