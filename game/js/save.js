const SaveSystem = {
    STORAGE_KEY: 'adventure_quest_save',
    VERSION: 2,

    defaultSave() {
        return {
            version: this.VERSION,
            timestamp: Date.now(),
            checksum: '',

            unlockedLevels: [1],
            completedLevels: [],
            bestScores: {},
            levelStars: {},
            levelBestTimes: {},

            totalCoins: 0,
            lifetimeCoins: 0,
            totalScore: 0,

            health: CONFIG.player.maxHealth,
            maxHealth: CONFIG.player.maxHealth,
            lives: CONFIG.player.lives,
            maxLives: CONFIG.player.lives,

            currentLevel: 1,
            checkpointData: null,

            achievements: {},
            achievementProgress: {},

            cosmetics: {
                skins: ['default'],
                trails: ['none'],
                equippedSkin: 'default',
                equippedTrail: 'none'
            },

            inventory: {
                extraLives: 0,
                shields: 0,
                speedBoosts: 0
            },

            dailyChallenge: {
                lastDate: '',
                completed: false,
                bestScore: 0,
                type: '',
                streak: 0,
                lastStreakDate: ''
            },

            statistics: {
                enemiesDefeated: 0,
                bossesDefeated: 0,
                coinsCollected: 0,
                levelsCompleted: 0,
                perfectLevels: 0,
                speedRuns: 0,
                playTime: 0,
                deaths: 0,
                damageTaken: 0,
                checkpointsActivated: 0,
                totalPlayTime: 0,
                highestCombo: 0,
                parriesSuccessful: 0,
                secretsFound: 0
            },

            settings: {
                musicVolume: CONFIG.audio.musicVolume,
                sfxVolume: CONFIG.audio.sfxVolume,
                masterVolume: CONFIG.audio.masterVolume,
                audioEnabled: CONFIG.audio.enabled,
                showFPS: CONFIG.debug.showFPS,
                showHitboxes: CONFIG.debug.showHitboxes,
                vibrationEnabled: true,
                reducedMotion: false,
                highContrast: false,
                assistMode: false,
                infiniteJumps: false,
                halfDamage: false,
                slowMotion: false,
                autoParry: false,
                colorblindMode: 'none',
                reducedScreenShake: false,
                showInvincibilityFrames: false
            },

            meta: {
                prestigeLevel: 0,
                prestigePoints: 0,
                upgrades: {
                    health: 0,
                    speed: 0,
                    damage: 0,
                    doubleJump: 0,
                    dash: 0,
                    parry: 0,
                    coinMagnet: 0,
                    xpBoost: 0,
                    shieldRecharge: 0
                },
                skillTree: {
                    combat: {},
                    mobility: {},
                    utility: {}
                },
                totalMetaCoinsSpent: 0
            },

            tutorial: {
                completed: false,
                currentStep: 0,
                steps: {}
            },

            ghostReplays: {},

            purchaseHistory: [],
            restoredPurchases: []
        };
    },

    save(data) {
        try {
            const saveData = this.prepareSave(data);
            const json = JSON.stringify(saveData);
            localStorage.setItem(this.STORAGE_KEY, json);
            return true;
        } catch (e) {
            console.error('Save failed:', e);
            return false;
        }
    },

    prepareSave(data) {
        const saveData = Utils.deepClone(data);
        saveData.timestamp = Date.now();
        saveData.checksum = Utils.calculateChecksum(saveData, CONFIG.security.checksumSalt);
        return saveData;
    },

    load() {
        try {
            const json = localStorage.getItem(this.STORAGE_KEY);
            if (!json) return null;

            const data = JSON.parse(json);
            if (!this.validateSave(data)) {
                console.warn('Save validation failed, using default');
                return null;
            }

            return this.migrateSave(data);
        } catch (e) {
            console.error('Load failed:', e);
            return null;
        }
    },

    validateSave(data) {
        if (!Utils.validateSaveData(data)) return false;

        const expectedChecksum = Utils.calculateChecksum(data, CONFIG.security.checksumSalt);
        if (data.checksum !== expectedChecksum) {
            console.warn('Save checksum mismatch');
            return false;
        }

        return true;
    },

    migrateSave(data) {
        if (!data.version) data.version = 1;
        if (data.version < this.VERSION) {
            data = this.applyMigrations(data);
        }
        return data;
    },

    applyMigrations(data) {
        // Version 1 -> 2: Add meta progression, tutorial, accessibility, ghost replays
        if (data.version < 2) {
            data.settings.assistMode = false;
            data.settings.infiniteJumps = false;
            data.settings.halfDamage = false;
            data.settings.slowMotion = false;
            data.settings.autoParry = false;
            data.settings.colorblindMode = 'none';
            data.settings.reducedScreenShake = false;
            data.settings.showInvincibilityFrames = false;

            data.dailyChallenge.streak = 0;
            data.dailyChallenge.lastStreakDate = '';

            data.statistics.totalPlayTime = 0;
            data.statistics.highestCombo = 0;
            data.statistics.parriesSuccessful = 0;
            data.statistics.secretsFound = 0;

            data.meta = {
                prestigeLevel: 0,
                prestigePoints: 0,
                upgrades: {
                    health: 0,
                    speed: 0,
                    damage: 0,
                    doubleJump: 0,
                    dash: 0,
                    parry: 0,
                    coinMagnet: 0,
                    xpBoost: 0,
                    shieldRecharge: 0
                },
                skillTree: {
                    combat: {},
                    mobility: {},
                    utility: {}
                },
                totalMetaCoinsSpent: 0
            };

            data.tutorial = {
                completed: false,
                currentStep: 0,
                steps: {}
            };

            data.ghostReplays = {};
        }

        data.version = this.VERSION;
        return data;
    },

    reset() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            return true;
        } catch (e) {
            console.error('Reset failed:', e);
            return false;
        }
    },

    exportSave() {
        const data = this.load();
        if (!data) return null;
        return JSON.stringify(data, null, 2);
    },

    importSave(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (!this.validateSave(data)) {
                throw new Error('Invalid save data');
            }
            return this.save(data);
        } catch (e) {
            console.error('Import failed:', e);
            return false;
        }
    },

    get(key, defaultValue = null) {
        const data = this.load();
        if (!data) return defaultValue;
        return key.split('.').reduce((obj, k) => obj?.[k], data) ?? defaultValue;
    },

    set(key, value) {
        const data = this.load() || this.defaultSave();
        const keys = key.split('.');
        let obj = data;
        for (let i = 0; i < keys.length - 1; i++) {
            if (!obj[keys[i]]) obj[keys[i]] = {};
            obj = obj[keys[i]];
        }
        obj[keys[keys.length - 1]] = value;
        return this.save(data);
    },

    addCoins(amount) {
        const data = this.load() || this.defaultSave();
        data.totalCoins = Math.min(CONFIG.security.maxCoins, data.totalCoins + amount);
        data.lifetimeCoins += amount;
        data.statistics.coinsCollected += amount;
        return this.save(data);
    },

    spendCoins(amount) {
        const data = this.load() || this.defaultSave();
        if (data.totalCoins < amount) return false;
        data.totalCoins -= amount;
        return this.save(data);
    },

    addScore(levelId, score) {
        const data = this.load() || this.defaultSave();
        data.totalScore += score;
        if (!data.bestScores[levelId] || score > data.bestScores[levelId]) {
            data.bestScores[levelId] = score;
        }
        return this.save(data);
    },

    unlockLevel(levelId) {
        const data = this.load() || this.defaultSave();
        if (!data.unlockedLevels.includes(levelId)) {
            data.unlockedLevels.push(levelId);
            data.unlockedLevels.sort((a, b) => a - b);
        }
        return this.save(data);
    },

    completeLevel(levelId, stars, time) {
        const data = this.load() || this.defaultSave();
        if (!data.completedLevels.includes(levelId)) {
            data.completedLevels.push(levelId);
            data.statistics.levelsCompleted++;
        }
        data.levelStars[levelId] = stars;
        if (!data.levelBestTimes[levelId] || time < data.levelBestTimes[levelId]) {
            data.levelBestTimes[levelId] = time;
        }
        if (levelId === data.currentLevel) {
            data.currentLevel = Math.min(levelId + 1, CONFIG.progression.totalLevels);
        }
        this.unlockLevel(levelId + 1);
        return this.save(data);
    },

    unlockAchievement(achievementId) {
        const data = this.load() || this.defaultSave();
        if (!data.achievements[achievementId]) {
            data.achievements[achievementId] = {
                unlocked: true,
                timestamp: Date.now()
            };
            const achievement = CONFIG.achievements.list.find(a => a.id === achievementId);
            if (achievement && achievement.reward) {
                data.totalCoins = Math.min(CONFIG.security.maxCoins, data.totalCoins + achievement.reward);
            }
            return this.save(data);
        }
        return false;
    },

    updateAchievementProgress(type, value) {
        const data = this.load() || this.defaultSave();
        data.achievementProgress[type] = (data.achievementProgress[type] || 0) + value;

        CONFIG.achievements.list.forEach(achievement => {
            if (achievement.type === type && data.achievementProgress[type] >= achievement.target) {
                this.unlockAchievement(achievement.id);
            }
        });

        return this.save(data);
    },

    setCheckpoint(levelId, checkpointData) {
        const data = this.load() || this.defaultSave();
        data.checkpointData = {
            levelId,
            ...checkpointData,
            timestamp: Date.now()
        };
        return this.save(data);
    },

    clearCheckpoint() {
        const data = this.load() || this.defaultSave();
        data.checkpointData = null;
        return this.save(data);
    },

    getCheckpoint() {
        const data = this.load();
        return data?.checkpointData || null;
    },

    addCosmetic(type, id) {
        const data = this.load() || this.defaultSave();
        if (!data.cosmetics[type].includes(id)) {
            data.cosmetics[type].push(id);
            return this.save(data);
        }
        return false;
    },

    equipCosmetic(type, id) {
        const data = this.load() || this.defaultSave();
        if (data.cosmetics[type].includes(id)) {
            data.cosmetics[`equipped${type.charAt(0).toUpperCase() + type.slice(1)}`] = id;
            return this.save(data);
        }
        return false;
    },

    addInventoryItem(item, count = 1) {
        const data = this.load() || this.defaultSave();
        data.inventory[item] = (data.inventory[item] || 0) + count;
        return this.save(data);
    },

    useInventoryItem(item) {
        const data = this.load() || this.defaultSave();
        if (data.inventory[item] > 0) {
            data.inventory[item]--;
            return this.save(data);
        }
        return false;
    },

    recordPurchase(productId, purchaseToken, orderId) {
        const data = this.load() || this.defaultSave();
        data.purchaseHistory.push({
            productId,
            purchaseToken,
            orderId,
            timestamp: Date.now()
        });
        return this.save(data);
    },

    markPurchaseRestored(productId) {
        const data = this.load() || this.defaultSave();
        if (!data.restoredPurchases.includes(productId)) {
            data.restoredPurchases.push(productId);
            return this.save(data);
        }
        return false;
    },

    isPurchaseRestored(productId) {
        const data = this.load();
        return data?.restoredPurchases?.includes(productId) || false;
    },

    updateDailyChallenge(challengeData) {
        const data = this.load() || this.defaultSave();
        data.dailyChallenge = {
            ...data.dailyChallenge,
            ...challengeData
        };
        return this.save(data);
    },

    updateStatistics(stats) {
        const data = this.load() || this.defaultSave();
        Object.keys(stats).forEach(key => {
            if (data.statistics[key] !== undefined) {
                data.statistics[key] += stats[key];
            }
        });
        return this.save(data);
    },

    updateSetting(key, value) {
        const data = this.load() || this.defaultSave();
        data.settings[key] = value;
        return this.save(data);
    },

    getSettings() {
        const data = this.load();
        return data?.settings || this.defaultSave().settings;
    },

    // Meta Progression
    getMeta() {
        const data = this.load();
        return data?.meta || this.defaultSave().meta;
    },

    spendMetaCoins(amount) {
        const data = this.load() || this.defaultSave();
        if (data.totalCoins < amount) return false;
        data.totalCoins -= amount;
        data.meta.totalMetaCoinsSpent += amount;
        return this.save(data);
    },

    upgradeMeta(upgradeId) {
        const data = this.load() || this.defaultSave();
        const upgrade = CONFIG.meta.upgrades[upgradeId];
        if (!upgrade) return false;
        const currentLevel = data.meta.upgrades[upgradeId] || 0;
        if (currentLevel >= upgrade.maxLevel) return false;
        const cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, currentLevel));
        if (!this.spendMetaCoins(cost)) return false;
        data.meta.upgrades[upgradeId] = currentLevel + 1;
        return this.save(data);
    },

    unlockSkillTree(skillId, tree) {
        const data = this.load() || this.defaultSave();
        if (!data.meta.skillTree[tree]) data.meta.skillTree[tree] = {};
        if (data.meta.skillTree[tree][skillId]) return false;
        const skill = CONFIG.meta.skillTree[tree].find(s => s.id === skillId);
        if (!skill) return false;
        // Check prerequisites
        if (skill.req && !data.meta.skillTree[tree][skill.req]) return false;
        const cost = skill.cost;
        if (!this.spendMetaCoins(cost * 100)) return false; // Skills cost prestige points
        data.meta.skillTree[tree][skillId] = true;
        return this.save(data);
    },

    hasSkill(skillId, tree) {
        const data = this.load();
        return data?.meta?.skillTree?.[tree]?.[skillId] === true;
    },

    getUpgradeLevel(upgradeId) {
        const data = this.load();
        return data?.meta?.upgrades?.[upgradeId] || 0;
    },

    addPrestigePoints(amount) {
        const data = this.load() || this.defaultSave();
        data.meta.prestigePoints += amount;
        // Check for prestige level up
        const nextLevel = data.meta.prestigeLevel + 1;
        const required = nextLevel * 1000;
        if (data.meta.prestigePoints >= required && data.meta.prestigeLevel < CONFIG.meta.prestige.maxLevel) {
            data.meta.prestigeLevel = nextLevel;
            data.meta.prestigePoints -= required;
            // Grant prestige reward
            const reward = CONFIG.meta.prestige.rewards[nextLevel];
            if (reward) {
                if (reward.type === 'skin') {
                    this.addCosmetic('skins', reward.id);
                } else if (reward.type === 'trail') {
                    this.addCosmetic('trails', reward.id);
                }
            }
        }
        return this.save(data);
    },

    prestige() {
        const data = this.load() || this.defaultSave();
        if (data.meta.prestigeLevel >= CONFIG.meta.prestige.maxLevel) return false;
        // Reset progress but keep meta
        const meta = data.meta;
        const cosmetics = data.cosmetics;
        const settings = data.settings;
        const statistics = data.statistics;
        const achievements = data.achievements;
        const newData = this.defaultSave();
        newData.meta = meta;
        newData.cosmetics = cosmetics;
        newData.settings = settings;
        newData.statistics = statistics;
        newData.achievements = achievements;
        newData.unlockedLevels = [1];
        newData.completedLevels = [];
        newData.currentLevel = 1;
        return this.save(newData);
    },

    // Tutorial
    getTutorial() {
        const data = this.load();
        return data?.tutorial || this.defaultSave().tutorial;
    },

    completeTutorialStep(stepId) {
        const data = this.load() || this.defaultSave();
        const tutorial = CONFIG.tutorial.steps.find(s => s.id === stepId);
        if (!tutorial) return false;
        data.tutorial.steps[stepId] = true;
        const allDone = CONFIG.tutorial.steps.every(s => data.tutorial.steps[s.id]);
        if (allDone && !data.tutorial.completed) {
            data.tutorial.completed = true;
            // Reward for completing tutorial
            this.addCoins(100);
        }
        return this.save(data);
    },

    // Ghost Replays
    saveGhostReplay(levelId, replayData) {
        const data = this.load() || this.defaultSave();
        if (!data.ghostReplays[levelId]) data.ghostReplays[levelId] = [];
        data.ghostReplays[levelId].unshift({
            timestamp: Date.now(),
            time: replayData.time,
            inputs: replayData.inputs,
            coins: replayData.coins,
            damageTaken: replayData.damageTaken
        });
        // Keep only max stored
        if (data.ghostReplays[levelId].length > CONFIG.ghostReplay.maxStored) {
            data.ghostReplays[levelId].pop();
        }
        return this.save(data);
    },

    getGhostReplay(levelId) {
        const data = this.load();
        return data?.ghostReplays?.[levelId]?.[0] || null;
    },

    getAllGhostReplays(levelId) {
        const data = this.load();
        return data?.ghostReplays?.[levelId] || [];
    },

    // Daily Challenge Streak
    updateDailyStreak(completed) {
        const data = this.load() || this.defaultSave();
        const today = Utils.getDateString();
        const yesterday = Utils.getDateString(Date.now() - 86400000);
        
        if (completed) {
            if (data.dailyChallenge.lastStreakDate === yesterday) {
                data.dailyChallenge.streak += 1;
            } else if (data.dailyChallenge.lastStreakDate !== today) {
                data.dailyChallenge.streak = 1;
            }
            data.dailyChallenge.lastStreakDate = today;
            
            // Check streak rewards
            const streak = data.dailyChallenge.streak;
            const rewards = CONFIG.dailyChallenge.streakBonus[streak];
            if (rewards) {
                this.addCoins(rewards.coins);
                if (rewards.skin) this.addCosmetic('skins', rewards.skin);
                if (rewards.trail) this.addCosmetic('trails', rewards.trail);
            }
        }
        return this.save(data);
    },

    // Accessibility
    setAssistMode(enabled) {
        return this.updateSetting('assistMode', enabled);
    },

    getAssistMode() {
        const settings = this.getSettings();
        return settings?.assistMode || false;
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SaveSystem;
}