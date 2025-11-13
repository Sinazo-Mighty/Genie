import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: "Database service unavailable" }, { status: 503 })
    }

    // Check if user is authenticated and is admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const ADMIN_EMAILS = ["ngobenimohau4@gmail.com"]

    if (!user.email || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    // Fetch total users
    const { count: totalUsers } = await supabase.from("profiles").select("*", { count: "exact", head: true })

    // Fetch total searches
    const { count: totalSearches } = await supabase.from("recipe_searches").select("*", { count: "exact", head: true })

    // Fetch total favorites
    const { count: totalFavorites } = await supabase.from("favorites").select("*", { count: "exact", head: true })

    // Fetch total views
    const { count: totalViews } = await supabase.from("recipe_views").select("*", { count: "exact", head: true })

    // Fetch recent searches with counts
    const { data: searchData } = await supabase
      .from("recipe_searches")
      .select("search_query")
      .order("searched_at", { ascending: false })
      .limit(100)

    const searchCounts = searchData?.reduce(
      (acc, item) => {
        acc[item.search_query] = (acc[item.search_query] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const recentSearches = Object.entries(searchCounts || {})
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Fetch popular recipes
    const { data: viewData } = await supabase
      .from("recipe_views")
      .select("recipe_id, recipe_name")
      .order("viewed_at", { ascending: false })
      .limit(100)

    const recipeCounts = viewData?.reduce(
      (acc, item) => {
        if (!acc[item.recipe_id]) {
          acc[item.recipe_id] = { name: item.recipe_name || "Unknown Recipe", views: 0 }
        }
        acc[item.recipe_id].views++
        return acc
      },
      {} as Record<string, { name: string; views: number }>,
    )

    const popularRecipes = Object.values(recipeCounts || {})
      .sort((a, b) => b.views - a.views)
      .slice(0, 10)

    // Fetch user growth (last 7 days)
    const { data: growthData } = await supabase
      .from("profiles")
      .select("created_at")
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order("created_at", { ascending: false })

    const growthByDate = growthData?.reduce(
      (acc, item) => {
        const date = new Date(item.created_at).toLocaleDateString()
        acc[date] = (acc[date] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const userGrowth = Object.entries(growthByDate || {})
      .map(([date, count]) => ({ date, count }))
      .slice(0, 7)

    // Fetch recent activity
    const recentActivity = []

    // Add recent searches
    const { data: recentSearchData } = await supabase
      .from("recipe_searches")
      .select("search_query, searched_at")
      .order("searched_at", { ascending: false })
      .limit(5)

    recentSearchData?.forEach((search) => {
      recentActivity.push({
        type: "search",
        description: `User searched for "${search.search_query}"`,
        timestamp: new Date(search.searched_at).toLocaleString(),
      })
    })

    // Add recent favorites
    const { data: recentFavData } = await supabase
      .from("favorites")
      .select("recipe_name, created_at")
      .order("created_at", { ascending: false })
      .limit(5)

    recentFavData?.forEach((fav) => {
      recentActivity.push({
        type: "favorite",
        description: `User favorited "${fav.recipe_name}"`,
        timestamp: new Date(fav.created_at).toLocaleString(),
      })
    })

    // Sort by timestamp
    recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      totalSearches: totalSearches || 0,
      totalFavorites: totalFavorites || 0,
      totalViews: totalViews || 0,
      recentSearches,
      popularRecipes,
      userGrowth,
      recentActivity: recentActivity.slice(0, 10),
    })
  } catch (error) {
    console.error("Error fetching admin stats:", error)
    return NextResponse.json({ error: "Failed to fetch statistics" }, { status: 500 })
  }
}
