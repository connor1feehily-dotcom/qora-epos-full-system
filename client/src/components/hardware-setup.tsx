import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { ThermalPrinter, BarcodeScanner, CashDrawer } from '@/utils/hardware-integration';
import { 
  Printer, 
  Scan, 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Settings,
  Wifi,
  Usb
} from 'lucide-react';

export default function HardwareSetup() {
  const { toast } = useToast();
  const [printerStatus, setPrinterStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [scannerStatus, setScannerStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [drawerStatus, setDrawerStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [printer, setPrinter] = useState<ThermalPrinter | null>(null);
  const [scanner, setScanner] = useState<BarcodeScanner | null>(null);
  const [drawer, setDrawer] = useState<CashDrawer | null>(null);
  const [networkPrinterIP, setNetworkPrinterIP] = useState('');

  useEffect(() => {
    // Initialize hardware instances
    setPrinter(new ThermalPrinter());
    setScanner(new BarcodeScanner());
    setDrawer(new CashDrawer());
  }, []);

  const connectThermalPrinter = async () => {
    if (!printer) return;
    
    setPrinterStatus('connecting');
    console.log('Attempting to connect to THERMAL RECEIPT PRINTER (not A4 printer)...');
    
    try {
      const connected = await printer.connect();
      if (connected) {
        setPrinterStatus('connected');
        toast({
          title: "Thermal Printer Connected",
          description: "Receipt printer is ready for transactions",
          duration: 5000
        });
      } else {
        setPrinterStatus('error');
        toast({
          title: "Connection Failed",
          description: "Could not connect to thermal printer. Check USB connection and power.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Printer connection error:', error);
      setPrinterStatus('error');
      toast({
        title: "Printer Error",
        description: error instanceof Error ? error.message : "Unknown error connecting to printer",
        variant: "destructive"
      });
    }
  };

  const testPrint = async () => {
    if (!printer || printerStatus !== 'connected') {
      toast({
        title: "Printer Not Ready",
        description: "Please connect the thermal printer first",
        variant: "destructive"
      });
      return;
    }

    console.log('Testing thermal receipt printer...');
    try {
      const success = await printer.testPrint();
      if (success) {
        toast({
          title: "Test Print Successful",
          description: "Receipt printer is working correctly",
          duration: 5000
        });
      } else {
        toast({
          title: "Test Print Failed", 
          description: "Check printer power, paper, and USB connection",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Test print error:', error);
      toast({
        title: "Print Error",
        description: "Could not send test print to thermal printer",
        variant: "destructive"
      });
    }
  };

  const connectScanner = async () => {
    if (!scanner) return;
    
    setScannerStatus('connecting');
    try {
      const connected = await scanner.connect();
      if (connected) {
        setScannerStatus('connected');
        toast({
          title: "Barcode Scanner Connected",
          description: "Scanner is ready for product scanning",
          duration: 5000
        });
      } else {
        setScannerStatus('error');
      }
    } catch (error) {
      setScannerStatus('error');
      toast({
        title: "Scanner Error",
        description: "Could not connect to barcode scanner",
        variant: "destructive"
      });
    }
  };

  const connectDrawer = async () => {
    if (!drawer) return;
    
    setDrawerStatus('connecting');
    try {
      const connected = await drawer.connect();
      if (connected) {
        setDrawerStatus('connected');
        toast({
          title: "Cash Drawer Connected",
          description: "Drawer will open automatically with transactions",
          duration: 5000
        });
      } else {
        setDrawerStatus('error');
      }
    } catch (error) {
      setDrawerStatus('error');
      toast({
        title: "Drawer Error",
        description: "Could not connect to cash drawer",
        variant: "destructive"
      });
    }
  };

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'connecting':
        return <Settings className="h-5 w-5 text-yellow-500 animate-spin" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-400" />;
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const variants = {
      connected: 'default',
      connecting: 'secondary', 
      error: 'destructive',
      disconnected: 'outline'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Hardware Setup</h1>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Browser Requirement:</strong> Hardware integration requires Chrome or Edge browser. 
          Make sure to allow USB device permissions when prompted.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Thermal Receipt Printer */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Printer className="h-5 w-5" />
              <span>Receipt Printer</span>
              <StatusIcon status={printerStatus} />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Status</span>
              <StatusBadge status={printerStatus} />
            </div>
            
            <div className="space-y-2">
              <Button 
                onClick={connectThermalPrinter}
                disabled={printerStatus === 'connecting'}
                className="w-full"
                variant={printerStatus === 'connected' ? 'outline' : 'default'}
              >
                <Usb className="h-4 w-4 mr-2" />
                {printerStatus === 'connected' ? 'Reconnect' : 'Connect USB Thermal Printer'}
              </Button>
              
              <Button 
                onClick={testPrint}
                disabled={printerStatus !== 'connected'}
                variant="outline"
                className="w-full"
              >
                Test Print Receipt
              </Button>
            </div>

            <div className="text-xs text-gray-500">
              <p><strong>Supported:</strong> Epson TM-T88, Star TSP650, Custom VKP80, RONGTA RP58/80</p>
              <p><strong>NOT:</strong> Regular A4/inkjet printers</p>
            </div>
          </CardContent>
        </Card>

        {/* Barcode Scanner */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Scan className="h-5 w-5" />
              <span>Barcode Scanner</span>
              <StatusIcon status={scannerStatus} />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Status</span>
              <StatusBadge status={scannerStatus} />
            </div>
            
            <Button 
              onClick={connectScanner}
              disabled={scannerStatus === 'connecting'}
              className="w-full"
              variant={scannerStatus === 'connected' ? 'outline' : 'default'}
            >
              <Usb className="h-4 w-4 mr-2" />
              {scannerStatus === 'connected' ? 'Reconnect' : 'Connect USB Scanner'}
            </Button>

            <div className="text-xs text-gray-500">
              <p><strong>Supported:</strong> Any USB HID barcode scanner</p>
              <p><strong>Alternative:</strong> Keyboard wedge scanners work automatically</p>
            </div>
          </CardContent>
        </Card>

        {/* Cash Drawer */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5" />
              <span>Cash Drawer</span>
              <StatusIcon status={drawerStatus} />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Status</span>
              <StatusBadge status={drawerStatus} />
            </div>
            
            <Button 
              onClick={connectDrawer}
              disabled={drawerStatus === 'connecting'}
              className="w-full"
              variant={drawerStatus === 'connected' ? 'outline' : 'default'}
            >
              <Usb className="h-4 w-4 mr-2" />
              {drawerStatus === 'connected' ? 'Reconnect' : 'Connect Cash Drawer'}
            </Button>

            <div className="text-xs text-gray-500">
              <p><strong>Connection:</strong> Usually connects via printer RJ12 port</p>
              <p><strong>Opens:</strong> Automatically with cash transactions</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Network Printer Option */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wifi className="h-5 w-5" />
            <span>Network Printer (Alternative)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            If USB connection fails, you can use a network-enabled thermal printer:
          </p>
          
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="192.168.1.100"
              value={networkPrinterIP}
              onChange={(e) => setNetworkPrinterIP(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
            <Button variant="outline">
              Connect Network Printer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* GERA Compatibility Info */}
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>GERA System Compatibility:</strong> Quantum POS works alongside your existing GERA system. 
          Connect GERA to serial/COM port and Quantum POS to USB for best results. No conflicts.
        </AlertDescription>
      </Alert>
    </div>
  );
}