import { CONFIG } from './config.js';
import { initVideoPlayer, syncVideoWithGameState, toggleVideoMute } from './video.js';

// Game State
let gameState = 'MENU';
let score = 0;
let highScore = 0;
let lastTime = 0;
let spawnTimer = 0;
let currentSpeed = CONFIG.INITIAL_SPEED;

// Canvas setup
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Game Entities
const drone = {
  x: CONFIG.DRONE_START_X,
  y: CONFIG.DRONE_START_Y,
  vy: 0,
  rotation: 0
};

let obstacles = [];
let particles = [];
let stars = [];

// DOM Elements
const menuOverlay = document.getElementById('menu-overlay');
const pauseOverlay = document.getElementById('pause-overlay');
const gameOverOverlay = document.getElementById('game-over-overlay');
const hud = document.getElementById('hud');

const scoreDisplay = document.getElementById('score-display');
const bestScoreDisplay = document.getElementById('best-score-display');
const menuHighScore = document.getElementById('menu-high-score');
const finalScore = document.getElementById('final-score');
const finalBestScore = document.getElementById('final-best-score');

const btnStart = document.getElementById('btn-start');
const btnResume = document.getElementById('btn-resume');
const btnRestart = document.getElementById('btn-restart');
const btnVideoToggle = document.getElementById('btn-video-toggle');
const videoIcon = document.getElementById('video-icon');

/**
 * Initializes stars background, event handlers, video, and initial state.
 */
function init() {
  loadHighScore();
  initStars();
  bindEvents();
  initVideoPlayer();
  setState('MENU');
  requestAnimationFrame(gameLoop);
}

/**
 * Generates initial starfield background particles.
 */
function initStars() {
  stars = [];
  for (let i = 0; i < 40; i++) {
    stars.push({
      x: Math.random() * CONFIG.CANVAS_WIDTH,
      y: Math.random() * CONFIG.CANVAS_HEIGHT,
      radius: Math.random() * 1.5 + 0.5,
      speed: Math.random() * 0.4 + 0.1
    });
  }
}

/**
 * Loads high score from local storage.
 */
function loadHighScore() {
  try {
    const saved = localStorage.getItem(CONFIG.STORAGE.HIGH_SCORE);
    highScore = saved ? parseInt(saved, 10) : 0;
  } catch {
    highScore = 0;
  }
  updateScoreUI();
}

/**
 * Saves high score if current score exceeds it.
 */
function saveHighScore() {
  if (score > highScore) {
    highScore = score;
    try {
      localStorage.setItem(CONFIG.STORAGE.HIGH_SCORE, highScore.toString());
    } catch {
      // Storage access error handling
    }
  }
  updateScoreUI();
}

/**
 * Updates DOM score elements.
 */
function updateScoreUI() {
  scoreDisplay.textContent = score;
  bestScoreDisplay.textContent = highScore;
  menuHighScore.textContent = highScore;
  finalScore.textContent = score;
  finalBestScore.textContent = highScore;
}

/**
 * Handles game state transitions and updates UI overlays.
 * @param {'MENU' | 'PLAYING' | 'PAUSED' | 'GAMEOVER'} nextState
 */
function setState(nextState) {
  gameState = nextState;

  // Toggle overlay visibilities
  menuOverlay.classList.toggle('hidden', gameState !== 'MENU');
  pauseOverlay.classList.toggle('hidden', gameState !== 'PAUSED');
  gameOverOverlay.classList.toggle('hidden', gameState !== 'GAMEOVER');
  hud.classList.toggle('hidden', gameState === 'MENU');

  syncVideoWithGameState(gameState);

  if (gameState === 'PLAYING') {
    lastTime = performance.now();
  }
}

/**
 * Resets drone position, score, obstacles, and speed parameters.
 */
function resetGame() {
  drone.x = CONFIG.DRONE_START_X;
  drone.y = CONFIG.DRONE_START_Y;
  drone.vy = 0;
  drone.rotation = 0;

  obstacles = [];
  particles = [];
  score = 0;
  currentSpeed = CONFIG.INITIAL_SPEED;
  spawnTimer = 0;

  updateScoreUI();
}

/**
 * Main player flap action.
 */
function flap() {
  if (gameState !== 'PLAYING') return;

  drone.vy = CONFIG.JUMP_FORCE;
  spawnThrusterParticles();
}

/**
 * Spawns thruster spark particles on flap.
 */
