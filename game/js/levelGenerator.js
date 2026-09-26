const LevelGenerator = {
    generate(id, difficulty) {
        const theme = LevelSystem.getThemeForLevel(id);
        const width = Math.min(
            CONFIG.level.baseWidth + (id - 1) * CONFIG.level.widthIncrement,
            CONFIG.level.maxWidth
        );
        const height = CONFIG.level.height;

        const platforms = this.generatePlatforms(width, height, difficulty, theme, id);
        const enemies = this.generateEnemies(platforms, width, height, difficulty, theme, id);
        const hazards = this.generateHazards(platforms, width, height, difficulty, theme, id);
        const collectibles = this.generateCollectibles(platforms, width, height, difficulty, theme, id);
        const checkpoints = this.generateCheckpoints(platforms, width, height, theme, id);
        const exit = this.generateExit(width, height, platforms, theme);
        const boss = this.generateBoss(id, width, height, platforms);

        // Add set pieces
        const setPieces = this.generateSetPieces(platforms, width, height, difficulty, theme, id);
        platforms.push(...setPieces.platforms);
        enemies.push(...setPieces.enemies);
        hazards.push(...setPieces.hazards);
        collectibles.push(...setPieces.collectibles);

        // Add secrets
        const secrets = this.generateSecrets(platforms, width, height, difficulty, theme, id);
        collectibles.push(...secrets);

        // Add branching paths
        const branching = this.generateBranchingPaths(platforms, width, height, difficulty, theme, id);
        platforms.push(...branching.platforms);
        enemies.push(...branching.enemies);
        collectibles.push(...branching.collectibles);

        return {
            id,
            name: this.generateLevelName(id, theme),
            difficulty,
            theme,
            width,
            height,
            platforms,
            enemies,
            hazards,
            collectibles,
            checkpoints,
            exit,
            boss,
            setPieces: setPieces.types,
            secrets: secrets.length,
            hasBranchingPath: branching.platforms.length > 0
        };
    },

    generateLevelName(id, theme) {
        const prefixes = {
            forest: ['Green', 'Leafy', 'Ancient', 'Whispering', 'Deep', 'Wild', 'Sacred', 'Hidden', 'Eternal', 'Primeval'],
            cave: ['Dark', 'Echoing', 'Crystal', 'Deep', 'Forgotten', 'Hollow', 'Shadow', 'Silent', 'Ancient', 'Primordial'],
            desert: ['Scorching', 'Sandy', 'Barren', 'Endless', 'Ancient', 'Sun-scorched', 'Dune', 'Mirage', 'Burning', 'Timeless'],
            snow: ['Frozen', 'Icy', 'Glacial', 'Biting', 'Eternal', 'Silent', 'Pristine', 'Crystal', 'Arctic', 'Permafrost'],
            ruins: ['Crumbling', 'Ancient', 'Forgotten', 'Sacred', 'Lost', 'Time-worn', 'Mysterious', 'Hallowed', 'Eternal', 'Vanished'],
            volcano: ['Molten', 'Burning', 'Volcanic', 'Searing', 'Infernal', 'Magma', 'Ashen', 'Blazing', 'Erupting', 'Hellish'],
            factory: ['Industrial', 'Mechanical', 'Automated', 'Steel', 'Rusty', 'Massive', 'Humming', 'Precision', 'Relentless', 'Titanium'],
            nightcity: ['Neon', 'Cyber', 'Electric', 'Midnight', 'Digital', 'Synthetic', 'Luminous', 'Virtual', 'Chrome', 'Quantum'],
            temple: ['Sacred', 'Divine', 'Mystical', 'Ancient', 'Hallowed', 'Celestial', 'Transcendent', 'Ethereal', 'Sanctified', 'Omniscient'],
            final: ['Ultimate', 'Final', 'Absolute', 'Supreme', 'Transcendent', 'Omega', 'Apex', 'Zenith', 'Paramount', 'Sovereign']
        };

        const suffixes = {
            forest: ['Grove', 'Woods', 'Forest', 'Thicket', 'Canopy', 'Glade', 'Vale', 'Wildwood', 'Arbor', 'Sanctuary'],
            cave: ['Cavern', 'Grotto', 'Depths', 'Hollow', 'Chasm', 'Abyss', 'Catacomb', 'Vault', 'Labyrinth', 'Sanctum'],
            desert: ['Dunes', 'Wastes', 'Expanse', 'Desert', 'Barrens', 'Sea', 'Wilderness', 'Badlands', 'Frontier', 'Horizon'],
            snow: ['Peaks', 'Tundra', 'Wastes', 'Fells', 'Glacier', 'Icefield', 'Summit', 'Range', 'Frostlands', 'Whiteout'],
            ruins: ['Ruins', 'Remnants', 'Remains', 'Vestiges', 'Relics', 'Debris', 'Fragments', 'Echoes', 'Traces', 'Memorial'],
            volcano: ['Crater', 'Caldera', 'Vent', 'Chamber', 'Core', 'Throat', 'Heart', 'Furnace', 'Forge', 'Inferno'],
            factory: ['Complex', 'Facility', 'Plant', 'Works', 'Foundry', 'Assembly', 'Forge', 'Mill', 'Refinery', 'Citadel'],
            nightcity: ['District', 'Sector', 'Zone', 'Metropolis', 'Sprawl', 'Grid', 'Nexus', 'Hub', 'Core', 'Matrix'],
            temple: ['Sanctum', 'Shrine', 'Altar', 'Temple', 'Sanctuary', 'Chapel', 'Oratory', 'Tabernacle', 'Holy of Holies', 'Empyrean'],
            final: ['Throne', 'Sanctum', 'Core', 'Heart', 'Apex', 'Zenith', 'Nexus', 'Crown', 'Pinnacle', 'Dominion']
        };

        const themePrefixes = prefixes[theme] || prefixes.forest;
        const themeSuffixes = suffixes[theme] || suffixes.forest;

        const prefix = themePrefixes[(id - 1) % themePrefixes.length];
        const suffix = themeSuffixes[Math.floor((id - 1) / themePrefixes.length) % themeSuffixes.length];

        return `${prefix} ${suffix}`;
    },

    generatePlatforms(width, height, difficulty, theme, seed) {
        const platforms = [];
        const groundY = height - 40;

        platforms.push({
            x: 0,
            y: groundY,
            width: width,
            height: 40,
            type: 'ground',
            solid: true,
            theme
        });

        const platformCount = Math.floor(width / 400) + difficulty * 2;
        const minGap = 120 + difficulty * 10;
        const maxGap = 250 + difficulty * 20;

        let lastX = 100;
        let lastY = groundY - 100;

        for (let i = 0; i < platformCount; i++) {
            const gap = Utils.seededRandom(seed * 1000 + i * 10) * (maxGap - minGap) + minGap;
            lastX += gap;

            if (lastX > width - 200) break;

            const heightVariation = Utils.seededRandom(seed * 1000 + i * 10 + 1) * 200 - 100;
            const targetY = Utils.clamp(lastY + heightVariation, 150, height - 150);

            const platformWidth = 80 + Utils.seededRandom(seed * 1000 + i * 10 + 2) * 120;
            const platformHeight = 20;

            const platformType = this.selectPlatformType(difficulty, Utils.seededRandom(seed * 1000 + i * 10 + 3));

            platforms.push({
                x: lastX,
                y: targetY,
                width: platformWidth,
                height: platformHeight,
                type: platformType,
                solid: true,
                theme,
                moving: platformType === 'moving',
                moveRange: platformType === 'moving' ? 100 + Utils.seededRandom(seed * 1000 + i * 10 + 4) * 100 : 0,
                moveSpeed: platformType === 'moving' ? 0.5 + Utils.seededRandom(seed * 1000 + i * 10 + 5) * 1 : 0,
                moveDirection: Utils.seededRandom(seed * 1000 + i * 10 + 6) > 0.5 ? 1 : -1,
                moveOffset: 0,
                breakable: platformType === 'breakable',
                disappearing: platformType === 'disappearing',
                disappearTimer: 0,
                disappearDelay: platformType === 'disappearing' ? 2000 + Utils.seededRandom(seed * 1000 + i * 10 + 7) * 3000 : 0
            });

            lastY = targetY;
        }

        return this.validatePlatforms(platforms, width, height);
    },

    selectPlatformType(difficulty, rand) {
        if (difficulty <= 2) {
            return rand < 0.9 ? 'normal' : 'moving';
        } else if (difficulty <= 4) {
            if (rand < 0.7) return 'normal';
            if (rand < 0.85) return 'moving';
            return 'breakable';
        } else if (difficulty <= 6) {
            if (rand < 0.6) return 'normal';
            if (rand < 0.75) return 'moving';
            if (rand < 0.9) return 'breakable';
            return 'disappearing';
        } else {
            if (rand < 0.5) return 'normal';
            if (rand < 0.65) return 'moving';
            if (rand < 0.8) return 'breakable';
            if (rand < 0.9) return 'disappearing';
            return 'spiked';
        }
    },

    validatePlatforms(platforms, width, height) {
        const valid = [];
        const playerJumpHeight = 180;
        const playerMaxJumpDistance = 250;

        for (let i = 0; i < platforms.length; i++) {
            const p = platforms[i];

            if (p.type === 'ground') {
                valid.push(p);
                continue;
            }

            let reachable = false;
            for (let j = 0; j < platforms.length; j++) {
                if (i === j) continue;
                const other = platforms[j];

                const dx = Math.abs(p.x - other.x);
                const dy = p.y - other.y;

                if (dy > 0 && dy <= playerJumpHeight && dx <= playerMaxJumpDistance) {
                    reachable = true;
                    break;
                }
                if (dy <= 0 && Math.abs(dy) <= 50 && dx <= playerMaxJumpDistance) {
                    reachable = true;
                    break;
                }
            }

            if (reachable || p.x < 300) {
                valid.push(p);
            }
        }

        valid.sort((a, b) => a.x - b.x);
        return valid;
    },

    generateEnemies(platforms, width, height, difficulty, theme, seed) {
        const enemies = [];
        const enemyTypes = this.getEnemyTypesForTheme(theme, difficulty);
        const enemyCount = Math.floor(width / 800) + difficulty;

        for (let i = 0; i < enemyCount; i++) {
            const platform = this.selectEnemyPlatform(platforms, seed * 2000 + i);
            if (!platform) continue;

            const type = Utils.randomChoice(enemyTypes);
            const x = platform.x + Utils.seededRandom(seed * 2000 + i * 10 + 1) * (platform.width - 40);
            const y = platform.y - 50;

            enemies.push({
                x,
                y,
                type,
                patrolStart: platform.x + 20,
                patrolEnd: platform.x + platform.width - 20
            });
        }

        return enemies;
    },

    getEnemyTypesForTheme(theme, difficulty) {
        const themeEnemies = {
            forest: ['walker', 'chaser'],
            cave: ['walker', 'ranged'],
            desert: ['walker', 'chaser', 'flying'],
            snow: ['walker', 'heavy'],
            ruins: ['chaser', 'ranged', 'flying'],
            volcano: ['walker', 'heavy', 'flying'],
            factory: ['ranged', 'heavy'],
            nightcity: ['chaser', 'ranged', 'flying'],
            temple: ['walker', 'chaser', 'ranged', 'heavy'],
            final: ['walker', 'chaser', 'ranged', 'flying', 'heavy']
        };

        let types = themeEnemies[theme] || ['walker'];

        if (difficulty >= 3) types = types.concat(['chaser', 'ranged']);
        if (difficulty >= 5) types = types.concat(['flying', 'heavy']);

        return [...new Set(types)];
    },

    selectEnemyPlatform(platforms, seed) {
        const candidates = platforms.filter(p => p.type !== 'ground' && p.width > 80);
        if (candidates.length === 0) return platforms[0];
        return candidates[Math.floor(Utils.seededRandom(seed) * candidates.length)];
    },

    generateHazards(platforms, width, height, difficulty, theme, seed) {
        const hazards = [];
        const hazardCount = Math.floor(width / 1500) + Math.floor(difficulty / 2);

        for (let i = 0; i < hazardCount; i++) {
            const platform = platforms[Math.floor(Utils.seededRandom(seed * 3000 + i * 10) * (platforms.length - 1)) + 1];
            if (!platform || platform.type === 'ground') continue;

            const hazardType = this.selectHazardType(theme, difficulty, Utils.seededRandom(seed * 3000 + i * 10 + 1));
            const x = platform.x + Utils.seededRandom(seed * 3000 + i * 10 + 2) * (platform.width - 40);
            const y = platform.y - 30;

            hazards.push({
                x,
                y,
                width: 30,
                height: 30,
                type: hazardType,
                damage: 20 + difficulty * 5,
                theme,
                active: true,
                timer: 0,
                cycle: hazardType === 'laser' ? 2000 : 0
            });
        }

        return hazards;
    },

    selectHazardType(theme, difficulty, rand) {
        const types = {
            forest: ['spikes', 'thorns'],
            cave: ['spikes', 'falling_rocks'],
            desert: ['spikes', 'quicksand'],
            snow: ['spikes', 'ice_spikes'],
            ruins: ['spikes', 'traps'],
            volcano: ['lava', 'fire_jets'],
            factory: ['electricity', 'laser', 'crusher'],
            nightcity: ['laser', 'electricity'],
            temple: ['spikes', 'darts', 'curse'],
            final: ['spikes', 'laser', 'electricity', 'void']
        };

        const themeTypes = types[theme] || ['spikes'];
        let available = [...themeTypes];

        if (difficulty >= 4) available = available.concat(['laser', 'electricity']);
        if (difficulty >= 6) available = available.concat(['void']);

        return available[Math.floor(rand * available.length)];
    },

    generateCollectibles(platforms, width, height, difficulty, theme, seed) {
        const collectibles = [];
        const coinCount = Math.floor(width / 200) + difficulty * 2;
        const healthCount = Math.floor(difficulty / 2) + 1;
        const gemCount = Math.floor(difficulty / 3);

        for (let i = 0; i < coinCount; i++) {
            const platform = platforms[Math.floor(Utils.seededRandom(seed * 4000 + i * 10) * (platforms.length - 1)) + 1];
            if (!platform) continue;

            const x = platform.x + Utils.seededRandom(seed * 4000 + i * 10 + 1) * (platform.width - 20);
            const y = platform.y - 30 - Utils.seededRandom(seed * 4000 + i * 10 + 2) * 60;

            collectibles.push({
                x,
                y,
                width: 16,
                height: 16,
                type: 'coin',
                value: CONFIG.collectibles.coin.value,
                collected: false,
                animOffset: Utils.seededRandom(seed * 4000 + i * 10 + 3) * Math.PI * 2
            });
        }

        for (let i = 0; i < healthCount; i++) {
            const platform = platforms[Math.floor(Utils.seededRandom(seed * 5000 + i * 10) * (platforms.length - 1)) + 1];
            if (!platform) continue;

            const x = platform.x + Utils.seededRandom(seed * 5000 + i * 10 + 1) * (platform.width - 30);
            const y = platform.y - 40;

            collectibles.push({
                x,
                y,
                width: 24,
                height: 24,
                type: 'health',
                value: CONFIG.collectibles.health.healAmount,
                collected: false,
                animOffset: Utils.seededRandom(seed * 5000 + i * 10 + 2) * Math.PI * 2
            });
        }

        for (let i = 0; i < gemCount; i++) {
            const platform = platforms[Math.floor(Utils.seededRandom(seed * 6000 + i * 10) * (platforms.length - 1)) + 1];
            if (!platform) continue;

            const x = platform.x + Utils.seededRandom(seed * 6000 + i * 10 + 1) * (platform.width - 25);
            const y = platform.y - 50 - Utils.seededRandom(seed * 6000 + i * 10 + 2) * 80;

            collectibles.push({
                x,
                y,
                width: 20,
                height: 20,
                type: 'gem',
                value: CONFIG.collectibles.gem.value,
                collected: false,
                animOffset: Utils.seededRandom(seed * 6000 + i * 10 + 3) * Math.PI * 2
            });
        }

        return collectibles;
    },

    generateCheckpoints(platforms, width, height, theme, seed) {
        const checkpoints = [];
        const interval = CONFIG.level.checkpointInterval;
        const count = Math.floor(width / interval);

        for (let i = 0; i < count; i++) {
            const targetX = (i + 1) * interval;
            const platform = this.findNearestPlatform(platforms, targetX);
            if (!platform) continue;

            checkpoints.push({
                x: platform.x + platform.width / 2 - 20,
                y: platform.y - 60,
                width: 40,
                height: 60,
                activated: false,
                theme
            });
        }

        return checkpoints;
    },

    findNearestPlatform(platforms, targetX) {
        let nearest = null;
        let minDist = Infinity;

        for (const platform of platforms) {
            if (platform.type === 'ground') continue;
            const dist = Math.abs(platform.x + platform.width / 2 - targetX);
            if (dist < minDist) {
                minDist = dist;
                nearest = platform;
            }
        }

        return nearest;
    },

    generateExit(width, height, platforms, theme) {
        const platform = this.findNearestPlatform(platforms, width - 200);
        if (!platform) {
            return { x: width - 100, y: height - 100, width: 60, height: 80 };
        }

        return {
            x: platform.x + platform.width / 2 - 30,
            y: platform.y - 80,
            width: 60,
            height: 80,
            theme
        };
    },

    generateBoss(id, width, height, platforms) {
        if (CONFIG.progression.bossLevels.includes(id)) {
            const platform = this.findNearestPlatform(platforms, width - 400);
            const y = platform ? platform.y - 150 : height - 200;

            return {
                x: width - 400,
                y,
                width: 120,
                height: 140,
                type: 'boss',
                theme: LevelSystem.getThemeForLevel(id)
            };
        }
        return null;
    }
};

