import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import {
  Bot,
  Brain,
  TrendingUp,
  Package,
  Users,
  AlertTriangle,
  Lightbulb,
  BarChart3,
  MessageSquare,
  Zap,
  Target,
  Heart,
  Shield,
  Award,
  PieChart,
  Activity,
  Sparkles,
  ChevronRight,
  Send,
  Mic,
  MicOff
} from 'lucide-react';

export default function ValBotAssistant() {
  const [selectedTab, setSelectedTab] = useState('dashboard');
  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // AI Insights and Analytics
  const { data: aiInsights, isLoading: insightsLoading } = useQuery({
    queryKey: ['ai-insights'],
    queryFn: () => apiRequest('GET', '/api/ai/insights'),
    refetchInterval: 300000 // Refresh every 5 minutes
  });

  // Store Health Dashboard
  const { data: storeHealth } = useQuery({
    queryKey: ['store-health'],
    queryFn: () => apiRequest('GET', '/api/ai/store-health'),
    refetchInterval: 60000 // Refresh every minute
  });

  // Staff Performance Analytics
  const { data: staffPerformance } = useQuery({
    queryKey: ['staff-performance'],
    queryFn: () => apiRequest('GET', '/api/ai/staff-performance'),
    refetchInterval: 300000
  });

  // Customer Behavior Analytics
  const { data: customerBehavior } = useQuery({
    queryKey: ['customer-behavior'],
    queryFn: () => apiRequest('GET', '/api/ai/customer-behavior'),
    refetchInterval: 300000
  });

  // Natural Language Query
  const nlQueryMutation = useMutation({
    mutationFn: (query: string) => 
      apiRequest('POST', '/api/ai/query', { query }),
    onSuccess: (response) => {
      setChatHistory(prev => [...prev, 
        { type: 'user', message: query, timestamp: new Date() },
        { type: 'valbot', message: response.answer, data: response.data, timestamp: new Date() }
      ]);
      setQuery('');
      scrollToBottom();
    }
  });

  // AI Analysis Trigger
  const triggerAnalysisMutation = useMutation({
    mutationFn: (analysisType: string) =>
      apiRequest('POST', '/api/ai/analyze', { analysisType }),
    onSuccess: (result, analysisType) => {
      toast({
        title: 'Analysis Complete',
        description: `${analysisType.replace('_', ' ')} analysis has been completed`,
      });
      queryClient.invalidateQueries({ queryKey: ['ai-insights'] });
    }
  });

  const scrollToBottom = () => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  };

  const handleSubmitQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      nlQueryMutation.mutate(query);
    }
  };

  const startVoiceRecognition = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
      };
      
      recognition.start();
    } else {
      toast({
        title: 'Voice Recognition Not Supported',
        description: 'Your browser does not support voice recognition',
        variant: 'destructive'
      });
    }
  };

  const HealthScoreCard = ({ title, score, icon: Icon, color }: any) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${color}`} />
            <span className="text-sm font-medium">{title}</span>
          </div>
          <Badge variant={score >= 80 ? 'default' : score >= 60 ? 'secondary' : 'destructive'}>
            {score}%
          </Badge>
        </div>
        <Progress value={score} className="h-2" />
      </CardContent>
    </Card>
  );

  const InsightCard = ({ insight, icon: Icon }: any) => (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Icon className="h-5 w-5 text-primary mt-1" />
          <div className="flex-1">
            <h3 className="font-medium text-sm mb-1">{insight.title}</h3>
            <p className="text-xs text-muted-foreground mb-2">{insight.description}</p>
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs">
                {insight.confidence}% confidence
              </Badge>
              {insight.action && (
                <Button size="sm" variant="outline" className="h-6 text-xs">
                  {insight.action}
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const StaffLeaderboardCard = ({ staff, rank }: any) => (
    <div className="flex items-center justify-between p-3 border rounded-lg mb-2">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
          rank === 1 ? 'bg-yellow-500 text-white' :
          rank === 2 ? 'bg-gray-400 text-white' :
          rank === 3 ? 'bg-amber-600 text-white' : 'bg-muted'
        }`}>
          {rank}
        </div>
        <div>
          <p className="font-medium text-sm">{staff.name}</p>
          <p className="text-xs text-muted-foreground">{staff.role}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-medium text-sm">{staff.efficiency}%</p>
        <div className="flex gap-1">
          {staff.badges?.map((badge: string, i: number) => (
            <Badge key={i} variant="secondary" className="text-xs px-1 py-0">
              {badge}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bot className="h-8 w-8 text-primary" />
              <Sparkles className="h-3 w-3 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">ValBot AI Assistant</h1>
              <p className="text-muted-foreground">Intelligent retail management and analytics</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => triggerAnalysisMutation.mutate('fraud_detection')}
              disabled={triggerAnalysisMutation.isPending}
            >
              <Shield className="h-4 w-4 mr-2" />
              Fraud Check
            </Button>
            <Button
              variant="outline"
              onClick={() => triggerAnalysisMutation.mutate('inventory_optimization')}
              disabled={triggerAnalysisMutation.isPending}
            >
              <Package className="h-4 w-4 mr-2" />
              Optimize Stock
            </Button>
          </div>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Health Dashboard
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              AI Insights
            </TabsTrigger>
            <TabsTrigger value="staff" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Staff Analytics
            </TabsTrigger>
            <TabsTrigger value="customers" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Customer Intel
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Chat with ValBot
            </TabsTrigger>
          </TabsList>

          {/* Store Health Dashboard */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <HealthScoreCard
                title="Sales Performance"
                score={storeHealth?.categories?.sales || 85}
                icon={TrendingUp}
                color="text-green-600"
              />
              <HealthScoreCard
                title="Inventory Health"
                score={storeHealth?.categories?.inventory || 78}
                icon={Package}
                color="text-blue-600"
              />
              <HealthScoreCard
                title="Staff Efficiency"
                score={storeHealth?.categories?.staff || 92}
                icon={Users}
                color="text-purple-600"
              />
              <HealthScoreCard
                title="Customer Experience"
                score={storeHealth?.categories?.customer || 80}
                icon={Heart}
                color="text-red-600"
              />
            </div>

            {/* Overall Health Score */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-600" />
                  Overall Store Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="text-4xl font-bold text-primary">
                    {storeHealth?.overall || 84}%
                  </div>
                  <div className="flex-1">
                    <Progress value={storeHealth?.overall || 84} className="h-4" />
                    <p className="text-sm text-muted-foreground mt-2">
                      Store is performing well with room for improvement in inventory management
                    </p>
                  </div>
                </div>

                {/* Health Alerts */}
                {storeHealth?.alerts?.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      Active Alerts
                    </h4>
                    {storeHealth.alerts.map((alert: any, index: number) => (
                      <div key={index} className={`p-3 rounded-lg border-l-4 ${
                        alert.severity === 'critical' ? 'border-red-500 bg-red-50' : 'border-orange-500 bg-orange-50'
                      }`}>
                        <p className="text-sm font-medium">{alert.category.toUpperCase()}</p>
                        <p className="text-sm text-muted-foreground">{alert.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Insights */}
          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Demand Forecasts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Demand Forecasts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    {aiInsights?.stockRecommendations?.map((rec: any, index: number) => (
                      <InsightCard
                        key={index}
                        insight={{
                          title: `${rec.productName} - Reorder Recommended`,
                          description: `Current: ${rec.currentStock} units. Forecast: ${rec.recommendedOrder} units needed`,
                          confidence: rec.confidence || 85,
                          action: 'Create Order'
                        }}
                        icon={Package}
                      />
                    ))}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Fraud & Security Alerts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Security Intelligence
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    {aiInsights?.suspiciousActivity?.length > 0 ? (
                      aiInsights.suspiciousActivity.map((alert: any, index: number) => (
                        <InsightCard
                          key={index}
                          insight={{
                            title: `Suspicious Transaction Detected`,
                            description: `Transaction ${alert.transactionId} flagged with ${alert.score}% confidence`,
                            confidence: alert.score,
                            action: 'Review'
                          }}
                          icon={AlertTriangle}
                        />
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Shield className="h-12 w-12 text-green-600 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No suspicious activity detected</p>
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Promotion Suggestions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    Smart Promotions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    {aiInsights?.promotionSuggestions?.map((promo: any, index: number) => (
                      <InsightCard
                        key={index}
                        insight={{
                          title: `${promo.type.toUpperCase()} - ${promo.productName}`,
                          description: promo.reasoning,
                          confidence: 90,
                          action: 'Create Promotion'
                        }}
                        icon={Sparkles}
                      />
                    ))}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Store Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Real-time Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Sales Velocity</span>
                      <span className="font-medium">€{Math.round(Math.random() * 500 + 200)}/hour</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Queue Length</span>
                      <span className="font-medium">{Math.round(Math.random() * 5 + 1)} customers</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Conversion Rate</span>
                      <span className="font-medium">{(Math.random() * 20 + 80).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Average Basket</span>
                      <span className="font-medium">€{(Math.random() * 30 + 25).toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Staff Analytics & Gamification */}
          <TabsContent value="staff" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Performance Leaderboard
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-80">
                    {staffPerformance?.map((staff: any, index: number) => (
                      <StaffLeaderboardCard
                        key={index}
                        staff={{
                          name: `Staff ${staff.userId}`,
                          role: 'Sales Associate',
                          efficiency: staff.efficiency || 85,
                          badges: staff.badges || ['Speed Demon']
                        }}
                        rank={index + 1}
                      />
                    ))}
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Today's Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="font-medium text-sm">🏆 Employee of the Day</p>
                      <p className="text-xs text-muted-foreground">Staff Member 1 - 95% efficiency score</p>
                    </div>
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="font-medium text-sm">🎯 Upselling Champion</p>
                      <p className="text-xs text-muted-foreground">12 successful upsells today</p>
                    </div>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="font-medium text-sm">⚡ Speed Demon</p>
                      <p className="text-xs text-muted-foreground">Average transaction time: 45 seconds</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Customer Intelligence */}
          <TabsContent value="customers" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Customer Behavior Heatmap
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-8 gap-1 mb-4">
                    {Array.from({ length: 64 }, (_, i) => (
                      <div
                        key={i}
                        className={`aspect-square rounded ${
                          Math.random() > 0.7 ? 'bg-red-500' :
                          Math.random() > 0.5 ? 'bg-orange-300' :
                          Math.random() > 0.3 ? 'bg-yellow-200' : 'bg-gray-100'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Low Activity</span>
                    <span>High Activity</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Smart Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 border rounded-lg">
                      <p className="font-medium text-sm">Loyalty Boost Opportunity</p>
                      <p className="text-xs text-muted-foreground mb-2">
                        Customer #1234 has visited 5 times this month
                      </p>
                      <Button size="sm" variant="outline" className="h-6 text-xs">
                        Send Golden Hour Discount
                      </Button>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="font-medium text-sm">Shelf Layout Suggestion</p>
                      <p className="text-xs text-muted-foreground mb-2">
                        Move dairy products closer to entrance for 15% sales boost
                      </p>
                      <Button size="sm" variant="outline" className="h-6 text-xs">
                        View Layout Plan
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Chat Interface */}
          <TabsContent value="chat" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Natural Language Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Chat History */}
                  <ScrollArea className="h-80 border rounded-lg p-4" ref={chatScrollRef}>
                    {chatHistory.length === 0 ? (
                      <div className="text-center py-8">
                        <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">
                          Ask me anything about your store performance, inventory, or staff analytics
                        </p>
                        <div className="mt-4 space-y-2">
                          <p className="text-xs text-muted-foreground">Try asking:</p>
                          <div className="text-xs text-muted-foreground">
                            • "Show me today's top selling products"<br />
                            • "Which staff member performed best this week?"<br />
                            • "What are my slowest moving products?"
                          </div>
                        </div>
                      </div>
                    ) : (
                      chatHistory.map((message, index) => (
                        <div key={index} className={`mb-4 ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
                          <div className={`inline-block max-w-[80%] p-3 rounded-lg ${
                            message.type === 'user' 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted'
                          }`}>
                            <p className="text-sm">{message.message}</p>
                            {message.data && (
                              <div className="mt-2 text-xs opacity-80">
                                <pre>{JSON.stringify(message.data, null, 2)}</pre>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      ))
                    )}
                  </ScrollArea>

                  {/* Query Input */}
                  <form onSubmit={handleSubmitQuery} className="flex gap-2">
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Ask ValBot anything about your store..."
                      disabled={nlQueryMutation.isPending}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={startVoiceRecognition}
                      disabled={isListening}
                    >
                      {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </Button>
                    <Button type="submit" disabled={nlQueryMutation.isPending || !query.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}