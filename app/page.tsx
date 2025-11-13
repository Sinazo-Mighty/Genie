"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { mockRecipes } from "@/lib/mock-data"
import { ChefHat, Search, Camera, Heart, Clock, TrendingUp, LogOut, User, Shield } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"

export const dynamic = "force-dynamic"

export default function HomePage() {
  const router = useRouter()
  const [favorites, setFavorites] = useState<string[]>([])
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userEmail, setUserEmail] = useState("")
  const [isAdmin, setIsAdmin] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const featuredRecipes = mockRecipes.slice(0, 6)
  const ADMIN_EMAILS = ["ngobenimohau4@gmail.com", "tmashabela100@gmail.com", "masekosnazo@gmail.com"]

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      if (!supabase) {
        console.error("[v0] Supabase client not available")
        return
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        setIsLoggedIn(true)
        setUserEmail(user.email || "")
        setUserId(user.id)

        if (user.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) {
          setIsAdmin(true)
        }

        const { data: dbFavorites } = await supabase.from("favorites").select("recipe_id").eq("user_id", user.id)

        const favoriteIds = dbFavorites?.map((fav) => fav.recipe_id) || []
        setFavorites(favoriteIds)

        localStorage.setItem(`genie_favorites_${user.id}`, JSON.stringify(favoriteIds))
      } else {
        setIsLoggedIn(false)
        setUserEmail("")
        setIsAdmin(false)
        setUserId(null)
      }
    }

    checkAuth()

    const supabase = createClient()
    if (!supabase) {
      console.error("[v0] Supabase client not available for auth listener")
      return
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setIsLoggedIn(true)
        setUserEmail(session.user.email || "")
        setUserId(session.user.id)
        if (session.user.email && ADMIN_EMAILS.includes(session.user.email.toLowerCase())) {
          setIsAdmin(true)
        }
      } else {
        setIsLoggedIn(false)
        setUserEmail("")
        setIsAdmin(false)
        setUserId(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    if (!supabase) {
      console.error("[v0] Supabase client not available for logout")
      return
    }

    await supabase.auth.signOut()
    setIsLoggedIn(false)
    setUserEmail("")
    router.refresh()
  }

  const toggleFavorite = async (recipeId: string) => {
    if (!userId) {
      alert("Please sign in to save favorites")
      return
    }

    const isFavorite = favorites.includes(recipeId)
    console.log("[v0] Toggle favorite:", recipeId, "Current state:", isFavorite)

    setFavorites((prev) => {
      const newFavorites = prev.includes(recipeId) ? prev.filter((fav) => fav !== recipeId) : [...prev, recipeId]

      localStorage.setItem(`genie_favorites_${userId}`, JSON.stringify(newFavorites))
      return newFavorites
    })

    try {
      if (isFavorite) {
        const response = await fetch("/api/favorites", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipeId }),
        })
        console.log("[v0] Delete favorite response:", response.ok)
      } else {
        const recipe = featuredRecipes.find((r) => r.id === recipeId)
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
          console.log("[v0] Add favorite response:", result)

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
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-orange-100 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <ChefHat className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                <span className="text-xl font-bold text-orange-900 dark:text-orange-100">Genie</span>
              </Link>
              {isAdmin && (
                <Link href="/admin">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:text-purple-400 dark:hover:text-purple-300 dark:hover:bg-purple-900"
                  >
                    <Shield className="w-4 h-4" />
                    Admin
                  </Button>
                </Link>
              )}
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Link href="/search">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Search className="w-4 h-4" />
                  Search
                </Button>
              </Link>
              <Link href="/camera">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Camera className="w-4 h-4" />
                  Camera
                </Button>
              </Link>
              <Link href="/favorites">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Heart className="w-4 h-4" />
                  Favorites
                </Button>
              </Link>
              {isLoggedIn ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-1 bg-orange-50 dark:bg-orange-900 rounded-full">
                    <User className="w-4 h-4 text-orange-600 dark:text-orange-300" />
                    <span className="text-sm text-orange-900 dark:text-orange-100">{userEmail}</span>
                  </div>
                  <Button variant="ghost" size="sm" className="gap-2" onClick={handleLogout}>
                    <LogOut className="w-4 h-4" />
                    Logout
                  </Button>
                </div>
              ) : (
                <Link href="/login">
                  <Button
                    size="sm"
                    className="bg-orange-600 hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-600"
                  >
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl sm:text-6xl font-bold text-orange-900 dark:text-orange-100 mb-6 text-balance">
            Discover Delicious Recipes
          </h1>
          <p className="text-xl text-orange-700 dark:text-orange-300 mb-8 max-w-2xl mx-auto text-pretty">
            Scan ingredients with your camera, get AI-powered recipe suggestions, and cook with voice-guided
            instructions
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/camera">
              <Button
                size="lg"
                className="gap-2 bg-orange-600 hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-600"
              >
                <Camera className="w-5 h-5" />
                Scan Ingredients
              </Button>
            </Link>
            <Link href="/search">
              <Button
                size="lg"
                variant="outline"
                className="gap-2 border-orange-600 text-orange-600 hover:bg-orange-50 bg-transparent dark:border-orange-400 dark:text-orange-400 dark:hover:bg-orange-900"
              >
                <Search className="w-5 h-5" />
                Browse Recipes
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Recipes */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-orange-900 dark:text-orange-100 mb-2">Featured Recipes</h2>
              <p className="text-orange-700 dark:text-orange-300">Popular dishes to try today</p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredRecipes.map((recipe) => (
              <Card
                key={recipe.id}
                className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-orange-100 dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="relative h-48 overflow-hidden bg-orange-100 dark:bg-gray-700">
                  <img
                    src={recipe.thumbnail || "/placeholder.svg"}
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
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg text-orange-900 dark:text-orange-100">{recipe.name}</h3>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge
                      variant="secondary"
                      className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"
                    >
                      {recipe.category}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-orange-600 dark:text-orange-400">
                      <Clock className="w-4 h-4" />
                      {recipe.cookTime}
                    </div>
                  </div>
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
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-orange-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-orange-900 dark:text-orange-100 mb-12">
            Powerful Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-600 dark:bg-orange-700 text-white mb-4">
                <Camera className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold text-orange-900 dark:text-orange-100 mb-2">
                AI Ingredient Scanning
              </h3>
              <p className="text-orange-700 dark:text-orange-300">
                Take a photo of your ingredients and get instant recipe suggestions powered by AI
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-600 dark:bg-orange-700 text-white mb-4">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold text-orange-900 dark:text-orange-100 mb-2">Smart Search</h3>
              <p className="text-orange-700 dark:text-orange-300">
                Find recipes by category, ingredients, or dietary preferences
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-600 dark:bg-orange-700 text-white mb-4">
                <ChefHat className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold text-orange-900 dark:text-orange-100 mb-2">Voice Guidance</h3>
              <p className="text-orange-700 dark:text-orange-300">
                Follow along with step-by-step voice instructions while cooking
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
