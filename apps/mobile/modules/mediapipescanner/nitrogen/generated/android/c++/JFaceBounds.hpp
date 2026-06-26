///
/// JFaceBounds.hpp
/// Manually updated for landmarks support.
///

#pragma once

#include <fbjni/fbjni.h>
#include "FaceBounds.hpp"
#include "JLandmark.hpp"

namespace margelo::nitro::anonymous::mediapipescanner {

  using namespace facebook;

  /**
   * The C++ JNI bridge between the C++ struct "FaceBounds" and the the Kotlin data class "FaceBounds".
   */
  struct JFaceBounds final: public jni::JavaClass<JFaceBounds> {
  public:
    static constexpr auto kJavaDescriptor = "Lcom/margelo/nitro/com/anonymous/mediapipescanner/FaceBounds;";

  public:
    /**
     * Convert this Java/Kotlin-based struct to the C++ struct FaceBounds by copying all values to C++.
     */
    [[maybe_unused]]
    [[nodiscard]]
    FaceBounds toCpp() const {
      static const auto clazz = javaClassStatic();
      static const auto fieldX = clazz->getField<double>("x");
      double x = this->getFieldValue(fieldX);
      static const auto fieldY = clazz->getField<double>("y");
      double y = this->getFieldValue(fieldY);
      static const auto fieldWidth = clazz->getField<double>("width");
      double width = this->getFieldValue(fieldWidth);
      static const auto fieldHeight = clazz->getField<double>("height");
      double height = this->getFieldValue(fieldHeight);
      static const auto fieldLandmarks = clazz->getField<jni::JArrayClass<JLandmark>>("landmarks");
      auto landmarks = this->getFieldValue(fieldLandmarks);

      std::vector<Landmark> landmarksVector;
      landmarksVector.reserve(landmarks->size());
      for (size_t i = 0; i < landmarks->size(); i++) {
        landmarksVector.push_back(landmarks->getElement(i)->toCpp());
      }

      return FaceBounds(
        x,
        y,
        width,
        height,
        landmarksVector
      );
    }

  public:
    /**
     * Create a Java/Kotlin-based struct by copying all values from the given C++ struct to Java.
     */
    [[maybe_unused]]
    static jni::local_ref<JFaceBounds::javaobject> fromCpp(const FaceBounds& value) {
      using JSignature = JFaceBounds(double, double, double, double, jni::alias_ref<jni::JArrayClass<JLandmark>>);
      static const auto clazz = javaClassStatic();
      static const auto create = clazz->getStaticMethod<JSignature>("fromCpp");

      auto landmarksArray = jni::JArrayClass<JLandmark>::newArray(value.landmarks.size());
      for (size_t i = 0; i < value.landmarks.size(); i++) {
        landmarksArray->setElement(i, JLandmark::fromCpp(value.landmarks[i]));
      }

      return create(
        clazz,
        value.x,
        value.y,
        value.width,
        value.height,
        landmarksArray
      );
    }
  };

} // namespace margelo::nitro::anonymous::mediapipescanner
