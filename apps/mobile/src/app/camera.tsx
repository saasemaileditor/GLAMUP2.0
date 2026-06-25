import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission, useFrameOutput, HybridFrameConverter } from 'react-native-vision-camera';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NitroModules } from 'react-native-nitro-modules';
import type { MediaPipeScanner, FaceBounds } from 'mediapipescanner';
import { runOnJS } from 'react-native-worklets';

// 1. Instantiate the MediaPipeScanner HybridObject from Nitro
const scanner = NitroModules.createHybridObject<MediaPipeScanner>('MediaPipeScanner');

export default function CameraScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { hasPermission } = useCameraPermission();
  const device = useCameraDevice('front');
  
  // 2. React state to store the faces for the overlay
  const [faces, setFaces] = useState<FaceBounds[]>([]);

  // 3. Worklet wrapper to update JS state from the frame processor (UI thread)
  const setFacesJS = runOnJS(setFaces);

  // 4. Frame Output using VisionCamera v5 API
  //    - onFrame is a worklet callback running on the camera's native thread
  //    - frame.dispose() MUST be called to free GPU buffers and prevent pipeline stall
  const frameOutput = useFrameOutput({
    pixelFormat: 'yuv',
    onFrame(frame) {
      'worklet';
      let image: any = null;
      try {
        console.log("====== NEW FRAME ======");
        console.log("1. Frame exists: " + (frame != null));
        console.log("2. Scanner exists: " + (scanner != null));
        console.log("3. HybridFrameConverter exists: " + (HybridFrameConverter != null));
        
        console.log("4. Converting Frame to Image...");
        image = HybridFrameConverter.convertFrameToImage(frame);
        console.log("5. Conversion success. Image exists: " + (image != null));
        
        console.log("6. About to call scanner.detectFaces...");
        const detectedFaces = scanner.detectFaces(image);
        
        console.log("7. Call succeeded. Result type: " + typeof detectedFaces);
        // Safely check length if array
        const isArray = Array.isArray(detectedFaces);
        console.log("8. Is Array: " + isArray + ", length: " + (isArray ? detectedFaces.length : 'N/A'));
        
        console.log("====== FRAME SUCCESS ======");
      } catch (e: any) {
        console.error("====== CRASH IN FRAME PROCESSOR ======");
        try { console.error("Message: " + e.message); } catch (_) {}
        try { console.error("Name: " + e.name); } catch (_) {}
        try { console.error("Stack: " + e.stack); } catch (_) {}
        try { console.error("Type: " + typeof e); } catch (_) {}
        console.error("======================================");
      } finally {
        // Dispose converted image if it was created
        if (image != null) {
          try {
            image.dispose();
          } catch (_) {}
        }
        // Always dispose the frame to free GPU-backed buffers
        frame.dispose();
      }
    },
  });

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Camera permission denied.</Text>
      </View>
    );
  }

  if (device == null) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>No front camera found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        outputs={[frameOutput]}
      />
      
      {/* 5. Draw glowing Face Bounding Boxes */}
      {faces.map((face, index) => {
        // MediaPipe typically returns normalized coordinates (0.0 to 1.0).
        // For the UI, we convert these to percentages to map onto the absoluteFill View.
        return (
          <View
            key={index}
            style={[
              styles.boundingBox,
              {
                left: `${face.x * 100}%`,
                top: `${face.y * 100}%`,
                width: `${face.width * 100}%`,
                height: `${face.height * 100}%`,
              }
            ]}
          />
        );
      })}
      
      {/* Absolute back button over the camera feed */}
      <Pressable 
        style={[styles.backButton, { top: insets.top + 16 }]}
        onPress={() => router.back()}
      >
        <ChevronLeft size={28} color="#ffffff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 16,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  boundingBox: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: '#00FFAA',
    backgroundColor: 'rgba(0, 255, 170, 0.15)',
    zIndex: 10,
    borderRadius: 12,
    // Add a slight glow effect (iOS only, but adds premium feel)
    shadowColor: '#00FFAA',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  }
});
