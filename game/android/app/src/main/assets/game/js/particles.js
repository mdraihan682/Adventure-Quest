const ParticleSystem = {
    particles: [],
    maxParticles: CONFIG.particles.maxParticles,

    init() {
        this.particles = [];
    },

    add(particle) {
        if (this.particles.length >= this.maxParticles) {
            this.particles.shift();
        }
        this.particles.push({
            x: particle.x || 0,
            y: particle.y || 0,
            vx: particle.vx || 0,
            vy: particle.vy || 0,
            radius: particle.radius || 3,
            color: particle.color || '#ffffff',
            alpha: particle.alpha !== undefined ? particle.alpha : 1,
            decay: particle.decay || 0.02,
            gravity: particle.gravity || 0,
            life: particle.life || 1,
            maxLife: particle.life || 1,
            type: particle.type || 'circle'
        });
    },

    addMultiple(count, baseParticle, variation = {}) {
        for (let i = 0; i < count; i++) {
            const particle = {
                x: baseParticle.x + (variation.x || 0) * (Math.random() - 0.5) * 2,
                y: baseParticle.y + (variation.y || 0) * (Math.random() - 0.5) * 2,
                vx: baseParticle.vx + (variation.vx || 0) * (Math.random() - 0.5) * 2,
                vy: baseParticle.vy + (variation.vy || 0) * (Math.random() - 0.5) * 2,
                radius: baseParticle.radius + (variation.radius || 0) * (Math.random() - 0.5) * 2,
                color: baseParticle.color,
                alpha: baseParticle.alpha,
                decay: baseParticle.decay,
                gravity: baseParticle.gravity,
                life: baseParticle.life,
                type: baseParticle.type
            };
            this.add(particle);
        }
    },

    jump(x, y, facingRight, color = '#88aaff') {
        const count = CONFIG.particles.jumpCount;
        for (let i = 0; i < count; i++) {
            const angle = facingRight ? Utils.random(-Math.PI * 0.7, -Math.PI * 0.3) : Utils.random(Math.PI * 0.3, Math.PI * 0.7);
            const speed = Utils.random(1, 3);
            this.add({
                x: x + (facingRight ? -10 : 10),
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: Utils.random(2, 5),
                color,
                alpha: 0.8,
                decay: 0.03,
                gravity: 0.1,
                life: 0.6
            });
        }
    },

    land(x, y, color = '#88aaff') {
        const count = CONFIG.particles.landCount;
        for (let i = 0; i < count; i++) {
            const angle = Utils.random(0, Math.PI * 2);
            const speed = Utils.random(2, 5);
            this.add({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed * -0.5,
                radius: Utils.random(3, 6),
                color,
                alpha: 0.9,
                decay: 0.025,
                gravity: 0.2,
                life: 0.8
            });
        }
    },

    attack(x, y, facingRight, color = '#ffaa44') {
        const count = CONFIG.particles.attackCount;
        const spread = facingRight ? 0 : Math.PI;
        for (let i = 0; i < count; i++) {
            const angle = spread + Utils.random(-Math.PI * 0.4, Math.PI * 0.4);
            const speed = Utils.random(3, 6);
            this.add({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: Utils.random(3, 7),
                color,
                alpha: 0.9,
                decay: 0.04,
                gravity: 0,
                life: 0.4,
                type: 'slash'
            });
        }
    },

    hit(x, y, color = '#ff4444') {
        const count = CONFIG.particles.hitCount;
        for (let i = 0; i < count; i++) {
            const angle = Utils.random(0, Math.PI * 2);
            const speed = Utils.random(2, 5);
            this.add({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: Utils.random(2, 5),
                color,
                alpha: 1,
                decay: 0.035,
                gravity: 0.1,
                life: 0.5
            });
        }
    },

    enemyDeath(x, y, enemyType, color = '#ff6644') {
        const count = CONFIG.particles.deathCount;
        for (let i = 0; i < count; i++) {
            const angle = Utils.random(0, Math.PI * 2);
            const speed = Utils.random(1, 4);
            this.add({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                radius: Utils.random(4, 8),
                color,
                alpha: 0.9,
                decay: 0.02,
                gravity: 0.15,
                life: 1.2
            });
        }
    },

    coin(x, y, color = '#ffdd44') {
        const count = CONFIG.particles.coinCount;
        for (let i = 0; i < count; i++) {
            const angle = Utils.random(-Math.PI * 0.8, -Math.PI * 0.2);
            const speed = Utils.random(2, 4);
            this.add({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: Utils.random(3, 6),
                color,
                alpha: 1,
                decay: 0.025,
                gravity: -0.1,
                life: 0.8,
                type: 'star'
            });
        }
    },

    bossAttack(x, y, color = '#ff3333') {
        const count = CONFIG.particles.bossCount;
        for (let i = 0; i < count; i++) {
            const angle = Utils.random(0, Math.PI * 2);
            const speed = Utils.random(3, 7);
            this.add({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: Utils.random(4, 10),
                color,
                alpha: 0.8,
                decay: 0.015,
                gravity: 0.1,
                life: 1.5
            });
        }
    },

    victory(x, y) {
        const colors = ['#ffdd44', '#ff8844', '#ff4488', '#44ff88', '#8844ff'];
        const count = CONFIG.particles.victoryCount;
        for (let i = 0; i < count; i++) {
            const angle = Utils.random(0, Math.PI * 2);
            const speed = Utils.random(2, 6);
            this.add({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 3,
                radius: Utils.random(5, 12),
                color: Utils.randomChoice(colors),
                alpha: 1,
                decay: 0.01,
                gravity: 0.1,
                life: 2.5,
                type: 'star'
            });
        }
    },

    checkpoint(x, y, color = '#44ff88') {
        for (let i = 0; i < 15; i++) {
            const angle = (i / 15) * Math.PI * 2;
            const speed = Utils.random(1, 3);
            this.add({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1,
                radius: Utils.random(3, 7),
                color,
                alpha: 0.9,
                decay: 0.015,
                gravity: -0.05,
                life: 1.5,
                type: 'ring'
            });
        }
    },

    dash(x, y, facingRight, color = '#88aaff') {
        for (let i = 0; i < 8; i++) {
            this.add({
                x: x + (facingRight ? -i * 5 : i * 5),
                y: y + Utils.random(-5, 5),
                vx: facingRight ? Utils.random(1, 2) : Utils.random(-2, -1),
                vy: Utils.random(-1, 1),
                radius: Utils.random(2, 5),
                color,
                alpha: 0.6,
                decay: 0.05,
                gravity: 0,
                life: 0.3
            });
        }
    },

    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += p.gravity * dt;
            p.life -= dt * 0.016;
            p.alpha = Math.max(0, p.alpha - p.decay);

            if (p.life <= 0 || p.alpha <= 0 || p.radius <= 0.5) {
                this.particles.splice(i, 1);
            }
        }
    },

    render(ctx, camera) {
        ctx.save();
        this.particles.forEach(p => {
            const screenX = p.x - camera.x;
            const screenY = p.y - camera.y;

            if (screenX < -20 || screenX > ctx.canvas.width + 20 ||
                screenY < -20 || screenY > ctx.canvas.height + 20) {
                return;
            }

            ctx.globalAlpha = p.alpha;

            switch (p.type) {
                case 'star':
                    this.drawStar(ctx, screenX, screenY, p.radius, p.color);
                    break;
                case 'slash':
                    this.drawSlash(ctx, screenX, screenY, p.radius, p.color);
                    break;
                case 'ring':
                    this.drawRing(ctx, screenX, screenY, p.radius, p.color);
                    break;
                default:
                    ctx.fillStyle = p.color;
                    ctx.beginPath();
                    ctx.arc(screenX, screenY, p.radius, 0, Math.PI * 2);
                    ctx.fill();
            }
        });
        ctx.restore();
    },

    drawStar(ctx, x, y, radius, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
            const angle2 = angle + Math.PI / 5;
            const px2 = x + Math.cos(angle2) * radius * 0.4;
            const py2 = y + Math.sin(angle2) * radius * 0.4;
            ctx.lineTo(px2, py2);
        }
        ctx.closePath();
        ctx.fill();
    },

    drawSlash(ctx, x, y, radius, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x - radius, y - radius);
        ctx.lineTo(x + radius, y + radius);
        ctx.lineTo(x + radius * 0.5, y + radius * 1.5);
        ctx.lineTo(x - radius * 0.5, y - radius * 0.5);
        ctx.closePath();
        ctx.fill();
    },

    drawRing(ctx, x, y, radius, color) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();
    },

    clear() {
        this.particles = [];
    },

    getCount() {
        return this.particles.length;
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ParticleSystem;
}