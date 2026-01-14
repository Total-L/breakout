const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreElement = document.getElementById('finalScore');

// Polyfill for roundRect if not supported
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        this.beginPath();
        this.moveTo(x + r, y);
        this.arcTo(x + w, y, x + w, y + h, r);
        this.arcTo(x + w, y + h, x, y + h, r);
        this.arcTo(x, y + h, x, y, r);
        this.arcTo(x, y, x + w, y, r);
        this.closePath();
        return this;
    };
}

// Audio Controller
const AudioContext = window.AudioContext || window.webkitAudioContext;

class SoundController {
    constructor() {
        this.ctx = new AudioContext();
        this.enabled = true;
        this.bgmInterval = null;
    }

    init() {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    startBGM() {
        if (this.bgmInterval) return;
        
        // Simple cheerful sequence (I-IV-V-I progression)
        const sequence = [
            // C Major
            261.63, 329.63, 392.00, 523.25,
            261.63, 329.63, 392.00, 523.25,
            // F Major
            349.23, 440.00, 523.25, 698.46,
            349.23, 440.00, 523.25, 698.46,
            // G Major
            392.00, 493.88, 587.33, 783.99,
            392.00, 493.88, 587.33, 783.99,
            // C Major
            261.63, 329.63, 392.00, 523.25,
            261.63, 329.63, 392.00, 523.25
        ];
        
        let noteIndex = 0;
        
        // Use a recursive function with setTimeout instead of setInterval for better timing
        const playNextNote = () => {
            if (!this.enabled || this.ctx.state === 'suspended') {
                this.bgmInterval = setTimeout(playNextNote, 500); // Check again later
                return;
            }
            
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc.type = 'triangle';
            osc.frequency.value = sequence[noteIndex];
            
            const now = this.ctx.currentTime;
            gain.gain.setValueAtTime(0.03, now); // Quiet background
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
            
            osc.start(now);
            osc.stop(now + 0.2);
            // Cleanup nodes
            setTimeout(() => {
                osc.disconnect();
                gain.disconnect();
            }, 250);
            
            noteIndex = (noteIndex + 1) % sequence.length;
            
            this.bgmInterval = setTimeout(playNextNote, 150);
        };
        
        playNextNote();
    }

    stopBGM() {
        if (this.bgmInterval) {
            clearTimeout(this.bgmInterval);
            this.bgmInterval = null;
        }
    }

    play(type) {
        if (!this.enabled) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        const now = this.ctx.currentTime;

        switch (type) {
            case 'brick':
                osc.type = 'square';
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
                gain.gain.setValueAtTime(0.05, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
                setTimeout(() => { osc.disconnect(); gain.disconnect(); }, 150);
                break;
            case 'paddle':
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(300, now);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
                setTimeout(() => { osc.disconnect(); gain.disconnect(); }, 150);
                break;
            case 'wall':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(150, now);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
                osc.start(now);
                osc.stop(now + 0.05);
                setTimeout(() => { osc.disconnect(); gain.disconnect(); }, 100);
                break;
             case 'die':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(200, now);
                osc.frequency.exponentialRampToValueAtTime(50, now + 0.5);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.5);
                osc.start(now);
                osc.stop(now + 0.5);
                setTimeout(() => { osc.disconnect(); gain.disconnect(); }, 550);
                break;
             case 'gameover':
                 [300, 250, 200, 150].forEach((freq, i) => {
                    const o = this.ctx.createOscillator();
                    const g = this.ctx.createGain();
                    o.connect(g);
                    g.connect(this.ctx.destination);
                    o.frequency.value = freq;
                    g.gain.setValueAtTime(0.1, now + i*0.2);
                    g.gain.exponentialRampToValueAtTime(0.001, now + i*0.2 + 0.2);
                    o.start(now + i*0.2);
                    o.stop(now + i*0.2 + 0.2);
                    setTimeout(() => { o.disconnect(); g.disconnect(); }, i*200 + 250);
                 });
                 break;
            case 'win':
                 [400, 500, 600, 800].forEach((freq, i) => {
                    const o = this.ctx.createOscillator();
                    const g = this.ctx.createGain();
                    o.connect(g);
                    g.connect(this.ctx.destination);
                    o.type = 'triangle';
                    o.frequency.value = freq;
                    g.gain.setValueAtTime(0.1, now + i*0.1);
                    g.gain.exponentialRampToValueAtTime(0.001, now + i*0.1 + 0.1);
                    o.start(now + i*0.1);
                    o.stop(now + i*0.1 + 0.1);
                    setTimeout(() => { o.disconnect(); g.disconnect(); }, i*100 + 150);
                 });
                 break;
        }
    }
}
const audio = new SoundController();

// Game constants
let PADDLE_HEIGHT = 12;
let PADDLE_WIDTH_RATIO = 0.15; // Paddle width relative to screen width
let BALL_RADIUS_RATIO = 0.012;
let BRICK_ROW_COUNT = 8;
let BRICK_COLUMN_COUNT = 10;
let BRICK_PADDING = 8;
let BRICK_OFFSET_TOP = 50;
let BRICK_OFFSET_LEFT = 35;
let POWERUP_WIDTH = 60;
let POWERUP_HEIGHT = 30;

// Mobile adjustments
let isMobile = false;

function checkMobile() {
    isMobile = window.innerWidth <= 600 || window.innerHeight <= 600;

    if (isMobile) {
        PADDLE_HEIGHT = 36; // Significantly thicker paddle for mobile (2x previous 18)
        PADDLE_WIDTH_RATIO = 0.25; 
        BALL_RADIUS_RATIO = 0.025; 
        BRICK_ROW_COUNT = 10; 
        BRICK_COLUMN_COUNT = 6; 
        BRICK_PADDING = 5;
        BRICK_OFFSET_TOP = 100; // Increased offset to clear notch area
        BRICK_OFFSET_LEFT = 10;
        POWERUP_WIDTH = 70;
        POWERUP_HEIGHT = 35;
    } else {
        // Reset to desktop defaults if resized back
        PADDLE_HEIGHT = 32; // Significantly thicker desktop paddle (2x previous 16)
        PADDLE_WIDTH_RATIO = 0.15;
        BALL_RADIUS_RATIO = 0.012;
        BRICK_ROW_COUNT = 8;
        BRICK_COLUMN_COUNT = 10;
        BRICK_PADDING = 8;
        BRICK_OFFSET_TOP = 50;
        BRICK_OFFSET_LEFT = 35;
        POWERUP_WIDTH = 60;
        POWERUP_HEIGHT = 30;
    }
}

checkMobile();

// Game variables
let paddleWidth, paddleX, paddleY;
let ballRadius;
let balls = []; // Array of {x, y, dx, dy, active}
let powerUps = []; // Array of {x, y, type, active, dy}
let bricks = [];
let score = 0;
let lives = 3;
let gameState = 'START'; // START, PLAYING, GAMEOVER
let round = 1;
let backgroundPattern = null;

// PowerUp Types
const POWERUPS = {
    'E': { color: '#00AAFF', text: 'E' }, // Expand
    'S': { color: '#FFAA00', text: 'S' }, // Slow
    'M': { color: '#00FF00', text: 'M' }, // Multi-ball
    'P': { color: '#AAAAAA', text: 'P' }  // Player (Life)
};

// Create background pattern
function createBackgroundPattern() {
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 40;
    pCanvas.height = 40;
    const pCtx = pCanvas.getContext('2d');
    
    // Dark blue background
    pCtx.fillStyle = '#000022';
    pCtx.fillRect(0, 0, 40, 40);
    
    // Circuit pattern
    pCtx.strokeStyle = '#000044';
    pCtx.lineWidth = 2;
    pCtx.beginPath();
    pCtx.moveTo(10, 0); pCtx.lineTo(10, 40);
    pCtx.moveTo(0, 10); pCtx.lineTo(40, 10);
    pCtx.stroke();
    
    pCtx.fillStyle = '#000066';
    pCtx.fillRect(18, 18, 4, 4);
    
    return ctx.createPattern(pCanvas, 'repeat');
}

// Resize canvas to full screen
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Attempt to request fullscreen on first interaction
    if (document.documentElement.requestFullscreen && !document.fullscreenElement && gameState === 'PLAYING' && isMobile) {
        // This usually requires a direct user gesture, so we might need to trigger it in handleInteraction
    }