const LevelGenerators = {
    forest: LevelGenerator,
    cave: LevelGenerator,
    desert: LevelGenerator,
    snow: LevelGenerator,
    ruins: LevelGenerator,
    volcano: LevelGenerator,
    factory: LevelGenerator,
    nightcity: LevelGenerator,
    temple: LevelGenerator,
    final: LevelGenerator
};

Object.entries(LevelGenerators).forEach(([theme, generator]) => {
    LevelSystem.registerGenerator(theme, generator);
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LevelGenerator, LevelGenerators };
}

// Set Pieces Generation
LevelGenerator.generateSetPieces = function(platforms, width, height, difficulty, theme, seed) {
    const result = { platforms: [], enemies: [], hazards: [], collectibles: [], types: [] };
    const setPieceConfigs = CONFIG.setPieces;

    Object.entries(setPieceConfigs).forEach(([type, config]) => {
        if (difficulty < config.minLevel || difficulty > config.maxLevel) return;
        if (config.onlyBossLevels && !CONFIG.progression.bossLevels.includes(Math.floor(seed))) return;

        const rand = Utils.seededRandom(seed * 10000 + type.charCodeAt(0));
        if (rand > config.weight / 10) return;

        switch (type) {
            case 'verticalShaft':
                result.platforms.push(...this.createVerticalShaft(width, height, theme, seed));
                result.types.push('verticalShaft');
                break;
            case 'chaseSequence':
                result.platforms.push(...this.createChaseSequence(width, height, theme, seed));
                result.enemies.push(...this.createChaseEnemies(width, height, theme, seed));
                result.types.push('chaseSequence');
                break;
            case 'puzzleRoom':
                result.platforms.push(...this.createPuzzleRoom(width, height, theme, seed));
                result.collectibles.push(...this.createPuzzleCollectibles(width, height, theme, seed));
                result.types.push('puzzleRoom');
                break;
            case 'secretRoom':
                result.platforms.push(...this.createSecretRoom(width, height, theme, seed));
                result.collectibles.push(...this.createSecretCollectibles(width, height, theme, seed));
                result.types.push('secretRoom');
                break;
            case 'branchingPath':
                result.platforms.push(...this.createBranchingPath(width, height, theme, seed));
                result.enemies.push(...this.createBranchingEnemies(width, height, theme, seed));
                result.collectibles.push(...this.createBranchingCollectibles(width, height, theme, seed));
                result.types.push('branchingPath');
                break;
        }
    });

    return result;
};

