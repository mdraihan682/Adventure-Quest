const Game = {
    canvas: null,
    ctx: null,
    running: false,
    lastTime: 0,
    currentLevel: 1,
    level: null,
    player: null,
    camera: Camera,
    particleSystem: ParticleSystem,
    input: Input,
    ui: UI,
    enemySystem: EnemySystem,
    bossSystem: BossSystem,
    saveSystem: SaveSystem,
    audioSystem: AudioSystem,

    state: 'menu',
    previousState: 'menu',
    levelStartTime: 0,
    levelTime: 0,
    paused: false,

    fps: 0,
    frameCount: 0,
    fpsTime: 0,

    // New systems
    ghostReplayRecorder: null,
    ghostReplayInputs: [],
    dailyChallengeType: null,
    dailyChallengeData: null,
    assistModeActive: false,
    slowMotionFactor: 1,
    screenShakeIntensity: 0,
    hitFreezeActive: false,
    hitFreezeTimer: 0,
    levelCompleteData: null,
    tutorialActive: false,
    secretsFound: 0,
    maxComboThisLevel: 0,

    init() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');

        this.setupCanvas();
        this.setupResize();
        this.input.init();
        this.audioSystem.init();
        this.audioSystem.generateSounds();
        this.particleSystem.init();
        this.ui.init();

        this.loadSave();
        this.showMainMenu();

        requestAnimationFrame(this.gameLoop.bind(this));
    },

    setupCanvas() {
        const container = document.getElementById('game-container');
        const rect = container.getBoundingClientRect();

        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = Math.min(rect.width, CONFIG.canvas.width) * dpr;
        this.canvas.height = Math.min(rect.height, CONFIG.canvas.height) * dpr;
        this.canvas.style.width = Math.min(rect.width, CONFIG.canvas.width) + 'px';
        this.canvas.style.height = Math.min(rect.height, CONFIG.canvas.height) + 'px';

        this.ctx.scale(dpr, dpr);
        this.camera.init(this.canvas.width / dpr, this.canvas.height / dpr);
    },

    setupResize() {
        window.addEventListener('resize', () => this.setupCanvas());
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.setupCanvas(), 100);
        });
    },

    loadSave() {
        const saveData = this.saveSystem.load();
        if (saveData) {
            this.currentLevel = saveData.currentLevel || 1;
        }
    },

    showMainMenu() {
        this.state = 'menu';
        this.ui.showScreen('mainMenu');
        this.audioSystem.playMusic('menu', true);
    },

    newGame() {
        this.saveSystem.reset();
        this.currentLevel = 1;
        this.startLevel(1);
    },

    continueGame() {
        this.startLevel(this.currentLevel);
    },

    startLevel(levelId) {
        this.currentLevel = levelId;
        this.level = LevelSystem.getLevel(levelId);

        if (!this.level) {
            console.error('Failed to load level:', levelId);
            return;
        }

        this.camera.setLevelBounds(this.level.width, this.level.height);

        const startX = 50;
        const startY = this.level.height - 200;

        if (!this.player) {
            this.player = new Player(startX, startY);
        } else {
            this.player.reset(startX, startY);
        }

        // Apply meta upgrades
        this.player.applyMetaUpgrades();

        const checkpoint = this.saveSystem.getCheckpoint();
        if (checkpoint && checkpoint.levelId === levelId) {
            this.player.x = checkpoint.x;
            this.player.y = checkpoint.y;
            this.player.health = checkpoint.health;
            this.player.coins = checkpoint.coins || 0;
            this.player.score = checkpoint.score || 0;
        }

        this.enemySystem.clear();
        this.level.enemies.forEach(e => {
            this.enemySystem.spawnEnemy(e.x, e.y, e.type);
        });

        this.bossSystem.clear();
        if (this.level.boss) {
            this.bossSystem.spawnBoss(this.level.id, this.level);
        }

        this.particleSystem.clear();
        this.levelStartTime = Date.now();
        this.levelTime = 0;
        this.paused = false;
        this.secretsFound = 0;
        this.maxComboThisLevel = 0;

        // Start ghost replay recording
        this.ghostReplayInputs = [];
        this.ghostReplayRecorder = setInterval(() => {
            this.ghostReplayInputs.push({
                t: Date.now() - this.levelStartTime,
                x: this.player.x,
                y: this.player.y,
                vx: this.player.velocityX,
                vy: this.player.velocityY,
                state: this.player.state,
                facing: this.player.facingDirection
            });
        }, CONFIG.ghostReplay.recordInterval);

        // Daily challenge setup
        if (this.dailyChallengeType) {
            this.applyDailyChallengeModifiers();
        }

        // Assist mode
        this.assistModeActive = SaveSystem.getAssistMode();
        if (this.assistModeActive) {
            const settings = SaveSystem.getSettings();
            if (settings.slowMotion) this.slowMotionFactor = 0.5;
        }

        this.state = 'playing';
        this.ui.showScreen('playing');
        this.ui.hideOverlay('pause');
        this.ui.hideOverlay('gameOver');
        this.ui.hideOverlay('levelComplete');
        this.ui.hideOverlay('victory');

        this.camera.snapTo(this.player);
        this.audioSystem.playMusic(this.level.theme, true);

        this.input.showTouchControls(Utils.isMobile());

        // Tutorial
        if (CONFIG.tutorial.enabled && !SaveSystem.getTutorial().completed && levelId === 1) {
            this.tutorialActive = true;
        }
    },

    restartLevel() {
        this.startLevel(this.currentLevel);
    },

    nextLevel() {
        const nextLevel = this.currentLevel + 1;
        if (nextLevel <= CONFIG.progression.totalLevels) {
            this.startLevel(nextLevel);
        } else {
            this.showVictory();
        }
    },

    completeLevel() {
        this.levelTime = Date.now() - this.levelStartTime;

        // Stop ghost replay recording
        if (this.ghostReplayRecorder) {
            clearInterval(this.ghostReplayRecorder);
            this.ghostReplayRecorder = null;
        }

        // Save ghost replay
        const replayData = {
            time: this.levelTime,
            inputs: this.ghostReplayInputs,
            coins: this.player.levelCoins,
            damageTaken: this.player.levelDamageTaken
        };
        this.saveSystem.saveGhostReplay(this.currentLevel, replayData);

        const saveData = this.saveSystem.load() || this.saveSystem.defaultSave();
        const bestTime = saveData.levelBestTimes?.[this.currentLevel] || Infinity;
        const stars = this.calculateStars();

        const stats = {
            time: this.levelTime,
            coins: this.player.levelCoins,
            score: this.player.score,
            stars: stars,
            maxCombo: this.maxComboThisLevel,
            secretsFound: this.secretsFound,
            noDamage: this.player.levelDamageTaken === 0,
            underPar: this.levelTime < this.level.parTime
        };

        this.saveSystem.addScore(this.currentLevel, this.player.score);
        this.saveSystem.completeLevel(this.currentLevel, stars, this.levelTime);
        this.saveSystem.addCoins(this.player.levelCoins);
        this.saveSystem.updateStatistics({
            coinsCollected: this.player.levelCoins,
            playTime: this.levelTime,
            totalPlayTime: this.levelTime
        });

        if (this.player.levelDamageTaken === 0) {
            this.saveSystem.unlockAchievement('no_damage');
            SaveSystem.updateAchievementProgress('perfect_level', 1);
        }

        if (this.levelTime < this.level.parTime) {
            this.saveSystem.updateAchievementProgress('speed_runs', 1);
        }

        if (this.maxComboThisLevel >= 10) {
            SaveSystem.updateAchievementProgress('combo_master', 1);
        }

        if (this.secretsFound > 0) {
            SaveSystem.updateStatistics({ secretsFound: this.secretsFound });
        }

        // Daily challenge completion
        if (this.dailyChallengeType) {
            this.completeDailyChallenge();
        }

        this.saveSystem.clearCheckpoint();

        // Prestige points
        const prestigeEarned = Math.floor(this.player.score / 1000) + this.player.levelCoins;
        SaveSystem.addPrestigePoints(prestigeEarned);

        this.audioSystem.play('levelComplete');
        this.ui.showLevelComplete(stats);

        if (this.currentLevel === CONFIG.progression.totalLevels) {
            this.showVictory();
        }

        AdMob.showInterstitial();
    },

    calculateStars() {
        let stars = 1;

        const saveData = this.saveSystem.load() || this.saveSystem.defaultSave();
        const bestTime = saveData.levelBestTimes?.[this.currentLevel] || this.level.parTime;

        if (this.levelTime < this.level.parTime * CONFIG.progression.starsThresholds[2]) stars = 2;
        if (this.levelTime < this.level.parTime * CONFIG.progression.starsThresholds[3]) stars = 3;

        if (this.player.levelDamageTaken === 0) stars = 3;

        return stars;
    },

    showVictory() {
        const saveData = this.saveSystem.load() || this.saveSystem.defaultSave();
        this.ui.showVictory(
            saveData.totalScore || 0,
            saveData.lifetimeCoins || 0,
            saveData.statistics?.playTime || 0
        );
        this.saveSystem.unlockAchievement('hundred_levels');
        this.audioSystem.play('victory');
    },

    gameOver() {
        this.ui.showGameOver(this.currentLevel, this.player.score, this.player.coins);
        this.audioSystem.play('gameOver');
    },

    returnToMenu() {
        this.state = 'menu';
        this.paused = false;
        this.enemySystem.clear();
        this.bossSystem.clear();
        this.particleSystem.clear();
        this.showMainMenu();
    },

    resume() {
        this.paused = false;
        this.ui.hidePause();
        this.state = this.previousState;
    },

    pause() {
        if (this.state !== 'playing') return;
        this.previousState = this.state;
        this.state = 'paused';
        this.paused = true;
        this.ui.showPause();
    },

    startDailyChallenge() {
        const dayOfYear = Utils.getDayOfYear();
        const challengeTypes = CONFIG.dailyChallenge.types;
        const type = challengeTypes[dayOfYear % challengeTypes.length];

        this.currentLevel = 1 + (dayOfYear % 99);
        this.level = LevelSystem.getLevel(this.currentLevel);

        this.startLevel(this.currentLevel);
    },

    gameLoop(timestamp) {
        if (!this.lastTime) this.lastTime = timestamp;
        const dt = Math.min(timestamp - this.lastTime, 50);
        this.lastTime = timestamp;

        this.updateFPS(dt);

        if (this.state === 'playing' && !this.paused) {
            this.update(dt);
        }

        this.render();

        requestAnimationFrame(this.gameLoop.bind(this));
    },

    updateFPS(dt) {
        this.frameCount++;
        this.fpsTime += dt;
        if (this.fpsTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.fpsTime = 0;
        }
    },

    update(dt) {
        const gameDt = dt / 16.67 * this.slowMotionFactor;

        // Apply assist mode modifiers
        if (this.assistModeActive) {
            const settings = SaveSystem.getSettings();
            if (settings.infiniteJumps) this.player.maxJumps = 99;
            if (settings.halfDamage) this.player.damageTakenMultiplier = 0.5;
        }

        this.player.update(gameDt, this.input, this.level);
        this.enemySystem.update(gameDt, this.player, this.level);
        this.bossSystem.update(gameDt, this.player, this.level);
        this.particleSystem.update(gameDt);
        this.updateCollectibles(gameDt);
        this.updateCheckpoints();
        this.updateExit();
        this.updateCamera(gameDt);
        this.updateMovingPlatforms(gameDt);
        this.updateDisappearingPlatforms(gameDt);
        this.checkGameOver();
        this.updateMaxCombo();
        this.updateGhostReplay();
        this.updateHitFreeze();
        this.updateScreenShake();
        this.updateTutorial();
        this.updateSecrets();
    },

    updateCollectibles(dt) {
        this.level.collectibles.forEach(collectible => {
            if (collectible.collected) return;

            collectible.animOffset += dt * 0.005;

            if (Collision.playerCollectible(this.player, collectible)) {
                collectible.collected = true;

                switch (collectible.type) {
                    case 'coin':
                        this.player.addCoins(collectible.value);
                        this.saveSystem.addCoins(collectible.value);
                        this.saveSystem.updateAchievementProgress('coins_collected', collectible.value);
                        AudioSystem.play('coin');
                        ParticleSystem.coin(collectible.x + collectible.width / 2, collectible.y + collectible.height / 2);
                        break;
                    case 'health':
                        this.player.collectHealth(collectible.value);
                        break;
                    case 'gem':
                        this.player.addCoins(collectible.value);
                        this.saveSystem.addCoins(collectible.value);
                        AudioSystem.play('coin');
                        ParticleSystem.coin(collectible.x + collectible.width / 2, collectible.y + collectible.height / 2);
                        break;
                }
            }
        });
    },

    updateCheckpoints() {
        this.level.checkpoints.forEach(checkpoint => {
            if (checkpoint.activated) return;

            if (Collision.playerCheckpoint(this.player, checkpoint)) {
                checkpoint.activated = true;
                this.player.activateCheckpoint(checkpoint);
                this.saveSystem.setCheckpoint(this.currentLevel, {
                    x: checkpoint.x + 20,
                    y: checkpoint.y + 60,
                    health: this.player.health,
                    coins: this.player.coins,
                    score: this.player.score
                });
                this.saveSystem.updateStatistics({ checkpointsActivated: 1 });
                this.saveSystem.updateAchievementProgress('checkpoints_activated', 1);
            }
        });
    },

    updateExit() {
        if (this.level.exit && Collision.playerExit(this.player, this.level.exit)) {
            if (this.currentLevel === CONFIG.progression.totalLevels && this.level.boss) {
                const bossResult = this.bossSystem.update(0, this.player, this.level);
                if (bossResult.defeated) {
                    this.completeLevel();
                }
            } else {
                this.completeLevel();
            }
        }
    },

    updateCamera(dt) {
        this.camera.follow(this.player, dt / 16.67);
    },

    updateMovingPlatforms(dt) {
        this.level.platforms.forEach(platform => {
            if (!platform.moving) return;

            platform.moveOffset += platform.moveSpeed * platform.moveDirection * dt;

            if (Math.abs(platform.moveOffset) >= platform.moveRange) {
                platform.moveDirection *= -1;
                platform.moveOffset = Utils.clamp(platform.moveOffset, -platform.moveRange, platform.moveRange);
            }

            platform.x = platform.x + platform.moveSpeed * platform.moveDirection * dt;

            if (this.player.currentPlatform === platform && this.player.grounded) {
                this.player.x += platform.moveSpeed * platform.moveDirection * dt;
            }
        });
    },

    updateDisappearingPlatforms(dt) {
        this.level.platforms.forEach(platform => {
            if (!platform.disappearing) return;

            const playerOnPlatform = this.player.grounded && this.player.currentPlatform === platform;

            if (playerOnPlatform) {
                platform.disappearTimer += dt;
                if (platform.disappearTimer >= platform.disappearDelay) {
                    platform.solid = false;
                }
            } else {
                platform.disappearTimer = 0;
                platform.solid = true;
            }
        });
    },

    checkGameOver() {
        if (this.player.lives <= 0) {
            this.gameOver();
        }
    },

    render() {
        // Apply screen shake
        if (this.screenShakeIntensity > 0) {
            this.ctx.save();
            this.ctx.translate(
                (Math.random() - 0.5) * this.screenShakeIntensity,
                (Math.random() - 0.5) * this.screenShakeIntensity
            );
        }

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.state === 'playing' || this.state === 'paused') {
            this.renderLevel();
        }

        // Render ghost replay
        if (this.ghostReplayInputs.length > 0 && SaveSystem.getMeta().skillTree.utility.speedRunner) {
            this.renderGhostReplay();
        }

        // Hit freeze visual effect
        if (this.hitFreezeActive) {
            this.renderHitFreezeEffect();
        }

        // Tutorial overlay
        if (this.tutorialActive) {
            this.renderTutorialOverlay();
        }

        // Restore transform after screen shake
        if (this.screenShakeIntensity > 0) {
            this.ctx.restore();
        }
    },

    renderLevel() {
        this.renderBackground();
        this.renderPlatforms();
        this.renderHazards();
        this.renderCollectibles();
        this.renderCheckpoints();
        this.renderExit();

        this.enemySystem.render(this.ctx, this.camera);
        this.bossSystem.render(this.ctx, this.camera);

        this.player.render(this.ctx, this.camera);
        this.particleSystem.render(this.ctx, this.camera);

        // Render secrets indicator
        this.renderSecretsIndicator();

        if (CONFIG.debug.showHitboxes) {
            this.renderHitboxes();
        }

        if (CONFIG.debug.showFPS) {
            this.renderFPS();
        }
    },

    renderBackground() {
        const level = this.level;
        const camX = this.camera.x;
        const camY = this.camera.y;

        const skyGradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        skyGradient.addColorStop(0, level.background.skyColor);
        skyGradient.addColorStop(1, level.background.groundColor);
        this.ctx.fillStyle = skyGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();
        this.ctx.translate(-camX, -camY);

        level.parallaxLayers.forEach(layer => {
            this.ctx.fillStyle = layer.color;
            layer.elements.forEach(el => {
                this.ctx.globalAlpha = 0.3 + (layer.speed * 0.5);
                this.ctx.fillRect(el.x - camX * layer.speed, el.y - camY * layer.speed, el.size, el.size);
            });
        });

        this.ctx.globalAlpha = 1;

        level.background.elements.forEach(el => {
            this.drawBackgroundElement(el);
        });

        this.ctx.restore();
    },

    drawBackgroundElement(el) {
        const camX = this.camera.x;
        const screenX = el.x - camX * 0.5;

        if (screenX < -100 || screenX > this.canvas.width + 100) return;

        switch (el.type) {
            case 'tree':
                this.drawTree(screenX, this.level.height - 40 - el.height, el.variant);
                break;
            case 'stalactite':
                this.drawStalactite(screenX, 40, el.length);
                break;
            case 'cactus':
                this.drawCactus(screenX, this.level.height - 40 - el.height, el.variant);
                break;
            case 'pine':
                this.drawPine(screenX, this.level.height - 40 - el.height, el.variant);
                break;
            case 'pillar':
                this.drawPillar(screenX, this.level.height - 40 - el.height, el.variant);
                break;
            case 'lava_rock':
                this.drawLavaRock(screenX, this.level.height - 40 - el.size, el.size);
                break;
            case 'pipe':
                this.drawPipe(screenX, this.level.height - 40 - el.height);
                break;
            case 'building':
                this.drawBuilding(screenX, this.level.height - 40 - el.height, el.width, el.variant);
                break;
            case 'statue':
                this.drawStatue(screenX, this.level.height - 40 - el.height, el.variant);
                break;
            case 'obelisk':
                this.drawObelisk(screenX, this.level.height - 40 - el.height, el.variant);
                break;
        }
    },

    drawTree(x, y, variant) {
        const trunkColor = '#3d2515';
        const leafColors = ['#2d5d2d', '#3d7d3d', '#4d8d4d', '#5d9d5d'];

        this.ctx.fillStyle = trunkColor;
        this.ctx.fillRect(x + 25, y + el.height - 30, 10, 30);

        this.ctx.fillStyle = leafColors[variant % leafColors.length];
        this.ctx.beginPath();
        this.ctx.moveTo(x + 15, y + 40);
        this.ctx.lineTo(x + 30, y);
        this.ctx.lineTo(x + 45, y + 40);
        this.ctx.closePath();
        this.ctx.fill();
    },

    drawStalactite(x, y, length) {
        this.ctx.fillStyle = '#4a4a6a';
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x - 8, y + length);
        this.ctx.lineTo(x + 8, y + length);
        this.ctx.closePath();
        this.ctx.fill();
    },

    drawCactus(x, y, variant) {
        this.ctx.fillStyle = '#4a7d4a';
        this.ctx.fillRect(x + 15, y, 10, 60);
        if (variant > 0) this.ctx.fillRect(x, y + 15, 10, 30);
        if (variant > 1) this.ctx.fillRect(x + 30, y + 10, 10, 40);
    },

    drawPine(x, y, variant) {
        this.ctx.fillStyle = '#2d4a2d';
        this.ctx.fillRect(x + 22, y + 60, 6, 20);

        this.ctx.fillStyle = '#1a3d1a';
        this.ctx.beginPath();
        this.ctx.moveTo(x + 10, y + 50);
        this.ctx.lineTo(x + 25, y);
        this.ctx.lineTo(x + 40, y + 50);
        this.ctx.closePath();
        this.ctx.fill();
    },

    drawPillar(x, y, variant) {
        this.ctx.fillStyle = '#5d5d5d';
        this.ctx.fillRect(x, y, 30, 80);
        this.ctx.fillStyle = '#3d3d3d';
        this.ctx.fillRect(x - 5, y - 10, 40, 10);
        this.ctx.fillRect(x - 5, y + 80, 40, 10);
    },

    drawLavaRock(x, y, size) {
        const gradient = this.ctx.createRadialGradient(x + size/2, y + size/2, 0, x + size/2, y + size/2, size/2);
        gradient.addColorStop(0, '#ff6600');
        gradient.addColorStop(0.5, '#cc3300');
        gradient.addColorStop(1, '#661100');
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
        this.ctx.fill();
    },

    drawPipe(x, y, height) {
        this.ctx.fillStyle = '#4a4a4a';
        this.ctx.fillRect(x, y, 40, height);
        this.ctx.fillStyle = '#3a3a3a';
        this.ctx.fillRect(x, y + height - 20, 40, 20);
    },

    drawBuilding(x, y, height, width, variant) {
        this.ctx.fillStyle = '#2d2d4d';
        this.ctx.fillRect(x, y, width, height);

        this.ctx.fillStyle = '#1a1a3a';
        for (let wy = y + 20; wy < y + height; wy += 30) {
            for (let wx = x + 10; wx < x + width - 10; wx += 20) {
                this.ctx.fillRect(wx, wy, 10, 15);
            }
        }
    },

    drawStatue(x, y, variant) {
        this.ctx.fillStyle = '#4d6d4d';
        this.ctx.fillRect(x + 10, y + 40, 20, 60);
        this.ctx.fillRect(x + 5, y + 20, 30, 20);
        this.ctx.beginPath();
        this.ctx.arc(x + 20, y + 15, 15, 0, Math.PI * 2);
        this.ctx.fill();
    },

    drawObelisk(x, y, variant) {
        const gradient = this.ctx.createLinearGradient(x, y, x, y + 100);
        gradient.addColorStop(0, '#8844aa');
        gradient.addColorStop(1, '#442266');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x, y, 20, 100);
        this.ctx.fillStyle = '#ffdd44';
        this.ctx.fillRect(x + 2, y + 10, 16, 16);
    },

    renderPlatforms() {
        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);

        this.level.platforms.forEach(platform => {
            if (!this.camera.isVisible(platform)) return;

            const color = this.level.getThemeColor('platform');
            const gradient = this.ctx.createLinearGradient(0, platform.y, 0, platform.y + platform.height);
            gradient.addColorStop(0, this.lightenColor(color, 20));
            gradient.addColorStop(1, this.darkenColor(color, 20));

            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

            this.ctx.strokeStyle = this.darkenColor(color, 40);
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);

            if (platform.breakable) {
                this.ctx.strokeStyle = '#ff8800';
                this.ctx.setLineDash([5, 5]);
                this.ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
                this.ctx.setLineDash([]);
            }

            if (platform.disappearing && !platform.solid) {
                this.ctx.globalAlpha = 0.3;
            }
        });

        this.ctx.restore();
    },

    lightenColor(color, amount) {
        const num = parseInt(color.replace('#', ''), 16);
        const r = Math.min(255, (num >> 16) + amount);
        const g = Math.min(255, ((num >> 8) & 0x00FF) + amount);
        const b = Math.min(255, (num & 0x0000FF) + amount);
        return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
    },

    darkenColor(color, amount) {
        const num = parseInt(color.replace('#', ''), 16);
        const r = Math.max(0, (num >> 16) - amount);
        const g = Math.max(0, ((num >> 8) & 0x00FF) - amount);
        const b = Math.max(0, (num & 0x0000FF) - amount);
        return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
    },

    renderHazards() {
        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);

        this.level.hazards.forEach(hazard => {
            if (!hazard.active || !this.camera.isVisible(hazard)) return;

            const color = this.level.getThemeColor('hazard');

            switch (hazard.type) {
                case 'spikes':
                case 'thorns':
                case 'ice_spikes':
                    this.ctx.fillStyle = color;
                    this.ctx.beginPath();
                    for (let i = 0; i < 5; i++) {
                        const px = hazard.x + i * 6;
                        this.ctx.moveTo(px, hazard.y + hazard.height);
                        this.ctx.lineTo(px + 3, hazard.y);
                        this.ctx.lineTo(px + 6, hazard.y + hazard.height);
                    }
                    this.ctx.fill();
                    break;
                case 'lava':
                    this.renderLava(hazard);
                    break;
                case 'electricity':
                    this.renderElectricity(hazard);
                    break;
                case 'laser':
                    this.renderLaser(hazard);
                    break;
                case 'fire_jets':
                    this.renderFireJet(hazard);
                    break;
                default:
                    this.ctx.fillStyle = color;
                    this.ctx.fillRect(hazard.x, hazard.y, hazard.width, hazard.height);
            }
        });

        this.ctx.restore();
    },

    renderLava(hazard) {
        const time = Date.now() * 0.005;
        const gradient = this.ctx.createLinearGradient(0, hazard.y, 0, hazard.y + hazard.height);
        gradient.addColorStop(0, '#ff8800');
        gradient.addColorStop(0.5, '#ff4400');
        gradient.addColorStop(1, '#aa0000');
        this.ctx.fillStyle = gradient;

        this.ctx.beginPath();
        this.ctx.moveTo(hazard.x, hazard.y + hazard.height);
        for (let i = 0; i <= hazard.width; i += 10) {
            const waveY = hazard.y + Math.sin(time + i * 0.5) * 5;
            this.ctx.lineTo(hazard.x + i, waveY);
        }
        this.ctx.lineTo(hazard.x + hazard.width, hazard.y + hazard.height);
        this.ctx.closePath();
        this.ctx.fill();
    },

    renderElectricity(hazard) {
        const time = Date.now() * 0.01;
        this.ctx.strokeStyle = '#44aaff';
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';

        for (let i = 0; i < 3; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(hazard.x + 5, hazard.y);
            for (let y = 0; y < hazard.height; y += 10) {
                const offset = Math.sin(time * 2 + y * 0.5 + i) * 8;
                this.ctx.lineTo(hazard.x + 5 + offset, hazard.y + y);
            }
            this.ctx.stroke();
        }
    },

    renderLaser(hazard) {
        if (hazard.timer % 2000 > 500) return;

        this.ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
        this.ctx.fillRect(hazard.x - 2, 0, hazard.width + 4, this.level.height);

        this.ctx.strokeStyle = '#ff0000';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([10, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(hazard.x + hazard.width / 2, 0);
        this.ctx.lineTo(hazard.x + hazard.width / 2, this.level.height);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    },

    renderFireJet(hazard) {
        const time = Date.now() * 0.01;
        const height = 50 + Math.sin(time * 3) * 20;

        const gradient = this.ctx.createLinearGradient(0, hazard.y, 0, hazard.y - height);
        gradient.addColorStop(0, '#ff8800');
        gradient.addColorStop(0.5, '#ff4400');
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        this.ctx.fillStyle = gradient;

        this.ctx.beginPath();
        this.ctx.moveTo(hazard.x, hazard.y);
        this.ctx.lineTo(hazard.x + hazard.width, hazard.y);
        this.ctx.lineTo(hazard.x + hazard.width / 2 + 10, hazard.y - height);
        this.ctx.lineTo(hazard.x + hazard.width / 2 - 10, hazard.y - height);
        this.ctx.closePath();
        this.ctx.fill();
    },

    renderCollectibles() {
        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);

        this.level.collectibles.forEach(collectible => {
            if (collectible.collected || !this.camera.isVisible(collectible)) return;

            const time = Date.now() * 0.005 + collectible.animOffset;
            const floatY = Math.sin(time) * 5;

            switch (collectible.type) {
                case 'coin':
                    this.drawCoin(collectible.x + collectible.width / 2, collectible.y + collectible.height / 2 + floatY);
                    break;
                case 'health':
                    this.drawHealthPickup(collectible.x + collectible.width / 2, collectible.y + collectible.height / 2 + floatY);
                    break;
                case 'gem':
                    this.drawGem(collectible.x + collectible.width / 2, collectible.y + collectible.height / 2 + floatY);
                    break;
            }
        });

        this.ctx.restore();
    },

    drawCoin(x, y) {
        const gradient = this.ctx.createRadialGradient(x - 2, y - 2, 0, x, y, 10);
        gradient.addColorStop(0, '#fff888');
        gradient.addColorStop(0.5, '#ffdd44');
        gradient.addColorStop(1, '#ccaa00');
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, 10, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#ffff88';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('$', x, y + 1);
    },

    drawHealthPickup(x, y) {
        this.ctx.fillStyle = '#ff4444';
        this.ctx.beginPath();
        this.ctx.arc(x - 4, y - 2, 8, 0, Math.PI * 2);
        this.ctx.arc(x + 4, y - 2, 8, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.moveTo(x - 10, y + 2);
        this.ctx.lineTo(x, y + 14);
        this.ctx.lineTo(x + 10, y + 2);
        this.ctx.closePath();
        this.ctx.fill();
    },

    drawGem(x, y) {
        this.ctx.fillStyle = '#44ffff';
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - 10);
        this.ctx.lineTo(x + 8, y);
        this.ctx.lineTo(x, y + 10);
        this.ctx.lineTo(x - 8, y);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.fillStyle = '#88ffff';
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - 6);
        this.ctx.lineTo(x + 4, y);
        this.ctx.lineTo(x, y + 6);
        this.ctx.lineTo(x - 4, y);
        this.ctx.closePath();
        this.ctx.fill();
    },

    renderCheckpoints() {
        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);

        this.level.checkpoints.forEach(checkpoint => {
            if (!this.camera.isVisible(checkpoint)) return;

            const color = this.level.getThemeColor('checkpoint');
            const time = Date.now() * 0.003;
            const pulse = Math.sin(time) * 3;

            this.ctx.fillStyle = checkpoint.activated ? this.lightenColor(color, 30) : color;
            this.ctx.fillRect(checkpoint.x, checkpoint.y, checkpoint.width, checkpoint.height);

            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(checkpoint.activated ? '✓' : '⚑', checkpoint.x + checkpoint.width / 2, checkpoint.y + 30);

            if (!checkpoint.activated) {
                this.ctx.strokeStyle = color;
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(checkpoint.x + checkpoint.width / 2, checkpoint.y + 30, 25 + pulse, 0, Math.PI * 2);
                this.ctx.stroke();
            }
        });

        this.ctx.restore();
    },

    renderExit() {
        if (!this.level.exit) return;

        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);

        const exit = this.level.exit;
        const time = Date.now() * 0.005;
        const pulse = Math.sin(time) * 5;

        const gradient = this.ctx.createRadialGradient(
            exit.x + exit.width / 2, exit.y + exit.height / 2, 0,
            exit.x + exit.width / 2, exit.y + exit.height / 2, 50 + pulse
        );
        gradient.addColorStop(0, 'rgba(100, 255, 150, 0.3)');
        gradient.addColorStop(1, 'rgba(100, 255, 150, 0)');
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(exit.x + exit.width / 2, exit.y + exit.height / 2, 50 + pulse, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#44ff88';
        this.ctx.fillRect(exit.x, exit.y, exit.width, exit.height);

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('EXIT', exit.x + exit.width / 2, exit.y + exit.height / 2 + 5);

        this.ctx.restore();
    },

    renderHitboxes() {
        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);
        this.ctx.strokeStyle = '#ff00ff';
        this.ctx.lineWidth = 1;

        this.ctx.strokeRect(this.player.x, this.player.y, this.player.width, this.player.height);

        if (this.player.attackTimer > 0) {
            const attackBox = this.player.getAttackBox();
            this.ctx.strokeStyle = '#ffff00';
            this.ctx.strokeRect(attackBox.x, attackBox.y, attackBox.width, attackBox.height);
        }

        this.level.platforms.forEach(p => {
            if (this.camera.isVisible(p)) {
                this.ctx.strokeStyle = p.solid ? '#00ff00' : '#ff0000';
                this.ctx.strokeRect(p.x, p.y, p.width, p.height);
            }
        });

        this.level.hazards.forEach(h => {
            if (h.active && this.camera.isVisible(h)) {
                this.ctx.strokeStyle = '#ff0000';
                this.ctx.strokeRect(h.x, h.y, h.width, h.height);
            }
        });

        this.ctx.restore();
    },

    renderFPS() {
        this.ctx.fillStyle = '#00ff00';
        this.ctx.font = '14px monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`FPS: ${this.fps}`, 10, 20);
        this.ctx.fillText(`Entities: ${this.enemySystem.enemies.length}`, 10, 40);
        this.ctx.fillText(`Particles: ${this.particleSystem.getCount()}`, 10, 60);
    },

    // New helper methods

    applyDailyChallengeModifiers() {
        const type = this.dailyChallengeType;
        switch (type) {
            case 'speed':
                this.level.parTime = Math.floor(this.level.parTime * 0.7);
                break;
            case 'coins':
                this.level.collectibles.forEach(c => {
                    if (c.type === 'coin') c.value *= 2;
                });
                break;
            case 'survival':
                this.player.lives = 1;
                break;
            case 'pacifist':
                this.player.attackDisabled = true;
                break;
            case 'bossRush':
                // Spawn multiple bosses
                break;
            case 'noHit':
                this.player.oneHitDeath = true;
                break;
            case 'comboMaster':
                this.comboRequired = 50;
                break;
        }
    },

    completeDailyChallenge() {
        const type = this.dailyChallengeType;
        const rewards = CONFIG.dailyChallenge.rewards[type] || { coins: 100, xp: 50 };
        this.saveSystem.addCoins(rewards.coins);
        this.saveSystem.updateDailyStreak(true);
        this.dailyChallengeType = null;
    },

    applyDailyChallengeModifiers() {
        // Apply modifiers based on daily challenge type
    },

    updateMaxCombo() {
        if (this.player.comboCount > this.maxComboThisLevel) {
            this.maxComboThisLevel = this.player.comboCount;
        }
    },

    updateGhostReplay() {
        // Ghost replay is recorded via interval in startLevel
    },

    updateHitFreeze() {
        if (this.player.hitFreezeTimer > 0) {
            this.hitFreezeActive = true;
            this.hitFreezeTimer = this.player.hitFreezeTimer;
        } else {
            this.hitFreezeActive = false;
        }
    },

    updateScreenShake() {
        if (this.screenShakeIntensity > 0) {
            this.screenShakeIntensity *= 0.9;
            if (this.screenShakeIntensity < 0.5) this.screenShakeIntensity = 0;
        }
    },

    updateTutorial() {
        if (!this.tutorialActive) return;
        const tutorial = SaveSystem.getTutorial();
        if (tutorial.completed) {
            this.tutorialActive = false;
        }
    },

    updateSecrets() {
        // Check for secret areas
        this.level.collectibles.forEach(c => {
            if (c.type === 'secret' && !c.found && Collision.playerCollectible(this.player, c)) {
                c.found = true;
                this.secretsFound++;
                this.player.addCoins(100);
                this.player.addFloatingText('SECRET FOUND!', '#ffdd00');
                SaveSystem.updateStatistics({ secretsFound: 1 });
            }
        });
    },

    renderGhostReplay() {
        if (this.ghostReplayInputs.length === 0) return;
        // Render ghost player
        const ghost = this.ghostReplayInputs[0]; // Simplified
        if (ghost) {
            this.ctx.save();
            this.ctx.globalAlpha = 0.3;
            this.ctx.translate(-this.camera.x, -this.camera.y);
            this.ctx.fillStyle = '#8888ff';
            this.ctx.fillRect(ghost.x, ghost.y, this.player.width, this.player.height);
            this.ctx.restore();
        }
    },

    renderHitFreezeEffect() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    },

    renderTutorialOverlay() {
        const tutorial = SaveSystem.getTutorial();
        const currentStep = CONFIG.tutorial.steps[tutorial.currentStep];
        if (!currentStep) return;

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, this.canvas.height - 100, this.canvas.width, 100);

        this.ctx.fillStyle = '#ffdd44';
        this.ctx.font = 'bold 18px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(currentStep.text, this.canvas.width / 2, this.canvas.height - 60);

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '14px Arial';
        this.ctx.fillText(`Step ${tutorial.currentStep + 1} / ${CONFIG.tutorial.steps.length}`, this.canvas.width / 2, this.canvas.height - 30);
    },

    renderSecretsIndicator() {
        if (this.secretsFound > 0) {
            this.ctx.fillStyle = '#ffdd00';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'right';
            this.ctx.fillText(`🔍 Secrets: ${this.secretsFound}`, this.canvas.width - 20, 40);
        }
    },

    renderSecretsIndicator() {
        if (this.secretsFound > 0) {
            this.ctx.fillStyle = '#ffdd00';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'right';
            this.ctx.fillText(`🔍 Secrets: ${this.secretsFound}`, this.canvas.width - 20, 40);
        }
    },

    renderHitFreezeEffect() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    },

    renderTutorialOverlay() {
        const tutorial = SaveSystem.getTutorial();
        const currentStep = CONFIG.tutorial.steps[tutorial.currentStep];
        if (!currentStep) return;

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, this.canvas.height - 100, this.canvas.width, 100);

        this.ctx.fillStyle = '#ffdd44';
        this.ctx.font = 'bold 18px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(currentStep.text, this.canvas.width / 2, this.canvas.height - 60);

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '14px Arial';
        this.ctx.fillText(`Step ${tutorial.currentStep + 1} / ${CONFIG.tutorial.steps.length}`, this.canvas.width / 2, this.canvas.height - 30);
    },

    renderSecretsIndicator() {
        if (this.secretsFound > 0) {
            this.ctx.fillStyle = '#ffdd00';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'right';
            this.ctx.fillText(`🔍 Secrets: ${this.secretsFound}`, this.canvas.width - 20, 40);
        }
    },

    // Camera shake
    shakeCamera(intensity) {
        this.screenShakeIntensity = Math.max(this.screenShakeIntensity, intensity);
    },

    // Slow motion
    setSlowMotion(factor) {
        this.slowMotionFactor = factor;
    },

    // Hit freeze
    triggerHitFreeze(duration) {
        this.hitFreezeActive = true;
        this.hitFreezeTimer = duration;
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Game;
}