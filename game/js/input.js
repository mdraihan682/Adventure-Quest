const Input = {
    keys: {},
    keyState: {},
    touchState: {},
    gamepadIndex: null,
    lastGamepadPoll: 0,

    // Analog touch state
    touchJoystick: {
        active: false,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
        maxRadius: 40,
        deadzone: 8
    },

    // Discrete buttons
    touchButtons: {
        jump: false,
        attack: false,
        pause: false
    },

    actions: {
        left: false,
        right: false,
        jump: false,
        attack: false,
        pause: false
    },

    prevActions: {
        left: false,
        right: false,
        jump: false,
        attack: false,
        pause: false
    },

    // Haptic feedback
    hapticEnabled: true,
    lastHapticTime: 0,
    hapticCooldown: 50,

    init() {
        this.bindKeyboard();
        this.bindTouch();
        this.bindGamepad();
        this.generateSounds();
        this.loadHapticSetting();
    },

    loadHapticSetting() {
        const settings = SaveSystem?.getSettings?.() || {};
        this.hapticEnabled = settings.vibrationEnabled !== false;
    },

    bindKeyboard() {
        window.addEventListener('keydown', (e) => {
            if (this.isGameInput(e.code)) {
                e.preventDefault();
            }
            this.keys[e.code] = true;
            this.updateActions();
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            this.updateActions();
        });

        window.addEventListener('blur', () => {
            this.keys = {};
            this.updateActions();
        });
    },

    bindTouch() {
        const joystickZone = document.getElementById('joystick-zone');
        const btnJump = document.getElementById('btn-jump');
        const btnAttack = document.getElementById('btn-attack');
        const btnPause = document.getElementById('btn-pause');

        // --- Analog Joystick Zone (left side) ---
        if (joystickZone) {
            joystickZone.addEventListener('touchstart', (e) => this.handleJoystickStart(e), { passive: false });
            joystickZone.addEventListener('touchmove', (e) => this.handleJoystickMove(e), { passive: false });
            joystickZone.addEventListener('touchend', (e) => this.handleJoystickEnd(e), { passive: false });
            joystickZone.addEventListener('touchcancel', (e) => this.handleJoystickEnd(e), { passive: false });
            
            // Mouse support for testing
            joystickZone.addEventListener('mousedown', (e) => this.handleJoystickStart(e));
            window.addEventListener('mousemove', (e) => this.handleJoystickMove(e));
            window.addEventListener('mouseup', (e) => this.handleJoystickEnd(e));
        }

        // --- Discrete Buttons (right side) ---
        const setupButton = (btn, action) => {
            if (!btn) return;
            const start = (e) => {
                e.preventDefault();
                this.touchButtons[action] = true;
                btn.classList.add('pressed');
                this.triggerHaptic(action);
                this.updateActions();
            };
            const end = (e) => {
                e.preventDefault();
                this.touchButtons[action] = false;
                btn.classList.remove('pressed');
                this.updateActions();
            };
            btn.addEventListener('touchstart', start, { passive: false });
            btn.addEventListener('touchend', end, { passive: false });
            btn.addEventListener('touchcancel', end, { passive: false });
            btn.addEventListener('mousedown', start);
            btn.addEventListener('mouseup', end);
            btn.addEventListener('mouseleave', end);
        };

        setupButton(btnJump, 'jump');
        setupButton(btnAttack, 'attack');
        setupButton(btnPause, 'pause');

        // Prevent scrolling on game container
        document.getElementById('game-container')?.addEventListener('touchmove', (e) => {
            if (e.target.closest('#touch-controls')) {
                e.preventDefault();
            }
        }, { passive: false });
    },

    handleJoystickStart(e) {
        const touch = e.touches?.[0] || e;
        const rect = document.getElementById('joystick-zone').getBoundingClientRect();
        
        this.touchJoystick.active = true;
        this.touchJoystick.startX = touch.clientX - rect.left;
        this.touchJoystick.startY = touch.clientY - rect.top;
        this.touchJoystick.currentX = this.touchJoystick.startX;
        this.touchJoystick.currentY = this.touchJoystick.startY;
        
        this.updateJoystickVisual();
    },

    handleJoystickMove(e) {
        if (!this.touchJoystick.active) return;
        
        const touch = e.touches?.[0] || e;
        const rect = document.getElementById('joystick-zone').getBoundingClientRect();
        
        let dx = (touch.clientX - rect.left) - this.touchJoystick.startX;
        let dy = (touch.clientY - rect.top) - this.touchJoystick.startY;
        
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > this.touchJoystick.maxRadius) {
            const angle = Math.atan2(dy, dx);
            dx = Math.cos(angle) * this.touchJoystick.maxRadius;
            dy = Math.sin(angle) * this.touchJoystick.maxRadius;
        }
        
        this.touchJoystick.currentX = this.touchJoystick.startX + dx;
        this.touchJoystick.currentY = this.touchJoystick.startY + dy;
        
        this.updateJoystickVisual();
    },

    handleJoystickEnd(e) {
        this.touchJoystick.active = false;
        this.touchJoystick.currentX = this.touchJoystick.startX;
        this.touchJoystick.currentY = this.touchJoystick.startY;
        this.updateJoystickVisual();
    },

    updateJoystickVisual() {
        const stick = document.getElementById('joystick-stick');
        const zone = document.getElementById('joystick-zone');
        if (!stick || !zone) return;

        const dx = this.touchJoystick.currentX - this.touchJoystick.startX;
        const dy = this.touchJoystick.currentY - this.touchJoystick.startY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Move stick visually
        const maxVisualRadius = 35;
        const visualRadius = Math.min(distance, maxVisualRadius);
        const angle = Math.atan2(dy, dx);
        const stickX = this.touchJoystick.startX + Math.cos(angle) * visualRadius;
        const stickY = this.touchJoystick.startY + Math.sin(angle) * visualRadius;

        stick.style.transform = `translate(${stickX - rect.width / 2}px, ${stickY - rect.height / 2}px)`;
        
        // Update zone background to show direction
        zone.style.background = this.touchJoystick.active 
            ? `radial-gradient(circle at ${this.touchJoystick.currentX}px ${this.touchJoystick.currentY}px, rgba(60, 100, 255, 0.3), rgba(30, 30, 50, 0.85))`
            : 'rgba(30, 30, 50, 0.85)';
    },

    getAnalogHorizontal() {
        if (!this.touchJoystick.active) return 0;
        
        const dx = this.touchJoystick.currentX - this.touchJoystick.startX;
        const distance = Math.sqrt(dx * dx + (this.touchJoystick.currentY - this.touchJoystick.startY) ** 2);
        
        if (distance < this.touchJoystick.deadzone) return 0;
        
        // Normalize to -1 to 1 with slight curve for better control
        const normalized = Math.min(distance / this.touchJoystick.maxRadius, 1);
        const curved = normalized * normalized; // Quadratic curve for precision at low speeds
        return Math.sign(dx) * curved;
    },

    bindGamepad() {
        window.addEventListener('gamepadconnected', (e) => {
            this.gamepadIndex = e.gamepad.index;
            console.log('Gamepad connected:', e.gamepad.id);
        });

        window.addEventListener('gamepaddisconnected', (e) => {
            if (this.gamepadIndex === e.gamepad.index) {
                this.gamepadIndex = null;
            }
        });
    },

    isGameInput(code) {
        const gameKeys = [
            'KeyA', 'KeyD', 'ArrowLeft', 'ArrowRight',
            'Space', 'KeyW', 'ArrowUp',
            'KeyJ', 'KeyK', 'KeyZ', 'KeyX',
            'Escape', 'KeyP'
        ];
        return gameKeys.includes(code);
    },

    updateActions() {
        this.prevActions = { ...this.actions };

        // Keyboard
        const keyLeft = this.keys['KeyA'] || this.keys['ArrowLeft'];
        const keyRight = this.keys['KeyD'] || this.keys['ArrowRight'];
        
        // Analog joystick (touch)
        const analogX = this.getAnalogHorizontal();
        const touchLeft = analogX < -0.1;
        const touchRight = analogX > 0.1;

        // Combine inputs (keyboard takes priority for discrete, analog for smooth)
        this.actions.left = keyLeft || (touchLeft && !keyRight);
        this.actions.right = keyRight || (touchRight && !keyLeft);
        this.actions.jump = this.keys['Space'] || this.keys['KeyW'] || this.keys['ArrowUp'] || this.touchButtons.jump;
        this.actions.attack = this.keys['KeyJ'] || this.keys['KeyK'] || this.keys['KeyZ'] || this.keys['KeyX'] || this.touchButtons.attack;
        this.actions.pause = this.keys['Escape'] || this.keys['KeyP'] || this.touchButtons.pause;

        // Gamepad
        if (this.gamepadIndex !== null) {
            this.pollGamepad();
        }
    },

    pollGamepad() {
        const gamepads = navigator.getGamepads();
        const gp = gamepads[this.gamepadIndex];
        if (!gp) return;

        const deadzone = 0.15;
        const stickX = gp.axes[0] || 0;

        this.actions.left = this.actions.left || stickX < -deadzone;
        this.actions.right = this.actions.right || stickX > deadzone;
        this.actions.jump = this.actions.jump || gp.buttons[0]?.pressed || gp.buttons[1]?.pressed;
        this.actions.attack = this.actions.attack || gp.buttons[2]?.pressed || gp.buttons[3]?.pressed;
        this.actions.pause = this.actions.pause || gp.buttons[9]?.pressed || gp.buttons[10]?.pressed;
    },

    isPressed(action) {
        return this.actions[action];
    },

    isJustPressed(action) {
        return this.actions[action] && !this.prevActions[action];
    },

    isJustReleased(action) {
        return !this.actions[action] && this.prevActions[action];
    },

    getHorizontalAxis() {
        // Return analog value when using touch joystick
        if (this.touchJoystick.active) {
            return this.getAnalogHorizontal();
        }
        // Digital for keyboard/gamepad
        let axis = 0;
        if (this.actions.left) axis -= 1;
        if (this.actions.right) axis += 1;
        return axis;
    },

    getRawHorizontalAxis() {
        // Always return analog for smooth movement
        if (this.touchJoystick.active) {
            return this.getAnalogHorizontal();
        }
        const gamepads = navigator.getGamepads();
        const gp = gamepads[this.gamepadIndex];
        if (gp) {
            const deadzone = 0.15;
            const stickX = gp.axes[0] || 0;
            if (Math.abs(stickX) > deadzone) return stickX;
        }
        let axis = 0;
        if (this.actions.left) axis -= 1;
        if (this.actions.right) axis += 1;
        return axis;
    },

    showTouchControls(show) {
        const controls = document.getElementById('touch-controls');
        if (controls) {
            controls.classList.toggle('hidden', !show);
        }
    },

    setHapticEnabled(enabled) {
        this.hapticEnabled = enabled;
    },

    triggerHaptic(type) {
        if (!this.hapticEnabled) return;
        
        const now = Date.now();
        if (now - this.lastHapticTime < this.hapticCooldown) return;
        this.lastHapticTime = now;

        const patterns = {
            jump: [10, 5, 10],
            attack: [15],
            hit: [20, 10, 30],
            death: [50, 20, 50, 20, 50],
            coin: [5],
            checkpoint: [10, 10, 10],
            button: [5]
        };

        const pattern = patterns[type] || patterns.button;
        
        // Web Vibration API
        if (navigator.vibrate) {
            navigator.vibrate(pattern);
        }
        
        // Android bridge (stronger haptics)
        if (window.AndroidBridge?.vibrate) {
            const duration = pattern.reduce((a, b) => a + b, 0);
            window.AndroidBridge.vibrate(duration);
        }
    },

    generateSounds() {
        this.keySounds = {
            jump: AudioSystem.sounds.jump,
            attack: AudioSystem.sounds.attack,
            pause: AudioSystem.sounds.menuConfirm
        };
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Input;
}