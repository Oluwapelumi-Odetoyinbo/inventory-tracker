"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  CreditCard,
  FileText,
  User,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  Loader2,
  Package,
  AlertTriangle,
  Search,
  Database,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface InvoiceItem {
  name: string
  quantity: number
  unitPrice: number
  total: number
}

interface Invoice {
  _id: string
  invoiceNumber: string
  client: {
    name: string
    email: string
  }
  status: string
  issuedDate: string
  dueDate?: string
  items?: InvoiceItem[]
  subtotal?: number
  shippingCost?: number
  totalAmount: number
  orderId: string
  paymentLink?: string
}

// Extend Window interface for Paystack
declare global {
  interface Window {
    PaystackPop: {
      setup: (options: any) => {
        openIframe: () => void
      }
    }
  }
}

export default function PaymentPage() {
  const params = useParams()
  const router = useRouter()
  const invoiceNumber = params.invoiceNumber as string
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [error, setError] = useState("")
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [availableInvoices, setAvailableInvoices] = useState<string[]>([])
  const [paystackLoaded, setPaystackLoaded] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (invoiceNumber) {
      fetchInvoiceDetails()
    }
  }, [invoiceNumber])

  useEffect(() => {
    // Load Paystack script with proper error handling
    const loadPaystackScript = () => {
      // Check if Paystack is already loaded
      if (window.PaystackPop) {
        setPaystackLoaded(true)
        return
      }

      const script = document.createElement("script")
      script.src = "https://js.paystack.co/v1/inline.js"
      script.async = true

      script.onload = () => {
        console.log("Paystack script loaded successfully")
        setPaystackLoaded(true)
      }

      script.onerror = () => {
        console.error("Failed to load Paystack script")
        toast({
          title: "Payment Error",
          description: "Failed to load payment system. Please refresh the page.",
          variant: "destructive",
        })
      }

      document.body.appendChild(script)

      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script)
        }
      }
    }

    const cleanup = loadPaystackScript()
    return cleanup
  }, [toast])

  const testBackendConnection = async () => {
    setIsTestingConnection(true)
    try {
      // Test the correct API endpoint structure
      const possibleEndpoints = [
        `/api/invoices/${invoiceNumber}`, // Most likely correct based on your backend
        `/invoices/${invoiceNumber}`, // Alternative
        `/api/invoices/public/${invoiceNumber}`, // If you have public routes
      ]

      const testResults: any[] = []

      for (const endpoint of possibleEndpoints) {
        try {
          const url = `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`
          console.log(`Testing endpoint: ${url}`)

          const response = await fetch(url)
          const responseText = await response.text()

          testResults.push({
            endpoint,
            url,
            status: response.status,
            statusText: response.statusText,
            responseText: responseText.substring(0, 200) + (responseText.length > 200 ? "..." : ""),
            success: response.ok,
          })

          console.log(`Endpoint ${endpoint}: ${response.status} - ${response.statusText}`)
        } catch (err) {
          testResults.push({
            endpoint,
            url: `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`,
            error: err instanceof Error ? err.message : "Unknown error",
            success: false,
          })
        }
      }

      // Try to get all invoices to see what's available
      try {
        const allInvoicesUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/invoices`
        console.log(`Fetching all invoices: ${allInvoicesUrl}`)

        const allInvoicesResponse = await fetch(allInvoicesUrl)
        if (allInvoicesResponse.ok) {
          const allInvoicesData = await allInvoicesResponse.json()
          console.log("All invoices response:", allInvoicesData)

          // Extract invoice numbers
          let invoiceNumbers: string[] = []
          if (Array.isArray(allInvoicesData)) {
            invoiceNumbers = allInvoicesData.map((inv) => inv.invoiceNumber).filter(Boolean)
          } else if (allInvoicesData.invoices && Array.isArray(allInvoicesData.invoices)) {
            invoiceNumbers = allInvoicesData.invoices.map((inv) => inv.invoiceNumber).filter(Boolean)
          } else if (allInvoicesData.data && Array.isArray(allInvoicesData.data)) {
            invoiceNumbers = allInvoicesData.data.map((inv) => inv.invoiceNumber).filter(Boolean)
          }

          setAvailableInvoices(invoiceNumbers)
          console.log("Available invoice numbers:", invoiceNumbers)
        }
      } catch (allInvoicesError) {
        console.log("Failed to fetch all invoices:", allInvoicesError)
      }

      setDebugInfo((prev) => ({
        ...prev,
        endpointTests: testResults,
        testedAt: new Date().toISOString(),
      }))
    } catch (error) {
      console.error("Backend connection test failed:", error)
    } finally {
      setIsTestingConnection(false)
    }
  }

  const fetchInvoiceDetails = async () => {
    setIsLoading(true)
    setError("")
    setDebugInfo(null)

    try {
      console.log("Fetching invoice details for:", invoiceNumber)
      console.log("API Base URL:", process.env.NEXT_PUBLIC_API_URL)

      // Based on your backend configuration:
      // app.use('/api/invoices', invoiceRoutes) + router.get('/:invoiceNumber', ...)
      // The correct endpoint should be: /api/invoices/:invoiceNumber
      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/invoices/${invoiceNumber}`
      console.log(`Fetching from: ${url}`)

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      console.log("Response status:", response.status)
      console.log("Response headers:", Object.fromEntries(response.headers.entries()))

      // Get response text first to see raw response
      const responseText = await response.text()
      console.log("Raw response text:", responseText)

      if (!response.ok) {
        // Store debug information
        setDebugInfo({
          invoiceNumber,
          url,
          status: response.status,
          statusText: response.statusText,
          responseText,
          apiBaseUrl: process.env.NEXT_PUBLIC_API_URL,
          correctEndpoint: "/api/invoices/:invoiceNumber",
        })

        if (response.status === 404) {
          throw new Error(`Invoice "${invoiceNumber}" not found. Please check the invoice number and try again.`)
        }

        // Try to parse error response
        let errorData
        try {
          errorData = JSON.parse(responseText)
        } catch {
          errorData = { message: responseText }
        }

        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      // Parse the successful response
      let data
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        throw new Error("Invalid JSON response from server")
      }

      console.log("Parsed invoice data:", data)

      // Store debug information for successful request
      setDebugInfo({
        invoiceNumber,
        url,
        status: response.status,
        responseData: data,
        apiBaseUrl: process.env.NEXT_PUBLIC_API_URL,
        correctEndpoint: "/api/invoices/:invoiceNumber",
      })

      // Map your backend response to the frontend interface
      const invoiceData: Invoice = {
        _id: data._id,
        invoiceNumber: data.invoiceNumber,
        client: data.client,
        status: data.status, // This maps to paymentStatus from your backend
        issuedDate: data.issuedDate, // This maps to issuedAt from your backend
        totalAmount: data.totalAmount, // This maps to total from your backend
        orderId: data.orderId,
        paymentLink: data.paymentLink,
        // Optional fields that might not be in your backend response
        items: data.items || [],
        subtotal: data.subtotal || data.totalAmount,
        shippingCost: data.shippingCost || 0,
      }

      console.log("Mapped invoice data:", invoiceData)
      setInvoice(invoiceData)
    } catch (err: any) {
      console.error("Error fetching invoice:", err)
      setError(err.message || "Failed to fetch invoice details")
    } finally {
      setIsLoading(false)
    }
  }

  // Define payment success handler as a separate function to ensure it's properly bound
  const handlePayment = async () => {
    if (!invoice) {
      toast({
        title: "Error",
        description: "Invoice data not available",
        variant: "destructive",
      })
      return
    }

    if (!paystackLoaded || !window.PaystackPop) {
      toast({
        title: "Payment Error",
        description: "Payment system is not ready. Please refresh the page and try again.",
        variant: "destructive",
      })
      return
    }

    if (!process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY) {
      toast({
        title: "Configuration Error",
        description: "Payment system is not properly configured.",
        variant: "destructive",
      })
      return
    }

    setIsProcessingPayment(true)

    try {
      // Convert amount to kobo (Paystack uses kobo for NGN)
      const amountInKobo = Math.round(invoice.totalAmount * 100)

      // Generate a unique reference
      const paymentReference = `${invoice.invoiceNumber}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      console.log("Setting up Paystack with invoice:", invoice.invoiceNumber)

      // IMPORTANT: Define the callback and onClose as direct function expressions
      const paymentConfig = {
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
        email: invoice.client.email,
        amount: amountInKobo,
        currency: "NGN",
        ref: paymentReference,
        metadata: {
          invoiceId: invoice._id,
          invoiceNumber: invoice.invoiceNumber,
          clientName: invoice.client.name,
          custom_fields: [
            {
              display_name: "Invoice Number",
              variable_name: "invoice_number",
              value: invoice.invoiceNumber,
            },
            {
              display_name: "Client Name",
              variable_name: "client_name",
              value: invoice.client.name,
            },
          ],
        },
        // Define callback directly as a function expression
        callback: (response) => {
          console.log("Payment callback triggered with response:", response)

          if (!response || !response.reference) {
            console.error("Invalid payment response")
            return
          }

          // Process the successful payment
          const processPayment = async () => {
            try {
              console.log("Processing payment success:", response)

              const url = `${process.env.NEXT_PUBLIC_API_URL}/api/invoices/pay/${invoiceNumber}`
              console.log(`Updating payment status at: ${url}`)

              const updateResponse = await fetch(url, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  paymentReference: response.reference,
                  paymentData: response,
                  transactionId: response.trans || response.transaction,
                  status: response.status,
                }),
              })

              if (!updateResponse.ok) {
                const errorData = await updateResponse.json().catch(() => ({}))
                throw new Error(errorData.message || "Failed to update invoice status")
              }

              const result = await updateResponse.json()
              console.log("Invoice status updated:", result)

              // Use Next.js router for navigation instead of window.location.href
              const successUrl = `/payment-success?reference=${response.reference}&amount=${invoice.totalAmount}&invoice=${invoice.invoiceNumber}`
              console.log("Redirecting to:", successUrl)

              router.push(successUrl)
            } catch (err) {
              console.error("Error updating invoice status:", err)
              alert("Payment was successful, but there was an issue updating the invoice. Please contact support.")
            }
          }

          // Execute the async function
          processPayment()
        },
        // Define onClose directly as a function expression
        onClose: () => {
          console.log("Payment modal closed by user")
          setIsProcessingPayment(false)
          toast({
            title: "Payment Cancelled",
            description: "Payment was cancelled. You can try again anytime.",
            variant: "destructive",
          })
        },
      }

      console.log("Paystack configuration:", {
        ...paymentConfig,
        key: paymentConfig.key ? `${paymentConfig.key.substring(0, 10)}...` : "NOT_SET",
      })

      // Validate required fields
      if (!paymentConfig.key) {
        throw new Error("Paystack public key is not configured")
      }

      if (!paymentConfig.email) {
        throw new Error("Client email is required for payment")
      }

      if (!paymentConfig.amount || paymentConfig.amount <= 0) {
        throw new Error("Invalid payment amount")
      }

      console.log("Initializing Paystack payment...")

      // Initialize Paystack payment
      const handler = window.PaystackPop.setup(paymentConfig)

      if (!handler || typeof handler.openIframe !== "function") {
        throw new Error("Failed to initialize payment handler")
      }

      handler.openIframe()

      console.log("Paystack payment modal opened successfully")
    } catch (err: any) {
      console.error("Error initiating payment:", err)
      setIsProcessingPayment(false)

      toast({
        title: "Payment Error",
        description: err.message || "Failed to initiate payment. Please try again.",
        variant: "destructive",
      })
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
      month: "long",
      day: "numeric",
    })
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "default"
      case "pending":
        return "secondary"
      case "overdue":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "pending":
        return <XCircle className="h-4 w-4 text-yellow-600" />
      case "overdue":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <XCircle className="h-4 w-4 text-gray-600" />
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading invoice details...</p>
              
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl space-y-4">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-red-600">
                <XCircle className="h-6 w-6" />
                Invoice Not Found
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>

              <div className="flex gap-2 mt-4">
                <Button onClick={fetchInvoiceDetails} variant="outline" className="flex-1">
                  <Search className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button
                  onClick={testBackendConnection}
                  variant="outline"
                  disabled={isTestingConnection}
                  className="flex-1"
                >
                  {isTestingConnection ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Database className="h-4 w-4 mr-2" />
                  )}
                  Test Endpoints
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Available Invoices */}
          {availableInvoices.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Available Invoices in Database ({availableInvoices.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-2">
                  <p>
                    <strong>Found {availableInvoices.length} invoice(s):</strong>
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {availableInvoices.map((invNumber, index) => (
                      <div key={index} className="p-2 bg-gray-100 rounded text-xs font-mono">
                        <a href={`/pay/${invNumber}`} className="text-blue-600 hover:underline">
                          {invNumber}
                        </a>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Click on any invoice number above to test the payment page.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Invoice Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center">The requested invoice could not be found.</p>
            <p className="text-xs text-muted-foreground text-center mt-2">Invoice: {invoiceNumber}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl">
              <FileText className="h-6 w-6" />
              Invoice Payment
            </CardTitle>
            <CardDescription>Complete your payment for invoice {invoice.invoiceNumber}</CardDescription>
          </CardHeader>
        </Card>



        {/* Invoice Details */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Client & Invoice Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Invoice Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Invoice Number</p>
                  <p className="text-sm text-muted-foreground">{invoice.invoiceNumber}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Issue Date</p>
                  <p className="text-sm text-muted-foreground">{formatDate(invoice.issuedDate)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {getStatusIcon(invoice.status)}
                <div>
                  <p className="font-medium">Status</p>
                  <Badge variant={getStatusBadgeVariant(invoice.status)} className="mt-1">
                    {invoice.status.toUpperCase()}
                  </Badge>
                </div>
              </div>

              {invoice.paymentLink && (
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Payment Link</p>
                    <p className="text-xs text-muted-foreground break-all">{invoice.paymentLink}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Client Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Client Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Client Name</p>
                  <p className="text-sm text-muted-foreground">{invoice.client.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Email Address</p>
                  <p className="text-sm text-muted-foreground">{invoice.client.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Invoice Items - Show simplified version since your backend might not have detailed items */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Invoice Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {invoice.items && invoice.items.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-center">Quantity</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(item.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Invoice details</p>
                <p className="text-sm">Order ID: {invoice.orderId}</p>
              </div>
            )}

            <Separator className="my-4" />

            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(invoice.subtotal || invoice.totalAmount)}</span>
              </div>
              {invoice.shippingCost && invoice.shippingCost > 0 && (
                <div className="flex justify-between">
                  <span>Shipping:</span>
                  <span>{formatCurrency(invoice.shippingCost)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold">
                <span>Total Amount:</span>
                <span className="text-green-600">{formatCurrency(invoice.totalAmount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            {invoice.status.toLowerCase() === "paid" ? (
              <div className="text-center py-8">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-green-600 mb-2">Payment Completed</h3>
                <p className="text-muted-foreground">This invoice has already been paid. Thank you for your payment!</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Payment Summary</h4>
                  <div className="text-sm text-blue-800">
                    <p>
                      Amount to pay: <span className="font-bold">{formatCurrency(invoice.totalAmount)}</span>
                    </p>
                    <p>Payment method: Paystack</p>
                    <p>
                      Client: {invoice.client.name} ({invoice.client.email})
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handlePayment}
                  disabled={isProcessingPayment || !paystackLoaded}
                  className="w-full h-12 text-lg"
                  size="lg"
                >
                  {isProcessingPayment ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Processing Payment...
                    </>
                  ) : !paystackLoaded ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Loading Payment System...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-5 w-5" />
                      Pay Now - {formatCurrency(invoice.totalAmount)}
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Secure payment powered by Paystack. This is a test environment.
                  {!paystackLoaded && " Payment system is loading..."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
