import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Printer, 
  Scan, 
  Wifi, 
  Usb, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Settings,
  TestTube
} from 'lucide-react';
import { posHardware, ThermalPrinter } from '@/utils/hardware-integration';

export function HardwareSetup() {
  const [printerStatus, setPrinterStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [scannerStatus, setScannerStatus] = useState<'disconnected' | 'connected'>('disconnected');
  const [networkPrinterIP, setNetworkPrinterIP] = useState('192.168.1.100');
  const [webUSBSupported, setWebUSBSupported] = useState(false);
  const [lastScannedBarcode, setLastScannedBarcode] = useState<string>('');
  const [testPrintResult, setTestPrintResult] = useState<string>('');

  useEffect(() => {
    // Check WebUSB support
    setWebUSBSupported(ThermalPrinter.isSupported());
    
    // Setup scanner
    posHardware.scanner.setupKeyboardWedge((barcode) => {
      setLastScannedBarcode(barcode);
      setScannerStatus('connected');
    });

    // Initialize hardware
    posHardware.initialize();
  }, []);

  const connectUSBPrinter = async () => {
    setPrinterStatus('connecting');
    setTestPrintResult('');
    
    try {
      const success = await posHardware.printer.connect();
      setPrinterStatus(success ? 'connected' : 'disconnected');
      
      if (success) {
        setTestPrintResult('USB printer connected successfully!');
      }
    } catch (error) {
      setPrinterStatus('disconnected');
      setTestPrintResult(`Connection failed: ${error}`);
    }
  };

  const setupNetworkPrinter = () => {
    posHardware.setupNetworkPrinter(networkPrinterIP);
    setTestPrintResult(`Network printer configured for ${networkPrinterIP}`);
  };

  const testPrint = async () => {
    setTestPrintResult('Printing test receipt...');
    
    try {
      const testReceipt = {
        transactionId: `TEST-${Date.now()}`,
        timestamp: new Date().toISOString(),
        items: [
          { name: 'Test Item', price: 1.50, quantity: 1, total: 1.50 },
          { name: 'Another Test', price: 2.99, quantity: 2, total: 5.98 }
        ],
        subtotal: 7.48,
        tax: 1.35,
        total: 8.83,
        paymentMethod: 'Cash',
        change: 1.17
      };

      const success = await posHardware.printReceipt(testReceipt);
      setTestPrintResult(success ? 'Test receipt printed successfully!' : 'Print test failed - check printer connection');
    } catch (error) {
      setTestPrintResult(`Print test failed: ${error}`);
    }
  };

  const StatusBadge = ({ status, label }: { status: string, label: string }) => {
    const variants = {
      connected: { color: 'bg-green-500', icon: CheckCircle },
      connecting: { color: 'bg-yellow-500', icon: AlertTriangle },
      disconnected: { color: 'bg-red-500', icon: XCircle }
    };
    
    const variant = variants[status as keyof typeof variants] || variants.disconnected;
    const Icon = variant.icon;

    return (
      <Badge variant="secondary" className={`${variant.color} text-white`}>
        <Icon className="w-3 h-3 mr-1" />
        {label}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <Settings className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Hardware Setup</h1>
      </div>

      {/* Browser Compatibility */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Usb className="w-5 h-5" />
            <span>Browser Compatibility</span>
          </CardTitle>
          <CardDescription>
            Hardware integration requires modern browser features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span>WebUSB API Support</span>
              <StatusBadge 
                status={webUSBSupported ? 'connected' : 'disconnected'} 
                label={webUSBSupported ? 'Supported' : 'Not Supported'} 
              />
            </div>
            
            {!webUSBSupported && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  WebUSB is required for direct hardware integration. Please use <strong>Chrome</strong> or <strong>Edge</strong> browser.
                  Firefox and Safari don't support WebUSB.
                </AlertDescription>
              </Alert>
            )}

            <div className="text-sm text-gray-600">
              <p><strong>Supported Browsers:</strong></p>
              <ul className="list-disc list-inside ml-4">
                <li>Google Chrome (Desktop & Android)</li>
                <li>Microsoft Edge (Desktop)</li>
                <li>Chromium-based browsers</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Receipt Printer Setup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Printer className="w-5 h-5" />
            <span>Receipt Printer</span>
          </CardTitle>
          <CardDescription>
            Connect USB thermal printer or configure network printer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* USB Printer */}
          <div>
            <h3 className="text-lg font-semibold mb-2">USB Thermal Printer</h3>
            <div className="flex items-center justify-between mb-3">
              <span>Connection Status</span>
              <StatusBadge 
                status={printerStatus} 
                label={printerStatus === 'connected' ? 'Connected' : printerStatus === 'connecting' ? 'Connecting...' : 'Disconnected'} 
              />
            </div>
            
            <Button 
              onClick={connectUSBPrinter} 
              disabled={!webUSBSupported || printerStatus === 'connecting'}
              className="w-full mb-2"
            >
              {printerStatus === 'connecting' ? 'Connecting...' : 'Connect USB Printer'}
            </Button>

            <div className="text-sm text-gray-600">
              <p><strong>Supported Printers:</strong></p>
              <ul className="list-disc list-inside ml-4">
                <li>Epson TM series (TM-T20, TM-T88, TM-m30)</li>
                <li>Star Micronics (TSP654, mC-Print3, mPOP)</li>
                <li>Custom VKP80 series</li>
                <li>RONGTA thermal printers</li>
                <li>Most ESC/POS compatible thermal printers</li>
              </ul>
            </div>
          </div>

          <Separator />

          {/* Network Printer */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Network Printer (Ethernet/WiFi)</h3>
            <div className="flex space-x-2 mb-2">
              <Input
                value={networkPrinterIP}
                onChange={(e) => setNetworkPrinterIP(e.target.value)}
                placeholder="192.168.1.100"
                className="flex-1"
              />
              <Button onClick={setupNetworkPrinter}>
                <Wifi className="w-4 h-4 mr-2" />
                Setup
              </Button>
            </div>
            <p className="text-sm text-gray-600">
              Enter your network printer's IP address. Most modern thermal printers support Ethernet/WiFi connectivity.
            </p>
          </div>

          <Separator />

          {/* Test Printing */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Test Printing</h3>
            <Button onClick={testPrint} className="w-full mb-2">
              <TestTube className="w-4 h-4 mr-2" />
              Print Test Receipt
            </Button>
            
            {testPrintResult && (
              <Alert>
                <AlertDescription>{testPrintResult}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Barcode Scanner Setup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Scan className="w-5 h-5" />
            <span>Barcode Scanner</span>
          </CardTitle>
          <CardDescription>
            USB barcode scanners and camera scanning support
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between mb-3">
            <span>Scanner Status</span>
            <StatusBadge 
              status={scannerStatus} 
              label={scannerStatus === 'connected' ? 'Ready' : 'Waiting for scan'} 
            />
          </div>

          {lastScannedBarcode && (
            <Alert>
              <AlertDescription>
                <strong>Last Scanned:</strong> {lastScannedBarcode}
              </AlertDescription>
            </Alert>
          )}

          <div className="text-sm text-gray-600">
            <p><strong>Supported Scanner Types:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li><strong>USB HID Scanners (Recommended):</strong> Honeywell Voyager, Zebra DS2208, Datalogic QuickScan</li>
              <li><strong>Camera Scanning:</strong> Built-in mobile device cameras</li>
              <li><strong>Bluetooth Scanners:</strong> Socket Mobile, wireless Honeywell scanners</li>
            </ul>
            
            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
              <p className="font-semibold">Setup Instructions:</p>
              <ol className="list-decimal list-inside ml-2 space-y-1">
                <li>Connect USB scanner to computer</li>
                <li>Scanner will work immediately (keyboard emulation mode)</li>
                <li>Scan any barcode to test - it will appear above</li>
                <li>Scanner automatically integrates with POS transactions</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cash Drawer Setup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <div className="w-5 h-5 bg-gray-400 rounded" />
            <span>Cash Drawer</span>
          </CardTitle>
          <CardDescription>
            Cash drawer integration via receipt printer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>Connection Method:</strong></p>
            <ol className="list-decimal list-inside ml-4 space-y-1">
              <li>Connect cash drawer to receipt printer via RJ11/RJ12 cable</li>
              <li>Drawer will open automatically when receipts print</li>
              <li>Compatible with most POS cash drawers (APG, Star, POS-X)</li>
              <li>No additional software configuration required</li>
            </ol>
            
            <div className="mt-3 p-3 bg-green-50 rounded-lg">
              <p className="font-semibold text-green-800">✅ Automatic Operation</p>
              <p className="text-green-700">Cash drawer opens automatically during cash/check transactions when receipt prints.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hardware Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Recommended Hardware Bundle</CardTitle>
          <CardDescription>
            Complete POS hardware setup for Kerrigans XL
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Budget Setup (€300-500)</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Epson TM-T20II thermal printer</li>
                <li>Honeywell Voyager 1400g scanner</li>
                <li>APG Vasario cash drawer</li>
                <li>Tablet/laptop for POS interface</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Professional Setup (€800-1200)</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Star mC-Print3 network printer</li>
                <li>Zebra DS2208 2D scanner</li>
                <li>Star mPOP integrated printer/drawer</li>
                <li>Dedicated POS terminal</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}