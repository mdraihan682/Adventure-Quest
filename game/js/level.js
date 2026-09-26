class Level {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.difficulty = data.difficulty;
        this.theme = data.theme;
        this.width = data.width;
        this.height = data.height;

        this.platforms = data.platforms || [];
        this.enemies = data.enemies || [];
        this.hazards = data.hazards || [];
        this.collectibles = data.collectibles || [];
        this.checkpoints = data.checkpoints || [];
        this.exit = data.exit || null;
        this.boss = data.boss || null;

        this.background = this.generateBackground();
        this.parallaxLayers = this.generateParallaxLayers();

        this.completed = false;
        this.bestScore = 0;
        this.bestTime = 0;
        this.stars = 0;

        this.parTime = Physics.calculateParTime(this.width, this.difficulty);
    }

    generateBackground() {
        const themeColors = {
            forest: { sky: '#2d4a2d', ground: '#1a331a', accent: '#4a7c4a' },
            cave: { sky: '#1a1a2e', ground: '#0f0f1a', accent: '#2d2d4a' },
            desert: { sky: '#d4a574', ground: '#c49564', accent: '#e4b584' },
            snow: { sky: '#a8d0e6', ground: '#e8f4fd', accent: '#cce8f5' },
            ruins: { sky: '#5d4e3d', ground: '#3d3328', accent: '#7d6e5d' },
            volcano: { sky: '#4a1a1a', ground: '#2d0f0f', accent: '#6d2d2d' },
            factory: { sky: '#2d2d2d', ground: '#1a1a1a', accent: '#4a4a4a' },
            nightcity: { sky: '#1a1a3d', ground: '#0f0f2d', accent: '#2d2d5d' },
            temple: { sky: '#3d4a3d', ground: '#2d3a2d', accent: '#5d7a5d' },
            final: { sky: '#2d1a3d', ground: '#1a0f2d', accent: '#4d2d5d' }
        };

        const colors = themeColors[this.theme] || themeColors.forest;

        return {
            skyColor: colors.sky,
            groundColor: colors.ground,
            accentColor: colors.accent,
            elements: this.generateBackgroundElements()
        };
    }

    generateBackgroundElements() {
        const elements = [];
        const count = Math.floor(this.width / 200);

        for (let i = 0; i < count; i++) {
            const x = Utils.seededRandom(this.id * 1000 + i) * this.width;
            const type = Math.floor(Utils.seededRandom(this.id * 2000 + i) * 4);

            switch (this.theme) {
                case 'forest':
                    elements.push(this.createTree(x, type));
                    break;
                case 'cave':
                    elements.push(this.createStalactite(x, type));
                    break;
                case 'desert':
                    elements.push(this.createCactus(x, type));
                    break;
                case 'snow':
                    elements.push(this.createSnowPine(x, type));
                    break;
                case 'ruins':
                    elements.push(this.createPillar(x, type));
                    break;
                case 'volcano':
                    elements.push(this.createLavaRock(x, type));
                    break;
                case 'factory':
                    elements.push(this.createPipe(x, type));
                    break;
                case 'nightcity':
                    elements.push(this.createBuilding(x, type));
                    break;
                case 'temple':
                    elements.push(this.createStatue(x, type));
                    break;
                case 'final':
                    elements.push(this.createObelisk(x, type));
                    break;
            }
        }

        return elements;
    }

    createTree(x, type) {
        const heights = [80, 100, 120, 140];
        return { x, type: 'tree', height: heights[type], variant: type };
    }

    createStalactite(x, type) {
        const lengths = [40, 60, 80, 100];
        return { x, type: 'stalactite', length: lengths[type], variant: type };
    }

    createCactus(x, type) {
        const heights = [60, 80, 100, 120];
        return { x, type: 'cactus', height: heights[type], variant: type };
    }

    createSnowPine(x, type) {
        const heights = [70, 90, 110, 130];
        return { x, type: 'pine', height: heights[type], variant: type };
    }

    createPillar(x, type) {
        const heights = [100, 150, 200, 250];
        return { x, type: 'pillar', height: heights[type], variant: type };
    }

    createLavaRock(x, type) {
        const sizes = [30, 40, 50, 60];
        return { x, type: 'lava_rock', size: sizes[type], variant: type };
    }

    createPipe(x, type) {
        const heights = [80, 120, 160, 200];
        return { x, type: 'pipe', height: heights[type], variant: type };
    }

    createBuilding(x, type) {
        const heights = [150, 200, 250, 300];
        const widths = [60, 80, 100, 120];
        return { x, type: 'building', height: heights[type], width: widths[type], variant: type };
    }

    createStatue(x, type) {
        const heights = [80, 100, 120, 140];
        return { x, type: 'statue', height: heights[type], variant: type };
    }

    createObelisk(x, type) {
        const heights = [120, 160, 200, 240];
        return { x, type: 'obelisk', height: heights[type], variant: type };
    }

    generateParallaxLayers() {
        const layers = [];
        const layerCount = 3;

        for (let i = 0; i < layerCount; i++) {
            const speed = 0.1 + i * 0.15;
            const elements = [];
            const count = Math.floor(this.width / (300 + i * 100));

            for (let j = 0; j < count; j++) {
                const seed = this.id * 3000 + i * 1000 + j;
                const x = Utils.seededRandom(seed) * this.width;
                const y = this.height * (0.2 + i * 0.2) + Utils.seededRandom(seed + 100) * this.height * 0.3;
                const size = 20 + Utils.seededRandom(seed + 200) * 40;

                elements.push({ x, y, size, seed });
            }

            layers.push({ speed, elements, color: this.getParallaxColor(i) });
        }

        return layers;
    }

    getParallaxColor(layerIndex) {
        const themeColors = {
            forest: ['#1a2a1a', '#2d3d2d', '#3d4d3d'],
            cave: ['#0a0a1a', '#15152a', '#1f1f3a'],
            desert: ['#a08050', '#b09060', '#c0a070'],
            snow: ['#88b0c8', '#98c0d8', '#a8d0e8'],
            ruins: ['#302820', '#403830', '#504840'],
            volcano: ['#301010', '#402020', '#503030'],
            factory: ['#151515', '#202020', '#2a2a2a'],
            nightcity: ['#101025', '#181835', '#202045'],
            temple: ['#283028', '#303830', '#384038'],
            final: ['#1a1028', '#251835', '#302040']
        };
        const colors = themeColors[this.theme] || themeColors.forest;
        return colors[layerIndex] || colors[0];
    }

    getThemeColor(role) {
        const colors = {
            forest: { platform: '#2d5d2d', hazard: '#882222', collectible: '#ffdd44', checkpoint: '#44aa44' },
            cave: { platform: '#4a4a6a', hazard: '#aa4444', collectible: '#ffdd44', checkpoint: '#6688ff' },
            desert: { platform: '#c4a060', hazard: '#cc4422', collectible: '#ffdd44', checkpoint: '#ffaa44' },
            snow: { platform: '#d0e8f0', hazard: '#4488cc', collectible: '#ffdd44', checkpoint: '#44aaff' },
            ruins: { platform: '#6d5d4d', hazard: '#aa6644', collectible: '#ffdd44', checkpoint: '#88cc88' },
            volcano: { platform: '#5d2d2d', hazard: '#ff4400', collectible: '#ffdd44', checkpoint: '#ff8844' },
            factory: { platform: '#4a4a4a', hazard: '#ff6600', collectible: '#ffdd44', checkpoint: '#00ffaa' },
            nightcity: { platform: '#2d2d5d', hazard: '#ff0088', collectible: '#ffdd44', checkpoint: '#00ffff' },
            temple: { platform: '#4d6d4d', hazard: '#aa8844', collectible: '#ffdd44', checkpoint: '#ffdd44' },
            final: { platform: '#4d2d5d', hazard: '#ff00ff', collectible: '#ffdd44', checkpoint: '#ffff44' }
        };
        return colors[this.theme]?.[role] || colors.forest[role];
    }

    static createFromData(data) {
        return new Level(data);
    }

    toData() {
        return {
            id: this.id,
            name: this.name,
            difficulty: this.difficulty,
            theme: this.theme,
            width: this.width,
            height: this.height,
            platforms: this.platforms,
            enemies: this.enemies,
            hazards: this.hazards,
            collectibles: this.collectibles,
            checkpoints: this.checkpoints,
            exit: this.exit,
            boss: this.boss
        };
    }
}

