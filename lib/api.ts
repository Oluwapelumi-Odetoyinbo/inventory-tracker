const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

type InventoryItem = {};

type Order = {};

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("token");

  const config: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      errorData.message || "An error occurred"
    );
  }

  return response.json();
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    apiRequest<{ token: string; user: any }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  // Inventory
  addInventory: (data: any) =>
    apiRequest<InventoryItem>("/api/inventory", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getInventory: () => apiRequest<InventoryItem[]>("/api/inventory"),

  // Orders
  createOrder: (data: any) =>
    apiRequest<Order>("/api/orders/create", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  register: (name: string, email: string, password: string) =>
    apiRequest<{ token: string; user: any }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    }),

  getMonthlyProfit: () => apiRequest<any>("/api/orders/profit/monthly"),
  getInvoiceByNumber: (invoiceNumber: string) =>
    apiRequest<any>(`/invoices/${invoiceNumber}`),

  markInvoiceAsPaid: (invoiceNumber: string, paymentData: any) =>
    apiRequest<any>(`/api/invoices/pay/${invoiceNumber}`, {
      method: "POST",
      body: JSON.stringify(paymentData),
    }),
};
