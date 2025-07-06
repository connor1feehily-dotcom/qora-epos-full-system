import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Settings, 
  Database, 
  HardDrive, 
  Wifi, 
  Shield, 
  RefreshCw, 
  Download, 
  Upload,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Activity,
  Clock,
  BarChart3
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function SystemMaintenance() {
  const [activeSection, setActiveSection] = useState("system-health");
  const { toast } = useToast();

  // Mock system health data
  const systemHealth = {
    database: { status: "healthy", uptime: "99.9%", connections: 15, size: "2.3GB" },
    server: { status: "healthy", cpu: 25, memory: 68, uptime: "7d 14h" },
    network: { status: "healthy", latency: "12ms", bandwidth: "95%" },
    storage: { status: "warning", used: "78%", available: "1.2TB", total: "5.5TB" },
    security: { status: "healthy", threats: 0, lastScan: "2 hours ago" }
  };

  const maintenanceTasks = [
    { id: 1, name: "Database Optimization", status: "completed", lastRun: "2024-01-05", nextRun: "2024-01-12" },
    { id: 2, name: "Log Cleanup", status: "pending", lastRun: "2024-01-04", nextRun: "2024-01-06" },
    { id: 3, name: "Cache Refresh", status: "running", lastRun: "2024-01-06", nextRun: "2024-01-06" },
    { id: 4, name: "Security Scan", status: "completed", lastRun: "2024-01-06", nextRun: "2024-01-13" },
    { id: 5, name: "Backup Verification", status: "failed", lastRun: "2024-01-05", nextRun: "2024-01-07" }
  ];

  const performanceMetrics = [
    { metric: "Response Time", current: "245ms", target: "< 300ms", status: "good" },
    { metric: "Throughput", current: "1,234 req/min", target: "> 1,000 req/min", status: "good" },
    { metric: "Error Rate", current: "0.05%", target: "< 1%", status: "good" },
    { metric: "CPU Usage", current: "25%", target: "< 80%", status: "good" },
    { metric: "Memory Usage", current: "68%", target: "< 85%", status: "warning" },
    { metric: "Disk I/O", current: "15%", target: "< 70%", status: "good" }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
      case "good":
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "warning":
      case "pending":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "error":
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "running":
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
      case "good":
      case "completed":
        return "text-green-600";
      case "warning":
      case "pending":
        return "text-yellow-600";
      case "error":
      case "failed":
        return "text-red-600";
      case "running":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  const runMaintenanceTask = (taskId: number) => {
    toast({ title: `Starting maintenance task ${taskId}...` });
    // In real app, this would call the API
  };

  const renderSystemHealth = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Database className="h-8 w-8 text-blue-500" />
                <div>
                  <h3 className="font-semibold">Database</h3>
                  <p className="text-sm text-gray-600">PostgreSQL</p>
                </div>
              </div>
              {getStatusIcon(systemHealth.database.status)}
            </div>
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span>Uptime</span>
                <span className="font-medium">{systemHealth.database.uptime}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Connections</span>
                <span className="font-medium">{systemHealth.database.connections}/50</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Size</span>
                <span className="font-medium">{systemHealth.database.size}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <HardDrive className="h-8 w-8 text-green-500" />
                <div>
                  <h3 className="font-semibold">Server</h3>
                  <p className="text-sm text-gray-600">Application Server</p>
                </div>
              </div>
              {getStatusIcon(systemHealth.server.status)}
            </div>
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span>CPU</span>
                <span className="font-medium">{systemHealth.server.cpu}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Memory</span>
                <span className="font-medium">{systemHealth.server.memory}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Uptime</span>
                <span className="font-medium">{systemHealth.server.uptime}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Wifi className="h-8 w-8 text-purple-500" />
                <div>
                  <h3 className="font-semibold">Network</h3>
                  <p className="text-sm text-gray-600">Connectivity</p>
                </div>
              </div>
              {getStatusIcon(systemHealth.network.status)}
            </div>
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span>Latency</span>
                <span className="font-medium">{systemHealth.network.latency}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Bandwidth</span>
                <span className="font-medium">{systemHealth.network.bandwidth}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <HardDrive className="h-8 w-8 text-orange-500" />
                <div>
                  <h3 className="font-semibold">Storage</h3>
                  <p className="text-sm text-gray-600">Disk Space</p>
                </div>
              </div>
              {getStatusIcon(systemHealth.storage.status)}
            </div>
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span>Used</span>
                <span className="font-medium">{systemHealth.storage.used}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Available</span>
                <span className="font-medium">{systemHealth.storage.available}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total</span>
                <span className="font-medium">{systemHealth.storage.total}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="h-8 w-8 text-red-500" />
                <div>
                  <h3 className="font-semibold">Security</h3>
                  <p className="text-sm text-gray-600">Protection Status</p>
                </div>
              </div>
              {getStatusIcon(systemHealth.security.status)}
            </div>
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span>Threats</span>
                <span className="font-medium">{systemHealth.security.threats}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Last Scan</span>
                <span className="font-medium">{systemHealth.security.lastScan}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderMaintenanceTasks = () => (
    <div className="space-y-4">
      {maintenanceTasks.map((task) => (
        <Card key={task.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon(task.status)}
                <div>
                  <h3 className="font-semibold">{task.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>Last run: {task.lastRun}</span>
                    <span>Next run: {task.nextRun}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={task.status === "completed" ? "default" : task.status === "failed" ? "destructive" : "secondary"}>
                  {task.status}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => runMaintenanceTask(task.id)}
                  disabled={task.status === "running"}
                >
                  {task.status === "running" ? "Running..." : "Run Now"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderPerformanceMetrics = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {performanceMetrics.map((metric, index) => (
        <Card key={index}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{metric.metric}</h3>
                <p className={`text-2xl font-bold ${getStatusColor(metric.status)}`}>
                  {metric.current}
                </p>
                <p className="text-sm text-gray-600">Target: {metric.target}</p>
              </div>
              {getStatusIcon(metric.status)}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System Maintenance & Monitoring
          </CardTitle>
          <p className="text-gray-600">Monitor system health and perform maintenance tasks</p>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-6">
            <Button
              variant={activeSection === "system-health" ? "default" : "outline"}
              onClick={() => setActiveSection("system-health")}
            >
              System Health
            </Button>
            <Button
              variant={activeSection === "maintenance" ? "default" : "outline"}
              onClick={() => setActiveSection("maintenance")}
            >
              Maintenance Tasks
            </Button>
            <Button
              variant={activeSection === "performance" ? "default" : "outline"}
              onClick={() => setActiveSection("performance")}
            >
              Performance
            </Button>
            <Button
              variant={activeSection === "backups" ? "default" : "outline"}
              onClick={() => setActiveSection("backups")}
            >
              Backups
            </Button>
          </div>

          {activeSection === "system-health" && renderSystemHealth()}
          {activeSection === "maintenance" && renderMaintenanceTasks()}
          {activeSection === "performance" && renderPerformanceMetrics()}
          {activeSection === "backups" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Download className="h-5 w-5" />
                      Backup Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <p className="font-medium">Daily Database Backup</p>
                          <p className="text-sm text-gray-600">Last: 2024-01-06 03:00</p>
                        </div>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <p className="font-medium">Configuration Backup</p>
                          <p className="text-sm text-gray-600">Last: 2024-01-05 02:00</p>
                        </div>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      </div>
                      <Button className="w-full">
                        <Download className="h-4 w-4 mr-2" />
                        Create Manual Backup
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="h-5 w-5" />
                      Restore Options
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Select Backup</label>
                        <select className="w-full p-2 border rounded">
                          <option>2024-01-06 03:00 - Database</option>
                          <option>2024-01-05 03:00 - Database</option>
                          <option>2024-01-04 03:00 - Database</option>
                        </select>
                      </div>
                      <Button variant="outline" className="w-full">
                        <Upload className="h-4 w-4 mr-2" />
                        Restore from Backup
                      </Button>
                      <p className="text-xs text-gray-500">
                        Warning: Restoring will overwrite current data
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}