LevelGenerator.createVerticalShaft = function(width, height, theme, seed) {
    const platforms = [];
    const shaftX = width * 0.3 + Utils.seededRandom(seed + 100) * width * 0.4;
    const shaftWidth = 120;
    const platformHeight = 20;
    const gap = 100;

    for (let y = height - 100; y > 150; y -= gap) {
        const platWidth = shaftWidth + Utils.seededRandom(seed + y) * 40;
        platforms.push({
            x: shaftX - platWidth / 2,
            y: y,
            width: platWidth,
            height: platformHeight,
            type: 'normal',
            solid: true,
            theme,
            isSetPiece: true,
            setPieceType: 'verticalShaft'
        });
    }

    const leftWall = { x: shaftX - shaftWidth / 2 - 10, y: 150, width: 10, height: height - 250, type: 'wall', solid: true, theme };
    const rightWall = { x: shaftX + shaftWidth / 2, y: 150, width: 10, height: height - 250, type: 'wall', solid: true, theme };
    platforms.push(leftWall, rightWall);

    return platforms;
};

LevelGenerator.createChaseSequence = function(width, height, theme, seed) {
    const platforms = [];
    const startX = width * 0.1;
    const platformWidth = 100;
    const platformHeight = 20;
    const gap = 150;

    for (let i = 0; i < 10; i++) {
        const x = startX + i * gap;
        const y = height - 100 - (i % 3) * 50;
        platforms.push({
            x, y,
            width: platformWidth,
            height: platformHeight,
            type: 'normal',
            solid: true,
            theme,
            isSetPiece: true,
            setPieceType: 'chaseSequence'
        });
    }
    return platforms;
};

