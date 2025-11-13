import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({
        connection: false,
        tables: {},
        counts: {},
        profilesMatch: false,
      })
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

    const result = {
      connection: true,
      tables: {
        profiles: false,
        recipe_searches: false,
        favorites: false,
        recipe_views: false,
      },
      counts: {
        profiles: 0,
        recipe_searches: 0,
        favorites: 0,
        recipe_views: 0,
        auth_users: 0,
      },
      profilesMatch: false,
    }

    // Check each table
    const { count: profilesCount, error: profilesError } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })

    if (!profilesError) {
      result.tables.profiles = true
      result.counts.profiles = profilesCount || 0
    }

    const { count: searchesCount, error: searchesError } = await supabase
      .from("recipe_searches")
      .select("*", { count: "exact", head: true })

    if (!searchesError) {
      result.tables.recipe_searches = true
      result.counts.recipe_searches = searchesCount || 0
    }

    const { count: favoritesCount, error: favoritesError } = await supabase
      .from("favorites")
      .select("*", { count: "exact", head: true })

    if (!favoritesError) {
      result.tables.favorites = true
      result.counts.favorites = favoritesCount || 0
    }

    const { count: viewsCount, error: viewsError } = await supabase
      .from("recipe_views")
      .select("*", { count: "exact", head: true })

    if (!viewsError) {
      result.tables.recipe_views = true
      result.counts.recipe_views = viewsCount || 0
    }

    // Count auth users using admin API
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers()

    if (!authError && authData) {
      result.counts.auth_users = authData.users.length
      result.profilesMatch = result.counts.auth_users === result.counts.profiles
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Setup check error:", error)
    return NextResponse.json({
      connection: false,
      tables: {},
      counts: {},
      profilesMatch: false,
      error: String(error),
    })
  }
}
