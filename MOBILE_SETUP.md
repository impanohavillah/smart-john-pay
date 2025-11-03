# SmartMe - Native Mobile App Setup Guide

This app has been configured to work as a native mobile application with Capacitor, enabling:
- ✅ Direct SMS sending from phone's SIM card
- ✅ Device GPS location access
- ✅ Direct ESP32 WiFi control
- ✅ Web browser fallback

## Features

### 1. **Native SMS Communication (Mobile Only)**
When running on iOS or Android, the app can send GSM commands directly from your phone's SIM card without going through edge functions. This provides:
- Faster command execution
- No internet required for GSM commands
- Direct device-to-device communication

### 2. **Device Location Access (Mobile Only)**
The app can access your device's GPS to:
- Track toilet locations
- Provide location-based services
- Enhanced logging with location data

### 3. **Direct ESP32 Control (All Platforms)**
Configure ESP32 IP address in Settings to send commands directly to your hardware:
- No edge function overhead
- Local network control
- Faster response times

## Setup Instructions

### For Testing on Physical Device or Emulator:

1. **Export to GitHub**
   - Click "Export to Github" button in Lovable
   - Clone your repository locally

2. **Install Dependencies**
   ```bash
   git pull
   npm install
   ```

3. **Initialize Capacitor** (Already configured)
   ```bash
   npx cap init
   ```
   - App ID: `app.lovable.fa45c81fdbe847aeb5d70114cf8a397d`
   - App Name: `smartme`

4. **Add Platform(s)**
   
   For Android:
   ```bash
   npx cap add android
   npx cap update android
   ```
   
   For iOS (Mac with Xcode required):
   ```bash
   npx cap add ios
   npx cap update ios
   ```

5. **Build the Web Assets**
   ```bash
   npm run build
   ```

6. **Sync with Native Platform**
   ```bash
   npx cap sync
   ```

7. **Run on Device/Emulator**
   
   For Android (requires Android Studio):
   ```bash
   npx cap run android
   ```
   
   For iOS (requires Xcode on Mac):
   ```bash
   npx cap run ios
   ```

## Required Permissions

### Android (AndroidManifest.xml will be auto-configured)
- `SEND_SMS` - For sending GSM commands
- `ACCESS_FINE_LOCATION` - For GPS location
- `ACCESS_COARSE_LOCATION` - For GPS location
- `INTERNET` - For WiFi commands

### iOS (Info.plist will be auto-configured)
- `NSLocationWhenInUseUsageDescription` - For GPS location
- `NSLocationAlwaysUsageDescription` - For GPS location

## Usage

### GSM Commands (Mobile Only)
1. Add a toilet with GSM control mode
2. Configure the GSM phone number
3. When on mobile, commands will automatically use native SMS
4. No internet connection required!

### ESP32 Direct Control
1. Go to Settings
2. Enter your ESP32's IP address (e.g., `192.168.1.100`)
3. Save the configuration
4. WiFi commands will be sent directly to the ESP32

### Location Services (Mobile Only)
1. Go to Settings
2. Click "Get Current Location"
3. Grant location permissions when prompted
4. Your device coordinates will be displayed

## Development Hot Reload

The app is configured to use hot reload from the Lovable sandbox:
- URL: `https://fa45c81f-dbe8-47ae-b5d7-0114cf8a397d.lovableproject.com`
- Changes in Lovable will reflect in the mobile app instantly
- No need to rebuild for UI changes

## After Making Changes

Whenever you pull code changes that affect native functionality:
```bash
git pull
npx cap sync
```

## Troubleshooting

### SMS Not Sending
- Ensure app has SMS permissions
- Check that GSM number is properly formatted
- Verify SIM card is active

### Location Not Working
- Check location permissions in device settings
- Ensure location services are enabled
- Try restarting the app

### ESP32 Not Responding
- Verify IP address is correct
- Ensure device is on same network
- Check ESP32 is powered on and connected

## Platform Compatibility

| Feature | Web Browser | Android | iOS |
|---------|-------------|---------|-----|
| Native SMS | ❌ | ✅ | ✅ |
| GPS Location | ❌ | ✅ | ✅ |
| ESP32 Direct | ✅ | ✅ | ✅ |
| Edge Functions | ✅ | ✅ | ✅ |

## Production Deployment

For production apps, update `capacitor.config.ts`:
```typescript
server: {
  // Remove this section for production
  // url: '...',
  // cleartext: true
}
```

Then rebuild and sync:
```bash
npm run build
npx cap sync
npx cap open android  # or ios
```

## Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Studio Download](https://developer.android.com/studio)
- [Xcode Download](https://developer.apple.com/xcode/)

---

**Note**: The app works in both modes:
- **Mobile**: Uses native SMS + ESP32 direct control
- **Web**: Uses edge functions for all commands
