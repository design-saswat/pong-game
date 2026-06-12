// Game variables
const gameBoard = document.getElementById('gameBoard');
const playerPaddle = document.getElementById('playerPaddle');
const computerPaddle = document.getElementById('computerPaddle');
const ball = document.getElementById('ball');
const playerScoreDisplay = document.getElementById('playerScore');
const computerScoreDisplay = document.getElementById('computerScore');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const difficultySlider = document.getElementById('difficultySlider');
const difficultyLabel = document.getElementById('difficultyLabel');
const targetScoreSelect = document.getElementById('targetScoreSelect');
const statusMessage = document.getElementById('statusMessage');

// Game constants
const BOARD_WIDTH = gameBoard.clientWidth;
const BOARD_HEIGHT = gameBoard.clientHeight;
const PADDLE_HEIGHT = 100;
const PADDLE_WIDTH = 12;
const BALL_SIZE = 12;
const PADDLE_SPEED = 6;
const COMPUTER_SPEED = 4;
const INITIAL_BALL_SPEED = 3.4;
const MAX_BALL_SPEED = 16;
const POINT_PAUSE_MS = 1500;

const DIFFICULTY_PROFILES = [
    { label: 'Lowest', ballMultiplier: 0.75, aiSpeedMultiplier: 0.75, aiError: 0.55 },
    { label: 'Low', ballMultiplier: 0.88, aiSpeedMultiplier: 0.90, aiError: 0.35 },
    { label: 'Medium', ballMultiplier: 1.00, aiSpeedMultiplier: 1.00, aiError: 0.22 },
    { label: 'High', ballMultiplier: 1.12, aiSpeedMultiplier: 1.18, aiError: 0.12 },
    { label: 'Highest', ballMultiplier: 1.25, aiSpeedMultiplier: 1.35, aiError: 0.06 }
];

// Game state
let gameRunning = false;
let gameStarted = false;
let gameOver = false;
let currentDifficulty = Number(difficultySlider.value);
let targetScore = Number(targetScoreSelect.value);

// Ball object
let ballObject = {
    x: BOARD_WIDTH / 2,
    y: BOARD_HEIGHT / 2,
    prevX: BOARD_WIDTH / 2,
    prevY: BOARD_HEIGHT / 2,
    speedX: INITIAL_BALL_SPEED,
    speedY: INITIAL_BALL_SPEED,
    size: BALL_SIZE
};

// Paddles object
let paddles = {
    player: {
        x: 10,
        y: BOARD_HEIGHT / 2 - PADDLE_HEIGHT / 2,
        width: PADDLE_WIDTH,
        height: PADDLE_HEIGHT,
        speed: 0
    },
    computer: {
        x: BOARD_WIDTH - PADDLE_WIDTH - 10,
        y: BOARD_HEIGHT / 2 - PADDLE_HEIGHT / 2,
        width: PADDLE_WIDTH,
        height: PADDLE_HEIGHT,
        speed: COMPUTER_SPEED
    }
};

// Score
let score = {
    player: 0,
    computer: 0
};
let scorePaused = false;
let scorePauseTimer = null;
const pointBlip = document.getElementById('pointBlip');
const resultOverlay = document.getElementById('resultOverlay');
const resultCard = document.getElementById('resultCard');
const confettiLayer = document.getElementById('confettiLayer');

// Keyboard input tracking
const keys = {
    ArrowUp: false,
    ArrowDown: false
};

// Mouse tracking
let mouseY = BOARD_HEIGHT / 2;

// Event listeners
window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') keys.ArrowUp = true;
    if (e.key === 'ArrowDown') keys.ArrowDown = true;
});

window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowUp') keys.ArrowUp = false;
    if (e.key === 'ArrowDown') keys.ArrowDown = false;
});

gameBoard.addEventListener('mousemove', (e) => {
    const rect = gameBoard.getBoundingClientRect();
    mouseY = e.clientY - rect.top;
});

