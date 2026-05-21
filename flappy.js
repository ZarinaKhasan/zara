const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const W = 400, H = 600;

const scoreEl = document.getElementById('score');
const bestScoreEl = document.getElementById('bestScoreValue');
const gameOverEl = document.getElementById('gameOver');
const finalScoreEl = document.getElementById('finalScore');
const newBestLabel = document.getElementById('newBestLabel');
const startMsgEl = document.getElementById('startMsg');
const restartBtn = document.getElementById('restartBtn');

// =============== SOUND ===============
let audioCtx;

function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function playFlap() {
  try {
    initAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(780, audioCtx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.12);
  } catch(e) {}
}

function playScore() {
  try {
    initAudio();
    const now = audioCtx.currentTime;
    [523, 659, 784].forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);
      gain.gain.setValueAtTime(0.2, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.12);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.12);
    });
  } catch(e) {}
}

function playHit() {
  try {
    initAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.4);
  } catch(e) {}
}

function playSwoosh() {
  try {
    initAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.15);
  } catch(e) {}
}

// =============== GAME STATE ===============
let game = {
  bird: { x: 80, y: 260, vy: 0, width: 36, height: 26 },
  pipes: [],
  score: 0,
  state: 'waiting',
  frame: 0,
  pipeGap: 170,
  pipeWidth: 52,
  pipeSpeed: 2.2,
  pipeInterval: 100,
  gravity: 0.3,
  jump: -6.5,
  bestScore: parseInt(localStorage.getItem('flappyBest')) || 0,
};

function isNewBest() {
  return game.score > 0 && game.score >= game.bestScore;
}

function resetGame() {
  game.bird.y = 260;
  game.bird.vy = 0;
  game.pipes = [];
  game.score = 0;
  game.frame = 0;
  game.state = 'waiting';
  gameOverEl.style.display = 'none';
  startMsgEl.style.display = 'block';
  scoreEl.textContent = '0';
}

function birdHit() {
  const b = game.bird;
  if (b.y + b.height / 2 >= H - 30 || b.y - b.height / 2 <= 0) return true;
  for (const p of game.pipes) {
    if (b.x + b.width / 2 > p.x && b.x - b.width / 2 < p.x + game.pipeWidth) {
      if (b.y - b.height / 2 < p.top || b.y + b.height / 2 > p.top + game.pipeGap) {
        return true;
      }
    }
  }
  return false;
}

function flap() {
  if (game.state === 'waiting') {
    game.state = 'playing';
    startMsgEl.style.display = 'none';
  }
  if (game.state === 'playing') {
    game.bird.vy = game.jump;
    playFlap();
  }
}

function restart() {
  if (game.state === 'dead') {
    resetGame();
    playSwoosh();
  }
}

// =============== UPDATE ===============
function update() {
  if (game.state !== 'playing') return;

  const b = game.bird;
  b.vy += game.gravity;
  b.y += b.vy;

  game.frame++;
  if (game.frame % game.pipeInterval === 0) {
    const minTop = 80;
    const maxTop = H - game.pipeGap - 80;
    const top = Math.random() * (maxTop - minTop) + minTop;
    game.pipes.push({ x: W, top });
  }

  for (let i = game.pipes.length - 1; i >= 0; i--) {
    game.pipes[i].x -= game.pipeSpeed;
    if (game.pipes[i].x + game.pipeWidth < 0) {
      game.pipes.splice(i, 1);
    }
  }

  for (const p of game.pipes) {
    if (!p.passed && p.x + game.pipeWidth < game.bird.x - game.bird.width / 2) {
      p.passed = true;
      game.score++;
      scoreEl.textContent = game.score;
      playScore();
    }
  }

  if (birdHit()) {
    game.state = 'dead';
    playHit();
    if (isNewBest()) {
      game.bestScore = game.score;
      localStorage.setItem('flappyBest', game.bestScore);
      newBestLabel.style.display = 'block';
    } else {
      newBestLabel.style.display = 'none';
    }
    bestScoreEl.textContent = game.bestScore;
    finalScoreEl.textContent = game.score;
    gameOverEl.style.display = 'flex';
  }
}

