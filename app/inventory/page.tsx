"use client"

import type React from "react"

import { useState } from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Navbar } from "@/components/layout/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { api } from "@/lib/api"
import { Loader2, Package } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const UNITS = [
  { value: "kg", label: "Kilogram (kg)" },
  { value: "litre", label: "Litre" },
  { value: "ml", label: "Millilitre (ml)" },
  { value: "packs", label: "Packs" },
  { value: "bottles", label: "Bottles" },
  { value: "cartons", label: "Cartons" },
]

export default function InventoryPage() {
  const [formData, setFormData] = useState({
    itemName: "",
    quantity: "",
    unit: "",
    totalAmount: "",
    shippingFee: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const { toast } = useToast()

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const calculateCostPerUnit = () => {
    const quantity = Number.parseFloat(formData.quantity)
    const totalAmount = Number.parseFloat(formData.totalAmount)
    const shippingFee = Number.parseFloat(formData.shippingFee) || 0

    if (quantity > 0 && totalAmount >= 0) {
      return ((totalAmount + shippingFee) / quantity).toFixed(2)
    }
    return "0.00"
  }

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === "string" ? Number.parseFloat(amount) : amount
    if (isNaN(num)) return "₦0.00"
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      currencyDisplay: "symbol",
    }).format(num)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const data = {
        itemName: formData.itemName,
        quantity: Number.parseFloat(formData.quantity),
        unit: formData.unit,
        totalAmount: Number.parseFloat(formData.totalAmount),
        shippingFee: Number.parseFloat(formData.shippingFee) || 0,
      }

      await api.addInventory(data)

      toast({
        title: "Success",
        description: "Inventory item added successfully",
      })

      // Reset form
      setFormData({
        itemName: "",
        quantity: "",
        unit: "",
        totalAmount: "",
        shippingFee: "",
      })
    } catch (err: any) {
      setError(err.message || "Failed to add inventory item")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <Navbar />
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="h-8 w-8" />
            Add Inventory
          </h1>
          <p className="text-muted-foreground">Record new inventory purchases and track costs</p>
        </div>

        <div className="max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>New Inventory Item</CardTitle>
              <CardDescription>Enter the details of your inventory purchase</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="name">Item Name</Label>
                  <Input
                    id="itemName"
                    value={formData.itemName}
                    onChange={(e) => handleInputChange("itemName", e.target.value)}
                    placeholder="e.g., Premium Rice"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      step="0.01"
                      value={formData.quantity}
                      onChange={(e) => handleInputChange("quantity", e.target.value)}
                      placeholder="0"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit</Label>
                    <Select
                      value={formData.unit}
                      onValueChange={(value) => handleInputChange("unit", value)}
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {UNITS.map((unit) => (
                          <SelectItem key={unit.value} value={unit.value}>
                            {unit.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="totalAmount">Total Amount (₦)</Label>
                    <Input
                      id="totalAmount"
                      type="number"
                      step="0.01"
                      value={formData.totalAmount}
                      onChange={(e) => handleInputChange("totalAmount", e.target.value)}
                      placeholder="0.00"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shippingFee">Shipping Fee (₦)</Label>
                    <Input
                      id="shippingFee"
                      type="number"
                      step="0.01"
                      value={formData.shippingFee}
                      onChange={(e) => handleInputChange("shippingFee", e.target.value)}
                      placeholder="0.00"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {formData.quantity && formData.totalAmount && (
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-sm font-medium">Calculated Cost Per Unit:</div>
                    <div className="text-2xl font-bold text-primary">
                       {formatCurrency(calculateCostPerUnit())} per {formData.unit || "unit"}
                    </div>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Inventory Item
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}