startBtn.addEventListener('click', () => {
    if (gameOver) {
        resetMatch();
    }

    if (!gameStarted) {
        applyMatchSettings();
        gameRunning = true;
        gameStarted = true;
        gameOver = false;
        startBtn.textContent = 'Pause Game';
        statusMessage.textContent = `Difficulty: ${DIFFICULTY_PROFILES[currentDifficulty - 1].label} • First to ${targetScore} points.`;
        gameLoop();
    } else if (gameRunning) {
        gameRunning = false;
        startBtn.textContent = 'Resume Game';
        statusMessage.textContent = 'Game paused. Click Resume to continue.';
    } else {
        gameRunning = true;
        startBtn.textContent = 'Pause Game';
        statusMessage.textContent = 'Game resumed.';
        gameLoop();
    }
});

resetBtn.addEventListener('click', () => {
    resetMatch();
});

difficultySlider.addEventListener('input', () => {
    currentDifficulty = Number(difficultySlider.value);
    difficultyLabel.textContent = `${currentDifficulty} - ${DIFFICULTY_PROFILES[currentDifficulty - 1].label}`;
});

targetScoreSelect.addEventListener('change', () => {
    targetScore = Number(targetScoreSelect.value);
    statusMessage.textContent = `Match set to ${targetScore} points. Difficulty: ${DIFFICULTY_PROFILES[currentDifficulty - 1].label}.`;
});

// Update player paddle position
function resetPaddlesAndBall() {
    paddles.player.y = BOARD_HEIGHT / 2 - PADDLE_HEIGHT / 2;
    paddles.computer.y = BOARD_HEIGHT / 2 - PADDLE_HEIGHT / 2;
    playerPaddle.style.top = paddles.player.y + 'px';
    computerPaddle.style.top = paddles.computer.y + 'px';
    resetBall();
}

function showPointBlip(winner) {
    pointBlip.textContent = `${winner} point!`;
    pointBlip.className = `point-blip ${winner === 'Player' ? 'left' : 'right'}`;
    pointBlip.style.opacity = '1';
    pointBlip.style.transform = 'translateY(0) scale(1)';
    clearTimeout(showPointBlip._timeout);
    showPointBlip._timeout = setTimeout(() => {
        pointBlip.style.opacity = '0';
        pointBlip.style.transform = 'translateY(-10px) scale(0.95)';
    }, 800);
}

function showResultState(state) {
    resultOverlay.classList.add('show');
    resultCard.className = `result-card ${state.toLowerCase()}`;
    resultCard.textContent = state;
    if (state === 'WIN') {
        spawnConfetti();
    }
}

function hideResultState() {
    resultOverlay.classList.remove('show');
    resultCard.className = 'result-card';
}

function spawnConfetti() {
    confettiLayer.innerHTML = '';
    for (let i = 0; i < 40; i++) {
        const piece = document.createElement('span');
        piece.className = 'confetti-piece';
        piece.style.left = `${Math.random() * 100}%`;
        piece.style.background = ['#00ff88', '#7cffb2', '#ffef6b', '#ff7a59'][i % 4];
        piece.style.setProperty('--dx', `${(Math.random() - 0.5) * 220}px`);
        piece.style.animationDuration = `${1.2 + Math.random() * 0.8}s`;
        confettiLayer.appendChild(piece);
    }
}

function updatePlayerPaddle() {
    // Mouse control
    paddles.player.y = mouseY - PADDLE_HEIGHT / 2;

    // Keyboard control (arrow keys)
    if (keys.ArrowUp) {
        paddles.player.y -= PADDLE_SPEED;
    }
    if (keys.ArrowDown) {
        paddles.player.y += PADDLE_SPEED;
    }

    // Boundary collision
    if (paddles.player.y < 0) {
        paddles.player.y = 0;
    }
    if (paddles.player.y + PADDLE_HEIGHT > BOARD_HEIGHT) {
        paddles.player.y = BOARD_HEIGHT - PADDLE_HEIGHT;
    }

    playerPaddle.style.top = paddles.player.y + 'px';
}

// Update computer paddle position (AI)
function getDifficultyProfile() {
    return DIFFICULTY_PROFILES[currentDifficulty - 1] || DIFFICULTY_PROFILES[2];
}

function applyMatchSettings() {
    currentDifficulty = Number(difficultySlider.value);
    targetScore = Number(targetScoreSelect.value);
    difficultyLabel.textContent = `${currentDifficulty} - ${DIFFICULTY_PROFILES[currentDifficulty - 1].label}`;
    paddles.computer.speed = COMPUTER_SPEED * getDifficultyProfile().aiSpeedMultiplier;
    resetBall();
}

