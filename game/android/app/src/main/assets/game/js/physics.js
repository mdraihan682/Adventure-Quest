const Physics = {
    gravity: CONFIG.physics.gravity,
    terminalVelocity: CONFIG.physics.terminalVelocity,
    friction: CONFIG.physics.friction,
    airFriction: CONFIG.physics.airFriction,

    applyGravity(entity, dt) {
        if (!entity.grounded) {
            entity.velocityY += this.gravity * dt;
            if (entity.velocityY > this.terminalVelocity) {
                entity.velocityY = this.terminalVelocity;
            }
        }
    },

    applyFriction(entity, dt) {
        if (entity.grounded) {
            entity.velocityX *= Math.pow(this.friction, dt);
            if (Math.abs(entity.velocityX) < 0.05) entity.velocityX = 0;
        } else {
            entity.velocityX *= Math.pow(this.airFriction, dt);
            if (Math.abs(entity.velocityX) < 0.02) entity.velocityX = 0;
        }
    },

    applyAcceleration(entity, direction, dt) {
        const accel = CONFIG.physics.moveAcceleration * dt;
        entity.velocityX += direction * accel;
        const maxSpeed = CONFIG.physics.maxSpeed;
        entity.velocityX = Utils.clamp(entity.velocityX, -maxSpeed, maxSpeed);
    },

    applyJump(entity, jumpPower = CONFIG.physics.jumpPower) {
        if (entity.canJump()) {
            entity.velocityY = jumpPower;
            entity.grounded = false;
            entity.jumpsUsed++;
            return true;
        }
        return false;
    },

    updatePosition(entity, dt) {
        entity.x += entity.velocityX * dt;
        entity.y += entity.velocityY * dt;
    },

    resolveCollision(entity, platform, resolveX = true, resolveY = true) {
        const overlapX = Math.min(
            entity.x + entity.width - platform.x,
            platform.x + platform.width - entity.x
        );
        const overlapY = Math.min(
            entity.y + entity.height - platform.y,
            platform.y + platform.height - entity.y
        );

        if (overlapX <= 0 || overlapY <= 0) return { x: false, y: false };

        const resolved = { x: false, y: false };

        if (overlapX < overlapY) {
            if (resolveX) {
                if (entity.x < platform.x) {
                    entity.x = platform.x - entity.width;
                } else {
                    entity.x = platform.x + platform.width;
                }
                entity.velocityX = 0;
                resolved.x = true;
            }
        } else {
            if (resolveY) {
                if (entity.y < platform.y) {
                    entity.y = platform.y - entity.height;
                    entity.velocityY = 0;
                    entity.grounded = true;
                    entity.jumpsUsed = 0;
                    resolved.y = true;
                } else {
                    entity.y = platform.y + platform.height;
                    entity.velocityY = 0;
                    resolved.y = true;
                }
            }
        }

        return resolved;
    },

    checkPlatformCollision(entity, platforms) {
        entity.grounded = false;
        let highestPlatform = null;
        let highestY = Infinity;

        for (const platform of platforms) {
            if (!platform.solid) continue;
            if (entity.x + entity.width <= platform.x) continue;
            if (entity.x >= platform.x + platform.width) continue;
            if (entity.y + entity.height <= platform.y) continue;
            if (entity.y >= platform.y + platform.height) continue;

            const overlapY = Math.min(
                entity.y + entity.height - platform.y,
                platform.y + platform.height - entity.y
            );

            if (entity.velocityY >= 0 && entity.y < platform.y && overlapY < entity.height * 0.7) {
                if (platform.y < highestY) {
                    highestY = platform.y;
                    highestPlatform = platform;
                }
            }
        }

        if (highestPlatform) {
            entity.y = highestPlatform.y - entity.height;
            entity.velocityY = 0;
            entity.grounded = true;
            entity.jumpsUsed = 0;
            entity.currentPlatform = highestPlatform;
            return highestPlatform;
        }

        entity.currentPlatform = null;
        return null;
    },

    checkHorizontalCollisions(entity, platforms) {
        for (const platform of platforms) {
            if (!platform.solid) continue;
            if (entity.y + entity.height <= platform.y + 2) continue;
            if (entity.y >= platform.y + platform.height - 2) continue;
            if (entity.x + entity.width <= platform.x) continue;
            if (entity.x >= platform.x + platform.width) continue;

            const overlapX = Math.min(
                entity.x + entity.width - platform.x,
                platform.x + platform.width - entity.x
            );

            if (entity.velocityX > 0 && entity.x < platform.x) {
                entity.x = platform.x - entity.width;
                entity.velocityX = 0;
                return { side: 'right', platform };
            } else if (entity.velocityX < 0 && entity.x > platform.x) {
                entity.x = platform.x + platform.width;
                entity.velocityX = 0;
                return { side: 'left', platform };
            }
        }
        return null;
    },

    applyKnockback(entity, forceX, forceY) {
        entity.velocityX = forceX;
        entity.velocityY = forceY;
        entity.grounded = false;
        entity.knockbackTimer = CONFIG.physics.knockbackDuration;
    },

    updateKnockback(entity, dt) {
        if (entity.knockbackTimer > 0) {
            entity.knockbackTimer -= dt;
            if (entity.knockbackTimer <= 0) {
                entity.knockbackTimer = 0;
            }
        }
    },

    isInKnockback(entity) {
        return entity.knockbackTimer > 0;
    },

    checkFallDeath(entity, levelHeight) {
        return entity.y > levelHeight + 200;
    },

    checkBoundaryCollision(entity, levelWidth, levelHeight) {
        let collided = false;
        if (entity.x < 0) {
            entity.x = 0;
            entity.velocityX = 0;
            collided = true;
        }
        if (entity.x + entity.width > levelWidth) {
            entity.x = levelWidth - entity.width;
            entity.velocityX = 0;
            collided = true;
        }
        if (entity.y < 0) {
            entity.y = 0;
            entity.velocityY = 0;
            collided = true;
        }
        return collided;
    },

    calculateParTime(levelWidth, difficulty) {
        const baseSpeed = CONFIG.physics.maxSpeed * 0.7;
        const baseTime = (levelWidth / baseSpeed) * 1000;
        const difficultyMultiplier = 1 + (difficulty - 1) * 0.15;
        return Math.round(baseTime * difficultyMultiplier);
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Physics;
}