"use client"

export const dynamic = "force-dynamic"

import { useState, use, useEffect, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { mockRecipes } from "@/lib/mock-data"
import { ArrowLeft, Heart, Clock, ChefHat, Volume2, VolumeX, Play, Pause } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface RecipeData {
  id: string
  name: string
  category: string
  area: string
  instructions: string
  thumbnail: string
  ingredients: Array<{ name: string; measure: string }>
  tags: string[]
  cookTime: string
  difficulty: string
}

export default function RecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const mockRecipe = mockRecipes.find((r) => r.id === id)
  const [recipe, setRecipe] = useState<RecipeData | null>(mockRecipe || null)
  const [loading, setLoading] = useState(!mockRecipe)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])

  useEffect(() => {
    if (!mockRecipe && id) {
      const fetchRecipeDetails = async () => {
        try {
          const response = await fetch(`/api/recipe-details?id=${id}`)
          if (response.ok) {
            const data = await response.json()
            setRecipe(data)
          }
        } catch (error) {
          console.error("Error fetching recipe:", error)
        } finally {
          setLoading(false)
        }
      }

      fetchRecipeDetails()
    } else {
      setLoading(false)
    }
  }, [id, mockRecipe])

  useEffect(() => {
    if (recipe) {
      fetch("/api/track-view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipeId: recipe.id,
          recipeName: recipe.name,
        }),
      }).catch((err) => console.error("Failed to track view:", err))
    }
  }, [recipe])

  useEffect(() => {
    const loadUserFavorites = async () => {
      if (!recipe) return

      const supabase = createClient()
      if (!supabase) return

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        setUserId(user.id)

        const { data: dbFavorites } = await supabase
          .from("favorites")
          .select("recipe_id")
          .eq("user_id", user.id)
          .eq("recipe_id", recipe.id)
          .single()

        setIsFavorite(!!dbFavorites)

        const storedFavorites = localStorage.getItem(`genie_favorites_${user.id}`)
        if (storedFavorites) {
          const favorites = JSON.parse(storedFavorites)
          if (!favorites.includes(recipe.id) && dbFavorites) {
            favorites.push(recipe.id)
            localStorage.setItem(`genie_favorites_${user.id}`, JSON.stringify(favorites))
          }
        }
      }
    }

    loadUserFavorites()
  }, [recipe])

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices()
      setVoices(availableVoices)
    }

    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices

    return () => {
      window.speechSynthesis.onvoiceschanged = null
    }
  }, [])

  useEffect(() => {
    return () => {
      if (speechRef.current) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const steps = recipe?.instructions.split(". ").filter((s) => s.trim()) || []

  const speakStep = (stepText: string) => {
    if (isMuted) return

    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(stepText)

    const femaleVoiceNames = [
      "Google US English Female",
      "Google UK English Female",
      "Samantha",
      "Victoria",
      "Karen",
      "Moira",
      "Fiona",
      "Zira",
      "Microsoft Zira",
      "Google Female",
    ]

    let selectedVoice = null
    for (const voiceName of femaleVoiceNames) {
      selectedVoice = voices.find((voice) => voice.name.includes(voiceName))
      if (selectedVoice) break
    }

    if (!selectedVoice) {
      selectedVoice = voices.find(
        (voice) =>
          voice.lang.startsWith("en") &&
          (voice.name.toLowerCase().includes("female") || voice.name.toLowerCase().includes("woman")),
      )
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice
    }

    utterance.rate = 0.9
    utterance.pitch = 1.15
    utterance.volume = 1.0

    speechRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }

  const toggleFavorite = async () => {
    if (!recipe) return

    if (!userId) {
      alert("Please sign in to save favorites")
      return
    }

    const newFavoriteState = !isFavorite
    console.log("[v0] Toggle favorite on recipe page:", recipe.id, "New state:", newFavoriteState)
    setIsFavorite(newFavoriteState)

    const storedFavorites = localStorage.getItem(`genie_favorites_${userId}`)
    let favorites: string[] = storedFavorites ? JSON.parse(storedFavorites) : []

    if (newFavoriteState) {
      favorites = [...favorites, recipe.id]
    } else {
      favorites = favorites.filter((fav) => fav !== recipe.id)
    }

    localStorage.setItem(`genie_favorites_${userId}`, JSON.stringify(favorites))

    try {
      if (newFavoriteState) {
        const response = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipeId: recipe.id,
            recipeName: recipe.name,
            recipeData: JSON.stringify(recipe),
          }),
        })
        console.log("[v0] Add favorite response:", response.ok)

        if (!response.ok) {
          console.error("[v0] Failed to add favorite to database")
          setIsFavorite(!newFavoriteState)
        } else {
          console.log("[v0] Successfully added favorite to database")
        }
      } else {
        const response = await fetch("/api/favorites", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipeId: recipe.id }),
        })
        console.log("[v0] Delete favorite response:", response.ok)

        if (!response.ok) {
          console.error("[v0] Failed to remove favorite from database")
          setIsFavorite(!newFavoriteState)
        }
      }
    } catch (error) {
      console.error("[v0] Error saving favorite to database:", error)
      setIsFavorite(!newFavoriteState)
    }
  }

  const toggleVoiceGuidance = () => {
    if (!isPlaying) {
      setIsPlaying(true)
      const stepText = `Step ${currentStep + 1}. ${steps[currentStep].trim()}`
      speakStep(stepText)
    } else {
      setIsPlaying(false)
      window.speechSynthesis.cancel()
    }
  }

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      const newStep = currentStep + 1
      setCurrentStep(newStep)
      if (isPlaying) {
        const stepText = `Step ${newStep + 1}. ${steps[newStep].trim()}`
        speakStep(stepText)
      }
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      const newStep = currentStep - 1
      setCurrentStep(newStep)
      if (isPlaying) {
        const stepText = `Step ${newStep + 1}. ${steps[newStep].trim()}`
        speakStep(stepText)
      }
    }
  }

  useEffect(() => {
    if (isMuted && isPlaying) {
      window.speechSynthesis.cancel()
    }
  }, [isMuted, isPlaying])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-orange-900 mb-4">Loading recipe...</h1>
        </div>
      </div>
    )
  }

  if (!recipe) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-orange-900 mb-4">Recipe not found</h1>
          <Link href="/">
            <Button className="bg-orange-600 hover:bg-orange-700">Go Home</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={toggleFavorite}>
              <Heart className={`w-5 h-5 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Recipe Image */}
        <div className="relative h-80 rounded-2xl overflow-hidden mb-8">
          <img src={recipe.thumbnail || "/placeholder.svg"} alt={recipe.name} className="w-full h-full object-cover" />
        </div>

        {/* Recipe Info */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-orange-900 mb-4">{recipe.name}</h1>
          <div className="flex flex-wrap items-center gap-3">
            <Badge className="bg-orange-600 text-white">{recipe.category}</Badge>
            <Badge variant="secondary" className="bg-orange-100 text-orange-700">
              {recipe.area}
            </Badge>
            <div className="flex items-center gap-1 text-orange-700">
              <Clock className="w-4 h-4" />
              {recipe.cookTime}
            </div>
            <div className="flex items-center gap-1 text-orange-700">
              <ChefHat className="w-4 h-4" />
              {recipe.difficulty}
            </div>
          </div>
        </div>

        {/* Ingredients */}
        <Card className="mb-8 border-orange-200">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold text-orange-900 mb-4">Ingredients</h2>
            <ul className="space-y-2">
              {recipe.ingredients.map((ingredient, index) => (
                <li key={index} className="flex items-center gap-2 text-orange-800">
                  <span className="w-2 h-2 rounded-full bg-orange-600" />
                  <span className="font-medium">{ingredient.measure}</span>
                  <span>{ingredient.name}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Voice Guidance Controls */}
        <Card className="mb-8 border-orange-200 bg-orange-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-orange-900 flex items-center gap-2">
                <Volume2 className="w-6 h-6 text-orange-600" />
                Voice Guidance
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setIsMuted(!isMuted)}>
                {isMuted ? (
                  <VolumeX className="w-5 h-5 text-orange-600" />
                ) : (
                  <Volume2 className="w-5 h-5 text-orange-600" />
                )}
              </Button>
            </div>
            <p className="text-orange-700 mb-4">Follow along with step-by-step voice instructions</p>
            <div className="flex items-center gap-2">
              <Button onClick={toggleVoiceGuidance} className="gap-2 bg-orange-600 hover:bg-orange-700">
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Start Cooking
                  </>
                )}
              </Button>
              <span className="text-sm text-orange-700">
                Step {currentStep + 1} of {steps.length}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="border-orange-200">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold text-orange-900 mb-4">Instructions</h2>
            <ol className="space-y-4">
              {steps.map((step, index) => (
                <li
                  key={index}
                  className={`flex gap-4 p-4 rounded-lg transition-colors ${
                    index === currentStep && isPlaying ? "bg-orange-100 border-2 border-orange-600" : "bg-white"
                  }`}
                >
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold">
                    {index + 1}
                  </span>
                  <p className="text-orange-800 flex-1">{step.trim()}.</p>
                </li>
              ))}
            </ol>

            {isPlaying && (
              <div className="flex gap-2 mt-6">
                <Button
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  variant="outline"
                  className="border-orange-600 text-orange-600 hover:bg-orange-50 bg-transparent"
                >
                  Previous Step
                </Button>
                <Button
                  onClick={nextStep}
                  disabled={currentStep === steps.length - 1}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  Next Step
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