function updateComputerPaddle() {
    const profile = getDifficultyProfile();
    const computerCenter = paddles.computer.y + PADDLE_HEIGHT / 2;
    const targetCenter = ballObject.y + (Math.random() - 0.5) * profile.aiError * PADDLE_HEIGHT;

    if (computerCenter < targetCenter - 10) {
        paddles.computer.y += paddles.computer.speed;
    } else if (computerCenter > targetCenter + 10) {
        paddles.computer.y -= paddles.computer.speed;
    }

    // Boundary collision
    if (paddles.computer.y < 0) {
        paddles.computer.y = 0;
    }
    if (paddles.computer.y + PADDLE_HEIGHT > BOARD_HEIGHT) {
        paddles.computer.y = BOARD_HEIGHT - PADDLE_HEIGHT;
    }

    computerPaddle.style.top = paddles.computer.y + 'px';
}

function clampBallSpeed() {
    const speed = Math.hypot(ballObject.speedX, ballObject.speedY);

    if (speed > MAX_BALL_SPEED) {
        ballObject.speedX = (ballObject.speedX / speed) * MAX_BALL_SPEED;
        ballObject.speedY = (ballObject.speedY / speed) * MAX_BALL_SPEED;
    }
}

function bounceOffPaddle(paddle, isPlayerPaddle) {
    const profile = getDifficultyProfile();
    const ballLeft = ballObject.x - ballObject.size / 2;
    const ballRight = ballObject.x + ballObject.size / 2;
    const ballTop = ballObject.y - ballObject.size / 2;
    const ballBottom = ballObject.y + ballObject.size / 2;
    const prevBallLeft = ballObject.prevX - ballObject.size / 2;
    const prevBallRight = ballObject.prevX + ballObject.size / 2;
    const prevBallTop = ballObject.prevY - ballObject.size / 2;
    const prevBallBottom = ballObject.prevY + ballObject.size / 2;
    const paddleLeft = paddle.x;
    const paddleRight = paddle.x + paddle.width;
    const paddleTop = paddle.y;
    const paddleBottom = paddle.y + paddle.height;

    const crossedPaddle = isPlayerPaddle
        ? prevBallRight >= paddleRight && ballLeft <= paddleRight
        : prevBallLeft <= paddleLeft && ballRight >= paddleLeft;

    const overlapsVertically = ballBottom >= paddleTop && ballTop <= paddleBottom;

    if (!crossedPaddle || !overlapsVertically) {
        return;
    }

    const hitPos = (ballObject.y - (paddle.y + paddle.height / 2)) / (paddle.height / 2);

    if (isPlayerPaddle) {
        ballObject.speedX = Math.abs(ballObject.speedX) + 0.08 * profile.ballMultiplier;
        ballObject.x = paddleRight + ballObject.size / 2;
    } else {
        ballObject.speedX = -Math.abs(ballObject.speedX) - 0.08 * profile.ballMultiplier;
        ballObject.x = paddleLeft - ballObject.size / 2;
    }

    ballObject.speedY += hitPos * (2.4 + profile.ballMultiplier * 0.6);
    clampBallSpeed();
}

// Update ball position
function updateBall() {
    ballObject.prevX = ballObject.x;
    ballObject.prevY = ballObject.y;
    ballObject.x += ballObject.speedX;
    ballObject.y += ballObject.speedY;

    // Top and bottom wall collision
    if (ballObject.y - ballObject.size / 2 <= 0 || ballObject.y + ballObject.size / 2 >= BOARD_HEIGHT) {
        ballObject.speedY = -ballObject.speedY;
        ballObject.y = Math.max(ballObject.size / 2, Math.min(BOARD_HEIGHT - ballObject.size / 2, ballObject.y));
    }

    bounceOffPaddle(paddles.player, true);
    bounceOffPaddle(paddles.computer, false);

    // Left wall (computer scores)
    if (ballObject.x - ballObject.size / 2 < 0) {
        score.computer++;
        computerScoreDisplay.textContent = score.computer;
        showPointBlip('Computer');
        checkMatchWinner();
        resetBall({ pauseAfterScore: true });
    }

    if (ballObject.x + ballObject.size / 2 > BOARD_WIDTH) {
        score.player++;
        playerScoreDisplay.textContent = score.player;
        showPointBlip('Player');
        checkMatchWinner();
        resetBall({ pauseAfterScore: true });
    }

    ball.style.left = ballObject.x + 'px';
    ball.style.top = ballObject.y + 'px';
}