function spawnThrusterParticles() {
  for (let i = 0; i < 6; i++) {
    particles.push({
      x: drone.x - 10,
      y: drone.y + (Math.random() * 8 - 4),
      vx: -(Math.random() * 2 + 2),
      vy: Math.random() * 2 - 1,
      life: 1.0,
      decay: Math.random() * 0.05 + 0.03,
      size: Math.random() * 3 + 2
    });
  }
}

/**
 * Unified input handler bindings for keyboard, mouse, touch, and UI buttons.
 */
function bindEvents() {
  // Keyboard Controls
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      e.preventDefault();
      if (gameState === 'MENU' || gameState === 'GAMEOVER') {
        resetGame();
        setState('PLAYING');
      } else if (gameState === 'PLAYING') {
        flap();
      }
    } else if (e.code === 'KeyP') {
      if (gameState === 'PLAYING') {
        setState('PAUSED');
      } else if (gameState === 'PAUSED') {
        setState('PLAYING');
      }
    }
  });

  // Mouse / Touch Controls on Canvas
  const handlePointerDown = (e) => {
    // Only capture click directly on canvas or active gameplay area
    if (e.target === canvas) {
      if (gameState === 'PLAYING') {
        flap();
      }
    }
  };

  canvas.addEventListener('pointerdown', handlePointerDown);

  // UI Buttons
  btnStart.addEventListener('click', () => {
    resetGame();
    setState('PLAYING');
  });

  btnResume.addEventListener('click', () => {
    setState('PLAYING');
  });

  btnRestart.addEventListener('click', () => {
    resetGame();
    setState('PLAYING');
  });

  btnVideoToggle.addEventListener('click', () => {
    const isMuted = toggleVideoMute();
    videoIcon.textContent = isMuted ? '🔇' : '🔊';
  });
}

/**
 * Spawns a pair of top and bottom energy pylons with a random gap center.
 */
function spawnObstacle() {
  const minTop = CONFIG.MIN_OBSTACLE_HEIGHT;
  const maxTop = CONFIG.CANVAS_HEIGHT - CONFIG.MIN_OBSTACLE_HEIGHT - CONFIG.OBSTACLE_GAP;
  const topHeight = Math.floor(Math.random() * (maxTop - minTop + 1)) + minTop;

  obstacles.push({
    x: CONFIG.CANVAS_WIDTH,
    topHeight: topHeight,
    bottomY: topHeight + CONFIG.OBSTACLE_GAP,
    bottomHeight: CONFIG.CANVAS_HEIGHT - (topHeight + CONFIG.OBSTACLE_GAP),
    passed: false
  });
}

/**
 * Main frame update logic.
 * @param {number} deltaMs
 */
function update(deltaMs) {
  // Update starfield background animation
  stars.forEach((star) => {
    star.x -= star.speed * (gameState === 'PLAYING' ? 1.5 : 0.5);
    if (star.x < 0) star.x = CONFIG.CANVAS_WIDTH;
  });

  if (gameState !== 'PLAYING') return;

  // 1. Drone Physics
drone.vy += CONFIG.GRAVITY;

if (drone.vy > CONFIG.MAX_FALL_SPEED) {
  drone.vy = CONFIG.MAX_FALL_SPEED;
}

drone.y += drone.vy;
drone.rotation = Math.min(
  Math.PI / 4,
  Math.max(-Math.PI / 4, drone.vy * 0.08)
);

  // 2. Obstacles Spawn & Movement
  spawnTimer += deltaMs;
  if (spawnTimer >= CONFIG.SPAWN_INTERVAL) {
    spawnObstacle();
    spawnTimer = 0;
  }

  for (let i = obstacles.length - 1; i >= 0; i--) {
    const obs = obstacles[i];
    obs.x -= currentSpeed;

    // Check Score
    if (!obs.passed && obs.x + CONFIG.OBSTACLE_WIDTH < drone.x) {
      obs.passed = true;
      score++;
      currentSpeed = Math.min(CONFIG.MAX_SPEED, currentSpeed + CONFIG.SPEED_INCREMENT);
      updateScoreUI();
    }

    // Remove offscreen obstacles
    if (obs.x + CONFIG.OBSTACLE_WIDTH < 0) {
      obstacles.splice(i, 1);
    }
  }

  // 3. Particles Update
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= p.decay;
    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }

  // 4. Collision Check
  if (checkCollisions()) {
    saveHighScore();
    setState('GAMEOVER');
  }
}

/**
 * Checks circle-to-rectangle and floor/ceiling collisions.
 * @returns {boolean} true if collision detected
 */
