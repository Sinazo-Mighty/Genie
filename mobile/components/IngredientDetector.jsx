"use client"

import { useState } from "react"
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { COLORS } from "../constants/colors"
import { CameraService } from "../services/cameraService"
import { AIService } from "../services/aiService"

export default function IngredientDetector({ onIngredientsDetected }) {
  const [isProcessing, setIsProcessing] = useState(false)

  const handleImageCapture = async () => {
    try {
      setIsProcessing(true)

      // Show options to take photo or pick from gallery
      const image = await CameraService.showImagePickerOptions()

      if (!image) {
        setIsProcessing(false)
        return
      }

      // Detect ingredients using AI
      const result = await AIService.detectIngredients(image.uri)

      if (result.success && result.ingredients) {
        onIngredientsDetected(result.ingredients, image.uri)
      } else {
        Alert.alert("Detection Failed", "Could not identify ingredients. Please try again.")
      }
    } catch (error) {
      console.error("Error detecting ingredients:", error)
      Alert.alert("Error", "Failed to process image. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, isProcessing && styles.buttonDisabled]}
        onPress={handleImageCapture}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <>
            <ActivityIndicator size="small" color={COLORS.white} />
            <Text style={styles.buttonText}>Processing...</Text>
          </>
        ) : (
          <>
            <Ionicons name="camera" size={24} color={COLORS.white} />
            <Text style={styles.buttonText}>Scan Ingredients</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.white,
  },
})
