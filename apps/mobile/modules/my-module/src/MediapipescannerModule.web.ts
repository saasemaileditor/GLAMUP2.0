import { registerWebModule, NativeModule } from 'expo';

// MediapipescannerModule is not available on the web platform.
class MediapipescannerModule extends NativeModule<{}> {}

export default registerWebModule(MediapipescannerModule, 'MediapipescannerModule');
