import { CapacitorConfig } from '@capacitor/core';

const config: CapacitorConfig = {
  appId: 'app.lovable.fa45c81fdbe847aeb5d70114cf8a397d',
  appName: 'smartme',
  webDir: 'dist',
  server: {
    url: 'https://fa45c81f-dbe8-47ae-b5d7-0114cf8a397d.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    }
  }
};

export default config;
