export interface CartItem {
  id: number;
  productId: number;
  name: string;
  price: number;
  quantity: number;
  total: number;
  category: string;
}

export interface TransactionSummary {
  items: CartItem[];
  subtotal: number;
  vatAmount: number;
  total: number;
  itemCount: number;
}

export interface DashboardMetrics {
  dailyRevenue: number;
  transactions: number;
  fuelSales: number;
  lowStock: number;
  recentTransactions: any[];
  tillMetrics: {
    till1: {
      transactions: number;
      revenue: number;
    };
    till2: {
      transactions: number;
      revenue: number;
    };
  };
}