function checkCollisions() {
  // Ceiling / Floor bounds check
  if (drone.y - CONFIG.DRONE_RADIUS <= 0 || drone.y + CONFIG.DRONE_RADIUS >= CONFIG.CANVAS_HEIGHT) {
    return true;
  }

  // Obstacle rect collisions
  for (const obs of obstacles) {
    // Top Pylon Box
    if (circleRectIntersect(drone.x, drone.y, CONFIG.DRONE_RADIUS, obs.x, 0, CONFIG.OBSTACLE_WIDTH, obs.topHeight)) {
      return true;
    }
    // Bottom Pylon Box
    if (circleRectIntersect(drone.x, drone.y, CONFIG.DRONE_RADIUS, obs.x, obs.bottomY, CONFIG.OBSTACLE_WIDTH, obs.bottomHeight)) {
      return true;
    }
  }

  return false;
}

/**
 * Circle to Axis-Aligned Bounding Box (AABB) intersection check.
 */
function circleRectIntersect(cx, cy, radius, rx, ry, rw, rh) {
  const closestX = Math.max(rx, Math.min(cx, rx + rw));
  const closestY = Math.max(ry, Math.min(cy, ry + rh));

  const distX = cx - closestX;
  const distY = cy - closestY;
  const distanceSquared = (distX * distX) + (distY * distY);

  return distanceSquared < (radius * radius);
}

/**
 * Main rendering routine.
 */
function render() {
  // Clear Frame
  ctx.clearRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

  // 1. Draw Starfield Background
  ctx.fillStyle = CONFIG.COLORS.STAR;
  stars.forEach((star) => {
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fill();
  });

  // 2. Draw Subtle Background Grid
  ctx.strokeStyle = CONFIG.COLORS.GRID_LINE;
  ctx.lineWidth = 1;
  const gridSize = 40;
  for (let x = 0; x < CONFIG.CANVAS_WIDTH; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, CONFIG.CANVAS_HEIGHT);
    ctx.stroke();
  }

  // 3. Draw Obstacles (Energy Pylons)
  obstacles.forEach((obs) => {
    drawPylon(obs.x, 0, CONFIG.OBSTACLE_WIDTH, obs.topHeight, true);
    drawPylon(obs.x, obs.bottomY, CONFIG.OBSTACLE_WIDTH, obs.bottomHeight, false);
  });

  // 4. Draw Particles
  particles.forEach((p) => {
    ctx.fillStyle = `rgba(0, 243, 255, ${p.life})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  });

  // 5. Draw Drone Player
  drawDrone();
}

/**
 * Draws a futuristic energy pylon obstacle.
 */
function drawPylon(x, y, w, h, isTop) {
  // Pylon Body
  const grad = ctx.createLinearGradient(x, 0, x + w, 0);
  grad.addColorStop(0, '#5a189a');
  grad.addColorStop(0.5, CONFIG.COLORS.PYLON);
  grad.addColorStop(1, '#3c096c');

  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);

  // Pylon Energy Cap
  ctx.fillStyle = CONFIG.COLORS.PYLON_CAP;
  const capHeight = 8;
  const capY = isTop ? y + h - capHeight : y;
  ctx.fillRect(x - 2, capY, w + 4, capHeight);

  // Glow line
  ctx.strokeStyle = CONFIG.COLORS.PYLON_GLOW;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
}

/**
 * Draws the courier drone sprite with tilt.
 */
function drawDrone() {
  ctx.save();
  ctx.translate(drone.x, drone.y);
  ctx.rotate(drone.rotation);

  // Outer Glow
  ctx.shadowColor = CONFIG.COLORS.DRONE_GLOW;
  ctx.shadowBlur = 12;

  // Drone Main Chassis (Triangle / Jet shape)
  ctx.fillStyle = CONFIG.COLORS.DRONE_BODY;
  ctx.beginPath();
  ctx.moveTo(14, 0);
  ctx.lineTo(-10, -10);
  ctx.lineTo(-6, 0);
  ctx.lineTo(-10, 10);
  ctx.closePath();
  ctx.fill();

  // Core Light
  ctx.fillStyle = CONFIG.COLORS.DRONE_CORE;
  ctx.beginPath();
  ctx.arc(0, 0, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Main game loop using delta time.
 * @param {number} timestamp
 */
function gameLoop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const deltaMs = Math.min(100, timestamp - lastTime);
  lastTime = timestamp;

  update(deltaMs);
  render();

  requestAnimationFrame(gameLoop);
}

// Start application
window.addEventListener('DOMContentLoaded', init);
