const Collision = {
    rectRect(a, b) {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    },

    rectRectOverlap(a, b) {
        const overlapX = Math.min(
            a.x + a.width - b.x,
            b.x + b.width - a.x
        );
        const overlapY = Math.min(
            a.y + a.height - b.y,
            b.y + b.height - a.y
        );
        return { x: overlapX > 0 ? overlapX : 0, y: overlapY > 0 ? overlapY : 0 };
    },

    circleRect(circle, rect) {
        const closestX = Utils.clamp(circle.x, rect.x, rect.x + rect.width);
        const closestY = Utils.clamp(circle.y, rect.y, rect.y + rect.height);
        const dx = circle.x - closestX;
        const dy = circle.y - closestY;
        return dx * dx + dy * dy < circle.radius * circle.radius;
    },

    circleCircle(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const distSq = dx * dx + dy * dy;
        const radiusSum = a.radius + b.radius;
        return distSq < radiusSum * radiusSum;
    },

    pointRect(point, rect) {
        return point.x >= rect.x &&
               point.x <= rect.x + rect.width &&
               point.y >= rect.y &&
               point.y <= rect.y + rect.height;
    },

    lineRect(x1, y1, x2, y2, rect) {
        if (this.pointRect({ x: x1, y: y1 }, rect) || this.pointRect({ x: x2, y: y2 }, rect)) {
            return true;
        }

        const edges = [
            { x1: rect.x, y1: rect.y, x2: rect.x + rect.width, y2: rect.y },
            { x1: rect.x + rect.width, y1: rect.y, x2: rect.x + rect.width, y2: rect.y + rect.height },
            { x1: rect.x + rect.width, y1: rect.y + rect.height, x2: rect.x, y2: rect.y + rect.height },
            { x1: rect.x, y1: rect.y + rect.height, x2: rect.x, y2: rect.y }
        ];

        for (const edge of edges) {
            if (this.lineLine(x1, y1, x2, y2, edge.x1, edge.y1, edge.x2, edge.y2)) {
                return true;
            }
        }
        return false;
    },

    lineLine(x1, y1, x2, y2, x3, y3, x4, y4) {
        const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        if (denom === 0) return false;

        const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
        const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

        return t >= 0 && t <= 1 && u >= 0 && u <= 1;
    },

    playerPlatform(player, platform) {
        if (!platform.solid) return false;
        return this.rectRect(player, platform);
    },

    playerEnemy(player, enemy) {
        if (enemy.invincible || enemy.dead) return false;
        if (player.invincible) return false;
        return this.rectRect(player, enemy);
    },

    attackEnemy(attackBox, enemy) {
        if (enemy.invincible || enemy.dead) return false;
        return this.rectRect(attackBox, enemy);
    },

    playerCollectible(player, collectible) {
        if (collectible.collected) return false;
        return this.rectRect(player, collectible);
    },

    playerHazard(player, hazard) {
        if (player.invincible) return false;
        return this.rectRect(player, hazard);
    },

    playerCheckpoint(player, checkpoint) {
        if (checkpoint.activated) return false;
        return this.rectRect(player, checkpoint);
    },

    playerExit(player, exit) {
        return this.rectRect(player, exit);
    },

    projectileEntity(projectile, entity) {
        if (entity.dead || entity.invincible) return false;
        return this.rectRect(projectile, entity);
    },

    getCollisionDirection(a, b) {
        const centerAX = a.x + a.width / 2;
        const centerAY = a.y + a.height / 2;
        const centerBX = b.x + b.width / 2;
        const centerBY = b.y + b.height / 2;

        const dx = centerBX - centerAX;
        const dy = centerBY - centerAY;

        const absX = Math.abs(dx);
        const absY = Math.abs(dy);

        if (absX > absY) {
            return dx > 0 ? 'left' : 'right';
        } else {
            return dy > 0 ? 'top' : 'bottom';
        }
    },

    resolveRectRect(a, b) {
        const overlap = this.rectRectOverlap(a, b);
        if (overlap.x === 0 && overlap.y === 0) return null;

        if (overlap.x < overlap.y) {
            return { axis: 'x', overlap: overlap.x, direction: a.x < b.x ? -1 : 1 };
        } else {
            return { axis: 'y', overlap: overlap.y, direction: a.y < b.y ? -1 : 1 };
        }
    },

    broadPhase(entities, gridSize = 200) {
        const grid = new Map();

        entities.forEach((entity, index) => {
            const minX = Math.floor(entity.x / gridSize);
            const maxX = Math.floor((entity.x + entity.width) / gridSize);
            const minY = Math.floor(entity.y / gridSize);
            const maxY = Math.floor((entity.y + entity.height) / gridSize);

            for (let gx = minX; gx <= maxX; gx++) {
                for (let gy = minY; gy <= maxY; gy++) {
                    const key = `${gx},${gy}`;
                    if (!grid.has(key)) grid.set(key, []);
                    grid.get(key).push({ entity, index });
                }
            }
        });

        const pairs = new Set();
        grid.forEach(cell => {
            for (let i = 0; i < cell.length; i++) {
                for (let j = i + 1; j < cell.length; j++) {
                    const a = cell[i];
                    const b = cell[j];
                    const key = a.index < b.index ? `${a.index},${b.index}` : `${b.index},${a.index}`;
                    pairs.add(key);
                }
            }
        });

        return Array.from(pairs).map(pair => {
            const [a, b] = pair.split(',').map(Number);
            return [a, b];
        });
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Collision;
}