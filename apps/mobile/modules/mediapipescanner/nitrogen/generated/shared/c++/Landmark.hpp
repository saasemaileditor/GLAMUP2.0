///
/// Landmark.hpp
/// Manually updated for landmarks support.
///

#pragma once

#include <NitroModules/JSIConverter.hpp>
#include <NitroModules/NitroDefines.hpp>
#include <NitroModules/JSIHelpers.hpp>
#include <NitroModules/PropNameIDCache.hpp>

namespace margelo::nitro::anonymous::mediapipescanner {

  /**
   * A struct which can be represented as a JavaScript object (Landmark).
   */
  struct Landmark final {
  public:
    double x;
    double y;
    double z;

  public:
    Landmark() = default;
    explicit Landmark(double x, double y, double z): x(x), y(y), z(z) {}

  public:
    friend bool operator==(const Landmark& lhs, const Landmark& rhs) = default;
  };

} // namespace margelo::nitro::anonymous::mediapipescanner

namespace margelo::nitro {

  using namespace margelo::nitro::anonymous::mediapipescanner;

  // C++ Landmark <> JS Landmark (object)
  template <>
  struct JSIConverter<Landmark> final {
    static inline Landmark fromJSI(jsi::Runtime& runtime, const jsi::Value& arg) {
      jsi::Object obj = arg.asObject(runtime);
      return Landmark(
        JSIConverter<double>::fromJSI(runtime, obj.getProperty(runtime, PropNameIDCache::get(runtime, "x"))),
        JSIConverter<double>::fromJSI(runtime, obj.getProperty(runtime, PropNameIDCache::get(runtime, "y"))),
        JSIConverter<double>::fromJSI(runtime, obj.getProperty(runtime, PropNameIDCache::get(runtime, "z")))
      );
    }
    static inline jsi::Value toJSI(jsi::Runtime& runtime, const Landmark& arg) {
      jsi::Object obj(runtime);
      obj.setProperty(runtime, PropNameIDCache::get(runtime, "x"), JSIConverter<double>::toJSI(runtime, arg.x));
      obj.setProperty(runtime, PropNameIDCache::get(runtime, "y"), JSIConverter<double>::toJSI(runtime, arg.y));
      obj.setProperty(runtime, PropNameIDCache::get(runtime, "z"), JSIConverter<double>::toJSI(runtime, arg.z));
      return obj;
    }
    static inline bool canConvert(jsi::Runtime& runtime, const jsi::Value& value) {
      if (!value.isObject()) return false;
      jsi::Object obj = value.getObject(runtime);
      if (!JSIConverter<double>::canConvert(runtime, obj.getProperty(runtime, PropNameIDCache::get(runtime, "x")))) return false;
      if (!JSIConverter<double>::canConvert(runtime, obj.getProperty(runtime, PropNameIDCache::get(runtime, "y")))) return false;
      if (!JSIConverter<double>::canConvert(runtime, obj.getProperty(runtime, PropNameIDCache::get(runtime, "z")))) return false;
      return true;
    }
  };

} // namespace margelo::nitro
