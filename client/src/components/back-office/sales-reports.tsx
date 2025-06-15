import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Receipt, 
  Calendar as CalendarIcon,
  Download,
  Filter,
  PieChart,
  LineChart,
  Users,
  CreditCard,
  Banknote,
  Clock,
  Target
} from "lucide-react";
import type { Transaction, TillSession, DailyReport } from "@shared/schema";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

export function SalesReports() {
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 7),
    to: new Date()
  });
  const [selectedTill, setSelectedTill] = useState("all");
  const [reportType, setReportType] = useState("daily");

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions']
  });

  const { data: tillSessions = [] } = useQuery<TillSession[]>({
    queryKey: ['/api/till-sessions']
  });

  const { data: dailyReports = [] } = useQuery<DailyReport[]>({
    queryKey: ['/api/daily-reports']
  });

  // Filter transactions by date range and till
  const filteredTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.createdAt || '');
    const inDateRange = transactionDate >= startOfDay(dateRange.from) && 
                       transactionDate <= endOfDay(dateRange.to);
    const matchesTill = selectedTill === "all" || t.tillId === selectedTill;
    return inDateRange && matchesTill;
  });

  // Calculate metrics
  const totalRevenue = filteredTransactions.reduce((sum, t) => 
    sum + parseFloat(t.total.toString()), 0
  );

  const totalTransactions = filteredTransactions.length;
  const averageTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  const cashTransactions = filteredTransactions.filter(t => t.paymentMethod === 'cash');
  const cardTransactions = filteredTransactions.filter(t => t.paymentMethod === 'card');
  
  const cashRevenue = cashTransactions.reduce((sum, t) => sum + parseFloat(t.total.toString()), 0);
  const cardRevenue = cardTransactions.reduce((sum, t) => sum + parseFloat(t.total.toString()), 0);

  // Get unique tills
  const uniqueTills = Array.from(new Set(transactions.map(t => t.tillId)));

  // Group transactions by date for daily breakdown
  const dailyBreakdown = filteredTransactions.reduce((acc, t) => {
    const date = format(new Date(t.createdAt || ''), 'yyyy-MM-dd');
    if (!acc[date]) {
      acc[date] = { count: 0, revenue: 0, cash: 0, card: 0 };
    }
    acc[date].count++;
    acc[date].revenue += parseFloat(t.total.toString());
    if (t.paymentMethod === 'cash') acc[date].cash += parseFloat(t.total.toString());
    if (t.paymentMethod === 'card') acc[date].card += parseFloat(t.total.toString());
    return acc;
  }, {} as Record<string, { count: number; revenue: number; cash: number; card: number }>);

  // Group by till for comparison
  const tillBreakdown = filteredTransactions.reduce((acc, t) => {
    if (!acc[t.tillId]) {
      acc[t.tillId] = { count: 0, revenue: 0 };
    }
    acc[t.tillId].count++;
    acc[t.tillId].revenue += parseFloat(t.total.toString());
    return acc;
  }, {} as Record<string, { count: number; revenue: number }>);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales Reports</h1>
          <p className="text-gray-600">Analyze sales performance and transaction data</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>Report Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Date Range</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range) => {
                      if (range?.from && range?.to) {
                        setDateRange({ from: range.from, to: range.to });
                      }
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Till Selection</Label>
              <Select value={selectedTill} onValueChange={setSelectedTill}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Till" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tills</SelectItem>
                  {uniqueTills.map(till => (
                    <SelectItem key={till} value={till}>{till}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily Summary</SelectItem>
                  <SelectItem value="weekly">Weekly Summary</SelectItem>
                  <SelectItem value="monthly">Monthly Summary</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button className="w-full">
                <BarChart3 className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Total Revenue</CardTitle>
            <DollarSign className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">€{totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-green-600">
              {((cardRevenue / totalRevenue) * 100).toFixed(1)}% card payments
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Transactions</CardTitle>
            <Receipt className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{totalTransactions}</div>
            <p className="text-xs text-blue-600">
              Average: €{averageTransaction.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">Cash Sales</CardTitle>
            <Banknote className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">€{cashRevenue.toFixed(2)}</div>
            <p className="text-xs text-purple-600">
              {cashTransactions.length} transactions
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Card Sales</CardTitle>
            <CreditCard className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">€{cardRevenue.toFixed(2)}</div>
            <p className="text-xs text-orange-600">
              {cardTransactions.length} transactions
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <LineChart className="w-5 h-5" />
              <span>Daily Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-80">
              <div className="space-y-3">
                {Object.entries(dailyBreakdown).map(([date, data]) => (
                  <div key={date} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{format(new Date(date), 'MMM dd, yyyy')}</p>
                      <p className="text-sm text-gray-600">{data.count} transactions</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">€{data.revenue.toFixed(2)}</p>
                      <div className="flex space-x-2 text-xs">
                        <Badge variant="outline">Cash: €{data.cash.toFixed(2)}</Badge>
                        <Badge variant="outline">Card: €{data.card.toFixed(2)}</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Till Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="w-5 h-5" />
              <span>Till Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-80">
              <div className="space-y-3">
                {Object.entries(tillBreakdown).map(([tillId, data]) => {
                  const percentage = (data.revenue / totalRevenue) * 100;
                  return (
                    <div key={tillId} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{tillId}</p>
                          <p className="text-sm text-gray-600">{data.count} transactions</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">€{data.revenue.toFixed(2)}</p>
                          <p className="text-sm text-gray-600">{percentage.toFixed(1)}%</p>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions Detail */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Receipt className="w-5 h-5" />
              <span>Transaction History</span>
            </div>
            <Badge variant="outline">{filteredTransactions.length} transactions</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-2">
              {filteredTransactions.slice(0, 50).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Receipt className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Transaction #{transaction.id}</p>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span>{transaction.tillId}</span>
                        <span>•</span>
                        <Badge variant={transaction.paymentMethod === 'cash' ? 'secondary' : 'default'}>
                          {transaction.paymentMethod}
                        </Badge>
                        <span>•</span>
                        <span>{format(new Date(transaction.createdAt || ''), 'HH:mm')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">€{parseFloat(transaction.total.toString()).toFixed(2)}</p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(transaction.createdAt || ''), 'MMM dd')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}