    backgroundPattern = createBackgroundPattern();
    
    // Recalculate dimensions based on new size
    paddleWidth = canvas.width * PADDLE_WIDTH_RATIO;
    paddleY = canvas.height - (isMobile ? 80 : 40); // Lift paddle higher on mobile to avoid home bar
    ballRadius = Math.max(4, canvas.width * BALL_RADIUS_RATIO);
    
    // If resizing during play, ensure paddle stays on screen
    if (paddleX > canvas.width - paddleWidth) {
        paddleX = canvas.width - paddleWidth;
    }
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Initialize bricks
function initBricks() {
    bricks = [];
    const brickWidth = (canvas.width - (BRICK_OFFSET_LEFT * 2) - (BRICK_PADDING * (BRICK_COLUMN_COUNT - 1))) / BRICK_COLUMN_COUNT;
    const brickHeight = isMobile ? 30 : 25; // Taller bricks for both mobile and desktop
    
    // Arkanoid colors
    const colors = ['#FF0000', '#FF9900', '#FFFF00', '#00FF00', '#0099FF', '#FF00FF', '#FFFFFF', '#FFD700'];

    for(let c = 0; c < BRICK_COLUMN_COUNT; c++) {
        bricks[c] = [];
        for(let r = 0; r < BRICK_ROW_COUNT; r++) {
            let type = 'color';
            let hits = 1;
            let color = colors[r % colors.length];
            let value = 100;

            // Randomly assign silver bricks (harder)
            if (Math.random() > 0.85) {
                type = 'silver';
                hits = 2 + Math.floor(round / 5); // Harder in later rounds
                color = '#C0C0C0';
                value = 50 * round;
            }

            bricks[c][r] = { x: 0, y: 0, status: 1, type, hits, color, value };
        }
    }
    return { brickWidth, brickHeight };
}

let brickDims = initBricks();

function resetGame() {
    resizeCanvas();
    paddleX = (canvas.width - paddleWidth) / 2;
    
    const startX = canvas.width / 2;
    const startY = canvas.height - 60;
    const speed = canvas.width < 600 ? 4 : 6;
    
    balls = [{
        x: startX,
        y: startY,
        dx: speed * (Math.random() > 0.5 ? 1 : -1),
        dy: -speed,
        active: true
    }];
    
    powerUps = [];
    score = 0;
    lives = 3;
    round = 1;
    brickDims = initBricks();
    gameState = 'PLAYING';
    
    startScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    
    audio.startBGM();
    draw();
}

// Input handling
let lastTouchX = null;

function movePaddle(clientX) {
    // Standard absolute movement for mouse/desktop
    const relativeX = clientX - canvas.offsetLeft;
    if(relativeX > 0 && relativeX < canvas.width) {
        paddleX = relativeX - paddleWidth / 2;
        clampPaddle();
    }
}

function movePaddleRelative(deltaX) {
    paddleX += deltaX;
    clampPaddle();
}

function clampPaddle() {
    if (paddleX < 0) paddleX = 0;
    if (paddleX + paddleWidth > canvas.width) paddleX = canvas.width - paddleWidth;
}

document.addEventListener('mousemove', (e) => {
    if (gameState === 'PLAYING') {
        movePaddle(e.clientX);
    }
});

document.addEventListener('touchstart', (e) => {
    if (gameState === 'PLAYING') {
        lastTouchX = e.touches[0].clientX;
    }
}, { passive: false });

document.addEventListener('touchmove', (e) => {
    if (gameState === 'PLAYING') {
        e.preventDefault(); // Prevent scrolling
        
        const currentTouchX = e.touches[0].clientX;
        if (lastTouchX !== null) {
            const deltaX = currentTouchX - lastTouchX;
            // Sensitivity factor: 1.2 for slightly faster response
            movePaddleRelative(deltaX * 1.2);
            lastTouchX = currentTouchX;
        }
    }
}, { passive: false });

document.addEventListener('touchend', (e) => {
    lastTouchX = null;
});

// Click/Tap to start/restart
function handleInteraction(e) {
    // Resume Audio Context on user interaction (required for mobile)
    if (audio.ctx.state === 'suspended') {
        audio.ctx.resume();
    }
    audio.init(); // Initialize audio context on first interaction
    
    // Try to enter fullscreen on mobile
    if (isMobile && !document.fullscreenElement) {
        // iOS Safari doesn't support requestFullscreen on documentElement
        // We can only suggest adding to homescreen, but for Android we can try:
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(err => console.log(err));
        } else if (document.documentElement.webkitRequestFullscreen) {
            document.documentElement.webkitRequestFullscreen(); // Safari/Chrome legacy
        }
    }

