// Paystack utility functions and types

export interface PaystackResponse {
  reference: string
  status: string
  trans: string
  transaction: string
  trxref: string
  message: string
}

export interface PaystackConfig {
  key: string
  email: string
  amount: number
  currency?: string
  ref?: string
  metadata?: {
    invoiceId: string
    invoiceNumber: string
    clientName: string
    custom_fields?: Array<{
      display_name: string
      variable_name: string
      value: string
    }>
  }
  callback: (response: PaystackResponse) => void
  onClose: () => void
}

export const generatePaymentReference = (invoiceNumber: string): string => {
  return `${invoiceNumber}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export const formatAmountForPaystack = (amount: number): number => {
  // Paystack expects amount in kobo for NGN
  return Math.round(amount * 100)
}

export const validatePaystackResponse = (response: PaystackResponse): boolean => {
  return response.status === "success" && !!response.reference
}

// Test card numbers for Paystack test mode
export const PAYSTACK_TEST_CARDS = {
  SUCCESS: "4084084084084081",
  INSUFFICIENT_FUNDS: "4084084084084099",
  INVALID_PIN: "4084084084084107",
  TIMEOUT: "4084084084084115",
}
