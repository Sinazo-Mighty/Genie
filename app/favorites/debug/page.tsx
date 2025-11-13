"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { CheckCircle2, XCircle, Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function FavoritesDebugPage() {
  const [loading, setLoading] = useState(true)
  const [results, setResults] = useState<any>({})

  useEffect(() => {
    runDiagnostics()
  }, [])

  const runDiagnostics = async () => {
    setLoading(true)
    const diagnostics: any = {}

    // Check 1: User Authentication
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      diagnostics.auth = {
        success: !!user,
        userId: user?.id || null,
        email: user?.email || null,
      }
    } catch (error) {
      diagnostics.auth = { success: false, error: String(error) }
    }

    // Check 2: Database Connection
    try {
      const response = await fetch("/api/favorites")
      const data = await response.json()

      diagnostics.dbConnection = {
        success: response.ok,
        status: response.status,
        favorites: data.favorites || [],
        count: data.favorites?.length || 0,
      }
    } catch (error) {
      diagnostics.dbConnection = { success: false, error: String(error) }
    }

    // Check 3: LocalStorage
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const localFavorites = localStorage.getItem(`genie_favorites_${user.id}`)
        diagnostics.localStorage = {
          success: true,
          exists: !!localFavorites,
          value: localFavorites ? JSON.parse(localFavorites) : [],
        }
      } else {
        diagnostics.localStorage = { success: false, error: "No user logged in" }
      }
    } catch (error) {
      diagnostics.localStorage = { success: false, error: String(error) }
    }

    // Check 4: Test adding a favorite
    diagnostics.testAdd = { success: false, message: "Not tested" }

    setResults(diagnostics)
    setLoading(false)
  }

  const testAddFavorite = async () => {
    try {
      const testRecipe = {
        id: "test-" + Date.now(),
        name: "Test Recipe",
        category: "Test",
        area: "Test",
        instructions: "Test instructions",
        thumbnail: "/placeholder.svg",
        ingredients: [{ name: "Test", measure: "1" }],
        tags: ["test"],
        cookTime: "30 min",
        difficulty: "Easy",
      }

      const response = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipeId: testRecipe.id,
          recipeName: testRecipe.name,
          recipeData: testRecipe,
        }),
      })

      const data = await response.json()

      const newResults = { ...results }
      newResults.testAdd = {
        success: response.ok,
        status: response.status,
        response: data,
      }
      setResults(newResults)
    } catch (error) {
      const newResults = { ...results }
      newResults.testAdd = {
        success: false,
        error: String(error),
      }
      setResults(newResults)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/favorites">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-orange-900">Favorites Debug Tool</h1>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <Loader2 className="w-12 h-12 text-orange-600 mx-auto mb-4 animate-spin" />
            <p className="text-orange-700">Running diagnostics...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Authentication Check */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {results.auth?.success ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  Authentication Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Status:</strong> {results.auth?.success ? "Logged In" : "Not Logged In"}
                  </p>
                  {results.auth?.userId && (
                    <>
                      <p>
                        <strong>User ID:</strong> {results.auth.userId}
                      </p>
                      <p>
                        <strong>Email:</strong> {results.auth.email}
                      </p>
                    </>
                  )}
                  {results.auth?.error && (
                    <p className="text-red-600">
                      <strong>Error:</strong> {results.auth.error}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Database Connection Check */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {results.dbConnection?.success ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  Database Connection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Status:</strong> {results.dbConnection?.success ? "Connected" : "Failed"}
                  </p>
                  <p>
                    <strong>HTTP Status:</strong> {results.dbConnection?.status}
                  </p>
                  <p>
                    <strong>Favorites Count:</strong> {results.dbConnection?.count || 0}
                  </p>
                  {results.dbConnection?.favorites && results.dbConnection.favorites.length > 0 && (
                    <div>
                      <strong>Favorites in Database:</strong>
                      <pre className="bg-orange-50 p-2 rounded mt-2 overflow-auto">
                        {JSON.stringify(results.dbConnection.favorites, null, 2)}
                      </pre>
                    </div>
                  )}
                  {results.dbConnection?.error && (
                    <p className="text-red-600">
                      <strong>Error:</strong> {results.dbConnection.error}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* LocalStorage Check */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {results.localStorage?.success ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  LocalStorage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Exists:</strong> {results.localStorage?.exists ? "Yes" : "No"}
                  </p>
                  {results.localStorage?.value && (
                    <div>
                      <strong>Stored Favorites:</strong>
                      <pre className="bg-orange-50 p-2 rounded mt-2 overflow-auto">
                        {JSON.stringify(results.localStorage.value, null, 2)}
                      </pre>
                    </div>
                  )}
                  {results.localStorage?.error && (
                    <p className="text-red-600">
                      <strong>Error:</strong> {results.localStorage.error}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Test Add Favorite */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {results.testAdd?.success ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  Test Add Favorite
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button onClick={testAddFavorite} className="bg-orange-600 hover:bg-orange-700">
                    Run Test
                  </Button>
                  {results.testAdd?.response && (
                    <div className="text-sm">
                      <strong>Result:</strong>
                      <pre className="bg-orange-50 p-2 rounded mt-2 overflow-auto">
                        {JSON.stringify(results.testAdd.response, null, 2)}
                      </pre>
                    </div>
                  )}
                  {results.testAdd?.error && (
                    <p className="text-red-600 text-sm">
                      <strong>Error:</strong> {results.testAdd.error}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                onClick={runDiagnostics}
                variant="outline"
                className="border-orange-600 text-orange-600 bg-transparent"
              >
                Re-run Diagnostics
              </Button>
              <Link href="/favorites">
                <Button className="bg-orange-600 hover:bg-orange-700">Back to Favorites</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
