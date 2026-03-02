export default {
  expo: {
    name: "E-Rider",
    slug: "rider-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/icon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
      googleServicesFile: process.env.GOOGLE_SERVICES_FILE ?? "./google-services.json",
      package: "com.anonymous.riderapp"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      "expo-maps",
      "expo-notifications"
    ],
    extra: {
      eas: {
        projectId: "acd0ec73-8060-4a32-a1d9-eca6bf95719d"
      }
    }
  }
}