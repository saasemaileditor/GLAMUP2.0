///
/// FaceBounds.kt
/// Manually updated for landmarks support.
///

package com.margelo.nitro.com.anonymous.mediapipescanner

import androidx.annotation.Keep
import com.facebook.proguard.annotations.DoNotStrip
import java.util.Objects


/**
 * Represents the JavaScript object/struct "FaceBounds".
 */
@DoNotStrip
@Keep
data class FaceBounds(
  @DoNotStrip
  @Keep
  val x: Double,
  @DoNotStrip
  @Keep
  val y: Double,
  @DoNotStrip
  @Keep
  val width: Double,
  @DoNotStrip
  @Keep
  val height: Double,
  @DoNotStrip
  @Keep
  val landmarks: Array<Landmark>
) {
  /* primary constructor */

  override fun equals(other: Any?): Boolean {
    if (this === other) return true
    if (other !is FaceBounds) return false
    return Objects.deepEquals(this.x, other.x)
      && Objects.deepEquals(this.y, other.y)
      && Objects.deepEquals(this.width, other.width)
      && Objects.deepEquals(this.height, other.height)
      && Objects.deepEquals(this.landmarks, other.landmarks)
  }

  override fun hashCode(): Int {
    return arrayOf<Any?>(
      x,
      y,
      width,
      height,
      landmarks
    ).contentDeepHashCode()
  }

  companion object {
    /**
     * Constructor called from C++
     */
    @DoNotStrip
    @Keep
    @Suppress("unused")
    @JvmStatic
    private fun fromCpp(x: Double, y: Double, width: Double, height: Double, landmarks: Array<Landmark>): FaceBounds {
      return FaceBounds(x, y, width, height, landmarks)
    }
  }
}