    if (gameState === 'START' || gameState === 'GAMEOVER') {
        resetGame();
    }
}

document.addEventListener('click', handleInteraction);
document.addEventListener('touchstart', handleInteraction);

// Drawing functions
function drawBall(ball) {
    if (!ball.active) return;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowBlur = 5;
    ctx.shadowColor = '#FFFFFF';
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.closePath();
}

// Helper function to draw rounded rect path
function roundedRectPath(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

function drawPaddle() {
    const r = PADDLE_HEIGHT / 2;

    // Create a Silver-Gold metallic gradient
    const gradient = ctx.createLinearGradient(paddleX, paddleY, paddleX, paddleY + PADDLE_HEIGHT);
    // Silver Top
    gradient.addColorStop(0, '#FFFFFF');    
    gradient.addColorStop(0.2, '#E0E0E0');
    // Gold/Bronze Middle band
    gradient.addColorStop(0.5, '#D4AF37');  
    // Darker Silver Bottom
    gradient.addColorStop(0.8, '#A0A0A0');
    gradient.addColorStop(1, '#606060');

    ctx.save();
    
    // Add a golden glow effect
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 15;
    
    ctx.fillStyle = gradient;
    
    // Draw main body
    roundedRectPath(ctx, paddleX, paddleY, paddleWidth, PADDLE_HEIGHT, r);
    ctx.fill();
    
    // Add metallic sheen/highlight
    ctx.shadowBlur = 0;
    
    // Top highlight (White reflection)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    roundedRectPath(ctx, paddleX + r/2, paddleY + 2, paddleWidth - r, PADDLE_HEIGHT * 0.3, PADDLE_HEIGHT * 0.15);
    ctx.fill();
    
    // Gold trim detail (Thin line)
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
}

function drawBricks() {
    // Recalculate brick width dynamically in case of resize
    const brickWidth = (canvas.width - (BRICK_OFFSET_LEFT * 2) - (BRICK_PADDING * (BRICK_COLUMN_COUNT - 1))) / BRICK_COLUMN_COUNT;
    const brickHeight = isMobile ? 30 : 20;
    
    for(let c = 0; c < BRICK_COLUMN_COUNT; c++) {
        for(let r = 0; r < BRICK_ROW_COUNT; r++) {
            const b = bricks[c][r];
            if(b.status === 1) {
                const brickX = (c * (brickWidth + BRICK_PADDING)) + BRICK_OFFSET_LEFT;
                const brickY = (r * (brickHeight + BRICK_PADDING)) + BRICK_OFFSET_TOP;
                b.x = brickX;
                b.y = brickY;
                
                // 3D Bevel effect
                ctx.beginPath();
                ctx.rect(brickX, brickY, brickWidth, brickHeight);
                ctx.fillStyle = b.color;
                ctx.fill();
                
                // Light edge (Top/Left)
                ctx.beginPath();
                ctx.moveTo(brickX, brickY + brickHeight);
                ctx.lineTo(brickX, brickY);
                ctx.lineTo(brickX + brickWidth, brickY);
                ctx.lineTo(brickX + brickWidth - 4, brickY + 4);
                ctx.lineTo(brickX + 4, brickY + 4);
                ctx.lineTo(brickX + 4, brickY + brickHeight - 4);
                ctx.closePath();
                ctx.fillStyle = 'rgba(255,255,255,0.4)';
                ctx.fill();
                
                // Dark edge (Bottom/Right)
                ctx.beginPath();
                ctx.moveTo(brickX + brickWidth, brickY);
                ctx.lineTo(brickX + brickWidth, brickY + brickHeight);
                ctx.lineTo(brickX, brickY + brickHeight);
                ctx.lineTo(brickX + 4, brickY + brickHeight - 4);
                ctx.lineTo(brickX + brickWidth - 4, brickY + brickHeight - 4);
                ctx.lineTo(brickX + brickWidth - 4, brickY + 4);
                ctx.closePath();
                ctx.fillStyle = 'rgba(0,0,0,0.4)';
                ctx.fill();
                
                // Silver texture (simple sheen)
                if (b.type === 'silver') {
                    ctx.fillStyle = 'rgba(255,255,255,0.2)';
                    ctx.fillRect(brickX + 5, brickY + 5, brickWidth - 10, brickHeight - 10);
                }
            }
        }
    }
    return { brickWidth, brickHeight }; // Return for collision detection
}

function drawPowerUps() {
    for (let i = 0; i < powerUps.length; i++) {
        const p = powerUps[i];
        if (!p.active) continue;
        
        const w = POWERUP_WIDTH;
        const h = POWERUP_HEIGHT;
        const r = h / 2; // Fully rounded ends
        
        // Shadow
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 5;
        
        // Gradient Body
        const grad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + h);
        grad.addColorStop(0, POWERUPS[p.type].color);
        grad.addColorStop(1, '#000000'); // Darker bottom
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(p.x, p.y, w, h, r);
        ctx.fill();
        
        // Shine/Highlight (Top half)
        const shineGrad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + h/2);
        shineGrad.addColorStop(0, 'rgba(255,255,255,0.8)');
        shineGrad.addColorStop(1, 'rgba(255,255,255,0.1)');
        
        ctx.fillStyle = shineGrad;
        ctx.beginPath();
        ctx.roundRect(p.x + 2, p.y + 2, w - 4, h/2 - 2, r-2);
        ctx.fill();
        
        // Border - Re-trace full shape
        ctx.beginPath();
        ctx.roundRect(p.x, p.y, w, h, r);
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Text
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold ' + Math.floor(h * 0.55) + 'px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // Center text exactly in the bounding box
        ctx.fillText(POWERUPS[p.type].text, p.x + w/2, p.y + h/2 + 1); // +1 for visual optical adjustment
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
    }
}

