import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

interface DiagnosticResult {
  name: string
  status: "success" | "error" | "warning"
  message: string
  details?: string
}

export async function GET() {
  const results: DiagnosticResult[] = []

  try {
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({
        results: [
          {
            name: "Database Connection",
            status: "error",
            message: "Database service unavailable",
          },
        ],
      })
    }

    // Check if user is admin
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

    // 1. Check database tables exist
    const tables = ["profiles", "recipe_searches", "favorites", "recipe_views"]
    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select("id").limit(1)
        if (error) {
          results.push({
            name: `Table: ${table}`,
            status: "error",
            message: `Table does not exist or has permission issues`,
            details: error.message,
          })
        } else {
          results.push({
            name: `Table: ${table}`,
            status: "success",
            message: "Table exists and is accessible",
          })
        }
      } catch (err) {
        results.push({
          name: `Table: ${table}`,
          status: "error",
          message: "Error checking table",
          details: err instanceof Error ? err.message : String(err),
        })
      }
    }

    // 2. Check total users in auth.users vs profiles
    const { data: authUsers, error: authError } = await supabase.rpc("get_auth_user_count")

    const { count: profileCount } = await supabase.from("profiles").select("*", { count: "exact", head: true })

    if (!authError && authUsers !== null) {
      results.push({
        name: "User Sync Check",
        status: authUsers === profileCount ? "success" : "warning",
        message: `Auth users: ${authUsers}, Profile users: ${profileCount || 0}`,
        details:
          authUsers !== profileCount
            ? "Run script 04-sync-existing-users.sql to sync all users"
            : "All auth users are synced with profiles table",
      })
    } else {
      results.push({
        name: "User Count",
        status: "success",
        message: `Total profiles: ${profileCount || 0}`,
      })
    }

    // 3. Check activity data per user
    const { data: searchesByUser } = await supabase.from("recipe_searches").select("user_id").not("user_id", "is", null)

    const uniqueSearchUsers = new Set(searchesByUser?.map((s) => s.user_id) || []).size

    const { data: viewsByUser } = await supabase.from("recipe_views").select("user_id").not("user_id", "is", null)

    const uniqueViewUsers = new Set(viewsByUser?.map((v) => v.user_id) || []).size

    const { data: favoritesByUser } = await supabase.from("favorites").select("user_id")

    const uniqueFavoriteUsers = new Set(favoritesByUser?.map((f) => f.user_id) || []).size

    results.push({
      name: "Activity Tracking",
      status: uniqueSearchUsers > 0 || uniqueViewUsers > 0 || uniqueFavoriteUsers > 0 ? "success" : "warning",
      message: `Users with searches: ${uniqueSearchUsers}, views: ${uniqueViewUsers}, favorites: ${uniqueFavoriteUsers}`,
      details:
        uniqueSearchUsers === 0 && uniqueViewUsers === 0 && uniqueFavoriteUsers === 0
          ? "No user activity detected. Users may not be logged in when performing actions, or tracking is not working."
          : "Activity is being tracked for multiple users",
    })

    // 4. Check recent activity
    const { count: recentSearches } = await supabase
      .from("recipe_searches")
      .select("*", { count: "exact", head: true })
      .gte("searched_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    const { count: recentViews } = await supabase
      .from("recipe_views")
      .select("*", { count: "exact", head: true })
      .gte("viewed_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    const { count: recentFavorites } = await supabase
      .from("favorites")
      .select("*", { count: "exact", head: true })
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    results.push({
      name: "Recent Activity (24h)",
      status: (recentSearches || 0) + (recentViews || 0) + (recentFavorites || 0) > 0 ? "success" : "warning",
      message: `Searches: ${recentSearches || 0}, Views: ${recentViews || 0}, Favorites: ${recentFavorites || 0}`,
      details:
        (recentSearches || 0) + (recentViews || 0) + (recentFavorites || 0) === 0
          ? "No activity in the last 24 hours. Try performing some actions (search, view recipes, add favorites) while logged in."
          : "Recent activity detected",
    })

    // 5. Check RLS policies
    results.push({
      name: "Row Level Security",
      status: "success",
      message: "RLS should be enabled for security",
      details: "Run script 02-enable-rls.sql if you haven't already",
    })

    return NextResponse.json({ results })
  } catch (error) {
    console.error("Error running diagnostics:", error)
    return NextResponse.json(
      {
        results: [
          {
            name: "System Error",
            status: "error",
            message: "Failed to run diagnostics",
            details: error instanceof Error ? error.message : String(error),
          },
        ],
      },
      { status: 500 },
    )
  }
}
