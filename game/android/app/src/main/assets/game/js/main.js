let gameInitialized = false;

function initGame() {
    if (gameInitialized) return;
    gameInitialized = true;

    Game.init();

    if (CONFIG.debug.unlockAllLevels) {
        const saveData = SaveSystem.defaultSave();
        for (let i = 1; i <= CONFIG.progression.totalLevels; i++) {
            saveData.unlockedLevels.push(i);
        }
        SaveSystem.save(saveData);
    }

    if (CONFIG.debug.skipToLevel > 0) {
        Game.startLevel(CONFIG.debug.skipToLevel);
    }

    console.log('Adventure Quest initialized');
    console.log(`Total Levels: ${CONFIG.progression.totalLevels}`);
    console.log(`Debug Mode: ${CONFIG.debug.invincible ? 'ON' : 'OFF'}`);
}

function handleAndroidBridge() {
    if (typeof AndroidBridge !== 'undefined') {
        window.AndroidBridge = {
            onPurchaseSuccess: (productId, purchaseToken, orderId) => {
                console.log('Purchase success:', productId);
                SaveSystem.recordPurchase(productId, purchaseToken, orderId);
                Game.handlePurchaseSuccess(productId);
            },
            onPurchaseFailure: (productId, errorCode, errorMessage) => {
                console.log('Purchase failed:', productId, errorCode, errorMessage);
                UI.showNotification('Purchase failed: ' + errorMessage);
            },
            onPurchaseCancelled: (productId) => {
                console.log('Purchase cancelled:', productId);
                UI.showNotification('Purchase cancelled');
            },
            onPurchasesRestored: (products) => {
                console.log('Purchases restored:', products);
                products.forEach(p => SaveSystem.markPurchaseRestored(p));
                UI.showNotification('Purchases restored!');
                UI.renderShop();
            },
            onAdLoaded: (adType) => {
                console.log('Ad loaded:', adType);
            },
            onAdFailed: (adType, errorCode) => {
                console.log('Ad failed:', adType, errorCode);
            },
            onRewardedAdComplete: (rewardType) => {
                console.log('Rewarded ad complete:', rewardType);
                Game.handleRewardedAdComplete(rewardType);
            },
            onBackPressed: () => {
                if (Game.state === 'playing') {
                    Game.pause();
                    return true;
                } else if (Game.state === 'paused') {
                    Game.resume();
                    return true;
                } else if (UI.currentScreen !== 'mainMenu') {
                    UI.handleAction('back');
                    return true;
                }
                return false;
            }
        };
    }
}

document.addEventListener('DOMContentLoaded', () => {
    handleAndroidBridge();
    initGame();
});

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        AudioSystem.suspend();
        if (Game.state === 'playing') {
            Game.pause();
        }
    } else {
        AudioSystem.resume();
    }
});

window.addEventListener('beforeunload', () => {
    if (Game.player && Game.level) {
        SaveSystem.setCheckpoint(Game.currentLevel, {
            x: Game.player.x,
            y: Game.player.y,
            health: Game.player.health,
            coins: Game.player.coins,
            score: Game.player.score
        });
    }
});

Game.handlePurchaseSuccess = function(productId) {
    const item = CONFIG.shop.items[productId];
    if (!item) return;

    if (item.category === 'coins') {
        SaveSystem.addCoins(item.coins);
        UI.showNotification(`Received ${item.coins} coins!`);
    } else if (item.cosmetic) {
        const type = item.category === 'skins' ? 'skins' : 'trails';
        SaveSystem.addCosmetic(type, itemId);
        SaveSystem.equipCosmetic(type, itemId);
        UI.showNotification(`${item.name} unlocked and equipped!`);
    } else if (item.consumable) {
        SaveSystem.addInventoryItem(itemId, 1);
        UI.showNotification(`${item.name} added to inventory!`);
    } else if (item.includes) {
        item.includes.forEach(includedId => {
            Game.handlePurchaseSuccess(includedId);
        });
    }

    UI.renderShop();
};

Game.handleRewardedAdComplete = function(rewardType) {
    const rewards = {
        revive: () => {
            Game.player.health = Game.player.maxHealth;
            Game.player.lives++;
            UI.showNotification('Revived with full health!');
        },
        checkpoint: () => {
            const checkpoint = SaveSystem.getCheckpoint();
            if (checkpoint) {
                Game.player.x = checkpoint.x;
                Game.player.y = checkpoint.y;
                Game.player.health = checkpoint.health;
                UI.showNotification('Continued from checkpoint!');
            }
        },
        coins: () => {
            SaveSystem.addCoins(50);
            UI.showNotification('Received 50 bonus coins!');
        },
        powerup: () => {
            SaveSystem.addInventoryItem('powerup_boost', 1);
            UI.showNotification('Speed Boost added to inventory!');
        }
    };

    if (rewards[rewardType]) {
        rewards[rewardType]();
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initGame };
}