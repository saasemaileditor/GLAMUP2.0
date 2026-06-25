const { withAppBuildGradle, withDangerousMod, withAndroidManifest } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withMediaPipe = (config) => {
  // 1. Add MediaPipe Tasks Vision dependency to build.gradle
  config = withAppBuildGradle(config, async (config) => {
    const buildGradle = config.modResults.contents;
    if (!buildGradle.includes('com.google.mediapipe:tasks-vision')) {
      // Find the dependencies block and inject it inside
      config.modResults.contents = buildGradle.replace(
        /dependencies\s*\{/,
        'dependencies {\n    // MediaPipe Tasks Vision\n    implementation "com.google.mediapipe:tasks-vision:0.10.14"'
      );
    }
    return config;
  });

  // 2. Ensure face_landmarker.task is in the Android assets folder
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const srcAsset = path.join(projectRoot, '../../assets/face_landmarker.task'); // Or wherever we put it safely
      const destFolder = path.join(projectRoot, 'android/app/src/main/assets');
      const destAsset = path.join(destFolder, 'face_landmarker.task');

      if (!fs.existsSync(destFolder)) {
        fs.mkdirSync(destFolder, { recursive: true });
      }

      // If we downloaded it directly to android/app/src/main/assets already, this will just keep it safe,
      // but if prebuild wipes it, we need a permanent source.
      // We should put the model in the project root's `assets` folder.
      if (fs.existsSync(srcAsset)) {
        fs.copyFileSync(srcAsset, destAsset);
      }
      return config;
    },
  ]);

  config = withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults.manifest;
    const permissions = androidManifest['uses-permission'] || [];
    if (!permissions.find((p) => p.$['android:name'] === 'android.permission.CAMERA')) {
      permissions.push({
        $: {
          'android:name': 'android.permission.CAMERA',
        },
      });
    }
    androidManifest['uses-permission'] = permissions;
    return config;
  });

  return config;
};

module.exports = withMediaPipe;