function drawScore() {
    ctx.font = '20px "Courier New", monospace';
    
    // Add safe area padding for mobile notches/status bars
    const topPadding = isMobile ? 50 : 30;
    
    ctx.fillStyle = '#FF0000';
    ctx.fillText('1UP', 20, topPadding);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(score, 60, topPadding);
    
    ctx.fillStyle = '#FF0000';
    ctx.fillText('HIGH SCORE', canvas.width - 200, topPadding);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('50000', canvas.width - 80, topPadding);
    
    // Lives (Vaus icons)
    for(let i = 0; i < lives - 1; i++) {
        ctx.fillStyle = '#CCCCCC';
        ctx.fillRect(20 + (i * 30), canvas.height - 20, 20, 8);
    }
}

function spawnPowerUp(x, y) {
    // 15% chance to drop powerup
    if (Math.random() > 0.15) return;
    
    const types = Object.keys(POWERUPS);
    const type = types[Math.floor(Math.random() * types.length)];
    
    powerUps.push({
        x: x,
        y: y,
        type: type,
        active: true,
        dy: 3
    });
}

function activatePowerUp(type) {
    audio.play('powerup');
    switch(type) {
        case 'E': // Expand
            paddleWidth = Math.min(canvas.width * 0.3, paddleWidth * 1.5);
            break;
        case 'S': // Slow
            balls.forEach(b => {
                if (Math.abs(b.dx) > 2) b.dx *= 0.6;
                if (Math.abs(b.dy) > 2) b.dy *= 0.6;
            });
            break;
        case 'M': // Multi-ball
            const mainBall = balls.find(b => b.active);
            if (mainBall) {
                balls.push({
                    x: mainBall.x, y: mainBall.y,
                    dx: mainBall.dx, dy: -mainBall.dy, active: true
                });
                balls.push({
                    x: mainBall.x, y: mainBall.y,
                    dx: -mainBall.dx, dy: mainBall.dy, active: true
                });
            }
            break;
        case 'P': // Player Life
            lives++;
            break;
    }
}

