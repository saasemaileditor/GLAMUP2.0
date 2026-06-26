#include <jni.h>
#include <fbjni/fbjni.h>
#include "JHybridMediaPipeScannerSpec.hpp"

namespace margelo::nitro::anonymous::mediapipescanner {

extern "C" JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void*) {
  return facebook::jni::initialize(vm, [] {
    JHybridMediaPipeScannerSpec::CxxPart::registerNatives();
  });
}

} // namespace margelo::nitro::anonymous::mediapipescanner