LevelGenerator.createChaseEnemies = function(width, height, theme, seed) {
    const enemies = [];
    const enemyTypes = ['chaser', 'flying'];
    for (let i = 0; i < 5; i++) {
        const x = width * 0.1 + i * 150;
        const y = height - 150 - (i % 3) * 50;
        enemies.push({
            x, y,
            type: Utils.randomChoice(enemyTypes),
            patrolStart: x - 50,
            patrolEnd: x + 50,
            isChaseEnemy: true,
            speedMultiplier: 1.5
        });
    }
    return enemies;
};

LevelGenerator.createPuzzleRoom = function(width, height, theme, seed) {
    const platforms = [];
    const roomX = width * 0.5;
    const roomWidth = 300;
    const platformHeight = 20;

    platforms.push({
        x: roomX - roomWidth / 2,
        y: height - 100,
        width: roomWidth,
        height: 40,
        type: 'ground',
        solid: true,
        theme,
        isSetPiece: true,
        setPieceType: 'puzzleRoom'
    });

    const pattern = Utils.seededRandom(seed + 500) > 0.5 ? 'stairs' : 'zigzag';
    if (pattern === 'stairs') {
        for (let i = 0; i < 5; i++) {
            platforms.push({
                x: roomX - roomWidth / 2 + i * 60,
                y: height - 150 - i * 40,
                width: 80,
                height: 20,
                type: 'normal',
                solid: true,
                theme,
                isSetPiece: true,
                setPieceType: 'puzzleRoom'
            });
        }
    } else {
        for (let i = 0; i < 5; i++) {
            const dir = i % 2 === 0 ? 1 : -1;
            platforms.push({
                x: roomX + dir * (roomWidth / 4) + i * 10,
                y: height - 150 - i * 40,
                width: 80,
                height: 20,
                type: 'normal',
                solid: true,
                theme,
                isSetPiece: true,
                setPieceType: 'puzzleRoom'
            });
        }
    }

    platforms.push({
        x: roomX - 40,
        y: height - 200,
        width: 80,
        height: 20,
        type: 'disappearing',
        solid: true,
        theme,
        isSetPiece: true,
        setPieceType: 'puzzleRoom',
        disappearDelay: 1000
    });

    return platforms;
};

