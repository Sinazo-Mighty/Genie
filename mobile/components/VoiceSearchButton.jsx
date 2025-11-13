"use client"

import { useState } from "react"
import { TouchableOpacity, Text, StyleSheet, Alert, ActivityIndicator } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { COLORS } from "../constants/colors"
import { SpeechRecognitionService } from "../services/speechService"

export default function VoiceSearchButton({ onSearchQuery }) {
  const [isListening, setIsListening] = useState(false)

  const handleVoiceSearch = async () => {
    if (!SpeechRecognitionService.isAvailable()) {
      Alert.alert(
        "Voice Search",
        "Voice search is not yet available. This feature requires additional setup with Google Speech-to-Text API or expo-speech-recognition.",
        [{ text: "OK" }],
      )
      return
    }

    if (isListening) {
      const result = await SpeechRecognitionService.stopListening()
      setIsListening(false)

      if (result.success && result.transcript) {
        onSearchQuery(result.transcript)
      }
    } else {
      setIsListening(true)
      const result = await SpeechRecognitionService.startListening()

      if (!result.success) {
        setIsListening(false)
        Alert.alert("Error", "Failed to start voice recognition. Please try again.")
      }
    }
  }

  return (
    <TouchableOpacity style={[styles.button, isListening && styles.buttonActive]} onPress={handleVoiceSearch}>
      {isListening ? (
        <ActivityIndicator size="small" color={COLORS.white} />
      ) : (
        <Ionicons name="mic" size={20} color={COLORS.white} />
      )}
      <Text style={styles.buttonText}>{isListening ? "Listening..." : "Voice Search"}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  buttonActive: {
    backgroundColor: "#E53935",
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.white,
  },
})
