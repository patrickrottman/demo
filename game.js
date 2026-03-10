// ============================================================
// game.js - All game logic, AI, physics, input, state
// ============================================================

const WORLD_RADIUS = 5000;
const FOOD_COUNT = 600;
const BOT_COUNT = 12;
const SEGMENT_SPACING = 4;
const BASE_SPEED = 200;
const BOOST_SPEED = 400;
const TURN_RATE = 4;
const MIN_BOOST_SEGMENTS = 10;
const FOOD_EAT_RADIUS = 18;
const COLLISION_RADIUS_FACTOR = 0.85;
const SPATIAL_CELL_SIZE = 200;
const BOT_THINK_INTERVAL = 0.5;
const BOT_DETECTION_RADIUS = 300;

const COLOR_PALETTES = [
    { name: 'Neon Green',    body: '#39ff14', stripe: '#2bcc0f', glow: '#39ff1466' },
    { name: 'Hot Pink',      body: '#ff1493', stripe: '#cc1077', glow: '#ff149366' },
    { name: 'Electric Blue', body: '#00bfff', stripe: '#009acc', glow: '#00bfff66' },
    { name: 'Orange',        body: '#ff6600', stripe: '#cc5200', glow: '#ff660066' },
    { name: 'Red',           body: '#ff2222', stripe: '#cc1b1b', glow: '#ff222266' },
    { name: 'Purple',        body: '#aa44ff', stripe: '#8833cc', glow: '#aa44ff66' },
    { name: 'Ice White',     body: '#e0f0ff', stripe: '#b0d0ee', glow: '#e0f0ff66' },
    { name: 'Gold',          body: '#ffd700', stripe: '#ccac00', glow: '#ffd70066' },
    { name: 'Cyan',          body: '#00ffcc', stripe: '#00cca3', glow: '#00ffcc66' },
    { name: 'Magenta',       body: '#ff00ff', stripe: '#cc00cc', glow: '#ff00ff66' },
];

const BOT_NAMES = [
    'Slyther', 'Noodle', 'Viper', 'Cobra', 'Mamba',
    'Pythona', 'Sidewinder', 'Basilisk', 'Hydra', 'Rattler',
    'Serpentina', 'Fangs', 'Scaly', 'Slippy', 'Wiggler',
    'Coiler', 'Striker', 'Hissy', 'Twisty', 'Zag'
];

// ---- Spatial Hash Grid ----
class SpatialHash {
    constructor(cellSize) {
        this.cellSize = cellSize;
        this.grid = new Map();
    }

    clear() {
        this.grid.clear();
    }

    _key(x, y) {
        const cx = Math.floor(x / this.cellSize);
        const cy = Math.floor(y / this.cellSize);
        return `${cx},${cy}`;
    }

    insert(obj, x, y) {
        const key = this._key(x, y);
        if (!this.grid.has(key)) this.grid.set(key, []);
        this.grid.get(key).push(obj);
    }

    query(x, y, radius) {
        const results = [];
        const minCx = Math.floor((x - radius) / this.cellSize);
        const maxCx = Math.floor((x + radius) / this.cellSize);
        const minCy = Math.floor((y - radius) / this.cellSize);
        const maxCy = Math.floor((y + radius) / this.cellSize);
        for (let cx = minCx; cx <= maxCx; cx++) {
            for (let cy = minCy; cy <= maxCy; cy++) {
                const cell = this.grid.get(`${cx},${cy}`);
                if (cell) {
                    for (let i = 0; i < cell.length; i++) results.push(cell[i]);
                }
            }
        }
        return results;
    }
}

// ---- Object Pool ----
class FoodPool {
    constructor() {
        this.items = [];
        this.free = [];
    }

    acquire(x, y, value, color) {
        let food;
        if (this.free.length > 0) {
            food = this.free.pop();
            food.x = x; food.y = y; food.value = value; food.color = color;
            food.active = true;
            food.pulsePhase = Math.random() * Math.PI * 2;
        } else {
            food = { x, y, value, color, active: true, pulsePhase: Math.random() * Math.PI * 2 };
            this.items.push(food);
        }
        return food;
    }

    release(food) {
        food.active = false;
        this.free.push(food);
    }
}

