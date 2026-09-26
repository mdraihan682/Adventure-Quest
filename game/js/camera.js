const Camera = {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    shakeX: 0,
    shakeY: 0,
    shakeIntensity: 0,
    shakeDecay: CONFIG.camera.shakeDecay,
    lerp: CONFIG.camera.lerp,
    lookAhead: CONFIG.camera.lookAhead,
    deadzone: CONFIG.camera.deadzone,
    levelWidth: 0,
    levelHeight: 0,
    canvasWidth: 0,
    canvasHeight: 0,

    init(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
    },

    setLevelBounds(width, height) {
        this.levelWidth = width;
        this.levelHeight = height;
    },

    follow(entity, dt) {
        const targetX = entity.x + entity.width / 2;
        const targetY = entity.y + entity.height / 2;

        let desiredX = targetX;
        let desiredY = targetY;

        if (entity.velocityX > 0) {
            desiredX += this.lookAhead;
        } else if (entity.velocityX < 0) {
            desiredX -= this.lookAhead;
        }

        if (entity.velocityY > 0) {
            desiredY += this.lookAhead * 0.5;
        } else if (entity.velocityY < 0) {
            desiredY -= this.lookAhead * 0.5;
        }

        const dx = desiredX - this.targetX;
        const dy = desiredY - this.targetY;

        if (Math.abs(dx) > this.deadzone) {
            this.targetX += dx * this.lerp * dt * 60;
        }

        if (Math.abs(dy) > this.deadzone) {
            this.targetY += dy * this.lerp * dt * 60;
        }

        this.updatePosition(dt);
    },

    updatePosition(dt) {
        this.x += (this.targetX - this.x - this.canvasWidth / 2) * this.lerp * dt * 60;
        this.y += (this.targetY - this.y - this.canvasHeight / 2) * this.lerp * dt * 60;

        this.clampToLevel();

        if (this.shakeIntensity > 0) {
            this.shakeX = (Math.random() - 0.5) * this.shakeIntensity * 2;
            this.shakeY = (Math.random() - 0.5) * this.shakeIntensity * 2;
            this.shakeIntensity *= this.shakeDecay;
            if (this.shakeIntensity < 0.5) this.shakeIntensity = 0;
        } else {
            this.shakeX = 0;
            this.shakeY = 0;
        }
    },

    clampToLevel() {
        const minX = 0;
        const maxX = Math.max(0, this.levelWidth - this.canvasWidth);
        const minY = 0;
        const maxY = Math.max(0, this.levelHeight - this.canvasHeight);

        this.x = Utils.clamp(this.x, minX, maxX);
        this.y = Utils.clamp(this.y, minY, maxY);
    },

    shake(intensity) {
        this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    },

    getScreenX(worldX) {
        return worldX - this.x + this.shakeX;
    },

    getScreenY(worldY) {
        return worldY - this.y + this.shakeY;
    },

    getWorldX(screenX) {
        return screenX + this.x - this.shakeX;
    },

    getWorldY(screenY) {
        return screenY + this.y - this.shakeY;
    },

    isVisible(entity, margin = 50) {
        return entity.x + entity.width + margin > this.x &&
               entity.x - margin < this.x + this.canvasWidth &&
               entity.y + entity.height + margin > this.y &&
               entity.y - margin < this.y + this.canvasHeight;
    },

    reset() {
        this.x = 0;
        this.y = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.shakeX = 0;
        this.shakeY = 0;
        this.shakeIntensity = 0;
    },

    snapTo(entity) {
        this.targetX = entity.x + entity.width / 2;
        this.targetY = entity.y + entity.height / 2;
        this.x = this.targetX - this.canvasWidth / 2;
        this.y = this.targetY - this.canvasHeight / 2;
        this.clampToLevel();
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Camera;
}