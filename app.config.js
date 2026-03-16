module.exports = {
  expo: {
    name: "KaytiPic",
    slug: "smart-photo-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "dark",
    scheme: "kaytipic",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#0A0A14",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.kaytipic.app",
      buildNumber: "2",
      infoPlist: {
        NSCameraUsageDescription:
          "KaytiPic needs camera access for photo capture and AI analysis",
        NSPhotoLibraryUsageDescription:
          "KaytiPic needs photo library access to import and save photos",
        NSLocationWhenInUseUsageDescription:
          "KaytiPic needs location access to show nearby photo spots and events",
        NSMicrophoneUsageDescription:
          "KaytiPic a besoin du micro pour la saisie vocale avec votre coach photo.",
        NSSpeechRecognitionUsageDescription:
          "KaytiPic utilise la reconnaissance vocale pour vos échanges avec le coach IA.",
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#0A0A14",
      },
      package: "com.kaytipic.app",
      edgeToEdgeEnabled: true,
      permissions: [
        "android.permission.CAMERA",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.RECORD_AUDIO",
      ],
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    plugins: [
      ["expo-router", { root: "./src/app" }],
      [
        "expo-camera",
        {
          cameraPermission:
            "KaytiPic a besoin de l'appareil photo pour capturer et analyser vos photos.",
        },
      ],
      [
        "expo-image-picker",
        {
          photosPermission:
            "KaytiPic a besoin d'accéder à vos photos pour les analyser et les retoucher.",
        },
      ],
      [
        "expo-location",
        {
          locationWhenInUsePermission:
            "KaytiPic utilise votre position pour trouver les spots photo autour de vous.",
        },
      ],
      [
        "expo-speech-recognition",
        {
          microphonePermission:
            "KaytiPic a besoin du micro pour la saisie vocale avec votre coach photo.",
          speechRecognitionPermission:
            "KaytiPic utilise la reconnaissance vocale pour vos échanges avec le coach IA.",
        },
      ],
      "expo-secure-store",
      "expo-sensors",
      "@sentry/react-native",
      "expo-font",
      "expo-web-browser",
      // expo-apple-authentication excluded until Romeo configures the
      // capability identifier in Apple Developer Portal for production.
    ],
    extra: {
      router: { root: "./src/app" },
      eas: { projectId: "e0195f14-f74b-422d-8108-5419fafdcc54" },
    },
    runtimeVersion: {
      policy: "appVersion",
    },
    updates: {
      url: "https://u.expo.dev/e0195f14-f74b-422d-8108-5419fafdcc54",
    },
  },
};
