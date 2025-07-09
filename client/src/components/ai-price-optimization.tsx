import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  AlertCircle,
  CheckCircle,
  DollarSign,
  BarChart3,
  Zap,
  Clock,
  Eye
} from 'lucide-react';
import type { PriceOptimization, Product, User } from '@shared/schema';

interface PriceOptimizationWithProduct extends PriceOptimization {
  product: Product;
}

interface AIInsight {
  type: 'markup' | 'markdown' | 'competitive' | 'seasonal';
  confidence: number;
  reasoning: string;
  expectedImpact: string;
  urgency: 'low' | 'medium' | 'high';
}

export function AIPriceOptimization() {
  const [selectedOptimization, setSelectedOptimization] = useState<PriceOptimizationWithProduct | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'markup' | 'markdown'>('all');
  const [sortBy, setSortBy] = useState<'confidence' | 'impact' | 'urgency'>('confidence');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get AI price optimization suggestions
  const { data: optimizations = [] } = useQuery<PriceOptimizationWithProduct[]>({
    queryKey: ['/api/ai/price-optimizations', { type: filterType, sortBy }],
  });

  // Get current user for approval tracking
  const { data: currentUser } = useQuery<User>({
    queryKey: ['/api/auth/current-user'],
  });

  // Apply price optimization
  const applyOptimizationMutation = useMutation({
    mutationFn: async (optimizationId: number) => {
      const response = await apiRequest('POST', `/api/ai/price-optimizations/${optimizationId}/apply`, {
        appliedByUserId: currentUser?.id
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Price Updated",
        description: `${data.product.name} price updated successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/ai/price-optimizations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      setSelectedOptimization(null);
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Unable to apply price optimization.",
        variant: "destructive"
      });
    }
  });

  // Dismiss suggestion
  const dismissOptimizationMutation = useMutation({
    mutationFn: async (optimizationId: number) => {
      const response = await apiRequest('DELETE', `/api/ai/price-optimizations/${optimizationId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Suggestion Dismissed",
        description: "AI suggestion has been dismissed.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/ai/price-optimizations'] });
      setSelectedOptimization(null);
    }
  });

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-100 text-green-800';
    if (confidence >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getMarketTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'decreasing': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <BarChart3 className="h-4 w-4 text-gray-500" />;
    }
  };

  const getOptimizationType = (currentPrice: number, suggestedPrice: number) => {
    if (suggestedPrice > currentPrice) return 'markup';
    if (suggestedPrice < currentPrice) return 'markdown';
    return 'adjustment';
  };

  const calculatePriceChange = (currentPrice: number, suggestedPrice: number) => {
    const change = suggestedPrice - currentPrice;
    const percentage = (change / currentPrice) * 100;
    return { change, percentage };
  };

  const highConfidenceOptimizations = optimizations.filter(opt => opt.confidence >= 80);
  const mediumConfidenceOptimizations = optimizations.filter(opt => opt.confidence >= 60 && opt.confidence < 80);
  const lowConfidenceOptimizations = optimizations.filter(opt => opt.confidence < 60);

  const potentialRevenue = optimizations.reduce((sum, opt) => {
    const change = calculatePriceChange(parseFloat(opt.currentPrice), parseFloat(opt.suggestedPrice));
    return sum + (change.change * (opt.salesVelocity || 0));
  }, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Brain className="h-6 w-6 text-purple-600" />
          <h1 className="text-2xl font-bold">AI Price Optimization</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-purple-50">
            {optimizations.length} Suggestions
          </Badge>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">High Confidence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{highConfidenceOptimizations.length}</div>
            <p className="text-xs text-gray-600">Ready to apply</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Medium Confidence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{mediumConfidenceOptimizations.length}</div>
            <p className="text-xs text-gray-600">Needs review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Low Confidence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{lowConfidenceOptimizations.length}</div>
            <p className="text-xs text-gray-600">Risky changes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Potential Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              £{potentialRevenue.toFixed(0)}
            </div>
            <p className="text-xs text-gray-600">Monthly impact</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Controls */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <Button 
            variant={filterType === 'all' ? 'default' : 'outline'}
            onClick={() => setFilterType('all')}
          >
            All Suggestions
          </Button>
          <Button 
            variant={filterType === 'markup' ? 'default' : 'outline'}
            onClick={() => setFilterType('markup')}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Price Increases
          </Button>
          <Button 
            variant={filterType === 'markdown' ? 'default' : 'outline'}
            onClick={() => setFilterType('markdown')}
          >
            <TrendingDown className="h-4 w-4 mr-2" />
            Price Reductions
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Sort by:</span>
          <Button 
            variant={sortBy === 'confidence' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('confidence')}
          >
            Confidence
          </Button>
          <Button 
            variant={sortBy === 'impact' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('impact')}
          >
            Impact
          </Button>
        </div>
      </div>

      <Tabs defaultValue="suggestions" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="suggestions">
            <Target className="h-4 w-4 mr-2" />
            Suggestions
          </TabsTrigger>
          <TabsTrigger value="insights">
            <Brain className="h-4 w-4 mr-2" />
            AI Insights
          </TabsTrigger>
          <TabsTrigger value="applied">
            <CheckCircle className="h-4 w-4 mr-2" />
            Applied
          </TabsTrigger>
        </TabsList>

        <TabsContent value="suggestions" className="space-y-4">
          {optimizations.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Suggestions Available</h3>
                <p className="text-gray-600">AI is analyzing your inventory for optimization opportunities.</p>
              </CardContent>
            </Card>
          ) : (
            optimizations.map(optimization => {
              const priceChange = calculatePriceChange(
                parseFloat(optimization.currentPrice),
                parseFloat(optimization.suggestedPrice)
              );
              const optimizationType = getOptimizationType(
                parseFloat(optimization.currentPrice),
                parseFloat(optimization.suggestedPrice)
              );

              return (
                <Card key={optimization.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {optimizationType === 'markup' ? (
                            <div className="p-2 bg-green-100 rounded">
                              <TrendingUp className="h-5 w-5 text-green-600" />
                            </div>
                          ) : (
                            <div className="p-2 bg-blue-100 rounded">
                              <TrendingDown className="h-5 w-5 text-blue-600" />
                            </div>
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{optimization.product.name}</CardTitle>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge className={getConfidenceBadge(parseFloat(optimization.confidence))}>
                              {optimization.confidence}% Confidence
                            </Badge>
                            {optimization.marketTrend && (
                              <div className="flex items-center space-x-1">
                                {getMarketTrendIcon(optimization.marketTrend)}
                                <span className="text-sm capitalize">{optimization.marketTrend}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Current: £{optimization.currentPrice}</div>
                        <div className="text-lg font-bold">
                          Suggested: £{optimization.suggestedPrice}
                        </div>
                        <div className={`text-sm font-medium ${priceChange.change > 0 ? 'text-green-600' : 'text-blue-600'}`}>
                          {priceChange.change > 0 ? '+' : ''}£{priceChange.change.toFixed(2)} ({priceChange.percentage.toFixed(1)}%)
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-sm text-gray-700">
                        <strong>AI Reasoning:</strong> {optimization.reasoning}
                      </div>
                      
                      {optimization.expectedMarginImprovement && (
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <Target className="h-4 w-4 text-green-500" />
                            <span className="text-sm">Expected margin improvement: {optimization.expectedMarginImprovement}%</span>
                          </div>
                          {optimization.salesVelocity && (
                            <div className="flex items-center space-x-2">
                              <Zap className="h-4 w-4 text-blue-500" />
                              <span className="text-sm">Sales velocity: {optimization.salesVelocity} units/month</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <div className="text-sm text-gray-600">
                            Confidence Score:
                          </div>
                          <Progress value={parseFloat(optimization.confidence)} className="w-24 h-2" />
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedOptimization(optimization)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Review
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => dismissOptimizationMutation.mutate(optimization.id)}
                          >
                            Dismiss
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => applyOptimizationMutation.mutate(optimization.id)}
                            disabled={applyOptimizationMutation.isPending}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            Apply
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Market Intelligence</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">Seasonal Trends</span>
                  </div>
                  <p className="text-sm text-gray-700">
                    Holiday items showing increased demand. Consider 15-20% markup on seasonal products.
                  </p>
                </div>
                
                <div className="p-4 bg-green-50 rounded">
                  <div className="flex items-center space-x-2 mb-2">
                    <Target className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Margin Opportunities</span>
                  </div>
                  <p className="text-sm text-gray-700">
                    12 products identified with margins below 25%. Average potential improvement: 8%.
                  </p>
                </div>
                
                <div className="p-4 bg-orange-50 rounded">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                    <span className="font-medium">Competitive Alerts</span>
                  </div>
                  <p className="text-sm text-gray-700">
                    3 products may be overpriced compared to local competition. Consider price reduction.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applied" className="space-y-4">
          <Card>
            <CardContent className="p-8 text-center">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Applied Optimizations</h3>
              <p className="text-gray-600">History of applied AI price suggestions will appear here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detailed Review Modal */}
      {selectedOptimization && (
        <Dialog open={!!selectedOptimization} onOpenChange={() => setSelectedOptimization(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Review Price Optimization</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Product</label>
                  <div className="text-lg font-bold">{selectedOptimization.product.name}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Current Stock</label>
                  <div className="text-lg">{selectedOptimization.product.stock} units</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded">
                  <div className="text-sm font-medium text-gray-600 mb-1">Current Price</div>
                  <div className="text-2xl font-bold">£{selectedOptimization.currentPrice}</div>
                </div>
                <div className="p-4 bg-purple-50 rounded">
                  <div className="text-sm font-medium text-purple-600 mb-1">Suggested Price</div>
                  <div className="text-2xl font-bold text-purple-600">£{selectedOptimization.suggestedPrice}</div>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">AI Analysis</label>
                <div className="mt-2 p-4 bg-blue-50 rounded">
                  <p className="text-sm">{selectedOptimization.reasoning}</p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => dismissOptimizationMutation.mutate(selectedOptimization.id)}
                >
                  Dismiss
                </Button>
                <Button 
                  onClick={() => applyOptimizationMutation.mutate(selectedOptimization.id)}
                  disabled={applyOptimizationMutation.isPending}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Apply Optimization
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}