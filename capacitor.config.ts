import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.artrehab.app',
  appName: 'ART',
  webDir: 'dist/rehab-planner-ionic/browser',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    CapacitorHealthkit: {
      // iOS: permissions requested at runtime via HealthService
    }
  }
};

export default config;
