# Adventure Quest - 100-Level 2D Action-Platform Adventure

A complete, polished, production-quality 2D mobile game built with HTML5 Canvas and vanilla JavaScript. Packaged as an Android App Bundle for Google Play.

## Features

- **100 Hand-Crafted Levels** across 10 unique themes
- **Offline-First**: Fully playable without internet
- **5 Enemy Types** with unique behaviors
- **10 Boss Battles** with multiple phases
- **Data-Driven Level System** with procedural generation
- **Save System** with integrity validation
- **Achievements** (10 local achievements)
- **Daily Challenges** (deterministic, offline)
- **In-Game Shop** with cosmetics and power-ups
- **Google Play Billing** integration
- **AdMob Monetization** (banner, interstitial, rewarded)
- **Security Hardened** against casual tampering
- **Low-End Optimized** (runs on 2GB RAM devices)

## Game Themes

1. **Forest** (Levels 1-10) - Beginner
2. **Cave** (Levels 11-20) - Easy/Intermediate
3. **Desert** (Levels 21-30) - Intermediate
4. **Snow** (Levels 31-40) - Advanced
5. **Ruins** (Levels 41-50) - Advanced
6. **Volcano** (Levels 51-60) - Hard
7. **Factory** (Levels 61-70) - Hard
8. **Night City** (Levels 71-80) - Very Hard
9. **Ancient Temple** (Levels 81-90) - Very Hard
10. **Final Realm** (Levels 91-100) - Final Challenge

## Project Structure

```
game/
├── index.html              # Entry point
├── css/
│   └── style.css           # All styling
├── js/
│   ├── config.js           # Game configuration
│   ├── utils.js            # Helper functions
│   ├── save.js             # Save/load system
│   ├── audio.js            # Audio system
│   ├── physics.js          # Physics engine
│   ├── collision.js        # Collision detection
│   ├── particles.js        # Particle system
│   ├── input.js            # Input handling
│   ├── camera.js           # Camera system
│   ├── player.js           # Player class
│   ├── enemy.js            # Enemy classes
│   ├── boss.js             # Boss classes
│   ├── level.js            # Level class
│   ├── levels.js           # Level data
│   ├── levelGenerator.js   # Procedural generation
│   ├── ui.js               # UI system
│   ├── game.js             # Main game loop
│   └── main.js             # Initialization
├── assets/
│   ├── images/             # (code-generated)
│   └── audio/              # (procedural)
├── android/                # Android WebView wrapper
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── java/com/adventurequest/
│   │   │   ├── assets/game/  # Copied game files
│   │   │   ├── res/
│   │   │   └── AndroidManifest.xml
│   │   ├── build.gradle.kts
│   │   └── proguard-rules.pro
│   ├── build.gradle.kts
│   ├── settings.gradle.kts
│   └── gradle.properties
├── SECURITY.md
├── SECURITY_TEST_CHECKLIST.md
├── PRIVACY_POLICY_REQUIREMENTS.md
├── RELEASE_CHECKLIST.md
└── README.md
```

## Running the Game

### Desktop Browser
```bash
cd game
# Serve with any static server
npx serve .
# or
python3 -m http.server 8080
# Open http://localhost:8080
```

### Android Development

1. **Prerequisites**:
   - Android Studio (latest)
   - Android SDK 34
   - JDK 17
   - Gradle 8.2+

2. **Build Debug APK**:
   ```bash
   cd game/android
   ./gradlew assembleDebug
   # Output: app/build/outputs/apk/debug/app-debug.apk
   ```

3. **Build Release AAB**:
   ```bash
   cd game/android
   ./gradlew bundleRelease
   # Output: app/build/outputs/bundle/release/app-release.aab
   ```

4. **Install on Device**:
   ```bash
   adb install app/build/outputs/apk/debug/app-debug.apk
   ```

## Configuration

### Game Config (`js/config.js`)
All game constants centralized:
- Physics values (gravity, speed, jump power)
- Player stats (health, damage, lives)
- Enemy configurations per type
- Boss stats per tier
- Level generation parameters
- Audio volumes
- Security limits
- Debug flags

### Shop Items (`js/config.js` - CONFIG.shop.items)
17 products across 5 categories:
- **Coins**: 4 packs ($0.69 - $9.99)
- **Skins**: 3 character skins ($0.69 - $1.49)
- **Effects**: 3 trail effects ($0.69 each)
- **Power-ups**: 3 consumables ($0.69 each)
- **Bundles**: 2 bundles ($4.99, $9.99)

### AdMob IDs (`android/app/src/main/res/values/strings.xml`)
Replace test IDs with production:
```xml
<string name="admob_app_id">ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX</string>
<string name="admob_banner_id">ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX</string>
<string name="admob_interstitial_id">ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX</string>
<string name="admob_rewarded_id">ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX</string>
```

### Billing Products
Configure in Google Play Console with IDs matching `CONFIG.SHOP_PRODUCT_IDS`:
- `coins_small`, `coins_medium`, `coins_large`, `coins_mega`
- `skin_red`, `skin_blue`, `skin_gold`
- `trail_fire`, `trail_ice`, `trail_shadow`
- `outfit_ninja`, `outfit_knight`
- `powerup_life`, `powerup_shield`, `powerup_boost`
- `bundle_starter`, `bundle_pro`

## Security Features

- Save data checksum validation
- Value bounds checking (coins, score, health, lives)
- Progression validation (no level skipping)
- Anti-cheat: impossible action detection
- WebView bridge: only 8 methods exposed
- Purchase verification via Play Billing
- No secrets in JavaScript
- ProGuard/R8 obfuscation on release

## Testing

```bash
# Run all security checks
./gradlew lintSecurity

# Unit tests
./gradlew test

# Instrumented tests
./gradlew connectedAndroidTest

# Manual testing checklist in RELEASE_CHECKLIST.md
```

## Building for Release

1. **Generate Keystore**:
   ```bash
   keytool -genkey -v -keystore keystore/release.keystore \
     -alias adventurequest -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Set Environment Variables**:
   ```bash
   export KEYSTORE_PASSWORD=your_keystore_password
   export KEY_ALIAS=adventurequest
   export KEY_PASSWORD=your_key_password
   ```

3. **Build AAB**:
   ```bash
   cd game/android
   ./gradlew bundleRelease
   ```

4. **Upload to Play Console**: Use the generated `.aab` file

## Credits

Built with:
- HTML5 Canvas API
- Vanilla JavaScript (ES6+)
- Web Audio API (procedural sound)
- Android WebView
- Google Play Billing Library 6
- Google Mobile Ads SDK 22

No game engines, frameworks, or external JS libraries used.

## License

Proprietary - All rights reserved.

## Support

For issues, check:
- `SECURITY_TEST_CHECKLIST.md` for security testing
- `RELEASE_CHECKLIST.md` for release verification
- `PRIVACY_POLICY_REQUIREMENTS.md` for compliance

---

**Adventure Quest** - 100 Levels of Pure Platforming Adventure!