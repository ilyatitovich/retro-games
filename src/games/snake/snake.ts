import { resizeCanvas } from "../../utils/resizeCanvas";
const GAME_SPEED = 100; // Milliseconds per frame

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d");
const scoreDisplay = document.getElementById("score");

// Game settings
const gridSize = 20;
const tileCount = canvas.width / gridSize;
const speedLevels = [
  { score: 150, speed: 50 },
  { score: 120, speed: 60 },
  { score: 90, speed: 70 },
  { score: 60, speed: 80 },
  { score: 30, speed: 90 },
  { score: 0, speed: GAME_SPEED },
];
let snake = [
  { x: 10, y: 10 },
  { x: 9, y: 10 },
  { x: 8, y: 10 },
];
let food = { x: 15, y: 15 };
let dx = 1;
let dy = 0;
let score = 0;
let gameSpeed = GAME_SPEED;
let gameOver = false;
let gameEnded = false; // New: track if game is stopped
let lastUpdate = 0;
let animationFrameId: number | null = null;
let gameOverSelection = 0; // 0 for Yes, 1 for No

function updateSpeed() {
  for (const level of speedLevels) {
    if (score >= level.score) {
      if (gameSpeed !== level.speed) {
        gameSpeed = level.speed;
      }
      break;
    }
  }
}

function drawGame() {
  if (!ctx) return;

  // Grid
  ctx.fillStyle = "#1a2a1a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Snake
  snake.forEach((segment) => {
    ctx.fillStyle = "#4aff4a";

    ctx.fillRect(
      segment.x * gridSize,
      segment.y * gridSize,
      gridSize - 2,
      gridSize - 2
    );
  });

  // Food
  ctx.fillStyle = "#3dcc3d";
  ctx.fillRect(
    food.x * gridSize,
    food.y * gridSize,
    gridSize - 2,
    gridSize - 2
  );
}

function drawGameOverMenu() {
  if (!ctx) return;
  // Semi-transparent background
  ctx.fillStyle = "rgba(26, 42, 26)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Game Over text
  ctx.fillStyle = "#4aff4a";
  ctx.font = '48px "Courier New", Courier, monospace';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2 - 60);
  // Play again prompt
  ctx.font = '24px "Courier New", Courier, monospace';
  ctx.fillText("Play again?", canvas.width / 2, canvas.height / 2 - 20);
  // Buttons
  const buttonWidth = 80;
  const buttonHeight = 40;
  const yesX = canvas.width / 2 - 100;
  const noX = canvas.width / 2 + 20;
  const buttonY = canvas.height / 2 + 20;
  // Yes button
  ctx.fillStyle = gameOverSelection === 0 ? "#4aff4a" : "#3dcc3d";
  ctx.fillRect(yesX, buttonY, buttonWidth, buttonHeight);
  ctx.fillStyle = "#1a2a1a";
  ctx.fillText("Yes", yesX + buttonWidth / 2, buttonY + buttonHeight / 2);
  // No button
  ctx.fillStyle = gameOverSelection === 1 ? "#4aff4a" : "#3dcc3d";
  ctx.fillRect(noX, buttonY, buttonWidth, buttonHeight);
  ctx.fillStyle = "#1a2a1a";
  ctx.fillText("No", noX + buttonWidth / 2, buttonY + buttonHeight / 2);
}

function handleGameEnded() {
  window.location.href = "/";
}

// Update game state
function update() {
  if (gameEnded) {
    handleGameEnded();
    return;
  }
  if (gameOver) {
    drawGameOverMenu();
    return;
  }

  // Move snake
  const head = { x: snake[0].x + dx, y: snake[0].y + dy };

  // Check wall collision
  // if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
  //   endGame();
  //   return;
  // }
  if (head.x < 0) head.x = tileCount - 1;
  else if (head.x >= tileCount) head.x = 0;
  if (head.y < 0) head.y = tileCount - 1;
  else if (head.y >= tileCount) head.y = 0;

  // Check self collision
  for (let segment of snake) {
    if (head.x === segment.x && head.y === segment.y) {
      endGame();
      return;
    }
  }

  // Move snake
  snake.unshift(head);

  // Check food collision
  if (head.x === food.x && head.y === food.y) {
    score += 10;
    scoreDisplay!.textContent = `Score: ${score}`;
    updateSpeed();
    generateFood();
  } else {
    snake.pop();
  }

  drawGame();
}

