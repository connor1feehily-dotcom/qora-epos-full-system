import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ie.kerrigansxl.quantumpos',
  appName: 'Quantum POS',
  webDir: '../client/dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#1e293b",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false
    },
    Camera: {
      permissions: ["camera"]
    },
    Device: {},
    StatusBar: {
      style: "dark",
      backgroundColor: "#1e293b"
    }
  }
};

export default config;