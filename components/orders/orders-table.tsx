"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ShoppingCart, RefreshCw } from "lucide-react"
import { GenerateInvoiceDialog } from "@/components/invoices/generate-invoice-dialog"

interface Order {
  _id: string
  inventoryItem: {
    itemName: string
    unit: string
  }
  quantitySold: number
  sellingPricePerUnit: number
  totalSellingAmount: number
  totalProfit: number
  createdAt: string
}

interface OrdersTableProps {
  onInvoiceGenerated: () => void
}

export function OrdersTable({ onInvoiceGenerated }: OrdersTableProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    setIsLoading(true)
    setError("")
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("Authentication token not found")
      }

      console.log("Fetching orders...")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log("Orders fetched:", data)

      // Handle different response formats
      let ordersList: Order[] = []
      if (Array.isArray(data)) {
        ordersList = data
      } else if (data.orders && Array.isArray(data.orders)) {
        ordersList = data.orders
      } else if (data.data && Array.isArray(data.data)) {
        ordersList = data.data
      }

      setOrders(ordersList)
    } catch (err: any) {
      console.error("Error fetching orders:", err)
      setError(err.message || "Failed to fetch orders")
      setOrders([])
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      currencyDisplay: "symbol",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Recent Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Recent Orders
            </CardTitle>
            <CardDescription>Your recent sales and orders</CardDescription>
          </div>
          <Button onClick={fetchOrders} variant="outline" size="sm" className="self-start sm:self-auto">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        )}

        {orders.length === 0 && !error ? (
          <div className="text-center py-8 text-muted-foreground">
            <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No orders found</p>
            <p className="text-sm">Record some orders to see them here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="hidden sm:table-cell">Quantity</TableHead>
                  <TableHead className="hidden md:table-cell">Unit Price</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="hidden lg:table-cell">Profit</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order._id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{order.inventoryItem.itemName}</div>
                        <div className="text-sm text-muted-foreground sm:hidden">
                          {order.quantitySold} {order.inventoryItem.unit}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {order.quantitySold} {order.inventoryItem.unit}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{formatCurrency(order.sellingPricePerUnit)}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(order.totalSellingAmount)}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className={order.totalProfit >= 0 ? "text-green-600" : "text-red-600"}>
                        {formatCurrency(order.totalProfit)}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{formatDate(order.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <GenerateInvoiceDialog
                        orderId={order._id}
                        orderDetails={{
                          itemName: order.inventoryItem.itemName,
                          quantity: order.quantitySold,
                          totalAmount: order.totalSellingAmount,
                        }}
                        onInvoiceGenerated={onInvoiceGenerated}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
