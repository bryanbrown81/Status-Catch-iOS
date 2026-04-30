# Push Notification Sounds

Place custom notification sound files in this directory.

## Requirements (iOS)
- **Format**: `.wav`, `.aiff`, or `.caf` (MP3 will NOT play for push notifications)
- **Length**: 30 seconds or less
- **Encoding**: Linear PCM, MA4 (IMA/ADPCM), or µLaw/aLaw

## Expected file
`alert.wav` — referenced from `app.json` under the `expo-notifications` plugin.

## After adding the file
1. Run `eas build --platform ios` (rebuild required — sounds are bundled at build time, OTA updates can't add them)
2. The backend must include `"sound": "alert.wav"` in the Expo Push API payload (see `PUSH_NOTIFICATIONS_BACKEND.md`)

## Adding more sounds
Add additional file paths to the `sounds` array in `app.json`:
```json
"sounds": ["./assets/sounds/alert.wav", "./assets/sounds/critical.wav"]
```
Then reference by filename in the push payload.
