// Game variables
const gameBoard = document.getElementById('gameBoard');
const playerPaddle = document.getElementById('playerPaddle');
const computerPaddle = document.getElementById('computerPaddle');
const ball = document.getElementById('ball');
const playerScoreDisplay = document.getElementById('playerScore');
const computerScoreDisplay = document.getElementById('computerScore');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');

// Game constants
const BOARD_WIDTH = gameBoard.clientWidth;
const BOARD_HEIGHT = gameBoard.clientHeight;
const PADDLE_HEIGHT = 100;
const PADDLE_WIDTH = 12;
const BALL_SIZE = 12;
const PADDLE_SPEED = 6;
const COMPUTER_SPEED = 4;
const INITIAL_BALL_SPEED = 4;

// Game state
let gameRunning = false;
let gameStarted = false;

// Ball object
let ballObject = {
    x: BOARD_WIDTH / 2,
    y: BOARD_HEIGHT / 2,
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
    if (!gameStarted) {
        gameRunning = true;
        gameStarted = true;
        startBtn.textContent = 'Pause Game';
        gameLoop();
    } else if (gameRunning) {
        gameRunning = false;
        startBtn.textContent = 'Resume Game';
    } else {
        gameRunning = true;
        startBtn.textContent = 'Pause Game';
        gameLoop();
    }
});

resetBtn.addEventListener('click', () => {
    score.player = 0;
    score.computer = 0;
    playerScoreDisplay.textContent = score.player;
    computerScoreDisplay.textContent = score.computer;
    resetBall();
    gameRunning = false;
    gameStarted = false;
    startBtn.textContent = 'Start Game';
});

// Update player paddle position
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
function updateComputerPaddle() {
    const computerCenter = paddles.computer.y + PADDLE_HEIGHT / 2;
    const ballCenter = ballObject.y;

    // Simple AI: follow the ball
    if (computerCenter < ballCenter - 35) {
        paddles.computer.y += paddles.computer.speed;
    } else if (computerCenter > ballCenter + 35) {
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

// Update ball position
function updateBall() {
    ballObject.x += ballObject.speedX;
    ballObject.y += ballObject.speedY;

    // Top and bottom wall collision
    if (ballObject.y - ballObject.size / 2 <= 0 || ballObject.y + ballObject.size / 2 >= BOARD_HEIGHT) {
        ballObject.speedY = -ballObject.speedY;
        ballObject.y = Math.max(ballObject.size / 2, Math.min(BOARD_HEIGHT - ballObject.size / 2, ballObject.y));
    }

    // Paddle collision - Player paddle
    if (
        ballObject.x - ballObject.size / 2 <= paddles.player.x + PADDLE_WIDTH &&
        ballObject.y >= paddles.player.y &&
        ballObject.y <= paddles.player.y + PADDLE_HEIGHT
    ) {
        ballObject.speedX = -ballObject.speedX;
        ballObject.x = paddles.player.x + PADDLE_WIDTH + ballObject.size / 2;
        // Add spin based on paddle hit location
        const hitPos = (ballObject.y - (paddles.player.y + PADDLE_HEIGHT / 2)) / (PADDLE_HEIGHT / 2);
        ballObject.speedY += hitPos * 3;
    }

    // Paddle collision - Computer paddle
    if (
        ballObject.x + ballObject.size / 2 >= paddles.computer.x &&
        ballObject.y >= paddles.computer.y &&
        ballObject.y <= paddles.computer.y + PADDLE_HEIGHT
    ) {
        ballObject.speedX = -ballObject.speedX;
        ballObject.x = paddles.computer.x - ballObject.size / 2;
        // Add spin based on paddle hit location
        const hitPos = (ballObject.y - (paddles.computer.y + PADDLE_HEIGHT / 2)) / (PADDLE_HEIGHT / 2);
        ballObject.speedY += hitPos * 3;
    }

    // Left wall (computer scores)
    if (ballObject.x - ballObject.size / 2 < 0) {
        score.computer++;
        computerScoreDisplay.textContent = score.computer;
        resetBall();
    }

    // Right wall (player scores)
    if (ballObject.x + ballObject.size / 2 > BOARD_WIDTH) {
        score.player++;
        playerScoreDisplay.textContent = score.player;
        resetBall();
    }

    ball.style.left = ballObject.x + 'px';
    ball.style.top = ballObject.y + 'px';
}

// Reset ball to center
function resetBall() {
    ballObject.x = BOARD_WIDTH / 2;
    ballObject.y = BOARD_HEIGHT / 2;
    ballObject.speedX = (Math.random() > 0.5 ? 1 : -1) * INITIAL_BALL_SPEED;
    ballObject.speedY = (Math.random() - 0.5) * INITIAL_BALL_SPEED * 2;
}

// Main game loop
function gameLoop() {
    if (!gameRunning) {
        return;
    }

    updatePlayerPaddle();
    updateComputerPaddle();
    updateBall();

    requestAnimationFrame(gameLoop);
}

// Initialize game
function initGame() {
    resetBall();
    playerPaddle.style.top = paddles.player.y + 'px';
    computerPaddle.style.top = paddles.computer.y + 'px';
    ball.style.left = ballObject.x + 'px';
    ball.style.top = ballObject.y + 'px';
}

// Start the game initialization
initGame();
