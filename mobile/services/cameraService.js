import * as ImagePicker from "expo-image-picker"
import { Camera } from "expo-camera"
import { Alert } from "react-native"

export const CameraService = {
  // Request camera permissions
  requestCameraPermission: async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync()
      return status === "granted"
    } catch (error) {
      console.error("Error requesting camera permission:", error)
      return false
    }
  },

  // Request media library permissions
  requestMediaLibraryPermission: async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      return status === "granted"
    } catch (error) {
      console.error("Error requesting media library permission:", error)
      return false
    }
  },

  // Check if camera permission is granted
  checkCameraPermission: async () => {
    try {
      const { status } = await Camera.getCameraPermissionsAsync()
      return status === "granted"
    } catch (error) {
      console.error("Error checking camera permission:", error)
      return false
    }
  },

  // Launch camera to take a photo
  launchCamera: async (options = {}) => {
    try {
      const hasPermission = await CameraService.checkCameraPermission()

      if (!hasPermission) {
        const granted = await CameraService.requestCameraPermission()
        if (!granted) {
          Alert.alert(
            "Permission Denied",
            "Camera access is required to take photos. Please enable it in your device settings.",
          )
          return null
        }
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: options.allowsEditing !== false,
        aspect: options.aspect || [4, 3],
        quality: options.quality || 0.8,
        base64: options.base64 || false,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        return result.assets[0]
      }

      return null
    } catch (error) {
      console.error("Error launching camera:", error)
      Alert.alert("Error", "Failed to open camera. Please try again.")
      return null
    }
  },

  // Pick an image from gallery
  pickImage: async (options = {}) => {
    try {
      const hasPermission = await CameraService.requestMediaLibraryPermission()

      if (!hasPermission) {
        Alert.alert(
          "Permission Denied",
          "Media library access is required to select photos. Please enable it in your device settings.",
        )
        return null
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: options.allowsEditing !== false,
        aspect: options.aspect || [4, 3],
        quality: options.quality || 0.8,
        base64: options.base64 || false,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        return result.assets[0]
      }

      return null
    } catch (error) {
      console.error("Error picking image:", error)
      Alert.alert("Error", "Failed to select image. Please try again.")
      return null
    }
  },

  // Show options to either take photo or pick from gallery
  showImagePickerOptions: () => {
    return new Promise((resolve) => {
      Alert.alert(
        "Select Image",
        "Choose an option",
        [
          {
            text: "Take Photo",
            onPress: async () => {
              const image = await CameraService.launchCamera()
              resolve(image)
            },
          },
          {
            text: "Choose from Gallery",
            onPress: async () => {
              const image = await CameraService.pickImage()
              resolve(image)
            },
          },
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => resolve(null),
          },
        ],
        { cancelable: true, onDismiss: () => resolve(null) },
      )
    })
  },
}
