"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function ApiTest() {
  const [testResult, setTestResult] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)

  const testConnection = async () => {
    setIsLoading(true)
    setTestResult("")

    try {
      const token = localStorage.getItem("token")
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

      console.log("Testing API connection...")
      console.log("API URL:", apiUrl)
      console.log("Token exists:", !!token)

      // Test basic connectivity
      const response = await fetch(`${apiUrl}/api/inventory`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })

      console.log("Response status:", response.status)
      console.log("Response headers:", Object.fromEntries(response.headers.entries()))

      const data = await response.text()
      console.log("Response body:", data)

      setTestResult(`
Status: ${response.status} ${response.statusText}
Headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2)}
Body: ${data}
      `)
    } catch (error) {
      console.error("Connection test failed:", error)
      setTestResult(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testInventoryPost = async () => {
    setIsLoading(true)
    setTestResult("")

    try {
      const token = localStorage.getItem("token")
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

      const testData = {
        name: "Test Item",
        quantity: 10,
        unit: "kg",
        totalAmount: 100,
        shippingFee: 5,
      }

      console.log("Testing POST /api/inventory...")
      console.log("Data:", testData)

      const response = await fetch(`${apiUrl}/api/inventory`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(testData),
      })

      console.log("Response status:", response.status)

      const responseText = await response.text()
      console.log("Response body:", responseText)

      let responseData
      try {
        responseData = JSON.parse(responseText)
      } catch {
        responseData = responseText
      }

      setTestResult(`
Status: ${response.status} ${response.statusText}
Response: ${JSON.stringify(responseData, null, 2)}
      `)
    } catch (error) {
      console.error("POST test failed:", error)
      setTestResult(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }

  if (process.env.NODE_ENV !== "development") {
    return null
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>API Debug Tools (Development Only)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={testConnection} disabled={isLoading} variant="outline">
            Test GET /api/inventory
          </Button>
          <Button onClick={testInventoryPost} disabled={isLoading} variant="outline">
            Test POST /api/inventory
          </Button>
        </div>

        {testResult && (
          <Alert>
            <AlertDescription>
              <pre className="text-xs whitespace-pre-wrap overflow-auto max-h-96">{testResult}</pre>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
