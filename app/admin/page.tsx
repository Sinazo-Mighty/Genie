"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Search, Heart, Eye, Activity, ArrowLeft, Loader2, BarChart3, Calendar, Download } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { ThemeToggle } from "@/components/theme-toggle"

interface DashboardStats {
  totalUsers: number
  totalSearches: number
  totalFavorites: number
  totalViews: number
  recentSearches: Array<{ query: string; count: number }>
  popularRecipes: Array<{ name: string; views: number }>
  userGrowth: Array<{ date: string; count: number }>
  recentActivity: Array<{ type: string; description: string; timestamp: string }>
}

export const dynamic = "force-dynamic"

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [hasError, setHasError] = useState(false)
  const router = useRouter()
  const ADMIN_EMAILS = ["ngobenimohau4@gmail.com", "tmashabela100@gmail.com", "masekosnazo@gmail.com"]

  useEffect(() => {
    checkAdminAccess()
  }, [])

  const checkAdminAccess = async () => {
    try {
      const supabase = createClient()
      if (!supabase) {
        console.error("[v0] Supabase client not available")
        setIsAdmin(false)
        setIsLoading(false)
        return
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      if (user.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) {
        setIsAdmin(true)
        await fetchDashboardStats()
      } else {
        setIsAdmin(false)
      }
    } catch (error) {
      console.error("Error checking admin access:", error)
      setIsAdmin(false)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch("/api/admin/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
        const allZero =
          data.totalUsers === 0 && data.totalSearches === 0 && data.totalFavorites === 0 && data.totalViews === 0
        setHasError(allZero)
      } else {
        setHasError(true)
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
      setHasError(true)
    }
  }

  const downloadReport = async () => {
    setIsDownloading(true)
    try {
      const response = await fetch("/api/admin/export")
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `genie-admin-report-${new Date().toISOString().split("T")[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        console.error("Failed to download report")
      }
    } catch (error) {
      console.error("Error downloading report:", error)
    } finally {
      setIsDownloading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-orange-600 mx-auto mb-4 animate-spin" />
          <p className="text-orange-700">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Access Denied</CardTitle>
            <CardDescription>You do not have permission to access the admin dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button className="w-full bg-orange-600 hover:bg-orange-700">Return to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
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
                <BarChart3 className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                <h1 className="text-2xl font-bold text-orange-900 dark:text-orange-100">Admin Dashboard</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Download Report button */}
              <Button
                onClick={downloadReport}
                disabled={isDownloading}
                className="bg-orange-600 hover:bg-orange-700"
                size="sm"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Download Report
                  </>
                )}
              </Button>
              <ThemeToggle />
              <Badge
                variant="secondary"
                className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"
              >
                Admin Access
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Warning Banner */}
        {hasError && (
          <Card className="mb-6 border-orange-300 bg-orange-50 dark:border-orange-700 dark:bg-orange-900/20">
            <CardHeader>
              <CardTitle className="text-orange-900 dark:text-orange-100 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Database Setup Required
              </CardTitle>
              <CardDescription className="dark:text-orange-300">
                Your admin dashboard is showing zero activity. This usually means the database tables haven't been
                created yet.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-orange-800 dark:text-orange-200">
                To start tracking user activity, you need to set up the database tables in your Supabase account.
              </p>
              <div className="flex gap-3">
                <Link href="/admin/diagnostics">
                  <Button className="bg-orange-600 hover:bg-orange-700">Run Diagnostics</Button>
                </Link>
                <Link href="/admin/setup-check">
                  <Button
                    variant="outline"
                    className="border-orange-300 text-orange-700 hover:bg-orange-100 bg-transparent"
                  >
                    Setup Check
                  </Button>
                </Link>
                <a href="/DATABASE_SETUP_GUIDE.md" download>
                  <Button
                    variant="outline"
                    className="border-orange-300 text-orange-700 hover:bg-orange-100 bg-transparent"
                  >
                    Download Setup Guide
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-orange-100 dark:border-gray-700 dark:bg-gray-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">Total Users</CardTitle>
              <Users className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">{stats?.totalUsers || 0}</div>
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">Registered accounts</p>
            </CardContent>
          </Card>

          <Card className="border-orange-100 dark:border-gray-700 dark:bg-gray-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">Total Searches</CardTitle>
              <Search className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">{stats?.totalSearches || 0}</div>
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">Recipe searches performed</p>
            </CardContent>
          </Card>

          <Card className="border-orange-100 dark:border-gray-700 dark:bg-gray-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">
                Total Favorites
              </CardTitle>
              <Heart className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                {stats?.totalFavorites || 0}
              </div>
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">Recipes favorited</p>
            </CardContent>
          </Card>

          <Card className="border-orange-100 dark:border-gray-700 dark:bg-gray-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">Total Views</CardTitle>
              <Eye className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">{stats?.totalViews || 0}</div>
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">Recipe page views</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <Tabs defaultValue="searches" className="space-y-6">
          <TabsList className="bg-orange-100 dark:bg-gray-800">
            <TabsTrigger value="searches">Popular Searches</TabsTrigger>
            <TabsTrigger value="recipes">Popular Recipes</TabsTrigger>
            <TabsTrigger value="growth">User Growth</TabsTrigger>
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="searches">
            <Card className="border-orange-100 dark:border-gray-700 dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="text-orange-900 dark:text-orange-100">Most Popular Searches</CardTitle>
                <CardDescription className="dark:text-gray-400">Top search queries from users</CardDescription>
              </CardHeader>
              <CardContent>
                {stats?.recentSearches && stats.recentSearches.length > 0 ? (
                  <div className="space-y-4">
                    {stats.recentSearches.map((search, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-orange-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Badge
                            variant="secondary"
                            className="bg-orange-200 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
                          >
                            #{index + 1}
                          </Badge>
                          <span className="font-medium text-orange-900 dark:text-orange-100">{search.query}</span>
                        </div>
                        <Badge className="bg-orange-600 dark:bg-orange-700">{search.count} searches</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-orange-600 dark:text-orange-400 text-center py-8">No search data available yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recipes">
            <Card className="border-orange-100 dark:border-gray-700 dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="text-orange-900 dark:text-orange-100">Most Viewed Recipes</CardTitle>
                <CardDescription className="dark:text-gray-400">Recipes with the most page views</CardDescription>
              </CardHeader>
              <CardContent>
                {stats?.popularRecipes && stats.popularRecipes.length > 0 ? (
                  <div className="space-y-4">
                    {stats.popularRecipes.map((recipe, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-orange-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Badge
                            variant="secondary"
                            className="bg-orange-200 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
                          >
                            #{index + 1}
                          </Badge>
                          <span className="font-medium text-orange-900 dark:text-orange-100">{recipe.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                          <Badge className="bg-orange-600 dark:bg-orange-700">{recipe.views} views</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-orange-600 dark:text-orange-400 text-center py-8">
                    No recipe view data available yet
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="growth">
            <Card className="border-orange-100 dark:border-gray-700 dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="text-orange-900 dark:text-orange-100">User Growth Over Time</CardTitle>
                <CardDescription className="dark:text-gray-400">New user registrations by date</CardDescription>
              </CardHeader>
              <CardContent>
                {stats?.userGrowth && stats.userGrowth.length > 0 ? (
                  <div className="space-y-4">
                    {stats.userGrowth.map((day, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-orange-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Calendar className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                          <span className="font-medium text-orange-900 dark:text-orange-100">{day.date}</span>
                        </div>
                        <Badge className="bg-orange-600 dark:bg-orange-700">{day.count} new users</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-orange-600 dark:text-orange-400 text-center py-8">
                    No user growth data available yet
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card className="border-orange-100 dark:border-gray-700 dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="text-orange-900 dark:text-orange-100">Recent Activity</CardTitle>
                <CardDescription className="dark:text-gray-400">
                  Latest user actions across the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {stats.recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-gray-700 rounded-lg">
                        <Activity className="w-4 h-4 text-orange-600 dark:text-orange-400 mt-1" />
                        <div className="flex-1">
                          <p className="font-medium text-orange-900 dark:text-orange-100">{activity.description}</p>
                          <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">{activity.timestamp}</p>
                        </div>
                        <Badge
                          variant="secondary"
                          className="bg-orange-200 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
                        >
                          {activity.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-orange-600 dark:text-orange-400 text-center py-8">
                    No recent activity data available yet
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