function collisionDetection(brickWidth, brickHeight) {
    for(let c = 0; c < BRICK_COLUMN_COUNT; c++) {
        for(let r = 0; r < BRICK_ROW_COUNT; r++) {
            const b = bricks[c][r];
            if(b.status === 1) {
                balls.forEach(ball => {
                    if (!ball.active) return;
                    
                    // Find closest point on rectangle to circle center
                    const closestX = Math.max(b.x, Math.min(ball.x, b.x + brickWidth));
                    const closestY = Math.max(b.y, Math.min(ball.y, b.y + brickHeight));
                    
                    // Calculate distance to closest point
                    const distanceX = ball.x - closestX;
                    const distanceY = ball.y - closestY;
                    const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);
                    
                    // Check collision
                    if (distanceSquared < (ballRadius * ballRadius)) {
                        // Resolve collision based on overlap depth
                        // We compare overlaps to determine hit side
                        const brickCenterX = b.x + brickWidth / 2;
                        const brickCenterY = b.y + brickHeight / 2;
                        
                        const overlapX = (brickWidth / 2 + ballRadius) - Math.abs(ball.x - brickCenterX);
                        const overlapY = (brickHeight / 2 + ballRadius) - Math.abs(ball.y - brickCenterY);
                        
                        if (overlapX < overlapY) {
                            // Hit horizontal side
                            ball.dx = -ball.dx;
                            // Push out
                            ball.x += (ball.x < brickCenterX ? -overlapX : overlapX);
                        } else {
                            // Hit vertical side
                            ball.dy = -ball.dy;
                            // Push out
                            ball.y += (ball.y < brickCenterY ? -overlapY : overlapY);
                        }

                        if (b.type === 'silver') {
                            b.hits--;
                            audio.play('silver');
                            if (b.hits <= 0) {
                                b.status = 0;
                                score += b.value;
                                audio.play('brick');
                                spawnPowerUp(b.x + brickWidth/2 - POWERUP_WIDTH/2, b.y + brickHeight/2);
                            }
                        } else {
                            b.status = 0;
                            score += b.value;
                            audio.play('brick');
                            spawnPowerUp(b.x + brickWidth/2 - POWERUP_WIDTH/2, b.y + brickHeight/2);
                        }
                    }
                });
            }
        }
    }
    
    // Check if level cleared
    let activeBricks = false;
    for(let c = 0; c < BRICK_COLUMN_COUNT; c++) {
        for(let r = 0; r < BRICK_ROW_COUNT; r++) {
            if(bricks[c][r].status === 1) activeBricks = true;
        }
    }
    
    if (!activeBricks) {
        audio.stopBGM();
        audio.play('win');
        round++;
        initBricks();
        balls.forEach(b => {
             b.dx *= 1.1;
             b.dy *= 1.1;
        });
    }
}