const LevelSystem = {
    levels: new Map(),
    currentLevel: null,
    levelGenerators: {},

    registerGenerator(theme, generator) {
        this.levelGenerators[theme] = generator;
    },

    generateLevel(id) {
        if (this.levels.has(id)) {
            return this.levels.get(id);
        }

        const theme = this.getThemeForLevel(id);
        const difficulty = this.getDifficultyForLevel(id);
        const generator = this.levelGenerators[theme];

        if (generator) {
            const levelData = generator.generate(id, difficulty);
            const level = Level.createFromData(levelData);
            this.levels.set(id, level);
            return level;
        }

        return null;
    },

    getThemeForLevel(levelId) {
        const themes = CONFIG.level.themes;
        const levelsPerTheme = CONFIG.progression.levelsPerTheme;
        const themeIndex = Math.floor((levelId - 1) / levelsPerTheme);
        return themes[Math.min(themeIndex, themes.length - 1)];
    },

    getDifficultyForLevel(levelId) {
        for (const [key, range] of Object.entries(CONFIG.level.difficultyRanges)) {
            if (levelId >= range.min && levelId <= range.max) {
                return parseInt(key);
            }
        }
        return 1;
    },

    getLevel(id) {
        if (!this.levels.has(id)) {
            return this.generateLevel(id);
        }
        return this.levels.get(id);
    },

    preloadLevels(ids) {
        ids.forEach(id => this.generateLevel(id));
    },

    clearCache() {
        this.levels.clear();
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Level, LevelSystem };
}