// ---- Snake Factory ----
function createSnake(x, y, angle, name, colorIndex, initialLength) {
    const segments = [];
    for (let i = 0; i < initialLength; i++) {
        segments.push({
            x: x - Math.cos(angle) * SEGMENT_SPACING * i,
            y: y - Math.sin(angle) * SEGMENT_SPACING * i
        });
    }
    const palette = COLOR_PALETTES[colorIndex % COLOR_PALETTES.length];
    return {
        segments,
        angle,
        targetAngle: angle,
        speed: BASE_SPEED,
        radius: 8,
        targetLength: initialLength,
        isBoosting: false,
        score: 0,
        name,
        colorIndex,
        color: palette.body,
        stripeColor: palette.stripe,
        glowColor: palette.glow,
        alive: true,
        boostTrail: [],
        // Bot fields
        isBot: false,
        botState: 'WANDER',
        botThinkTimer: 0,
        botTarget: null,
        respawnTimer: 0,
    };
}

function randomWorldPos(margin) {
    const r = margin || WORLD_RADIUS;
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * r * 0.85;
    return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist };
}

function randomFoodColor() {
    const colors = ['#ff4444', '#44ff44', '#4488ff', '#ffff44', '#ff44ff', '#44ffff', '#ff8844', '#88ff44'];
    return colors[Math.floor(Math.random() * colors.length)];
}

// ---- Main Game ----
class Game {
    constructor() {
        this.worldRadius = WORLD_RADIUS;
        this.snakes = [];
        this.foodPool = new FoodPool();
        this.spatialHash = new SpatialHash(SPATIAL_CELL_SIZE);
        this.camera = { x: 0, y: 0, zoom: 1, targetZoom: 1 };
        this.score = 0;
        this.gameState = 'menu'; // menu, playing, dead
        this.playerIndex = -1;
        this.time = 0;
        this.particles = [];
        this.leaderboard = [];

        // Input state
        this.mouseX = 0;
        this.mouseY = 0;
        this.mouseDown = false;
        this.boostPressed = false;
        this.joystick = { active: false, startX: 0, startY: 0, dx: 0, dy: 0 };
        this.isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        this._initFood();
        this._initBots();
    }

    _initFood() {
        for (let i = 0; i < FOOD_COUNT; i++) {
            const pos = randomWorldPos();
            this.foodPool.acquire(pos.x, pos.y, 1, randomFoodColor());
        }
    }

    _initBots() {
        for (let i = 0; i < BOT_COUNT; i++) {
            this._spawnBot(i, true);
        }
    }

    _spawnBot(index, preGrown) {
        const pos = randomWorldPos(WORLD_RADIUS * 0.8);
        const angle = Math.random() * Math.PI * 2;
        const nameIdx = index % BOT_NAMES.length;
        const colorIdx = (index * 3 + 1) % COLOR_PALETTES.length;
        const initLen = preGrown ? 20 + Math.floor(Math.random() * 40) : 10;
        const snake = createSnake(pos.x, pos.y, angle, BOT_NAMES[nameIdx], colorIdx, initLen);
        snake.isBot = true;
        snake.score = (initLen - 10) * 5;
        snake.botThinkTimer = Math.random() * BOT_THINK_INTERVAL;
        if (index < this.snakes.length) {
            this.snakes[index] = snake;
        } else {
            this.snakes.push(snake);
        }
    }

    startGame(playerName, colorIndex) {
        const pos = randomWorldPos(WORLD_RADIUS * 0.5);
        const angle = Math.random() * Math.PI * 2;
        const player = createSnake(pos.x, pos.y, angle, playerName || 'Player', colorIndex, 10);
        player.isBot = false;

        // Put player at end
        this.playerIndex = this.snakes.length;
        this.snakes.push(player);
        this.score = 0;
        this.gameState = 'playing';
    }

    getPlayer() {
        if (this.playerIndex >= 0 && this.playerIndex < this.snakes.length) {
            return this.snakes[this.playerIndex];
        }
        return null;
    }

