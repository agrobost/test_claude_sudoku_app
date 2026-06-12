import { existsSync } from 'node:fs';

import { type ExpoConfig } from 'expo/config';

// Fichiers de config Firebase (non commités) : leur présence active les plugins.
// Sans eux, l'app se construit et tourne sans analytics ni crash reporting.
// En local : fichiers DEV dans ./firebase/. Sur EAS : variables d'environnement
// de type fichier (par env development/preview/production), qui exposent un chemin.
const GOOGLE_SERVICES_ANDROID = process.env.GOOGLE_SERVICES_JSON ?? './firebase/google-services.json';
const GOOGLE_SERVICES_IOS = process.env.GOOGLE_SERVICE_INFO_PLIST ?? './firebase/GoogleService-Info.plist';
const hasFirebaseAndroid = existsSync(GOOGLE_SERVICES_ANDROID);
const hasFirebaseIos = existsSync(GOOGLE_SERVICES_IOS);
const hasFirebase = hasFirebaseAndroid || hasFirebaseIos;

const config: ExpoConfig = {
  name: 'Sudoku',
  slug: 'sudoku-app',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'sudokuapp',
  userInterfaceStyle: 'automatic',
  ios: {
    icon: './assets/expo.icon',
    bundleIdentifier: 'com.agrobost.sudokuapp',
    supportsTablet: false,
    ...(hasFirebaseIos ? { googleServicesFile: GOOGLE_SERVICES_IOS } : {}),
  },
  android: {
    package: 'com.agrobost.sudokuapp',
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    ...(hasFirebaseAndroid ? { googleServicesFile: GOOGLE_SERVICES_ANDROID } : {}),
  },
  plugins: [
    'expo-router',
    'expo-localization',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#208AEF',
        android: { image: './assets/images/splash-icon.png', imageWidth: 76 },
      },
    ],
    [
      'expo-tracking-transparency',
      {
        userTrackingPermission:
          'This identifier will be used to show you ads that are more relevant to you.',
      },
    ],
    [
      'expo-build-properties',
      {
        // requis par react-native-firebase sous Expo
        ios: { useFrameworks: 'static' },
      },
    ],
    ...(hasFirebase ? ['@react-native-firebase/app', '@react-native-firebase/crashlytics'] : []),
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};

export default config;