// Generate new food position
function generateFood() {
  let valid = false;

  while (!valid) {
    food.x = Math.floor(Math.random() * tileCount);
    food.y = Math.floor(Math.random() * tileCount);
    valid = true;

    for (let segment of snake) {
      if (food.x === segment.x && food.y === segment.y) {
        valid = false;
        break;
      }
    }
  }
}

// End game
function endGame() {
  gameOver = true;
  window.removeEventListener("keydown", handleInput);
  window.addEventListener("keydown", handleGameOverKey);
  drawGameOverMenu();
}

function handleInput(e: KeyboardEvent) {
  if (gameOver || gameEnded) return;
  switch (e.key) {
    case "ArrowUp":
      if (dy === 0) {
        dx = 0;
        dy = -1;
      }
      break;
    case "ArrowDown":
      if (dy === 0) {
        dx = 0;
        dy = 1;
      }
      break;
    case "ArrowLeft":
      if (dx === 0) {
        dx = -1;
        dy = 0;
      }
      break;
    case "ArrowRight":
      if (dx === 0) {
        dx = 1;
        dy = 0;
      }
      break;
  }
}

function handleGameOverKey(e: KeyboardEvent) {
  if (gameEnded) return;

  switch (e.key) {
    case "ArrowLeft":
    case "ArrowRight":
      gameOverSelection = gameOverSelection === 0 ? 1 : 0;
      break;
    case "Enter":
      if (gameOverSelection === 0) {
        startGame(); // Yes: restart
      } else {
        gameEnded = true; // No: stop game
        window.removeEventListener("keydown", handleGameOverKey);
      }
      break;
  }
}

function startGame() {
  cancelAnimationFrame(animationFrameId!);
  snake = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ];
  food = { x: 15, y: 15 };
  dx = 1;
  dy = 0;
  score = 0;
  gameSpeed = 100;
  gameOver = false;
  gameEnded = false;
  gameOverSelection = 0;
  scoreDisplay!.textContent = `Score: ${score}`;
  window.removeEventListener("keydown", handleGameOverKey);
  window.addEventListener("keydown", handleInput);
  lastUpdate = performance.now();
  animationFrameId = requestAnimationFrame(gameLoop);
}

function gameLoop(currentTime: number) {
  // Always render, even if game is over
  render(); // custom function that draws the game and UI state

  if (!gameOver && currentTime - lastUpdate >= gameSpeed) {
    update(); // update game state only if not over
    lastUpdate = currentTime;
  }

  animationFrameId = requestAnimationFrame(gameLoop);
}

function render() {
  drawGame(); // snake, food, score, etc.

  if (gameOver) {
    drawGameOverMenu(); // "Yes" / "No" with selection highlight
  }

  if (gameEnded) {
    handleGameEnded();
  }
}

// function handleClickOrTap(e: MouseEvent | TouchEvent) {
//   if (!gameOver || gameEnded) return;

//   const rect = canvas.getBoundingClientRect();
//   const clientX = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX;
//   const clientY = e instanceof MouseEvent ? e.clientY : e.touches[0].clientY;

//   const x = (clientX - rect.left) * (canvas.width / rect.width);
//   const y = (clientY - rect.top) * (canvas.height / rect.height);

//   const buttonWidth = 80;
//   const buttonHeight = 40;
//   const yesX = canvas.width / 2 - 100;
//   const noX = canvas.width / 2 + 20;
//   const buttonY = canvas.height / 2 + 20;

//   if (
//     x >= yesX &&
//     x <= yesX + buttonWidth &&
//     y >= buttonY &&
//     y <= buttonY + buttonHeight
//   ) {
//     startGame(); // Restart game
//   } else if (
//     x >= noX &&
//     x <= noX + buttonWidth &&
//     y >= buttonY &&
//     y <= buttonY + buttonHeight
//   ) {
//     gameEnded = true;
//     window.removeEventListener("keydown", handleGameOverKey);
//   }
// }

export function initGame() {
  // canvas.addEventListener("click", handleClickOrTap);
  // canvas.addEventListener("touchstart", handleClickOrTap);
  startGame();
}
