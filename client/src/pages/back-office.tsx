import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  BarChart3, 
  Package, 
  Users, 
  Truck, 
  Settings,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  Eye,
  Edit,
  Trash2,
  Plus,
  Download,
  Upload,
  FileText,
  Calendar,
  Clock,
  CreditCard,
  Banknote,
  Receipt,
  Target,
  Activity,
  PieChart,
  LineChart
} from "lucide-react";
import { StatusPanels } from "@/components/status-panels";
import { LoginBanner } from "@/components/login-banner";
import type { Product, Transaction, Customer, Supplier, User } from "@shared/schema";

interface BackOfficeProps {
  onBackToMenu: () => void;
}

export default function BackOffice({ onBackToMenu }: BackOfficeProps) {
  const [activeSection, setActiveSection] = useState("dashboard");

  // Fetch data for all sections
  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
  });

  const { data: customers = [], isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: ['/api/customers'],
  });

  const { data: suppliers = [], isLoading: suppliersLoading } = useQuery<Supplier[]>({
    queryKey: ['/api/suppliers'],
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  // Calculate dashboard metrics
  const lowStockProducts = products.filter(p => p.stock <= (p.minStock || 10));
  const outOfStockProducts = products.filter(p => p.stock === 0);
  const totalInventoryValue = products.reduce((sum, p) => sum + (p.stock * parseFloat(p.cost?.toString() || '0')), 0);
  
  const todayRevenue = transactions
    .filter(t => new Date(t.createdAt).toDateString() === new Date().toDateString())
    .reduce((sum, t) => sum + parseFloat(t.total.toString()), 0);
  
  const weeklyRevenue = transactions
    .filter(t => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(t.createdAt) >= weekAgo;
    })
    .reduce((sum, t) => sum + parseFloat(t.total.toString()), 0);

  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "inventory", label: "Inventory", icon: Package },
    { id: "sales", label: "Sales & Reports", icon: TrendingUp },
    { id: "customers", label: "Customers", icon: Users },
    { id: "suppliers", label: "Suppliers", icon: Truck },
    { id: "staff", label: "Staff Management", icon: Users },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Status Panels */}
      <StatusPanels className="mb-6" />
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="kxl-status-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">€{todayRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              +12.5% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card className="kxl-status-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">€{weeklyRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              +8.2% from last week
            </p>
          </CardContent>
        </Card>

        <Card className="kxl-status-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">€{totalInventoryValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {products.length} total products
            </p>
          </CardContent>
        </Card>

        <Card className="kxl-status-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{customers.length}</div>
            <p className="text-xs text-muted-foreground">
              +3 new this week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {transactions.slice(0, 10).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Receipt className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="font-medium">Transaction #{transaction.id}</p>
                        <p className="text-sm text-gray-500">{transaction.tillId}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">€{parseFloat(transaction.total.toString()).toFixed(2)}</p>
                      <p className="text-sm text-gray-500">{transaction.paymentMethod}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <span>Stock Alerts</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {lowStockProducts.length > 0 ? (
                  lowStockProducts.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg border-orange-200 bg-orange-50">
                      <div className="flex items-center space-x-3">
                        <Package className="h-4 w-4 text-orange-500" />
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-gray-500">Stock: {product.stock}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-orange-600 border-orange-300">
                        Low Stock
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">All products are well stocked</p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderInventory = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Inventory Management</h2>
          <p className="text-gray-600">Manage products, stock levels, and suppliers</p>
        </div>
        <div className="flex space-x-2">
          <Button className="kxl-emerald-button">
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{products.length}</div>
            <p className="text-sm text-gray-500">Active inventory items</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-500">{lowStockProducts.length}</div>
            <p className="text-sm text-gray-500">Need restocking</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Out of Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-500">{outOfStockProducts.length}</div>
            <p className="text-sm text-gray-500">Immediate attention</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-2">
              {products.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <Package className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-gray-500">SKU: {product.barcode}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-medium">€{parseFloat(product.price.toString()).toFixed(2)}</p>
                      <p className="text-sm text-gray-500">Stock: {product.stock}</p>
                    </div>
                    <div className="flex space-x-1">
                      <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-500 hover:text-red-700">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );

  const renderSales = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sales & Reports</h2>
          <p className="text-gray-600">View sales data and generate reports</p>
        </div>
        <div className="flex space-x-2">
          <Button className="kxl-emerald-button">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Generate Z Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Today's Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">€{todayRevenue.toFixed(2)}</div>
            <p className="text-sm text-gray-500">{transactions.filter(t => new Date(t.createdAt).toDateString() === new Date().toDateString()).length} transactions</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Weekly Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">€{weeklyRevenue.toFixed(2)}</div>
            <p className="text-sm text-gray-500">7-day period</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Average Transaction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              €{transactions.length > 0 ? (todayRevenue / transactions.filter(t => new Date(t.createdAt).toDateString() === new Date().toDateString()).length || 0).toFixed(2) : '0.00'}
            </div>
            <p className="text-sm text-gray-500">Per sale</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{transactions.length}</div>
            <p className="text-sm text-gray-500">All time</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-2">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <Receipt className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium">Transaction #{transaction.id}</p>
                      <p className="text-sm text-gray-500">{new Date(transaction.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-medium">€{parseFloat(transaction.total.toString()).toFixed(2)}</p>
                      <p className="text-sm text-gray-500">{transaction.paymentMethod}</p>
                    </div>
                    <Badge variant="outline">{transaction.tillId}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );

  const renderCustomers = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Customer Management</h2>
          <p className="text-gray-600">Manage customer accounts and loyalty</p>
        </div>
        <div className="flex space-x-2">
          <Button className="kxl-emerald-button">
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{customers.length}</div>
            <p className="text-sm text-gray-500">Active accounts</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>New This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-secondary">12</div>
            <p className="text-sm text-gray-500">+15% growth</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Loyalty Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">45</div>
            <p className="text-sm text-gray-500">Active memberships</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer Database</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-2">
              {customers.map((customer) => (
                <div key={customer.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <Users className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium">{customer.name}</p>
                      <p className="text-sm text-gray-500">{customer.email || 'No email'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-medium">{customer.phone || 'No phone'}</p>
                      <p className="text-sm text-gray-500">Customer #{customer.id}</p>
                    </div>
                    <div className="flex space-x-1">
                      <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );

  const renderSuppliers = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Supplier Management</h2>
          <p className="text-gray-600">Manage vendors and purchase orders</p>
        </div>
        <div className="flex space-x-2">
          <Button className="kxl-emerald-button">
            <Plus className="h-4 w-4 mr-2" />
            Add Supplier
          </Button>
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Purchase Order
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Active Suppliers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{suppliers.length}</div>
            <p className="text-sm text-gray-500">Vendor accounts</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Pending Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-500">3</div>
            <p className="text-sm text-gray-500">Awaiting delivery</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Monthly Spend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">€2,450</div>
            <p className="text-sm text-gray-500">This month</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Supplier Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-2">
              {suppliers.map((supplier) => (
                <div key={supplier.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <Truck className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium">{supplier.name}</p>
                      <p className="text-sm text-gray-500">{supplier.email || 'No email'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-medium">{supplier.phone || 'No phone'}</p>
                      <p className="text-sm text-gray-500">Supplier #{supplier.id}</p>
                    </div>
                    <div className="flex space-x-1">
                      <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );

  const renderStaff = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Staff Management</h2>
          <p className="text-gray-600">Manage employees, roles, and permissions</p>
        </div>
        <div className="flex space-x-2">
          <Button className="kxl-emerald-button">
            <Plus className="h-4 w-4 mr-2" />
            Add Staff Member
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export List
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Staff</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{users.length}</div>
            <p className="text-sm text-gray-500">Active employees</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-500">{users.filter(u => u.role === 'admin').length}</div>
            <p className="text-sm text-gray-500">Full access</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Managers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-500">{users.filter(u => u.role === 'manager').length}</div>
            <p className="text-sm text-gray-500">Management level</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Cashiers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">{users.filter(u => u.role === 'cashier').length}</div>
            <p className="text-sm text-gray-500">POS access</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Staff Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-2">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <Users className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium">{user.firstName} {user.lastName}</p>
                      <p className="text-sm text-gray-500">{user.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge 
                      variant="outline" 
                      className={
                        user.role === 'admin' ? 'text-red-600 border-red-300' :
                        user.role === 'manager' ? 'text-blue-600 border-blue-300' :
                        'text-green-600 border-green-300'
                      }
                    >
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </Badge>
                    <div className="flex space-x-1">
                      <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">System Settings</h2>
        <p className="text-gray-600">Configure store settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Store Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Store Name</label>
              <p className="text-gray-700">Kerrigan's XL Manorhamilton</p>
            </div>
            <div>
              <label className="text-sm font-medium">VAT Number</label>
              <p className="text-gray-700">IE1234567V</p>
            </div>
            <div>
              <label className="text-sm font-medium">Address</label>
              <p className="text-gray-700">Main Street, Manorhamilton, Co. Leitrim</p>
            </div>
            <Button className="kxl-emerald-button">Update Information</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Till Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Active Tills</label>
              <p className="text-gray-700">Till 1, Till 2</p>
            </div>
            <div>
              <label className="text-sm font-medium">Receipt Footer</label>
              <p className="text-gray-700">Thank you for shopping with us!</p>
            </div>
            <div>
              <label className="text-sm font-medium">Tax Rate</label>
              <p className="text-gray-700">23% VAT</p>
            </div>
            <Button className="kxl-emerald-button">Configure Tills</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span>Cash Payments</span>
              <Badge variant="outline" className="text-green-600">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Card Payments</span>
              <Badge variant="outline" className="text-green-600">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Contactless</span>
              <Badge variant="outline" className="text-green-600">Active</Badge>
            </div>
            <Button className="kxl-emerald-button mt-4">Payment Settings</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Backup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Last Backup</label>
              <p className="text-gray-700">Today at 02:00</p>
            </div>
            <div>
              <label className="text-sm font-medium">Backup Frequency</label>
              <p className="text-gray-700">Daily automatic</p>
            </div>
            <div className="flex space-x-2">
              <Button className="kxl-emerald-button">Backup Now</Button>
              <Button variant="outline">Restore</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard": return renderDashboard();
      case "inventory": return renderInventory();
      case "sales": return renderSales();
      case "customers": return renderCustomers();
      case "suppliers": return renderSuppliers();
      case "staff": return renderStaff();
      case "settings": return renderSettings();
      default: return renderDashboard();
    }
  };

  return (
    <div className="h-screen flex bg-gray-50 kxl-neural-bg">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg border-r">
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold text-gray-900">Back Office</h1>
          <p className="text-sm text-gray-600">Management Dashboard</p>
        </div>
        
        <nav className="p-4">
          <div className="space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeSection === item.id
                      ? 'bg-primary text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
        
        <div className="absolute bottom-4 left-4 right-4">
          <Button 
            onClick={onBackToMenu}
            variant="outline" 
            className="w-full"
          >
            ← Back to Main Menu
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {sidebarItems.find(item => item.id === activeSection)?.label || 'Dashboard'}
              </h1>
              <p className="text-gray-600">Kerrigan's XL Management System</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">€{todayRevenue.toFixed(2)}</div>
              <div className="text-sm text-gray-500">Today's Revenue</div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 custom-scroll">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}