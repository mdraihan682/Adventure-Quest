class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = CONFIG.player.width;
        this.height = CONFIG.player.height;

        this.velocityX = 0;
        this.velocityY = 0;
        this.speed = CONFIG.physics.maxSpeed;
        this.jumpPower = CONFIG.physics.jumpPower;
        this.doubleJumpPower = CONFIG.physics.doubleJumpPower;
        this.gravity = CONFIG.physics.gravity;

        this.health = CONFIG.player.maxHealth;
        this.maxHealth = CONFIG.player.maxHealth;
        this.damage = CONFIG.player.baseDamage;
        this.coins = 0;
        this.score = 0;
        this.lives = CONFIG.player.lives;

        this.state = 'idle';
        this.facingDirection = 1;
        this.grounded = false;
        this.jumpsUsed = 0;
        this.maxJumps = 2;

        this.attackCooldown = 0;
        this.attackTimer = 0;
        this.invincibilityTimer = 0;
        this.knockbackTimer = 0;

        this.currentPlatform = null;
        this.currentSkin = 'default';
        this.currentTrail = 'none';

        this.animTimer = 0;
        this.animFrame = 0;

        this.trailParticles = [];
        this.lastTrailTime = 0;

        this.checkpointX = x;
        this.checkpointY = y;
        this.checkpointHealth = this.health;

        this.levelStartTime = Date.now();
        this.levelCoins = 0;
        this.levelDamageTaken = 0;
        this.levelEnemiesDefeated = 0;

        // Combat Depth
        this.coyoteTimer = 0;
        this.jumpBufferTimer = 0;
        this.parryTimer = 0;
        this.parryActive = false;
        this.parrySuccess = false;
        this.comboCount = 0;
        this.comboTimer = 0;
        this.lastHitTime = 0;
        this.hitPauseTimer = 0;
        this.hitFreezeTimer = 0;
        this.isParrying = false;

        // Movement assists
        this.wallJumpTimer = 0;
        this.wallJumpDirection = 0;
        this.dashTimer = 0;
        this.dashCooldown = 0;
        this.airDashUsed = false;
        this.lastHorizontalInput = 0;
        this.dashDirection = 0;

        // Meta progression stats
        this.baseMaxHealth = CONFIG.player.maxHealth;
        this.baseDamage = CONFIG.player.baseDamage;
        this.baseSpeed = CONFIG.physics.maxSpeed;
        this.baseJumpPower = CONFIG.physics.jumpPower;

        // Damage numbers
        this.damageNumbers = [];

        // Floating text
        this.floatingTexts = [];

        // Wall slide
        this.wallSliding = false;
        this.wallSlideDirection = 0;
    }

    applyMetaUpgrades() {
        const meta = SaveSystem.getMeta();
        const upgrades = meta.upgrades;

        this.maxHealth = this.baseMaxHealth + (upgrades.health || 0) * CONFIG.meta.upgrades.health.perLevel;
        this.health = Math.min(this.health, this.maxHealth);

        this.damage = this.baseDamage + (upgrades.damage || 0) * CONFIG.meta.upgrades.damage.perLevel;

        this.speed = this.baseSpeed * (1 + (upgrades.speed || 0) * CONFIG.meta.upgrades.speed.perLevel);

        this.jumpPower = this.baseJumpPower;
        if (upgrades.doubleJump) {
            this.maxJumps = 2;
        }

        if (upgrades.dash) {
            this.canDash = true;
        }

        if (upgrades.parry) {
            this.canParry = true;
        }

        this.coinMagnetRange = (upgrades.coinMagnet || 0) * CONFIG.meta.upgrades.coinMagnet.perLevel;
    }

    reset(x, y) {
        this.x = x;
        this.y = y;
        this.velocityX = 0;
        this.velocityY = 0;
        this.health = this.maxHealth;
        this.state = 'idle';
        this.facingDirection = 1;
        this.grounded = false;
        this.jumpsUsed = 0;
        this.attackCooldown = 0;
        this.attackTimer = 0;
        this.invincibilityTimer = 0;
        this.knockbackTimer = 0;
        this.currentPlatform = null;
        this.animTimer = 0;
        this.animFrame = 0;
        this.trailParticles = [];
        this.levelStartTime = Date.now();
        this.levelCoins = 0;
        this.levelDamageTaken = 0;
        this.levelEnemiesDefeated = 0;

        // Combat depth reset
        this.coyoteTimer = 0;
        this.jumpBufferTimer = 0;
        this.parryTimer = 0;
        this.parryActive = false;
        this.parrySuccess = false;
        this.comboCount = 0;
        this.comboTimer = 0;
        this.hitPauseTimer = 0;
        this.hitFreezeTimer = 0;
        this.isParrying = false;
        this.wallJumpTimer = 0;
        this.dashTimer = 0;
        this.dashCooldown = 0;
        this.airDashUsed = false;
        this.dashDirection = 0;
        this.wallSliding = false;
        this.wallSlideDirection = 0;

        this.applyMetaUpgrades();
    }

    respawn() {
        this.x = this.checkpointX;
        this.y = this.checkpointY;
        this.velocityX = 0;
        this.velocityY = 0;
        this.health = Math.min(this.maxHealth, this.checkpointHealth + 30);
        this.state = 'idle';
        this.grounded = false;
        this.jumpsUsed = 0;
        this.invincibilityTimer = CONFIG.player.invincibilityTime;
        this.knockbackTimer = 0;
        this.lives--;
        AudioSystem.play('gameOver');
        Input.triggerHaptic('death');
    }

    canJump() {
        const assist = SaveSystem.getAssistMode();
        if (assist && SaveSystem.getSettings().infiniteJumps) return true;
        return (this.grounded || this.jumpsUsed < this.maxJumps) && this.knockbackTimer <= 0;
    }

    update(dt, input, level) {
        this.updateCombatTimers(dt);
        this.handleInput(input);
        this.updatePhysics(dt, level);
        this.updateTimers(dt);
        this.updateAnimation(dt);
        this.updateTrail(dt);
        this.updateState();
        this.updateDamageNumbers(dt);
        this.updateFloatingTexts(dt);
        this.checkTutorialTriggers(input);
    }

    updateCombatTimers(dt) {
        if (this.hitPauseTimer > 0) {
            this.hitPauseTimer -= dt;
            return; // Freeze everything during hit pause
        }

        if (this.hitFreezeTimer > 0) {
            this.hitFreezeTimer -= dt;
        }

        if (this.coyoteTimer > 0) this.coyoteTimer -= dt;
        if (this.jumpBufferTimer > 0) this.jumpBufferTimer -= dt;
        if (this.parryTimer > 0) {
            this.parryTimer -= dt;
            this.parryActive = this.parryTimer > 0;
        } else {
            this.parryActive = false;
        }

        if (this.comboTimer > 0) {
            this.comboTimer -= dt;
            if (this.comboTimer <= 0) this.comboCount = 0;
        }

        if (this.parrySuccess) {
            this.parrySuccess = false;
        }

        if (this.wallJumpTimer > 0) this.wallJumpTimer -= dt;

        if (this.dashTimer > 0) {
            this.dashTimer -= dt;
            if (this.dashTimer <= 0) {
                this.velocityX *= 0.3;
            }
        }
        if (this.dashCooldown > 0) this.dashCooldown -= dt;

        if (this.attackCooldown > 0) this.attackCooldown -= dt;
        if (this.attackTimer > 0) this.attackTimer -= dt;
        if (this.invincibilityTimer > 0) this.invincibilityTimer -= dt;
        Physics.updateKnockback(this, dt);
    }

    handleInput(input) {
        if (this.knockbackTimer > 0 || this.hitPauseTimer > 0) return;

        const assist = SaveSystem.getAssistMode();
        const settings = SaveSystem.getSettings();

        const horizontal = input.getRawHorizontalAxis();
        this.lastHorizontalInput = horizontal;

        // Auto-parry assist
        if (assist && settings.autoParry && !this.isParrying && this.parryTimer <= 0) {
            this.tryParry();
        }

        // Movement
        if (horizontal < -0.05) {
            Physics.applyAcceleration(this, horizontal, 1/60);
            this.facingDirection = -1;
        } else if (horizontal > 0.05) {
            Physics.applyAcceleration(this, horizontal, 1/60);
            this.facingDirection = 1;
        }

        // Jump input buffering
        if (input.isJustPressed('jump')) {
            this.jumpBufferTimer = CONFIG.combat.jumpBuffer;
        }

        // Process jump buffer
        if (this.jumpBufferTimer > 0) {
            if (this.grounded || this.coyoteTimer > 0) {
                this.doJump(false);
                this.jumpBufferTimer = 0;
            } else if (this.jumpsUsed === 1 && (CONFIG.player.doubleJumpEnabled || this.maxJumps > 2)) {
                this.doJump(true);
                this.jumpBufferTimer = 0;
            } else if (this.wallSliding && this.wallJumpTimer <= 0 && SaveSystem.getMeta().upgrades.wallJump) {
                this.wallJump();
                this.jumpBufferTimer = 0;
            }
        }

        // Attack / Parry
        if (input.isJustPressed('attack')) {
            if (this.canParry && this.parryTimer <= 0 && !this.parryActive) {
                this.tryParry();
            } else if (this.attackCooldown <= 0) {
                this.attack();
                Input.triggerHaptic('attack');
            }
        }

        // Dash (double-tap)
        const meta = SaveSystem.getMeta();
        if (meta.upgrades.dash && input.isJustPressed('left') || input.isJustPressed('right')) {
            const now = Date.now();
            if (now - this.lastDashPress < 200 && this.dashCooldown <= 0 && !this.dashTimer) {
                this.dash(this.facingDirection);
            }
            this.lastDashPress = now;
        }

        // Tutorial triggers
        if (horizontal !== 0) Input.completeTutorialStep('move');
        if (input.isJustPressed('jump')) Input.completeTutorialStep('jump');
        if (input.isJustPressed('attack')) Input.completeTutorialStep('attack');
    }

    tryParry() {
        this.parryTimer = CONFIG.combat.parryWindow;
        this.parryActive = true;
        this.isParrying = true;
        // Visual indicator
        ParticleSystem.add({
            x: this.x + this.width / 2,
            y: this.y + this.height / 2,
            vx: 0, vy: -1,
            radius: 15, color: '#ffff00',
            alpha: 0.8, decay: 0.05, gravity: -0.1, life: 0.3, type: 'ring'
        });
    }

    checkParrySuccess(attacker) {
        if (this.parryActive && !this.parrySuccess) {
            this.parrySuccess = true;
            this.parryActive = false;
            this.parryTimer = 0;

            // Stun attacker
            if (attacker) {
                attacker.stunned = true;
                attacker.stunTimer = CONFIG.combat.parryStunDuration;
            }

            // Counter-attack
            this.velocityY = CONFIG.combat.launchVelocity * 0.5;
            this.comboCount++;
            this.comboTimer = CONFIG.combat.comboWindow;

            // Effects
            AudioSystem.play('enemyHit');
            ParticleSystem.add({
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
                vx: this.facingDirection * 5, vy: -5,
                radius: 20, color: '#ffff00',
                alpha: 1, decay: 0.03, gravity: 0, life: 0.5, type: 'star'
            });
            Input.triggerHaptic('attack');
            SaveSystem.updateStatistics({ parriesSuccessful: 1 });
            return true;
        }
        return false;
    }

    doJump(isDouble) {
        const power = isDouble ? this.doubleJumpPower : this.jumpPower;
        Physics.applyJump(this, power);
        this.grounded = false;
        if (!isDouble) {
            this.jumpsUsed = 1;
        } else {
            this.jumpsUsed = 2;
        }
        this.coyoteTimer = 0;

        AudioSystem.play(isDouble ? 'doubleJump' : 'jump');
        Input.triggerHaptic('jump');
        ParticleSystem.jump(
            this.x + this.width / 2,
            this.y + this.height,
            this.facingDirection === 1,
            isDouble ? '#aaff88' : undefined
        );
    }

    wallJump() {
        this.velocityX = -this.wallSlideDirection * 10;
        this.velocityY = -14;
        this.jumpsUsed = 1;
        this.wallJumpTimer = 200;
        this.wallSliding = false;
        AudioSystem.play('jump');
        Input.triggerHaptic('jump');
    }

    dash(direction) {
        if (this.dashCooldown > 0 || this.dashTimer > 0) return;
        this.dashTimer = 150;
        this.dashCooldown = 800;
        this.dashDirection = direction;
        this.velocityX = direction * 20;
        this.velocityY = 0;
        this.grounded = false;
        this.invincibilityTimer = 150;

        AudioSystem.play('attack');
        Input.triggerHaptic('attack');
        ParticleSystem.dash(this.x, this.y + this.height / 2, direction === 1);
    }

    updatePhysics(dt, level) {
        if (this.hitPauseTimer > 0) return;

        // Wall slide detection
        this.checkWallSlide(level);

        // Apply gravity (reduced when wall sliding)
        const gravityMult = this.wallSliding ? 0.2 : 1;
        Physics.applyGravity(this, dt * gravityMult);

        // Apply friction
        if (!this.wallSliding) {
            Physics.applyFriction(this, dt);
        }

        // Coyote time
        if (this.grounded) {
            this.coyoteTimer = CONFIG.combat.coyoteTime;
            this.jumpsUsed = 0;
            this.airDashUsed = false;
            this.wallSliding = false;
        } else if (this.coyoteTimer > 0) {
            this.coyoteTimer -= dt;
        }

        Physics.updatePosition(this, dt);
        Physics.checkHorizontalCollisions(this, level.platforms);
        Physics.checkPlatformCollision(this, level.platforms);

        if (level.hazards) {
            level.hazards.forEach(hazard => {
                if (Collision.playerHazard(this, hazard)) {
                    this.takeDamage(hazard.damage || 20, hazard.knockback || 0);
                }
            });
        }

        Physics.checkBoundaryCollision(this, level.width, level.height);

        if (Physics.checkFallDeath(this, level.height)) {
            this.die();
        }
    }

    checkWallSlide(level) {
        if (this.grounded || this.velocityY >= 0) {
            this.wallSliding = false;
            return;
        }

        const meta = SaveSystem.getMeta();
        if (!meta.upgrades.wallJump) return;

        const checkX = this.facingDirection === 1 ? this.x + this.width + 2 : this.x - 2;
        for (const platform of level.platforms) {
            if (!platform.solid) continue;
            if (checkX >= platform.x && checkX <= platform.x + platform.width) {
                if (this.y < platform.y + platform.height && this.y + this.height > platform.y) {
                    this.wallSliding = true;
                    this.wallSlideDirection = this.facingDirection;
                    this.velocityY = Math.min(this.velocityY, 1.5);
                    this.jumpsUsed = 0;
                    this.airDashUsed = false;

                    // Wall slide particles
                    if (Math.random() < 0.1) {
                        ParticleSystem.add({
                            x: this.x + (this.facingDirection === 1 ? this.width : 0),
                            y: this.y + Utils.random(0, this.height),
                            vx: this.facingDirection * Utils.random(1, 2),
                            vy: Utils.random(-0.5, 0.5),
                            radius: Utils.random(2, 4),
                            color: '#88aaff',
                            alpha: 0.5, decay: 0.05, gravity: 0, life: 0.3
                        });
                    }
                    return;
                }
            }
        }
        this.wallSliding = false;
    }

    updateTimers(dt) {
        if (this.hitPauseTimer > 0) return;
        if (this.attackCooldown > 0) this.attackCooldown -= dt;
        if (this.attackTimer > 0) this.attackTimer -= dt;
        if (this.invincibilityTimer > 0) this.invincibilityTimer -= dt;
        Physics.updateKnockback(this, dt);
    }

    updateAnimation(dt) {
        if (this.hitPauseTimer > 0) return;
        this.animTimer += dt;

        const speeds = {
            idle: 0.5,
            running: 0.15,
            jumping: 0.2,
            falling: 0.2,
            attacking: 0.1,
            hurt: 0.15,
            parry: 0.05,
            dash: 0.05,
            wallSlide: 0.2
        };

        const speed = speeds[this.state] || 0.15;

        if (this.animTimer >= speed) {
            this.animTimer = 0;
            this.animFrame++;
        }
    }

    updateTrail(dt) {
        if (this.currentTrail !== 'none' && Math.abs(this.velocityX) > 2) {
            this.lastTrailTime += dt;
            if (this.lastTrailTime > 50) {
                this.lastTrailTime = 0;
                this.addTrailParticle();
            }
        }
    }

    addTrailParticle() {
        const colors = {
            fire: ['#ff4400', '#ff8800', '#ffcc00'],
            ice: ['#44aaff', '#88ddff', '#ffffff'],
            shadow: ['#440044', '#880088', '#cc00cc'],
            rainbow: ['#ff0000', '#ff8800', '#ffff00', '#00ff00', '#00ffff', '#8800ff', '#ff00ff']
        };
        const trailColors = colors[this.currentTrail] || colors.fire;

        ParticleSystem.add({
            x: this.x + this.width / 2 + (this.facingDirection === 1 ? -15 : 15),
            y: this.y + this.height / 2 + Utils.random(-5, 5),
            vx: this.facingDirection * Utils.random(-1, -0.5),
            vy: Utils.random(-0.5, 0.5),
            radius: Utils.random(4, 8),
            color: Utils.randomChoice(trailColors),
            alpha: 0.6,
            decay: 0.04,
            gravity: 0,
            life: 0.5
        });
    }

    updateState() {
        if (this.knockbackTimer > 0) {
            this.state = 'hurt';
        } else if (this.parryActive) {
            this.state = 'parry';
        } else if (this.dashTimer > 0) {
            this.state = 'dash';
        } else if (this.attackTimer > 0) {
            this.state = 'attacking';
        } else if (this.wallSliding) {
            this.state = 'wallSlide';
        } else if (!this.grounded) {
            this.state = this.velocityY < 0 ? 'jumping' : 'falling';
        } else if (Math.abs(this.velocityX) > 0.5) {
            this.state = 'running';
        } else {
            this.state = 'idle';
        }
    }

    attack() {
        const meta = SaveSystem.getMeta();
        const hasHeavyStrike = meta.skillTree.combat.heavyStrike;

        if (hasHeavyStrike && this.attackChargeTimer > 300) {
            // Heavy strike
            this.attackTimer = CONFIG.player.attackDuration * 1.5;
            this.attackCooldown = CONFIG.player.attackCooldown * 1.5;
            this.damage *= 2;
            this.isHeavyStrike = true;
        } else {
            this.attackTimer = CONFIG.player.attackDuration;
            this.attackCooldown = CONFIG.player.attackCooldown;
            this.isHeavyStrike = false;
        }

        AudioSystem.play('attack');
        ParticleSystem.attack(
            this.x + this.width / 2 + this.facingDirection * 25,
            this.y + this.height / 2,
            this.facingDirection === 1
        );

        if (this.velocityY > 0 && CONFIG.combat.aerialDownStrike) {
            this.velocityY = CONFIG.combat.launchVelocity;
            this.isDownStrike = true;
        }
    }

    getAttackBox() {
        const range = CONFIG.player.attackRange;
        const width = CONFIG.player.attackWidth;
        const height = CONFIG.player.attackHeight;

        let x, y;
        if (this.facingDirection === 1) {
            x = this.x + this.width;
        } else {
            x = this.x - width;
        }
        y = this.y + (this.height - height) / 2;

        return { x, y, width, height };
    }

    takeDamage(amount, knockback = 0, attacker = null) {
        const assist = SaveSystem.getAssistMode();
        const settings = SaveSystem.getSettings();

        if (assist && settings.halfDamage) {
            amount = Math.ceil(amount / 2);
        }

        // Check parry
        if (this.checkParrySuccess(attacker)) {
            return false; // Parried successfully
        }

        if (this.invincibilityTimer > 0 || this.knockbackTimer > 0) return false;

        this.health = Math.max(0, this.health - amount);
        this.levelDamageTaken += amount;
        this.invincibilityTimer = CONFIG.player.invincibilityTime;

        // Hit pause & freeze
        if (CONFIG.visualJuice.screenShakeOnHit) {
            this.hitPauseTimer = CONFIG.combat.hitPause;
            this.hitFreezeTimer = CONFIG.combat.hitFreeze;
            Camera.shake(6);
        }

        if (knockback > 0) {
            const forceX = this.facingDirection === 1 ? -knockback : knockback;
            Physics.applyKnockback(this, forceX, -knockback * 0.5);
        }

        AudioSystem.play('hit');
        ParticleSystem.hit(this.x + this.width / 2, this.y + this.height / 2);
        Input.triggerHaptic('hit');

        // Damage number
        if (CONFIG.visualJuice.damageNumbers) {
            this.addDamageNumber(amount, 'damage');
        }

        // Floating text
        if (CONFIG.visualJuice.floatingText) {
            this.addFloatingText('HIT!', '#ff4444');
        }

        if (this.health <= 0) {
            this.die();
        }

        return true;
    }

    addDamageNumber(amount, type) {
        const colors = {
            damage: '#ff4444',
            heal: '#44ff44',
            coin: '#ffdd44',
            xp: '#8888ff',
            crit: '#ffdd00'
        };

        this.damageNumbers.push({
            x: this.x + this.width / 2 + Utils.random(-10, 10),
            y: this.y + Utils.random(-10, 10),
            value: amount,
            type: type,
            color: colors[type] || colors.damage,
            timer: CONFIG.visualJuice.damageNumberDuration,
            vy: -1
        });
    }

    addFloatingText(text, color) {
        this.floatingTexts.push({
            x: this.x + this.width / 2,
            y: this.y - 20,
            text: text,
            color: color,
            timer: 800,
            vy: -0.5
        });
    }

    updateDamageNumbers(dt) {
        for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
            const dn = this.damageNumbers[i];
            dn.y += dn.vy * dt;
            dn.timer -= dt;
            dn.vy -= 0.01;
            if (dn.timer <= 0) this.damageNumbers.splice(i, 1);
        }
    }

    updateFloatingTexts(dt) {
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.y += ft.vy * dt;
            ft.timer -= dt;
            if (ft.timer <= 0) this.floatingTexts.splice(i, 1);
        }
    }

    die() {
        this.state = 'dead';
        this.velocityX = 0;
        this.velocityY = 0;
        AudioSystem.play('gameOver');
        Input.triggerHaptic('death');
        SaveSystem.updateStatistics({ deaths: 1 });
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
        if (CONFIG.visualJuice.damageNumbers) {
            this.addDamageNumber(amount, 'heal');
        }
        if (CONFIG.visualJuice.floatingText) {
            this.addFloatingText(`+${amount} HP`, '#44ff44');
        }
    }

    addCoins(amount) {
        const meta = SaveSystem.getMeta();
        const xpBoost = 1 + (meta.upgrades.xpBoost || 0) * CONFIG.meta.upgrades.xpBoost.perLevel;
        const finalAmount = Math.floor(amount * xpBoost);

        this.coins += finalAmount;
        this.levelCoins += finalAmount;
        this.score += finalAmount * CONFIG.collectibles.coin.score;
        Input.triggerHaptic('coin');

        if (CONFIG.visualJuice.damageNumbers) {
            this.addDamageNumber(finalAmount, 'coin');
        }
        if (CONFIG.visualJuice.floatingText) {
            this.addFloatingText(`+${finalAmount}`, '#ffdd44');
        }
    }

    addScore(amount) {
        this.score += amount;
    }

    collectHealth(amount) {
        this.heal(amount);
        AudioSystem.play('health');
        Input.triggerHaptic('coin');
    }

    activateCheckpoint(checkpoint) {
        this.checkpointX = checkpoint.x;
        this.checkpointY = checkpoint.y - this.height;
        this.checkpointHealth = this.health;
        AudioSystem.play('checkpoint');
        ParticleSystem.checkpoint(checkpoint.x + checkpoint.width / 2, checkpoint.y);
        Input.triggerHaptic('checkpoint');
    }

    setSkin(skinId) {
        this.currentSkin = skinId;
    }

    setTrail(trailId) {
        this.currentTrail = trailId;
    }

    getSkinColor() {
        const skins = {
            default: { primary: '#4488ff', secondary: '#2266cc', accent: '#88bbff' },
            crimson: { primary: '#ff3333', secondary: '#cc0000', accent: '#ff8888' },
            azure: { primary: '#4488ff', secondary: '#2266cc', accent: '#88bbff' },
            gold: { primary: '#ffdd44', secondary: '#ccaa00', accent: '#ffee88' },
            ninja: { primary: '#222222', secondary: '#111111', accent: '#666666' },
            knight: { primary: '#cccccc', secondary: '#999999', accent: '#ffdd44' },
            prestige_bronze: { primary: '#cd7f32', secondary: '#8b5a2b', accent: '#ffd700' },
            prestige_silver: { primary: '#c0c0c0', secondary: '#a0a0a0', accent: '#ffffff' },
            prestige_gold: { primary: '#ffd700', secondary: '#ffaa00', accent: '#ffff00' },
            prestige_ultimate: { primary: '#ff00ff', secondary: '#00ffff', accent: '#ffffff' }
        };
        return skins[this.currentSkin] || skins.default;
    }

    getTrailColor() {
        return this.currentTrail;
    }

    checkTutorialTriggers(input) {
        if (!CONFIG.tutorial.enabled) return;
        const tutorial = SaveSystem.getTutorial();
        if (tutorial.completed) return;

        CONFIG.tutorial.steps.forEach(step => {
            if (!tutorial.steps[step.id]) {
                let triggered = false;
                switch (step.trigger) {
                    case 'move': triggered = input.getHorizontalAxis() !== 0; break;
                    case 'jump': triggered = input.isJustPressed('jump') && this.grounded; break;
                    case 'doubleJump': triggered = input.isJustPressed('jump') && !this.grounded && this.jumpsUsed === 1; break;
                    case 'attack': triggered = input.isJustPressed('attack'); break;
                    case 'dash': triggered = this.dashTimer > 0; break;
                    case 'parry': triggered = this.parrySuccess; break;
                }
                if (triggered) {
                    SaveSystem.completeTutorialStep(step.id);
                }
            }
        });
    }

    onEnemyKilled(enemy) {
        this.comboCount++;
        this.comboTimer = CONFIG.combat.comboWindow;
        this.lastHitTime = Date.now();

        if (this.comboCount > SaveSystem.getSettings().highestCombo) {
            SaveSystem.updateSetting('highestCombo', this.comboCount);
        }

        // Lifesteal
        const meta = SaveSystem.getMeta();
        if (meta.skillTree.combat.lifesteal) {
            this.heal(5);
        }

        // Execute
        if (meta.skillTree.combat.execute && enemy.health / enemy.maxHealth < 0.2) {
            // Already dead, but bonus
            this.addCoins(10);
        }

        // Combo floating text
        if (this.comboCount >= 3 && CONFIG.visualJuice.floatingText) {
            this.addFloatingText(`${this.comboCount}x COMBO!`, '#ffdd00');
        }

        // Critical hit chance
        if (meta.skillTree.combat.critChance && Math.random() < 0.15) {
            this.addDamageNumber(enemy.maxHealth, 'crit');
            this.addFloatingText('CRITICAL!', '#ffdd00');
        }
    }

    onBossDefeated() {
        if (CONFIG.visualJuice.screenShakeOnKill) {
            Camera.shake(20);
        }
        if (CONFIG.visualJuice.killFlashDuration) {
            this.hitFreezeTimer = CONFIG.visualJuice.killFlashDuration;
        }
    }

    render(ctx, camera) {
        const screenX = camera.getScreenX(this.x);
        const screenY = camera.getScreenY(this.y);

        if (this.invincibilityTimer > 0 && Math.floor(this.invincibilityTimer / 50) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        this.drawTrail(ctx, camera);
        this.drawBody(ctx, screenX, screenY);

        if (this.attackTimer > 0) {
            this.drawAttack(ctx, screenX, screenY);
        }

        if (this.parryActive) {
            this.drawParry(ctx, screenX, screenY);
        }

        if (this.dashTimer > 0) {
            this.drawDash(ctx, screenX, screenY);
        }

        if (this.invincibilityTimer > 0) {
            this.drawInvincibility(ctx, screenX, screenY);
        }

        // Render damage numbers
        this.renderDamageNumbers(ctx, camera);

        // Render floating texts
        this.renderFloatingTexts(ctx, camera);

        ctx.globalAlpha = 1;
    }

    drawParry(ctx, x, y) {
        const time = Date.now() / 100;
        const radius = Math.max(this.width, this.height) / 2 + 15 + Math.sin(time * 5) * 5;

        ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(x + this.width / 2, y + this.height / 2, radius, radius * 0.7, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Parry flash
        ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
        ctx.fillRect(x - 20, y - 20, this.width + 40, this.height + 40);
    }

    drawDash(ctx, x, y) {
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#88aaff';
        for (let i = 0; i < 5; i++) {
            const offset = i * 10 * -this.facingDirection;
            ctx.fillRect(
                x + this.width / 2 + offset - 5,
                y + this.height / 2 - 5,
                10, 10
            );
        }
        ctx.globalAlpha = 1;
    }

    drawTrail(ctx, camera) {
        if (this.currentTrail === 'none') return;

        const colors = {
            fire: '#ff6600',
            ice: '#44aaff',
            shadow: '#8800aa',
            rainbow: '#ff00ff'
        };
        const color = colors[this.currentTrail] || colors.fire;

        for (let i = 0; i < 3; i++) {
            const offset = (i + 1) * 8 * -this.facingDirection;
            const alpha = 0.3 - i * 0.1;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.ellipse(
                camera.getScreenX(this.x + this.width / 2 + offset),
                camera.getScreenY(this.y + this.height / 2),
                8 - i * 2, 4,
                0, 0, Math.PI * 2
            );
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    drawBody(ctx, x, y) {
        const skin = this.getSkinColor();
        const w = this.width;
        const h = this.height;
        const frame = this.animFrame % 4;

        ctx.save();

        if (this.facingDirection === -1) {
            ctx.translate(x + w, y);
            ctx.scale(-1, 1);
        } else {
            ctx.translate(x, y);
        }

        const legOffset = (this.state === 'running' || this.state === 'wallSlide') ? Math.sin(frame * Math.PI / 2) * 4 : 0;
        const armOffset = this.state === 'running' ? Math.cos(frame * Math.PI / 2) * 3 : 0;

        ctx.fillStyle = skin.secondary;
        ctx.fillRect(8, 36 + legOffset, 8, 12);
        ctx.fillRect(16, 36 - legOffset, 8, 12);

        const bodyGradient = ctx.createLinearGradient(0, 0, 0, h);
        bodyGradient.addColorStop(0, skin.primary);
        bodyGradient.addColorStop(0.5, skin.secondary);
        bodyGradient.addColorStop(1, skin.accent);
        ctx.fillStyle = bodyGradient;
        ctx.fillRect(4, 8, 24, 30);

        ctx.fillStyle = skin.accent;
        ctx.fillRect(6, 10, 8, 8);
        ctx.fillRect(20, 10, 8, 8);

        if (this.state === 'attacking' || this.state === 'parry') {
            ctx.fillStyle = this.state === 'parry' ? '#ffff00' : skin.accent;
            ctx.fillRect(this.facingDirection === 1 ? 28 : -10, 18 + armOffset, 18, 6);
        } else {
            ctx.fillStyle = skin.secondary;
            ctx.fillRect(2, 14 + armOffset, 6, 18);
            ctx.fillRect(26, 14 - armOffset, 6, 18);
        }

        const eyeColor = this.invincibilityTimer > 0 ? '#ffff00' : (this.parryActive ? '#ffff00' : '#ffffff');
        ctx.fillStyle = eyeColor;
        const eyeX = this.facingDirection === 1 ? 22 : 10;
        ctx.fillRect(eyeX, 14, 6, 6);
        ctx.fillStyle = '#000000';
        ctx.fillRect(eyeX + 1, 15, 2, 2);

        if (this.state === 'hurt') {
            ctx.fillStyle = '#ff0000';
            ctx.globalAlpha = 0.5;
            ctx.fillRect(4, 8, 24, 30);
            ctx.globalAlpha = 1;
        }

        ctx.restore();
    }

    drawAttack(ctx, x, y) {
        const progress = 1 - this.attackTimer / CONFIG.player.attackDuration;
        const range = CONFIG.player.attackRange;
        const width = CONFIG.player.attackWidth;
        const height = CONFIG.player.attackHeight;

        let attackX;
        if (this.facingDirection === 1) {
            attackX = x + this.width + progress * range;
        } else {
            attackX = x - width - progress * range;
        }
        const attackY = y + (this.height - height) / 2;

        const gradient = ctx.createLinearGradient(
            attackX, 0,
            attackX + (this.facingDirection === 1 ? width : -width), 0
        );
        gradient.addColorStop(0, 'rgba(255, 200, 100, 0)');
        gradient.addColorStop(0.5, this.isHeavyStrike ? 'rgba(255, 100, 0, 0.8)' : 'rgba(255, 200, 100, 0.6)');
        gradient.addColorStop(1, 'rgba(255, 150, 50, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(attackX, attackY, width, height);

        ctx.strokeStyle = this.isHeavyStrike ? 'rgba(255, 150, 0, 1)' : 'rgba(255, 220, 100, 0.8)';
        ctx.lineWidth = this.isHeavyStrike ? 3 : 2;
        ctx.strokeRect(attackX, attackY, width, height);
    }

    drawInvincibility(ctx, x, y) {
        const time = Date.now() / 200;
        const radius = Math.max(this.width, this.height) / 2 + 8 + Math.sin(time) * 4;

        ctx.strokeStyle = 'rgba(255, 255, 100, 0.6)';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 4]);
        ctx.lineDashOffset = -time * 10;
        ctx.beginPath();
        ctx.ellipse(x + this.width / 2, y + this.height / 2, radius, radius * 0.7, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    renderDamageNumbers(ctx, camera) {
        this.damageNumbers.forEach(dn => {
            const screenX = camera.getScreenX(dn.x);
            const screenY = camera.getScreenY(dn.y);
            const alpha = dn.timer / CONFIG.visualJuice.damageNumberDuration;

            ctx.globalAlpha = alpha;
            ctx.fillStyle = dn.color;
            ctx.font = 'bold 18px Arial';
            ctx.textAlign = 'center';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.strokeText(dn.value, screenX, screenY);
            ctx.fillText(dn.value, screenX, screenY);
        });
        ctx.globalAlpha = 1;
    }

    renderFloatingTexts(ctx, camera) {
        this.floatingTexts.forEach(ft => {
            const screenX = camera.getScreenX(ft.x);
            const screenY = camera.getScreenY(ft.y);
            const alpha = ft.timer / 800;

            ctx.globalAlpha = alpha;
            ctx.fillStyle = ft.color;
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.strokeText(ft.text, screenX, screenY);
            ctx.fillText(ft.text, screenX, screenY);
        });
        ctx.globalAlpha = 1;
    }

    renderHUD(ctx, camera) {
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Player;
}