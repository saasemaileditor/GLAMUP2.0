package com.margelo.nitro.com.anonymous.mediapipescanner

import androidx.annotation.Keep
import com.facebook.proguard.annotations.DoNotStrip

@DoNotStrip
@Keep
data class FaceDetectionResult(
  val x: Double,
  val y: Double,
  val width: Double,
  val height: Double,
  val landmarks: Array<Landmark>
)
