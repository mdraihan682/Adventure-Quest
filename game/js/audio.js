const AudioSystem = {
    context: null,
    masterGain: null,
    musicGain: null,
    sfxGain: null,
    sounds: {},
    music: null,
    currentMusic: null,
    musicLoop: false,
    enabled: true,
    suspended: false,

    init() {
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.context.createGain();
            this.musicGain = this.context.createGain();
            this.sfxGain = this.context.createGain();

            this.masterGain.connect(this.context.destination);
            this.musicGain.connect(this.masterGain);
            this.sfxGain.connect(this.masterGain);

            this.loadSettings();
            this.resume();
        } catch (e) {
            console.warn('Audio context not available:', e);
            this.enabled = false;
        }
    },

    loadSettings() {
        const settings = SaveSystem.getSettings();
        this.enabled = settings.audioEnabled !== false;
        this.setMasterVolume(settings.masterVolume ?? CONFIG.audio.masterVolume);
        this.setMusicVolume(settings.musicVolume ?? CONFIG.audio.musicVolume);
        this.setSfxVolume(settings.sfxVolume ?? CONFIG.audio.sfxVolume);
    },

    async resume() {
        if (this.context && this.context.state === 'suspended') {
            try {
                await this.context.resume();
                this.suspended = false;
            } catch (e) {
                console.warn('Audio resume failed:', e);
            }
        }
    },

    suspend() {
        if (this.context && this.context.state === 'running') {
            this.context.suspend();
            this.suspended = true;
        }
    },

    setMasterVolume(volume) {
        if (!this.masterGain) return;
        this.masterGain.gain.value = Utils.clamp(volume, 0, 1);
        SaveSystem.updateSetting('masterVolume', volume);
    },

    setMusicVolume(volume) {
        if (!this.musicGain) return;
        this.musicGain.gain.value = Utils.clamp(volume, 0, 1);
        SaveSystem.updateSetting('musicVolume', volume);
    },

    setSfxVolume(volume) {
        if (!this.sfxGain) return;
        this.sfxGain.gain.value = Utils.clamp(volume, 0, 1);
        SaveSystem.updateSetting('sfxVolume', volume);
    },

    toggleAudio(enabled) {
        this.enabled = enabled;
        SaveSystem.updateSetting('audioEnabled', enabled);
        if (!enabled) this.stopAll();
    },

    createOscillatorSound(config) {
        return () => {
            if (!this.enabled || !this.context) return;

            const osc = this.context.createOscillator();
            const gain = this.context.createGain();
            const filter = this.context.createBiquadFilter();

            osc.type = config.type || 'square';
            osc.frequency.value = config.frequency || 440;
            filter.type = config.filterType || 'lowpass';
            filter.frequency.value = config.filterFreq || 2000;

            gain.gain.setValueAtTime(config.volume || 0.1, this.context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + (config.duration || 0.1));

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.sfxGain);

            osc.start();
            osc.stop(this.context.currentTime + (config.duration || 0.1));
        };
    },

    generateSounds() {
        this.sounds = {
            jump: this.createOscillatorSound({ type: 'square', frequency: 520, duration: 0.1, volume: 0.15, filterFreq: 1500 }),
            doubleJump: this.createOscillatorSound({ type: 'triangle', frequency: 660, duration: 0.12, volume: 0.12, filterFreq: 2000 }),
            attack: this.createOscillatorSound({ type: 'sawtooth', frequency: 300, duration: 0.08, volume: 0.2, filterFreq: 1000 }),
            hit: this.createOscillatorSound({ type: 'square', frequency: 200, duration: 0.15, volume: 0.18, filterFreq: 800 }),
            enemyHit: this.createOscillatorSound({ type: 'triangle', frequency: 350, duration: 0.1, volume: 0.15, filterFreq: 1200 }),
            enemyDeath: this.createOscillatorSound({ type: 'sawtooth', frequency: 150, duration: 0.3, volume: 0.2, filterFreq: 600 }),
            coin: this.createOscillatorSound({ type: 'sine', frequency: 880, duration: 0.08, volume: 0.12, filterFreq: 3000 }),
            health: this.createOscillatorSound({ type: 'sine', frequency: 660, duration: 0.2, volume: 0.15, filterFreq: 2000 }),
            checkpoint: this.createOscillatorSound({ type: 'triangle', frequency: 440, duration: 0.3, volume: 0.18, filterFreq: 1500 }),
            levelComplete: this.createOscillatorSound({ type: 'sine', frequency: 523, duration: 0.5, volume: 0.2, filterFreq: 2000 }),
            gameOver: this.createOscillatorSound({ type: 'sawtooth', frequency: 110, duration: 1.0, volume: 0.25, filterFreq: 500 }),
            victory: this.createOscillatorSound({ type: 'sine', frequency: 659, duration: 1.5, volume: 0.2, filterFreq: 2000 }),
            bossHit: this.createOscillatorSound({ type: 'square', frequency: 180, duration: 0.2, volume: 0.25, filterFreq: 800 }),
            bossDeath: this.createOscillatorSound({ type: 'sawtooth', frequency: 100, duration: 2.0, volume: 0.3, filterFreq: 400 }),
            menuSelect: this.createOscillatorSound({ type: 'triangle', frequency: 440, duration: 0.06, volume: 0.1, filterFreq: 2000 }),
            menuConfirm: this.createOscillatorSound({ type: 'sine', frequency: 523, duration: 0.1, volume: 0.12, filterFreq: 2000 }),
            error: this.createOscillatorSound({ type: 'square', frequency: 150, duration: 0.2, volume: 0.15, filterFreq: 600 })
        };
    },

    play(soundName) {
        if (!this.enabled || !this.sounds[soundName]) return;
        try {
            this.sounds[soundName]();
        } catch (e) {
            console.warn(`Sound ${soundName} failed:`, e);
        }
    },

    playMusic(trackName, loop = true) {
        if (!this.enabled || !this.context) return;
        this.musicLoop = loop;
        this.currentMusic = trackName;

        const tracks = {
            menu: { notes: [261, 329, 392, 523, 392, 329], tempo: 120 },
            forest: { notes: [220, 277, 330, 440, 330, 277], tempo: 100 },
            cave: { notes: [164, 196, 247, 329, 247, 196], tempo: 80 },
            desert: { notes: [196, 247, 293, 392, 293, 247], tempo: 110 },
            snow: { notes: [293, 370, 440, 587, 440, 370], tempo: 90 },
            ruins: { notes: [174, 220, 261, 349, 261, 220], tempo: 85 },
            volcano: { notes: [155, 185, 233, 311, 233, 185], tempo: 130 },
            factory: { notes: [185, 220, 277, 370, 277, 220], tempo: 140 },
            nightcity: { notes: [207, 261, 311, 415, 311, 261], tempo: 105 },
            temple: { notes: [196, 247, 293, 392, 293, 247], tempo: 95 },
            final: { notes: [130, 174, 207, 277, 207, 174], tempo: 70 },
            boss: { notes: [110, 138, 165, 220, 165, 138], tempo: 150 }
        };

        const track = tracks[trackName] || tracks.menu;
        this.playMusicSequence(track.notes, track.tempo);
    },

    playMusicSequence(notes, tempo) {
        if (!this.enabled || !this.context) return;

        const noteDuration = 60000 / tempo / 4;
        let time = this.context.currentTime + 0.1;

        const playNote = (freq, startTime, dur) => {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();
            const filter = this.context.createBiquadFilter();

            osc.type = 'triangle';
            osc.frequency.value = freq;
            filter.type = 'lowpass';
            filter.frequency.value = 800;

            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.08, startTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.musicGain);

            osc.start(startTime);
            osc.stop(startTime + dur);
        };

        notes.forEach((note, i) => {
            playNote(note, time + i * noteDuration, noteDuration * 0.8);
        });

        const totalDuration = notes.length * noteDuration;
        setTimeout(() => {
            if (this.musicLoop && this.enabled && this.currentMusic) {
                this.playMusicSequence(notes, tempo);
            }
        }, totalDuration * 1000);
    },

    stopMusic() {
        this.currentMusic = null;
        this.musicLoop = false;
    },

    stopAll() {
        this.stopMusic();
        if (this.context) {
            this.sfxGain.gain.setValueAtTime(0, this.context.currentTime);
            this.musicGain.gain.setValueAtTime(0, this.context.currentTime);
        }
    },

    fadeMusic(targetVolume, duration = 1000) {
        if (!this.musicGain || !this.context) return;
        const currentTime = this.context.currentTime;
        this.musicGain.gain.cancelScheduledValues(currentTime);
        this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, currentTime);
        this.musicGain.gain.linearRampToValueAtTime(targetVolume, currentTime + duration / 1000);
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioSystem;
}