    update(dt) {
        if (this.gameState !== 'playing' && this.gameState !== 'background') return;
        this.time += dt;

        // Rebuild spatial hash
        this._rebuildSpatialHash();

        // Update all snakes
        for (let i = 0; i < this.snakes.length; i++) {
            const snake = this.snakes[i];
            if (!snake.alive) {
                if (snake.isBot) {
                    snake.respawnTimer -= dt;
                    if (snake.respawnTimer <= 0) {
                        this._spawnBot(i, false);
                    }
                }
                continue;
            }

            // Bot AI
            if (snake.isBot) {
                this._updateBotAI(snake, dt);
            }

            // Steering
            let angleDiff = snake.targetAngle - snake.angle;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            const maxTurn = TURN_RATE * dt;
            snake.angle += Math.max(-maxTurn, Math.min(maxTurn, angleDiff));

            // Speed
            snake.speed = snake.isBoosting ? BOOST_SPEED : BASE_SPEED;

            // Move head
            const head = snake.segments[0];
            head.x += Math.cos(snake.angle) * snake.speed * dt;
            head.y += Math.sin(snake.angle) * snake.speed * dt;

            // Body follow
            for (let j = 1; j < snake.segments.length; j++) {
                const prev = snake.segments[j - 1];
                const seg = snake.segments[j];
                const dx = seg.x - prev.x;
                const dy = seg.y - prev.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > SEGMENT_SPACING) {
                    const ratio = SEGMENT_SPACING / dist;
                    seg.x = prev.x + dx * ratio;
                    seg.y = prev.y + dy * ratio;
                }
            }

            // Growth
            if (snake.segments.length < snake.targetLength) {
                const tail = snake.segments[snake.segments.length - 1];
                snake.segments.push({ x: tail.x, y: tail.y });
            }

            // Cap segments
            if (snake.segments.length > 2000) {
                const newSpacing = (snake.segments.length / 2000) * SEGMENT_SPACING;
                // Thin out segments
                const newSegs = [snake.segments[0]];
                let accum = 0;
                for (let j = 1; j < snake.segments.length; j++) {
                    const prev = snake.segments[j - 1];
                    const seg = snake.segments[j];
                    const dx = seg.x - prev.x;
                    const dy = seg.y - prev.y;
                    accum += Math.sqrt(dx * dx + dy * dy);
                    if (accum >= newSpacing) {
                        newSegs.push(seg);
                        accum = 0;
                    }
                }
                snake.segments = newSegs;
            }

            // Boost: shed tail
            if (snake.isBoosting && snake.segments.length > MIN_BOOST_SEGMENTS) {
                if (Math.random() < 8 * dt) {
                    const tail = snake.segments.pop();
                    snake.targetLength = Math.max(MIN_BOOST_SEGMENTS, snake.targetLength - 1);
                    this.foodPool.acquire(tail.x, tail.y, 2, snake.color);
                    // Boost trail particle
                    snake.boostTrail.push({ x: tail.x, y: tail.y, life: 0.5 });
                }
            }

            // Update boost trail
            for (let j = snake.boostTrail.length - 1; j >= 0; j--) {
                snake.boostTrail[j].life -= dt;
                if (snake.boostTrail[j].life <= 0) snake.boostTrail.splice(j, 1);
            }

            // Update radius based on length
            snake.radius = 6 + Math.min(snake.segments.length * 0.05, 14);

            // Eat food
            this._checkFoodCollision(snake);

            // World boundary
            const headDist = Math.sqrt(head.x * head.x + head.y * head.y);
            if (headDist > this.worldRadius) {
                this._killSnake(i);
                continue;
            }

            // Snake-snake collision
            this._checkSnakeCollision(i);
        }

