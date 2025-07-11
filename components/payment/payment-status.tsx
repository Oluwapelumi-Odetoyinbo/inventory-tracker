"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react"

interface PaymentStatusProps {
  status: string
  amount?: number
  reference?: string
  className?: string
}

export function PaymentStatus({ status, amount, reference, className }: PaymentStatusProps) {
  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
      case "success":
        return {
          icon: <CheckCircle className="h-5 w-5 text-green-600" />,
          variant: "default" as const,
          color: "text-green-600",
          bgColor: "bg-green-50 border-green-200",
        }
      case "pending":
        return {
          icon: <Clock className="h-5 w-5 text-yellow-600" />,
          variant: "secondary" as const,
          color: "text-yellow-600",
          bgColor: "bg-yellow-50 border-yellow-200",
        }
      case "failed":
      case "cancelled":
        return {
          icon: <XCircle className="h-5 w-5 text-red-600" />,
          variant: "destructive" as const,
          color: "text-red-600",
          bgColor: "bg-red-50 border-red-200",
        }
      default:
        return {
          icon: <AlertCircle className="h-5 w-5 text-gray-600" />,
          variant: "outline" as const,
          color: "text-gray-600",
          bgColor: "bg-gray-50 border-gray-200",
        }
    }
  }

  const config = getStatusConfig(status)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      currencyDisplay: "symbol",
    }).format(amount)
  }

  return (
    <Card className={`${config.bgColor} ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          {config.icon}
          Payment Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status:</span>
          <Badge variant={config.variant} className="ml-2">
            {status.toUpperCase()}
          </Badge>
        </div>

        {amount && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Amount:</span>
            <span className={`font-bold ${config.color}`}>{formatCurrency(amount)}</span>
          </div>
        )}

        {reference && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Reference:</span>
            <span className="text-sm font-mono text-muted-foreground">{reference}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
