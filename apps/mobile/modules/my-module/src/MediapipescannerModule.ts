import { NativeModule, requireNativeModule } from 'expo';

declare class MediapipescannerModule extends NativeModule<{}> {}

export default requireNativeModule<MediapipescannerModule>('Mediapipescanner');
