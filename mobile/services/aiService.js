import { ENV } from "../constants/env"

export const AIService = {
  // Analyze image using OpenAI Vision API
  analyzeImageWithOpenAI: async (imageUri, prompt = "What ingredients do you see in this image?") => {
    try {
      if (!ENV.OPENAI_API_KEY) {
        throw new Error("OpenAI API key is not configured")
      }

      // Convert image to base64
      const base64Image = await AIService.convertImageToBase64(imageUri)

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ENV.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`,
                  },
                },
              ],
            },
          ],
          max_tokens: 500,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to analyze image with OpenAI")
      }

      return {
        success: true,
        result: data.choices[0].message.content,
        provider: "openai",
      }
    } catch (error) {
      console.error("Error analyzing image with OpenAI:", error)
      return {
        success: false,
        error: error.message,
        provider: "openai",
      }
    }
  },

  // Analyze image using Google Vision API
  analyzeImageWithGoogleVision: async (imageUri) => {
    try {
      if (!ENV.GOOGLE_VISION_API_KEY) {
        throw new Error("Google Vision API key is not configured")
      }

      // Convert image to base64
      const base64Image = await AIService.convertImageToBase64(imageUri)

      const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${ENV.GOOGLE_VISION_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            requests: [
              {
                image: {
                  content: base64Image,
                },
                features: [
                  { type: "LABEL_DETECTION", maxResults: 10 },
                  { type: "TEXT_DETECTION", maxResults: 5 },
                  { type: "OBJECT_LOCALIZATION", maxResults: 10 },
                ],
              },
            ],
          }),
        },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to analyze image with Google Vision")
      }

      const result = data.responses[0]

      // Extract labels (ingredients/objects)
      const labels =
        result.labelAnnotations?.map((label) => ({
          description: label.description,
          score: label.score,
        })) || []

      // Extract text
      const text = result.textAnnotations?.[0]?.description || ""

      // Extract objects
      const objects =
        result.localizedObjectAnnotations?.map((obj) => ({
          name: obj.name,
          score: obj.score,
        })) || []

      return {
        success: true,
        labels,
        text,
        objects,
        provider: "google-vision",
      }
    } catch (error) {
      console.error("Error analyzing image with Google Vision:", error)
      return {
        success: false,
        error: error.message,
        provider: "google-vision",
      }
    }
  },

  // Analyze image using Gemini API
  analyzeImageWithGemini: async (imageUri, prompt = "Identify the ingredients in this image") => {
    try {
      if (!ENV.GEMINI_API_KEY) {
        throw new Error("Gemini API key is not configured")
      }

      // Convert image to base64
      const base64Image = await AIService.convertImageToBase64(imageUri)

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${ENV.GEMINI_MODEL}:generateContent?key=${ENV.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  {
                    inline_data: {
                      mime_type: "image/jpeg",
                      data: base64Image,
                    },
                  },
                ],
              },
            ],
          }),
        },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to analyze image with Gemini")
      }

      const result = data.candidates?.[0]?.content?.parts?.[0]?.text || ""

      return {
        success: true,
        result,
        provider: "gemini",
      }
    } catch (error) {
      console.error("Error analyzing image with Gemini:", error)
      return {
        success: false,
        error: error.message,
        provider: "gemini",
      }
    }
  },

  // Get recipe suggestions based on ingredients
  getRecipeSuggestions: async (ingredients, preferences = {}) => {
    try {
      if (!ENV.OPENAI_API_KEY) {
        throw new Error("OpenAI API key is not configured")
      }

      const ingredientsList = Array.isArray(ingredients) ? ingredients.join(", ") : ingredients

      const prompt = `Given these ingredients: ${ingredientsList}
${preferences.dietary ? `Dietary preferences: ${preferences.dietary}` : ""}
${preferences.cuisine ? `Cuisine type: ${preferences.cuisine}` : ""}
${preferences.cookTime ? `Maximum cooking time: ${preferences.cookTime} minutes` : ""}

Suggest 3 delicious recipes that can be made with these ingredients. For each recipe, provide:
1. Recipe name
2. Brief description
3. Estimated cooking time
4. Difficulty level (Easy/Medium/Hard)
5. Additional ingredients needed (if any)

Format the response as a JSON array.`

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ENV.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: ENV.OPENAI_MODEL,
          messages: [
            {
              role: "system",
              content: "You are a helpful cooking assistant that suggests recipes based on available ingredients.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to get recipe suggestions")
      }

      return {
        success: true,
        suggestions: data.choices[0].message.content,
      }
    } catch (error) {
      console.error("Error getting recipe suggestions:", error)
      return {
        success: false,
        error: error.message,
      }
    }
  },

  // Convert image URI to base64
  convertImageToBase64: async (imageUri) => {
    try {
      const response = await fetch(imageUri)
      const blob = await response.blob()

      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          const base64data = reader.result.split(",")[1]
          resolve(base64data)
        }
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
    } catch (error) {
      console.error("Error converting image to base64:", error)
      throw error
    }
  },

  // Smart ingredient detection - tries multiple AI services
  detectIngredients: async (imageUri) => {
    try {
      // Try Google Vision first for fast label detection
      const visionResult = await AIService.analyzeImageWithGoogleVision(imageUri)

      if (visionResult.success && visionResult.labels.length > 0) {
        // Filter for food-related labels
        const foodLabels = visionResult.labels.filter((label) => label.score > 0.7).map((label) => label.description)

        // Use OpenAI to refine and get cooking-specific ingredients
        const refinedResult = await AIService.analyzeImageWithOpenAI(
          imageUri,
          `Based on this image, list only the cooking ingredients you can identify. The image may contain: ${foodLabels.join(", ")}. Return only a comma-separated list of ingredients.`,
        )

        if (refinedResult.success) {
          return {
            success: true,
            ingredients: refinedResult.result.split(",").map((i) => i.trim()),
            rawLabels: foodLabels,
            provider: "hybrid",
          }
        }
      }

      // Fallback to OpenAI only
      const openAIResult = await AIService.analyzeImageWithOpenAI(
        imageUri,
        "List all the cooking ingredients you can identify in this image. Return only a comma-separated list.",
      )

      if (openAIResult.success) {
        return {
          success: true,
          ingredients: openAIResult.result.split(",").map((i) => i.trim()),
          provider: "openai",
        }
      }

      throw new Error("Failed to detect ingredients")
    } catch (error) {
      console.error("Error detecting ingredients:", error)
      return {
        success: false,
        error: error.message,
      }
    }
  },
}
