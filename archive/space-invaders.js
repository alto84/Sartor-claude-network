// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
let gameRunning = false;
let score = 0;
let lives = 3;
let level = 1;
let animationId = null;

// Player
const player = {
  x: canvas.width / 2 - 20,
  y: canvas.height - 60,
  width: 40,
  height: 30,
  speed: 5,
  moveLeft: false,
  moveRight: false,
};

// Bullets
const bullets = [];
const bulletSpeed = 7;
const bulletWidth = 4;
const bulletHeight = 15;

// Aliens
let aliens = [];
let alienDirection = 1;
let alienSpeed = 1;
let alienDropAmount = 20;
let lastAlienShot = 0;
const alienShootDelay = 1000; // milliseconds

// Alien bullets
const alienBullets = [];
const alienBulletSpeed = 4;

// Game elements
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const gameOverDiv = document.getElementById('gameOver');
const scoreSpan = document.getElementById('score');
const livesSpan = document.getElementById('lives');
const levelSpan = document.getElementById('level');

// Initialize aliens
function createAliens() {
  aliens = [];
  const rows = 5;
  const cols = 11;
  const alienWidth = 40;
  const alienHeight = 30;
  const padding = 10;
  const offsetX = 80;
  const offsetY = 60;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      aliens.push({
        x: offsetX + col * (alienWidth + padding),
        y: offsetY + row * (alienHeight + padding),
        width: alienWidth,
        height: alienHeight,
        alive: true,
        type: row, // Different types for different rows
      });
    }
  }
}

// Draw player
function drawPlayer() {
  ctx.fillStyle = '#0f0';

  // Draw ship body
  ctx.fillRect(player.x, player.y + 20, player.width, 10);

  // Draw ship cockpit
  ctx.beginPath();
  ctx.moveTo(player.x + player.width / 2 - 10, player.y + 20);
  ctx.lineTo(player.x + player.width / 2 + 10, player.y + 20);
  ctx.lineTo(player.x + player.width / 2, player.y);
  ctx.closePath();
  ctx.fill();

  // Draw ship wings
  ctx.fillRect(player.x - 5, player.y + 25, 10, 5);
  ctx.fillRect(player.x + player.width - 5, player.y + 25, 10, 5);
}

// Draw aliens
function drawAliens() {
  aliens.forEach((alien) => {
    if (!alien.alive) return;

    // Different colors for different types
    const colors = ['#f00', '#ff0', '#0ff', '#f0f', '#fff'];
    ctx.fillStyle = colors[alien.type];

    // Draw alien body
    ctx.fillRect(alien.x + 5, alien.y + 10, alien.width - 10, alien.height - 15);

    // Draw alien eyes
    ctx.fillStyle = '#000';
    ctx.fillRect(alien.x + 10, alien.y + 12, 8, 8);
    ctx.fillRect(alien.x + alien.width - 18, alien.y + 12, 8, 8);

    // Draw alien antennas
    ctx.fillStyle = colors[alien.type];
    ctx.fillRect(alien.x + 8, alien.y, 4, 10);
    ctx.fillRect(alien.x + alien.width - 12, alien.y, 4, 10);

    // Draw alien legs
    ctx.fillRect(alien.x + 8, alien.y + alien.height - 5, 6, 5);
    ctx.fillRect(alien.x + alien.width - 14, alien.y + alien.height - 5, 6, 5);
  });
}

// Draw bullets
function drawBullets() {
  ctx.fillStyle = '#0f0';
  bullets.forEach((bullet) => {
    ctx.fillRect(bullet.x, bullet.y, bulletWidth, bulletHeight);
  });

  ctx.fillStyle = '#f00';
  alienBullets.forEach((bullet) => {
    ctx.fillRect(bullet.x, bullet.y, bulletWidth, bulletHeight);
  });
}

// Update player position
function updatePlayer() {
  if (player.moveLeft && player.x > 0) {
    player.x -= player.speed;
  }
  if (player.moveRight && player.x < canvas.width - player.width) {
    player.x += player.speed;
  }
}

// Update bullets
function updateBullets() {
  // Update player bullets
  bullets.forEach((bullet, index) => {
    bullet.y -= bulletSpeed;
    if (bullet.y < 0) {
      bullets.splice(index, 1);
    }
  });

  // Update alien bullets
  alienBullets.forEach((bullet, index) => {
    bullet.y += alienBulletSpeed;
    if (bullet.y > canvas.height) {
      alienBullets.splice(index, 1);
    }
  });
}