LevelGenerator.createPuzzleCollectibles = function(width, height, theme, seed) {
    const collectibles = [];
    collectibles.push({
        x: width * 0.5,
        y: height - 250,
        width: 20, height: 20,
        type: 'gem', value: CONFIG.collectibles.gem.value,
        collected: false, isPuzzleReward: true
    });
    return collectibles;
};

LevelGenerator.createSecretRoom = function(width, height, theme, seed) {
    const platforms = [];
    const secretX = width * (0.2 + Utils.seededRandom(seed + 1000) * 0.6);
    const roomWidth = 150;
    const roomHeight = 120;

    platforms.push({
        x: secretX,
        y: height - 80,
        width: 40,
        height: 20,
        type: 'secret_entrance',
        solid: true,
        theme,
        isSecret: true,
        isSetPiece: true,
        setPieceType: 'secretRoom'
    });

    platforms.push({
        x: secretX - roomWidth / 2,
        y: height - 200,
        width: roomWidth,
        height: 40,
        type: 'ground',
        solid: true,
        theme,
        isSecret: true,
        isSetPiece: true,
        setPieceType: 'secretRoom'
    });

    platforms.push({
        x: secretX - roomWidth / 2 - 10,
        y: height - 200,
        width: 10, height: roomHeight,
        type: 'wall', solid: true, theme, isSecret: true
    });
    platforms.push({
        x: secretX + roomWidth / 2,
        y: height - 200,
        width: 10, height: roomHeight,
        type: 'wall', solid: true, theme, isSecret: true
    });

    return platforms;
};

