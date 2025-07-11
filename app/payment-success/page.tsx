"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Download, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { PaymentStatus } from "@/components/payment/payment-status"

function PaymentSuccessContent() {
  const searchParams = useSearchParams()
  const [paymentDetails, setPaymentDetails] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get payment details from URL parameters
    const reference = searchParams.get("reference")
    const amount = searchParams.get("amount")
    const invoiceNumber = searchParams.get("invoice")

    console.log("Payment success page loaded with params:", {
      reference,
      amount,
      invoiceNumber,
      fullUrl: window.location.href,
    })

    if (reference) {
      setPaymentDetails({
        reference,
        amount: amount ? Number.parseFloat(amount) : null,
        invoiceNumber,
        status: "success",
      })
    }

    setIsLoading(false)
  }, [searchParams])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      currencyDisplay: "symbol",
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading payment details...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Success Message */}
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">Payment Successful!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Your payment has been processed successfully. Thank you for your business!
            </p>
            {paymentDetails?.amount && (
              <p className="text-lg font-semibold mt-4 text-green-600">
                Amount Paid: {formatCurrency(paymentDetails.amount)}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Payment Details */}
        {paymentDetails && (
          <PaymentStatus
            status={paymentDetails.status}
            amount={paymentDetails.amount}
            reference={paymentDetails.reference}
          />
        )}

        {/* Invoice Information */}
        {paymentDetails?.invoiceNumber && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Invoice Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Invoice Number:</span>
                  <span className="text-sm font-mono">{paymentDetails.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Payment Reference:</span>
                  <span className="text-sm font-mono break-all">{paymentDetails.reference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Payment Date:</span>
                  <span className="text-sm">{new Date().toLocaleDateString("en-NG")}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {paymentDetails?.invoiceNumber && (
            <Button asChild className="w-full">
              <Link href={`/pay/${paymentDetails.invoiceNumber}`}>
                <Download className="mr-2 h-4 w-4" />
                View Invoice Details
              </Link>
            </Button>
          )}

          <Button variant="outline" asChild className="w-full">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            If you have any questions about this payment, please contact our support team.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Keep this reference number for your records: <span className="font-mono">{paymentDetails?.reference}</span>
          </p>
        </div>

        {/* Debug Information */}
        {process.env.NODE_ENV === "development" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Debug Information</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                {JSON.stringify(
                  {
                    paymentDetails,
                    currentUrl: typeof window !== "undefined" ? window.location.href : "SSR",
                    searchParams: typeof window !== "undefined" ? window.location.search : "SSR",
                  },
                  null,
                  2,
                )}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  )
} 