// Update aliens
function updateAliens() {
  let shouldDrop = false;

  // Check if any alien hit the edge
  aliens.forEach((alien) => {
    if (!alien.alive) return;

    if (
      (alien.x <= 0 && alienDirection === -1) ||
      (alien.x + alien.width >= canvas.width && alienDirection === 1)
    ) {
      shouldDrop = true;
    }
  });

  // Drop and reverse direction if needed
  if (shouldDrop) {
    alienDirection *= -1;
    aliens.forEach((alien) => {
      if (alien.alive) {
        alien.y += alienDropAmount;
      }
    });
  }

  // Move aliens
  const speed = alienSpeed * (1 + level * 0.2);
  aliens.forEach((alien) => {
    if (alien.alive) {
      alien.x += alienDirection * speed;
    }
  });

  // Alien shooting
  const currentTime = Date.now();
  if (currentTime - lastAlienShot > alienShootDelay) {
    shootFromRandomAlien();
    lastAlienShot = currentTime;
  }
}

// Shoot from random alien
function shootFromRandomAlien() {
  const aliveAliens = aliens.filter((a) => a.alive);
  if (aliveAliens.length === 0) return;

  const shooter = aliveAliens[Math.floor(Math.random() * aliveAliens.length)];
  alienBullets.push({
    x: shooter.x + shooter.width / 2 - bulletWidth / 2,
    y: shooter.y + shooter.height,
  });
}

// Check collisions
function checkCollisions() {
  // Check player bullets hitting aliens
  bullets.forEach((bullet, bulletIndex) => {
    aliens.forEach((alien) => {
      if (!alien.alive) return;

      if (
        bullet.x < alien.x + alien.width &&
        bullet.x + bulletWidth > alien.x &&
        bullet.y < alien.y + alien.height &&
        bullet.y + bulletHeight > alien.y
      ) {
        alien.alive = false;
        bullets.splice(bulletIndex, 1);
        score += (5 - alien.type) * 10;
        updateScore();
      }
    });
  });

  // Check alien bullets hitting player
  alienBullets.forEach((bullet, index) => {
    if (
      bullet.x < player.x + player.width &&
      bullet.x + bulletWidth > player.x &&
      bullet.y < player.y + player.height &&
      bullet.y + bulletHeight > player.y
    ) {
      alienBullets.splice(index, 1);
      lives--;
      updateLives();

      if (lives <= 0) {
        gameOver();
      }
    }
  });

  // Check if aliens reached player
  aliens.forEach((alien) => {
    if (alien.alive && alien.y + alien.height >= player.y) {
      gameOver();
    }
  });

  // Check if all aliens are destroyed
  const aliveAliens = aliens.filter((a) => a.alive);
  if (aliveAliens.length === 0) {
    nextLevel();
  }
}

// Next level
function nextLevel() {
  level++;
  updateLevel();
  createAliens();
  bullets.length = 0;
  alienBullets.length = 0;
}

// Game over
function gameOver() {
  gameRunning = false;
  gameOverDiv.classList.add('show');
  startBtn.style.display = 'none';
  restartBtn.style.display = 'inline-block';
}

// Update UI
function updateScore() {
  scoreSpan.textContent = score;
}

function updateLives() {
  livesSpan.textContent = lives;
}

function updateLevel() {
  levelSpan.textContent = level;
}

// Main game loop
function gameLoop() {
  if (!gameRunning) return;

  // Clear canvas
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Update
  updatePlayer();
  updateBullets();
  updateAliens();
  checkCollisions();

  // Draw
  drawPlayer();
  drawAliens();
  drawBullets();

  // Continue loop
  animationId = requestAnimationFrame(gameLoop);
}

// Start game
function startGame() {
  gameRunning = true;
  score = 0;
  lives = 3;
  level = 1;
  bullets.length = 0;
  alienBullets.length = 0;

  player.x = canvas.width / 2 - 20;
  player.y = canvas.height - 60;

  createAliens();

  updateScore();
  updateLives();
  updateLevel();

  gameOverDiv.classList.remove('show');
  startBtn.style.display = 'none';
  restartBtn.style.display = 'none';

  gameLoop();
}

// Keyboard controls
document.addEventListener('keydown', (e) => {
  if (!gameRunning) return;

  if (e.key === 'ArrowLeft') {
    player.moveLeft = true;
  }
  if (e.key === 'ArrowRight') {
    player.moveRight = true;
  }
  if (e.key === ' ' || e.key === 'Spacebar') {
    e.preventDefault();
    // Shoot bullet
    bullets.push({
      x: player.x + player.width / 2 - bulletWidth / 2,
      y: player.y,
    });
  }
});

document.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowLeft') {
    player.moveLeft = false;
  }
  if (e.key === 'ArrowRight') {
    player.moveRight = false;
  }
});

// Button event listeners
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
