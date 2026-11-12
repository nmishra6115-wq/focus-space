// 1. Curated Daily Quotes
const QUOTES = [
  "Focus on being productive instead of busy.",
  "Small daily improvements lead to massive results.",
  "Starve your distractions, feed your focus.",
  "Your future is created by what you do today."
];
document.getElementById('daily-quote').textContent = `"${QUOTES[Math.floor(Math.random() * QUOTES.length)]}"`;

const todayKey = new Date().toLocaleDateString('en-CA');

// 2. Zen Rain Mode Toggle
const zenBtn = document.getElementById('zen-mode-btn');
let isZen = false;
zenBtn.addEventListener('click', () => {
  isZen = !isZen;
  document.body.setAttribute('data-zen', isZen ? 'true' : 'false');
  zenBtn.textContent = isZen ? '✨ Exit Zen Mode' : '🌧️ Zen Rain Mode';
  if (isZen) {
    document.body.setAttribute('data-scene', 'rain');
    initSceneParticles();
  }
});

// 3. Live Animated Backgrounds
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
function updateProfileUI() {
  document.getElementById('xp-current').textContent = profile.xp;
  document.getElementById('xp-fill').style.width = `${Math.min(100, (profile.xp / 500) * 100)}%`;
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
        profile.xp += 100;
        localStorage.setItem('focusSpace_profile', JSON.stringify(profile));
        updateProfileUI();
      }
    }, 1000);
  }
});

resetBtn.addEventListener('click', () => {
  clearInterval(timerInterval);
  isRunning = false;
  timeLeft = defaultTime;
  startBtn.textContent = 'Start Focus';
  updateTimerUI();
});

document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    clearInterval(timerInterval);
    isRunning = false;
    defaultTime = parseInt(btn.dataset.time) * 60;
    timeLeft = defaultTime;
    startBtn.textContent = 'Start Focus';
    updateTimerUI();
  });
});

// 5. Priorities & Personal Notepad
const notepad = document.getElementById('personal-notes');
notepad.value = localStorage.getItem('focusSpace_notepad') || '';
notepad.addEventListener('input', () => {
  localStorage.setItem('focusSpace_notepad', notepad.value);
  document.getElementById('notes-status').textContent = 'Saved';
  setTimeout(() => { document.getElementById('notes-status').textContent = 'Auto-saved'; }, 600);
});

// 6. Bulletproof Audio Station Switcher (Archive.org CDN)
function playStation(url, title) {
  const audio = document.getElementById('retro-audio');
  
  audio.pause();
  audio.currentTime = 0;
  audio.src = url;
  audio.load();

  const playPromise = audio.play();
  if (playPromise !== undefined) {
    playPromise.then(() => {
      document.getElementById('song-title').textContent = title;
    }).catch(error => {
      console.log("Audio waiting for user play action:", error);
      document.getElementById('song-title').textContent = title + " (Click play on bar)";
    });
  }
}

const stopSongBtn = document.getElementById('stop-song-btn');
if (stopSongBtn) {
  stopSongBtn.addEventListener('click', () => {
    const audio = document.getElementById('retro-audio');
    audio.pause();
    audio.currentTime = 0;
    document.getElementById('song-title').textContent = 'Music Stopped';
  });
}

// 7. Friends & Chat Modal Logic
const modal = document.getElementById('friends-modal');
document.getElementById('toggle-friends-btn').addEventListener('click', () => modal.classList.add('open'));
document.getElementById('close-friends-btn').addEventListener('click', () => modal.classList.remove('open'));

const chatMsgs = document.getElementById('chat-messages');
document.getElementById('send-chat-btn').addEventListener('click', () => {
  const input = document.getElementById('chat-input');
  if (!input.value.trim()) return;
  const div = document.createElement('div');
  div.className = 'chat-msg';
  div.innerHTML = `<strong>You:</strong> ${input.value}`;
  chatMsgs.appendChild(div);
  input.value = '';
  chatMsgs.scrollTop = chatMsgs.scrollHeight;
});

// 8. Mini Game (Catch Star Clicker)
let gameScore = 0;
const gameBtn = document.getElementById('game-start-btn');
gameBtn.addEventListener('click', () => {
  gameScore++;
  document.getElementById('game-score').textContent = gameScore;
  gameBtn.textContent = `⭐ Clicked! (${gameScore})`;
  setTimeout(() => { gameBtn.textContent = 'Click Fast!'; }, 400);
});

updateTimerUI();