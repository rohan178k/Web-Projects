// Difficulty levels and configurations
const DIFFICULTIES = {
  easy: { rows: 9, cols: 9, mines: 10 },
  medium: { rows: 16, cols: 16, mines: 40 },
  hard: { rows: 16, cols: 30, mines: 99 },
};

// Color coding for numbers
const colors = [
  "#1976d2",
  "#1976d2",
  "#388e3c",
  "#e07014",
  "#7b1fa2",
  "#470056",
  "#060079",
  "#2e2c32",
  "#0c002c",
];

// These are the coordinates for the 8 surrounding cells
const directions = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
];

let currentMode = "easy";
let board = [];
let minesLeft = 0;
let isGameOver = false;
let isFirstClick = true;

// DOM Elements
const boardElement = document.getElementById("game-board");
const mineCounterElement = document.getElementById("mine-counter");
const difficultySelect = document.getElementById("difficulty-select");
const resetBtn = document.getElementById("reset-btn");

// The Welcome Screen at the start of the game
document.addEventListener("DOMContentLoaded", () => {
  const welcomeScreen = document.getElementById("welcome-screen");
  const startGameBtn = document.getElementById("start-game-btn");

  startGameBtn.addEventListener("click", () => {
    welcomeScreen.classList.add("hidden");
    initGame();
  });
});

// Game iinitialization function
function initGame() {
  const level = DIFFICULTIES[currentMode];
  board = [];
  minesLeft = level.mines;
  isGameOver = false;
  isFirstClick = true;

  updateMineCounter();

  // Clearing HTML board and setting new CSS Grid dimensions
  boardElement.innerHTML = "";
  boardElement.style.gridTemplateColumns = `repeat(${level.cols}, 30px)`;
  boardElement.style.gridTemplateRows = `repeat(${level.rows}, 30px)`;

  // Creating the logical 2D array and HTML elements simultaneously
  for (let r = 0; r < level.rows; r++) {
    let rowArray = [];
    for (let c = 0; c < level.cols; c++) {
      // Logical Cell Object
      const cellData = {
        r: r,
        c: c,
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        neighborCount: 0,
      };
      rowArray.push(cellData);

      // HTML Element
      const cellDiv = document.createElement("div");
      cellDiv.classList.add("cell");
      cellDiv.dataset.r = r;
      cellDiv.dataset.c = c;

      // Adding event listeners to this cellDiv
      // Left Click (Reveal)
      cellDiv.addEventListener("click", () => handleLeftClick(r, c));

      // Right Click (Flag)
      cellDiv.addEventListener("contextmenu", (e) => {
        e.preventDefault(); // Preventing the browser's default right-click menu
        handleRightClick(r, c);
      });

      // the values from the dataset r and c will be passed to handler funtions

      boardElement.appendChild(cellDiv);
    }
    board.push(rowArray);
  }
}

function updateMineCounter() {
  mineCounterElement.innerText = minesLeft.toString().padStart(2, "0"); // Used padstart to convert 9 -> 09
}

// Handle Difficulty Changes
difficultySelect.addEventListener("change", (e) => {
  currentMode = e.target.value;
  initGame();
});

// Handle Reset Button
resetBtn.addEventListener("click", initGame);

// Handle Right Click (Flag)
function handleRightClick(r, c) {
  // 1. Ignoring clicks if the game is over
  if (isGameOver) return;

  const cellData = board[r][c];

  // 2. Cannot flag a cell that is already revealed
  if (cellData.isRevealed) return;

  // 3. Finding the specific HTML element corresponding to this row and column
  const cellDiv = document.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);

  // 4. Toggle the logic and visuals
  if (!cellData.isFlagged) {
    // Placing a flag
    cellData.isFlagged = true;
    cellDiv.classList.add("flagged");
    cellDiv.innerText = "🚩";
    minesLeft--;
  } else {
    // Removing the flag
    cellData.isFlagged = false;
    cellDiv.classList.remove("flagged");
    cellDiv.innerText = "";
    minesLeft++;
  }

  // 5. Update the digital counter on the screen
  updateMineCounter();
}

// Handle Left Click
function handleLeftClick(r, c) {
  // 1. Ignoring clicks if the game is over or the cell is protected by a flag
  if (isGameOver || board[r][c].isFlagged || board[r][c].isRevealed) return;

  // 2. Handle the First Click
  if (isFirstClick) {
    isFirstClick = false;
    placeMines(r, c);
    calculateNeighbors();
    floodFillReveal(r, c);
  }

  // Finding the specific HTML element corresponding to this row and column
  const cellData = board[r][c];
  const cellDiv = document.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);

  // 3. Mark the cell as revealed
  cellData.isRevealed = true;
  cellDiv.classList.add("revealed");

  // 4. Did they click a mine?
  if (cellData.isMine) {
    cellDiv.innerText = "💣";
    cellDiv.classList.add("mine");
    triggerGameOver(false); // Player loses
    return;
  }

  // 5. If it's safe, showing the neighbour count
  if (cellData.neighborCount > 0) {
    cellDiv.innerText = cellData.neighborCount;
    cellDiv.style.color = colors[cellData.neighborCount];
  } else {
    // 6. If the cell is a 0 (blank), triggerring the Flood Fill algorithm
    floodFillReveal(r, c);
  }

  // 7. Checking if they won after this click
  checkWinCondition();
}

