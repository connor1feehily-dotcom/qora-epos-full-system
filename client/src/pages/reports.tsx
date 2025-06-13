import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Download, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Euro, 
  Receipt, 
  Package,
  CreditCard,
  Banknote
} from "lucide-react";
import type { Transaction, Product } from "@shared/schema";

export default function Reports() {
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Fetch transactions
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
  });

  // Fetch products for inventory reports
  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  const isLoading = transactionsLoading || productsLoading;

  // Calculate sales metrics
  const calculateSalesMetrics = () => {
    const today = new Date();
    const targetDate = new Date(selectedDate);
    
    let filteredTransactions = transactions;
    
    if (reportType === 'daily') {
      filteredTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.createdAt);
        return transactionDate.toDateString() === targetDate.toDateString();
      });
    } else if (reportType === 'weekly') {
      const weekStart = new Date(targetDate);
      weekStart.setDate(targetDate.getDate() - targetDate.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      filteredTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.createdAt);
        return transactionDate >= weekStart && transactionDate <= weekEnd;
      });
    } else if (reportType === 'monthly') {
      filteredTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.createdAt);
        return transactionDate.getMonth() === targetDate.getMonth() && 
               transactionDate.getFullYear() === targetDate.getFullYear();
      });
    }

    const totalRevenue = filteredTransactions.reduce((sum, t) => sum + parseFloat(t.total.toString()), 0);
    const totalVAT = filteredTransactions.reduce((sum, t) => sum + parseFloat(t.vatAmount.toString()), 0);
    const totalTransactions = filteredTransactions.length;
    const averageTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    const cardPayments = filteredTransactions.filter(t => t.paymentMethod === 'card');
    const cashPayments = filteredTransactions.filter(t => t.paymentMethod === 'cash');

    return {
      totalRevenue,
      totalVAT,
      totalTransactions,
      averageTransaction,
      cardPayments: {
        count: cardPayments.length,
        amount: cardPayments.reduce((sum, t) => sum + parseFloat(t.total.toString()), 0)
      },
      cashPayments: {
        count: cashPayments.length,
        amount: cashPayments.reduce((sum, t) => sum + parseFloat(t.total.toString()), 0)
      },
      transactions: filteredTransactions
    };
  };

  const metrics = calculateSalesMetrics();

  // Calculate inventory metrics
  const inventoryMetrics = {
    totalProducts: products.length,
    totalValue: products.reduce((sum, p) => sum + (p.stock * parseFloat(p.cost?.toString() || '0')), 0),
    lowStockItems: products.filter(p => p.stock <= p.minStock),
    outOfStockItems: products.filter(p => p.stock === 0),
  };

  const exportReport = () => {
    // In a real implementation, this would generate and download a CSV/PDF
    const reportData = {
      type: reportType,
      date: selectedDate,
      metrics: metrics,
      inventory: inventoryMetrics,
    };
    
    console.log('Exporting report:', reportData);
    
    // Create a simple CSV for demo purposes
    const csvContent = [
      ['Report Type', reportType],
      ['Date', selectedDate],
      ['Total Revenue', `€${metrics.totalRevenue.toFixed(2)}`],
      ['Total Transactions', metrics.totalTransactions.toString()],
      ['Average Transaction', `€${metrics.averageTransaction.toFixed(2)}`],
      ['Card Payments', `${metrics.cardPayments.count} (€${metrics.cardPayments.amount.toFixed(2)})`],
      ['Cash Payments', `${metrics.cashPayments.count} (€${metrics.cashPayments.amount.toFixed(2)})`],
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kerrigans-xl-report-${reportType}-${selectedDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading report data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Reports & Analytics</h2>
            <p className="text-sm text-gray-600">Generate business reports and analyze performance</p>
          </div>
          <Button onClick={exportReport}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </header>

      {/* Report Controls */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Report Type:</span>
          </div>
          <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Sales Metrics */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      €{metrics.totalRevenue.toFixed(2)}
                    </p>
                  </div>
                  <Euro className="w-8 h-8 text-success" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Transactions</p>
                    <p className="text-2xl font-semibold text-gray-900">{metrics.totalTransactions}</p>
                  </div>
                  <Receipt className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Average Sale</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      €{metrics.averageTransaction.toFixed(2)}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-warning" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">VAT Collected</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      €{metrics.totalVAT.toFixed(2)}
                    </p>
                  </div>
                  <FileText className="w-8 h-8 text-gray-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Payment Methods & Inventory */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CreditCard className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">Card Payments</p>
                      <p className="text-sm text-gray-600">{metrics.cardPayments.count} transactions</p>
                    </div>
                  </div>
                  <span className="font-semibold">€{metrics.cardPayments.amount.toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Banknote className="w-5 h-5 text-secondary" />
                    <div>
                      <p className="font-medium">Cash Payments</p>
                      <p className="text-sm text-gray-600">{metrics.cashPayments.count} transactions</p>
                    </div>
                  </div>
                  <span className="font-semibold">€{metrics.cashPayments.amount.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inventory Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Inventory Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Products:</span>
                  <span className="font-medium">{inventoryMetrics.totalProducts}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Inventory Value:</span>
                  <span className="font-medium">€{inventoryMetrics.totalValue.toFixed(2)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Low Stock Items:</span>
                  <Badge variant={inventoryMetrics.lowStockItems.length > 0 ? "destructive" : "secondary"}>
                    {inventoryMetrics.lowStockItems.length}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Out of Stock:</span>
                  <Badge variant={inventoryMetrics.outOfStockItems.length > 0 ? "destructive" : "secondary"}>
                    {inventoryMetrics.outOfStockItems.length}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction Details</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Subtotal</TableHead>
                    <TableHead>VAT</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        No transactions found for the selected period
                      </TableCell>
                    </TableRow>
                  ) : (
                    metrics.transactions.slice(0, 20).map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">
                          #TXN-{String(transaction.id).padStart(6, '0')}
                        </TableCell>
                        <TableCell>
                          {new Date(transaction.createdAt).toLocaleString('en-IE')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {transaction.paymentMethod === 'card' ? (
                              <CreditCard className="w-4 h-4 text-primary" />
                            ) : (
                              <Banknote className="w-4 h-4 text-secondary" />
                            )}
                            <span className="capitalize">{transaction.paymentMethod}</span>
                          </div>
                        </TableCell>
                        <TableCell>€{parseFloat(transaction.subtotal.toString()).toFixed(2)}</TableCell>
                        <TableCell>€{parseFloat(transaction.vatAmount.toString()).toFixed(2)}</TableCell>
                        <TableCell className="text-right font-medium">
                          €{parseFloat(transaction.total.toString()).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
