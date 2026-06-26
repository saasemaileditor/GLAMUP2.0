///
/// Landmark.kt
/// Manually updated for landmarks support.
///

package com.margelo.nitro.com.anonymous.mediapipescanner

import androidx.annotation.Keep
import com.facebook.proguard.annotations.DoNotStrip
import java.util.Objects

@DoNotStrip
@Keep
data class Landmark(
  @DoNotStrip
  @Keep
  val x: Double,
  @DoNotStrip
  @Keep
  val y: Double,
  @DoNotStrip
  @Keep
  val z: Double
) {
  override fun equals(other: Any?): Boolean {
    if (this === other) return true
    if (other !is Landmark) return false
    return x == other.x && y == other.y && z == other.z
  }

  override fun hashCode(): Int {
    return arrayOf(x, y, z).contentDeepHashCode()
  }

  companion object {
    @DoNotStrip
    @Keep
    @JvmStatic
    private fun fromCpp(x: Double, y: Double, z: Double): Landmark {
      return Landmark(x, y, z)
    }
  }
}
