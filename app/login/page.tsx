"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChefHat, AlertCircle } from "lucide-react"
import { getEmailValidationError } from "@/lib/email-validation"
import { createClient } from "@/lib/supabase/client"
import { Alert, AlertDescription } from "@/components/ui/alert"

export const dynamic = "force-dynamic"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [emailError, setEmailError] = useState<string | null>(null)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleEmailBlur = () => {
    const error = getEmailValidationError(email)
    setEmailError(error)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError(null)

    const emailValidationError = getEmailValidationError(email)
    setEmailError(emailValidationError)

    if (emailValidationError || !password) {
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()
      if (!supabase) {
        setLoginError("Authentication service is not available. Please try again later.")
        setIsLoading(false)
        return
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        // Handle specific error cases
        if (error.message.includes("Email not confirmed")) {
          setLoginError("Please verify your email before signing in. Check your inbox for the verification link.")
        } else if (error.message.includes("Invalid login credentials")) {
          setLoginError("Invalid email or password. Please try again.")
        } else {
          setLoginError(error.message)
        }
        setIsLoading(false)
        return
      }

      // Check if email is verified
      if (data.user && !data.user.email_confirmed_at) {
        setLoginError("Please verify your email before signing in. Check your inbox for the verification link.")
        setIsLoading(false)
        return
      }

      // Successfully logged in
      router.push("/")
      router.refresh()
    } catch (error) {
      setLoginError("An unexpected error occurred. Please try again.")
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
          <CardTitle className="text-2xl font-bold text-orange-900">Welcome to Genie</CardTitle>
          <CardDescription className="text-orange-700">Sign in to access your recipes and favorites</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-900">{loginError}</AlertDescription>
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
                  if (loginError) setLoginError(null)
                }}
                onBlur={handleEmailBlur}
                required
                className={`border-orange-200 focus:border-orange-600 ${emailError ? "border-red-500" : ""}`}
              />
              {emailError && <p className="text-sm text-red-600">{emailError}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-orange-900">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (loginError) setLoginError(null)
                }}
                required
                className="border-orange-200 focus:border-orange-600"
              />
            </div>
            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-sm text-orange-600 hover:text-orange-700 font-medium">
                Forgot password?
              </Link>
            </div>
            <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={isLoading}>
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm">
            <span className="text-orange-700">Don't have an account? </span>
            <Link href="/signup" className="text-orange-600 hover:text-orange-700 font-semibold">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
