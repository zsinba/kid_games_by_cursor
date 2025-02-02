class ClawGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.score = 0;
        this.chances = 21;
        this.soundEnabled = false;
        this.gameStarted = false;
        this.claw = new Claw(this.canvas.width / 2, 100);
        this.clawState = 'idle';
        this.dolls = [];
        this.sounds = {};
        this.particles = [];
        this.showInstructions = true;
        this.lastGrabPosition = null;
        this.glowEffect = 0;
        this.isSpacePressed = false;

        this.init();
    }

    init() {
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('soundBtn').addEventListener('click', () => this.toggleSound());
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        this.setupTouchControls();
        this.soundManager = new SoundManager();
        this.updateUI();
        this.lastTime = performance.now();
        this.animate(this.lastTime);
    }

    setupTouchControls() {
        let touchStartX = 0;
        const actionBtn = document.getElementById('actionBtn');

        this.canvas.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
        });

        this.canvas.addEventListener('touchmove', (e) => {
            if (this.gameStarted && this.clawState === 'idle') {
                const touchX = e.touches[0].clientX;
                const diff = touchX - touchStartX;
                this.claw.x = Math.max(50, Math.min(this.canvas.width - 50, this.claw.x + diff));
                touchStartX = touchX;
            }
        });

        actionBtn.addEventListener('touchstart', () => {
            if (this.gameStarted && this.clawState === 'idle') {
                this.isSpacePressed = true;
                this.startGrabbing();
            }
        });

        actionBtn.addEventListener('touchend', () => {
            if (this.isSpacePressed) {
                this.isSpacePressed = false;
                if (this.clawState === 'dropping') {
                    this.dropClaw();
                }
            }
        });
    }

    handleKeyDown(e) {
        if (!this.gameStarted || this.clawState !== 'idle') return;

        switch (e.key) {
            case 'ArrowLeft':
                this.claw.x = Math.max(50, this.claw.x - 10);
                break;
            case 'ArrowRight':
                this.claw.x = Math.min(this.canvas.width - 50, this.claw.x + 10);
                break;
            case ' ':
                if (!this.isSpacePressed) {
                    this.isSpacePressed = true;
                    this.startGrabbing();
                }
                break;
        }
    }

    handleKeyUp(e) {
        if (e.key === ' ' && this.isSpacePressed) {
            this.isSpacePressed = false;
            if (this.clawState === 'dropping') {
                this.dropClaw();
            }
        }
    }

    startGame() {
        if (this.chances <= 0) {
            this.chances = 21;
            this.score = 0;
        }
        this.gameStarted = true;
        this.generateDolls();
        this.updateUI();
    }

    generateDolls() {
        this.dolls = [];
        const dollCount = 18;
        const minHeight = this.canvas.height * 0.6;
        const maxHeight = this.canvas.height * 0.9;

        for (let i = 0; i < dollCount; i++) {
            const x = 80 + Math.random() * (this.canvas.width - 160);
            const y = minHeight + Math.random() * (maxHeight - minHeight);
            this.dolls.push(new Doll(x, y));
        }
    }

    startGrabbing() {
        if (this.clawState !== 'idle') return;

        this.clawState = 'dropping';
        this.soundManager.play('drop');
    }

    dropClaw() {
        if (this.clawState !== 'dropping') return;

        this.clawState = 'grabbing';
        this.claw.angle = Math.PI / 3.5;
        this.soundManager.play('grab');

        setTimeout(() => {
            this.checkGrab();
            this.clawState = 'returning';
            this.claw.angle = 0;
        }, 300);
    }

    checkGrab() {
        for (let doll of this.dolls) {
            const clawTipX = this.claw.x;
            const clawTipY = this.claw.y + this.claw.grabHeight + 20;
            const dx = clawTipX - doll.x;
            const dy = clawTipY - doll.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 55) {
                const grabPrecision = 1 - (distance / 55);
                if (Math.random() < (0.85 + grabPrecision * 0.15)) {
                    this.score += 10;
                    this.claw.grabbedDoll = doll;
                    this.dolls = this.dolls.filter(d => d !== doll);
                    this.soundManager.play('success');
                    this.lastGrabPosition = { x: doll.x, y: doll.y };
                    this.createParticles(doll.x, doll.y, doll.color);
                } else {
                    this.soundManager.play('fail');
                    this.createParticles(doll.x, doll.y, '#ffcdd2');
                }
                this.updateUI();
                break;
            }
        }
    }

    updateClaw() {
        const speed = 6;
        const maxGrabHeight = this.canvas.height * 0.7;

        switch (this.clawState) {
            case 'dropping':
                this.claw.grabHeight += speed;
                if (this.claw.grabHeight >= maxGrabHeight) {
                    this.claw.grabHeight = maxGrabHeight;
                }
                break;
            case 'returning':
                this.claw.grabHeight -= speed * 1.5;
                if (this.claw.grabbedDoll) {
                    this.claw.grabbedDoll.x = this.claw.x;
                    this.claw.grabbedDoll.y = this.claw.y + this.claw.grabHeight;
                }
                if (this.claw.grabHeight <= 0) {
                    if (this.claw.grabbedDoll) {
                        this.claw.grabbedDoll = null;
                    }
                    this.clawState = 'idle';
                    this.chances--;
                    this.updateUI();
                    if (this.chances <= 0) {
                        this.gameStarted = false;
                    }
                }
                break;
        }
    }

    createParticles(x, y, color) {
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 * i) / 20;
            const speed = 2 + Math.random() * 3;
            const particle = new Particle(
                x + Math.cos(angle) * 10,
                y + Math.sin(angle) * 10,
                color,
                speed * Math.cos(angle),
                speed * Math.sin(angle)
            );
            this.particles.push(particle);
        }
    }

    updateParticles() {
        this.particles = this.particles.filter(particle => {
            particle.update(this.deltaTime);
            return particle.alpha > 0;
        });
    }

    drawParticles() {
        this.particles.forEach(particle => particle.draw(this.ctx));
    }

    drawMachineDetails() {
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillRect(30, 30, this.canvas.width - 60, 20);

        this.ctx.fillRect(30, 30, 20, this.canvas.height - 60);
        this.ctx.fillRect(this.canvas.width - 50, 30, 20, this.canvas.height - 60);

        const lightColors = ['#ff7675', '#74b9ff', '#55efc4', '#ffeaa7'];
        for (let i = 0; i < 8; i++) {
            const x = 80 + i * ((this.canvas.width - 160) / 7);
            this.ctx.beginPath();
            this.ctx.arc(x, 40, 5, 0, Math.PI * 2);
            this.ctx.fillStyle = lightColors[i % lightColors.length];
            this.ctx.fill();
        }
    }

    toggleSound() {
        this.soundManager.toggle();
        document.getElementById('soundBtn').textContent = `音效: ${this.soundManager.enabled ? '开' : '关'}`;
    }

    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('chances').textContent = this.chances;
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const bgGradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        bgGradient.addColorStop(0, '#ff9a9e');
        bgGradient.addColorStop(0.3, '#fad0c4');
        bgGradient.addColorStop(0.6, '#ffd1dc');
        bgGradient.addColorStop(1, '#ffecd2');

        const pulseIntensity = Math.sin(this.lastTime * 0.001) * 0.05;
        this.ctx.globalAlpha = 0.95 + pulseIntensity;

        this.ctx.fillStyle = bgGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        for (let i = 0; i < 20; i++) {
            const x = 50 + Math.sin(this.lastTime * 0.001 + i) * 30 + (i * this.canvas.width / 20);
            const y = 50 + Math.cos(this.lastTime * 0.001 + i) * 20 + (i % 3) * 200;
            const radius = 5 + Math.sin(this.lastTime * 0.002 + i) * 2;

            this.ctx.beginPath();
            this.ctx.arc(x, y, radius, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 255, 255, ${0.1 + Math.sin(this.lastTime * 0.001 + i) * 0.05})`;
            this.ctx.fill();
        }

        for (let i = 0; i < 20; i++) {
            const x = 50 + Math.sin(this.lastTime * 0.001 + i) * 30 + (i * this.canvas.width / 20);
            const y = 50 + Math.cos(this.lastTime * 0.001 + i) * 20 + (i % 3) * 200;
            const radius = 5 + Math.sin(this.lastTime * 0.002 + i) * 2;

            this.ctx.beginPath();
            this.ctx.arc(x, y, radius, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 255, 255, ${0.1 + Math.sin(this.lastTime * 0.001 + i) * 0.05})`;
            this.ctx.fill();
        }

        const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        gradient.addColorStop(0, '#4facfe');
        gradient.addColorStop(1, '#00f2fe');

        this.ctx.strokeStyle = gradient;
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(50, 50, this.canvas.width - 100, this.canvas.height - 100);

        this.drawMachineDetails();

        for (let doll of this.dolls) {
            doll.draw(this.ctx);
        }

        this.drawParticles();

        if (this.claw.grabbedDoll) {
            this.claw.grabbedDoll.draw(this.ctx);
        }

        this.claw.draw(this.ctx);

        if (!this.gameStarted) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.chances <= 0 ? '游戏结束' : '点击开始游戏', this.canvas.width / 2, this.canvas.height / 2);

            if (this.showInstructions) {
                this.ctx.font = '20px Arial';
                this.ctx.fillText('使用 ← → 键移动爪子', this.canvas.width / 2, this.canvas.height / 2 + 40);
                this.ctx.fillText('按空格键抓取', this.canvas.width / 2, this.canvas.height / 2 + 70);
                this.ctx.fillText('或使用触摸屏操作', this.canvas.width / 2, this.canvas.height / 2 + 100);
            }
        }

        if (this.lastGrabPosition) {
            this.glowEffect += 0.1;
            const glowRadius = 20 + Math.sin(this.glowEffect) * 5;
            this.ctx.beginPath();
            this.ctx.arc(this.lastGrabPosition.x, this.lastGrabPosition.y, glowRadius, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 255, 255, ${0.3 - Math.abs(Math.sin(this.glowEffect)) * 0.2})`;
            this.ctx.fill();
        }

        this.ctx.globalAlpha = 1.0;
    }

    animate(currentTime) {
        this.deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        if (this.gameStarted) {
            this.updateClaw();
            this.updateParticles();
        }
        this.draw();
        requestAnimationFrame((time) => this.animate(time));
    }
}

class Claw {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 60;
        this.isGrabbing = false;
        this.grabHeight = 0;
        this.speed = 5;
        this.angle = 0;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        const baseGradient = ctx.createLinearGradient(-5, 0, 5, 0);
        baseGradient.addColorStop(0, '#FFD700');
        baseGradient.addColorStop(1, '#FFA500');

        ctx.beginPath();
        ctx.moveTo(-5, 0);
        ctx.lineTo(5, 0);
        ctx.strokeStyle = baseGradient;
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, this.grabHeight);
        ctx.strokeStyle = '#A0A0A0';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.translate(0, this.grabHeight);
        this.drawClawArm(ctx, -this.angle);
        this.drawClawArm(ctx, 0);
        this.drawClawArm(ctx, this.angle);

        ctx.restore();
    }

    drawClawArm(ctx, angle) {
        ctx.save();
        ctx.rotate(angle);

        const armGradient = ctx.createLinearGradient(0, 0, 10, 30);
        armGradient.addColorStop(0, '#FFD700');
        armGradient.addColorStop(1, '#FFA500');

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(10, 15, 0, 30);
        ctx.strokeStyle = armGradient;
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 3;
        ctx.beginPath();
        ctx.moveTo(0, 30);
        ctx.quadraticCurveTo(-5, 35, -3, 40);
        ctx.strokeStyle = armGradient;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
    }
}

class Doll {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.color = this.getRandomColor();
        this.type = Math.floor(Math.random() * 8);
    }

    getRandomColor() {
        const colors = ['#FF69B4', '#87CEEB', '#98FB98', '#DDA0DD', '#F0E68C'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        ctx.beginPath();
        ctx.ellipse(0, 20, 20, 5, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fill();

        const bodyGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.width / 2);
        bodyGradient.addColorStop(0, this.color);
        bodyGradient.addColorStop(1, this.color);
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();

        this.drawFace(ctx);

        switch (this.type) {
            case 0:
                this.drawBearEars(ctx);
                break;
            case 1:
                this.drawRabbitEars(ctx);
                break;
            case 2:
                this.drawBow(ctx);
                break;
            case 3:
                this.drawCatEars(ctx);
                break;
            case 4:
                this.drawCrown(ctx);
                break;
            case 5:
                this.drawHat(ctx);
                break;
            case 6:
                this.drawGlasses(ctx);
                break;
            case 7:
                this.drawFlower(ctx);
                break;
        }

        ctx.restore();
    }

    drawFace(ctx) {
        ctx.beginPath();
        ctx.arc(-8, -5, 3, 0, Math.PI * 2);
        ctx.arc(8, -5, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#000';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(0, 5, 8, 0, Math.PI);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    drawBearEars(ctx) {
        ctx.beginPath();
        ctx.arc(-15, -15, 8, 0, Math.PI * 2);
        ctx.arc(15, -15, 8, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }

    drawRabbitEars(ctx) {
        ctx.beginPath();
        ctx.ellipse(-10, -25, 5, 15, 0, 0, Math.PI * 2);
        ctx.ellipse(10, -25, 5, 15, 0, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }

    drawBow(ctx) {
        ctx.beginPath();
        ctx.moveTo(-15, -20);
        ctx.quadraticCurveTo(0, -25, 15, -20);
        ctx.quadraticCurveTo(0, -15, -15, -20);
        ctx.fillStyle = '#FF69B4';
        ctx.fill();
    }

    drawCatEars(ctx) {
        ctx.beginPath();
        ctx.moveTo(-15, -15);
        ctx.lineTo(-8, -25);
        ctx.lineTo(-1, -15);
        ctx.moveTo(15, -15);
        ctx.lineTo(8, -25);
        ctx.lineTo(1, -15);
        ctx.fillStyle = this.color;
        ctx.fill();
    }

    drawCrown(ctx) {
        ctx.beginPath();
        ctx.moveTo(-15, -20);
        ctx.lineTo(-10, -30);
        ctx.lineTo(-5, -20);
        ctx.lineTo(0, -30);
        ctx.lineTo(5, -20);
        ctx.lineTo(10, -30);
        ctx.lineTo(15, -20);
        ctx.fillStyle = '#FFD700';
        ctx.fill();
    }

    drawHat(ctx) {
        ctx.beginPath();
        ctx.arc(0, -20, 12, 0, Math.PI * 2);
        ctx.fillStyle = '#333';
        ctx.fill();
        ctx.fillRect(-15, -20, 30, 5);
    }

    drawGlasses(ctx) {
        ctx.beginPath();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.arc(-8, -5, 5, 0, Math.PI * 2);
        ctx.arc(8, -5, 5, 0, Math.PI * 2);
        ctx.stroke();
    }

    drawFlower(ctx) {
        const petals = 6;
        const radius = 5;
        for (let i = 0; i < petals; i++) {
            ctx.beginPath();
            ctx.arc(-15 + Math.cos(i * Math.PI * 2 / petals) * radius, -20 + Math.sin(i * Math.PI * 2 / petals) * radius,
                radius,
                0,
                Math.PI * 2
            );
            ctx.fillStyle = '#FF69B4';
            ctx.fill();
        }
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.alpha = 1;
        this.size = Math.random() * 5 + 2;
        this.speedX = (Math.random() - 0.5) * 8;
        this.speedY = (Math.random() - 0.5) * 8;
    }

    update(deltaTime) {
        this.x += this.speedX;
        this.y += this.speedY;
        this.alpha -= deltaTime * 2;
        this.size -= deltaTime * 3;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.alpha);
        ctx.beginPath();
        ctx.arc(this.x, this.y, Math.max(0, this.size), 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }
}

window.addEventListener('load', () => {
    new ClawGame();
});