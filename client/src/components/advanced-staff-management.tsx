import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Clock, 
  Users, 
  Target, 
  MessageSquare, 
  Trophy,
  Play,
  Pause,
  Square,
  Coffee,
  DollarSign,
  TrendingUp,
  Bell,
  Send,
  Calendar as CalendarIcon,
  CheckCircle,
  AlertCircle,
  Settings,
  BarChart3,
  Award,
  Star,
  Zap,
  Eye,
  Filter,
  Download,
  Upload,
  Plus,
  Edit,
  Trash2,
  Search,
  Timer,
  LogIn,
  LogOut,
  Calendar as CalendarIconSolid
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
  employeeId: string;
  isActive: boolean;
  createdAt: string;
  lastLogin: string;
}

interface TimeClock {
  id: number;
  userId: number;
  clockIn: string;
  clockOut?: string;
  breakStart?: string;
  breakEnd?: string;
  totalHours?: number;
  hourlyRate?: number;
  overtimeHours?: number;
  status: string;
  tillId?: string;
  notes?: string;
  createdAt: string;
}

interface StaffIncentive {
  id: number;
  userId: number;
  incentiveType: string;
  targetValue?: number;
  currentValue?: number;
  bonusAmount?: number;
  periodStart: string;
  periodEnd: string;
  status: string;
  achievedAt?: string;
  createdAt: string;
}

interface StaffMessage {
  id: number;
  fromUserId?: number;
  toUserId?: number;
  messageType: string;
  title: string;
  content: string;
  priority: string;
  readAt?: string;
  expiresAt?: string;
  tillId?: string;
  createdAt: string;
}

