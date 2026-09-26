# Privacy Policy Requirements for Adventure Quest

## Data Collection Summary
**Adventure Quest collects NO personal data.**

### Data Stored Locally (On Device Only)
- Game progress (levels completed, scores, coins)
- Settings preferences (volume, graphics, controls)
- Achievement progress
- Purchase history (for restore functionality)
- Daily challenge completion status

### Data NOT Collected
- No personally identifiable information (PII)
- No device identifiers (IMEI, Android ID, Advertising ID)
- No location data
- No contacts, photos, or media
- No microphone/camera access
- No account creation or login
- No analytics or tracking
- No crash reporting (in offline mode)

## Third-Party Services

### Google Play Billing Library
- **Purpose**: In-app purchases
- **Data Shared**: Purchase tokens, order IDs, product IDs
- **Data Controller**: Google Play
- **User Consent**: Implicit via Play Store purchase flow
- **Retention**: Per Google Play policies

### Google AdMob
- **Purpose**: Display advertisements
- **Data Shared**: 
  - Device info (model, OS version)
  - IP address (for geolocation)
  - Advertising ID (if available)
  - App install/usage data
- **Data Controller**: Google
- **User Consent**: 
  - GDPR: Consent via UMP (User Messaging Platform)
  - CCPA: Opt-out via AdMob settings
- **Children**: Tagged for child-directed treatment if applicable
- **Retention**: Per Google AdMob policies

## Legal Basis (GDPR)
- **Legitimate Interest**: Game functionality (save data)
- **Contract**: Purchase processing (Play Billing)
- **Consent**: Personalized ads (AdMob UMP)

## User Rights
### Access
- Users can view all local data in-game via Settings → Save Data

### Rectification
- Users can reset save data in Settings

### Erasure
- Uninstall app → All local data deleted
- No server-side data to delete

### Portability
- Export save feature available in Settings

### Restriction
- Disable ads → Purchase "Remove Ads" or use offline mode
- Disable billing → Play offline

### Objection
- Opt out of personalized ads via AdMob settings

## Children's Privacy (COPPA)
- **Target Audience**: General audience (13+)
- **Age Gate**: Not required (not child-directed)
- **If Child-Directed**: 
  - Disable personalized ads
  - Disable Play Billing
  - No data collection

## Data Security
- Local save: JSON with integrity checksum
- No encryption (offline game, user-accessible)
- No network transmission of gameplay data
- Purchase tokens handled by Play Billing

## International Transfers
- AdMob: Data processed in US (Google Standard Contractual Clauses)
- Play Billing: Data processed per Google Play ToS

## Retention Periods
- Local save: Until app uninstalled or user resets
- Purchase records: Per Google Play (typically 3 years)
- Ad data: Per Google AdMob (typically 14-38 months)

## Privacy Policy URL
Must be hosted at: `https://yourdomain.com/privacy-policy`

## Required Privacy Policy Sections
1. **Identity**: Developer name/contact
2. **Data Collected**: As listed above
3. **Purpose**: Game functionality, purchases, ads
4. **Legal Basis**: As listed above
5. **Third Parties**: Google Play, AdMob
6. **Retention**: As listed above
7. **User Rights**: As listed above
8. **Children**: COPPA compliance statement
9. **Security**: Local storage, no transmission
10. **Changes**: Notification method
11. **Contact**: Email for privacy inquiries

## Data Safety Form (Play Console)
### Data Collected
| Data Type | Collected? | Purpose | Shared? |
|-----------|------------|---------|---------|
| Personal Info | No | - | No |
| Financial Info | Yes (Play) | Purchases | Google |
| Location | No | - | No |
| Contacts | No | - | No |
| Photos/Videos | No | - | No |
| Audio | No | - | No |
| Gameplay Data | Yes (local) | Progress | No |
| Device IDs | Yes (AdMob) | Ads | Google |
| App Activity | Yes (AdMob) | Ads | Google |

### Security Practices
- Data encrypted in transit: Yes (HTTPS for ads/billing)
- Data encrypted at rest: No (local JSON, user accessible)
- Independent security review: No
- Data deletion: Yes (uninstall or reset)

## Compliance Checklist
- [ ] Privacy policy published and accessible
- [ ] Data safety form completed in Play Console
- [ ] AdMob UMP implemented for GDPR/CCPA
- [ ] No unauthorized permissions in manifest
- [ ] No third-party SDKs beyond Play Billing and AdMob
- [ ] Child-directed settings configured if applicable
- [ ] Test with GDPR/CCPA test devices
- [ ] Document data flows for audit