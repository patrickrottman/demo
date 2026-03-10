// ============================================================
// renderer.js - All canvas rendering, camera, minimap, effects
// ============================================================

class Renderer {
    constructor(canvas, minimapCanvas, game) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.minimap = minimapCanvas;
        this.mctx = minimapCanvas.getContext('2d');
        this.game = game;
        this.width = 0;
        this.height = 0;
        this._resize();
    }

    _resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    render() {
        const ctx = this.ctx;
        const game = this.game;
        const cam = game.camera;

        // Resize check
        if (this.width !== window.innerWidth || this.height !== window.innerHeight) {
            this._resize();
        }

        ctx.clearRect(0, 0, this.width, this.height);

        // Background
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(0, 0, this.width, this.height);

        ctx.save();

        // Camera transform
        const zoom = cam.zoom;
        const cx = this.width / 2 - cam.x * zoom;
        const cy = this.height / 2 - cam.y * zoom;
        ctx.translate(cx, cy);
        ctx.scale(zoom, zoom);

        // Viewport bounds in world coords
        const vpLeft = cam.x - (this.width / 2) / zoom - 50;
        const vpRight = cam.x + (this.width / 2) / zoom + 50;
        const vpTop = cam.y - (this.height / 2) / zoom - 50;
        const vpBottom = cam.y + (this.height / 2) / zoom + 50;

        // Grid
        this._drawGrid(ctx, cam, zoom, vpLeft, vpRight, vpTop, vpBottom);

        // World boundary
        this._drawBoundary(ctx, game.worldRadius);

        // Food
        this._drawFood(ctx, game, vpLeft, vpRight, vpTop, vpBottom);

        // Snakes (draw player last so it's on top)
        for (let i = 0; i < game.snakes.length; i++) {
            if (i === game.playerIndex) continue;
            const snake = game.snakes[i];
            if (snake.alive) this._drawSnake(ctx, snake, vpLeft, vpRight, vpTop, vpBottom);
        }
        const player = game.getPlayer();
        if (player && player.alive) {
            this._drawSnake(ctx, player, vpLeft, vpRight, vpTop, vpBottom);
        }

        // Particles
        this._drawParticles(ctx, game.particles);

        ctx.restore();

        // Minimap
        this._drawMinimap(game);
    }

    _drawGrid(ctx, cam, zoom, vpLeft, vpRight, vpTop, vpBottom) {
        const gridSize = 100;
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 1;
        const startX = Math.floor(vpLeft / gridSize) * gridSize;
        const startY = Math.floor(vpTop / gridSize) * gridSize;
        ctx.beginPath();
        for (let x = startX; x <= vpRight; x += gridSize) {
            ctx.moveTo(x, vpTop);
            ctx.lineTo(x, vpBottom);
        }
        for (let y = startY; y <= vpBottom; y += gridSize) {
            ctx.moveTo(vpLeft, y);
            ctx.lineTo(vpRight, y);
        }
        ctx.stroke();
    }

    _drawBoundary(ctx, radius) {
        // Glow ring
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 50, 50, 0.4)';
        ctx.lineWidth = 8;
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255, 50, 50, 0.15)';
        ctx.lineWidth = 30;
        ctx.stroke();
        ctx.restore();
    }

    _drawFood(ctx, game, vpL, vpR, vpT, vpB) {
        const items = game.foodPool.items;
        const time = game.time;
        for (let i = 0; i < items.length; i++) {
            const f = items[i];
            if (!f.active) continue;
            if (f.x < vpL || f.x > vpR || f.y < vpT || f.y > vpB) continue;

            const pulse = 1 + Math.sin(time * 3 + f.pulsePhase) * 0.2;
            const r = (3 + f.value) * pulse;

            // Glow
            ctx.beginPath();
            ctx.arc(f.x, f.y, r * 2.5, 0, Math.PI * 2);
            ctx.fillStyle = f.color + '22';
            ctx.fill();

            // Core
            ctx.beginPath();
            ctx.arc(f.x, f.y, r, 0, Math.PI * 2);
            ctx.fillStyle = f.color;
            ctx.fill();

            // Bright center
            ctx.beginPath();
            ctx.arc(f.x, f.y, r * 0.4, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.fill();
        }
    }

    _drawSnake(ctx, snake, vpL, vpR, vpT, vpB) {
        const segs = snake.segments;
        if (segs.length === 0) return;

        // Determine visible range
        let anyVisible = false;
        const head = segs[0];
        if (head.x >= vpL - 100 && head.x <= vpR + 100 && head.y >= vpT - 100 && head.y <= vpB + 100) {
            anyVisible = true;
        }
        const tail = segs[segs.length - 1];
        if (tail.x >= vpL - 100 && tail.x <= vpR + 100 && tail.y >= vpT - 100 && tail.y <= vpB + 100) {
            anyVisible = true;
        }
        // Check midpoint
        if (!anyVisible && segs.length > 2) {
            const mid = segs[Math.floor(segs.length / 2)];
            if (mid.x >= vpL - 100 && mid.x <= vpR + 100 && mid.y >= vpT - 100 && mid.y <= vpB + 100) {
                anyVisible = true;
            }
        }
        if (!anyVisible) return;

        const r = snake.radius;

        // Boost glow
        if (snake.isBoosting) {
            ctx.save();
            ctx.shadowColor = snake.glowColor;
            ctx.shadowBlur = 20;
        }

        // Body segments (back to front)
        for (let i = segs.length - 1; i >= 1; i--) {
            const seg = segs[i];
            if (seg.x < vpL - r || seg.x > vpR + r || seg.y < vpT - r || seg.y > vpB + r) continue;

            const isStripe = (i % 4 < 2);
            ctx.beginPath();
            ctx.arc(seg.x, seg.y, r, 0, Math.PI * 2);
            ctx.fillStyle = isStripe ? snake.color : snake.stripeColor;
            ctx.fill();
        }

        if (snake.isBoosting) {
            ctx.restore();
        }

        // Head
        ctx.beginPath();
        ctx.arc(head.x, head.y, r * 1.1, 0, Math.PI * 2);
        ctx.fillStyle = snake.color;
        ctx.fill();

        // Eyes
        const eyeOffset = r * 0.5;
        const eyeR = r * 0.35;
        const pupilR = r * 0.18;
        const cosA = Math.cos(snake.angle);
        const sinA = Math.sin(snake.angle);
        const perpX = -sinA;
        const perpY = cosA;

        for (let side = -1; side <= 1; side += 2) {
            const ex = head.x + cosA * r * 0.4 + perpX * eyeOffset * side;
            const ey = head.y + sinA * r * 0.4 + perpY * eyeOffset * side;

            // White
            ctx.beginPath();
            ctx.arc(ex, ey, eyeR, 0, Math.PI * 2);
            ctx.fillStyle = '#fff';
            ctx.fill();

            // Pupil
            ctx.beginPath();
            ctx.arc(ex + cosA * pupilR * 0.5, ey + sinA * pupilR * 0.5, pupilR, 0, Math.PI * 2);
            ctx.fillStyle = '#111';
            ctx.fill();
        }

        // Name tag
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(snake.name, head.x, head.y - r - 10);

        // Boost trail
        if (snake.boostTrail.length > 0) {
            for (const p of snake.boostTrail) {
                const alpha = p.life / 0.5;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
                ctx.fillStyle = snake.glowColor.slice(0, 7) + Math.floor(alpha * 100).toString(16).padStart(2, '0');
                ctx.fill();
            }
        }
    }

    _drawParticles(ctx, particles) {
        for (const p of particles) {
            const alpha = p.life;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = alpha;
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    _drawMinimap(game) {
        const mc = this.mctx;
        const size = this.minimap.width;
        const scale = size / (game.worldRadius * 2);

        mc.clearRect(0, 0, size, size);

        // Background
        mc.fillStyle = 'rgba(10,10,26,0.8)';
        mc.fillRect(0, 0, size, size);

        // Boundary circle
        mc.beginPath();
        mc.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
        mc.strokeStyle = 'rgba(255,50,50,0.5)';
        mc.lineWidth = 1;
        mc.stroke();

        // Snakes as dots
        for (let i = 0; i < game.snakes.length; i++) {
            const s = game.snakes[i];
            if (!s.alive) continue;
            const head = s.segments[0];
            const mx = size / 2 + head.x * scale;
            const my = size / 2 + head.y * scale;
            const dotSize = i === game.playerIndex ? 4 : 2;

            mc.beginPath();
            mc.arc(mx, my, dotSize, 0, Math.PI * 2);
            mc.fillStyle = i === game.playerIndex ? '#fff' : s.color;
            mc.fill();
        }

        // Camera viewport indicator
        const player = game.getPlayer();
        if (player && player.alive) {
            const head = player.segments[0];
            const px = size / 2 + head.x * scale;
            const py = size / 2 + head.y * scale;
            mc.strokeStyle = 'rgba(255,255,255,0.3)';
            mc.lineWidth = 1;
            const vw = (this.width / game.camera.zoom) * scale;
            const vh = (this.height / game.camera.zoom) * scale;
            mc.strokeRect(px - vw / 2, py - vh / 2, vw, vh);
        }
    }
}
