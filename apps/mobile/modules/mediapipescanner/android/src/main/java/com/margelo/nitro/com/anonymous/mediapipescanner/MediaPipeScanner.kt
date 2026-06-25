package com.margelo.nitro.com.anonymous.mediapipescanner

import android.content.Context
import android.graphics.Bitmap
import android.util.Log
import com.google.mediapipe.framework.image.BitmapImageBuilder
import com.google.mediapipe.tasks.core.BaseOptions
import com.google.mediapipe.tasks.vision.core.RunningMode
import com.google.mediapipe.tasks.vision.facelandmarker.FaceLandmarker
import com.google.mediapipe.tasks.vision.facelandmarker.FaceLandmarkerResult
import com.margelo.nitro.image.HybridImageSpec
import com.margelo.nitro.image.HybridImage

class MediaPipeScanner(private val context: Context) : HybridMediaPipeScannerSpec() {

    private var faceLandmarker: FaceLandmarker? = null

    init {
        setupFaceLandmarker()
    }

    private fun setupFaceLandmarker() {
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
                .setOutputFaceBlendshapes(false)
                .setOutputFacialTransformationMatrixes(false)

            val options = optionsBuilder.build()
            faceLandmarker = FaceLandmarker.createFromOptions(context, options)
            Log.i(TAG, "FaceLandmarker initialized successfully")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to initialize FaceLandmarker: ${e.message}", e)
        }
    }

    override fun detectFaces(frame: HybridImageSpec): Array<FaceDetectionResult> {
        val landmarker = faceLandmarker ?: run {
            Log.e(TAG, "FaceLandmarker not initialized!")
            return emptyArray()
        }

        try {
            val hybridImage = frame as? HybridImage 
                ?: throw Exception("Provided frame is not a HybridImage instance")
            
            val bitmap: Bitmap = hybridImage.bitmap
            Log.d(TAG, "Detecting faces in bitmap: ${bitmap.width}x${bitmap.height}")

            val mpImage = BitmapImageBuilder(bitmap).build()

            val result: FaceLandmarkerResult = landmarker.detect(mpImage)
            val faceLandmarks = result.faceLandmarks()

            Log.d(TAG, "MediaPipe detected ${faceLandmarks.size} faces")

            return faceLandmarks.map { landmarks ->
                // Calculate bounding box from landmarks
                var minX = 1.0f
                var maxX = 0.0f
                var minY = 1.0f
                var maxY = 0.0f

                val landmarksList = landmarks.map { landmark ->
                    if (landmark.x() < minX) minX = landmark.x()
                    if (landmark.x() > maxX) maxX = landmark.x()
                    if (landmark.y() < minY) minY = landmark.y()
                    if (landmark.y() > maxY) maxY = landmark.y()

                    Landmark(
                        x = landmark.x().toDouble(),
                        y = landmark.y().toDouble(),
                        z = landmark.z().toDouble()
                    )
                }

                FaceDetectionResult(
                    x = minX.toDouble(),
                    y = minY.toDouble(),
                    width = (maxX - minX).toDouble(),
                    height = (maxY - minY).toDouble(),
                    landmarks = landmarksList.toTypedArray()
                )
            }.toTypedArray()

        } catch (e: Exception) {
            Log.e(TAG, "Face detection failed: ${e.message}", e)
            return emptyArray()
        }
    }

    companion object {
        private const val TAG = "MediaPipeScanner"
    }
}
