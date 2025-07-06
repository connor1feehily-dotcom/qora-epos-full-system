import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, DollarSign, Target, Calendar, BarChart3 } from "lucide-react";

export function ValueProjection() {
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  
  const { data: transactions = [] } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => fetch("/api/transactions").then(res => res.json())
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => fetch("/api/products").then(res => res.json())
  });

  const calculateProjections = () => {
    const totalRevenue = transactions.reduce((sum: number, t: any) => sum + parseFloat(t.total), 0);
    const averageTransaction = transactions.length > 0 ? totalRevenue / transactions.length : 0;
    const dailyAverage = totalRevenue / 30; // Assuming 30 days
    
    const projections = {
      weekly: dailyAverage * 7,
      monthly: dailyAverage * 30,
      quarterly: dailyAverage * 90,
      yearly: dailyAverage * 365
    };

    return { totalRevenue, averageTransaction, dailyAverage, projections };
  };

  const { totalRevenue, averageTransaction, dailyAverage, projections } = calculateProjections();

  const profitMarginData = [
    { category: "Food & Beverages", margin: 35, trend: "up" },
    { category: "Tobacco", margin: 15, trend: "stable" },
    { category: "Household", margin: 25, trend: "up" },
    { category: "Personal Care", margin: 40, trend: "down" },
    { category: "Confectionery", margin: 45, trend: "up" }
  ];

  const revenueTargets = [
    { period: "This Week", target: 2500, actual: 2100, percentage: 84 },
    { period: "This Month", target: 10000, actual: 8500, percentage: 85 },
    { period: "This Quarter", target: 30000, actual: 25000, percentage: 83 },
    { period: "This Year", target: 120000, actual: 95000, percentage: 79 }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Value Projection & Financial Forecasting
          </CardTitle>
          <p className="text-gray-600">Advanced financial analysis and revenue projections</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900">Total Revenue</h3>
              <p className="text-2xl font-bold text-blue-600">€{totalRevenue.toFixed(2)}</p>
              <p className="text-sm text-blue-600">Current Period</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900">Daily Average</h3>
              <p className="text-2xl font-bold text-green-600">€{dailyAverage.toFixed(2)}</p>
              <p className="text-sm text-green-600">Per Day</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-900">Avg Transaction</h3>
              <p className="text-2xl font-bold text-purple-600">€{averageTransaction.toFixed(2)}</p>
              <p className="text-sm text-purple-600">Per Sale</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="font-semibold text-orange-900">Growth Rate</h3>
              <p className="text-2xl font-bold text-orange-600">+12.5%</p>
              <p className="text-sm text-orange-600">Monthly</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Revenue Projections
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Weekly Projection</span>
                    <span className="font-bold text-green-600">€{projections.weekly.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Monthly Projection</span>
                    <span className="font-bold text-blue-600">€{projections.monthly.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Quarterly Projection</span>
                    <span className="font-bold text-purple-600">€{projections.quarterly.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Yearly Projection</span>
                    <span className="font-bold text-orange-600">€{projections.yearly.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Revenue Targets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {revenueTargets.map((target, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{target.period}</span>
                        <Badge variant={target.percentage >= 80 ? "default" : "destructive"}>
                          {target.percentage}%
                        </Badge>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${target.percentage >= 80 ? 'bg-green-500' : 'bg-red-500'}`}
                          style={{ width: `${target.percentage}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>€{target.actual.toLocaleString()}</span>
                        <span>€{target.target.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Profit Margin Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {profitMarginData.map((item, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{item.category}</h3>
                      {item.trend === "up" ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : item.trend === "down" ? (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      ) : (
                        <div className="h-4 w-4 bg-gray-300 rounded-full"></div>
                      )}
                    </div>
                    <p className="text-2xl font-bold text-green-600">{item.margin}%</p>
                    <p className="text-sm text-gray-600">Profit Margin</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Seasonal Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Peak Sales Periods</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                      <span>Summer Months</span>
                      <span className="font-bold text-green-600">+25%</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                      <span>Holiday Season</span>
                      <span className="font-bold text-blue-600">+40%</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-purple-50 rounded">
                      <span>Back to School</span>
                      <span className="font-bold text-purple-600">+15%</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-3">Cost Projections</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span>Operating Costs</span>
                      <span className="font-bold">€{(projections.monthly * 0.65).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span>Staff Costs</span>
                      <span className="font-bold">€{(projections.monthly * 0.2).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span>Utilities</span>
                      <span className="font-bold">€{(projections.monthly * 0.05).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}