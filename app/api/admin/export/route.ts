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

    const ADMIN_EMAILS = ["ngobenimohau4@gmail.com", "tmashabela100@gmail.com", "masekosnazo@gmail.com"]

    if (!user.email || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    // Fetch all data for the report
    const { data: users } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })

    const { data: searches } = await supabase
      .from("recipe_searches")
      .select("*")
      .order("searched_at", { ascending: false })

    const { data: favorites } = await supabase.from("favorites").select("*").order("created_at", { ascending: false })

    const { data: views } = await supabase.from("recipe_views").select("*").order("viewed_at", { ascending: false })

    // Create CSV content
    let csv = "Genie Admin Report\n"
    csv += `Generated: ${new Date().toLocaleString()}\n\n`

    // Users section
    csv += "=== USERS ===\n"
    csv += "ID,Email,Full Name,Created At\n"
    users?.forEach((user) => {
      csv += `"${user.id}","${user.email || ""}","${user.full_name || ""}","${new Date(user.created_at).toLocaleString()}"\n`
    })

    csv += "\n=== RECIPE SEARCHES ===\n"
    csv += "ID,User ID,Search Query,Searched At\n"
    searches?.forEach((search) => {
      csv += `"${search.id}","${search.user_id || ""}","${search.search_query}","${new Date(search.searched_at).toLocaleString()}"\n`
    })

    csv += "\n=== FAVORITES ===\n"
    csv += "ID,User ID,Recipe ID,Recipe Name,Created At\n"
    favorites?.forEach((fav) => {
      csv += `"${fav.id}","${fav.user_id}","${fav.recipe_id}","${fav.recipe_name || ""}","${new Date(fav.created_at).toLocaleString()}"\n`
    })

    csv += "\n=== RECIPE VIEWS ===\n"
    csv += "ID,User ID,Recipe ID,Recipe Name,Viewed At\n"
    views?.forEach((view) => {
      csv += `"${view.id}","${view.user_id || ""}","${view.recipe_id}","${view.recipe_name || ""}","${new Date(view.viewed_at).toLocaleString()}"\n`
    })

    // Return CSV file
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="genie-admin-report-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error("Error generating report:", error)
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 })
  }
}
