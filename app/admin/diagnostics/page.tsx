"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, XCircle, AlertCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface DiagnosticResult {
  name: string
  status: "success" | "error" | "warning"
  message: string
  details?: string
}

export default function AdminDiagnosticsPage() {
  const [results, setResults] = useState<DiagnosticResult[]>([])
  const [loading, setLoading] = useState(false)

  const runDiagnostics = async () => {
    setLoading(true)
    setResults([])

    try {
      const response = await fetch("/api/admin/diagnostics")
      const data = await response.json()

      if (response.ok) {
        setResults(data.results)
      } else {
        setResults([
          {
            name: "Diagnostics Failed",
            status: "error",
            message: data.error || "Failed to run diagnostics",
          },
        ])
      }
    } catch (error) {
      setResults([
        {
          name: "Connection Error",
          status: "error",
          message: "Failed to connect to diagnostics API",
          details: error instanceof Error ? error.message : String(error),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-600" />
      case "warning":
        return <AlertCircle className="h-5 w-5 text-orange-600" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "border-green-200 bg-green-50"
      case "error":
        return "border-red-200 bg-red-50"
      case "warning":
        return "border-orange-200 bg-orange-50"
      default:
        return ""
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 p-8">
      <div className="mx-auto max-w-4xl">
        <Link href="/admin" className="mb-6 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" />
          Back to Admin Dashboard
        </Link>

        <Card className="border-orange-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <AlertCircle className="h-6 w-6" />
              System Diagnostics
            </CardTitle>
            <CardDescription className="text-orange-50">
              Check database tables, user authentication, and activity tracking
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Alert className="mb-6 border-blue-200 bg-blue-50">
              <AlertTitle>About Diagnostics</AlertTitle>
              <AlertDescription>
                This tool checks if your database tables exist, if users are properly authenticated, and if activity
                tracking is working correctly across all users.
              </AlertDescription>
            </Alert>

            <Button
              onClick={runDiagnostics}
              disabled={loading}
              className="mb-6 w-full bg-orange-600 hover:bg-orange-700"
            >
              {loading ? "Running Diagnostics..." : "Run Diagnostics"}
            </Button>

            {results.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Results:</h3>
                {results.map((result, index) => (
                  <Card key={index} className={`border ${getStatusColor(result.status)}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {getStatusIcon(result.status)}
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{result.name}</h4>
                          <p className="text-sm text-gray-700">{result.message}</p>
                          {result.details && (
                            <pre className="mt-2 overflow-x-auto rounded bg-white p-2 text-xs text-gray-600">
                              {result.details}
                            </pre>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
