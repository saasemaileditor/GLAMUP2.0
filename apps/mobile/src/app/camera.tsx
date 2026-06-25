import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission, useFrameOutput, HybridFrameConverter } from 'react-native-vision-camera';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NitroModules } from 'react-native-nitro-modules';
import type { MediaPipeScanner, FaceDetectionResult } from 'mediapipescanner';
import { runOnJS } from 'react-native-worklets';
import Svg, { Circle, Path, G } from 'react-native-svg';

// Indices for the silhouette/contour of the face (from web app)
const CONTOUR_INDICES = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378,
  152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109
];

const MESH_COLOR = "#a855f7";       // Purple-500
const CONTOUR_COLOR = "rgba(168, 85, 247, 0.75)";
const BRACKET_COLOR = "#a855f7";

// 1. Instantiate the MediaPipeScanner HybridObject from Nitro
const scanner = NitroModules.createHybridObject<MediaPipeScanner>('MediaPipeScanner');

export default function CameraScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { hasPermission } = useCameraPermission();
  const device = useCameraDevice('front');
  
  // 2. React state to store the faces for the overlay
  const [faces, setFaces] = useState<FaceDetectionResult[]>([]);

  // 3. Worklet wrapper to update JS state from the frame processor (UI thread)
  const setFacesJS = runOnJS(setFaces);

  // 4. Frame Output using VisionCamera v5 API
  const frameOutput = useFrameOutput({
    pixelFormat: 'yuv',
    onFrame(frame) {
      'worklet';
      let image: any = null;
      try {
        if (scanner == null) {
          return;
        }

        // 1. Convert Frame to Nitro Image
        image = HybridFrameConverter.convertFrameToImage(frame);
        
        if (image != null) {
          // 2. Call MediaPipeScanner (Nitro Hybrid Object)
          const detectedFaces = scanner.detectFaces(image);

          // 3. Update UI state on JS thread using the worklet wrapper
          // This is the "Permanent Fix" for the threading error
          setFacesJS(detectedFaces);

          // Debug log to verify detection is working and we are on the NEW code
          if (detectedFaces.length > 0) {
             console.log(`[GLAMUP-FIX] Detected ${detectedFaces.length} faces with 478 landmarks each.`);
          }
        }
      } catch (e: any) {
        console.error("[GLAMUP-FIX] Frame processor error: ", e.message);
      } finally {
        if (image != null) {
          image.dispose();
        }
        // Note: frame is managed by VisionCamera, no need to manually dispose unless using ref counts
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
      
      {/* 5. Draw Billion Dollar UI: Face Mesh and Styled Bounding Box */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg height="100%" width="100%" viewBox="0 0 1 1">
          {faces.map((face, faceIndex) => {
            // Draw face contour/oval
            let contourPath = "";
            CONTOUR_INDICES.forEach((index, i) => {
              const pt = face.landmarks[index];
              if (pt) {
                if (i === 0) contourPath += `M ${pt.x} ${pt.y}`;
                else contourPath += ` L ${pt.x} ${pt.y}`;
              }
            });
            contourPath += " Z";

            // Bounding box with margin (calculated in native, but we can refine here)
            const { x, y, width, height } = face;
            const r = 0.02; // relative corner radius
            const len = Math.min(width, height) * 0.2;

            return (
              <G key={faceIndex}>
                {/* 478 landmarks as small dots */}
                {face.landmarks.map((pt, i) => (
                  <Circle
                    key={i}
                    cx={pt.x}
                    cy={pt.y}
                    r="0.002"
                    fill={MESH_COLOR}
                  />
                ))}

                {/* Face contour */}
                <Path
                  d={contourPath}
                  fill="none"
                  stroke={CONTOUR_COLOR}
                  strokeWidth="0.003"
                />

                {/* Custom Corner Brackets */}
                {/* Top-left */}
                <Path
                  d={`M ${x + len} ${y} Q ${x} ${y} ${x} ${y + len}`}
                  fill="none"
                  stroke={BRACKET_COLOR}
                  strokeWidth="0.004"
                />
                {/* Bottom-left */}
                <Path
                  d={`M ${x} ${y + height - len} Q ${x} ${y + height} ${x + len} ${y + height}`}
                  fill="none"
                  stroke={BRACKET_COLOR}
                  strokeWidth="0.004"
                />
                {/* Bottom-right */}
                <Path
                  d={`M ${x + width - len} ${y + height} Q ${x + width} ${y + height} ${x + width} ${y + height - len}`}
                  fill="none"
                  stroke={BRACKET_COLOR}
                  strokeWidth="0.004"
                />
                {/* Top-right */}
                <Path
                  d={`M ${x + width} ${y + len} Q ${x + width} ${y} ${x + width - len} ${y}`}
                  fill="none"
                  stroke={BRACKET_COLOR}
                  strokeWidth="0.004"
                />
              </G>
            );
          })}
        </Svg>
      </View>
      
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
  }
});
