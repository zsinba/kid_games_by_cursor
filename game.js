const boardSize = 20;
const board = document.getElementById('game-board');
let snake = [{x: 10, y: 10}];
let food = {x: 5, y: 5};
let direction = {x: 0, y: 0};
let score = 0;
let gameSpeed = 500;
let gameInterval;
let isPaused = false;

function createBoard() {
    board.innerHTML = '';
    for (let i = 0; i < boardSize * boardSize; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        board.appendChild(cell);
    }
}

function drawSnake() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        cell.classList.remove('snake', 'snake-head');
        const mouth = cell.querySelector('.mouth');
        if (mouth) mouth.remove();
    });

    for (let i = 1; i < snake.length; i++) {
        const index = snake[i].y * boardSize + snake[i].x;
        cells[index].classList.add('snake');
    }

    const headIndex = snake[0].y * boardSize + snake[0].x;
    cells[headIndex].classList.add('snake-head');
    
    const mouth = document.createElement('div');
    mouth.classList.add('mouth');
    cells[headIndex].appendChild(mouth);
}

function drawFood() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => cell.classList.remove('food'));
    const index = food.y * boardSize + food.x;
    cells[index].classList.add('food');
}

function moveSnake() {
    const head = {
        x: snake[0].x + direction.x,
        y: snake[0].y + direction.y
    };

    if (head.x < 0 || head.x >= boardSize || head.y < 0 || head.y >= boardSize ||
        snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        clearInterval(gameInterval);
        addHistoryEntry('游戏结束，最终得分：' + score);
        alert('游戏结束！得分：' + score);
        resetGame();
        return;
    }

    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
        score++;
        document.getElementById('score').textContent = '得分: ' + score;
        placeFood();
        if (gameSpeed > 50) gameSpeed -= 5;
        clearInterval(gameInterval);
        gameInterval = setInterval(update, gameSpeed);
        addHistoryEntry('得分增加: ' + score);
    } else {
        snake.pop();
    }
}

function placeFood() {
    let newFood;
    do {
        newFood = {
            x: Math.floor(Math.random() * boardSize),
            y: Math.floor(Math.random() * boardSize)
        };
    } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    food = newFood;
}

function update() {
    moveSnake();
    drawSnake();
    drawFood();
}

document.getElementById('start-btn').addEventListener('click', () => {
    if (!gameInterval) {
        direction = { x: 1, y: 0 };
        gameInterval = setInterval(update, gameSpeed);
        addHistoryEntry('游戏开始');
    }
});

document.getElementById('pause-btn').addEventListener('click', () => {
    if (isPaused) {
        gameInterval = setInterval(update, gameSpeed);
        isPaused = false;
        addHistoryEntry('游戏继续');
    } else {
        clearInterval(gameInterval);
        isPaused = true;
        addHistoryEntry('游戏暂停');
    }
});

function addHistoryEntry(message) {
    const historyList = document.getElementById('history-list');
    const entry = document.createElement('li');
    entry.textContent = message;
    historyList.insertBefore(entry, historyList.firstChild);
    if (historyList.children.length > 5) {
        historyList.removeChild(historyList.lastChild);
    }
}

function resetGame() {
    snake = [{x: 10, y: 10}];
    direction = {x: 0, y: 0};
    score = 0;
    gameSpeed = 500;
    document.getElementById('score').textContent = '得分: 0';
    placeFood();
    clearInterval(gameInterval);
    gameInterval = null;
    addHistoryEntry('游戏重置');
}

window.addEventListener('keydown', e => {
    switch (e.key) {
        case 'ArrowUp':
            if (direction.y === 0) direction = {x: 0, y: -1};
            break;
        case 'ArrowDown':
            if (direction.y === 0) direction = {x: 0, y: 1};
            break;
        case 'ArrowLeft':
            if (direction.x === 0) direction = {x: -1, y: 0};
            break;
        case 'ArrowRight':
            if (direction.x === 0) direction = {x: 1, y: 0};
            break;
    }
});

createBoard();
resetGame();