// Game Over trigger
function triggerGameOver(isWin) {
  isGameOver = true;
  const level = DIFFICULTIES[currentMode];

  if (isWin) {
    setTimeout(
      () => alert("Congratulations! You cleared the minefield! 🏆"),
      1000,
    );
  } else {
    // Looping through the board and revealing all mines.
    for (let r = 0; r < level.rows; r++) {
      for (let c = 0; c < level.cols; c++) {
        if (board[r][c].isMine) {
          const cellDiv = document.querySelector(
            `.cell[data-r="${r}"][data-c="${c}"]`,
          );

          // Don't overwrite correctly placed flags
          if (!board[r][c].isFlagged) {
            cellDiv.classList.add("revealed");
            cellDiv.innerText = "💣";
            cellDiv.classList.add("mine");
          }
        } else if (board[r][c].isFlagged && !board[r][c].isMine) {
          // Showing where the player placed a wrong flag
          const cellDiv = document.querySelector(
            `.cell[data-r="${r}"][data-c="${c}"]`,
          );
          cellDiv.innerText = "❌";
        }
      }
    }
    setTimeout(() => alert("BOOM! You hit a mine. Game Over. 💥"), 2000);
  }
}

// Placing mines after first click
function placeMines(firstRow, firstCol) {
  const level = DIFFICULTIES[currentMode];
  let minesPlaced = 0;

  while (minesPlaced < level.mines) {
    // Picking a random row and column
    const r = Math.floor(Math.random() * level.rows);
    const c = Math.floor(Math.random() * level.cols);

    // 1. Only placing a mine if there isn't already a mine here.
    // 2. The first cell should have 0 mines.
    if (
      !board[r][c].isMine &&
      !(r === firstRow || r === firstRow - 1 || r === firstRow + 1) &&
      !(c === firstCol || c === firstCol - 1 || c === firstCol + 1)
    ) {
      board[r][c].isMine = true;
      minesPlaced++;
    }
  }
}

// Calculating neighbour number
function calculateNeighbors() {
  const level = DIFFICULTIES[currentMode];

  for (let r = 0; r < level.rows; r++) {
    for (let c = 0; c < level.cols; c++) {
      // If the current cell is a mine, it doesn't need a number. Skipping it.
      if (board[r][c].isMine) continue;

      let count = 0;

      // Looking at all 8 directions around this specific cell
      for (let [dr, dc] of directions) {
        const newR = r + dr;
        const newC = c + dc;

        // Making sure we aren't looking outside the grid boundaries!
        if (newR >= 0 && newR < level.rows && newC >= 0 && newC < level.cols) {
          if (board[newR][newC].isMine) {
            count++;
          }
        }
      }

      // Saving the final count to our logical board array
      board[r][c].neighborCount = count;
    }
  }
}

// Flood Fill Algorithm to reveal blank cells
function floodFillReveal(r, c) {
  const level = DIFFICULTIES[currentMode];

  // 1. Base Case: Stopping if we go outside the grid boundaries
  if (r < 0 || r >= level.rows || c < 0 || c >= level.cols) return;

  const cellData = board[r][c];

  // 2. Base Case: Stopping if the cell is already revealed, flagged, or is a mine
  if (cellData.isRevealed || cellData.isFlagged || cellData.isMine) return;

  // 3. Revealing this cell
  cellData.isRevealed = true;
  const cellDiv = document.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
  cellDiv.classList.add("revealed");

  // 4. If the cell has a number, showing it and stop expanding in this direction
  if (cellData.neighborCount > 0) {
    cellDiv.innerText = cellData.neighborCount;
    cellDiv.style.color = colors[cellData.neighborCount];
    return;
  }

  // 5. If the cell is a 0, recursively checking all 8 directions
  for (let [dr, dc] of directions) {
    floodFillReveal(r + dr, c + dc);
  }
}

// Logic of endgame
function checkWinCondition() {
  const level = DIFFICULTIES[currentMode];
  let revealedSafeCells = 0;

  // Calculating how many safe cells exist in total
  const totalSafeCells = level.rows * level.cols - level.mines;

  // Counting how many safe cells the player has actually revealed
  for (let r = 0; r < level.rows; r++) {
    for (let c = 0; c < level.cols; c++) {
      if (board[r][c].isRevealed && !board[r][c].isMine) {
        revealedSafeCells++;
      }
    }
  }

  // Checking if all safe cells are revealed
  if (revealedSafeCells === totalSafeCells) {
    triggerGameOver(true);
  }
}
