import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: "Database service unavailable" }, { status: 503 })
    }

    const { recipeId, recipeName } = await request.json()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Track view even if user is not logged in (user_id will be null)
    const { error } = await supabase.from("recipe_views").insert({
      user_id: user?.id || null,
      recipe_id: recipeId,
      recipe_name: recipeName,
    })

    if (error) {
      console.error("Error tracking view:", error)
      return NextResponse.json({ error: "Failed to track view" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in track-view:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
