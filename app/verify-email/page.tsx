"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"
import Link from "next/link"

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")

  useEffect(() => {
    // Simulate email verification process
    const token = searchParams.get("token")

    if (!token) {
      setStatus("error")
      return
    }

    // Simulate API call to verify token
    setTimeout(() => {
      // In real app, this would verify the token with backend
      localStorage.removeItem("genie_pending_verification")
      localStorage.setItem("genie_email_verified", "true")
      setStatus("success")
    }, 1500)
  }, [searchParams])

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-orange-100">
          <CardContent className="pt-6 text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4 text-orange-600 animate-spin" />
            <p className="text-orange-900">Verifying your email...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-orange-100">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-600 text-white">
                <XCircle className="w-8 h-8" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-orange-900">Verification Failed</CardTitle>
            <CardDescription className="text-orange-700">
              The verification link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full bg-orange-600 hover:bg-orange-700" onClick={() => router.push("/signup")}>
              Back to Sign Up
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-orange-100">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-600 text-white">
              <CheckCircle2 className="w-8 h-8" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-orange-900">Email Verified!</CardTitle>
          <CardDescription className="text-orange-700">
            Your email has been successfully verified. You can now sign in to your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button className="w-full bg-orange-600 hover:bg-orange-700" onClick={() => router.push("/login")}>
            Continue to Sign In
          </Button>
          <div className="text-center text-sm">
            <Link href="/" className="text-orange-600 hover:text-orange-700 font-semibold">
              Go to Home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
