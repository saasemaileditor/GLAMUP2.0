package com.margelo.nitro.com.anonymous.mediapipescanner

import android.content.Context
import android.graphics.Bitmap
import android.util.Log
import com.google.mediapipe.framework.image.BitmapImageBuilder
import com.google.mediapipe.tasks.core.BaseOptions
import com.google.mediapipe.tasks.vision.core.RunningMode
import com.google.mediapipe.tasks.vision.facelandmarker.FaceLandmarker
import com.google.mediapipe.tasks.vision.facelandmarker.FaceLandmarkerResult
import com.margelo.nitro.image.HybridImage
import com.margelo.nitro.image.HybridImageSpec

class MediaPipeScanner : HybridMediaPipeScannerSpec() {
    private var landmarker: FaceLandmarker? = null

    companion object {
        private const val TAG = "MediaPipeScanner"
        var appContext: Context? = null
    }

    private fun getLandmarker(): FaceLandmarker? {
        if (landmarker != null) return landmarker

        val context = appContext ?: return null

        try {
            val baseOptionsBuilder = BaseOptions.builder()
                .setModelAssetPath("face_landmarker.task")

            val optionsBuilder = FaceLandmarker.FaceLandmarkerOptions.builder()
                .setBaseOptions(baseOptionsBuilder.build())
                .setRunningMode(RunningMode.IMAGE)
                .setNumFaces(1)
                .setMinFaceDetectionConfidence(0.5f)
                .setMinFacePresenceConfidence(0.5f)
                .setMinTrackingConfidence(0.5f)
                .setOutputFaceBlendshapes(true)

            landmarker = FaceLandmarker.createFromOptions(context, optionsBuilder.build())
            return landmarker
        } catch (e: Exception) {
            Log.e(TAG, "Failed to create FaceLandmarker: \${e.message}")
            return null
        }
    }

    override fun detectFaces(frame: HybridImageSpec): Array<FaceBounds> {
        val landmarker = getLandmarker() ?: return emptyArray()

        // 1. Get Bitmap from Nitro Image
        val image = frame as HybridImage
        val bitmap = image.bitmap
        val mpImage = BitmapImageBuilder(bitmap).build()

        // 2. Detect
        val result: FaceLandmarkerResult = landmarker.detect(mpImage)

        // 3. Map to our Nitro-compatible result
        if (result.faceLandmarks().isEmpty()) {
            return emptyArray()
        }

        return result.faceLandmarks().map { landmarks ->
            // Calculate a simple bounding box from landmarks
            var minX = Float.MAX_VALUE
            var minY = Float.MAX_VALUE
            var maxX = Float.MIN_VALUE
            var maxY = Float.MIN_VALUE

            val nitroLandmarks = landmarks.map { landmark ->
                minX = minOf(minX, landmark.x())
                minY = minOf(minY, landmark.y())
                maxX = maxOf(maxX, landmark.x())
                maxY = maxOf(maxY, landmark.y())

                Landmark(landmark.x().toDouble(), landmark.y().toDouble(), landmark.z().toDouble())
            }.toTypedArray()

            FaceBounds(
                minX.toDouble(),
                minY.toDouble(),
                (maxX - minX).toDouble(),
                (maxY - minY).toDouble(),
                nitroLandmarks
            )
        }.toTypedArray()
    }
}
