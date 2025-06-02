"use client"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Navbar } from "@/components/layout/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { api } from "@/lib/api"
import { DollarSign, TrendingUp, TrendingDown } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface MonthlyData {
  totalRevenue: number
  totalCost: number
  totalProfit: number
  month: string
  year: number
}

export default function DashboardPage() {
  const [monthlyData, setMonthlyData] = useState<MonthlyData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchMonthlyData()
  }, [])

  const fetchMonthlyData = async () => {
    try {
      const response = await api.getMonthlyProfit()

      // This now matches your backend's actual response
      const raw = response.data

      console.log("Raw monthly data received:", raw)

      if (raw) {
        const month = new Date().toLocaleString("default", { month: "long" })
        const year = new Date().getFullYear()

        const processed = {
          totalRevenue: raw.totalRevenue,
          totalCost: raw.totalCost,
          totalProfit: raw.totalProfit,
          month,
          year,
        }

        console.log("Processed data:", processed)
        setMonthlyData(processed)
      } else {
        setMonthlyData(null)
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch monthly data")
    } finally {
      setIsLoading(false)
    }
  }



  const formatCurrency = (amount: number) => {
    if (typeof amount !== "number" || isNaN(amount)) return "₦0.00"
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      currencyDisplay: "symbol",
    }).format(amount)
  }

  if (isLoading) {
    return (
      <ProtectedRoute>
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <Navbar />
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Monthly profit analysis for {monthlyData?.month} {monthlyData?.year}
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        )}

        {monthlyData && (
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(monthlyData.totalRevenue)}</div>
                <p className="text-xs text-muted-foreground">Total sales for this month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{formatCurrency(monthlyData.totalCost)}</div>
                <p className="text-xs text-muted-foreground">Total expenses for this month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${monthlyData.totalProfit >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {formatCurrency(monthlyData.totalProfit)}
                </div>
                <p className="text-xs text-muted-foreground">Net profit for this month</p>
              </CardContent>
            </Card>
          </div>
        )}

        {!monthlyData && !error && (
          <Card>
            <CardHeader>
              <CardTitle>No Data Available</CardTitle>
              <CardDescription>
                No sales data found for the current month. Start by adding inventory and recording orders.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </ProtectedRoute>
  )
}
