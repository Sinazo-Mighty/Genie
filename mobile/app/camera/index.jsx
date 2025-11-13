"use client"

import { useState, useRef, useEffect } from "react"
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Alert, Image } from "react-native"
import { CameraView, useCameraPermissions } from "expo-camera"
import { useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { COLORS } from "../../constants/colors"
import * as ImageManipulator from "expo-image-manipulator"

const { width, height } = Dimensions.get("window")

export default function CameraScreen() {
  const [facing, setFacing] = useState("back")
  const [permission, requestPermission] = useCameraPermissions()
  const [capturedImage, setCapturedImage] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const cameraRef = useRef(null)
  const router = useRouter()

  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission()
    }
  }, [permission])

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Requesting camera permission...</Text>
      </View>
    )
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color={COLORS.textLight} />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionMessage}>
            We need access to your camera to identify ingredients and help you find recipes.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  const takePicture = async () => {
    if (!cameraRef.current) return

    try {
      setIsProcessing(true)
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      })

      // Optionally resize image for faster processing
      const manipulatedImage = await ImageManipulator.manipulateAsync(photo.uri, [{ resize: { width: 1024 } }], {
        compress: 0.8,
        format: ImageManipulator.SaveFormat.JPEG,
      })

      setCapturedImage(manipulatedImage.uri)
    } catch (error) {
      console.error("Error taking picture:", error)
      Alert.alert("Error", "Failed to take picture. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const retakePicture = () => {
    setCapturedImage(null)
  }

  const usePhoto = () => {
    if (capturedImage) {
      // Navigate to image recognition screen with the captured image
      router.push({
        pathname: "/camera/recognize",
        params: { imageUri: capturedImage },
      })
    }
  }

  const toggleCameraFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"))
  }

  const goBack = () => {
    router.back()
  }

  if (capturedImage) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: capturedImage }} style={styles.preview} />

        <View style={styles.previewOverlay}>
          <TouchableOpacity style={styles.closeButton} onPress={retakePicture}>
            <Ionicons name="close" size={28} color={COLORS.white} />
          </TouchableOpacity>

          <View style={styles.previewActions}>
            <TouchableOpacity style={styles.retakeButton} onPress={retakePicture}>
              <Ionicons name="camera-reverse" size={24} color={COLORS.white} />
              <Text style={styles.actionButtonText}>Retake</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.usePhotoButton} onPress={usePhoto}>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.white} />
              <Text style={styles.actionButtonText}>Use Photo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
        <View style={styles.overlay}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={goBack}>
              <Ionicons name="arrow-back" size={28} color={COLORS.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Scan Ingredients</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Center guide */}
          <View style={styles.centerGuide}>
            <View style={styles.guideFrame}>
              <View style={[styles.guideCorner, styles.guideTopLeft]} />
              <View style={[styles.guideCorner, styles.guideTopRight]} />
              <View style={[styles.guideCorner, styles.guideBottomLeft]} />
              <View style={[styles.guideCorner, styles.guideBottomRight]} />
            </View>
            <Text style={styles.guideText}>Position ingredients within the frame</Text>
          </View>

          {/* Bottom controls */}
          <View style={styles.controls}>
            <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
              <Ionicons name="camera-reverse" size={32} color={COLORS.white} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.captureButton, isProcessing && styles.captureButtonDisabled]}
              onPress={takePicture}
              disabled={isProcessing}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>

            <View style={styles.placeholder} />
          </View>
        </View>
      </CameraView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "transparent",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.white,
    textShadowColor: "rgba(0,0,0,0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  placeholder: {
    width: 40,
  },
  centerGuide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  guideFrame: {
    width: width * 0.75,
    height: width * 0.75,
    position: "relative",
  },
  guideCorner: {
    position: "absolute",
    width: 40,
    height: 40,
    borderColor: COLORS.white,
  },
  guideTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  guideTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  guideBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  guideBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  guideText: {
    marginTop: 30,
    fontSize: 16,
    color: COLORS.white,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  flipButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.5)",
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.white,
  },
  message: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: "center",
  },
  permissionContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 20,
    marginBottom: 12,
    textAlign: "center",
  },
  permissionMessage: {
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 30,
  },
  permissionButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.white,
  },
  preview: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  previewOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  previewActions: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 40,
  },
  retakeButton: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: "row",
    gap: 8,
  },
  usePhotoButton: {
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: "row",
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.white,
  },
})
