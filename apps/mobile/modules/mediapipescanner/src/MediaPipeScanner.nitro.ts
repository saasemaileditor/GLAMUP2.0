import { type HybridObject } from 'react-native-nitro-modules';
import { type Image } from 'react-native-nitro-image';

export interface Landmark {
  x: number;
  y: number;
  z: number;
}

export interface FaceDetectionResult {
  /**
   * Normalized bounding box (0.0 to 1.0)
   */
  x: number;
  y: number;
  width: number;
  height: number;
  /**
   * 478 Face landmarks
   */
  landmarks: Landmark[];
}

export interface MediaPipeScanner extends HybridObject<{ ios: 'c++', android: 'kotlin' }> {
  /**
   * Processes a Vision Camera Frame (as Nitro Image) and returns an array of face landmarks and bounds.
   */
  detectFaces(frame: Image): FaceDetectionResult[];
}
