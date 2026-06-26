import type { HybridObject } from 'react-native-nitro-modules';
import type { Image } from 'react-native-nitro-image';

export interface Landmark {
  x: number;
  y: number;
  z: number;
}

export interface FaceBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  landmarks: Landmark[];
}

export interface MediaPipeScanner extends HybridObject<{ ios: 'c++', android: 'kotlin' }> {
  detectFaces(frame: Image): FaceBounds[];
}