function checkMatchWinner() {
    if (score.player >= targetScore || score.computer >= targetScore) {
        gameRunning = false;
        gameStarted = false;
        gameOver = true;
        startBtn.textContent = 'Start New Match';
        const playerWon = score.player > score.computer;

        if (playerWon) {
            statusMessage.textContent = `You win ${score.player}-${score.computer}! Match finished.`;
            showResultState('WIN');
        } else {
            statusMessage.textContent = `Computer wins ${score.computer}-${score.player}. Match finished.`;
            showResultState('LOSE');
        }
    }
}

function resetMatch() {
    score.player = 0;
    score.computer = 0;
    playerScoreDisplay.textContent = score.player;
    computerScoreDisplay.textContent = score.computer;
    gameRunning = false;
    gameStarted = false;
    gameOver = false;
    scorePaused = false;
    clearTimeout(scorePauseTimer);
    startBtn.textContent = 'Start Game';
    currentDifficulty = Number(difficultySlider.value);
    targetScore = Number(targetScoreSelect.value);
    difficultyLabel.textContent = `${currentDifficulty} - ${DIFFICULTY_PROFILES[currentDifficulty - 1].label}`;
    paddles.computer.speed = COMPUTER_SPEED * getDifficultyProfile().aiSpeedMultiplier;
    statusMessage.textContent = `Ready for a new ${targetScore}-point match at ${DIFFICULTY_PROFILES[currentDifficulty - 1].label.toLowerCase()} difficulty.`;
    resetPaddlesAndBall();
    hideResultState();
    confettiLayer.innerHTML = '';
}

// Reset ball to center
function resetBall({ pauseAfterScore = false } = {}) {
    const profile = getDifficultyProfile();
    ballObject.x = BOARD_WIDTH / 2;
    ballObject.y = BOARD_HEIGHT / 2;
    ballObject.prevX = ballObject.x;
    ballObject.prevY = ballObject.y;
    ballObject.speedX = 0;
    ballObject.speedY = 0;

    ballObject.speedX = (Math.random() > 0.5 ? 1 : -1) * INITIAL_BALL_SPEED * profile.ballMultiplier;
    ballObject.speedY = (Math.random() - 0.5) * INITIAL_BALL_SPEED * 2 * profile.ballMultiplier;
    ballObject.speedX = Math.max(-MAX_BALL_SPEED, Math.min(MAX_BALL_SPEED, ballObject.speedX));
    ballObject.speedY = Math.max(-MAX_BALL_SPEED, Math.min(MAX_BALL_SPEED, ballObject.speedY));

    if (pauseAfterScore) {
        scorePaused = true;
        clearTimeout(scorePauseTimer);
        scorePauseTimer = setTimeout(() => {
            scorePaused = false;
        }, POINT_PAUSE_MS);
    } else {
        scorePaused = false;
    }
}

// Main game loop
function gameLoop() {
    if (!gameRunning) {
        return;
    }

    updatePlayerPaddle();
    updateComputerPaddle();
    if (!scorePaused) {
        updateBall();
    }

    requestAnimationFrame(gameLoop);
}

// Initialize game
function initGame() {
    currentDifficulty = Number(difficultySlider.value);
    targetScore = Number(targetScoreSelect.value);
    difficultyLabel.textContent = `${currentDifficulty} - ${DIFFICULTY_PROFILES[currentDifficulty - 1].label}`;
    paddles.computer.speed = COMPUTER_SPEED * getDifficultyProfile().aiSpeedMultiplier;
    resetPaddlesAndBall();
    hideResultState();
    confettiLayer.innerHTML = '';
    playerPaddle.style.top = paddles.player.y + 'px';
    computerPaddle.style.top = paddles.computer.y + 'px';
    ball.style.left = ballObject.x + 'px';
    ball.style.top = ballObject.y + 'px';
}

// Start the game initialization
initGame();