// =============== DRAW ===============
function draw() {
  ctx.clearRect(0, 0, W, H);

  // sky gradient
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#4dc9f6');
  sky.addColorStop(0.5, '#6fd1e7');
  sky.addColorStop(1, '#87d8c9');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // clouds
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  for (let i = 0; i < 4; i++) {
    const cx = (game.frame * 0.2 + i * 160 + i * 30) % (W + 100) - 50;
    const cy = 30 + i * 45;
    drawCloud(cx, cy, 0.7 + i * 0.15);
  }

  // distant hills
  ctx.fillStyle = 'rgba(120, 200, 120, 0.2)';
  ctx.beginPath();
  ctx.moveTo(0, H - 30);
  for (let x = 0; x <= W; x += 4) {
    const y = H - 30 - 20 - Math.sin((x + game.frame * 0.2) * 0.008) * 18 - Math.sin((x + game.frame * 0.15) * 0.015) * 10;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(W, H - 30);
  ctx.closePath();
  ctx.fill();

  // ground
  const groundY = H - 30;
  ctx.fillStyle = '#b89e3c';
  ctx.fillRect(0, groundY, W, 30);
  const grd = ctx.createLinearGradient(0, groundY, 0, H);
  grd.addColorStop(0, '#c4a747');
  grd.addColorStop(0.3, '#b89e3c');
  grd.addColorStop(1, '#8e7a2b');
  ctx.fillStyle = grd;
  ctx.fillRect(0, groundY, W, 30);

  // ground stripe pattern
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  for (let x = (game.frame * 1.5) % 30; x < W; x += 30) {
    ctx.fillRect(x, groundY, 15, 4);
  }
  ctx.fillStyle = '#7a6625';
  ctx.fillRect(0, groundY, W, 3);

  // pipes
  for (const p of game.pipes) {
    drawPipe(p);
  }

  // bird
  drawBird();

  // best score on canvas (backup)
  bestScoreEl.textContent = game.bestScore;
}

function drawCloud(x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.beginPath();
  ctx.ellipse(0, 0, 50, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(30, -8, 42, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(-25, -5, 35, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPipe(p) {
  const pw = game.pipeWidth;
  const r = 8;

  // --- top pipe ---
  // body
  ctx.fillStyle = '#5cad2e';
  ctx.fillRect(p.x + 4, 0, pw - 8, p.top - r);
  ctx.fillRect(p.x + 2, p.top - r, pw - 4, r);
  // cap
  ctx.fillStyle = '#6fc43a';
  roundRect(ctx, p.x - 2, p.top - 34, pw + 4, 34, r);
  ctx.fill();
  // highlight
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillRect(p.x + 8, p.top - 30, 6, 26);
  // border
  ctx.strokeStyle = '#3d7a1e';
  ctx.lineWidth = 2;
  ctx.strokeRect(p.x - 2, p.top - 34, pw + 4, 34);

  // --- bottom pipe ---
  const bottomY = p.top + game.pipeGap;
  const bh = H - bottomY - 30;
  ctx.fillStyle = '#5cad2e';
  ctx.fillRect(p.x + 4, bottomY + r, pw - 8, bh - r);
  ctx.fillRect(p.x + 2, bottomY, pw - 4, r);
  // cap
  ctx.fillStyle = '#6fc43a';
  roundRect(ctx, p.x - 2, bottomY, pw + 4, 34, r);
  ctx.fill();
  // highlight
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillRect(p.x + 8, bottomY + 4, 6, 26);
  // border
  ctx.strokeStyle = '#3d7a1e';
  ctx.lineWidth = 2;
  ctx.strokeRect(p.x - 2, bottomY, pw + 4, 34);

  // dark edge
  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  ctx.fillRect(p.x, 0, 3, p.top);
  ctx.fillRect(p.x, bottomY, 3, bh);
}

function drawBird() {
  const b = game.bird;
  const angle = Math.min(Math.max(b.vy * 0.08, -0.5), 0.8);
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.rotate(angle);

  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  ctx.beginPath();
  ctx.ellipse(2, 2, b.width / 2 + 1, b.height / 2 + 1, 0, 0, Math.PI * 2);
  ctx.fill();

  // body
  const bodyGrad = ctx.createRadialGradient(-4, -4, 2, 0, 0, b.width / 2);
  bodyGrad.addColorStop(0, '#fce166');
  bodyGrad.addColorStop(0.6, '#f5c842');
  bodyGrad.addColorStop(1, '#e0a91f');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, b.width / 2, b.height / 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // belly
  ctx.fillStyle = '#fef5d8';
  ctx.beginPath();
  ctx.ellipse(-2, 5, 12, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // wing
  const wingY = Math.sin(game.frame * 0.25) * 5;
  ctx.fillStyle = '#d4891a';
  ctx.beginPath();
  ctx.ellipse(-6, wingY, 14, 8, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c47a12';
  ctx.beginPath();
  ctx.ellipse(-6, wingY, 8, 5, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // eye white
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(10, -4, 8, 0, Math.PI * 2);
  ctx.fill();
  // eye
  ctx.fillStyle = '#2d2d2d';
  ctx.beginPath();
  ctx.arc(12, -4, 4.5, 0, Math.PI * 2);
  ctx.fill();
  // pupil highlight
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(13.5, -6, 1.8, 0, Math.PI * 2);
  ctx.fill();

  // beak
  ctx.fillStyle = '#e74c3c';
  ctx.beginPath();
  ctx.moveTo(15, -1);
  ctx.lineTo(30, 2);
  ctx.lineTo(15, 7);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#c0392b';
  ctx.beginPath();
  ctx.moveTo(15, 7);
  ctx.lineTo(26, 4);
  ctx.lineTo(15, 3);
  ctx.closePath();
  ctx.fill();

  // tail
  ctx.fillStyle = '#c47a12';
  ctx.beginPath();
  ctx.moveTo(-16, -4);
  ctx.lineTo(-26, -10);
  ctx.lineTo(-18, -2);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-16, 4);
  ctx.lineTo(-26, 10);
  ctx.lineTo(-18, 2);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// =============== GAME LOOP ===============
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

// =============== CONTROLS ===============
function handleInput(e) {
  if (e.type === 'keydown') {
    if (e.code === 'Space') {
      e.preventDefault();
      if (game.state === 'dead') {
        restart();
      } else {
        flap();
      }
    }
  }
  if (e.type === 'click' || e.type === 'touchstart') {
    if (game.state === 'dead') {
      restart();
    } else {
      flap();
    }
  }
}

// =============== EVENTS ===============
document.addEventListener('keydown', handleInput);
canvas.addEventListener('click', handleInput);
canvas.addEventListener('touchstart', handleInput);

restartBtn.addEventListener('click', () => {
  if (game.state === 'dead') restart();
});

// =============== START ===============
resetGame();
loop();
