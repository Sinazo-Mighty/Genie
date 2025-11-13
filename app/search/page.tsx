"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { categories } from "@/lib/mock-data"
import { Search, Heart, Clock, ChefHat, ArrowLeft } from "lucide-react"
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

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [favorites, setFavorites] = useState<string[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const loadUserFavorites = async () => {
      const supabase = createClient()
      if (!supabase) return

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        setUserId(user.id)

        const { data: dbFavorites } = await supabase.from("favorites").select("recipe_id").eq("user_id", user.id)

        const favoriteIds = dbFavorites?.map((fav) => fav.recipe_id) || []
        setFavorites(favoriteIds)

        localStorage.setItem(`genie_favorites_${user.id}`, JSON.stringify(favoriteIds))
      }
    }

    loadUserFavorites()
  }, [])

  useEffect(() => {
    const fetchRecipes = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (searchQuery) {
          params.append("q", searchQuery)
        }
        if (selectedCategory !== "All") {
          params.append("category", selectedCategory)
        }

        const response = await fetch(`/api/search-recipes?${params}`)
        const data = await response.json()
        setRecipes(data)

        if (searchQuery || selectedCategory !== "All") {
          fetch("/api/track-search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              searchQuery: searchQuery || `Category: ${selectedCategory}`,
              resultsCount: data.length,
            }),
          }).catch((err) => console.error("Failed to track search:", err))
        }
      } catch (error) {
        console.error("Error fetching recipes:", error)
        setRecipes([])
      } finally {
        setLoading(false)
      }
    }

    const timer = setTimeout(() => {
      fetchRecipes()
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery, selectedCategory])

  const toggleFavorite = async (recipeId: string) => {
    if (!userId) {
      alert("Please sign in to save favorites")
      return
    }

    const isFavorite = favorites.includes(recipeId)
    let newFavorites: string[]

    if (isFavorite) {
      newFavorites = favorites.filter((fav) => fav !== recipeId)
      console.log("[v0] Removing from favorites:", recipeId)
    } else {
      newFavorites = [...favorites, recipeId]
      console.log("[v0] Adding to favorites:", recipeId)
    }

    setFavorites(newFavorites)
    localStorage.setItem(`genie_favorites_${userId}`, JSON.stringify(newFavorites))

    try {
      if (isFavorite) {
        const response = await fetch("/api/favorites", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipeId }),
        })
        console.log("[v0] Delete response:", response.ok)
      } else {
        const recipe = recipes.find((r) => r.id === recipeId)
        if (recipe) {
          const response = await fetch("/api/favorites", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              recipeId: recipe.id,
              recipeName: recipe.name,
              recipeData: recipe, // Pass object directly
            }),
          })

          const result = await response.json()
          console.log("[v0] Add response:", result)

          if (response.ok) {
            console.log("[v0] Successfully added favorite to database")
          } else {
            console.error("[v0] Failed to add favorite:", result)
          }
        }
      }
    } catch (error) {
      console.error("[v0] Error saving favorite to database:", error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <ChefHat className="w-6 h-6 text-orange-600" />
              <h1 className="text-2xl font-bold text-orange-900">Search Recipes</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-400" />
            <Input
              type="text"
              placeholder="Search recipes or ingredients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 border-orange-200 focus:border-orange-400"
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
                className={
                  selectedCategory === category
                    ? "bg-orange-600 hover:bg-orange-700"
                    : "border-orange-200 text-orange-700 hover:bg-orange-50"
                }
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="mb-4">
          <p className="text-orange-700">
            {loading ? "Searching..." : `Found ${recipes.length} recipe${recipes.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        {/* Recipe Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe) => (
            <Card
              key={recipe.id}
              className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-orange-100"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={recipe.thumbnail || "/placeholder.svg?height=200&width=300"}
                  alt={recipe.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute top-3 right-3 rounded-full"
                  onClick={() => toggleFavorite(recipe.id)}
                >
                  <Heart className={`w-4 h-4 ${favorites.includes(recipe.id) ? "fill-red-500 text-red-500" : ""}`} />
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

        {recipes.length === 0 && !loading && (
          <div className="text-center py-16">
            <p className="text-xl text-orange-700">No recipes found. Try a different search!</p>
          </div>
        )}
      </div>
    </div>
  )
}