LevelGenerator.createSecretCollectibles = function(width, height, theme, seed) {
    const collectibles = [];
    collectibles.push({
        x: width * (0.2 + Utils.seededRandom(seed + 1000) * 0.6),
        y: height - 250,
        width: 24, height: 24,
        type: 'gem', value: CONFIG.collectibles.gem.value * 3,
        collected: false, isSecret: true
    });
    collectibles.push({
        x: width * (0.2 + Utils.seededRandom(seed + 1000) * 0.6) - 40,
        y: height - 250,
        width: 16, height: 16,
        type: 'coin', value: CONFIG.collectibles.coin.value * 10,
        collected: false, isSecret: true
    });
    return collectibles;
};

LevelGenerator.createBranchingPath = function(width, height, theme, seed) {
    const platforms = [];
    const branchX = width * (0.3 + Utils.seededRandom(seed + 2000) * 0.4);
    const upperY = height * 0.3;
    const lowerY = height * 0.7;

    for (let i = 0; i < 8; i++) {
        platforms.push({
            x: branchX + i * 100,
            y: upperY + Utils.seededRandom(seed + i) * 50,
            width: 80 + Utils.seededRandom(seed + i) * 40,
            height: 20,
            type: Utils.seededRandom(seed + i) > 0.7 ? 'moving' : 'normal',
            solid: true,
            theme,
            isSetPiece: true,
            setPieceType: 'branchingPath',
            path: 'upper'
        });
    }

    for (let i = 0; i < 8; i++) {
        platforms.push({
            x: branchX + i * 100,
            y: lowerY + Utils.seededRandom(seed + i + 100) * 50,
            width: 100 + Utils.seededRandom(seed + i + 100) * 50,
            height: 20,
            type: 'normal',
            solid: true,
            theme,
            isSetPiece: true,
            setPieceType: 'branchingPath',
            path: 'lower'
        });
    }

    platforms.push({
        x: branchX + 800,
        y: height - 100,
        width: 200,
        height: 40,
        type: 'ground',
        solid: true,
        theme,
        isSetPiece: true,
        setPieceType: 'branchingPath',
        path: 'merge'
    });

    return platforms;
};

