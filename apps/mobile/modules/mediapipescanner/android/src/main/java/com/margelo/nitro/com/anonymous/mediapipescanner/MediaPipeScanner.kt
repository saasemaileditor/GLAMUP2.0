package com.margelo.nitro.com.anonymous.mediapipescanner

import android.graphics.Bitmap
import android.util.Log
import com.google.android.gms.tasks.Tasks
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.face.FaceDetection
import com.google.mlkit.vision.face.FaceDetectorOptions
import com.margelo.nitro.image.HybridImageSpec
import com.margelo.nitro.image.HybridImage

class MediaPipeScanner : HybridMediaPipeScannerSpec() {

    // 1. Configure Face Detector for High Speed and Bounding Boxes Only
    // This provides a smooth 60 FPS experience
    private val options = FaceDetectorOptions.Builder()
        .setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_FAST)
        .setLandmarkMode(FaceDetectorOptions.LANDMARK_MODE_NONE)
        .setClassificationMode(FaceDetectorOptions.CLASSIFICATION_MODE_NONE)
        .setMinFaceSize(0.15f)
        .enableTracking()
        .build()

    private val detector = FaceDetection.getClient(options)

    override fun detectFaces(frame: HybridImageSpec): Array<FaceBounds> {
        try {
            // 2. Extract Bitmap from Nitro's HybridImage
            val hybridImage = frame as? HybridImage 
                ?: throw Exception("Provided frame is not a HybridImage instance")
            
            val bitmap: Bitmap = hybridImage.bitmap

            // 3. Convert Bitmap to ML Kit InputImage
            // We assume rotation is 0 because react-native-vision-camera usually handles rotation
            // before delivering the frame to the frame processor.
            val image = InputImage.fromBitmap(bitmap, 0)

            // 4. Run Detection Synchronously
            // Vision Camera Frame Processors run on a background thread, so Tasks.await is perfectly safe.
            val faces = Tasks.await(detector.process(image))

            // 5. Convert ML Kit Faces to our FaceBounds interface and normalize (0.0 to 1.0)
            val width = bitmap.width.toDouble()
            val height = bitmap.height.toDouble()

            return faces.map { face ->
                val bounds = face.boundingBox
                FaceBounds(
                    x = bounds.left.toDouble() / width,
                    y = bounds.top.toDouble() / height,
                    width = bounds.width().toDouble() / width,
                    height = bounds.height().toDouble() / height
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

