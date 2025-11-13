"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { mockRecipes } from "@/lib/mock-data"
import { Camera, ArrowLeft, Sparkles, Upload, X, AlertCircle, Wand2 } from "lucide-react"

export const dynamic = "force-dynamic"

export default function CameraPage() {
  const router = useRouter()
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [detectedIngredients, setDetectedIngredients] = useState<string[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [suggestedRecipes, setSuggestedRecipes] = useState<typeof mockRecipes>([])
  const [error, setError] = useState<string | null>(null)
  const [analysisMessage, setAnalysisMessage] = useState<string | null>(null)

  const analyzeImage = async (imageData: string) => {
    setIsAnalyzing(true)
    setError(null)
    setAnalysisMessage(null)

    try {
      console.log("[v0] Sending image for analysis...")
      const response = await fetch("/api/analyze-ingredients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: imageData }),
      })

      const data = await response.json()
      console.log("[v0] Analysis response:", data)

      if (data.fallback) {
        if (data.ingredients && data.ingredients.length > 0) {
          setDetectedIngredients(data.ingredients)
          setAnalysisMessage(data.message || "Using sample ingredients. Add Huggingface API key for AI detection.")

          // Find recipes that match detected ingredients
          const suggested = mockRecipes
            .map((recipe) => {
              const matchCount = recipe.ingredients.filter((ing) =>
                data.ingredients.some(
                  (detected: string) =>
                    ing.name.toLowerCase().includes(detected) || detected.includes(ing.name.toLowerCase()),
                ),
              ).length
              return { recipe, matchCount }
            })
            .filter((item) => item.matchCount > 0)
            .sort((a, b) => b.matchCount - a.matchCount)
            .slice(0, 6)
            .map((item) => item.recipe)

          setSuggestedRecipes(suggested)

          saveScannedIngredientsLocally(data.ingredients, imageData)
        }
        return
      }

      if (!response.ok) {
        setError(data.message || data.error || "Failed to analyze image")
        return
      }

      if (data.ingredients && data.ingredients.length > 0) {
        setDetectedIngredients(data.ingredients)
        if (data.message) {
          setAnalysisMessage(data.message)
        }

        // Find recipes that match detected ingredients
        const suggested = mockRecipes
          .map((recipe) => {
            const matchCount = recipe.ingredients.filter((ing) =>
              data.ingredients.some(
                (detected: string) =>
                  ing.name.toLowerCase().includes(detected) || detected.includes(ing.name.toLowerCase()),
              ),
            ).length
            return { recipe, matchCount }
          })
          .filter((item) => item.matchCount > 0)
          .sort((a, b) => b.matchCount - a.matchCount)
          .slice(0, 6)
          .map((item) => item.recipe)

        setSuggestedRecipes(suggested)

        saveScannedIngredientsLocally(data.ingredients, imageData)
      } else {
        setError("No ingredients detected. Please try another image with visible food ingredients.")
      }
    } catch (err) {
      console.error("[v0] Error analyzing image:", err)
      setError(err instanceof Error ? err.message : "Failed to analyze image. Please try again.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const enhanceImage = async () => {
    if (!capturedImage) return

    setIsEnhancing(true)
    setError(null)

    try {
      console.log("[v0] Enhancing image...")
      const response = await fetch("/api/enhance-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: capturedImage,
          prompt: "Enhance this food image to make it clearer, more vibrant, and appetizing with better lighting",
        }),
      })

      const data = await response.json()
      console.log("[v0] Enhancement response:", data)

      if (!response.ok) {
        setError(data.message || data.error || "Failed to enhance image")
        return
      }

      if (data.enhancedImage) {
        setCapturedImage(data.enhancedImage)
        setAnalysisMessage("Image enhanced! Now analyzing ingredients...")
        // Automatically analyze the enhanced image
        await analyzeImage(data.enhancedImage)
      }
    } catch (err) {
      console.error("[v0] Error enhancing image:", err)
      setError(err instanceof Error ? err.message : "Failed to enhance image. Please try again.")
    } finally {
      setIsEnhancing(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB")
        return
      }

      if (!file.type.startsWith("image/")) {
        setError("Please upload a valid image file")
        return
      }

      const reader = new FileReader()
      reader.onload = (event) => {
        const imageData = event.target?.result as string
        setCapturedImage(imageData)
        analyzeImage(imageData)
      }
      reader.onerror = () => {
        setError("Failed to read image file")
      }
      reader.readAsDataURL(file)
    }
  }

  const reset = () => {
    setCapturedImage(null)
    setDetectedIngredients([])
    setSuggestedRecipes([])
    setIsAnalyzing(false)
    setIsEnhancing(false)
    setError(null)
    setAnalysisMessage(null)
  }

  const saveScannedIngredientsLocally = (ingredients: string[], imageUrl: string) => {
    try {
      const storedScans = localStorage.getItem("scannedIngredients")
      const scans = storedScans ? JSON.parse(storedScans) : []

      scans.unshift({
        ingredients,
        imageUrl,
        timestamp: new Date().toISOString(),
      })

      // Keep only last 20 scans
      if (scans.length > 20) {
        scans.pop()
      }

      localStorage.setItem("scannedIngredients", JSON.stringify(scans))
    } catch (error) {
      console.error("Error saving scanned ingredients:", error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-orange-100 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Camera className="w-6 h-6 text-orange-600 dark:text-orange-300" />
                <h1 className="text-2xl font-bold text-orange-900 dark:text-orange-100">AI Ingredient Scanner</h1>
              </div>
            </div>
            {capturedImage && (
              <Button variant="ghost" size="icon" onClick={reset}>
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!capturedImage ? (
          <div className="space-y-6">
            <Card className="border-orange-200 dark:border-gray-700 dark:bg-gray-800">
              <CardContent className="p-8 text-center">
                <div className="mb-6">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-orange-100 dark:bg-orange-900 mb-4">
                    <Camera className="w-10 h-10 text-orange-600 dark:text-orange-300" />
                  </div>
                  <h2 className="text-2xl font-bold text-orange-900 dark:text-orange-100 mb-2">
                    Scan Your Ingredients
                  </h2>
                  <p className="text-orange-700 dark:text-orange-300">
                    Take a photo or upload an image of your ingredients, and our AI will identify them and suggest
                    recipes
                  </p>
                </div>

                <div className="flex justify-center">
                  <label htmlFor="file-upload">
                    <Button
                      size="lg"
                      className="gap-2 bg-orange-600 hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-600"
                      asChild
                    >
                      <span>
                        <Upload className="w-5 h-5" />
                        Upload Image
                      </span>
                    </Button>
                  </label>
                  <input id="file-upload" type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                </div>
              </CardContent>
            </Card>

            <div className="bg-orange-50 rounded-lg p-6 dark:bg-gray-800 dark:border-gray-700">
              <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-orange-600 dark:text-orange-300" />
                How it works
              </h3>
              <ol className="space-y-2 text-orange-700 dark:text-orange-300">
                <li>1. Take a photo or upload an image of your ingredients</li>
                <li>2. Our AI analyzes the image and identifies ingredients</li>
                <li>3. Get personalized recipe suggestions based on what you have</li>
                <li>4. Start cooking with step-by-step voice guidance</li>
              </ol>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-gray-800 dark:border-gray-700">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>Note:</strong> For AI-powered ingredient detection, add one of these API keys as environment
                variables:
              </p>
              <ul className="text-sm text-blue-800 dark:text-blue-300 mt-2 space-y-1 ml-4">
                <li>
                  • <code className="bg-blue-100 px-1 rounded">HUGGING_FACE_API_KEY</code> (Recommended - specialized
                  food recognition)
                </li>
                <li>
                  • <code className="bg-blue-100 px-1 rounded">OPENAI_API_KEY</code> (Alternative - GPT-4 Vision)
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Captured Image */}
            <Card className="border-orange-200 dark:border-gray-700 dark:bg-gray-800">
              <CardContent className="p-4">
                <div className="relative h-64 rounded-lg overflow-hidden">
                  <Image
                    src={capturedImage || "/placeholder.svg"}
                    alt="Captured ingredients"
                    fill
                    className="object-cover"
                  />
                </div>
                {!isAnalyzing && !isEnhancing && detectedIngredients.length === 0 && (
                  <div className="mt-4 flex gap-2">
                    <Button
                      onClick={enhanceImage}
                      variant="outline"
                      className="flex-1 gap-2 border-purple-600 text-purple-600 hover:bg-purple-50 bg-transparent dark:border-purple-300 dark:text-purple-300 dark:hover:bg-purple-400"
                    >
                      <Wand2 className="w-4 h-4" />
                      Enhance Image with AI
                    </Button>
                    <Button
                      onClick={() => analyzeImage(capturedImage)}
                      className="flex-1 bg-orange-600 hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-600"
                    >
                      Analyze Now
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Enhancement Status */}
            {isEnhancing && (
              <Card className="border-purple-200 dark:border-gray-700 dark:bg-gray-800">
                <CardContent className="p-6 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900 mb-4 animate-pulse">
                    <Wand2 className="w-8 h-8 text-purple-600 dark:text-purple-300" />
                  </div>
                  <p className="text-lg font-semibold text-purple-900 dark:text-purple-100">
                    Enhancing image with AI...
                  </p>
                  <p className="text-sm text-purple-600 dark:text-purple-300 mt-2">
                    Making your food photo clearer and more vibrant
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Analysis Status */}
            {isAnalyzing && (
              <Card className="border-orange-200 dark:border-gray-700 dark:bg-gray-800">
                <CardContent className="p-6 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900 mb-4 animate-pulse">
                    <Sparkles className="w-8 h-8 text-orange-600 dark:text-orange-300" />
                  </div>
                  <p className="text-lg font-semibold text-orange-900 dark:text-orange-100">
                    Analyzing ingredients with AI...
                  </p>
                  <p className="text-sm text-orange-600 dark:text-orange-300 mt-2">
                    Using advanced computer vision to identify ingredients
                  </p>
                </CardContent>
              </Card>
            )}

            {error && !isAnalyzing && !isEnhancing && (
              <Card className="border-red-200 bg-red-50 dark:border-red-300 dark:bg-red-800">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-300 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-red-900 dark:text-red-100 mb-1">Analysis Failed</h3>
                      <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
                      <Button
                        onClick={reset}
                        variant="outline"
                        size="sm"
                        className="mt-3 bg-transparent dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                      >
                        Try Again
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {analysisMessage && !isAnalyzing && !isEnhancing && !error && (
              <Card className="border-green-200 bg-green-50 dark:border-green-300 dark:bg-green-800">
                <CardContent className="p-4">
                  <p className="text-sm text-green-800 dark:text-green-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-green-600 dark:text-green-300" />
                    {analysisMessage}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Detected Ingredients */}
            {detectedIngredients.length > 0 && !isAnalyzing && !isEnhancing && (
              <Card className="border-orange-200 dark:border-gray-700 dark:bg-gray-800">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-orange-900 dark:text-orange-100 mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-orange-600 dark:text-orange-300" />
                    Detected Ingredients ({detectedIngredients.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {detectedIngredients.map((ingredient, index) => (
                      <Badge
                        key={index}
                        className="bg-orange-600 text-white text-sm py-1.5 px-3 capitalize dark:bg-orange-700 dark:text-gray-300"
                      >
                        {ingredient}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Suggested Recipes */}
            {suggestedRecipes.length > 0 && !isAnalyzing && !isEnhancing && (
              <div>
                <h3 className="text-2xl font-bold text-orange-900 dark:text-orange-100 mb-4">
                  Suggested Recipes ({suggestedRecipes.length})
                </h3>
                <p className="text-orange-700 dark:text-orange-300 mb-4">Based on your detected ingredients</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {suggestedRecipes.map((recipe) => (
                    <Card
                      key={recipe.id}
                      className="group overflow-hidden hover:shadow-xl transition-all border-orange-100 dark:border-gray-700 dark:bg-gray-800"
                    >
                      <div className="relative h-40 overflow-hidden">
                        <Image
                          src={recipe.thumbnail || "/placeholder.svg"}
                          alt={recipe.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      <CardContent className="p-4">
                        <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">{recipe.name}</h4>
                        <Badge
                          variant="secondary"
                          className="bg-orange-100 text-orange-700 mb-3 dark:bg-orange-900 dark:text-orange-300"
                        >
                          {recipe.category}
                        </Badge>
                        <Link href={`/recipe/${recipe.id}`}>
                          <Button className="w-full bg-orange-600 hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-600">
                            View Recipe
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
