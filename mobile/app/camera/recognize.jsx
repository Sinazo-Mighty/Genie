"use client"

import { useState, useEffect } from "react"
import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert, FlatList } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { COLORS } from "../../constants/colors"
import { AIService } from "../../services/aiService"
import { cameraStyles } from "../../assets/styles/camera.styles"
import { MealAPI } from "../../services/mealAPI"
import RecipeCard from "../../components/RecipeCard"

export default function RecognizeScreen() {
  const { imageUri } = useLocalSearchParams()
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(true)
  const [ingredients, setIngredients] = useState([])
  const [error, setError] = useState(null)
  const [suggestedRecipes, setSuggestedRecipes] = useState([])
  const [loadingRecipes, setLoadingRecipes] = useState(false)

  useEffect(() => {
    if (imageUri) {
      recognizeIngredients()
    }
  }, [imageUri])

  const recognizeIngredients = async () => {
    try {
      setIsProcessing(true)
      setError(null)

      // Use the smart ingredient detection that tries multiple AI services
      const result = await AIService.detectIngredients(imageUri)

      if (result.success && result.ingredients) {
        setIngredients(result.ingredients)

        // Automatically search for recipes with detected ingredients
        searchRecipesWithIngredients(result.ingredients)
      } else {
        setError(result.error || "Failed to detect ingredients")
        Alert.alert("Recognition Failed", "Could not identify ingredients in the image. Please try again.")
      }
    } catch (err) {
      console.error("Error recognizing ingredients:", err)
      setError(err.message)
      Alert.alert("Error", "An error occurred while processing the image.")
    } finally {
      setIsProcessing(false)
    }
  }

  const searchRecipesWithIngredients = async (detectedIngredients) => {
    try {
      setLoadingRecipes(true)

      // Search for recipes using the first few ingredients
      const searchQuery = detectedIngredients.slice(0, 3).join(" ")
      const results = await MealAPI.searchMealsByName(searchQuery)

      if (results.length === 0) {
        // Try searching by individual ingredients
        const ingredientResults = await MealAPI.filterByIngredient(detectedIngredients[0])
        const transformedResults = ingredientResults
          .slice(0, 6)
          .map((meal) => MealAPI.transformMealData(meal))
          .filter((meal) => meal !== null)
        setSuggestedRecipes(transformedResults)
      } else {
        const transformedResults = results
          .slice(0, 6)
          .map((meal) => MealAPI.transformMealData(meal))
          .filter((meal) => meal !== null)
        setSuggestedRecipes(transformedResults)
      }
    } catch (err) {
      console.error("Error searching recipes:", err)
    } finally {
      setLoadingRecipes(false)
    }
  }

  const getAISuggestions = async () => {
    try {
      Alert.alert("AI Recipe Suggestions", "Get personalized recipe suggestions based on these ingredients?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Get Suggestions",
          onPress: async () => {
            setLoadingRecipes(true)
            const result = await AIService.getRecipeSuggestions(ingredients)

            if (result.success) {
              Alert.alert("Recipe Suggestions", result.suggestions, [{ text: "OK" }], {
                cancelable: true,
              })
            } else {
              Alert.alert("Error", "Failed to get AI suggestions. Please try again.")
            }
            setLoadingRecipes(false)
          },
        },
      ])
    } catch (err) {
      console.error("Error getting AI suggestions:", err)
      setLoadingRecipes(false)
    }
  }

  const retakePhoto = () => {
    router.back()
  }

  const goBack = () => {
    router.push("/(tabs)/search")
  }

  if (isProcessing) {
    return (
      <View style={cameraStyles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={cameraStyles.processingText}>Analyzing image...</Text>
        <Text style={[cameraStyles.emptyText, { marginTop: 8 }]}>Using AI to identify ingredients</Text>
      </View>
    )
  }

  return (
    <View style={cameraStyles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={cameraStyles.header}>
          <View style={cameraStyles.headerTop}>
            <TouchableOpacity style={cameraStyles.backButton} onPress={goBack}>
              <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={cameraStyles.headerTitle}>Detected Ingredients</Text>
            <TouchableOpacity style={cameraStyles.backButton} onPress={retakePhoto}>
              <Ionicons name="camera" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Image Preview */}
        <View style={{ padding: 20 }}>
          <View style={cameraStyles.imageContainer}>
            <Image source={{ uri: imageUri }} style={cameraStyles.image} resizeMode="cover" />
          </View>
        </View>

        {/* Ingredients Section */}
        <View style={cameraStyles.section}>
          <Text style={cameraStyles.sectionTitle}>
            Found {ingredients.length} Ingredient{ingredients.length !== 1 ? "s" : ""}
          </Text>

          {ingredients.length > 0 ? (
            <View style={cameraStyles.ingredientsList}>
              {ingredients.map((ingredient, index) => (
                <View key={index} style={cameraStyles.ingredientItem}>
                  <View style={cameraStyles.ingredientIcon}>
                    <Ionicons name="leaf" size={20} color={COLORS.primary} />
                  </View>
                  <Text style={cameraStyles.ingredientText}>{ingredient}</Text>
                  <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                </View>
              ))}
            </View>
          ) : (
            <View style={cameraStyles.emptyState}>
              <Ionicons name="alert-circle-outline" size={48} color={COLORS.textLight} />
              <Text style={cameraStyles.emptyText}>
                No ingredients detected. Try taking another photo with better lighting.
              </Text>
            </View>
          )}
        </View>

        {/* Suggested Recipes Section */}
        {suggestedRecipes.length > 0 && (
          <View style={cameraStyles.section}>
            <Text style={cameraStyles.sectionTitle}>Suggested Recipes</Text>

            {loadingRecipes ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <FlatList
                data={suggestedRecipes}
                renderItem={({ item }) => <RecipeCard recipe={item} />}
                keyExtractor={(item) => item.id.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12 }}
              />
            )}
          </View>
        )}

        {/* Action Buttons */}
        {ingredients.length > 0 && (
          <View style={cameraStyles.actionButtons}>
            <TouchableOpacity style={[cameraStyles.actionButton, cameraStyles.secondaryButton]} onPress={retakePhoto}>
              <Ionicons name="camera" size={20} color={COLORS.text} />
              <Text style={[cameraStyles.actionButtonText, cameraStyles.secondaryButtonText]}>Retake</Text>
            </TouchableOpacity>

            <TouchableOpacity style={cameraStyles.actionButton} onPress={getAISuggestions}>
              <Ionicons name="sparkles" size={20} color={COLORS.white} />
              <Text style={cameraStyles.actionButtonText}>AI Suggestions</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  )
}
