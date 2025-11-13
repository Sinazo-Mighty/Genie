"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, ArrowLeft, Clock, Loader2, RefreshCw } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Recipe {
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

export default function FavoritesPage() {
  const [favoriteRecipes, setFavoriteRecipes] = useState<Recipe[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  const loadFavorites = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      if (!supabase) {
        setError("Database connection unavailable")
        setIsLoading(false)
        return
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError("Please log in to view your favorites")
        setIsLoading(false)
        return
      }

      setUserId(user.id)

      const response = await fetch("/api/favorites", {
        method: "GET",
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        setError(`Failed to load favorites: ${response.status}`)
        setIsLoading(false)
        return
      }

      const data = await response.json()

      if (data.success && data.favorites) {
        const recipes: Recipe[] = []

        for (const favorite of data.favorites) {
          try {
            if (favorite.recipe_data) {
              recipes.push(favorite.recipe_data)
            }
          } catch (error) {
            console.error("Error processing favorite:", error)
          }
        }

        setFavoriteRecipes(recipes)
      }
    } catch (error) {
      console.error("Error loading favorites:", error)
      setError(`Error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadFavorites()
  }, [])

  const removeFavorite = async (id: string) => {
    setFavoriteRecipes(favoriteRecipes.filter((recipe) => recipe.id !== id))

    try {
      const response = await fetch("/api/favorites", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId: id }),
      })

      if (!response.ok) {
        loadFavorites()
      }
    } catch (error) {
      console.error("Error removing favorite from database:", error)
      loadFavorites()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Heart className="w-6 h-6 text-orange-600 fill-orange-600" />
              <h1 className="text-2xl font-bold text-orange-900">My Favorites</h1>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={loadFavorites}
              className="ml-auto bg-transparent"
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-semibold">Error Loading Favorites</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
            {!userId && (
              <Link href="/login">
                <Button variant="outline" size="sm" className="mt-3 bg-transparent">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-16">
            <Loader2 className="w-12 h-12 text-orange-600 mx-auto mb-4 animate-spin" />
            <p className="text-orange-700">Loading your favorites...</p>
          </div>
        ) : favoriteRecipes.length > 0 ? (
          <>
            <div className="mb-4">
              <p className="text-orange-700 font-medium">
                {favoriteRecipes.length} favorite{favoriteRecipes.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favoriteRecipes.map((recipe) => (
                <Card
                  key={recipe.id}
                  className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-orange-100"
                >
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={recipe.thumbnail || "/placeholder.svg"}
                      alt={recipe.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute top-3 right-3 rounded-full"
                      onClick={() => removeFavorite(recipe.id)}
                    >
                      <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                    </Button>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg text-orange-900 mb-2">{recipe.name}</h3>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                        {recipe.category}
                      </Badge>
                      <div className="flex items-center gap-1 text-sm text-orange-600">
                        <Clock className="w-4 h-4" />
                        {recipe.cookTime}
                      </div>
                    </div>
                    <Link href={`/recipe/${recipe.id}`}>
                      <Button className="w-full bg-orange-600 hover:bg-orange-700">View Recipe</Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <Heart className="w-16 h-16 text-orange-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-orange-900 mb-2">No favorites yet</h2>
            <p className="text-orange-700 mb-6">Start adding recipes to your favorites to see them here</p>
            <Link href="/search">
              <Button className="bg-orange-600 hover:bg-orange-700">Browse Recipes</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
