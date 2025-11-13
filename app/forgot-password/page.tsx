"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChefHat, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react"
import { getEmailValidationError } from "@/lib/email-validation"
import { createClient } from "@/lib/supabase/client"
import { Alert, AlertDescription } from "@/components/ui/alert"

export const dynamic = "force-dynamic"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [emailError, setEmailError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleEmailBlur = () => {
    const error = getEmailValidationError(email)
    setEmailError(error)
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    const emailValidationError = getEmailValidationError(email)
    setEmailError(emailValidationError)

    if (emailValidationError) {
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()
      if (!supabase) {
        setError("Authentication service is not available. Please try again later.")
        setIsLoading(false)
        return
      }

      const redirectUrl =
        process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/reset-password`

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      })

      if (error) {
        console.error("[v0] Password reset error:", error)
        setError(error.message)
        setIsLoading(false)
        return
      }

      setSuccess(true)
    } catch (error) {
      console.error("[v0] Unexpected error:", error)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-orange-100">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-600 text-white">
              <ChefHat className="w-8 h-8" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-orange-900">Reset Your Password</CardTitle>
          <CardDescription className="text-orange-700">
            Enter your email and we'll send you a link to reset your password
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-900">
                  Password reset link sent! Check your email inbox (and spam folder) for instructions to reset your
                  password.
                </AlertDescription>
              </Alert>
              <Link href="/login">
                <Button className="w-full bg-orange-600 hover:bg-orange-700">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-900">{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-orange-900">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (emailError) setEmailError(null)
                    if (error) setError(null)
                  }}
                  onBlur={handleEmailBlur}
                  required
                  className={`border-orange-200 focus:border-orange-600 ${emailError ? "border-red-500" : ""}`}
                />
                {emailError && <p className="text-sm text-red-600">{emailError}</p>}
              </div>
              <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={isLoading}>
                {isLoading ? "Sending..." : "Send Reset Link"}
              </Button>
              <Link href="/login">
                <Button variant="ghost" className="w-full text-orange-600 hover:text-orange-700">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Sign In
                </Button>
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
