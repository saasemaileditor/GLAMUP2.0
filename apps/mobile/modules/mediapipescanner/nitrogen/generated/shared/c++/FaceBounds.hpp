///
/// FaceBounds.hpp
/// Manually updated for landmarks support.
///

#pragma once

#include <NitroModules/JSIConverter.hpp>
#include <NitroModules/NitroDefines.hpp>
#include <NitroModules/JSIHelpers.hpp>
#include <NitroModules/PropNameIDCache.hpp>
#include <vector>
#include "Landmark.hpp"

namespace margelo::nitro::anonymous::mediapipescanner {

  /**
   * A struct which can be represented as a JavaScript object (FaceBounds).
   */
  struct FaceBounds final {
  public:
    double x;
    double y;
    double width;
    double height;
    std::vector<Landmark> landmarks;

  public:
    FaceBounds() = default;
    explicit FaceBounds(double x, double y, double width, double height, std::vector<Landmark> landmarks): x(x), y(y), width(width), height(height), landmarks(landmarks) {}

  public:
    friend bool operator==(const FaceBounds& lhs, const FaceBounds& rhs) = default;
  };

} // namespace margelo::nitro::anonymous::mediapipescanner

namespace margelo::nitro {

  using namespace margelo::nitro::anonymous::mediapipescanner;

  // C++ FaceBounds <> JS FaceBounds (object)
  template <>
  struct JSIConverter<FaceBounds> final {
    static inline FaceBounds fromJSI(jsi::Runtime& runtime, const jsi::Value& arg) {
      jsi::Object obj = arg.asObject(runtime);
      return FaceBounds(
        JSIConverter<double>::fromJSI(runtime, obj.getProperty(runtime, PropNameIDCache::get(runtime, "x"))),
        JSIConverter<double>::fromJSI(runtime, obj.getProperty(runtime, PropNameIDCache::get(runtime, "y"))),
        JSIConverter<double>::fromJSI(runtime, obj.getProperty(runtime, PropNameIDCache::get(runtime, "width"))),
        JSIConverter<double>::fromJSI(runtime, obj.getProperty(runtime, PropNameIDCache::get(runtime, "height"))),
        JSIConverter<std::vector<Landmark>>::fromJSI(runtime, obj.getProperty(runtime, PropNameIDCache::get(runtime, "landmarks")))
      );
    }
    static inline jsi::Value toJSI(jsi::Runtime& runtime, const FaceBounds& arg) {
      jsi::Object obj(runtime);
      obj.setProperty(runtime, PropNameIDCache::get(runtime, "x"), JSIConverter<double>::toJSI(runtime, arg.x));
      obj.setProperty(runtime, PropNameIDCache::get(runtime, "y"), JSIConverter<double>::toJSI(runtime, arg.y));
      obj.setProperty(runtime, PropNameIDCache::get(runtime, "width"), JSIConverter<double>::toJSI(runtime, arg.width));
      obj.setProperty(runtime, PropNameIDCache::get(runtime, "height"), JSIConverter<double>::toJSI(runtime, arg.height));
      obj.setProperty(runtime, PropNameIDCache::get(runtime, "landmarks"), JSIConverter<std::vector<Landmark>>::toJSI(runtime, arg.landmarks));
      return obj;
    }
    static inline bool canConvert(jsi::Runtime& runtime, const jsi::Value& value) {
      if (!value.isObject()) return false;
      jsi::Object obj = value.getObject(runtime);
      if (!JSIConverter<double>::canConvert(runtime, obj.getProperty(runtime, PropNameIDCache::get(runtime, "x")))) return false;
      if (!JSIConverter<double>::canConvert(runtime, obj.getProperty(runtime, PropNameIDCache::get(runtime, "y")))) return false;
      if (!JSIConverter<double>::canConvert(runtime, obj.getProperty(runtime, PropNameIDCache::get(runtime, "width")))) return false;
      if (!JSIConverter<double>::canConvert(runtime, obj.getProperty(runtime, PropNameIDCache::get(runtime, "height")))) return false;
      if (!JSIConverter<std::vector<Landmark>>::canConvert(runtime, obj.getProperty(runtime, PropNameIDCache::get(runtime, "landmarks")))) return false;
      return true;
    }
  };

} // namespace margelo::nitro