LevelGenerator.createBranchingEnemies = function(width, height, theme, seed) {
    const enemies = [];
    const enemyTypes = this.getEnemyTypesForTheme(theme, Math.floor(width / 1000));
    for (let i = 0; i < 4; i++) {
        enemies.push({
            x: width * 0.3 + i * 200 + 500,
            y: height * 0.7 - 50,
            type: Utils.randomChoice(enemyTypes),
            patrolStart: width * 0.3 + i * 200 + 450,
            patrolEnd: width * 0.3 + i * 200 + 550,
            path: 'lower'
        });
    }
    return enemies;
};

LevelGenerator.createBranchingCollectibles = function(width, height, theme, seed) {
    const collectibles = [];
    for (let i = 0; i < 3; i++) {
        collectibles.push({
            x: width * 0.3 + i * 200 + 500,
            y: height * 0.3 - 30,
            width: 20, height: 20,
            type: 'gem', value: CONFIG.collectibles.gem.value,
            collected: false, path: 'upper'
        });
    }
    for (let i = 0; i < 6; i++) {
        collectibles.push({
            x: width * 0.3 + i * 200 + 500,
            y: height * 0.7 - 30,
            width: 16, height: 16,
            type: 'coin', value: CONFIG.collectibles.coin.value,
            collected: false, path: 'lower'
        });
    }
    return collectibles;
};

