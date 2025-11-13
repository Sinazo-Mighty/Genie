import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: "Database service unavailable" }, { status: 503 })
    }

    const { searchQuery, resultsCount } = await request.json()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Track search even if user is not logged in (user_id will be null)
    const { error } = await supabase.from("recipe_searches").insert({
      user_id: user?.id || null,
      search_query: searchQuery,
      results_count: resultsCount,
    })

    if (error) {
      console.error("Error tracking search:", error)
      return NextResponse.json({ error: "Failed to track search" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in track-search:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
