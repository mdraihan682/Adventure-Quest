class Boss {
    constructor(x, y, levelId) {
        this.levelId = levelId;
        const bossIndex = Math.floor((levelId - 1) / 10);

        this.x = x;
        this.y = y;
        this.width = 120;
        this.height = 140;

        this.maxHealth = CONFIG.boss.health[bossIndex] || 1000;
        this.health = this.maxHealth;
        this.damage = CONFIG.boss.damage[bossIndex] || 30;
        this.baseSpeed = 2;
        this.speed = this.baseSpeed;

        this.facingDirection = -1;
        this.state = 'intro';
        this.phase = 1;
        this.maxPhases = CONFIG.boss.phases;

        this.attackPatterns = [];
        this.currentPattern = 0;
        this.patternTimer = 0;
        this.patternCooldown = 0;

        this.velocityX = 0;
        this.velocityY = 0;
        this.grounded = false;

        this.invincible = true;
        this.invincibilityTimer = 0;
        this.hitFlashTimer = 0;

        this.dead = false;
        this.deathTimer = 0;
        this.deathPhase = 0;

        this.animTimer = 0;
        this.animFrame = 0;

        this.projectiles = [];
        this.minions = [];

        this.healthBarVisible = false;
        this.healthBarTimer = 0;

        this.setupPatterns(bossIndex);
        this.introTimer = 3000;
    }

    setupPatterns(bossIndex) {
        const patterns = [
            { name: 'charge', weight: 3, minPhase: 1 },
            { name: 'jump_slam', weight: 2, minPhase: 1 },
            { name: 'projectile_spread', weight: 2, minPhase: 2 },
            { name: 'projectile_aimed', weight: 3, minPhase: 1 },
            { name: 'summon_minions', weight: 1, minPhase: 2 },
            { name: 'area_denial', weight: 1, minPhase: 3 },
            { name: 'dash_combo', weight: 2, minPhase: 2 },
            { name: 'enrage', weight: 1, minPhase: 3 }
        ];

        this.attackPatterns = patterns.filter(p => p.minPhase <= this.maxPhases);
        this.totalWeight = this.attackPatterns.reduce((sum, p) => sum + p.weight, 0);
    }

    update(dt, player, level) {
        if (this.dead) {
            this.updateDeath(dt);
            return;
        }

        if (this.state === 'intro') {
            this.updateIntro(dt);
            return;
        }

        this.updateTimers(dt);
        this.updatePhysics(dt, level);
        this.updateAI(dt, player, level);
        this.updateAnimation(dt);
        this.updateProjectiles(dt, level);
        this.updateMinions(dt, player, level);
        this.checkPhaseTransition();
    }

    updateIntro(dt) {
        this.introTimer -= dt;
        this.y -= 2;

        if (this.introTimer <= 0) {
            this.state = 'idle';
            this.invincible = false;
            this.healthBarVisible = true;
            AudioSystem.playMusic('boss', true);
        }
    }

    updateTimers(dt) {
        if (this.patternTimer > 0) this.patternTimer -= dt;
        if (this.patternCooldown > 0) this.patternCooldown -= dt;
        if (this.invincibilityTimer > 0) this.invincibilityTimer -= dt;
        if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;
        if (this.healthBarTimer > 0) this.healthBarTimer -= dt;
    }

    updatePhysics(dt, level) {
        Physics.applyGravity(this, dt);
        Physics.updatePosition(this, dt);
        Physics.checkHorizontalCollisions(this, level.platforms);
        Physics.checkPlatformCollision(this, level.platforms);
    }

    updateAI(dt, player, level) {
        const dx = player.x - this.x;
        const distance = Math.abs(dx);

        this.facingDirection = dx > 0 ? 1 : -1;

        switch (this.state) {
            case 'idle':
                if (this.patternCooldown <= 0) {
                    this.selectPattern();
                }
                break;

            case 'charge':
                this.aiCharge(dt, player);
                break;

            case 'jump_slam':
                this.aiJumpSlam(dt, player);
                break;

            case 'projectile_spread':
                this.aiProjectileSpread(dt, player);
                break;

            case 'projectile_aimed':
                this.aiProjectileAimed(dt, player);
                break;

            case 'summon_minions':
                this.aiSummonMinions(dt);
                break;

            case 'area_denial':
                this.aiAreaDenial(dt, player);
                break;

            case 'dash_combo':
                this.aiDashCombo(dt, player);
                break;

            case 'enrage':
                this.aiEnrage(dt);
                break;
        }
    }

    selectPattern() {
        const availablePatterns = this.attackPatterns.filter(p => p.minPhase <= this.phase);
        if (availablePatterns.length === 0) return;

        let roll = Math.random() * availablePatterns.reduce((sum, p) => sum + p.weight, 0);
        for (const pattern of availablePatterns) {
            roll -= pattern.weight;
            if (roll <= 0) {
                this.startPattern(pattern.name);
                break;
            }
        }
    }

    startPattern(patternName) {
        this.state = patternName;
        this.patternTimer = this.getPatternDuration(patternName);
        this.patternCooldown = this.getPatternCooldown(patternName);
        this.currentPattern = patternName;

        switch (patternName) {
            case 'charge':
                this.velocityX = this.facingDirection * this.speed * 3;
                break;
            case 'jump_slam':
                if (this.grounded) {
                    this.velocityY = -18;
                }
                break;
            case 'summon_minions':
                this.summonMinions();
                break;
        }
    }

    getPatternDuration(name) {
        const durations = {
            charge: 2000,
            jump_slam: 3000,
            projectile_spread: 1500,
            projectile_aimed: 2000,
            summon_minions: 1000,
            area_denial: 3000,
            dash_combo: 2500,
            enrage: 5000
        };
        return durations[name] || 2000;
    }

    getPatternCooldown(name) {
        const cooldowns = {
            charge: 3000,
            jump_slam: 4000,
            projectile_spread: 3000,
            projectile_aimed: 2500,
            summon_minions: 8000,
            area_denial: 5000,
            dash_combo: 4000,
            enrage: 10000
        };
        return cooldowns[name] || 3000;
    }

    aiCharge(dt, player) {
        this.velocityX = this.facingDirection * this.speed * 3;

        if (this.patternTimer <= 0) {
            this.velocityX = 0;
            this.state = 'idle';
        }
    }

    aiJumpSlam(dt, player) {
        if (this.grounded && this.velocityY >= 0) {
            this.velocityY = 0;
            this.createShockwave();
            this.state = 'idle';
            Camera.shake(15);
            AudioSystem.play('bossHit');
        }
    }

    aiProjectileSpread(dt, player) {
        if (this.patternTimer <= this.getPatternDuration('projectile_spread') - 500) {
            this.shootSpreadProjectiles(player);
            this.patternTimer = 0;
        }
    }

    aiProjectileAimed(dt, player) {
        if (this.patternTimer <= this.getPatternDuration('projectile_aimed') - 300) {
            this.shootAimedProjectile(player);
            this.patternTimer = 0;
        }
    }

    aiSummonMinions(dt) {
        if (this.patternTimer <= 0) {
            this.state = 'idle';
        }
    }

    aiAreaDenial(dt, player) {
        if (this.patternTimer <= this.getPatternDuration('area_denial') - 1000) {
            this.createDangerZones(player);
            this.patternTimer = 0;
        }
    }

    aiDashCombo(dt, player) {
        const dashSpeed = this.speed * 5;
        this.velocityX = this.facingDirection * dashSpeed;

        if (this.patternTimer <= this.getPatternDuration('dash_combo') - 1000) {
            this.facingDirection *= -1;
        }

        if (this.patternTimer <= 0) {
            this.velocityX = 0;
            this.state = 'idle';
        }
    }

    aiEnrage(dt) {
        this.speed = this.baseSpeed * 2;
        this.damage = Math.floor(this.damage * 1.5);

        if (this.patternTimer <= 0) {
            this.speed = this.baseSpeed;
            this.damage = CONFIG.boss.damage[Math.floor((this.levelId - 1) / 10)] || 30;
            this.state = 'idle';
        }
    }

    checkPhaseTransition() {
        const healthPercent = this.health / this.maxHealth;
        const newPhase = Math.ceil((1 - healthPercent) * this.maxPhases) + 1;

        if (newPhase > this.phase && newPhase <= this.maxPhases) {
            this.phase = newPhase;
            this.onPhaseChange();
        }
    }

    onPhaseChange() {
        this.invincible = true;
        this.invincibilityTimer = 2000;
        this.healthBarTimer = 3000;
        Camera.shake(20);
        AudioSystem.play('bossHit');

        this.summonMinions(2);

        if (this.phase === this.maxPhases) {
            this.speed *= 1.3;
            this.damage = Math.floor(this.damage * 1.2);
        }
    }

    createShockwave() {
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            this.projectiles.push({
                x: this.x + this.width / 2,
                y: this.y + this.height - 10,
                vx: Math.cos(angle) * 6,
                vy: Math.sin(angle) * 2 - 4,
                width: 20,
                height: 20,
                damage: this.damage,
                lifetime: 1500,
                type: 'shockwave',
                rotation: 0
            });
        }
        ParticleSystem.bossAttack(this.x + this.width / 2, this.y + this.height / 2);
    }

    shootSpreadProjectiles(player) {
        const count = 8 + this.phase * 2;
        const startAngle = Math.atan2(
            player.y - this.y,
            player.x - this.x
        ) - Math.PI / 3;

        for (let i = 0; i < count; i++) {
            const angle = startAngle + (i / (count - 1)) * (Math.PI * 2 / 3);
            this.projectiles.push({
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
                vx: Math.cos(angle) * 5,
                vy: Math.sin(angle) * 5,
                width: 16,
                height: 16,
                damage: this.damage,
                lifetime: 3000,
                type: 'boss_projectile'
            });
        }
        AudioSystem.play('bossHit');
    }

    shootAimedProjectile(player) {
        const count = 3 + this.phase;
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                if (this.dead) return;
                const angle = Math.atan2(
                    (player.y + player.height / 2) - (this.y + this.height / 2),
                    (player.x + player.width / 2) - (this.x + this.width / 2)
                ) + Utils.random(-0.15, 0.15);

                this.projectiles.push({
                    x: this.x + this.width / 2,
                    y: this.y + this.height / 2,
                    vx: Math.cos(angle) * 7,
                    vy: Math.sin(angle) * 7,
                    width: 18,
                    height: 18,
                    damage: this.damage,
                    lifetime: 2500,
                    type: 'boss_projectile'
                });
            }, i * 200);
        }
        AudioSystem.play('bossHit');
    }

    summonMinions(count = 3) {
        const types = ['walker', 'chaser', 'flying'];
        for (let i = 0; i < count; i++) {
            const type = Utils.randomChoice(types);
            const minion = new Enemy(
                this.x + Utils.random(-100, 100),
                this.y - 50,
                type
            );
            minion.maxHealth = Math.floor(minion.maxHealth * 0.5);
            minion.health = minion.maxHealth;
            minion.damage = Math.floor(minion.damage * 0.7);
            minion.isMinion = true;
            this.minions.push(minion);
        }
    }

    createDangerZones(player) {
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                if (this.dead) return;
                const zoneX = player.x + Utils.random(-200, 200);
                this.projectiles.push({
                    x: zoneX,
                    y: -50,
                    vx: 0,
                    vy: 8,
                    width: 60,
                    height: 60,
                    damage: this.damage,
                    lifetime: 2000,
                    type: 'danger_zone',
                    warning: true,
                    warnTimer: 1000
                });
            }, i * 300);
        }
    }

    updateProjectiles(dt, level) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];

            if (proj.warning) {
                proj.warnTimer -= dt;
                if (proj.warnTimer <= 0) {
                    proj.warning = false;
                    proj.vy = 10;
                }
            } else {
                proj.x += proj.vx * dt;
                proj.y += proj.vy * dt;
            }

            proj.lifetime -= dt;
            if (proj.lifetime <= 0) {
                this.projectiles.splice(i, 1);
                continue;
            }

            if (proj.type !== 'danger_zone' && proj.type !== 'shockwave') {
                for (const platform of level.platforms) {
                    if (platform.solid && Collision.rectRect(proj, platform)) {
                        this.projectiles.splice(i, 1);
                        break;
                    }
                }
            }
        }
    }

    updateMinions(dt, player, level) {
        for (let i = this.minions.length - 1; i >= 0; i--) {
            const minion = this.minions[i];
            minion.update(dt, player, level);

            if (minion.dead && minion.deathTimer > 1000) {
                this.minions.splice(i, 1);
                continue;
            }

            if (!minion.dead && Collision.playerEnemy(player, minion)) {
                player.takeDamage(minion.damage, CONFIG.physics.knockbackForce);
            }
        }
    }

    updateAnimation(dt) {
        this.animTimer += dt;
        if (this.animTimer > 0.15) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 6;
        }
    }

    takeDamage(amount, knockback = 0, attacker = null) {
        if (this.invincible || this.dead) return false;

        this.health -= amount;
        this.hitFlashTimer = 150;
        this.healthBarTimer = 3000;
        this.healthBarVisible = true;

        AudioSystem.play('bossHit');
        ParticleSystem.bossAttack(this.x + this.width / 2, this.y + this.height / 2);
        Camera.shake(8);

        if (this.health <= 0) {
            this.die();
        }

        return true;
    }

    die() {
        this.dead = true;
        this.deathTimer = 0;
        this.velocityX = 0;
        this.velocityY = 0;
        this.state = 'death';
        AudioSystem.play('bossDeath');
        AudioSystem.stopMusic();
        Camera.shake(25);
        ParticleSystem.victory(this.x + this.width / 2, this.y + this.height / 2);

        SaveSystem.updateStatistics({ bossesDefeated: 1 });
        SaveSystem.updateAchievementProgress('bosses_defeated', 1);
    }

    updateDeath(dt) {
        this.deathTimer += dt;

        if (this.deathTimer > 2000 && this.deathPhase === 0) {
            this.deathPhase = 1;
            for (let i = 0; i < 20; i++) {
                ParticleSystem.add({
                    x: this.x + Utils.random(0, this.width),
                    y: this.y + Utils.random(0, this.height),
                    vx: Utils.random(-3, 3),
                    vy: Utils.random(-5, -1),
                    radius: Utils.random(8, 15),
                    color: Utils.randomChoice(['#ff4444', '#ff8844', '#ffdd44', '#ff0000']),
                    alpha: 1,
                    decay: 0.01,
                    gravity: 0.1,
                    life: 3,
                    type: 'star'
                });
            }
        }
    }

    getHealthPercent() {
        return this.health / this.maxHealth;
    }

    render(ctx, camera) {
        if (!camera.isVisible(this, 200)) return;

        const screenX = camera.getScreenX(this.x);
        const screenY = camera.getScreenY(this.y);

        if (this.hitFlashTimer > 0) {
            ctx.globalAlpha = 0.5;
        }

        if (this.dead) {
            ctx.globalAlpha = Math.max(0, 1 - this.deathTimer / 3000);
        }

        this.drawBody(ctx, screenX, screenY);
        this.drawProjectiles(ctx, camera);
        this.drawMinions(ctx, camera);

        if (this.healthBarVisible || this.healthBarTimer > 0) {
            this.drawHealthBar(ctx, camera);
        }

        ctx.globalAlpha = 1;
    }

    drawBody(ctx, x, y) {
        const colors = this.getPhaseColors();
        const w = this.width;
        const h = this.height;
        const frame = this.animFrame;

        ctx.save();
        ctx.translate(x + w / 2, y + h / 2);

        if (this.facingDirection === -1) {
            ctx.scale(-1, 1);
        }

        const legOffset = Math.sin(frame * Math.PI / 3) * 4;
        const bodyOffset = this.state === 'charge' ? -5 : 0;

        ctx.fillStyle = colors.secondary;
        ctx.fillRect(-w / 2 + 10, h / 2 - 20 + legOffset, 16, 20);
        ctx.fillRect(w / 2 - 26, h / 2 - 20 - legOffset, 16, 20);

        const bodyGradient = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
        bodyGradient.addColorStop(0, colors.primary);
        bodyGradient.addColorStop(0.5, colors.secondary);
        bodyGradient.addColorStop(1, colors.accent);
        ctx.fillStyle = bodyGradient;
        ctx.fillRect(-w / 2 + 5, -h / 2 + bodyOffset, w - 10, h - 30);

        ctx.fillStyle = colors.accent;
        ctx.fillRect(-w / 2 + 10, -h / 2 + 10 + bodyOffset, 15, 15);
        ctx.fillRect(w / 2 - 25, -h / 2 + 10 + bodyOffset, 15, 15);

        ctx.fillStyle = '#ff0000';
        const eyeX = this.facingDirection === 1 ? w / 2 - 20 : -w / 2 + 10;
        ctx.fillRect(eyeX, -h / 2 + 15 + bodyOffset, 12, 12);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(eyeX + 2, -h / 2 + 17 + bodyOffset, 4, 4);

        if (this.phase >= 3) {
            ctx.fillStyle = '#ffff00';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('★', 0, -h / 2 - 10 + bodyOffset);
        }

        if (this.state === 'charge') {
            ctx.fillStyle = 'rgba(255, 100, 0, 0.5)';
            ctx.fillRect(-w / 2 - 30 * this.facingDirection, -h / 2 + bodyOffset, 30, h - 30);
        }

        ctx.restore();
    }

    getPhaseColors() {
        const baseColors = [
            { primary: '#aa3333', secondary: '#882222', accent: '#ff6666' },
            { primary: '#aa6633', secondary: '#884422', accent: '#ffaa66' },
            { primary: '#8833aa', secondary: '#662288', accent: '#cc66ff' },
            { primary: '#3388aa', secondary: '#226688', accent: '#66ccff' },
            { primary: '#aa3388', secondary: '#882266', accent: '#ff66cc' }
        ];
        const index = Math.floor((this.levelId - 1) / 10) % baseColors.length;
        return baseColors[index];
    }

    drawProjectiles(ctx, camera) {
        this.projectiles.forEach(proj => {
            if (proj.warning) {
                const alpha = 0.3 + Math.sin(Date.now() * 0.01) * 0.2;
                ctx.globalAlpha = alpha;
                ctx.fillStyle = '#ff4444';
                ctx.fillRect(camera.getScreenX(proj.x), camera.getScreenY(proj.y), proj.width, proj.height);
                ctx.globalAlpha = 1;
                return;
            }

            const screenX = camera.getScreenX(proj.x);
            const screenY = camera.getScreenY(proj.y);

            const gradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, Math.max(proj.width, proj.height));
            gradient.addColorStop(0, '#ffaaaa');
            gradient.addColorStop(0.5, '#ff4444');
            gradient.addColorStop(1, '#aa0000');
            ctx.fillStyle = gradient;

            if (proj.type === 'shockwave') {
                ctx.beginPath();
                ctx.arc(screenX, screenY, proj.width / 2, 0, Math.PI * 2);
                ctx.fill();
            } else if (proj.type === 'danger_zone') {
                ctx.fillRect(screenX - proj.width / 2, screenY - proj.height / 2, proj.width, proj.height);
                ctx.strokeStyle = '#ffff00';
                ctx.lineWidth = 3;
                ctx.strokeRect(screenX - proj.width / 2, screenY - proj.height / 2, proj.width, proj.height);
            } else {
                ctx.beginPath();
                ctx.arc(screenX, screenY, Math.max(proj.width, proj.height) / 2, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }

    drawMinions(ctx, camera) {
        this.minions.forEach(minion => minion.render(ctx, camera));
    }

    drawHealthBar(ctx, camera) {
        const barWidth = 400;
        const barHeight = 24;
        const screenX = camera.getScreenX(this.x + this.width / 2 - barWidth / 2);
        const screenY = camera.getScreenY(this.y - 40);

        const container = document.querySelector('.boss-health-container');
        if (container) {
            container.style.display = 'block';
            container.classList.add('visible');
            const fill = container.querySelector('.boss-health-fill');
            const name = container.querySelector('.boss-name');
            if (fill) fill.style.width = (this.getHealthPercent() * 100) + '%';
            if (name) name.textContent = this.getBossName();
        }
    }

    getBossName() {
        const names = [
            'Forest Guardian',
            'Cave Titan',
            'Desert Warlord',
            'Frost Monarch',
            'Ruins Colossus',
            'Volcano Lord',
            'Factory Overseer',
            'Night City Warden',
            'Temple High Priest',
            'Final Sovereign'
        ];
        return names[Math.floor((this.levelId - 1) / 10)] || 'Boss';
    }
}

const BossSystem = {
    currentBoss: null,

    spawnBoss(levelId, level) {
        const bossX = level.width - 400;
        const bossY = level.height - 200;
        this.currentBoss = new Boss(bossX, bossY, levelId);
        return this.currentBoss;
    },

    update(dt, player, level) {
        if (this.currentBoss) {
            this.currentBoss.update(dt, player, level);

            if (this.currentBoss.dead && this.currentBoss.deathTimer > 4000) {
                const boss = this.currentBoss;
                this.currentBoss = null;

                const container = document.querySelector('.boss-health-container');
                if (container) {
                    container.classList.remove('visible');
                    setTimeout(() => container.style.display = 'none', 500);
                }

                return { defeated: true, score: CONFIG.boss.score[Math.floor((levelId - 1) / 10)] || 1000 };
            }

            for (const proj of this.currentBoss.projectiles) {
                if (Collision.rectRect(proj, player)) {
                    player.takeDamage(proj.damage, CONFIG.physics.knockbackForce * 1.5);
                }
            }

            for (const minion of this.currentBoss.minions) {
                if (!minion.dead && Collision.playerEnemy(player, minion)) {
                    player.takeDamage(minion.damage, CONFIG.physics.knockbackForce);
                }
            }

            if (player.attackTimer > 0) {
                const attackBox = player.getAttackBox();
                if (Collision.rectRect(attackBox, this.currentBoss)) {
                    this.currentBoss.takeDamage(player.damage, CONFIG.physics.knockbackForce, player);
                }
            }
        }
        return { defeated: false };
    },

    render(ctx, camera) {
        if (this.currentBoss) {
            this.currentBoss.render(ctx, camera);
        }
    },

    clear() {
        this.currentBoss = null;
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Boss, BossSystem };
}