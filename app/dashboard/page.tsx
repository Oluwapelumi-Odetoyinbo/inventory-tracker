"use client"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Navbar } from "@/components/layout/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { api } from "@/lib/api"
import { DollarSign, TrendingUp, TrendingDown, RefreshCw } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { OrdersTable } from "@/components/orders/orders-table"
import { InvoicesTable } from "@/components/invoices/invoices-table"

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
  const [invoiceRefreshTrigger, setInvoiceRefreshTrigger] = useState(0)

  useEffect(() => {
    fetchMonthlyData()
  }, [])

  const fetchMonthlyData = async () => {
    setIsLoading(true)
    setError("")
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

  const handleInvoiceGenerated = () => {
    // Trigger refresh of invoices table
    setInvoiceRefreshTrigger((prev) => prev + 1)
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
      <div className="container mx-auto p-4 sm:p-6 space-y-6">
        <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Monthly profit analysis for {monthlyData?.month} {monthlyData?.year}
            </p>
          </div>
          <Button onClick={fetchMonthlyData} variant="outline" size="sm" className="self-start sm:self-auto">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        )}

        {/* Monthly Statistics Cards */}
        {monthlyData && (
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-green-600 break-words">
                  {formatCurrency(monthlyData.totalRevenue)}
                </div>
                <p className="text-xs text-muted-foreground">Total sales for this month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-red-600 break-words">
                  {formatCurrency(monthlyData.totalCost)}
                </div>
                <p className="text-xs text-muted-foreground">Total expenses for this month</p>
              </CardContent>
            </Card>

            <Card className="sm:col-span-2 lg:col-span-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div
                  className={`text-xl sm:text-2xl font-bold break-words ${monthlyData.totalProfit >= 0 ? "text-green-600" : "text-red-600"}`}
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
              <CardTitle className="text-lg sm:text-xl">No Data Available</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                No sales data found for the current month. Start by adding inventory and recording orders.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                <p>To see profit analysis:</p>
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>Add inventory items from the "Add Inventory" page</li>
                  <li>Record sales/orders from the "Record Order" page</li>
                  <li>Return to this dashboard to view your profit analysis</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Orders Table with Invoice Generation */}
        <OrdersTable onInvoiceGenerated={handleInvoiceGenerated} />

        {/* Invoices Table */}
        <InvoicesTable refreshTrigger={invoiceRefreshTrigger} />
      </div>
    </ProtectedRoute>
  )
}
