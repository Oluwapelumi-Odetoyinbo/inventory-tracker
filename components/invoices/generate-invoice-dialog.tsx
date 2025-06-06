"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface GenerateInvoiceDialogProps {
  orderId: string
  orderDetails?: {
    itemName: string
    quantity: number
    totalAmount: number
  }
  onInvoiceGenerated: () => void
}

export function GenerateInvoiceDialog({ orderId, orderDetails, onInvoiceGenerated }: GenerateInvoiceDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [clientData, setClientData] = useState({
    name: "",
    email: "",
  })
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      // Validate form data
      if (!clientData.name.trim()) {
        throw new Error("Client name is required")
      }

      if (!clientData.email.trim()) {
        throw new Error("Client email is required")
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(clientData.email)) {
        throw new Error("Please enter a valid email address")
      }

      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("Authentication token not found")
      }

      console.log("Generating invoice for order:", orderId, "with client:", clientData)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/invoices/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId,
          client: {
            name: clientData.name.trim(),
            email: clientData.email.trim(),
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      console.log("Invoice generated successfully:", result)

      toast({
        title: "Success",
        description: "Invoice generated successfully",
      })

      // Reset form and close dialog
      setClientData({ name: "", email: "" })
      setOpen(false)
      onInvoiceGenerated()
    } catch (err: any) {
      console.error("Error generating invoice:", err)
      setError(err.message || "Failed to generate invoice")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setClientData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Generate Invoice
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Invoice</DialogTitle>
          <DialogDescription>Create an invoice for this order. Enter the client details below.</DialogDescription>
        </DialogHeader>

        {orderDetails && (
          <div className="p-3 bg-muted rounded-lg text-sm">
            <div className="font-medium mb-1">Order Details:</div>
            <div>Item: {orderDetails.itemName}</div>
            <div>Quantity: {orderDetails.quantity}</div>
            <div>Total: ₦{orderDetails.totalAmount.toLocaleString()}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="clientName" className="text-sm font-medium">
              Client Name *
            </Label>
            <Input
              id="clientName"
              value={clientData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter client name"
              required
              disabled={isLoading}
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientEmail" className="text-sm font-medium">
              Client Email *
            </Label>
            <Input
              id="clientEmail"
              type="email"
              value={clientData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="client@example.com"
              required
              disabled={isLoading}
              className="h-10"
            />
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Invoice
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
