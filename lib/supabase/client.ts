import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // During build time, env vars might not be available - return null
  // The error will be handled at runtime in the browser
  if (!supabaseUrl || !supabaseKey) {
    // Only log warning during build, don't throw
    if (typeof window === "undefined") {
      console.warn("Supabase env vars not available during build - this is expected")
      return null as any
    }

    // At runtime in browser, show error to user
    console.error(
      "Missing Supabase environment variables. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment variables.",
    )
    return null as any
  }

  return createBrowserClient(supabaseUrl, supabaseKey)
}