LevelGenerator.generateSecrets = function(platforms, width, height, difficulty, theme, seed) {
    const secrets = [];
    const secretCount = Math.floor(difficulty / 2) + 1;

    for (let i = 0; i < secretCount; i++) {
        const platform = platforms[Math.floor(Utils.seededRandom(seed * 7000 + i * 10) * (platforms.length - 1)) + 1];
        if (!platform || platform.type === 'ground') continue;

        const x = platform.x + Utils.seededRandom(seed * 7000 + i * 10 + 1) * (platform.width - 30);
        const y = platform.y - 40;

        secrets.push({
            x, y,
            width: 24, height: 24,
            type: 'secret',
            value: 100,
            collected: false,
            found: false,
            animOffset: Utils.seededRandom(seed * 7000 + i * 10 + 2) * Math.PI * 2
        });
    }
    return secrets;
};

LevelGenerator.generateBranchingPaths = function(platforms, width, height, difficulty, theme, seed) {
    const result = { platforms: [], enemies: [], collectibles: [] };

    const config = CONFIG.setPieces.branchingPath;
    if (difficulty < config.minLevel || difficulty > config.maxLevel) return result;

    const rand = Utils.seededRandom(seed * 8000);
    if (rand > config.weight / 10) return result;

    return this.generateSetPieces(platforms, width, height, difficulty, theme, seed);
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LevelGenerator, LevelGenerators };
}