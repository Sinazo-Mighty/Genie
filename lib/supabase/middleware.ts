import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If Supabase is not configured, just pass through the request
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("[Middleware] Supabase environment variables not configured")
    return NextResponse.next({
      request,
    })
  }

  try {
    let supabaseResponse = NextResponse.next({
      request,
    })

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    })

    // Refresh session
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Redirect to login if not authenticated and trying to access protected routes
    if (
      !user &&
      !request.nextUrl.pathname.startsWith("/login") &&
      !request.nextUrl.pathname.startsWith("/signup") &&
      !request.nextUrl.pathname.startsWith("/verify-email") &&
      request.nextUrl.pathname !== "/"
    ) {
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  } catch (error) {
    console.error("[Middleware] Error updating session:", error)
    return NextResponse.next({
      request,
    })
  }
}
