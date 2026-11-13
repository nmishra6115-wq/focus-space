// 1. Daily Quotes
const QUOTES = [
  "Focus on being productive instead of busy.",
  "Small daily improvements lead to massive results.",
  "Starve your distractions, feed your focus.",
  "Your future is created by what you do today."
];
document.getElementById('daily-quote').textContent = `"${QUOTES[Math.floor(Math.random() * QUOTES.length)]}"`;

// 2. Zen Rain Mode Toggle
const zenBtn = document.getElementById('zen-mode-btn');
let isZen = false;
zenBtn.addEventListener('click', () => {
  isZen = !isZen;
  document.body.setAttribute('data-zen', isZen ? 'true' : 'false');
  zenBtn.textContent = isZen ? '✨ Exit Zen Mode' : '🌧️ Zen Rain Mode';
  if (isZen) {
    currentScene = 'rain';
    document.body.setAttribute('data-scene', 'rain');
    initSceneParticles();
  }
});

// 3. Live Animated Backgrounds
const bgCanvas = document.getElementById('bg-canvas');
const bgCtx = bgCanvas.getContext('2d');
let currentScene = localStorage.getItem('focusSpace_scene') || 'cosmos';
document.body.setAttribute('data-scene', currentScene);
let particles = [];

function resizeBgCanvas() {
  bgCanvas.width = window.innerWidth;
  bgCanvas.height = window.innerHeight;
  initSceneParticles();
}
window.addEventListener('resize', resizeBgCanvas);

function initSceneParticles() {
  particles = [];
  const count = currentScene === 'rain' ? 120 : 80;
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * bgCanvas.width,
      y: Math.random() * bgCanvas.height,
      len: currentScene === 'rain' ? Math.random() * 20 + 10 : Math.random() * 2 + 0.5,
      speedY: currentScene === 'rain' ? Math.random() * 8 + 6 : Math.random() * 0.3 + 0.1
    });
  }
}

function renderBackground() {
  bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
  if (currentScene === 'rain') {
    bgCtx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
    bgCtx.lineWidth = 1.2;
    particles.forEach(p => {
      p.y += p.speedY;
      if (p.y > bgCanvas.height) { p.y = -20; p.x = Math.random() * bgCanvas.width; }
      bgCtx.beginPath();
      bgCtx.moveTo(p.x, p.y);
      bgCtx.lineTo(p.x - 1, p.y + p.len);
      bgCtx.stroke();
    });
  } else {
    particles.forEach(p => {
      p.y -= p.speedY;
      if (p.y < 0) p.y = bgCanvas.height;
      bgCtx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      bgCtx.beginPath();
      bgCtx.arc(p.x, p.y, p.len, 0, Math.PI * 2);
      bgCtx.fill();
    });
  }
  requestAnimationFrame(renderBackground);
}

document.querySelectorAll('.scene-btn').forEach(btn => {
  btn.classList.toggle('active', btn.dataset.scene === currentScene);
  btn.addEventListener('click', () => {
    currentScene = btn.dataset.scene;
    document.body.setAttribute('data-scene', currentScene);
    localStorage.setItem('focusSpace_scene', currentScene);
    document.querySelectorAll('.scene-btn').forEach(b => b.classList.toggle('active', b === btn));
    initSceneParticles();
  });
});
resizeBgCanvas();
renderBackground();

// 4. Timer & XP System
const timerEl = document.getElementById('timer');
const statusEl = document.getElementById('timer-status');
const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');
const progressBar = document.getElementById('progress-bar');
const CIRCUMFERENCE = 2 * Math.PI * 102;
progressBar.style.strokeDasharray = CIRCUMFERENCE;

let defaultTime = 25 * 60;
let timeLeft = defaultTime;
let timerInterval = null;
let isRunning = false;

let profile = JSON.parse(localStorage.getItem('focusSpace_profile')) || { xp: 0, streak: 1 };

function addXP(amount) {
  profile.xp += amount;
  localStorage.setItem('focusSpace_profile', JSON.stringify(profile));
  updateProfileUI();
}

function updateProfileUI() {
  const level = Math.floor(profile.xp / 300) + 1;
  const nextXP = level * 300;
  const currentLevelXP = profile.xp % 300;
  document.getElementById('rank-title').textContent = `Lvl ${level} • Focus Flow`;
  document.getElementById('xp-current').textContent = profile.xp;
  document.getElementById('xp-next').textContent = nextXP;
  document.getElementById('xp-fill').style.width = `${(currentLevelXP / 300) * 100}%`;
  document.getElementById('streak-count').textContent = profile.streak;
}
updateProfileUI();

