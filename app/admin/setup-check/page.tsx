"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react"
import Link from "next/link"

interface CheckResult {
  name: string
  status: "success" | "error" | "checking"
  message: string
}

export default function SetupCheckPage() {
  const [checks, setChecks] = useState<CheckResult[]>([
    { name: "Database Connection", status: "checking", message: "Checking..." },
    { name: "Profiles Table", status: "checking", message: "Checking..." },
    { name: "Recipe Searches Table", status: "checking", message: "Checking..." },
    { name: "Favorites Table", status: "checking", message: "Checking..." },
    { name: "Recipe Views Table", status: "checking", message: "Checking..." },
    { name: "User Profiles", status: "checking", message: "Checking..." },
  ])

  useEffect(() => {
    runChecks()
  }, [])

  const runChecks = async () => {
    try {
      const response = await fetch("/api/admin/setup-check")
      const data = await response.json()

      setChecks([
        {
          name: "Database Connection",
          status: data.connection ? "success" : "error",
          message: data.connection ? "Connected successfully" : "Failed to connect",
        },
        {
          name: "Profiles Table",
          status: data.tables.profiles ? "success" : "error",
          message: data.tables.profiles
            ? `Table exists with ${data.counts.profiles} records`
            : "Table does not exist - run SQL script",
        },
        {
          name: "Recipe Searches Table",
          status: data.tables.recipe_searches ? "success" : "error",
          message: data.tables.recipe_searches
            ? `Table exists with ${data.counts.recipe_searches} records`
            : "Table does not exist - run SQL script",
        },
        {
          name: "Favorites Table",
          status: data.tables.favorites ? "success" : "error",
          message: data.tables.favorites
            ? `Table exists with ${data.counts.favorites} records`
            : "Table does not exist - run SQL script",
        },
        {
          name: "Recipe Views Table",
          status: data.tables.recipe_views ? "success" : "error",
          message: data.tables.recipe_views
            ? `Table exists with ${data.counts.recipe_views} records`
            : "Table does not exist - run SQL script",
        },
        {
          name: "User Profiles",
          status: data.profilesMatch ? "success" : "error",
          message: data.profilesMatch
            ? "All users have profiles"
            : `${data.counts.auth_users} users but only ${data.counts.profiles} profiles - run profile sync`,
        },
      ])
    } catch (error) {
      console.error("Setup check failed:", error)
      setChecks((prev) =>
        prev.map((check) => ({
          ...check,
          status: "error",
          message: "Failed to run check",
        })),
      )
    }
  }

  const allPassed = checks.every((check) => check.status === "success")

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <Link href="/admin" className="text-orange-600 hover:text-orange-700">
            ← Back to Admin Dashboard
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-orange-600" />
              Database Setup Check
            </CardTitle>
            <CardDescription>
              This page checks if your database is properly configured for the admin dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {checks.map((check) => (
              <div key={check.name} className="flex items-start gap-3 rounded-lg border p-4">
                {check.status === "checking" && <Loader2 className="mt-0.5 h-5 w-5 animate-spin text-gray-400" />}
                {check.status === "success" && <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-600" />}
                {check.status === "error" && <XCircle className="mt-0.5 h-5 w-5 text-red-600" />}
                <div className="flex-1">
                  <h3 className="font-semibold">{check.name}</h3>
                  <p className="text-sm text-gray-600">{check.message}</p>
                </div>
              </div>
            ))}

            <div className="mt-6 flex gap-4">
              <Button onClick={runChecks} variant="outline">
                Run Checks Again
              </Button>
              {allPassed && (
                <Link href="/admin">
                  <Button>Go to Dashboard</Button>
                </Link>
              )}
            </div>

            {!allPassed && (
              <div className="mt-6 rounded-lg bg-orange-50 p-4">
                <h3 className="mb-2 font-semibold text-orange-900">Next Steps:</h3>
                <ol className="list-inside list-decimal space-y-2 text-sm text-orange-800">
                  <li>Open your Supabase dashboard at supabase.com</li>
                  <li>Go to SQL Editor and click "New Query"</li>
                  <li>Copy the SQL from scripts/01-create-tables.sql and run it</li>
                  <li>Create another new query and run scripts/02-enable-rls.sql</li>
                  <li>If you have existing users, run the profile sync query from DATABASE_SETUP_GUIDE.md</li>
                  <li>Come back here and click "Run Checks Again"</li>
                </ol>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
