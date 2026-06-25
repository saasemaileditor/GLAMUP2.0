package com.margelo.nitro.com.anonymous.mediapipescanner

import androidx.annotation.Keep
import com.facebook.proguard.annotations.DoNotStrip

@DoNotStrip
@Keep
data class Landmark(
  val x: Double,
  val y: Double,
  val z: Double
)
