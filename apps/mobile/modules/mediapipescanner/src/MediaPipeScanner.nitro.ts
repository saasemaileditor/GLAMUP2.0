import { type HybridObject } from 'react-native-nitro-modules';
import { type Image } from 'react-native-nitro-image';

export interface FaceBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MediaPipeScanner extends HybridObject<{ ios: 'c++', android: 'kotlin' }> {
  /**
   * Processes a Vision Camera Frame (as Nitro Image) and returns an array of face bounds.
   */
  detectFaces(frame: Image): FaceBounds[];
}