        // Maintain food count
        this._maintainFood();

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].life -= dt;
            this.particles[i].x += this.particles[i].vx * dt;
            this.particles[i].y += this.particles[i].vy * dt;
            if (this.particles[i].life <= 0) this.particles.splice(i, 1);
        }

        // Camera
        const player = this.getPlayer();
        if (player && player.alive) {
            const head = player.segments[0];
            this.camera.x += (head.x - this.camera.x) * 4 * dt;
            this.camera.y += (head.y - this.camera.y) * 4 * dt;
            this.camera.targetZoom = player.isBoosting ? 0.85 : 1;
            this.camera.zoom += (this.camera.targetZoom - this.camera.zoom) * 2 * dt;
            this.score = player.score;
        }

        // Leaderboard
        this._updateLeaderboard();
    }

    _rebuildSpatialHash() {
        this.spatialHash.clear();
        for (let i = 0; i < this.snakes.length; i++) {
            const snake = this.snakes[i];
            if (!snake.alive) continue;
            // Insert each segment
            for (let j = 0; j < snake.segments.length; j++) {
                this.spatialHash.insert(
                    { snakeIndex: i, segIndex: j },
                    snake.segments[j].x,
                    snake.segments[j].y
                );
            }
        }
    }

    _checkFoodCollision(snake) {
        const head = snake.segments[0];
        const items = this.foodPool.items;
        const eatR = FOOD_EAT_RADIUS + snake.radius;
        const eatR2 = eatR * eatR;
        for (let i = 0; i < items.length; i++) {
            const food = items[i];
            if (!food.active) continue;
            const dx = food.x - head.x;
            const dy = food.y - head.y;
            if (dx * dx + dy * dy < eatR2) {
                snake.score += food.value;
                snake.targetLength += food.value;
                this.foodPool.release(food);
            }
        }
    }

    _checkSnakeCollision(si) {
        const snake = this.snakes[si];
        if (!snake.alive) return;
        const head = snake.segments[0];
        const queryR = snake.radius + 20;

        const nearby = this.spatialHash.query(head.x, head.y, queryR);
        for (let i = 0; i < nearby.length; i++) {
            const entry = nearby[i];
            if (entry.snakeIndex === si) continue; // skip self
            if (entry.segIndex < 3) continue; // skip head area of others (grace)
            const other = this.snakes[entry.snakeIndex];
            if (!other.alive) continue;
            const seg = other.segments[entry.segIndex];
            const dx = head.x - seg.x;
            const dy = head.y - seg.y;
            const collisionDist = (snake.radius + other.radius) * COLLISION_RADIUS_FACTOR;
            if (dx * dx + dy * dy < collisionDist * collisionDist) {
                this._killSnake(si);
                // Give score to killer
                other.score += Math.floor(snake.score * 0.5);
                other.targetLength += Math.floor(snake.segments.length * 0.3);
                return;
            }
        }
    }

    _killSnake(index) {
        const snake = this.snakes[index];
        snake.alive = false;

        // Drop food along body
        for (let i = 0; i < snake.segments.length; i += 2) {
            const seg = snake.segments[i];
            const jitter = 10;
            this.foodPool.acquire(
                seg.x + (Math.random() - 0.5) * jitter,
                seg.y + (Math.random() - 0.5) * jitter,
                3, snake.color
            );
        }

        // Death particles
        for (let i = 0; i < 20; i++) {
            const head = snake.segments[0];
            this.particles.push({
                x: head.x,
                y: head.y,
                vx: (Math.random() - 0.5) * 300,
                vy: (Math.random() - 0.5) * 300,
                life: 0.5 + Math.random() * 0.5,
                color: snake.color,
                size: 3 + Math.random() * 5
            });
        }

        if (index === this.playerIndex) {
            this.gameState = 'dead';
        } else if (snake.isBot) {
            snake.respawnTimer = 1 + Math.random() * 2;
        }
    }

    _maintainFood() {
        let activeCount = 0;
        const items = this.foodPool.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].active) activeCount++;
        }
        while (activeCount < FOOD_COUNT) {
            const pos = randomWorldPos();
            this.foodPool.acquire(pos.x, pos.y, 1, randomFoodColor());
            activeCount++;
        }
    }

    _updateLeaderboard() {
        const entries = [];
        for (let i = 0; i < this.snakes.length; i++) {
            const s = this.snakes[i];
            if (s.alive) {
                entries.push({ name: s.name, score: s.score, color: s.color, isPlayer: i === this.playerIndex });
            }
        }
        entries.sort((a, b) => b.score - a.score);
        this.leaderboard = entries.slice(0, 5);
    }

    // ---- Bot AI ----
    _updateBotAI(snake, dt) {
        snake.botThinkTimer -= dt;
        if (snake.botThinkTimer > 0) return;
        snake.botThinkTimer = BOT_THINK_INTERVAL + Math.random() * 0.2;

        const head = snake.segments[0];
        snake.isBoosting = false;

        // Check for threats (FLEE)
        let fleeTarget = null;
        let nearestFood = null;
        let nearestFoodDist = BOT_DETECTION_RADIUS;
        let huntTarget = null;

        for (let i = 0; i < this.snakes.length; i++) {
            const other = this.snakes[i];
            if (other === snake || !other.alive) continue;
            const dx = other.segments[0].x - head.x;
            const dy = other.segments[0].y - head.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < BOT_DETECTION_RADIUS) {
                if (other.segments.length > snake.segments.length * 1.3) {
                    // Flee from bigger snake
                    if (!fleeTarget || dist < Math.sqrt((fleeTarget.x - head.x) ** 2 + (fleeTarget.y - head.y) ** 2)) {
                        fleeTarget = other.segments[0];
                    }
                } else if (snake.segments.length > other.segments.length * 1.5 && dist < 200) {
                    huntTarget = other.segments[0];
                }
            }
        }

        // Find nearest food
        const items = this.foodPool.items;
        for (let i = 0; i < items.length; i++) {
            const food = items[i];
            if (!food.active) continue;
            const dx = food.x - head.x;
            const dy = food.y - head.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < nearestFoodDist) {
                nearestFoodDist = dist;
                nearestFood = food;
            }
        }

        // Priority: FLEE > SEEK_FOOD > HUNT > WANDER
        if (fleeTarget) {
            snake.botState = 'FLEE';
            snake.targetAngle = Math.atan2(head.y - fleeTarget.y, head.x - fleeTarget.x);
            if (Math.random() < 0.3 && snake.segments.length > MIN_BOOST_SEGMENTS + 10) {
                snake.isBoosting = true;
            }
        } else if (nearestFood) {
            snake.botState = 'SEEK_FOOD';
            snake.targetAngle = Math.atan2(nearestFood.y - head.y, nearestFood.x - head.x);
        } else if (huntTarget) {
            snake.botState = 'HUNT';
            // Aim ahead of target
            snake.targetAngle = Math.atan2(huntTarget.y - head.y, huntTarget.x - head.x);
            if (snake.segments.length > MIN_BOOST_SEGMENTS + 15) {
                snake.isBoosting = true;
            }
        } else {
            snake.botState = 'WANDER';
            // Bias toward center
            const toCenterAngle = Math.atan2(-head.y, -head.x);
            const distFromCenter = Math.sqrt(head.x * head.x + head.y * head.y);
            const centerBias = Math.min(distFromCenter / WORLD_RADIUS, 0.8);
            const randomAngle = Math.random() * Math.PI * 2;
            snake.targetAngle = randomAngle * (1 - centerBias) + toCenterAngle * centerBias;
        }

        // Boundary avoidance
        const headDist = Math.sqrt(head.x * head.x + head.y * head.y);
        if (headDist > WORLD_RADIUS * 0.85) {
            snake.targetAngle = Math.atan2(-head.y, -head.x);
        }
    }

    // ---- Input Handling ----
    handleMouseMove(canvasX, canvasY, canvasWidth, canvasHeight) {
        if (this.gameState !== 'playing') return;
        const player = this.getPlayer();
        if (!player || !player.alive) return;

        // Convert screen coords to world-relative angle
        const screenCenterX = canvasWidth / 2;
        const screenCenterY = canvasHeight / 2;
        const dx = canvasX - screenCenterX;
        const dy = canvasY - screenCenterY;
        player.targetAngle = Math.atan2(dy, dx);
    }

    handleBoost(active) {
        if (this.gameState !== 'playing') return;
        const player = this.getPlayer();
        if (!player || !player.alive) return;
        player.isBoosting = active && player.segments.length > MIN_BOOST_SEGMENTS;
    }

    handleJoystick(dx, dy) {
        if (this.gameState !== 'playing') return;
        const player = this.getPlayer();
        if (!player || !player.alive) return;
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
            player.targetAngle = Math.atan2(dy, dx);
        }
    }

    respawn(playerName, colorIndex) {
        // Remove old player
        if (this.playerIndex >= 0) {
            this.snakes.splice(this.playerIndex, 1);
            // Fix bot indices
            if (this.playerIndex < BOT_COUNT) {
                // Rare edge case, just re-index
            }
            this.playerIndex = -1;
        }
        this.startGame(playerName, colorIndex);
    }

    // Run bots in background when on menu
    updateBackground(dt) {
        const prevState = this.gameState;
        this.gameState = 'background';
        // Temporarily set player index to -1
        const pi = this.playerIndex;
        this.playerIndex = -1;
        this.update(dt);
        this.playerIndex = pi;
        this.gameState = prevState;
    }
}
