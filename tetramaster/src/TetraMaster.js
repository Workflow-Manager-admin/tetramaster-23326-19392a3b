import React, { useEffect, useState, useRef, useCallback } from 'react';

// PUBLIC_INTERFACE
/**
 * TetraMaster - The main Tetris game container for the TetraMaster app.
 * Features: Block movement (left/right/down/rotate), line clearing, increasing speed, score tracking, and game over detection.
 * Styling uses the provided theme colors.
 */
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;

// Updated modern retro vibrant colors:
const COLORS = {
  I: '#FFD369',       // Accent (Vivid Yellow)
  O: '#FF922B',       // Orange Accent for O (Retro orange)
  T: '#393E46',       // Secondary (Charcoal)
  S: '#70E000',       // Vibrant neon green
  Z: '#DA0037',       // Vibrant retro red
  J: '#00B4D8',       // Bright retro blue
  L: '#F48C06',       // Bright retro yellow-orange
  empty: "#222831",   // Primary (dark blue-gray – background)
  sidebarBg: "#393E46",
  border: "#FFD369",
  text: "#FFD369",
  textSecondary: "rgba(255, 211, 105, 0.7)"
};

// Each tetromino's shape as (x, y) offset pairs for the 4 rotations.
const TETROMINOES = {
  I: [
    [ [0,1], [1,1], [2,1], [3,1] ],
    [ [2,0], [2,1], [2,2], [2,3] ],
    [ [0,2], [1,2], [2,2], [3,2] ],
    [ [1,0], [1,1], [1,2], [1,3] ]
  ],
  O: [
    [ [1,0], [2,0], [1,1], [2,1] ],
    [ [1,0], [2,0], [1,1], [2,1] ],
    [ [1,0], [2,0], [1,1], [2,1] ],
    [ [1,0], [2,0], [1,1], [2,1] ]
  ],
  T: [
    [ [1,0], [0,1], [1,1], [2,1] ],
    [ [1,0], [1,1], [2,1], [1,2] ],
    [ [0,1], [1,1], [2,1], [1,2] ],
    [ [1,0], [0,1], [1,1], [1,2] ]
  ],
  S: [
    [ [1,0], [2,0], [0,1], [1,1] ],
    [ [1,0], [1,1], [2,1], [2,2] ],
    [ [1,1], [2,1], [0,2], [1,2] ],
    [ [0,0], [0,1], [1,1], [1,2] ]
  ],
  Z: [
    [ [0,0], [1,0], [1,1], [2,1] ],
    [ [2,0], [1,1], [2,1], [1,2] ],
    [ [0,1], [1,1], [1,2], [2,2] ],
    [ [1,0], [0,1], [1,1], [0,2] ]
  ],
  J: [
    [ [0,0], [0,1], [1,1], [2,1] ],
    [ [1,0], [2,0], [1,1], [1,2] ],
    [ [0,1], [1,1], [2,1], [2,2] ],
    [ [1,0], [1,1], [0,2], [1,2] ]
  ],
  L: [
    [ [2,0], [0,1], [1,1], [2,1] ],
    [ [1,0], [1,1], [1,2], [2,2] ],
    [ [0,1], [1,1], [2,1], [0,2] ],
    [ [0,0], [1,0], [1,1], [1,2] ]
  ],
};

const TETROMINO_TYPES = Object.keys(TETROMINOES);

function getRandomTetromino() {
  const type = TETROMINO_TYPES[Math.floor(Math.random() * TETROMINO_TYPES.length)];
  return { type, rotation: 0, pos: { x: 3, y: 0 } }; // Start at top-center
}