export default function AdvancedStaffManagement() {
  const [selectedTab, setSelectedTab] = useState('time-clock');
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [showIncentiveDialog, setShowIncentiveDialog] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [newIncentive, setNewIncentive] = useState({
    userId: 0,
    incentiveType: '',
    targetValue: 0,
    bonusAmount: 0,
    periodStart: new Date(),
    periodEnd: new Date()
  });
  const [newMessage, setNewMessage] = useState({
    messageType: 'bulletin',
    title: '',
    content: '',
    priority: 'normal',
    toUserId: null as number | null,
    tillId: '',
    expiresAt: null as Date | null
  });
  const [timeFilters, setTimeFilters] = useState({
    status: 'all',
    date: new Date()
  });
  const [messageFilters, setMessageFilters] = useState({
    messageType: 'all',
    priority: 'all'
  });

  const queryClient = useQueryClient();

  // Fetch users
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
    refetchInterval: 30000
  });

  // Fetch time clock records
  const { data: timeClocks = [] } = useQuery<TimeClock[]>({
    queryKey: ['/api/time-clock'],
    refetchInterval: 30000
  });

  // Fetch active time clocks
  const { data: activeTimeClocks = [] } = useQuery<TimeClock[]>({
    queryKey: ['/api/time-clock/active'],
    refetchInterval: 10000
  });

  // Fetch staff incentives
  const { data: staffIncentives = [] } = useQuery<StaffIncentive[]>({
    queryKey: ['/api/staff-incentives'],
    refetchInterval: 60000
  });

  // Fetch staff messages
  const { data: staffMessages = [] } = useQuery<StaffMessage[]>({
    queryKey: ['/api/staff-messages'],
    refetchInterval: 30000
  });

  // Fetch bulletins
  const { data: bulletins = [] } = useQuery<StaffMessage[]>({
    queryKey: ['/api/staff-messages/bulletins'],
    refetchInterval: 30000
  });

  // Time clock mutations
  const clockInUser = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(`/api/time-clock/clock-in/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tillId: 'POS-1' })
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/time-clock'] });
      toast({ title: 'Clocked in successfully' });
    }
  });

  const clockOutUser = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(`/api/time-clock/clock-out/${userId}`, {
        method: 'POST'
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/time-clock'] });
      toast({ title: 'Clocked out successfully' });
    }
  });

  const startBreak = useMutation({
    mutationFn: async (clockId: number) => {
      const response = await fetch(`/api/time-clock/${clockId}/start-break`, {
        method: 'POST'
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/time-clock'] });
      toast({ title: 'Break started' });
    }
  });

  const endBreak = useMutation({
    mutationFn: async (clockId: number) => {
      const response = await fetch(`/api/time-clock/${clockId}/end-break`, {
        method: 'POST'
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/time-clock'] });
      toast({ title: 'Break ended' });
    }
  });

  // Incentive mutations
  const createIncentive = useMutation({
    mutationFn: async (incentive: any) => {
      const response = await fetch('/api/staff-incentives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incentive)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/staff-incentives'] });
      toast({ title: 'Incentive created successfully' });
      setShowIncentiveDialog(false);
    }
  });

  const updateIncentive = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      const response = await fetch(`/api/staff-incentives/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/staff-incentives'] });
      toast({ title: 'Incentive updated successfully' });
    }
  });

  // Message mutations
  const createMessage = useMutation({
    mutationFn: async (message: any) => {
      const response = await fetch('/api/staff-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/staff-messages'] });
      toast({ title: 'Message sent successfully' });
      setShowMessageDialog(false);
    }
  });

  const markMessageAsRead = useMutation({
    mutationFn: async (messageId: number) => {
      const response = await fetch(`/api/staff-messages/${messageId}/read`, {
        method: 'POST'
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/staff-messages'] });
    }
  });

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'break': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getIncentiveStatusColor = (status: string) => {
    switch (status) {
      case 'achieved': return 'bg-green-100 text-green-800';
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUserName = (userId: number) => {
    const user = users.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : 'Unknown';
  };

  const getActiveTimeClock = (userId: number) => {
    return activeTimeClocks.find(tc => tc.userId === userId);
  };

  const calculateHours = (clockIn: string, clockOut?: string) => {
    const start = new Date(clockIn);
    const end = clockOut ? new Date(clockOut) : new Date();
    const diff = end.getTime() - start.getTime();
    return Math.round(diff / (1000 * 60 * 60) * 100) / 100;
  };

  const calculateProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const handleIncentiveSubmit = () => {
    const incentive = {
      ...newIncentive,
      periodStart: format(newIncentive.periodStart, 'yyyy-MM-dd'),
      periodEnd: format(newIncentive.periodEnd, 'yyyy-MM-dd')
    };
    createIncentive.mutate(incentive);
  };

  const handleMessageSubmit = () => {
    const message = {
      ...newMessage,
      expiresAt: newMessage.expiresAt ? format(newMessage.expiresAt, 'yyyy-MM-dd HH:mm:ss') : null
    };
    createMessage.mutate(message);
  };

  const filteredTimeClocks = timeClocks.filter(tc => {
    if (timeFilters.status !== 'all' && tc.status !== timeFilters.status) return false;
    const tcDate = new Date(tc.createdAt);
    const filterDate = timeFilters.date;
    return tcDate.toDateString() === filterDate.toDateString();
  });

  const filteredMessages = staffMessages.filter(msg => {
    if (messageFilters.messageType !== 'all' && msg.messageType !== messageFilters.messageType) return false;
    if (messageFilters.priority !== 'all' && msg.priority !== messageFilters.priority) return false;
    return true;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Advanced Staff Management</h1>
        <p className="text-gray-600">Time tracking, incentives, and staff communication</p>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="time-clock">
            <Clock className="w-4 h-4 mr-2" />
            Time Clock
          </TabsTrigger>
          <TabsTrigger value="incentives">
            <Target className="w-4 h-4 mr-2" />
            Incentives
          </TabsTrigger>
          <TabsTrigger value="messages">
            <MessageSquare className="w-4 h-4 mr-2" />
            Messages
          </TabsTrigger>
        </TabsList>

        <TabsContent value="time-clock">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Active Staff */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Active Staff
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {users.filter(u => u.isActive).map(user => {
                    const activeClock = getActiveTimeClock(user.id);
                    const isWorking = activeClock?.status === 'active';
                    const onBreak = activeClock?.status === 'break';
                    
                    return (
                      <div key={user.id} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback>
                              {user.firstName[0]}{user.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.firstName} {user.lastName}</div>
                            <div className="text-sm text-gray-500">{user.role}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isWorking && (
                            <Badge className="bg-green-100 text-green-800">
                              Working {activeClock ? calculateHours(activeClock.clockIn).toFixed(1) : 0}h
                            </Badge>
                          )}
                          {onBreak && (
                            <Badge className="bg-yellow-100 text-yellow-800">
                              On Break
                            </Badge>
                          )}
                          {!isWorking && !onBreak && (
                            <Badge variant="outline">
                              Off Duty
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Time Clock Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Timer className="w-5 h-5" />
                  Time Clock Controls
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="staff-select">Select Staff Member</Label>
                    <Select value={selectedUser?.toString()} onValueChange={(value) => setSelectedUser(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select staff..." />
                      </SelectTrigger>
                      <SelectContent>
                        {users.filter(u => u.isActive).map(user => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.firstName} {user.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedUser && (
                    <div className="space-y-3">
                      {(() => {
                        const activeClock = getActiveTimeClock(selectedUser);
                        const isWorking = activeClock?.status === 'active';
                        const onBreak = activeClock?.status === 'break';

                        return (
                          <>
                            <div className="grid grid-cols-2 gap-2">
                              <Button
                                onClick={() => clockInUser.mutate(selectedUser)}
                                disabled={isWorking || onBreak}
                                className="flex items-center gap-2"
                              >
                                <LogIn className="w-4 h-4" />
                                Clock In
                              </Button>
                              <Button
                                onClick={() => clockOutUser.mutate(selectedUser)}
                                disabled={!isWorking && !onBreak}
                                variant="outline"
                                className="flex items-center gap-2"
                              >
                                <LogOut className="w-4 h-4" />
                                Clock Out
                              </Button>
                            </div>
                            
                            {activeClock && (
                              <div className="grid grid-cols-2 gap-2">
                                <Button
                                  onClick={() => startBreak.mutate(activeClock.id)}
                                  disabled={onBreak || !isWorking}
                                  variant="outline"
                                  size="sm"
                                  className="flex items-center gap-2"
                                >
                                  <Coffee className="w-4 h-4" />
                                  Start Break
                                </Button>
                                <Button
                                  onClick={() => endBreak.mutate(activeClock.id)}
                                  disabled={!onBreak}
                                  variant="outline"
                                  size="sm"
                                  className="flex items-center gap-2"
                                >
                                  <Play className="w-4 h-4" />
                                  End Break
                                </Button>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Today's Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Today's Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded">
                      <div className="text-2xl font-bold text-blue-600">
                        {activeTimeClocks.filter(tc => tc.status === 'active').length}
                      </div>
                      <div className="text-sm text-blue-600">Currently Working</div>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded">
                      <div className="text-2xl font-bold text-yellow-600">
                        {activeTimeClocks.filter(tc => tc.status === 'break').length}
                      </div>
                      <div className="text-sm text-yellow-600">On Break</div>
                    </div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded">
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round(timeClocks.filter(tc => tc.createdAt.startsWith(new Date().toISOString().split('T')[0]))
                        .reduce((sum, tc) => sum + (tc.totalHours || 0), 0) * 10) / 10}
                    </div>
                    <div className="text-sm text-green-600">Total Hours Today</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Time Clock History */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Time Clock History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex gap-4">
                  <div>
                    <Label>Status Filter</Label>
                    <Select value={timeFilters.status} onValueChange={(value) => setTimeFilters({...timeFilters, status: value})}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="break">Break</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline">
                          <CalendarIconSolid className="w-4 h-4 mr-2" />
                          {format(timeFilters.date, 'PPP')}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={timeFilters.date}
                          onSelect={(date) => date && setTimeFilters({...timeFilters, date})}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Staff</th>
                        <th className="text-left p-2">Clock In</th>
                        <th className="text-left p-2">Clock Out</th>
                        <th className="text-left p-2">Total Hours</th>
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">Till</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTimeClocks.map(timeClock => (
                        <tr key={timeClock.id} className="border-b">
                          <td className="p-2">{getUserName(timeClock.userId)}</td>
                          <td className="p-2">{format(new Date(timeClock.clockIn), 'HH:mm')}</td>
                          <td className="p-2">
                            {timeClock.clockOut ? format(new Date(timeClock.clockOut), 'HH:mm') : '-'}
                          </td>
                          <td className="p-2">
                            {timeClock.totalHours?.toFixed(1) || calculateHours(timeClock.clockIn, timeClock.clockOut).toFixed(1)}h
                          </td>
                          <td className="p-2">
                            <Badge className={getStatusColor(timeClock.status)}>
                              {timeClock.status}
                            </Badge>
                          </td>
                          <td className="p-2">{timeClock.tillId || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="incentives">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Incentive Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Incentive Controls
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button 
                    onClick={() => setShowIncentiveDialog(true)}
                    className="w-full"
                  >
                    <Trophy className="w-4 h-4 mr-2" />
                    Create Incentive
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Export Report
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Settings className="w-4 h-4 mr-2" />
                    Incentive Settings
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Incentive Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Incentive Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-3 bg-green-50 rounded">
                    <div className="text-2xl font-bold text-green-600">
                      {staffIncentives.filter(i => i.status === 'achieved').length}
                    </div>
                    <div className="text-sm text-green-600">Achieved</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded">
                    <div className="text-2xl font-bold text-blue-600">
                      {staffIncentives.filter(i => i.status === 'active').length}
                    </div>
                    <div className="text-sm text-blue-600">Active</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded">
                    <div className="text-2xl font-bold text-yellow-600">
                      €{staffIncentives.filter(i => i.status === 'achieved')
                        .reduce((sum, i) => sum + (i.bonusAmount || 0), 0).toFixed(2)}
                    </div>
                    <div className="text-sm text-yellow-600">Total Bonuses</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Performers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Top Performers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {users.slice(0, 5).map((user, index) => (
                    <div key={user.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{user.firstName} {user.lastName}</div>
                          <div className="text-xs text-gray-500">{user.role}</div>
                        </div>
                      </div>
                      <div className="text-sm font-medium text-green-600">
                        {staffIncentives.filter(i => i.userId === user.id && i.status === 'achieved').length} goals
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full">
                    <Target className="w-4 h-4 mr-2" />
                    Set Team Goal
                  </Button>
                  <Button variant="outline" className="w-full">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Bonus Calculator
                  </Button>
                  <Button variant="outline" className="w-full">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Performance Report
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Active Incentives */}
            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Active Incentives
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {staffIncentives.filter(i => i.status === 'active').map(incentive => {
                    const progress = incentive.targetValue && incentive.currentValue 
                      ? calculateProgress(incentive.currentValue, incentive.targetValue)
                      : 0;
                    
                    return (
                      <div key={incentive.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">{getUserName(incentive.userId)}</div>
                          <Badge className={getIncentiveStatusColor(incentive.status)}>
                            {incentive.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          {incentive.incentiveType.replace('_', ' ')}
                        </div>
                        <div className="mb-2">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Progress</span>
                            <span>{progress.toFixed(1)}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                        <div className="text-sm text-gray-600">
                          Target: €{incentive.targetValue} • Bonus: €{incentive.bonusAmount}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {format(new Date(incentive.periodStart), 'MMM d')} - {format(new Date(incentive.periodEnd), 'MMM d')}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="messages">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Message Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  Message Controls
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button 
                    onClick={() => setShowMessageDialog(true)}
                    className="w-full"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    New Message
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Bell className="w-4 h-4 mr-2" />
                    Send Alert
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Settings className="w-4 h-4 mr-2" />
                    Message Settings
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Message Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <Label>Message Type</Label>
                    <Select value={messageFilters.messageType} onValueChange={(value) => setMessageFilters({...messageFilters, messageType: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="bulletin">Bulletin</SelectItem>
                        <SelectItem value="shift_note">Shift Note</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                        <SelectItem value="alert">Alert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Priority</Label>
                    <Select value={messageFilters.priority} onValueChange={(value) => setMessageFilters({...messageFilters, priority: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priorities</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bulletin Board */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Bulletin Board
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {bulletins.slice(0, 5).map(bulletin => (
                    <div key={bulletin.id} className="p-3 border rounded">
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-medium text-sm">{bulletin.title}</div>
                        <Badge className={getPriorityColor(bulletin.priority)}>
                          {bulletin.priority}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-600 mb-2">
                        {bulletin.content.substring(0, 100)}...
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(bulletin.createdAt), 'MMM d, HH:mm')}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Message Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Message Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-3 bg-blue-50 rounded">
                    <div className="text-2xl font-bold text-blue-600">
                      {staffMessages.filter(m => !m.readAt).length}
                    </div>
                    <div className="text-sm text-blue-600">Unread</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded">
                    <div className="text-2xl font-bold text-red-600">
                      {staffMessages.filter(m => m.priority === 'urgent').length}
                    </div>
                    <div className="text-sm text-red-600">Urgent</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded">
                    <div className="text-2xl font-bold text-green-600">
                      {staffMessages.filter(m => m.messageType === 'bulletin').length}
                    </div>
                    <div className="text-sm text-green-600">Bulletins</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* All Messages */}
            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  All Messages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredMessages.map(message => (
                    <div key={message.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="font-medium">{message.title}</div>
                          <Badge className={getPriorityColor(message.priority)}>
                            {message.priority}
                          </Badge>
                          <Badge variant="outline">
                            {message.messageType.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          {!message.readAt && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                          <div className="text-sm text-gray-500">
                            {format(new Date(message.createdAt), 'MMM d, HH:mm')}
                          </div>
                        </div>
                      </div>
                      <div className="text-gray-700 mb-2">{message.content}</div>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div>
                          {message.fromUserId ? `From: ${getUserName(message.fromUserId)}` : 'System'}
                          {message.toUserId && ` • To: ${getUserName(message.toUserId)}`}
                        </div>
                        {!message.readAt && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => markMessageAsRead.mutate(message.id)}
                          >
                            Mark Read
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Incentive Dialog */}
      <Dialog open={showIncentiveDialog} onOpenChange={setShowIncentiveDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Incentive</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Staff Member</Label>
              <Select value={newIncentive.userId.toString()} onValueChange={(value) => setNewIncentive({...newIncentive, userId: parseInt(value)})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select staff..." />
                </SelectTrigger>
                <SelectContent>
                  {users.filter(u => u.isActive).map(user => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.firstName} {user.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Incentive Type</Label>
              <Select value={newIncentive.incentiveType} onValueChange={(value) => setNewIncentive({...newIncentive, incentiveType: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales_target">Sales Target</SelectItem>
                  <SelectItem value="upsell_bonus">Upsell Bonus</SelectItem>
                  <SelectItem value="customer_service">Customer Service</SelectItem>
                  <SelectItem value="attendance">Attendance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Target Value</Label>
                <Input
                  type="number"
                  value={newIncentive.targetValue}
                  onChange={(e) => setNewIncentive({...newIncentive, targetValue: parseFloat(e.target.value)})}
                />
              </div>
              <div>
                <Label>Bonus Amount</Label>
                <Input
                  type="number"
                  value={newIncentive.bonusAmount}
                  onChange={(e) => setNewIncentive({...newIncentive, bonusAmount: parseFloat(e.target.value)})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Period Start</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline">
                      <CalendarIconSolid className="w-4 h-4 mr-2" />
                      {format(newIncentive.periodStart, 'MMM d')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={newIncentive.periodStart}
                      onSelect={(date) => date && setNewIncentive({...newIncentive, periodStart: date})}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Period End</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline">
                      <CalendarIconSolid className="w-4 h-4 mr-2" />
                      {format(newIncentive.periodEnd, 'MMM d')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={newIncentive.periodEnd}
                      onSelect={(date) => date && setNewIncentive({...newIncentive, periodEnd: date})}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleIncentiveSubmit} className="flex-1">
                Create Incentive
              </Button>
              <Button variant="outline" onClick={() => setShowIncentiveDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Message Dialog */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Send Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Message Type</Label>
              <Select value={newMessage.messageType} onValueChange={(value) => setNewMessage({...newMessage, messageType: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bulletin">Bulletin</SelectItem>
                  <SelectItem value="shift_note">Shift Note</SelectItem>
                  <SelectItem value="private">Private Message</SelectItem>
                  <SelectItem value="alert">Alert</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={newMessage.priority} onValueChange={(value) => setNewMessage({...newMessage, priority: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newMessage.messageType === 'private' && (
              <div>
                <Label>Recipient</Label>
                <Select value={newMessage.toUserId?.toString()} onValueChange={(value) => setNewMessage({...newMessage, toUserId: parseInt(value)})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select recipient..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users.filter(u => u.isActive).map(user => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.firstName} {user.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Title</Label>
              <Input
                value={newMessage.title}
                onChange={(e) => setNewMessage({...newMessage, title: e.target.value})}
                placeholder="Message title..."
              />
            </div>
            <div>
              <Label>Content</Label>
              <Textarea
                value={newMessage.content}
                onChange={(e) => setNewMessage({...newMessage, content: e.target.value})}
                placeholder="Message content..."
                rows={4}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleMessageSubmit} className="flex-1">
                Send Message
              </Button>
              <Button variant="outline" onClick={() => setShowMessageDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}