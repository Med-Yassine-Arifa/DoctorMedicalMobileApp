import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.medicalapp.app',
  appName: 'Medical App',
  webDir: 'www',
  "plugins": {
    "CapacitorSQLite": {
      "iosDatabaseLocation": "Library",
      "androidDatabaseLocation": "default"
    },
    "PushNotifications": {
      "presentationOptions": ["badge", "sound", "alert"]
    }
  },
  server: {
    androidScheme: 'http',
    cleartext: true,
  },
};

export default config;
