import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.medicalapp.app',
  appName: 'Medical App',
  webDir: 'www',
  "plugins": {
    "CapacitorSQLite": {
      "iosDatabaseLocation": "Library",
      "androidDatabaseLocation": "default"
    }
  },
  server: {
    url: 'http://10.0.2.2:5000',  // Force all requests (API + assets) to this URL
    cleartext: true,
    allowNavigation: ['*']

  },
};

export default config;