// PUBLIC_INTERFACE
function TetraMaster() {
  // Board: a 2D array of [row][col] storing cell type or null for empty
  const [board, setBoard] = useState(createEmptyBoard());
  const [current, setCurrent] = useState(getRandomTetromino());
  const [next, setNext] = useState(getRandomTetromino());
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(0);
  const [linesCleared, setLinesCleared] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [dropTime, setDropTime] = useState(1000);
  const intervalRef = useRef();

  // Used for handling fast drop, disables the auto drop interval on hold down
  const fastDropRef = useRef(false);

  // PUBLIC_INTERFACE
  function createEmptyBoard() {
    return Array(BOARD_HEIGHT)
      .fill(null)
      .map(() => Array(BOARD_WIDTH).fill(null));
  }

  // Merge a tetromino onto a given board (for rendering purposes only)
  function renderBoardWithCurrent(board, tetro) {
    const display = board.map(row => row.slice());
    const blocks = TETROMINOES[tetro.type][tetro.rotation];
    blocks.forEach(([dx, dy]) => {
      const x = tetro.pos.x + dx;
      const y = tetro.pos.y + dy;
      if (y >= 0 && y < BOARD_HEIGHT && x >= 0 && x < BOARD_WIDTH) {
        display[y][x] = tetro.type;
      }
    });
    return display;
  }

  // Collisions with wall, floor, or placed blocks
  function hasCollision(tetro, boardArg=board) {
    const { type, rotation, pos } = tetro;
    for (const [dx, dy] of TETROMINOES[type][rotation]) {
      const x = pos.x + dx;
      const y = pos.y + dy;
      if (
        x < 0 ||
        x >= BOARD_WIDTH ||
        y < 0 ||
        y >= BOARD_HEIGHT ||
        (y >= 0 && boardArg[y][x])
      ) {
        return true;
      }
    }
    return false;
  }

  // Place the current tetromino onto the board and check for line clears
  function placeTetromino(tetro, prevBoard) {
    const newBoard = prevBoard.map(row => row.slice());
    TETROMINOES[tetro.type][tetro.rotation].forEach(([dx, dy]) => {
      const x = tetro.pos.x + dx;
      const y = tetro.pos.y + dy;
      if (y >= 0 && y < BOARD_HEIGHT && x >= 0 && x < BOARD_WIDTH) {
        newBoard[y][x] = tetro.type;
      }
    });
    return newBoard;
  }

  function clearLinesFromBoard(newBoard) {
    const linesToClear = [];
    for (let y = 0; y < BOARD_HEIGHT; ++y) {
      if (newBoard[y].every(cell => !!cell)) linesToClear.push(y);
    }
    if (!linesToClear.length) return { board: newBoard, cleared: 0 };
    let updated = [...newBoard];
    for (const y of linesToClear) {
      updated.splice(y, 1);
      updated.unshift(Array(BOARD_WIDTH).fill(null)); // New empty row at top
    }
    return { board: updated, cleared: linesToClear.length };
  }

  // PUBLIC_INTERFACE
  function resetGame() {
    setBoard(createEmptyBoard());
    setCurrent(getRandomTetromino());
    setNext(getRandomTetromino());
    setScore(0);
    setLevel(0);
    setLinesCleared(0);
    setDropTime(1000);
    setGameOver(false);
    fastDropRef.current = false;
  }

  // Difficulty increases every 10 lines cleared
  useEffect(() => {
    const newLevel = Math.floor(linesCleared / 10);
    setLevel(newLevel);
    setDropTime(Math.max(100, 1000 - newLevel * 100));
  }, [linesCleared]);

  // The main drop timer interval
  useEffect(() => {
    if (gameOver) return clearInterval(intervalRef.current);
    if (fastDropRef.current) return; // Disables interval if fast drop
    intervalRef.current = setInterval(() => {
      moveDown();
    }, dropTime);
    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line
  }, [dropTime, current, gameOver]);

  // Main: place piece and update game state or move current down by 1
  const moveDown = useCallback(() => {
    if (gameOver) return;
    const moved = { ...current, pos: { x: current.pos.x, y: current.pos.y + 1 } };
    if (!hasCollision(moved)) {
      setCurrent(moved);
    } else {
      // Place piece on the board
      const mergedBoard = placeTetromino(current, board);
      // Clear lines if any
      const { board: newBoard, cleared } = clearLinesFromBoard(mergedBoard);
      setBoard(newBoard);
      setScore(s => s + getScoreForClearedLines(cleared));
      setLinesCleared(l => l + cleared);

      // New piece!
      const nextTetro = next;
      const reset = {
        ...nextTetro,
        pos: { x: 3, y: 0 }
      };
      // If new piece collides: game over!
      if (hasCollision(reset, newBoard)) {
        setGameOver(true);
      } else {
        setCurrent(reset);
        setNext(getRandomTetromino());
      }
    }
  // eslint-disable-next-line
  }, [current, board, next, gameOver]);

  function getScoreForClearedLines(lines) {
    // Standard Tetris: 40/100/300/1200 for 1-4 lines
    switch (lines) {
      case 1: return 40 * (level + 1);
      case 2: return 100 * (level + 1);
      case 3: return 300 * (level + 1);
      case 4: return 1200 * (level + 1);
      default: return 0;
    }
  }

  function tryMove(offsetX, offsetY, nextRotation = null) {
    if (gameOver) return;
    const tentative = {
      ...current,
      pos: { x: current.pos.x + offsetX, y: current.pos.y + offsetY },
      rotation:
        nextRotation === null ? current.rotation : (nextRotation + 4) % 4
    };
    if (!hasCollision(tentative)) {
      setCurrent(tentative);
    }
  }

  function handleKey(e) {
    if (gameOver && e.code === 'Space') {
      resetGame();
      return;
    }
    if (gameOver) return;
    if (e.repeat) return;
    switch (e.code) {
      case 'ArrowLeft':
      case 'KeyA':
        e.preventDefault();
        tryMove(-1, 0);
        break;
      case 'ArrowRight':
      case 'KeyD':
        e.preventDefault();
        tryMove(1, 0);
        break;
      case 'ArrowDown':
      case 'KeyS':
        e.preventDefault();
        fastDropRef.current = true; // Enable fast drop mode
        moveDown();
        break;
      case 'ArrowUp':
      case 'KeyW':
      case 'Space':
        e.preventDefault();
        tryMove(0, 0, (current.rotation + 1) % 4);
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        e.preventDefault();
        tryMove(0, 0, (current.rotation - 1 + 4) % 4);
        break;
      case 'KeyQ':
        e.preventDefault();
        tryMove(0, 0, (current.rotation - 1 + 4) % 4);
        break;
      case 'KeyE':
        e.preventDefault();
        tryMove(0, 0, (current.rotation + 1) % 4);
        break;
      case 'KeyR':
        e.preventDefault();
        resetGame();
        break;
      default:
        break;
    }
  }

  // Fast Drop - piece falls rapidly while ArrowDown is held
  function handleKeyUp(e) {
    if (e.code === 'ArrowDown' || e.code === 'KeyS') {
      fastDropRef.current = false;
      setDropTime(Math.max(100, 1000 - level * 100));
    }
  }

  // Key listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('keyup', handleKeyUp);
    };
    // eslint-disable-next-line
  }, [current, gameOver, level]);

  // On fast drop, drop interval is disabled and drop on every ArrowDown keypress
  useEffect(() => {
    if (gameOver || !fastDropRef.current) return;
    let fastDropID = setInterval(moveDown, 25);
    return () => clearInterval(fastDropID);
    // eslint-disable-next-line
  }, [current, board, gameOver]);

  // PUBLIC_INTERFACE
  function hardDrop() {
    // Drop piece all the way to the bottom instantly
    if (gameOver) return;
    let moved = { ...current };
    while (!hasCollision({ ...moved, pos: { x: moved.pos.x, y: moved.pos.y + 1 } })) {
      moved.pos.y++;
    }
    setCurrent(moved);
    // Place piece
    setTimeout(moveDown, 0);
  }

  // Renders
  const displayedBoard = renderBoardWithCurrent(board, current);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      gap: 36,
      marginTop: 40,
      fontFamily: "Inter, 'Roboto', Arial, Helvetica, sans-serif"
    }}>
      {/* Game Board */}
      <div style={{
        position: 'relative',
        background: COLORS.empty,
        padding: 18,
        borderRadius: 14,
        boxShadow: '0 6px 32px #181e2ea0',
        border: `4px solid ${COLORS.border}`,
        outline: `2px solid ${COLORS.sidebarBg}`,
        outlineOffset: '2px',
        display: 'grid',
        gridTemplateRows: `repeat(${BOARD_HEIGHT}, 24px)`,
        gridTemplateColumns: `repeat(${BOARD_WIDTH}, 24px)`
      }}>
        {displayedBoard.map((row, y) =>
          row.map((cell, x) => (
            <div
              key={`${y}-${x}`}
              style={{
                width: 22,
                height: 22,
                boxSizing: 'border-box',
                border: cell
                  ? `2px solid ${COLORS.border}`
                  : `1px solid ${COLORS.sidebarBg}80`,
                background: cell ? COLORS[cell] : COLORS.empty,
                borderRadius: cell ? 5 : 0,
                margin: 0,
                transition: 'background 0.15s'
              }}
            />
          ))
        )}
        {/* Game Over Overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          color: COLORS.accent,
          width: '100%',
          textAlign: 'center',
          fontWeight: 700,
          fontSize: 28,
          letterSpacing: 2,
          pointerEvents: 'none',
          opacity: gameOver ? 1 : 0,
          background: gameOver ? '#222831f3' : 'transparent',
          borderRadius: 14,
          height: '100%',
          display: gameOver ? 'flex' : 'none',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          border: gameOver ? `2px solid ${COLORS.border}` : undefined,
        }}>
          GAME OVER<br />
          <span style={{ fontSize: 18, fontWeight: 400 }}>
            Score: {score}<br />Press <b>Space</b> or <b>R</b> to Restart
          </span>
        </div>
      </div>
      {/* Sidebar */}
      <div style={{
        minWidth: 168,
        background: COLORS.sidebarBg,
        borderRadius: 13,
        padding: 19,
        color: COLORS.accent,
        boxShadow: '0 4px 18px #23283149',
        border: `2px solid ${COLORS.border}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        <div style={{
          fontWeight: 700,
          fontSize: 22,
          color: COLORS.accent,
          marginBottom: 8,
          textShadow: `0 2px 8px #22283190`
        }}>
          Score: <span style={{ color: "#fff", fontWeight: 700 }}>{score}</span>
        </div>
        <div style={{
          color: COLORS.textSecondary,
          fontWeight: 500,
          fontSize: 16,
          marginBottom: 4
        }}>
          Level: {level + 1}
        </div>
        <div style={{
          color: COLORS.textSecondary,
          fontSize: 15,
          marginBottom: 16
        }}>
          Lines: {linesCleared}
        </div>
        <div style={{
          marginTop: 10,
          color: COLORS.text,
          fontWeight: 600,
          fontSize: 15
        }}>
          Next:
        </div>
        <NextTetrominoPreview tetromino={next} />
        <ControlsHint />
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
// Shows the next tetromino preview in a fixed size 4x4 grid
function NextTetrominoPreview({ tetromino }) {
  const grid = Array(4)
    .fill(null)
    .map(() => Array(4).fill(null));
  if (tetromino) {
    TETROMINOES[tetromino.type][0].forEach(([dx, dy]) => {
      if (dx < 4 && dy < 4) grid[dy][dx] = tetromino.type;
    });
  }
  return (
    <div style={{
      display: 'grid',
      gridTemplateRows: 'repeat(4, 16px)',
      gridTemplateColumns: 'repeat(4, 16px)',
      gap: 0,
      margin: "9px 0 18px"
    }}>
      {grid.map((row, y) =>
        row.map((cell, x) => (
          <div
            key={`${y}-${x}`}
            style={{
              width: 15,
              height: 15,
              background: cell ? COLORS[cell] : "#2c2b39",
              border: cell ? '2px solid #fff4' : '1px solid #5555',
              borderRadius: cell ? 3 : 0,
              margin: 0
            }}
          />
        ))
      )}
    </div>
  );
}

// PUBLIC_INTERFACE
// Hints for controls, keyboard only
function ControlsHint() {
  return (
    <div style={{ fontSize: 12, marginTop: 8, color: "#f2e9e480" }}>
      <b>Controls:</b>
      <ul style={{ paddingLeft: 18, margin: 2 }}>
        <li>←/A: Move Left</li>
        <li>→/D: Move Right</li>
        <li>↓/S: Faster Down</li>
        <li>Space/W/↑: Rotate (CW)</li>
        <li>Shift/Q: Rotate (CCW)</li>
        <li>R: Restart</li>
      </ul>
    </div>
  );
}

export default TetraMaster;