function draw() {
    if (gameState !== 'PLAYING') return;

    // Draw background
    ctx.fillStyle = backgroundPattern || '#000022';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw borders
    ctx.fillStyle = '#888888';
    ctx.fillRect(0, 0, 10, canvas.height); // Left
    ctx.fillRect(canvas.width - 10, 0, 10, canvas.height); // Right
    ctx.fillRect(0, 0, canvas.width, 10); // Top
    
    const { brickWidth, brickHeight } = drawBricks();
    
    balls.forEach(drawBall);
    drawPowerUps();
    drawPaddle();
    drawScore();
    collisionDetection(brickWidth, brickHeight);
    
    // Update PowerUps
    // Clean up inactive powerups to prevent memory leak
    powerUps = powerUps.filter(p => p.active);
    powerUps.forEach(p => {
        p.y += p.dy;
        
        // Paddle collision
        if (p.y + POWERUP_HEIGHT >= paddleY && p.y <= paddleY + PADDLE_HEIGHT &&
            p.x + POWERUP_WIDTH >= paddleX && p.x <= paddleX + paddleWidth) {
            p.active = false;
            activatePowerUp(p.type);
        }
        
        // Remove if off screen
        if (p.y > canvas.height) p.active = false;
    });
    
    // Update Balls
    // Clean up inactive balls to prevent memory leak
    balls = balls.filter(b => b.active);
    let activeBalls = 0;
    balls.forEach(ball => {
        activeBalls++;
        
        // Wall collision
        if(ball.x + ball.dx > canvas.width - 10 - ballRadius || ball.x + ball.dx < 10 + ballRadius) {
            ball.dx = -ball.dx;
            audio.play('wall');
        }
        if(ball.y + ball.dy < 10 + ballRadius) {
            ball.dy = -ball.dy;
            audio.play('wall');
        } else if (ball.dy > 0 && 
                   ball.y + ballRadius >= paddleY - ball.dy && 
                   ball.y - ballRadius <= paddleY + PADDLE_HEIGHT &&
                   ball.x >= paddleX && 
                   ball.x <= paddleX + paddleWidth) {
            // Paddle collision
            ball.dy = -Math.abs(ball.dy); // Ensure it goes up
            ball.y = paddleY - ballRadius; // Snap to paddle top
            audio.play('paddle');
            
            const hitPoint = ball.x - (paddleX + paddleWidth / 2);
            ball.dx = hitPoint * 0.15;
            if (Math.abs(ball.dx) < 2) ball.dx = 2 * (ball.dx < 0 ? -1 : 1);
        } else if(ball.y + ball.dy > canvas.height - ballRadius) {
            ball.active = false;
        }
        
        ball.x += ball.dx;
        ball.y += ball.dy;
    });
    
    // Check game over condition
    if (activeBalls === 0) {
        lives--;
        audio.play('die');
        if(!lives) {
            gameState = 'GAMEOVER';
            audio.stopBGM();
            audio.play('gameover');
            finalScoreElement.innerText = 'Score: ' + score;
            gameOverScreen.style.display = 'flex';
        } else {
            // Reset ball
            paddleX = (canvas.width - paddleWidth) / 2;
            balls = [{
                x: canvas.width / 2,
                y: canvas.height - 60,
                dx: 4 * (Math.random() > 0.5 ? 1 : -1),
                dy: -4,
                active: true
            }];
            paddleWidth = canvas.width * PADDLE_WIDTH_RATIO; // Reset powerups
        }
    }
    
    requestAnimationFrame(draw);
}

// Initial draw (blank or background)
ctx.fillStyle = '#000';
ctx.fillRect(0, 0, canvas.width, canvas.height);
