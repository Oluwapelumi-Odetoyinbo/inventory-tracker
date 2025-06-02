export interface User {
  id: string
  email: string
  name: string
}

export interface AuthResponse {
  token: string
  user: User
}

export interface InventoryItem {
  _id: string
  itemName: string
  quantity: number
  unit: string
  totalAmount: number
  shippingFee: number
  costPerUnit: number
  createdAt: string
}

export interface Order {
  _id: string
  inventoryItem: InventoryItem
  quantitySold: number
  sellingPricePerUnit: number
  totalSellingAmount: number
  profitPerUnit: number
  totalProfit: number
  createdAt: string
}

export interface MonthlyProfit {
  totalRevenue: number
  totalCost: number
  totalProfit: number
  month: string
  year: number
}

export interface CreateInventoryData {
  name: string
  quantity: number
  unit: string
  totalAmount: number
  shippingFee: number
}

export interface CreateOrderData {
  inventoryItemId: string
  quantitySold: number
  sellingPricePerUnit: number
}
