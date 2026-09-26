class Enemy {
    constructor(x, y, type) {
        this.type = type;
        const config = CONFIG.enemy[type];

        this.x = x;
        this.y = y;
        this.width = config.width;
        this.height = config.height;

        this.velocityX = 0;
        this.velocityY = 0;
        this.speed = config.speed;
        this.maxHealth = config.health;
        this.health = this.maxHealth;
        this.damage = config.damage;
        this.detectionRange = config.detectionRange;
        this.attackCooldown = config.attackCooldown;
        this.attackTimer = 0;
        this.scoreValue = config.score;

        this.facingDirection = Math.random() > 0.5 ? 1 : -1;
        this.state = 'idle';
        this.grounded = false;
        this.dead = false;
        this.invincible = false;
        this.invincibilityTimer = 0;
        this.knockbackResistance = config.knockbackResistance || 0;

        this.patrolDistance = 100;
        this.patrolStartX = x;
        this.patrolDirection = this.facingDirection;

        this.animTimer = 0;
        this.animFrame = 0;

        this.hitFlashTimer = 0;
        this.deathTimer = 0;
    }

    update(dt, player, level) {
        if (this.dead) {
            this.updateDeath(dt);
            return;
        }

        this.updateTimers(dt);
        this.updatePhysics(dt, level);
        this.updateAI(dt, player, level);
        this.updateAnimation(dt);
        this.updateState();
    }

    updateTimers(dt) {
        if (this.attackTimer > 0) this.attackTimer -= dt;
        if (this.invincibilityTimer > 0) this.invincibilityTimer -= dt;
    }

    updatePhysics(dt, level) {
        Physics.applyGravity(this, dt);
        Physics.applyFriction(this, dt);
        Physics.updatePosition(this, dt);
        Physics.checkHorizontalCollisions(this, level.platforms);
        Physics.checkPlatformCollision(this, level.platforms);
    }

    updateAI(dt, player, level) {
        switch (this.type) {
            case 'walker':
                this.aiWalker(dt, level);
                break;
            case 'chaser':
                this.aiChaser(dt, player, level);
                break;
            case 'ranged':
                this.aiRanged(dt, player, level);
                break;
            case 'flying':
                this.aiFlying(dt, player, level);
                break;
            case 'heavy':
                this.aiHeavy(dt, player, level);
                break;
        }
    }

    aiWalker(dt, level) {
        const edgeCheckX = this.facingDirection === 1 ?
            this.x + this.width + 10 :
            this.x - 10;

        let atEdge = true;
        for (const platform of level.platforms) {
            if (!platform.solid) continue;
            if (edgeCheckX >= platform.x && edgeCheckX <= platform.x + platform.width) {
                if (Math.abs(this.y + this.height - platform.y) < 5) {
                    atEdge = false;
                    break;
                }
            }
        }

        if (atEdge || this.x <= this.patrolStartX - this.patrolDistance ||
            this.x >= this.patrolStartX + this.patrolDistance) {
            this.facingDirection *= -1;
        }

        this.velocityX = this.facingDirection * this.speed;
    }

    aiChaser(dt, player, level) {
        const dx = player.x - this.x;
        const distance = Math.abs(dx);

        if (distance <= this.detectionRange) {
            this.facingDirection = dx > 0 ? 1 : -1;

            if (distance > 40) {
                this.velocityX = this.facingDirection * this.speed;
            } else if (this.attackTimer <= 0) {
                this.attack();
            }
        } else {
            this.velocityX *= 0.95;
        }
    }

    aiRanged(dt, player, level) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= this.detectionRange) {
            this.facingDirection = dx > 0 ? 1 : -1;

            if (distance > 200) {
                this.velocityX = this.facingDirection * this.speed * 0.5;
            } else {
                this.velocityX *= 0.9;

                if (this.attackTimer <= 0 && this.canSeePlayer(player, level)) {
                    this.shootProjectile(player);
                }
            }
        } else {
            this.velocityX *= 0.95;
        }
    }

    aiFlying(dt, player, level) {
        const config = CONFIG.enemy.flying;
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= this.detectionRange) {
            this.facingDirection = dx > 0 ? 1 : -1;

            const targetY = player.y + Math.sin(Date.now() * config.frequency) * config.amplitude;
            const vy = (targetY - this.y) * 0.02;
            this.velocityY = Utils.clamp(vy, -config.speed, config.speed);

            if (distance < 150 && this.attackTimer <= 0) {
                this.attack();
            }
        } else {
            this.velocityY += Math.sin(Date.now() * 0.002) * 0.5;
            this.velocityX = Math.sin(Date.now() * 0.001) * this.speed;
        }

        this.grounded = false;
    }

    aiHeavy(dt, player, level) {
        const dx = player.x - this.x;
        const distance = Math.abs(dx);

        if (distance <= this.detectionRange) {
            this.facingDirection = dx > 0 ? 1 : -1;

            if (distance > 60) {
                this.velocityX = this.facingDirection * this.speed;
            } else if (this.attackTimer <= 0) {
                this.attack();
            }
        } else {
            this.velocityX *= 0.9;
        }
    }

    canSeePlayer(player, level) {
        const x1 = this.x + this.width / 2;
        const y1 = this.y + this.height / 2;
        const x2 = player.x + player.width / 2;
        const y2 = player.y + player.height / 2;

        for (const platform of level.platforms) {
            if (!platform.solid) continue;
            if (Collision.lineRect(x1, y1, x2, y2, platform)) {
                return false;
            }
        }
        return true;
    }

    shootProjectile(player) {
        this.attackTimer = CONFIG.enemy.ranged.attackCooldown;

        const startX = this.x + (this.facingDirection === 1 ? this.width : 0);
        const startY = this.y + this.height / 2;
        const angle = Math.atan2(
            (player.y + player.height / 2) - startY,
            (player.x + player.width / 2) - startX
        );

        const speed = CONFIG.enemy.ranged.projectileSpeed;
        const damage = CONFIG.enemy.ranged.projectileDamage;

        return {
            x: startX,
            y: startY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            width: 12,
            height: 12,
            damage,
            owner: this,
            lifetime: 3000,
            type: 'enemy_projectile'
        };
    }

    attack() {
        this.attackTimer = this.attackCooldown;
        this.state = 'attacking';
    }

    updateAnimation(dt) {
        this.animTimer += dt;
        if (this.animTimer > 0.2) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 4;
        }
    }

    updateState() {
        if (this.invincibilityTimer > 0) {
            this.state = 'hurt';
        } else if (this.attackTimer > this.attackCooldown * 0.7) {
            this.state = 'attacking';
        } else if (Math.abs(this.velocityX) > 0.5) {
            this.state = 'moving';
        } else {
            this.state = 'idle';
        }
    }

    updateDeath(dt) {
        this.deathTimer += dt;
        this.velocityY += Physics.gravity * dt;
        this.y += this.velocityY * dt;
    }

    takeDamage(amount, knockback = 0, attacker = null) {
        if (this.invincibilityTimer > 0 || this.dead) return false;

        this.health -= amount;
        this.invincibilityTimer = 300;
        this.hitFlashTimer = 100;

        const effectiveKnockback = knockback * (1 - this.knockbackResistance);
        if (effectiveKnockback > 0 && attacker) {
            const dir = attacker.x < this.x ? 1 : -1;
            this.velocityX = dir * effectiveKnockback;
            this.velocityY = -effectiveKnockback * 0.3;
        }

        AudioSystem.play('enemyHit');
        ParticleSystem.hit(this.x + this.width / 2, this.y + this.height / 2, this.getColor());

        if (this.health <= 0) {
            this.die();
        }

        return true;
    }

    die() {
        this.dead = true;
        this.deathTimer = 0;
        this.velocityX = 0;
        this.velocityY = -5;
        AudioSystem.play('enemyDeath');
        ParticleSystem.enemyDeath(this.x + this.width / 2, this.y + this.height / 2, this.type, this.getColor());
    }

    getColor() {
        const colors = {
            walker: '#88aa44',
            chaser: '#aa4444',
            ranged: '#aa8844',
            flying: '#8844aa',
            heavy: '#666666'
        };
        return colors[this.type] || '#ffffff';
    }

    getSecondaryColor() {
        const colors = {
            walker: '#668822',
            chaser: '#882222',
            ranged: '#886622',
            flying: '#662288',
            heavy: '#444444'
        };
        return colors[this.type] || '#cccccc';
    }

    render(ctx, camera) {
        if (!camera.isVisible(this)) return;

        const screenX = camera.getScreenX(this.x);
        const screenY = camera.getScreenY(this.y);

        if (this.hitFlashTimer > 0) {
            this.hitFlashTimer -= 16;
            ctx.globalAlpha = 0.5;
        }

        if (this.dead) {
            ctx.globalAlpha = Math.max(0, 1 - this.deathTimer / 1000);
        }

        this.drawBody(ctx, screenX, screenY);

        if (this.health < this.maxHealth && !this.dead) {
            this.drawHealthBar(ctx, screenX, screenY);
        }

        ctx.globalAlpha = 1;
    }

    drawBody(ctx, x, y) {
        const color = this.getColor();
        const secondary = this.getSecondaryColor();
        const w = this.width;
        const h = this.height;
        const frame = this.animFrame;

        ctx.save();

        if (this.facingDirection === -1) {
            ctx.translate(x + w, y);
            ctx.scale(-1, 1);
        } else {
            ctx.translate(x, y);
        }

        const legOffset = this.state === 'moving' ? Math.sin(frame * Math.PI / 2) * 3 : 0;

        ctx.fillStyle = secondary;
        ctx.fillRect(6, h - 12 + legOffset, 8, 12);
        ctx.fillRect(w - 14, h - 12 - legOffset, 8, 12);

        const bodyGradient = ctx.createLinearGradient(0, 0, 0, h);
        bodyGradient.addColorStop(0, color);
        bodyGradient.addColorStop(1, secondary);
        ctx.fillStyle = bodyGradient;

        switch (this.type) {
            case 'walker':
                this.drawWalker(ctx, w, h);
                break;
            case 'chaser':
                this.drawChaser(ctx, w, h);
                break;
            case 'ranged':
                this.drawRanged(ctx, w, h);
                break;
            case 'flying':
                this.drawFlying(ctx, w, h);
                break;
            case 'heavy':
                this.drawHeavy(ctx, w, h);
                break;
        }

        ctx.fillStyle = '#ff0000';
        const eyeX = this.facingDirection === 1 ? w - 10 : 4;
        ctx.fillRect(eyeX, 8, 6, 6);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(eyeX + 1, 9, 2, 2);

        if (this.state === 'attacking') {
            ctx.fillStyle = '#ffaa00';
            ctx.fillRect(this.facingDirection === 1 ? w : -15, h / 2 - 3, 15, 6);
        }

        ctx.restore();
    }

    drawWalker(ctx, w, h) {
        ctx.fillRect(4, 8, w - 8, h - 20);
        ctx.fillStyle = this.getSecondaryColor();
        ctx.fillRect(6, 10, 8, 8);
        ctx.fillRect(w - 14, 10, 8, 8);
    }

    drawChaser(ctx, w, h) {
        ctx.beginPath();
        ctx.moveTo(4, h - 18);
        ctx.lineTo(w / 2, 4);
        ctx.lineTo(w - 4, h - 18);
        ctx.closePath();
        ctx.fill();
    }

    drawRanged(ctx, w, h) {
        ctx.fillRect(4, 6, w - 8, h - 18);
        ctx.fillStyle = '#aaaa44';
        ctx.fillRect(w / 2 - 6, 8, 12, 16);
    }

    drawFlying(ctx, w, h) {
        const wingOffset = Math.sin(Date.now() * 0.01) * 6;
        ctx.fillStyle = this.getSecondaryColor();
        ctx.beginPath();
        ctx.ellipse(w / 2, h / 2, w / 2 + wingOffset, h / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = this.getColor();
        ctx.beginPath();
        ctx.ellipse(w / 2, h / 2, w / 2 - 4, h / 2 - 4, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    drawHeavy(ctx, w, h) {
        ctx.fillRect(2, 4, w - 4, h - 16);
        ctx.fillStyle = '#888888';
        ctx.fillRect(4, 6, w - 8, 12);
        ctx.fillRect(4, h - 22, w - 8, 12);
    }

    drawHealthBar(ctx, x, y) {
        const barWidth = this.width;
        const barHeight = 4;
        const healthPercent = this.health / this.maxHealth;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(x, y - 10, barWidth, barHeight);

        const gradient = ctx.createLinearGradient(0, 0, barWidth, 0);
        gradient.addColorStop(0, '#ff4444');
        gradient.addColorStop(1, '#ffaa44');
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y - 10, barWidth * healthPercent, barHeight);
    }
}

class Projectile {
    constructor(x, y, vx, vy, damage, owner, type = 'player') {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.width = 12;
        this.height = 12;
        this.damage = damage;
        this.owner = owner;
        this.type = type;
        this.lifetime = 3000;
        this.dead = false;
        this.trail = [];
    }

    update(dt, level) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.lifetime -= dt;

        this.trail.unshift({ x: this.x, y: this.y });
        if (this.trail.length > 8) this.trail.pop();

        if (this.lifetime <= 0) {
            this.dead = true;
        }

        for (const platform of level.platforms) {
            if (!platform.solid) continue;
            if (Collision.rectRect(this, platform)) {
                this.dead = true;
                break;
            }
        }
    }

    render(ctx, camera) {
        if (this.dead) return;

        const screenX = camera.getScreenX(this.x);
        const screenY = camera.getScreenY(this.y);

        ctx.save();

        this.trail.forEach((pos, i) => {
            const alpha = (i / this.trail.length) * 0.3;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = this.type === 'player' ? '#ffdd44' : '#ff4444';
            ctx.beginPath();
            ctx.arc(camera.getScreenX(pos.x), camera.getScreenY(pos.y), 4 - i * 0.3, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.globalAlpha = 1;
        const gradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, 8);
        gradient.addColorStop(0, this.type === 'player' ? '#fff888' : '#ff8888');
        gradient.addColorStop(1, this.type === 'player' ? '#ffaa00' : '#ff0000');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(screenX, screenY, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

const EnemySystem = {
    enemies: [],
    projectiles: [],
    maxProjectiles: 50,

    spawnEnemy(x, y, type) {
        const enemy = new Enemy(x, y, type);
        this.enemies.push(enemy);
        return enemy;
    },

    spawnProjectile(x, y, vx, vy, damage, owner, type = 'enemy') {
        if (this.projectiles.length >= this.maxProjectiles) return null;
        const projectile = new Projectile(x, y, vx, vy, damage, owner, type);
        this.projectiles.push(projectile);
        return projectile;
    },

    update(dt, player, level) {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(dt, player, level);

            if (enemy.dead && enemy.deathTimer > 1000) {
                this.enemies.splice(i, 1);
                continue;
            }

            if (!enemy.dead && Collision.playerEnemy(player, enemy)) {
                player.takeDamage(enemy.damage, CONFIG.physics.knockbackForce);
            }

            if (player.attackTimer > 0) {
                const attackBox = player.getAttackBox();
                if (Collision.attackEnemy(attackBox, enemy)) {
                    const killed = enemy.takeDamage(player.damage, CONFIG.physics.knockbackForce, player);
                    if (killed) {
                        player.levelEnemiesDefeated++;
                        player.addScore(enemy.scoreValue);
                        SaveSystem.updateStatistics({ enemiesDefeated: 1 });
                        SaveSystem.updateAchievementProgress('enemies_defeated', 1);
                    }
                }
            }
        }

        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            projectile.update(dt, level);

            if (projectile.dead) {
                this.projectiles.splice(i, 1);
                continue;
            }

            if (projectile.type === 'enemy' && Collision.projectileEntity(projectile, player)) {
                player.takeDamage(projectile.damage, CONFIG.physics.knockbackForce);
                this.projectiles.splice(i, 1);
            } else if (projectile.type === 'player') {
                for (const enemy of this.enemies) {
                    if (!enemy.dead && Collision.projectileEntity(projectile, enemy)) {
                        const killed = enemy.takeDamage(projectile.damage, CONFIG.physics.knockbackForce, projectile.owner);
                        if (killed) {
                            player.levelEnemiesDefeated++;
                            player.addScore(enemy.scoreValue);
                            SaveSystem.updateStatistics({ enemiesDefeated: 1 });
                            SaveSystem.updateAchievementProgress('enemies_defeated', 1);
                        }
                        this.projectiles.splice(i, 1);
                        break;
                    }
                }
            }
        }
    },

    render(ctx, camera) {
        this.enemies.forEach(enemy => enemy.render(ctx, camera));
        this.projectiles.forEach(proj => proj.render(ctx, camera));
    },

    clear() {
        this.enemies = [];
        this.projectiles = [];
    },

    getEnemiesInRange(x, y, range) {
        return this.enemies.filter(e =>
            !e.dead && Utils.distance(x, y, e.x + e.width / 2, e.y + e.height / 2) <= range
        );
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Enemy, Projectile, EnemySystem };
}