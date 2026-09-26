const CONFIG = {
    canvas: {
        width: 1280,
        height: 720,
        minWidth: 320,
        minHeight: 180
    },

    physics: {
        gravity: 0.65,
        terminalVelocity: 18,
        friction: 0.85,
        airFriction: 0.97,
        jumpPower: -14.5,
        doubleJumpPower: -13,
        moveAcceleration: 0.7,
        maxSpeed: 6.5,
        knockbackForce: 10,
        knockbackDuration: 300
    },

    player: {
        width: 32,
        height: 48,
        maxHealth: 100,
        baseDamage: 25,
        attackRange: 40,
        attackWidth: 50,
        attackHeight: 36,
        attackCooldown: 350,
        attackDuration: 180,
        invincibilityTime: 1000,
        doubleJumpEnabled: true,
        lives: 3,
        startCoins: 0
    },

    enemy: {
        walker: {
            width: 36,
            height: 40,
            speed: 1.8,
            health: 30,
            damage: 15,
            detectionRange: 0,
            attackCooldown: 1000,
            score: 50
        },
        chaser: {
            width: 34,
            height: 44,
            speed: 2.5,
            health: 40,
            damage: 20,
            detectionRange: 250,
            attackCooldown: 1200,
            score: 75
        },
        ranged: {
            width: 32,
            height: 48,
            speed: 1.2,
            health: 35,
            damage: 18,
            detectionRange: 350,
            attackCooldown: 2000,
            projectileSpeed: 5,
            projectileDamage: 15,
            score: 100
        },
        flying: {
            width: 36,
            height: 36,
            speed: 2.2,
            health: 25,
            damage: 15,
            detectionRange: 300,
            attackCooldown: 1500,
            amplitude: 60,
            frequency: 0.02,
            score: 80
        },
        heavy: {
            width: 48,
            height: 56,
            speed: 1.0,
            health: 120,
            damage: 35,
            detectionRange: 200,
            attackCooldown: 2500,
            knockbackResistance: 0.5,
            score: 200
        }
    },

    boss: {
        health: [500, 800, 1200, 1500, 2000],
        damage: [25, 30, 35, 40, 50],
        phases: 3,
        attackPatterns: 4,
        score: [1000, 1500, 2000, 2500, 5000]
    },

    collectibles: {
        coin: {
            value: 10,
            size: 16,
            animationSpeed: 0.15,
            score: 10
        },
        health: {
            healAmount: 25,
            size: 24,
            score: 0
        },
        gem: {
            value: 50,
            size: 20,
            score: 100
        }
    },

    checkpoint: {
        width: 40,
        height: 60,
        activationRange: 30,
        healAmount: 50
    },

    level: {
        themes: [
            'forest', 'cave', 'desert', 'snow', 'ruins',
            'volcano', 'factory', 'nightcity', 'temple', 'final'
        ],
        themeNames: {
            forest: 'Forest',
            cave: 'Cave',
            desert: 'Desert',
            snow: 'Snow',
            ruins: 'Ruins',
            volcano: 'Volcano',
            factory: 'Factory',
            nightcity: 'Night City',
            temple: 'Ancient Temple',
            final: 'Final Realm'
        },
        difficultyRanges: {
            1: { min: 1, max: 10, label: 'Beginner' },
            2: { min: 11, max: 25, label: 'Easy/Intermediate' },
            3: { min: 26, max: 40, label: 'Intermediate' },
            4: { min: 41, max: 60, label: 'Advanced' },
            5: { min: 61, max: 80, label: 'Hard' },
            6: { min: 81, max: 99, label: 'Very Hard' },
            7: { min: 100, max: 100, label: 'Final Challenge' }
        },
        baseWidth: 3000,
        widthIncrement: 200,
        maxWidth: 8000,
        height: 720,
        platformDensity: 0.15,
        enemyDensity: 0.08,
        hazardDensity: 0.05,
        collectibleDensity: 0.12,
        checkpointInterval: 1500
    },

    camera: {
        lerp: 0.12,
        lookAhead: 150,
        deadzone: 100,
        shakeIntensity: 0,
        shakeDecay: 0.9
    },

    particles: {
        maxParticles: 200,
        jumpCount: 8,
        landCount: 12,
        attackCount: 6,
        hitCount: 10,
        deathCount: 20,
        coinCount: 8,
        bossCount: 30,
        victoryCount: 50
    },

    audio: {
        masterVolume: 0.7,
        musicVolume: 0.5,
        sfxVolume: 0.7,
        enabled: true
    },

    ui: {
        hudHeight: 80,
        buttonHeight: 56,
        animationDuration: 300
    },

    progression: {
        levelsPerTheme: 10,
        totalLevels: 100,
        bossLevels: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
        coinsPerLevel: [50, 75, 100, 125, 150, 175, 200, 225, 250, 300],
        starsThresholds: {
            1: 0.6,
            2: 0.8,
            3: 1.0
        }
    },

    achievements: {
        list: [
            { id: 'first_level', name: 'First Steps', desc: 'Complete Level 1', icon: '👣', target: 1, type: 'level_complete', reward: 50 },
            { id: 'ten_levels', name: 'Explorer', desc: 'Complete 10 Levels', icon: '🗺️', target: 10, type: 'levels_completed', reward: 200 },
            { id: 'fifty_levels', name: 'Adventurer', desc: 'Complete 50 Levels', icon: '🏔️', target: 50, type: 'levels_completed', reward: 1000 },
            { id: 'hundred_levels', name: 'Legend', desc: 'Complete All 100 Levels', icon: '👑', target: 100, type: 'levels_completed', reward: 5000 },
            { id: 'hundred_coins', name: 'Treasure Hunter', desc: 'Collect 100 Coins', icon: '💰', target: 100, type: 'coins_collected', reward: 100 },
            { id: 'thousand_coins', name: 'Wealthy', desc: 'Collect 1000 Coins', icon: '💎', target: 1000, type: 'coins_collected', reward: 500 },
            { id: 'hundred_enemies', name: 'Slayer', desc: 'Defeat 100 Enemies', icon: '⚔️', target: 100, type: 'enemies_defeated', reward: 300 },
            { id: 'first_boss', name: 'Boss Hunter', desc: 'Defeat a Boss', icon: '👹', target: 1, type: 'bosses_defeated', reward: 500 },
            { id: 'no_damage', name: 'Untouchable', desc: 'Complete a Level Without Damage', icon: '🛡️', target: 1, type: 'perfect_level', reward: 200 },
            { id: 'speed_runner', name: 'Speed Runner', desc: 'Complete a Level Under Par Time', icon: '⚡', target: 5, type: 'speed_runs', reward: 300 }
        ]
    },

    dailyChallenge: {
        types: ['speed', 'coins', 'survival', 'pacifist'],
        rewards: {
            speed: { coins: 100, xp: 50 },
            coins: { coins: 200, xp: 30 },
            survival: { coins: 150, xp: 40 },
            pacifist: { coins: 120, xp: 60 }
        }
    },

    shop: {
        categories: ['coins', 'skins', 'effects', 'powerups', 'bundles'],
        items: {
            coins_small: { id: 'coins_small', name: 'Small Coin Pack', category: 'coins', price: '0.69', coins: 500, icon: '💰', description: '500 Coins' },
            coins_medium: { id: 'coins_medium', name: 'Medium Coin Pack', category: 'coins', price: '1.99', coins: 1800, icon: '💰', description: '1,800 Coins (20% Bonus)' },
            coins_large: { id: 'coins_large', name: 'Large Coin Pack', category: 'coins', price: '4.99', coins: 5000, icon: '💰', description: '5,000 Coins (35% Bonus)' },
            coins_mega: { id: 'coins_mega', name: 'Mega Coin Pack', category: 'coins', price: '9.99', coins: 12000, icon: '💰', description: '12,000 Coins (50% Bonus)' },
            skin_red: { id: 'skin_red', name: 'Crimson Hero', category: 'skins', price: '0.69', coins: 0, icon: '🔴', description: 'Red Character Skin', cosmetic: true },
            skin_blue: { id: 'skin_blue', name: 'Azure Knight', category: 'skins', price: '0.69', coins: 0, icon: '🔵', description: 'Blue Character Skin', cosmetic: true },
            skin_gold: { id: 'skin_gold', name: 'Golden Legend', category: 'skins', price: '1.49', coins: 0, icon: '🟡', description: 'Gold Character Skin', cosmetic: true },
            trail_fire: { id: 'trail_fire', name: 'Fire Trail', category: 'effects', price: '0.69', coins: 0, icon: '🔥', description: 'Fire Trail Effect', cosmetic: true },
            trail_ice: { id: 'trail_ice', name: 'Ice Trail', category: 'effects', price: '0.69', coins: 0, icon: '❄️', description: 'Ice Trail Effect', cosmetic: true },
            trail_shadow: { id: 'trail_shadow', name: 'Shadow Trail', category: 'effects', price: '0.69', coins: 0, icon: '🌑', description: 'Shadow Trail Effect', cosmetic: true },
            outfit_ninja: { id: 'outfit_ninja', name: 'Ninja Outfit', category: 'skins', price: '1.49', coins: 0, icon: '🥷', description: 'Full Ninja Cosmetic Set', cosmetic: true },
            outfit_knight: { id: 'outfit_knight', name: 'Royal Knight', category: 'skins', price: '1.99', coins: 0, icon: '🤴', description: 'Royal Knight Armor Set', cosmetic: true },
            powerup_life: { id: 'powerup_life', name: 'Extra Life Pack', category: 'powerups', price: '0.69', coins: 0, icon: '❤️', description: '3 Extra Lives', consumable: true },
            powerup_shield: { id: 'powerup_shield', name: 'Shield Pack', category: 'powerups', price: '0.69', coins: 0, icon: '🛡️', description: '3 Shields (Absorb One Hit)', consumable: true },
            powerup_boost: { id: 'powerup_boost', name: 'Speed Boost', category: 'powerups', price: '0.69', coins: 0, icon: '⚡', description: 'Temporary Speed Boost (3 Uses)', consumable: true },
            bundle_starter: { id: 'bundle_starter', name: 'Starter Bundle', category: 'bundles', price: '4.99', coins: 2500, icon: '🎁', description: '2,500 Coins + Crimson Skin + Fire Trail', includes: ['coins_small', 'skin_red', 'trail_fire'] },
            bundle_pro: { id: 'bundle_pro', name: 'Pro Bundle', category: 'bundles', price: '9.99', coins: 6000, icon: '🎁', description: '6,000 Coins + Gold Skin + All Trails', includes: ['coins_medium', 'skin_gold', 'trail_fire', 'trail_ice', 'trail_shadow'] }
        }
    },

    adMob: {
        testMode: true,
        bannerId: 'ca-app-pub-3940256099942544/6300978111',
        interstitialId: 'ca-app-pub-3940256099942544/1033173712',
        rewardedId: 'ca-app-pub-3940256099942544/5224354917',
        frequencyCap: 3,
        minInterval: 120000
    },

    billing: {
        enabled: true,
        testMode: true
    },

    security: {
        saveValidation: true,
        maxCoins: 999999,
        maxScore: 99999999,
        maxHealth: 100,
        maxLives: 99,
        checksumSalt: 'adventure_quest_2026'
    },

    debug: {
        showHitboxes: false,
        showFPS: false,
        invincible: false,
        unlimitedLives: false,
        unlockAllLevels: false,
        skipToLevel: 0
    },

    meta: {
        prestige: {
            maxLevel: 10,
            currency: 'prestigePoints',
            rewards: {
                1: { type: 'skin', id: 'prestige_bronze', name: 'Bronze Legend' },
                2: { type: 'skin', id: 'prestige_silver', name: 'Silver Legend' },
                3: { type: 'skin', id: 'prestige_gold', name: 'Gold Legend' },
                5: { type: 'trail', id: 'prestige_rainbow', name: 'Rainbow Trail' },
                10: { type: 'skin', id: 'prestige_ultimate', name: 'Ultimate Ascendant' }
            }
        },
        upgrades: {
            health: { maxLevel: 10, baseCost: 100, costMultiplier: 1.5, perLevel: 10, name: 'Vitality', desc: '+10 Max Health per level' },
            speed: { maxLevel: 5, baseCost: 200, costMultiplier: 1.8, perLevel: 0.3, name: 'Swiftness', desc: '+5% Move Speed per level' },
            damage: { maxLevel: 10, baseCost: 150, costMultiplier: 1.6, perLevel: 5, name: 'Power', desc: '+5 Damage per level' },
            doubleJump: { maxLevel: 1, baseCost: 500, costMultiplier: 1, perLevel: 1, name: 'Aerialist', desc: 'Unlock Double Jump' },
            dash: { maxLevel: 1, baseCost: 800, costMultiplier: 1, perLevel: 1, name: 'Dash Master', desc: 'Unlock Dash (Double-tap direction)' },
            parry: { maxLevel: 1, baseCost: 1000, costMultiplier: 1, perLevel: 1, name: 'Parry', desc: 'Perfect block stuns enemies' },
            coinMagnet: { maxLevel: 5, baseCost: 300, costMultiplier: 1.7, perLevel: 20, name: 'Magnetism', desc: '+20px Coin Pickup Range per level' },
            xpBoost: { maxLevel: 5, baseCost: 400, costMultiplier: 1.8, perLevel: 0.1, name: 'Scholar', desc: '+10% XP Gain per level' },
            shieldRecharge: { maxLevel: 3, baseCost: 600, costMultiplier: 2, perLevel: 1, name: 'Aegis', desc: 'Shield recharges after 30s / 20s / 10s' }
        },
        skillTree: {
            combat: [
                { id: 'heavyStrike', name: 'Heavy Strike', cost: 1, req: 0, desc: 'Hold Attack for charged strike (2x dmg, knockback)', icon: '⚔️' },
                { id: 'whirlwind', name: 'Whirlwind', cost: 2, req: 'heavyStrike', desc: 'Spin attack hits all around', icon: '🌪️' },
                { id: 'execute', name: 'Execute', cost: 3, req: 'whirlwind', desc: 'Instant kill enemies below 20% HP', icon: '💀' },
                { id: 'lifesteal', name: 'Lifesteal', cost: 2, req: 0, desc: 'Heal 5 HP on kill', icon: '🩸' },
                { id: 'critChance', name: 'Critical Eye', cost: 3, req: 'lifesteal', desc: '15% chance for 2x damage', icon: '🎯' }
            ],
            mobility: [
                { id: 'wallJump', name: 'Wall Jump', cost: 1, req: 0, desc: 'Jump off walls', icon: '🧱' },
                { id: 'airDash', name: 'Air Dash', cost: 2, req: 'wallJump', desc: 'Dash mid-air (once per air time)', icon: '💨' },
                { id: 'hover', name: 'Hover Boots', cost: 3, req: 'airDash', desc: 'Hold Jump to float briefly', icon: '☁️' },
                { id: 'longJump', name: 'Long Jump', cost: 1, req: 0, desc: 'Double-tap dash goes 50% further', icon: '🏃' },
                { id: 'safeFall', name: 'Safe Fall', cost: 2, req: 'longJump', desc: 'No fall damage, roll on landing', icon: '🤸' }
            ],
            utility: [
                { id: 'treasureSense', name: 'Treasure Sense', cost: 1, req: 0, desc: 'Show nearby secrets on map', icon: '🔮' },
                { id: 'enemyRadar', name: 'Enemy Radar', cost: 2, req: 'treasureSense', desc: 'Show enemy positions off-screen', icon: '📡' },
                { id: 'autoLoot', name: 'Auto-Loot', cost: 3, req: 'enemyRadar', desc: 'Auto-collect coins in 100px radius', icon: '🧲' },
                { id: 'speedRunner', name: 'Speed Runner', cost: 1, req: 0, desc: 'See ghost of best run', icon: '👻' },
                { id: 'perfectionist', name: 'Perfectionist', cost: 2, req: 'speedRunner', desc: 'No-damage runs give 2x coins', icon: '💎' }
            ]
        }
    },

    combat: {
        hitPause: 40,
        hitFreeze: 30,
        coyoteTime: 80,
        jumpBuffer: 100,
        parryWindow: 120,
        parryStunDuration: 800,
        comboWindow: 500,
        maxCombo: 10,
        aerialDownStrike: true,
        launchVelocity: -18
    },

    visualJuice: {
        damageNumbers: true,
        damageNumberDuration: 800,
        screenShakeOnHit: true,
        screenShakeOnKill: true,
        killFlashDuration: 60,
        levelUpFlashDuration: 1000,
        coinPopDuration: 600,
        floatingText: true,
        particleQuality: 'high'
    },

    accessibility: {
        assistMode: false,
        infiniteJumps: false,
        halfDamage: false,
        slowMotion: false,
        autoParry: false,
        highContrast: false,
        colorblindMode: 'none',
        reducedScreenShake: false,
        showInvincibilityFrames: false
    },

    tutorial: {
        enabled: true,
        steps: [
            { id: 'move', text: 'Use left stick to move', trigger: 'move', complete: false },
            { id: 'jump', text: 'Tap jump to leap', trigger: 'jump', complete: false },
            { id: 'doubleJump', text: 'Tap jump again in mid-air', trigger: 'doubleJump', complete: false },
            { id: 'attack', text: 'Tap attack to strike', trigger: 'attack', complete: false },
            { id: 'dash', text: 'Double-tap direction to dash', trigger: 'dash', complete: false },
            { id: 'parry', text: 'Tap attack just before hit to parry', trigger: 'parry', complete: false }
        ]
    },

    setPieces: {
        verticalShaft: { minLevel: 5, maxLevel: 95, weight: 3 },
        chaseSequence: { minLevel: 15, maxLevel: 90, weight: 2 },
        puzzleRoom: { minLevel: 20, maxLevel: 85, weight: 2 },
        bossArena: { minLevel: 10, maxLevel: 100, weight: 1, onlyBossLevels: true },
        secretRoom: { minLevel: 1, maxLevel: 100, weight: 4 },
        branchingPath: { minLevel: 10, maxLevel: 90, weight: 3 }
    },

    ghostReplay: {
        enabled: true,
        maxStored: 3,
        recordInterval: 100
    },

    dailyChallenge: {
        types: ['speed', 'coins', 'survival', 'pacifist', 'bossRush', 'noHit', 'comboMaster'],
        rewards: {
            speed: { coins: 100, xp: 50 },
            coins: { coins: 200, xp: 30 },
            survival: { coins: 150, xp: 40 },
            pacifist: { coins: 120, xp: 60 },
            bossRush: { coins: 300, xp: 100 },
            noHit: { coins: 250, xp: 80 },
            comboMaster: { coins: 200, xp: 70 }
        },
        streakBonus: {
            3: { coins: 100, xp: 50 },
            7: { coins: 300, xp: 200, skin: 'streak_week' },
            14: { coins: 500, xp: 500, trail: 'streak_fortnight' },
            30: { coins: 1000, xp: 1000, skin: 'streak_month' }
        }
    },

    soundDesign: {
        layeredSFX: true,
        adaptiveMusic: true,
        spatialAudio: true,
        musicLayers: {
            calm: 0.3,
            tension: 0.5,
            combat: 0.7,
            boss: 1.0
        }
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}