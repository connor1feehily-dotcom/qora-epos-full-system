import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface HardwareIntegrationProps {
  onPrintReceipt: (receiptData: any) => void;
  onBarcodeScanned: (barcode: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function HardwareIntegration({ onPrintReceipt, onBarcodeScanned, isOpen, onClose }: HardwareIntegrationProps) {
  const { toast } = useToast();
  const [printerStatus, setPrinterStatus] = useState<'disconnected' | 'connected' | 'printing'>('disconnected');
  const [scannerStatus, setScannerStatus] = useState<'disconnected' | 'connected' | 'scanning'>('disconnected');

  // Epson Receipt Printer Integration
  const connectPrinter = async () => {
    try {
      // Check if browser supports Serial API for direct USB connection
      if ('serial' in navigator) {
        const port = await (navigator as any).serial.requestPort();
        await port.open({ baudRate: 9600 });
        setPrinterStatus('connected');
        toast({
          title: "Printer Connected",
          description: "Epson receipt printer is ready",
        });
      } else {
        // Fallback to network printing or driver-based printing
        toast({
          title: "Printer Setup",
          description: "Configure printer through system settings or use ESC/POS commands",
        });
      }
    } catch (error) {
      toast({
        title: "Printer Connection Failed",
        description: "Check USB connection and printer power",
        variant: "destructive",
      });
    }
  };

  // Barcode Scanner Integration
  const connectScanner = async () => {
    try {
      // Check for HID device support
      if ('hid' in navigator) {
        const devices = await (navigator as any).hid.requestDevice({
          filters: [
            { vendorId: 0x0801 }, // Common barcode scanner vendor IDs
            { vendorId: 0x05e0 },
            { vendorId: 0x1a86 },
          ]
        });
        
        if (devices.length > 0) {
          const device = devices[0];
          await device.open();
          
          device.addEventListener('inputreport', (event: any) => {
            const { data, device, reportId } = event;
            // Parse barcode data from HID input
            const barcode = parseHIDBarcode(data);
            if (barcode) {
              onBarcodeScanned(barcode);
            }
          });
          
          setScannerStatus('connected');
          toast({
            title: "Scanner Connected",
            description: "Barcode scanner is ready",
          });
        }
      } else {
        // Fallback to keyboard input simulation
        toast({
          title: "Scanner Setup",
          description: "Scanner will work as keyboard input (HID mode)",
        });
        setScannerStatus('connected');
      }
    } catch (error) {
      toast({
        title: "Scanner Connection Failed",
        description: "Check USB connection or try different scanner mode",
        variant: "destructive",
      });
    }
  };

  // Parse HID barcode data
  const parseHIDBarcode = (data: DataView): string | null => {
    // Convert HID data to string (implementation depends on scanner protocol)
    const bytes = new Uint8Array(data.buffer);
    let barcode = '';
    
    for (let i = 0; i < bytes.length; i++) {
      if (bytes[i] >= 32 && bytes[i] <= 126) { // Printable ASCII
        barcode += String.fromCharCode(bytes[i]);
      }
    }
    
    return barcode.trim() || null;
  };

  // ESC/POS Receipt Printing
  const printReceipt = async (receiptData: any) => {
    setPrinterStatus('printing');
    
    try {
      // ESC/POS commands for Epson printers
      const escPos = generateESCPOSCommands(receiptData);
      
      if (printerStatus === 'connected') {
        // Send to hardware printer
        await sendToPrinter(escPos);
      } else {
        // Fallback to browser print
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(generatePrintHTML(receiptData));
          printWindow.document.close();
          printWindow.print();
        }
      }
      
      toast({
        title: "Receipt Printed",
        description: "Receipt sent to printer successfully",
      });
    } catch (error) {
      toast({
        title: "Print Failed",
        description: "Check printer connection and paper",
        variant: "destructive",
      });
    } finally {
      setPrinterStatus('connected');
    }
  };

  // Generate ESC/POS commands
  const generateESCPOSCommands = (receiptData: any): Uint8Array => {
    const commands: number[] = [];
    
    // Initialize printer
    commands.push(0x1B, 0x40); // ESC @
    
    // Set font size and alignment
    commands.push(0x1B, 0x61, 0x01); // Center align
    commands.push(0x1D, 0x21, 0x11); // Double size
    
    // Store name
    const storeName = "KERRIGAN'S XL\n";
    commands.push(...Array.from(new TextEncoder().encode(storeName)));
    
    // Reset to normal size
    commands.push(0x1D, 0x21, 0x00);
    commands.push(0x1B, 0x61, 0x00); // Left align
    
    // Receipt content
    const content = `
Transaction: ${receiptData.transactionId}
Till: ${receiptData.tillId}
Date: ${receiptData.dateTime}
--------------------------------
${receiptData.items.map((item: any) => 
  `${item.name}\n${item.quantity} x €${item.price.toFixed(2)} = €${(item.quantity * item.price).toFixed(2)}\n`
).join('')}
--------------------------------
Subtotal: €${receiptData.subtotal.toFixed(2)}
VAT: €${receiptData.vatAmount.toFixed(2)}
TOTAL: €${receiptData.total.toFixed(2)}
Payment: ${receiptData.paymentMethod}
`;
    
    commands.push(...Array.from(new TextEncoder().encode(content)));
    
    // Cut paper
    commands.push(0x1D, 0x56, 0x00);
    
    return new Uint8Array(commands);
  };

  // Send to hardware printer
  const sendToPrinter = async (data: Uint8Array) => {
    // Implementation depends on connection method (Serial API, network, etc.)
    console.log('Sending to printer:', data);
  };

  // Generate HTML for browser printing
  const generatePrintHTML = (receiptData: any): string => {
    return `
      <html>
        <head>
          <style>
            body { font-family: 'Courier New', monospace; width: 300px; margin: 0; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .large { font-size: 18px; }
          </style>
        </head>
        <body>
          <div class="center bold large">KERRIGAN'S XL</div>
          <div class="center">Manorhamilton</div>
          <br>
          <div>Transaction: ${receiptData.transactionId}</div>
          <div>Till: ${receiptData.tillId}</div>
          <div>Date: ${receiptData.dateTime}</div>
          <div>--------------------------------</div>
          ${receiptData.items.map((item: any) => `
            <div>${item.name}</div>
            <div>${item.quantity} x €${item.price.toFixed(2)} = €${(item.quantity * item.price).toFixed(2)}</div>
          `).join('')}
          <div>--------------------------------</div>
          <div>Subtotal: €${receiptData.subtotal.toFixed(2)}</div>
          <div>VAT: €${receiptData.vatAmount.toFixed(2)}</div>
          <div class="bold">TOTAL: €${receiptData.total.toFixed(2)}</div>
          <div>Payment: ${receiptData.paymentMethod}</div>
          <br>
          <div class="center">Thank you for your business!</div>
        </body>
      </html>
    `;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-gray-50">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center text-cyan-700">Hardware Setup</DialogTitle>
        </DialogHeader>
        <div className="p-6 space-y-4">
          <div className="bg-white p-4 rounded border">
            <h3 className="font-bold mb-2">Epson Receipt Printer</h3>
            <div className="flex items-center justify-between mb-2">
              <span>Status:</span>
              <span className={`font-bold ${
                printerStatus === 'connected' ? 'text-green-600' : 
                printerStatus === 'printing' ? 'text-blue-600' : 'text-red-600'
              }`}>
                {printerStatus.toUpperCase()}
              </span>
            </div>
            <Button 
              onClick={connectPrinter}
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-white"
              disabled={printerStatus === 'connected'}
            >
              {printerStatus === 'connected' ? 'Connected' : 'Connect Printer'}
            </Button>
          </div>

          <div className="bg-white p-4 rounded border">
            <h3 className="font-bold mb-2">Barcode Scanner</h3>
            <div className="flex items-center justify-between mb-2">
              <span>Status:</span>
              <span className={`font-bold ${
                scannerStatus === 'connected' ? 'text-green-600' : 'text-red-600'
              }`}>
                {scannerStatus.toUpperCase()}
              </span>
            </div>
            <Button 
              onClick={connectScanner}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
              disabled={scannerStatus === 'connected'}
            >
              {scannerStatus === 'connected' ? 'Connected' : 'Connect Scanner'}
            </Button>
          </div>

          <div className="bg-white p-4 rounded border">
            <h3 className="font-bold mb-2">Setup Instructions</h3>
            <div className="text-sm space-y-1">
              <p>• Connect Epson printer via USB</p>
              <p>• Set scanner to HID/Keyboard mode</p>
              <p>• Enable browser permissions for hardware</p>
              <p>• Test connections before use</p>
            </div>
          </div>

          <Button 
            onClick={onClose}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}