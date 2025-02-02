class Tetris {
    constructor() {
        this.canvas = document.getElementById('tetris');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('nextPiece');
        this.nextCtx = this.nextCanvas.getContext('2d');

        // Game board size
        this.COLS = 10;
        this.ROWS = 20;
        this.BLOCK_SIZE = 30;

        // Game state
        this.board = Array(this.ROWS).fill().map(() => Array(this.COLS).fill(0));
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameOver = false;
        this.isPaused = false;

        // Current piece state
        this.currentPiece = null;
        this.nextPiece = null;

        // Initialize game speed
        this.dropInterval = 1000;
        this.lastTime = 0;
        this.dropCounter = 0;

        // Tetromino shapes and colors
        this.SHAPES = {
            I: [
                [1, 1, 1, 1]
            ],
            L: [
                [1, 0],
                [1, 0],
                [1, 1]
            ],
            J: [
                [0, 1],
                [0, 1],
                [1, 1]
            ],
            O: [
                [1, 1],
                [1, 1]
            ],
            Z: [
                [1, 1, 0],
                [0, 1, 1]
            ],
            S: [
                [0, 1, 1],
                [1, 1, 0]
            ],
            T: [
                [0, 1, 0],
                [1, 1, 1]
            ]
        };

        this.COLORS = {
            I: '#00f0f0',
            L: '#f0a500',
            J: '#0000f0',
            O: '#f0f000',
            Z: '#f00000',
            S: '#00f000',
            T: '#a000f0'
        };

        // Bind event handlers
        document.addEventListener('keydown', this.handleKeyPress.bind(this));

        // Initialize the game
        this.init();
    }

    init() {
        // Create first piece and next piece
        this.createNewPiece();
        this.createNewPiece();

        // Start the game loop
        requestAnimationFrame(this.update.bind(this));
    }

    createNewPiece() {
        const shapes = Object.keys(this.SHAPES);
        const randomShape = shapes[Math.floor(Math.random() * shapes.length)];

        const piece = {
            shape: this.SHAPES[randomShape],
            color: this.COLORS[randomShape],
            x: Math.floor(this.COLS / 2) - Math.floor(this.SHAPES[randomShape][0].length / 2),
            y: 0
        };

        if (this.currentPiece === null) {
            this.currentPiece = piece;
        } else {
            this.currentPiece = this.nextPiece;
        }
        this.nextPiece = piece;

        // Check for game over
        if (this.checkCollision()) {
            this.gameOver = true;
        }

        this.drawNextPiece();
    }

    drawNextPiece() {
        // Clear next piece canvas
        this.nextCtx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);

        // Calculate center position
        const blockSize = 25;
        const xOffset = (this.nextCanvas.width - this.nextPiece.shape[0].length * blockSize) / 2;
        const yOffset = (this.nextCanvas.height - this.nextPiece.shape.length * blockSize) / 2;

        // Draw next piece
        this.nextPiece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    this.nextCtx.fillStyle = this.nextPiece.color;
                    this.nextCtx.fillRect(
                        xOffset + x * blockSize,
                        yOffset + y * blockSize,
                        blockSize - 1,
                        blockSize - 1
                    );
                }
            });
        });
    }

    update(time = 0) {
        if (this.gameOver) {
            this.drawGameOver();
            return;
        }

        if (this.isPaused) {
            this.drawPaused();
            requestAnimationFrame(this.update.bind(this));
            return;
        }

        const deltaTime = time - this.lastTime;
        this.lastTime = time;

        this.dropCounter += deltaTime;
        if (this.dropCounter > this.dropInterval) {
            this.moveDown();
        }

        this.draw();
        requestAnimationFrame(this.update.bind(this));
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw board
        this.board.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    this.ctx.fillStyle = value;
                    this.ctx.fillRect(
                        x * this.BLOCK_SIZE,
                        y * this.BLOCK_SIZE,
                        this.BLOCK_SIZE - 1,
                        this.BLOCK_SIZE - 1
                    );
                }
            });
        });

        // Draw current piece
        if (this.currentPiece) {
            this.currentPiece.shape.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value) {
                        this.ctx.fillStyle = this.currentPiece.color;
                        this.ctx.fillRect(
                            (this.currentPiece.x + x) * this.BLOCK_SIZE,
                            (this.currentPiece.y + y) * this.BLOCK_SIZE,
                            this.BLOCK_SIZE - 1,
                            this.BLOCK_SIZE - 1
                        );
                    }
                });
            });
        }

        // Update score display
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('lines').textContent = this.lines;
    }

    drawGameOver() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = 'white';
        this.ctx.font = '48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('游戏结束!', this.canvas.width / 2, this.canvas.height / 2);

        this.ctx.font = '24px Arial';
        this.ctx.fillText(
            `最终得分: ${this.score}`,
            this.canvas.width / 2,
            this.canvas.height / 2 + 50
        );
    }

    drawPaused() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = 'white';
        this.ctx.font = '48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('暂停', this.canvas.width / 2, this.canvas.height / 2);
    }

    checkCollision() {
        return this.currentPiece.shape.some((row, dy) => {
            return row.some((value, dx) => {
                if (!value) return false;
                const newX = this.currentPiece.x + dx;
                const newY = this.currentPiece.y + dy;
                return (
                    newX < 0 ||
                    newX >= this.COLS ||
                    newY >= this.ROWS ||
                    (newY >= 0 && this.board[newY][newX])
                );
            });
        });
    }

    rotate() {
        const originalShape = this.currentPiece.shape;
        // Get the rotated shape matrix
        this.currentPiece.shape = this.currentPiece.shape[0].map((_, i) =>
            this.currentPiece.shape.map(row => row[i]).reverse()
        );

        // If rotation causes collision, revert back
        if (this.checkCollision()) {
            this.currentPiece.shape = originalShape;
        }
    }

    moveDown() {
        this.currentPiece.y++;
        this.dropCounter = 0;

        if (this.checkCollision()) {
            this.currentPiece.y--;
            this.mergePiece();
            this.createNewPiece();
        }
    }

    moveLeft() {
        this.currentPiece.x--;
        if (this.checkCollision()) {
            this.currentPiece.x++;
        }
    }

    moveRight() {
        this.currentPiece.x++;
        if (this.checkCollision()) {
            this.currentPiece.x--;
        }
    }

    hardDrop() {
        while (!this.checkCollision()) {
            this.currentPiece.y++;
        }
        this.currentPiece.y--;
        this.mergePiece();
        this.createNewPiece();
    }

    mergePiece() {
        this.currentPiece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    const boardY = this.currentPiece.y + y;
                    const boardX = this.currentPiece.x + x;
                    if (boardY >= 0) {
                        this.board[boardY][boardX] = this.currentPiece.color;
                    }
                }
            });
        });

        this.clearLines();
    }

    clearLines() {
        let linesCleared = 0;

        for (let y = this.ROWS - 1; y >= 0; y--) {
            if (this.board[y].every(value => value !== 0)) {
                // Remove the line
                this.board.splice(y, 1);
                // Add empty line at top
                this.board.unshift(Array(this.COLS).fill(0));
                linesCleared++;
                y++; // Check the same line again
            }
        }

        if (linesCleared > 0) {
            // Update score and level
            this.lines += linesCleared;
            this.score += linesCleared * 100 * this.level;
            this.level = Math.floor(this.lines / 10) + 1;

            // Increase game speed
            this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);
        }
    }

    handleKeyPress(event) {
        if (this.gameOver) return;

        switch (event.keyCode) {
            case 37: // Left arrow
                this.moveLeft();
                break;
            case 39: // Right arrow
                this.moveRight();
                break;
            case 40: // Down arrow
                this.moveDown();
                break;
            case 38: // Up arrow
                this.rotate();
                break;
            case 32: // Space
                this.hardDrop();
                break;
            case 80: // P key
                this.isPaused = !this.isPaused;
                break;
        }
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new Tetris();
});