import { CapacitorConfig } from '@capacitor/cli';

const SERVER_URL = process.env.QORA_SERVER_URL || '';

const config: CapacitorConfig = {
  appId: 'ie.kerrigansxl.qoraepos',
  appName: 'Qora EPOS Back Office',
  webDir: 'dist/public',
  server: SERVER_URL
    ? {
        url: SERVER_URL,
        cleartext: false,
        androidScheme: 'https',
      }
    : {
        androidScheme: 'https',
      },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#0f172a',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    Camera: { permissions: ['camera'] },
    StatusBar: { style: 'dark', backgroundColor: '#0f172a' },
  },
};

export default config;
