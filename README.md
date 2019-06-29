# RNFaceAttendance
An React Native attendance app with facial recognition feature.

### Prerequisites

-   React Native development environment
-   [Node.js](https://nodejs.org/en/)
-   [Yarn](https://yarnpkg.com/en/)
-   [Microsoft Azure Account](https://azure.microsoft.com/en-in/free/) - set up Face API on Cognitive Services (free tier is plenty).
-   [IoT device (optional if you only want facial recognition and not proximity)] - Raspberry Pi 3 was used in this tutorial. But any IoT device that has bluetooth, WiFi, and is able to run Node.js can be used as well.

## Getting Started

1.  Clone the repo:

```
git clone https://github.com/anchetaWern/RNFaceAttendance.git
cd RNFaceAttendance
```

2.  Install the app dependencies:

```
yarn install
```

3. Re-create `android` and `ios` folders:

```
react-native eject
```

4. Link native dependencies:

```
react-native link react-native-ble-manager
react-native link react-native-camera
react-native link react-native-vector-icons
react-native link react-native-exit-app
```

5. Add missingDimensionStrategy on `android/app/build.gradle` for React Native Camera:

```

android {
  compileSdkVersion rootProject.ext.compileSdkVersion

  compileOptions {
    // ...    
  }

  defaultConfig {
    applicationId "com.rnfaceattendance"
    minSdkVersion rootProject.ext.minSdkVersion
    targetSdkVersion rootProject.ext.targetSdkVersion
    versionCode 1
    versionName "1.0"
    missingDimensionStrategy 'react-native-camera', 'general' // add this
  }
}
```

6. Install server depdendencies:

```
cd server
yarn install
```

7. Update `App.js` with your Cognitive Services API Key:

```
const key = 'YOUR COGNITIVE SERVICES API KEY';
```


## Built With

-   [React Native](http://facebook.github.io/react-native/)
-   [Raspberry Pi](https://www.raspberrypi.org/)
-   [Bleno](https://github.com/noble/bleno)
-   [Microsoft Cognitive Services: Face API](https://azure.microsoft.com/en-us/services/cognitive-services/face/)
