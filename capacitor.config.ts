import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.salesmanager.app',
  appName: 'Sales Manager',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    url: 'https://sales-pro-manager.vercel.app',
    cleartext: false
  },
  android: {
    buildOptions: {
      keystorePath: 'keystore.jks',
      keystoreAlias: 'key0',
    },
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;
