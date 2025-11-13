"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search, CheckCircle2, AlertCircle } from "lucide-react"
import { getEmailValidationError, getPasswordValidationError } from "@/lib/email-validation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"

export const dynamic = "force-dynamic"

export default function SignupPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [allergens, setAllergens] = useState("")
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null)
  const [nameError, setNameError] = useState<string | null>(null)
  const [isVerificationSent, setIsVerificationSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [signupError, setSignupError] = useState<string | null>(null)

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Only allow letters, spaces, hyphens, and apostrophes
    if (value === "" || /^[a-zA-Z\s'-]+$/.test(value)) {
      setName(value)
      setNameError(null)
    } else {
      setNameError("Full name can only contain letters")
    }
  }

  const handleEmailBlur = () => {
    const error = getEmailValidationError(email)
    setEmailError(error)
  }

  const handlePasswordBlur = () => {
    const error = getPasswordValidationError(password)
    setPasswordError(error)
  }

  const handleConfirmPasswordBlur = () => {
    if (confirmPassword && confirmPassword !== password) {
      setConfirmPasswordError("Passwords do not match")
    } else {
      setConfirmPasswordError(null)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setSignupError(null)

    const emailValidationError = getEmailValidationError(email)
    const passwordValidationError = getPasswordValidationError(password)

    setEmailError(emailValidationError)
    setPasswordError(passwordValidationError)

    if (!name.trim()) {
      setNameError("Full name is required")
      return
    }

    if (confirmPassword !== password) {
      setConfirmPasswordError("Passwords do not match")
      return
    }

    if (emailValidationError || passwordValidationError || !name) {
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()
      if (!supabase) {
        setSignupError("Authentication service is not available. Please try again later.")
        setIsLoading(false)
        return
      }

      const redirectUrl = typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : ""

      console.log("[v0] Signup attempt with redirect URL:", redirectUrl)
      console.log("[v0] Current origin:", typeof window !== "undefined" ? window.location.origin : "server-side")

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: name,
            allergens: allergens || null,
          },
        },
      })

      console.log("[v0] Signup response:", { data, error })

      if (error) {
        console.error("[v0] Signup error:", error)
        setSignupError(error.message)
        setIsLoading(false)
        return
      }

      if (data.user) {
        console.log("[v0] User created:", {
          id: data.user.id,
          email: data.user.email,
          confirmed_at: data.user.confirmed_at,
          email_confirmed_at: data.user.email_confirmed_at,
        })

        // Check if email confirmation is required
        if (!data.user.email_confirmed_at) {
          console.log("[v0] Email verification required - showing verification screen")
          setIsVerificationSent(true)
        } else {
          console.log("[v0] Email already confirmed - redirecting to login")
          window.location.href = "/login"
        }
      }
    } catch (error) {
      console.error("[v0] Unexpected signup error:", error)
      setSignupError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendVerification = async () => {
    try {
      const supabase = createClient()
      if (!supabase) {
        alert("Authentication service is not available. Please try again later.")
        return
      }

      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        alert(`Error: ${error.message}`)
      } else {
        alert("Verification email resent! Please check your inbox.")
      }
    } catch (error) {
      alert("Failed to resend verification email. Please try again.")
    }
  }

  if (isVerificationSent) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-orange-100 dark:border-gray-700">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-600 text-white">
                <CheckCircle2 className="w-8 h-8" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-orange-900 dark:text-orange-100">Verify Your Email</CardTitle>
            <CardDescription className="text-orange-700 dark:text-orange-300">
              We've sent a verification link to <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
              <AlertDescription className="text-orange-900 dark:text-orange-100">
                Please check your email and click the verification link to complete your registration. Don't forget to
                check your spam folder!
              </AlertDescription>
            </Alert>
            <div className="text-center text-sm text-orange-700 dark:text-orange-300">
              <p>Didn't receive the email?</p>
              <Button
                variant="link"
                className="text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 font-semibold p-0"
                onClick={handleResendVerification}
              >
                Resend verification email
              </Button>
            </div>
            <div className="text-center text-sm">
              <Link
                href="/login"
                className="text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 font-semibold"
              >
                Back to sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFF8F0] dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-none shadow-none bg-transparent">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#FF5722]">
              <Search className="w-10 h-10 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-[#5D4037] dark:text-orange-100">Join Genie</CardTitle>
          <CardDescription className="text-[#FF5722] dark:text-orange-300 text-base">
            Create an account to start discovering recipes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            {signupError && (
              <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-900 dark:text-red-100">{signupError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[#5D4037] dark:text-orange-100 font-medium">
                Full Name
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={handleNameChange}
                required
                className="border-2 border-[#FF5722] focus:border-[#FF5722] focus-visible:ring-[#FF5722] dark:bg-gray-800 dark:text-white rounded-lg h-12"
              />
              {nameError && <p className="text-sm text-red-600 dark:text-red-400">{nameError}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#5D4037] dark:text-orange-100 font-medium">
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
                }}
                onBlur={handleEmailBlur}
                required
                className={`border-2 border-[#FF5722] focus:border-[#FF5722] focus-visible:ring-[#FF5722] dark:bg-gray-800 dark:text-white rounded-lg h-12 ${emailError ? "border-red-500" : ""}`}
              />
              {emailError && <p className="text-sm text-red-600 dark:text-red-400">{emailError}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#5D4037] dark:text-orange-100 font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (passwordError) setPasswordError(null)
                }}
                onBlur={handlePasswordBlur}
                required
                className={`border-2 border-[#FF5722] focus:border-[#FF5722] focus-visible:ring-[#FF5722] dark:bg-gray-800 dark:text-white rounded-lg h-12 ${passwordError ? "border-red-500" : ""}`}
              />
              <p className="text-sm text-[#FF5722] dark:text-orange-300">
                Min 8 chars with uppercase, lowercase, and numbers
              </p>
              {passwordError && <p className="text-sm text-red-600 dark:text-red-400">{passwordError}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-[#5D4037] dark:text-orange-100 font-medium">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  if (confirmPasswordError) setConfirmPasswordError(null)
                }}
                onBlur={handleConfirmPasswordBlur}
                required
                className={`border-2 border-[#FF5722] focus:border-[#FF5722] focus-visible:ring-[#FF5722] dark:bg-gray-800 dark:text-white rounded-lg h-12 ${confirmPasswordError ? "border-red-500" : ""}`}
              />
              {confirmPasswordError && <p className="text-sm text-red-600 dark:text-red-400">{confirmPasswordError}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="allergens" className="text-[#5D4037] dark:text-orange-100 font-medium">
                Allergens (optional)
              </Label>
              <Input
                id="allergens"
                type="text"
                placeholder="e.g., peanuts, dairy, gluten"
                value={allergens}
                onChange={(e) => setAllergens(e.target.value)}
                className="border-2 border-[#FF5722] focus:border-[#FF5722] focus-visible:ring-[#FF5722] dark:bg-gray-800 dark:text-white rounded-lg h-12"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-[#FF5722] hover:bg-[#E64A19] text-white h-12 text-base font-semibold rounded-lg"
              disabled={isLoading}
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>
          <div className="mt-6 text-center text-base">
            <span className="text-[#5D4037] dark:text-orange-200">Already have an account? </span>
            <Link
              href="/login"
              className="text-[#FF5722] hover:text-[#E64A19] dark:text-orange-400 dark:hover:text-orange-300 font-semibold"
            >
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