function updateTimerUI() {
  const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const secs = (timeLeft % 60).toString().padStart(2, '0');
  timerEl.textContent = `${mins}:${secs}`;
  progressBar.style.strokeDashoffset = ((defaultTime - timeLeft) / defaultTime) * CIRCUMFERENCE;
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
    statusEl.textContent = 'Deep work in progress...';
    timerInterval = setInterval(() => {
      if (timeLeft > 0) {
        timeLeft--;
        updateTimerUI();
      } else {
        clearInterval(timerInterval);
        isRunning = false;
        startBtn.textContent = 'Start Focus';
        statusEl.textContent = 'Session complete! +100 XP';
        addXP(100);
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

document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    clearInterval(timerInterval);
    isRunning = false;
    defaultTime = parseInt(btn.dataset.time, 10) * 60;
    timeLeft = defaultTime;
    startBtn.textContent = 'Start Focus';
    statusEl.textContent = 'Ready for deep work';
    updateTimerUI();
  });
});

// 5. Daily Top 3 Priorities & Personal Notepad
const todayKey = new Date().toLocaleDateString('en-CA');
const savedTasks = JSON.parse(localStorage.getItem(`focusSpace_tasks_${todayKey}`)) || [
  { text: '', done: false }, { text: '', done: false }, { text: '', done: false }
];

function saveTasks() {
  localStorage.setItem(`focusSpace_tasks_${todayKey}`, JSON.stringify(savedTasks));
  const doneCount = savedTasks.filter(t => t.done).length;
  document.getElementById('priority-badge').textContent = `${doneCount} / 3`;
}

savedTasks.forEach((task, idx) => {
  const checkbox = document.getElementById(`check-${idx}`);
  const textInput = document.getElementById(`text-${idx}`);
  const li = checkbox.closest('.task-item');

  checkbox.checked = task.done;
  textInput.value = task.text;
  if (task.done) li.classList.add('done');

  checkbox.addEventListener('change', () => {
    savedTasks[idx].done = checkbox.checked;
    li.classList.toggle('done', checkbox.checked);
    if (checkbox.checked) addXP(25);
    saveTasks();
  });

  textInput.addEventListener('input', () => {
    savedTasks[idx].text = textInput.value;
    saveTasks();
  });
});
saveTasks();

const notepad = document.getElementById('personal-notes');
notepad.value = localStorage.getItem('focusSpace_notepad') || '';
notepad.addEventListener('input', () => {
  localStorage.setItem('focusSpace_notepad', notepad.value);
  document.getElementById('notes-status').textContent = 'Saved';
  setTimeout(() => { document.getElementById('notes-status').textContent = 'Auto-saved'; }, 600);
});

// 6. Native Audio Stream Switcher
function switchAudio(streamUrl, labelText, btnEl) {
  const audioEl = document.getElementById('audio-stream');
  const sourceEl = document.getElementById('audio-source');
  const labelEl = document.getElementById('now-playing-label');

  sourceEl.src = streamUrl;
  labelEl.textContent = labelText;
  audioEl.load();
  audioEl.play().catch(e => console.log("Playback prevented:", e));

  if (btnEl) {
    document.querySelectorAll('.vibe-btn').forEach(b => b.classList.remove('active'));
    btnEl.classList.add('active');
  }
}

// 7. Friends & Chat Modal
const modal = document.getElementById('friends-modal');
document.getElementById('toggle-friends-btn').addEventListener('click', () => modal.classList.add('open'));
document.getElementById('close-friends-btn').addEventListener('click', () => modal.classList.remove('open'));

const chatMsgs = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
function sendChatMessage() {
  if (!chatInput.value.trim()) return;
  const div = document.createElement('div');
  div.className = 'chat-msg';
  div.innerHTML = `<strong>You:</strong> ${chatInput.value}`;
  chatMsgs.appendChild(div);
  chatInput.value = '';
  chatMsgs.scrollTop = chatMsgs.scrollHeight;
}
document.getElementById('send-chat-btn').addEventListener('click', sendChatMessage);
chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendChatMessage(); });

// 8. Mini-Game
let gameScore = 0;
const gameBtn = document.getElementById('game-start-btn');
gameBtn.addEventListener('click', () => {
  gameScore++;
  document.getElementById('game-score').textContent = gameScore;
  gameBtn.textContent = `⭐ Clicked! (${gameScore})`;
  setTimeout(() => { gameBtn.textContent = 'Play Catch Star'; }, 400);
});

updateTimerUI();