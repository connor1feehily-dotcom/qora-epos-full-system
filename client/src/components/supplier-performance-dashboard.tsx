import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Package, 
  AlertTriangle,
  CheckCircle,
  Star,
  BarChart3,
  Target
} from 'lucide-react';
import type { SupplierPerformance, Supplier } from '@shared/schema';

interface SupplierWithPerformance extends Supplier {
  performance: SupplierPerformance[];
  averageAccuracy: number;
  onTimeDeliveryRate: number;
  totalMarginContribution: number;
  reliabilityScore: number;
  priceStability: number;
}

export function SupplierPerformanceDashboard() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'quarter'>('month');
  
  // Get supplier performance data
  const { data: supplierData = [] } = useQuery<SupplierWithPerformance[]>({
    queryKey: ['/api/suppliers/performance', selectedTimeframe],
  });

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceBadge = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getReliabilityStars = (score: number) => {
    const stars = Math.round(score / 20); // Convert to 5-star scale
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`h-4 w-4 ${i < stars ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  const topPerformers = supplierData
    .sort((a, b) => b.reliabilityScore - a.reliabilityScore)
    .slice(0, 5);

  const marginContributors = supplierData
    .sort((a, b) => b.totalMarginContribution - a.totalMarginContribution)
    .slice(0, 5);

  const concernSuppliers = supplierData
    .filter(supplier => supplier.reliabilityScore < 70 || supplier.onTimeDeliveryRate < 80)
    .sort((a, b) => a.reliabilityScore - b.reliabilityScore);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Supplier Performance Dashboard</h1>
        <div className="flex space-x-2">
          <Button 
            variant={selectedTimeframe === 'week' ? 'default' : 'outline'}
            onClick={() => setSelectedTimeframe('week')}
          >
            Week
          </Button>
          <Button 
            variant={selectedTimeframe === 'month' ? 'default' : 'outline'}
            onClick={() => setSelectedTimeframe('month')}
          >
            Month
          </Button>
          <Button 
            variant={selectedTimeframe === 'quarter' ? 'default' : 'outline'}
            onClick={() => setSelectedTimeframe('quarter')}
          >
            Quarter
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{supplierData.length}</div>
            <p className="text-xs text-gray-600">Active suppliers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Average Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {supplierData.length > 0 
                ? (supplierData.reduce((sum, s) => sum + s.averageAccuracy, 0) / supplierData.length).toFixed(1)
                : 0}%
            </div>
            <p className="text-xs text-gray-600">Delivery accuracy</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">On-Time Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {supplierData.length > 0 
                ? (supplierData.reduce((sum, s) => sum + s.onTimeDeliveryRate, 0) / supplierData.length).toFixed(1)
                : 0}%
            </div>
            <p className="text-xs text-gray-600">Punctual deliveries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Margin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              £{supplierData.reduce((sum, s) => sum + s.totalMarginContribution, 0).toFixed(0)}
            </div>
            <p className="text-xs text-gray-600">Contribution</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="rankings" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="rankings">
            <Target className="h-4 w-4 mr-2" />
            Rankings
          </TabsTrigger>
          <TabsTrigger value="performance">
            <BarChart3 className="h-4 w-4 mr-2" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="margins">
            <TrendingUp className="h-4 w-4 mr-2" />
            Margins
          </TabsTrigger>
          <TabsTrigger value="alerts">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Alerts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rankings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Suppliers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topPerformers.map((supplier, index) => (
                  <div key={supplier.id} className="flex items-center justify-between p-4 border rounded">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                        <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                      </div>
                      <div>
                        <div className="font-medium">{supplier.name}</div>
                        <div className="text-sm text-gray-600">{supplier.contactPerson}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        {getReliabilityStars(supplier.reliabilityScore)}
                      </div>
                      <Badge className={getPerformanceBadge(supplier.reliabilityScore)}>
                        {supplier.reliabilityScore.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {supplierData.map(supplier => (
              <Card key={supplier.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{supplier.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Delivery Accuracy</span>
                      <span className={`text-sm font-bold ${getPerformanceColor(supplier.averageAccuracy)}`}>
                        {supplier.averageAccuracy.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={supplier.averageAccuracy} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">On-Time Delivery</span>
                      <span className={`text-sm font-bold ${getPerformanceColor(supplier.onTimeDeliveryRate)}`}>
                        {supplier.onTimeDeliveryRate.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={supplier.onTimeDeliveryRate} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Price Stability</span>
                      <span className={`text-sm font-bold ${getPerformanceColor(supplier.priceStability)}`}>
                        {supplier.priceStability.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={supplier.priceStability} className="h-2" />
                  </div>
                  
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm font-medium">Margin Contribution</span>
                    <span className="text-sm font-bold text-green-600">
                      £{supplier.totalMarginContribution.toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="margins" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Margin Contributors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {marginContributors.map((supplier, index) => (
                  <div key={supplier.id} className="flex items-center justify-between p-4 border rounded">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                        <span className="text-sm font-bold text-green-600">#{index + 1}</span>
                      </div>
                      <div>
                        <div className="font-medium">{supplier.name}</div>
                        <div className="text-sm text-gray-600">
                          {supplier.performance.length} deliveries this {selectedTimeframe}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">
                        £{supplier.totalMarginContribution.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600">
                        Avg per delivery: £{(supplier.totalMarginContribution / Math.max(supplier.performance.length, 1)).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          {concernSuppliers.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <span>Suppliers Needing Attention</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {concernSuppliers.map(supplier => (
                    <div key={supplier.id} className="flex items-center justify-between p-4 border-l-4 border-l-red-500 bg-red-50 rounded">
                      <div>
                        <div className="font-medium">{supplier.name}</div>
                        <div className="text-sm text-gray-600">
                          {supplier.reliabilityScore < 70 && (
                            <span className="flex items-center space-x-1">
                              <AlertTriangle className="h-3 w-3 text-red-500" />
                              <span>Low reliability score: {supplier.reliabilityScore.toFixed(1)}%</span>
                            </span>
                          )}
                          {supplier.onTimeDeliveryRate < 80 && (
                            <span className="flex items-center space-x-1">
                              <Clock className="h-3 w-3 text-red-500" />
                              <span>Poor punctuality: {supplier.onTimeDeliveryRate.toFixed(1)}%</span>
                            </span>
                          )}
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Review
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">All Suppliers Performing Well</h3>
                <p className="text-gray-600">No suppliers currently need attention.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}