"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Navbar } from "@/components/layout/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { api } from "@/lib/api"
import { Loader2, ShoppingCart, TrendingUp, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface InventoryItem {
  _id: string
  itemName: string
  quantity: number
  unit: string
  costPerUnit: number
}

export default function OrdersPage() {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [formData, setFormData] = useState({
    inventoryItemId: "",
    quantitySold: "",
    sellingPricePerUnit: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingInventory, setIsLoadingInventory] = useState(true)
  const [error, setError] = useState("")
  const [rawInventoryData, setRawInventoryData] = useState<any>(null) // For debugging
  const { toast } = useToast()

  useEffect(() => {
    fetchInventoryItems()
  }, [])

  const fetchInventoryItems = async () => {
    setIsLoadingInventory(true)
    setError("")
    try {
      console.log("Fetching inventory items...")
      const data = await api.getInventory()
      console.log("Raw inventory data received:", data)
      setRawInventoryData(data) // Store for debugging

      // Handle different possible response formats
      let processedItems: InventoryItem[] = []

      if (Array.isArray(data)) {
        // Data is already an array, but may not match InventoryItem type exactly
        processedItems = data.map((item: any) => ({
          _id: item._id,
          itemName: item.itemName || item.name,
          quantity: item.quantity,
          unit: item.unit,
          costPerUnit: item.costPerUnit || 0,
        }))
      } else if (data && typeof data === "object") {
        // Check if data has an items property or similar
        if (Array.isArray((data as any).items)) {
          processedItems = (data as any).items
        } else if (Array.isArray((data as any).data)) {
          processedItems = (data as any).data
        } else if (Array.isArray((data as any).inventory)) {
          processedItems = (data as any).inventory
        } else {
          // Single item wrapped in object
          processedItems = [data]
        }
      } else {
        // No valid data
        processedItems = []
      }

      // Validate and clean the data
      const validItems = processedItems
        .filter((item) => {
          return (
            item &&
            typeof item === "object" &&
            item._id &&
            (item.itemName || item.itemName) &&
            typeof item.quantity === "number" &&
            item.unit
          )
        })
        .map((item) => ({
          _id: item._id,
          itemName: item.itemName || item.itemName, // Handle both field names
          quantity: item.quantity,
          unit: item.unit,
          costPerUnit: item.costPerUnit || 0,
        }))

      console.log("Processed inventory items:", validItems)
      setInventoryItems(validItems)
    } catch (err: any) {
      console.error("Error fetching inventory:", err)
      setError(err.message || "Failed to fetch inventory items")
      setInventoryItems([]) // Ensure it's always an array
    } finally {
      setIsLoadingInventory(false)
    }
  }

  const handleInventorySelect = (itemId: string) => {
    const item = inventoryItems.find((i) => i._id === itemId)
    setSelectedItem(item || null)
    setFormData((prev) => ({ ...prev, inventoryItemId: itemId }))
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const calculateProfitSummary = () => {
    if (!selectedItem || !formData.quantitySold || !formData.sellingPricePerUnit) {
      return null
    }

    const quantitySold = Number.parseFloat(formData.quantitySold)
    const sellingPricePerUnit = Number.parseFloat(formData.sellingPricePerUnit)
    const costPerUnit = selectedItem.costPerUnit

    const totalSellingAmount = quantitySold * sellingPricePerUnit
    const profitPerUnit = sellingPricePerUnit - costPerUnit
    const totalProfit = quantitySold * profitPerUnit

    return {
      totalSellingAmount,
      profitPerUnit,
      totalProfit,
      costPerUnit,
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const data = {
        inventoryItemId: formData.inventoryItemId,
        quantitySold: Number.parseFloat(formData.quantitySold),
        sellingPricePerUnit: Number.parseFloat(formData.sellingPricePerUnit),
      }

      await api.createOrder(data)

      toast({
        title: "Success",
        description: "Order recorded successfully",
      })

      // Reset form
      setFormData({
        inventoryItemId: "",
        quantitySold: "",
        sellingPricePerUnit: "",
      })
      setSelectedItem(null)

      // Refresh inventory to update quantities
      fetchInventoryItems()
    } catch (err: any) {
      setError(err.message || "Failed to record order")
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    if (isNaN(amount)) return "₦0.00"
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      currencyDisplay: "symbol",
    }).format(amount)
  }

  const profitSummary = calculateProfitSummary()

  if (isLoadingInventory) {
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
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <ShoppingCart className="h-8 w-8" />
              Record Order
            </h1>
            <p className="text-muted-foreground">Record sales from your inventory and track profits</p>
          </div>
          <Button onClick={fetchInventoryItems} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Inventory
          </Button>
        </div>

        <div className="max-w-4xl">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Order Details</CardTitle>
                <CardDescription>Select an inventory item and enter sale details</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="inventory">Inventory Item</Label>
                    <Select value={formData.inventoryItemId} onValueChange={handleInventorySelect} disabled={isLoading}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select inventory item" />
                      </SelectTrigger>
                      <SelectContent>
                        {inventoryItems.length > 0 ? (
                          inventoryItems.map((item) => (
                            <SelectItem key={item._id} value={item._id}>
                              {item.itemName} ({item.quantity} {item.unit} available)
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-items" disabled>
                            No inventory items available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedItem && (
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-sm">
                        <div>
                          <strong>Cost per unit:</strong> {formatCurrency(selectedItem.costPerUnit)}
                        </div>
                        <div>
                          <strong>Available:</strong> {selectedItem.quantity} {selectedItem.unit}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="quantitySold">Quantity Sold</Label>
                    <Input
                      id="quantitySold"
                      type="number"
                      step="0.01"
                      value={formData.quantitySold}
                      onChange={(e) => handleInputChange("quantitySold", e.target.value)}
                      placeholder="0"
                      required
                      disabled={isLoading || !selectedItem}
                      max={selectedItem?.quantity}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sellingPrice">Selling Price per {selectedItem?.unit || "Unit"} (₦)</Label>
                    <Input
                      id="sellingPrice"
                      type="number"
                      step="0.01"
                      value={formData.sellingPricePerUnit}
                      onChange={(e) => handleInputChange("sellingPricePerUnit", e.target.value)}
                      placeholder="0.00"
                      required
                      disabled={isLoading || !selectedItem}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading || !selectedItem || !formData.quantitySold || !formData.sellingPricePerUnit}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Record Order
                  </Button>
                </form>
              </CardContent>
            </Card>

            {profitSummary && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Profit Summary
                  </CardTitle>
                  <CardDescription>Calculated profit for this order</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Cost per unit:</div>
                      <div className="font-medium">{formatCurrency(profitSummary.costPerUnit)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Selling price per unit:</div>
                      <div className="font-medium">
                        {formatCurrency(Number.parseFloat(formData.sellingPricePerUnit))}
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-3">
                    <div className="flex justify-between">
                      <span>Total Selling Amount:</span>
                      <span className="font-medium text-green-600">
                        {formatCurrency(profitSummary.totalSellingAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Profit per Unit:</span>
                      <span
                        className={`font-medium ${
                          profitSummary.profitPerUnit >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {formatCurrency(profitSummary.profitPerUnit)}
                      </span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total Profit:</span>
                      <span className={profitSummary.totalProfit >= 0 ? "text-green-600" : "text-red-600"}>
                        {formatCurrency(profitSummary.totalProfit)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {inventoryItems.length === 0 && !isLoadingInventory && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>No Inventory Items</CardTitle>
                <CardDescription>You need to add inventory items before you can record orders.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  <p>To record orders:</p>
                  <ol className="list-decimal list-inside mt-2 space-y-1">
                    <li>Go to the "Add Inventory" page</li>
                    <li>Add some inventory items</li>
                    <li>Return to this page to record sales</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
