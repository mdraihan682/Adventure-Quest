const UI = {
    currentScreen: 'mainMenu',
    screens: {},
    animations: {},
    selectedLevel: 1,
    levelSelectScroll: 0,
    shopCategory: 'coins',
    settingsMenuOpen: false,

    init() {
        this.createScreens();
        this.bindEvents();
    },

    createScreens() {
        this.screens = {
            mainMenu: this.createMainMenu(),
            levelSelect: this.createLevelSelect(),
            shop: this.createShop(),
            achievements: this.createAchievements(),
            settings: this.createSettings(),
            credits: this.createCredits(),
            pause: this.createPauseMenu(),
            gameOver: this.createGameOver(),
            levelComplete: this.createLevelComplete(),
            victory: this.createVictory(),
            dailyChallenge: this.createDailyChallenge(),
            meta: this.createMetaScreen(),
            skillTree: this.createSkillTreeScreen()
        };
    },

    createMainMenu() {
        const container = document.createElement('div');
        container.className = 'menu-screen';
        container.id = 'screen-mainMenu';
        container.innerHTML = `
            <h1 class="menu-title">Adventure Quest</h1>
            <p class="menu-subtitle">A 100-Level 2D Action-Platform Adventure</p>
            <div class="menu-buttons">
                <button class="menu-btn" data-action="continue">Continue</button>
                <button class="menu-btn" data-action="newGame">New Game</button>
                <button class="menu-btn" data-action="levelSelect">Level Select</button>
                <button class="menu-btn" data-action="shop">Shop</button>
                <button class="menu-btn" data-action="achievements">Achievements</button>
                <button class="menu-btn" data-action="settings">Settings</button>
                <button class="menu-btn" data-action="credits">Credits</button>
            </div>
            <div class="credits">Built with HTML5 Canvas & Vanilla JS</div>
        `;
        return container;
    },

    createLevelSelect() {
        const container = document.createElement('div');
        container.className = 'menu-screen';
        container.id = 'screen-levelSelect';
        container.innerHTML = `
            <h1 class="menu-title">Level Select</h1>
            <div class="menu-subtitle">Select a level to play</div>
            <div class="level-grid" id="level-grid"></div>
            <div class="menu-buttons" style="margin-top: 20px;">
                <button class="menu-btn" data-action="back">Back</button>
            </div>
        `;
        return container;
    },

    createShop() {
        const container = document.createElement('div');
        container.className = 'menu-screen';
        container.id = 'screen-shop';
        container.innerHTML = `
            <h1 class="menu-title">Shop</h1>
            <div class="menu-subtitle">Coins: <span id="shop-coins">0</span></div>
            <div class="shop-tabs" id="shop-tabs"></div>
            <div class="shop-grid" id="shop-grid"></div>
            <div class="menu-buttons" style="margin-top: 20px;">
                <button class="menu-btn" data-action="restorePurchases">Restore Purchases</button>
                <button class="menu-btn" data-action="back">Back</button>
            </div>
        `;
        return container;
    },

    createAchievements() {
        const container = document.createElement('div');
        container.className = 'menu-screen';
        container.id = 'screen-achievements';
        container.innerHTML = `
            <h1 class="menu-title">Achievements</h1>
            <div class="achievement-list" id="achievement-list"></div>
            <div class="menu-buttons" style="margin-top: 20px;">
                <button class="menu-btn" data-action="back">Back</button>
            </div>
        `;
        return container;
    },

    createSettings() {
        const container = document.createElement('div');
        container.className = 'menu-screen';
        container.id = 'screen-settings';
        container.innerHTML = `
            <h1 class="menu-title">Settings</h1>
            <div class="settings-list" id="settings-list"></div>
            <div class="menu-buttons" style="margin-top: 20px;">
                <button class="menu-btn" data-action="resetSave">Reset Save Data</button>
                <button class="menu-btn" data-action="back">Back</button>
            </div>
        `;
        return container;
    },

    createCredits() {
        const container = document.createElement('div');
        container.className = 'menu-screen';
        container.id = 'screen-credits';
        container.innerHTML = `
            <h1 class="menu-title">Credits</h1>
            <div class="credits">
                <p><strong>Adventure Quest</strong></p>
                <p>A 100-Level 2D Action-Platform Adventure</p>
                <p>Built with HTML5 Canvas & Vanilla JavaScript</p>
                <p>No game engines, no frameworks</p>
                <p>Designed for low-end devices</p>
                <p>Offline-first gameplay</p>
                <p>&copy; 2026</p>
            </div>
            <div class="menu-buttons" style="margin-top: 20px;">
                <button class="menu-btn" data-action="back">Back</button>
            </div>
        `;
        return container;
    },

    createPauseMenu() {
        const container = document.createElement('div');
        container.className = 'menu-screen';
        container.id = 'screen-pause';
        container.style.display = 'none';
        container.innerHTML = `
            <h1 class="menu-title">Paused</h1>
            <div class="menu-buttons">
                <button class="menu-btn" data-action="resume">Resume</button>
                <button class="menu-btn" data-action="restart">Restart Level</button>
                <button class="menu-btn" data-action="settings">Settings</button>
                <button class="menu-btn" data-action="mainMenu">Main Menu</button>
            </div>
        `;
        return container;
    },

    createGameOver() {
        const container = document.createElement('div');
        container.className = 'menu-screen game-over';
        container.id = 'screen-gameOver';
        container.style.display = 'none';
        container.innerHTML = `
            <h1 class="menu-title" style="color: #ff4444;">Game Over</h1>
            <div class="level-stats">
                <div class="stat">
                    <span class="stat-label">Level</span>
                    <span class="stat-value" id="go-level">1</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Score</span>
                    <span class="stat-value" id="go-score">0</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Coins</span>
                    <span class="stat-value" id="go-coins">0</span>
                </div>
            </div>
            <div class="menu-buttons">
                <button class="menu-btn" data-action="retry">Retry</button>
                <button class="menu-btn" data-action="levelSelect">Level Select</button>
                <button class="menu-btn" data-action="mainMenu">Main Menu</button>
            </div>
        `;
        return container;
    },

    createLevelComplete() {
        const container = document.createElement('div');
        container.className = 'menu-screen level-complete';
        container.id = 'screen-levelComplete';
        container.style.display = 'none';
        container.innerHTML = `
            <h1 class="menu-title" style="color: #44ff88;">Level Complete!</h1>
            <div class="level-stats">
                <div class="stat">
                    <span class="stat-label">Time</span>
                    <span class="stat-value" id="lc-time">0:00</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Coins</span>
                    <span class="stat-value" id="lc-coins">0</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Score</span>
                    <span class="stat-value" id="lc-score">0</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Stars</span>
                    <span class="stat-value" id="lc-stars">★☆☆</span>
                </div>
            </div>
            <div class="menu-buttons">
                <button class="menu-btn" data-action="nextLevel">Next Level</button>
                <button class="menu-btn" data-action="replay">Replay</button>
                <button class="menu-btn" data-action="levelSelect">Level Select</button>
            </div>
        `;
        return container;
    },

    createVictory() {
        const container = document.createElement('div');
        container.className = 'menu-screen victory';
        container.id = 'screen-victory';
        container.style.display = 'none';
        container.innerHTML = `
            <h1 class="menu-title">CONGRATULATIONS!</h1>
            <h2 class="menu-title" style="font-size: 24px;">YOU COMPLETED ALL 100 LEVELS!</h2>
            <div class="level-stats">
                <div class="stat">
                    <span class="stat-label">Total Score</span>
                    <span class="stat-value" id="vic-total-score">0</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Total Coins</span>
                    <span class="stat-value" id="vic-total-coins">0</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Play Time</span>
                    <span class="stat-value" id="vic-time">0:00:00</span>
                </div>
            </div>
            <div class="menu-buttons">
                <button class="menu-btn" data-action="replayAll">Replay Levels</button>
                <button class="menu-btn" data-action="levelSelect">Level Select</button>
                <button class="menu-btn" data-action="mainMenu">Main Menu</button>
            </div>
        `;
        return container;
    },

    createDailyChallenge() {
        const container = document.createElement('div');
        container.className = 'menu-screen';
        container.id = 'screen-dailyChallenge';
        container.innerHTML = `
            <h1 class="menu-title">Daily Challenge</h1>
            <div class="daily-challenge" id="daily-challenge-content"></div>
            <div class="menu-buttons">
                <button class="menu-btn" id="daily-play-btn" data-action="playDaily">Play Challenge</button>
                <button class="menu-btn" data-action="back">Back</button>
            </div>
        `;
        return container;
    },

    createMetaScreen() {
        const container = document.createElement('div');
        container.className = 'menu-screen';
        container.id = 'screen-meta';
        container.innerHTML = `
            <h1 class="menu-title">Meta Progression</h1>
            <div class="menu-subtitle">Prestige Level: <span id="meta-prestige-level">0</span> | Points: <span id="meta-points">0</span></div>
            <div class="menu-buttons" style="flex-wrap: wrap; gap: 8px;">
                <button class="menu-btn" data-action="skillTree">Skill Tree</button>
                <button class="menu-btn" data-action="upgradeMenu">Upgrades</button>
                <button class="menu-btn" data-action="prestige">Prestige</button>
                <button class="menu-btn" data-action="back">Back</button>
            </div>
            <div id="meta-upgrades-container" style="margin-top: 20px; max-height: 400px; overflow-y: auto;"></div>
        `;
        return container;
    },

    createSkillTreeScreen() {
        const container = document.createElement('div');
        container.className = 'menu-screen';
        container.id = 'screen-skillTree';
        container.innerHTML = `
            <h1 class="menu-title">Skill Tree</h1>
            <div class="menu-subtitle">Prestige Points: <span id="skill-points">0</span></div>
            <div class="skill-tree-tabs" id="skill-tabs" style="display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap;"></div>
            <div class="skill-tree-grid" id="skill-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; max-height: 400px; overflow-y: auto;"></div>
            <div class="menu-buttons" style="margin-top: 20px;">
                <button class="menu-btn" data-action="meta">Back to Meta</button>
                <button class="menu-btn" data-action="back">Back</button>
            </div>
        `;
        return container;
    },

    bindEvents() {
        document.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.closest('[data-action]').dataset.action;
                this.handleAction(action);
                AudioSystem.play('menuConfirm');
            });
        });

        document.getElementById('shop-tabs')?.addEventListener('click', (e) => {
            const tab = e.target.closest('[data-category]');
            if (tab) {
                this.shopCategory = tab.dataset.category;
                this.renderShop();
            }
        });

        document.getElementById('level-grid')?.addEventListener('click', (e) => {
            const btn = e.target.closest('.level-btn');
            if (btn && !btn.classList.contains('locked')) {
                this.selectedLevel = parseInt(btn.dataset.level);
                this.handleAction('playLevel');
            }
        });
    },

    handleAction(action) {
        switch (action) {
            case 'continue':
                Game.continueGame();
                break;
            case 'newGame':
                Game.newGame();
                break;
            case 'levelSelect':
                this.showScreen('levelSelect');
                this.renderLevelSelect();
                break;
            case 'shop':
                this.showScreen('shop');
                this.renderShop();
                break;
            case 'achievements':
                this.showScreen('achievements');
                this.renderAchievements();
                break;
            case 'settings':
                this.showScreen('settings');
                this.renderSettings();
                break;
            case 'credits':
                this.showScreen('credits');
                break;
            case 'back':
                this.showScreen('mainMenu');
                break;
            case 'resume':
                Game.resume();
                break;
            case 'restart':
                Game.restartLevel();
                break;
            case 'mainMenu':
                Game.returnToMenu();
                break;
            case 'retry':
                Game.restartLevel();
                break;
            case 'nextLevel':
                Game.nextLevel();
                break;
            case 'replay':
                Game.restartLevel();
                break;
            case 'playLevel':
                Game.startLevel(this.selectedLevel);
                break;
            case 'replayAll':
                Game.returnToMenu();
                break;
            case 'playDaily':
                Game.startDailyChallenge();
                break;
            case 'restorePurchases':
                Billing.restorePurchases();
                break;
            case 'resetSave':
                if (confirm('Reset all save data? This cannot be undone.')) {
                    SaveSystem.reset();
                    location.reload();
                }
                break;
            case 'meta':
                this.showScreen('meta');
                this.renderMeta();
                break;
            case 'skillTree':
                this.showScreen('skillTree');
                this.renderSkillTree();
                break;
            case 'upgradeMenu':
                this.showScreen('meta');
                this.renderMetaUpgrades();
                break;
            case 'prestige':
                this.handlePrestige();
                break;
            case 'unlockSkill':
                this.handleUnlockSkill(action.dataset.skill, action.dataset.tree);
                break;
            case 'buyUpgrade':
                this.handleBuyUpgrade(action.dataset.upgrade);
                break;
        }
    },

    showScreen(screenName) {
        Object.values(this.screens).forEach(screen => {
            screen.style.display = 'none';
        });

        const screen = this.screens[screenName];
        if (screen) {
            screen.style.display = 'flex';
            this.currentScreen = screenName;
        }
    },

    showOverlay(screenName) {
        const screen = this.screens[screenName];
        if (screen) {
            screen.style.display = 'flex';
        }
    },

    hideOverlay(screenName) {
        const screen = this.screens[screenName];
        if (screen) {
            screen.style.display = 'none';
        }
    },

    // Meta Progression Screens
    renderMeta() {
        const meta = SaveSystem.getMeta();
        const container = document.getElementById('meta-upgrades-container');
        if (!container) return;

        container.innerHTML = `
            <div class="meta-section">
                <h3>Upgrades</h3>
                <div class="upgrade-grid" id="upgrade-grid"></div>
            </div>
            <div class="meta-section">
                <h3>Prestige Rewards</h3>
                <div class="prestige-rewards" id="prestige-rewards"></div>
            </div>
        `;

        this.renderUpgradeGrid();
        this.renderPrestigeRewards();
    },

    renderMetaUpgrades() {
        this.renderMeta();
    },

    renderUpgradeGrid() {
        const grid = document.getElementById('upgrade-grid');
        if (!grid) return;

        const meta = SaveSystem.getMeta();
        const upgrades = CONFIG.meta.upgrades;

        grid.innerHTML = Object.entries(upgrades).map(([id, upgrade]) => {
            const level = meta.upgrades[id] || 0;
            const maxed = level >= upgrade.maxLevel;
            const cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, level));
            const canAfford = SaveSystem.getSettings().totalCoins >= cost;

            return `
                <div class="upgrade-item ${maxed ? 'maxed' : ''} ${!canAfford ? 'unaffordable' : ''}" data-upgrade="${id}">
                    <div class="upgrade-name">${upgrade.name}</div>
                    <div class="upgrade-desc">${upgrade.desc}</div>
                    <div class="upgrade-level">Level ${level} / ${upgrade.maxLevel}</div>
                    <div class="upgrade-cost">${maxed ? 'MAXED' : `${cost} coins`}</div>
                    <button class="menu-btn small ${maxed || !canAfford ? 'disabled' : ''}" data-action="buyUpgrade" data-upgrade="${id}" ${maxed || !canAfford ? 'disabled' : ''}>
                        ${maxed ? 'Maxed' : 'Upgrade'}
                    </button>
                </div>
            `;
        }).join('');

        grid.querySelectorAll('.upgrade-item button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const upgradeId = e.target.dataset.upgrade;
                this.handleBuyUpgrade(upgradeId);
            });
        });
    },

    renderPrestigeRewards() {
        const container = document.getElementById('prestige-rewards');
        if (!container) return;

        const meta = SaveSystem.getMeta();
        const rewards = CONFIG.meta.prestige.rewards;

        container.innerHTML = Object.entries(rewards).map(([level, reward]) => {
            const unlocked = meta.prestigeLevel >= parseInt(level);
            return `
                <div class="prestige-reward ${unlocked ? 'unlocked' : ''}">
                    <div class="reward-level">Prestige ${level}</div>
                    <div class="reward-name">${reward.name}</div>
                    <div class="reward-type">${reward.type}</div>
                    ${unlocked ? '<span class="reward-status">UNLOCKED</span>' : '<span class="reward-status">LOCKED</span>'}
                </div>
            `;
        }).join('');
    },

    renderSkillTree() {
        const tabs = document.getElementById('skill-tabs');
        const grid = document.getElementById('skill-grid');
        const pointsEl = document.getElementById('skill-points');

        if (!tabs || !grid) return;

        const meta = SaveSystem.getMeta();
        if (pointsEl) pointsEl.textContent = meta.prestigePoints;

        const trees = ['combat', 'mobility', 'utility'];
        this.currentSkillTree = this.currentSkillTree || 'combat';

        tabs.innerHTML = trees.map(tree => `
            <button class="menu-btn small ${this.currentSkillTree === tree ? 'active' : ''}" data-skill-tree="${tree}" style="flex:1;">
                ${tree.charAt(0).toUpperCase() + tree.slice(1)}
            </button>
        `).join('');

        tabs.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', () => {
                this.currentSkillTree = btn.dataset.skillTree;
                this.renderSkillTree();
            });
        });

        const skills = CONFIG.meta.skillTree[this.currentSkillTree] || [];
        const unlockedSkills = meta.skillTree[this.currentSkillTree] || {};

        grid.innerHTML = skills.map(skill => {
            const unlocked = unlockedSkills[skill.id] === true;
            const canUnlock = !unlocked && (!skill.req || unlockedSkills[skill.req]);
            const cost = skill.cost;

            return `
                <div class="skill-item ${unlocked ? 'unlocked' : ''} ${canUnlock ? '' : 'locked'}" data-skill="${skill.id}" data-tree="${this.currentSkillTree}">
                    <div class="skill-icon">${skill.icon}</div>
                    <div class="skill-name">${skill.name}</div>
                    <div class="skill-desc">${skill.desc}</div>
                    <div class="skill-cost">${cost} PP</div>
                    <button class="menu-btn small ${unlocked || !canUnlock ? 'disabled' : ''}" data-action="unlockSkill" data-skill="${skill.id}" data-tree="${this.currentSkillTree}" ${unlocked || !canUnlock ? 'disabled' : ''}>
                        ${unlocked ? 'Unlocked' : 'Unlock'}
                    </button>
                </div>
            `;
        }).join('');

        grid.querySelectorAll('.skill-item button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleUnlockSkill(e.target.dataset.skill, e.target.dataset.tree);
            });
        });
    },

    handleBuyUpgrade(upgradeId) {
        if (SaveSystem.upgradeMeta(upgradeId)) {
            this.renderUpgradeGrid();
            this.showNotification('Upgrade purchased!');
        } else {
            this.showNotification('Not enough coins or max level reached!');
        }
    },

    handleUnlockSkill(skillId, tree) {
        if (SaveSystem.unlockSkillTree(skillId, tree)) {
            this.renderSkillTree();
            this.showNotification('Skill unlocked!');
        } else {
            this.showNotification('Cannot unlock: requirements not met or not enough points!');
        }
    },

    handlePrestige() {
        if (confirm('Prestige will reset your level progress but keep all cosmetics, stats, and meta upgrades. Continue?')) {
            if (SaveSystem.prestige()) {
                this.showNotification('Prestige successful! You are now stronger.');
                this.renderMeta();
                this.renderSkillTree();
            }
        }
    },

    renderMetaUpgrades() {
        this.renderMeta();
    },

    renderLevelSelect() {
        const grid = document.getElementById('level-grid');
        if (!grid) return;

        const saveData = SaveSystem.load() || SaveSystem.defaultSave();
        const unlockedLevels = saveData.unlockedLevels || [1];
        const completedLevels = saveData.completedLevels || [];
        const bestScores = saveData.bestScores || {};
        const levelStars = saveData.levelStars || {};

        grid.innerHTML = '';

        for (let i = 1; i <= CONFIG.progression.totalLevels; i++) {
            const unlocked = unlockedLevels.includes(i);
            const completed = completedLevels.includes(i);
            const stars = levelStars[i] || 0;
            const bestScore = bestScores[i] || 0;
            const theme = LevelSystem.getThemeForLevel(i);

            const btn = document.createElement('button');
            btn.className = `level-btn ${unlocked ? '' : 'locked'} ${completed ? 'completed' : ''} ${Game.currentLevel === i ? 'current' : ''}`;
            btn.dataset.level = i;

            let starsHtml = '';
            for (let s = 1; s <= 3; s++) {
                starsHtml += `<span class="level-star ${s <= stars ? 'filled' : ''}">★</span>`;
            }

            btn.innerHTML = `
                <span class="level-number">${i}</span>
                <div class="level-stars">${starsHtml}</div>
                <span class="level-theme" style="font-size: 10px; color: ${this.getThemeColor(theme)};">${CONFIG.level.themeNames[theme]}</span>
            `;

            if (!unlocked) {
                btn.innerHTML += '<span style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:20px;">🔒</span>';
            }

            grid.appendChild(btn);
        }
    },

    getThemeColor(theme) {
        const colors = {
            forest: '#4a7c4a',
            cave: '#6688ff',
            desert: '#ffaa44',
            snow: '#44aaff',
            ruins: '#88cc88',
            volcano: '#ff8844',
            factory: '#00ffaa',
            nightcity: '#00ffff',
            temple: '#ffdd44',
            final: '#ffff44'
        };
        return colors[theme] || '#ffffff';
    },

    renderShop() {
        const coinsEl = document.getElementById('shop-coins');
        const saveData = SaveSystem.load() || SaveSystem.defaultSave();
        if (coinsEl) coinsEl.textContent = saveData.totalCoins || 0;

        const tabs = document.getElementById('shop-tabs');
        const categories = CONFIG.shop.categories;
        tabs.innerHTML = categories.map(cat => `
            <button class="menu-btn small ${this.shopCategory === cat ? 'active' : ''}" data-category="${cat}" style="flex:1;padding:8px;font-size:12px;">
                ${cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
        `).join('');

        const grid = document.getElementById('shop-grid');
        const items = Object.values(CONFIG.shop.items).filter(item => item.category === this.shopCategory);

        grid.innerHTML = items.map(item => {
            const owned = this.isItemOwned(item.id, saveData);
            const canAfford = saveData.totalCoins >= (parseFloat(item.price) * 100) || item.price === '0.00';

            return `
                <div class="shop-item ${owned ? 'owned' : ''}" data-item="${item.id}">
                    <div class="shop-icon">${item.icon}</div>
                    <div class="shop-name">${item.name}</div>
                    <div class="shop-price ${item.cosmetic ? 'free' : ''}">
                        ${item.cosmetic || item.consumable ? 'Owned' : item.price === '0.00' ? 'Free' : '$' + item.price}
                    </div>
                </div>
            `;
        }).join('');

        grid.querySelectorAll('.shop-item').forEach(item => {
            item.addEventListener('click', () => this.purchaseItem(item.dataset.item));
        });
    },

    isItemOwned(itemId, saveData) {
        const item = CONFIG.shop.items[itemId];
        if (!item) return false;

        if (item.cosmetic) {
            const type = item.category === 'skins' ? 'skins' : 'trails';
            return saveData.cosmetics?.[type]?.includes(itemId) || false;
        }
        if (item.consumable) {
            return (saveData.inventory?.[itemId] || 0) > 0;
        }
        return false;
    },

    purchaseItem(itemId) {
        const item = CONFIG.shop.items[itemId];
        if (!item) return;

        const saveData = SaveSystem.load() || SaveSystem.defaultSave();

        if (this.isItemOwned(itemId, saveData)) {
            if (item.cosmetic) {
                const type = item.category === 'skins' ? 'Skin' : 'Trail';
                SaveSystem.equipCosmetic(item.category === 'skins' ? 'skins' : 'trails', itemId);
                this.showNotification(`${type} equipped!`);
            }
            return;
        }

        if (item.consumable) {
            if (saveData.totalCoins >= item.price * 100) {
                SaveSystem.spendCoins(item.price * 100);
                SaveSystem.addInventoryItem(itemId, 1);
                this.showNotification(`Purchased ${item.name}!`);
                this.renderShop();
            } else {
                this.showNotification('Not enough coins!');
            }
            return;
        }

        if (item.cosmetic) {
            if (saveData.totalCoins >= item.price * 100) {
                SaveSystem.spendCoins(item.price * 100);
                SaveSystem.addCosmetic(item.category === 'skins' ? 'skins' : 'trails', itemId);
                SaveSystem.equipCosmetic(item.category === 'skins' ? 'skins' : 'trails', itemId);
                this.showNotification(`Purchased ${item.name}!`);
                this.renderShop();
            } else {
                this.showNotification('Not enough coins!');
            }
            return;
        }

        if (item.category === 'coins') {
            Billing.purchaseProduct(itemId);
            return;
        }

        Billing.purchaseProduct(itemId);
    },

    renderAchievements() {
        const list = document.getElementById('achievement-list');
        const saveData = SaveSystem.load() || SaveSystem.defaultSave();
        const achievements = saveData.achievements || {};

        list.innerHTML = CONFIG.achievements.list.map(achievement => {
            const unlocked = achievements[achievement.id]?.unlocked || false;
            const progress = saveData.achievementProgress?.[achievement.type] || 0;
            const target = achievement.target;

            return `
                <div class="achievement-item ${unlocked ? 'unlocked' : ''}">
                    <div class="achievement-icon">${achievement.icon}</div>
                    <div class="achievement-info">
                        <div class="achievement-name">${achievement.name} ${unlocked ? '✓' : ''}</div>
                        <div class="achievement-desc">${achievement.desc} ${!unlocked ? `(${Math.min(progress, target)}/${target})` : ''}</div>
                    </div>
                </div>
            `;
        }).join('');
    },

    renderSettings() {
        const list = document.getElementById('settings-list');
        const settings = SaveSystem.getSettings();

        list.innerHTML = `
            <div class="setting-item">
                <span class="setting-label">Master Volume</span>
                <div class="setting-control">
                    <input type="range" class="slider" id="setting-master" min="0" max="100" value="${Math.round(settings.masterVolume * 100)}">
                    <span class="slider-value">${Math.round(settings.masterVolume * 100)}%</span>
                </div>
            </div>
            <div class="setting-item">
                <span class="setting-label">Music Volume</span>
                <div class="setting-control">
                    <input type="range" class="slider" id="setting-music" min="0" max="100" value="${Math.round(settings.musicVolume * 100)}">
                    <span class="slider-value">${Math.round(settings.musicVolume * 100)}%</span>
                </div>
            </div>
            <div class="setting-item">
                <span class="setting-label">SFX Volume</span>
                <div class="setting-control">
                    <input type="range" class="slider" id="setting-sfx" min="0" max="100" value="${Math.round(settings.sfxVolume * 100)}">
                    <span class="slider-value">${Math.round(settings.sfxVolume * 100)}%</span>
                </div>
            </div>
            <div class="setting-item">
                <span class="setting-label">Audio Enabled</span>
                <div class="setting-control">
                    <div class="toggle ${settings.audioEnabled ? 'active' : ''}" id="toggle-audio"></div>
                </div>
            </div>
            <div class="setting-item">
                <span class="setting-label">Vibration</span>
                <div class="setting-control">
                    <div class="toggle ${settings.vibrationEnabled ? 'active' : ''}" id="toggle-vibration"></div>
                </div>
            </div>
            <div class="setting-item">
                <span class="setting-label">Show FPS</span>
                <div class="setting-control">
                    <div class="toggle ${settings.showFPS ? 'active' : ''}" id="toggle-fps"></div>
                </div>
            </div>
            <div class="setting-item">
                <span class="setting-label">Show Hitboxes</span>
                <div class="setting-control">
                    <div class="toggle ${settings.showHitboxes ? 'active' : ''}" id="toggle-hitboxes"></div>
                </div>
            </div>
            <div class="setting-item">
                <span class="setting-label">Reduced Motion</span>
                <div class="setting-control">
                    <div class="toggle ${settings.reducedMotion ? 'active' : ''}" id="toggle-reduced"></div>
                </div>
            </div>
            <div class="setting-item">
                <span class="setting-label">High Contrast</span>
                <div class="setting-control">
                    <div class="toggle ${settings.highContrast ? 'active' : ''}" id="toggle-contrast"></div>
                </div>
            </div>
        `;

        document.getElementById('setting-master')?.addEventListener('input', (e) => {
            AudioSystem.setMasterVolume(e.target.value / 100);
            e.target.nextElementSibling.textContent = e.target.value + '%';
        });

        document.getElementById('setting-music')?.addEventListener('input', (e) => {
            AudioSystem.setMusicVolume(e.target.value / 100);
            e.target.nextElementSibling.textContent = e.target.value + '%';
        });

        document.getElementById('setting-sfx')?.addEventListener('input', (e) => {
            AudioSystem.setSfxVolume(e.target.value / 100);
            e.target.nextElementSibling.textContent = e.target.value + '%';
        });

        const toggles = {
            'toggle-audio': 'audioEnabled',
            'toggle-vibration': 'vibrationEnabled',
            'toggle-fps': 'showFPS',
            'toggle-hitboxes': 'showHitboxes',
            'toggle-reduced': 'reducedMotion',
            'toggle-contrast': 'highContrast'
        };

        Object.entries(toggles).forEach(([id, key]) => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('click', () => {
                    el.classList.toggle('active');
                    SaveSystem.updateSetting(key, el.classList.contains('active'));
                    if (key === 'audioEnabled') AudioSystem.toggleAudio(el.classList.contains('active'));
                });
            }
        });
    },

    renderDailyChallenge() {
        const content = document.getElementById('daily-challenge-content');
        const saveData = SaveSystem.load() || SaveSystem.defaultSave();
        const today = Utils.getDateString();
        const challenge = saveData.dailyChallenge || {};

        if (challenge.lastDate === today && challenge.completed) {
            content.innerHTML = `
                <div class="daily-title">Challenge Complete!</div>
                <div class="daily-desc">You've already completed today's challenge.</div>
                <div class="daily-reward">Reward: ${challenge.bestScore} coins</div>
            `;
            document.getElementById('daily-play-btn').style.display = 'none';
        } else {
            const dayOfYear = Utils.getDayOfYear();
            const challengeTypes = CONFIG.dailyChallenge.types;
            const type = challengeTypes[dayOfYear % challengeTypes.length];
            const rewards = CONFIG.dailyChallenge.rewards[type];

            const descriptions = {
                speed: 'Complete the level as fast as possible!',
                coins: 'Collect as many coins as you can!',
                survival: 'Complete the level without dying!',
                pacifist: 'Complete the level without attacking!'
            };

            content.innerHTML = `
                <div class="daily-title">${type.charAt(0).toUpperCase() + type.slice(1)} Challenge</div>
                <div class="daily-desc">${descriptions[type]}</div>
                <div class="daily-reward">Reward: ${rewards.coins} coins + ${rewards.xp} XP</div>
            `;
            document.getElementById('daily-play-btn').style.display = 'inline-flex';
        }
    },

    updateHUD(player) {
        const healthFill = document.getElementById('hud-health-fill');
        if (healthFill) healthFill.style.setProperty('--health-width', `${(player.health / player.maxHealth) * 100}%`);
        const coinsEl = document.getElementById('hud-coins');
        if (coinsEl) coinsEl.textContent = player.coins;
        const scoreEl = document.getElementById('hud-score');
        if (scoreEl) scoreEl.textContent = Utils.formatNumber(player.score);
        const livesEl = document.getElementById('hud-lives');
        if (livesEl) livesEl.textContent = player.lives;
        const levelEl = document.getElementById('hud-level');
        if (levelEl) levelEl.textContent = Game.currentLevel;
    },

    showLevelComplete(stats) {
        const lcTime = document.getElementById('lc-time');
        if (lcTime) lcTime.textContent = Utils.formatTime(stats.time);
        const lcCoins = document.getElementById('lc-coins');
        if (lcCoins) lcCoins.textContent = stats.coins;
        const lcScore = document.getElementById('lc-score');
        if (lcScore) lcScore.textContent = stats.score;

        const starsHtml = '★'.repeat(stats.stars) + '☆'.repeat(3 - stats.stars);
        const lcStars = document.getElementById('lc-stars');
        if (lcStars) lcStars.textContent = starsHtml;

        this.showOverlay('levelComplete');
    },

    showGameOver(level, score, coins) {
        const goLevel = document.getElementById('go-level');
        if (goLevel) goLevel.textContent = level;
        const goScore = document.getElementById('go-score');
        if (goScore) goScore.textContent = score;
        const goCoins = document.getElementById('go-coins');
        if (goCoins) goCoins.textContent = coins;

        this.showOverlay('gameOver');
    },

    showVictory(totalScore, totalCoins, playTime) {
        const vicScore = document.getElementById('vic-total-score');
        if (vicScore) vicScore.textContent = Utils.formatNumber(totalScore);
        const vicCoins = document.getElementById('vic-total-coins');
        if (vicCoins) vicCoins.textContent = Utils.formatNumber(totalCoins);
        const vicTime = document.getElementById('vic-time');
        if (vicTime) vicTime.textContent = Utils.formatTime(playTime);

        this.showOverlay('victory');
    },

    showPause() {
        this.showOverlay('pause');
    },

    hidePause() {
        this.hideOverlay('pause');
    },

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.9);
            color: #ffdd44;
            padding: 12px 24px;
            border-radius: 8px;
            border: 2px solid rgba(255, 221, 68, 0.5);
            z-index: 400;
            animation: slideUp 0.3s ease;
        `;
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.3s ease forwards';
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = UI;
}