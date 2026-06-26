cmake_minimum_required(VERSION 3.22.1)
project(MediaPipeScanner)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Define REACT_NATIVE_DIR to help React Native CMake files locate dependencies
set(REACT_NATIVE_DIR ${CMAKE_CURRENT_SOURCE_DIR}/../../../node_modules/react-native)

# Define the C++ shared library target
add_library(MediaPipeScanner SHARED src/main/cpp/MediaPipeScannerOnLoad.cpp)

# Find dependency packages (prefab)
find_package(react-native-nitro-image REQUIRED)
find_package(react-native-nitro-modules REQUIRED)

# Initialize Nitro autolinking
include(${CMAKE_CURRENT_SOURCE_DIR}/../nitrogen/generated/android/MediaPipeScanner+autolinking.cmake)

# Link all dependencies together
target_link_libraries(
  MediaPipeScanner
  react-native-nitro-image::NitroImage
  react-native-nitro-modules::NitroModules
)
