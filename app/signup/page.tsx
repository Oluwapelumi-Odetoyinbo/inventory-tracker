"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, UserPlus } from "lucide-react"
import Link from "next/link"
import { api } from "@/lib/api"

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const { login } = useAuth()
  const router = useRouter()

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      throw new Error("Name is required")
    }

    if (!formData.email.trim()) {
      throw new Error("Email is required")
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      throw new Error("Please enter a valid email address")
    }

    if (!formData.password) {
      throw new Error("Password is required")
    }

    if (formData.password.length < 6) {
      throw new Error("Password must be at least 6 characters long")
    }

    if (formData.password !== formData.confirmPassword) {
      throw new Error("Passwords do not match")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      // Validate form
      validateForm()

      // Register user
      const response = await api.register(formData.name.trim(), formData.email.trim(), formData.password)

      // Auto-login after successful registration
      await login(formData.email.trim(), formData.password)

      router.push("/dashboard")
    } catch (err: any) {
      console.error("Registration error:", err)

      let errorMessage = "Registration failed"

      if (err.status === 400) {
        errorMessage = err.message || "Invalid registration data"
      } else if (err.status === 409) {
        errorMessage = "An account with this email already exists"
      } else if (err.status === 500) {
        errorMessage = "Server error. Please try again later."
      } else if (err.message) {
        errorMessage = err.message
      }

      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl sm:text-2xl flex items-center justify-center gap-2">
            <UserPlus className="h-6 w-6" />
            Create Account
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">Sign up to start managing your inventory</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Full Name
              </Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter your full name"
                required
                disabled={isLoading}
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="Enter your email"
                required
                disabled={isLoading}
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                placeholder="Create a password"
                required
                disabled={isLoading}
                className="h-10"
                minLength={6}
              />
              <p className="text-xs text-muted-foreground">Password must be at least 6 characters long</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                placeholder="Confirm your password"
                required
                disabled={isLoading}
                className="h-10"
              />
            </div>

            <Button type="submit" className="w-full h-10" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Account
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
