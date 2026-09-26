# Release Checklist for Adventure Quest

## Pre-Release Verification

### Core Gameplay
- [ ] Game launches without errors
- [ ] Main menu displays correctly
- [ ] All 100 levels load and are playable
- [ ] Level progression works (1→2→3...→100)
- [ ] Level select shows correct lock/complete status
- [ ] Player movement: left, right, jump, double jump
- [ ] Player attack: melee, cooldown, hit detection
- [ ] Enemies: walker, chaser, ranged, flying, heavy
- [ ] Boss battles: all 10 bosses functional
- [ ] Final boss (Level 100) complete with victory sequence
- [ ] Checkpoints: activate, respawn, save progress
- [ ] Coins/collectibles: collect, count, persist
- [ ] Health/lives: damage, heal, game over, continue
- [ ] Save/load: progress persists across sessions
- [ ] Achievements: unlock, track, display
- [ ] Daily challenge: generates, completable, rewards
- [ ] Replay levels: unlocked levels replayable

### Mobile Controls
- [ ] Touch buttons: left, right, jump, attack, pause
- [ ] Buttons responsive on small screens (360dp width)
- [ ] Buttons don't overlap gameplay
- [ ] Multi-touch supported (move + jump + attack)
- [ ] Landscape orientation locked
- [ ] Back button: pauses game / navigates menus
- [ ] Home button: pauses game
- [ ] Screen rotation: handled gracefully

### Display & Performance
- [ ] 720p, 1080p, 1440p displays
- [ ] Different aspect ratios (16:9, 18:9, 19.5:9, 20:9)
- [ ] Notch/punch-hole: content not obscured
- [ ] 60 FPS on mid-range devices (Snapdragon 6xx+)
- [ ] 30+ FPS on low-end (Snapdragon 4xx, 2GB RAM)
- [ ] Memory < 150MB during gameplay
- [ ] No memory leaks over 30 min play
- [ ] Battery drain reasonable (<10%/hour)

### Offline Functionality
- [ ] Airplane mode: game fully playable
- [ ] No internet: no crashes, no blocked features
- [ ] Save/load works offline
- [ ] Shop shows "unavailable" not crash
- [ ] Ads fail silently, gameplay continues
- [ ] Purchase attempts show appropriate message

## Android Build Verification

### Debug APK
- [ ] `./gradlew assembleDebug` succeeds
- [ ] Installs on test device
- [ ] Launches without crashes
- [ ] WebView debugging enabled
- [ ] Test AdMob IDs used
- [ ] Test billing (license testers)

### Release AAB
- [ ] `./gradlew bundleRelease` succeeds
- [ ] AAB size < 50MB (target < 30MB)
- [ ] ProGuard/R8 enabled
- [ ] WebView debugging disabled
- [ ] Production AdMob IDs configured
- [ ] Release keystore signing
- [ ] `minifyEnabled true`
- [ ] `shrinkResources true`
- [ ] No debug symbols in release

### Manifest & Permissions
- [ ] `INTERNET` - for ads/billing
- [ ] `ACCESS_NETWORK_STATE` - for ad availability
- [ ] `WAKE_LOCK` - keep screen on during gameplay
- [ ] `BILLING` - in-app purchases
- [ ] No unnecessary permissions (location, contacts, etc.)
- [ ] `allowBackup=false` for save data
- [ ] `usesCleartextTraffic=false` (or true for local assets)
- [ ] `android:exported` set correctly

### App Bundle Validation
- [ ] `bundletool build-apks --bundle=app.aab --output=test.apks`
- [ ] `bundletool install-apks --apks=test.apks`
- [ ] Universal APK extracted and tested
- [ ] Split APKs (config.arch, config.locale) work

## Google Play Console Configuration

### Store Listing
- [ ] App name: "Adventure Quest"
- [ ] Short description (80 chars)
- [ ] Full description (4000 chars)
- [ ] Screenshots: phone (min 2, max 8)
- [ ] Screenshots: 7" tablet (min 1)
- [ ] Screenshots: 10" tablet (min 1)
- [ ] High-res icon (512x512)
- [ ] Feature graphic (1024x500)
- [ ] Promo video (optional)
- [ ] Privacy policy URL
- [ ] Support email/website

### Content Rating
- [ ] Questionnaire completed
- [ ] Rating: Everyone 10+ (fantasy violence)
- [ ] No interactive elements (no chat, no UGC)

### Target Audience
- [ ] Target age: 13+
- [ ] Not child-directed
- [ ] Appeal to children: No

