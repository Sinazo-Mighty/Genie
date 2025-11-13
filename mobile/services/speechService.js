import * as Speech from "expo-speech"
import { Alert } from "react-native"

export const SpeechService = {
  // Text-to-Speech: Read text aloud
  speak: async (text, options = {}) => {
    try {
      const isSpeaking = await Speech.isSpeakingAsync()

      if (isSpeaking) {
        await Speech.stop()
      }

      await Speech.speak(text, {
        language: options.language || "en-US",
        pitch: options.pitch || 1.0,
        rate: options.rate || 0.9,
        volume: options.volume || 1.0,
        onDone: options.onDone,
        onStopped: options.onStopped,
        onError: options.onError,
      })

      return { success: true }
    } catch (error) {
      console.error("Error speaking text:", error)
      return { success: false, error: error.message }
    }
  },

  // Stop current speech
  stop: async () => {
    try {
      await Speech.stop()
      return { success: true }
    } catch (error) {
      console.error("Error stopping speech:", error)
      return { success: false, error: error.message }
    }
  },

  // Check if currently speaking
  isSpeaking: async () => {
    try {
      return await Speech.isSpeakingAsync()
    } catch (error) {
      console.error("Error checking speech status:", error)
      return false
    }
  },

  // Pause speech (iOS only)
  pause: async () => {
    try {
      await Speech.pause()
      return { success: true }
    } catch (error) {
      console.error("Error pausing speech:", error)
      return { success: false, error: error.message }
    }
  },

  // Resume speech (iOS only)
  resume: async () => {
    try {
      await Speech.resume()
      return { success: true }
    } catch (error) {
      console.error("Error resuming speech:", error)
      return { success: false, error: error.message }
    }
  },

  // Get available voices
  getAvailableVoices: async () => {
    try {
      const voices = await Speech.getAvailableVoicesAsync()
      return { success: true, voices }
    } catch (error) {
      console.error("Error getting available voices:", error)
      return { success: false, error: error.message, voices: [] }
    }
  },

  // Read recipe instructions step by step
  readRecipeInstructions: async (instructions, options = {}) => {
    try {
      if (!Array.isArray(instructions)) {
        instructions = [instructions]
      }

      for (let i = 0; i < instructions.length; i++) {
        const step = instructions[i]
        const stepText = `Step ${i + 1}. ${step}`

        await new Promise((resolve) => {
          Speech.speak(stepText, {
            language: options.language || "en-US",
            rate: options.rate || 0.85,
            onDone: resolve,
          })
        })

        // Small pause between steps
        if (i < instructions.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500))
        }
      }

      return { success: true }
    } catch (error) {
      console.error("Error reading recipe instructions:", error)
      return { success: false, error: error.message }
    }
  },
}

// Note: For Speech Recognition (Speech-to-Text), you'll need to use expo-speech-recognition
// or a third-party service like Google Speech-to-Text API
// This is a placeholder for future implementation

export const SpeechRecognitionService = {
  // Check if speech recognition is available
  isAvailable: () => {
    // This would check if the device supports speech recognition
    // For now, return false as expo-speech-recognition needs to be installed
    return false
  },

  // Start listening for speech
  startListening: async (options = {}) => {
    try {
      // Placeholder for speech recognition implementation
      // You would use expo-speech-recognition or Google Speech-to-Text API here
      Alert.alert(
        "Speech Recognition",
        "Speech recognition requires additional setup. Please use the text input for now.",
      )

      return {
        success: false,
        error: "Speech recognition not yet implemented",
      }
    } catch (error) {
      console.error("Error starting speech recognition:", error)
      return { success: false, error: error.message }
    }
  },

  // Stop listening
  stopListening: async () => {
    try {
      // Placeholder
      return { success: true }
    } catch (error) {
      console.error("Error stopping speech recognition:", error)
      return { success: false, error: error.message }
    }
  },
}
