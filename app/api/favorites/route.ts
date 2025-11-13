import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: "Database service unavailable" }, { status: 503 })
    }

    const { recipeId, recipeName, recipeData } = await request.json()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] Adding favorite - User:", user.id, "Recipe:", recipeId, "Name:", recipeName)

    // Check if favorite already exists
    const { data: existing } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("recipe_id", recipeId)
      .single()

    if (existing) {
      console.log("[v0] Favorite already exists")
      return NextResponse.json({ message: "Already favorited" })
    }

    const recipeObject = typeof recipeData === "string" ? JSON.parse(recipeData) : recipeData

    // Insert new favorite
    const { data: inserted, error } = await supabase
      .from("favorites")
      .insert({
        user_id: user.id,
        recipe_id: recipeId,
        recipe_name: recipeName,
        recipe_data: recipeObject,
      })
      .select()

    if (error) {
      console.error("[v0] Error adding favorite:", error)
      return NextResponse.json({ error: "Failed to add favorite", details: error.message }, { status: 500 })
    }

    console.log("[v0] Successfully added favorite to database:", inserted)
    return NextResponse.json({ success: true, data: inserted })
  } catch (error) {
    console.error("[v0] Error in favorites POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: "Database service unavailable" }, { status: 503 })
    }

    const { recipeId } = await request.json()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { error } = await supabase.from("favorites").delete().eq("user_id", user.id).eq("recipe_id", recipeId)

    if (error) {
      console.error("[v0] Error removing favorite:", error)
      return NextResponse.json({ error: "Failed to remove favorite" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in favorites DELETE:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: "Database service unavailable" }, { status: 503 })
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] Fetching favorites for user:", user.id)

    const { data: favorites, error } = await supabase
      .from("favorites")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching favorites:", error)
      return NextResponse.json({ error: "Failed to fetch favorites" }, { status: 500 })
    }

    console.log("[v0] Found favorites:", favorites?.length || 0)
    return NextResponse.json({ success: true, favorites })
  } catch (error) {
    console.error("[v0] Error in favorites GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