### Data Safety
- [ ] Form completed (see PRIVACY_POLICY_REQUIREMENTS.md)
- [ ] All data types declared
- [ ] Security practices accurate

### In-App Products
- [ ] All 17 products created in Play Console
- [ ] Product IDs match `CONFIG.SHOP_PRODUCT_IDS`
- [ ] Prices set per region
- [ ] Tax categories assigned
- [ ] Test purchases work for license testers

### Subscriptions
- [ ] None (all one-time purchases)

### Testing
- [ ] Internal testing track: 5+ testers
- [ ] Closed testing: 20+ testers
- [ ] Open testing: 100+ testers
- [ ] All tracks pass review

### Release Management
- [ ] Release name: "1.0.0"
- [ ] Release notes written
- [ ] Staged rollout: 10% → 25% → 50% → 100%
- [ ] Rollback plan documented

## AdMob Configuration

### Production Setup
- [ ] AdMob account linked to Play Console
- [ ] App added in AdMob with correct package name
- [ ] Ad units created:
  - Banner: Main Menu, Level Select, Settings
  - Interstitial: After level complete
  - Rewarded: Revive, Checkpoint, Coins, Powerup
- [ ] Test device IDs added
- [ ] GDPR/CCPA messaging configured (UMP)
- [ ] App-ads.txt hosted on developer domain

### Ad Policies
- [ ] No ads during gameplay
- [ ] No interstitial on app launch
- [ ] Frequency capping configured
- [ ] Rewarded ads clearly labeled optional
- [ ] No encouragement to click ads

## Billing Configuration

### Play Console
- [ ] Merchant account linked
- [ ] All products active
- [ ] License testers added
- [ ] Test purchase flows work
- [ ] Refund policy documented

### Security
- [ ] Play Integrity API enabled (if used)
- [ ] Server-side verification endpoint (if used)
- [ ] Obfuscated purchase handling code

## Security Hardening

### Release Build
- [ ] ProGuard/R8 rules applied
- [ ] WebView debugging disabled
- [ ] No `console.log` in production JS
- [ ] No test IDs in production
- [ ] Bridge methods minimized
- [ ] Integrity checks in critical paths

### Anti-Tamper
- [ ] Save checksum validation
- [ ] Value bounds checking
- [ ] Progression validation
- [ ] Runtime anomaly detection
- [ ] Graceful degradation (not hard blocks)

## Compatibility Testing

### Device Matrix
| Device | API | RAM | Tested |
|--------|-----|-----|--------|
| Pixel 8 | 34 | 8GB | |
| Pixel 6a | 33 | 6GB | |
| Galaxy S23 | 33 | 8GB | |
| Galaxy A54 | 33 | 6GB | |
| Moto G Power | 32 | 4GB | |
| Low-end (Go) | 30 | 2GB | |
| Tablet 7" | 31 | 4GB | |
| Tablet 10" | 32 | 6GB | |
| Foldable | 33 | 12GB | |

### OS Versions
- [ ] Android 8.0 (API 26) - Min SDK
- [ ] Android 10 (API 29)
- [ ] Android 12 (API 31)
- [ ] Android 13 (API 33)
- [ ] Android 14 (API 34) - Target SDK

### Edge Cases
- [ ] Low storage (<100MB free)
- [ ] Low memory (OOM killer)
- [ ] Background/foreground transitions
- [ ] Phone call interruption
- [ ] Notification shade pull
- [ ] Split screen mode
- [ ] Picture-in-picture (not supported, verify pause)

## Post-Release Monitoring

### Day 1
- [ ] Crash rate < 1%
- [ ] ANR rate < 0.5%
- [ ] Purchase success rate > 95%
- [ ] Ad fill rate > 80%
- [ ] No critical bugs reported

### Week 1
- [ ] Retention D1 > 30%
- [ ] Retention D7 > 10%
- [ ] Average session length > 5 min
- [ ] Level completion funnel analyzed
- [ ] Difficulty spikes identified

### Ongoing
- [ ] Weekly crash review
- [ ] Monthly security audit
- [ ] Quarterly dependency updates
- [ ] User feedback review

## Rollback Triggers
- Crash rate > 5%
- Purchase failures > 10%
- Data loss reports
- Security vulnerability
- Policy violation warning

## Sign-Off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Developer | | | |
| QA Lead | | | |
| Product Owner | | | |
| Security Review | | | |
| Release Manager | | | |

---

**Version**: 1.0.0
**Date**: 2026-09-26
**Status**: Pre-Release