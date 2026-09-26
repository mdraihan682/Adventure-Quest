# Security Documentation

## Overview
This document describes the security architecture and measures implemented in Adventure Quest to protect against tampering, cheating, and unauthorized modifications.

## Threat Model
- **Attacker**: User with physical access to device
- **Capabilities**: APK modification, memory editing, save file editing, WebView JavaScript injection, network interception
- **Goals**: Unlock levels, infinite coins/health, bypass ads, fake purchases, manipulate leaderboards

## Offline Security (Primary Defense)
Since the game is offline-first, server-side validation is not available for core gameplay. We implement client-side protection layers:

### 1. Save Data Integrity
- **Checksum Validation**: All saves include SHA-256 checksum with per-install salt
- **Value Bounds Checking**: Coins, score, health, lives validated against maximums
- **Structure Validation**: Save schema verified on load
- **Corruption Handling**: Invalid saves reset to default, not crashed

### 2. Anti-Cheat Mechanisms
- **Impossible Value Detection**:
  - Negative coins/health/score
  - Health > maxHealth
  - Level progression skipping
  - Completion times below physics minimum
  - Inventory counts exceeding acquisition limits
- **Multi-Signal Approach**: Single anomaly logs warning; multiple signals trigger restrictions
- **Progressive Response**: Warning → Score invalidation → Save reset (last resort)

### 3. WebView Security
- **Bridge Exposure**: Only 8 methods exposed to JavaScript:
  - `purchaseProduct()`
  - `restorePurchases()`
  - `showInterstitialAd()`
  - `showRewardedAd(rewardType)`
  - `vibrate()`
  - `setKeepScreenOn()`
  - `exitGame()`
- **Message Validation**: All bridge calls validated on Android side
- **No Arbitrary Code**: JavaScript cannot execute shell commands, access filesystem, or call arbitrary Android APIs
- **Content Security**: Only local `file://` URLs loaded; no remote content

### 4. Purchase Security (Google Play Billing)
- **Server-Side Verification**: Purchase tokens verified via Play Developer API (when online)
- **Local Validation**: Signature verification using Play Public Key
- **Consumable Tracking**: One-time consumables tracked to prevent duplicate grants
- **State Machine**: Handles SUCCESS, PENDING, CANCELED, DEFERRED, ALREADY_OWNED
- **Offline Behavior**: Purchases queued, processed when online; no fake success

### 5. AdMob Security
- **Test IDs in Development**: Never production IDs in debug builds
- **Reward Validation**: Rewards only granted via official AdMob callback
- **Frequency Capping**: Max 3 interstitial ads per 2 minutes
- **No Ad-Gating**: Core gameplay never blocked by ad failures

## Online Security (Future-Proofing)
### Play Integrity API
- **Prepared Integration**: Code structure ready for Play Integrity checks
- **Use Cases**: Purchase validation, leaderboard submission, anti-tamper attestation
- **Limitations Documented**: Cannot prevent offline save editing

### Network Security (When Implemented)
- HTTPS only with certificate pinning
- Request/response validation
- No secrets in JavaScript
- Server-authoritative for competitive features

## Known Limitations
1. **Rooted Devices**: Can bypass all client-side checks
2. **Memory Editors**: Can modify runtime values (health, coins)
3. **Save File Editing**: Checksums can be recalculated with extracted salt
4. **WebView Injection**: Debug builds allow JavaScript injection
5. **APK Modification**: Resources and code can be changed

## Mitigations for Limitations
- **Obfuscation**: R8/ProGuard on release builds
- **Integrity Checks**: Self-checksumming critical code paths
- **Detection Logging**: Anomalies logged for analysis
- **Graceful Degradation**: Cheaters can play but not affect others (no multiplayer)

## Release Security Checklist
- [ ] Debug logging disabled
- [ ] WebView debugging disabled
- [ ] Test AdMob IDs replaced with production
- [ ] Play Console billing products configured
- [ ] ProGuard/R8 enabled
- [ ] Signing with release keystore
- [ ] Play Integrity configured (if used)
- [ ] Privacy policy published
- [ ] Data safety form completed

## Incident Response
1. Detect anomaly via analytics
2. Analyze pattern (single user vs widespread)
3. Update detection heuristics
4. Force app update if critical
5. No permanent bans for offline game