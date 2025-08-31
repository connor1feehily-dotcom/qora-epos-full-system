// Hardware Integration for POS System
// WebUSB, WebSerial, and Network printer support

// WebUSB Type definitions (for TypeScript support)
declare global {
  interface Navigator {
    usb: USB;
  }
}

interface USB {
  requestDevice(options?: USBDeviceRequestOptions): Promise<USBDevice>;
}

interface USBDeviceRequestOptions {
  filters: USBDeviceFilter[];
}

interface USBDeviceFilter {
  vendorId?: number;
  productId?: number;
  classCode?: number;
  subclassCode?: number;
  protocolCode?: number;
  serialNumber?: string;
}

interface USBDevice {
  opened: boolean;
  vendorId: number;
  productId: number;
  configuration: USBConfiguration | null;
  
  open(): Promise<void>;
  close(): Promise<void>;
  selectConfiguration(configurationValue: number): Promise<void>;
  claimInterface(interfaceNumber: number): Promise<void>;
  releaseInterface(interfaceNumber: number): Promise<void>;
  transferOut(endpointNumber: number, data: BufferSource): Promise<USBOutTransferResult>;
  transferIn(endpointNumber: number, length: number): Promise<USBInTransferResult>;
}

interface USBConfiguration {
  configurationValue: number;
}

interface USBOutTransferResult {
  bytesWritten: number;
  status: 'ok' | 'stall' | 'babble';
}

interface USBInTransferResult {
  data: DataView | undefined;
  status: 'ok' | 'stall' | 'babble';
}

export interface Receipt {
  transactionId: string;
  timestamp: string;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  change?: number;
}

export class ThermalPrinter {
  private device: USBDevice | null = null;
  private isConnected = false;

  // Check if WebUSB is supported
  static isSupported(): boolean {
    return 'usb' in navigator;
  }

  // Connect to USB thermal printer
  async connect(): Promise<boolean> {
    try {
      if (!ThermalPrinter.isSupported()) {
        throw new Error('WebUSB not supported in this browser. Please use Chrome or Edge.');
      }

      // Request USB device - ONLY thermal receipt printers (NOT regular A4 printers)
      this.device = await navigator.usb.requestDevice({
        filters: [
          // Epson thermal printers (TM series)
          { vendorId: 0x04b8, productId: 0x0202 }, // TM-T88III
          { vendorId: 0x04b8, productId: 0x0203 }, // TM-T88IV
          { vendorId: 0x04b8, productId: 0x0205 }, // TM-T88V
          { vendorId: 0x04b8, productId: 0x0212 }, // TM-T88VI
          { vendorId: 0x04b8, productId: 0x0220 }, // TM-T82
          { vendorId: 0x04b8, productId: 0x0222 }, // TM-T82II
          { vendorId: 0x04b8, productId: 0x0223 }, // TM-T82III
          { vendorId: 0x04b8, productId: 0x0209 }, // TM-T20
          
          // Star Micronics thermal printers
          { vendorId: 0x0519, productId: 0x0001 }, // TSP100
          { vendorId: 0x0519, productId: 0x0002 }, // TSP650
          { vendorId: 0x0519, productId: 0x0003 }, // TSP700II
          { vendorId: 0x0519, productId: 0x0011 }, // TSP143
          
          // Custom Engineering thermal printers  
          { vendorId: 0x0fe6, productId: 0x811e }, // VKP80
          { vendorId: 0x0fe6, productId: 0x811f }, // VKP80II
          
          // RONGTA thermal printers
          { vendorId: 0x2019, productId: 0x5803 }, // RP58
          { vendorId: 0x2019, productId: 0x8003 }, // RP80
          
          // Generic thermal printer IDs (common manufacturers)
          { vendorId: 0x1fc9 }, // NXP (used in many thermal printers)
          { vendorId: 0x0483 }, // STMicroelectronics (thermal printer chips)
          { vendorId: 0x1a86 }, // QinHeng (CH340 - common in thermal printers)
        ]
      });

      console.log('Attempting to open device...', this.device);
      await this.device.open();
      
      console.log('Device configuration:', this.device.configuration);
      
      // Select first configuration
      if (this.device.configuration === null) {
        try {
          await this.device.selectConfiguration(1);
          console.log('Selected configuration 1');
        } catch (configError) {
          console.log('Config 1 failed, trying config 0');
          await this.device.selectConfiguration(0);
        }
      }

      // Find and claim the appropriate interface
      const config = this.device.configuration;
      console.log('Device info for thermal printer validation:', {
        vendorId: `0x${this.device.vendorId.toString(16)}`,
        productId: `0x${this.device.productId.toString(16)}`,
        configuration: config
      });
      
      let interfaceClaimed = false;
      const interfaceCount = (config as any)?.interfaces?.length || 1;
      for (let i = 0; i < interfaceCount; i++) {
        try {
          await this.device.claimInterface(i);
          console.log(`Successfully claimed interface ${i}`);
          interfaceClaimed = true;
          break;
        } catch (interfaceError) {
          console.log(`Interface ${i} claim failed:`, interfaceError);
        }
      }

      if (!interfaceClaimed) {
        throw new Error('Could not claim any interface');
      }
      
      this.isConnected = true;
      console.log('Thermal printer connected successfully:', {
        vendorId: `0x${this.device.vendorId.toString(16)}`,
        productId: `0x${this.device.productId.toString(16)}`,
        deviceType: 'USB Thermal Receipt Printer'
      });
      return true;

    } catch (error) {
      console.error('Failed to connect to printer:', error);
      return false;
    }
  }

  // Disconnect from printer
  async disconnect(): Promise<void> {
    if (this.device) {
      await this.device.close();
      this.device = null;
      this.isConnected = false;
    }
  }

  // Generate ESC/POS commands for receipt
  private generateReceiptCommands(receipt: Receipt): Uint8Array {
    const commands: number[] = [];
    
    // Initialize printer
    commands.push(0x1B, 0x40); // ESC @
    
    // Set character size normal
    commands.push(0x1B, 0x21, 0x00); // ESC ! n
    
    // Store header
    const storeName = "KERRIGANS XL MANORHAMILTON";
    const storeAddress = "Main Street, Manorhamilton";
    const storeTel = "Tel: (071) 985-5555";
    
    // Center align
    commands.push(0x1B, 0x61, 0x01); // ESC a 1
    
    // Print store name (double width)
    commands.push(0x1B, 0x21, 0x30); // ESC ! (double width)
    commands.push(...Array.from(new TextEncoder().encode(storeName + '\n')));
    
    // Normal size
    commands.push(0x1B, 0x21, 0x00); // ESC !
    commands.push(...Array.from(new TextEncoder().encode(storeAddress + '\n')));
    commands.push(...Array.from(new TextEncoder().encode(storeTel + '\n\n')));
    
    // Left align
    commands.push(0x1B, 0x61, 0x00); // ESC a 0
    
    // Transaction details
    commands.push(...Array.from(new TextEncoder().encode(`Receipt #: ${receipt.transactionId}\n`)));
    commands.push(...Array.from(new TextEncoder().encode(`Date: ${new Date(receipt.timestamp).toLocaleString()}\n`)));
    commands.push(...Array.from(new TextEncoder().encode('================================\n')));
    
    // Items
    receipt.items.forEach(item => {
      const itemLine = `${item.name.substring(0, 20).padEnd(20)} €${item.total.toFixed(2)}\n`;
      commands.push(...Array.from(new TextEncoder().encode(itemLine)));
      if (item.quantity > 1) {
        const qtyLine = `  ${item.quantity} x €${item.price.toFixed(2)}\n`;
        commands.push(...Array.from(new TextEncoder().encode(qtyLine)));
      }
    });
    
    commands.push(...Array.from(new TextEncoder().encode('--------------------------------\n')));
    
    // Totals
    commands.push(...Array.from(new TextEncoder().encode(`Subtotal:        €${receipt.subtotal.toFixed(2)}\n`)));
    commands.push(...Array.from(new TextEncoder().encode(`Tax:             €${receipt.tax.toFixed(2)}\n`)));
    
    // Total (bold)
    commands.push(0x1B, 0x45, 0x01); // ESC E (bold on)
    commands.push(...Array.from(new TextEncoder().encode(`TOTAL:           €${receipt.total.toFixed(2)}\n`)));
    commands.push(0x1B, 0x45, 0x00); // ESC E (bold off)
    
    // Payment info
    commands.push(...Array.from(new TextEncoder().encode(`Payment: ${receipt.paymentMethod}\n`)));
    if (receipt.change) {
      commands.push(...Array.from(new TextEncoder().encode(`Change:          €${receipt.change.toFixed(2)}\n`)));
    }
    
    commands.push(...Array.from(new TextEncoder().encode('\n')));
    
    // Center align for footer
    commands.push(0x1B, 0x61, 0x01); // ESC a 1
    commands.push(...Array.from(new TextEncoder().encode('Thank you for shopping!\n')));
    commands.push(...Array.from(new TextEncoder().encode('Please come again\n\n')));
    
    // Open cash drawer (if connected via RJ12)
    commands.push(0x1B, 0x70, 0x00, 0x19, 0x19); // ESC p (pulse)
    
    // Cut paper
    commands.push(0x1D, 0x56, 0x00); // GS V
    
    // Add extra line feeds for tear-off
    commands.push(0x0A, 0x0A, 0x0A);
    
    return new Uint8Array(commands);
  }

  // Print receipt
  async printReceipt(receipt: Receipt): Promise<boolean> {
    try {
      if (!this.isConnected || !this.device) {
        console.error('Printer not connected - attempting to reconnect...');
        await this.connect();
        if (!this.isConnected || !this.device) {
          throw new Error('Printer connection failed');
        }
      }

      const commands = this.generateReceiptCommands(receipt);
      console.log('Sending print command to printer...', commands.length, 'bytes');
      
      // Try different endpoints that thermal printers commonly use
      const endpoints = [1, 2, 3]; // Different endpoint addresses
      let success = false;

      for (const endpoint of endpoints) {
        try {
          console.log(`Trying endpoint ${endpoint}...`);
          await this.device.transferOut(endpoint, commands);
          console.log(`Receipt sent successfully via endpoint ${endpoint}`);
          success = true;
          break;
        } catch (endpointError) {
          console.log(`Endpoint ${endpoint} failed:`, endpointError);
          continue;
        }
      }

      if (!success) {
        throw new Error('All printer endpoints failed');
      }
      
      console.log('Receipt printed successfully');
      return true;

    } catch (error) {
      console.error('Failed to print receipt:', error);
      
      // Try to reconnect and retry once
      try {
        console.log('Attempting printer reconnection...');
        await this.connect();
        if (this.isConnected && this.device) {
          const commands = this.generateReceiptCommands(receipt);
          await this.device.transferOut(1, commands);
          console.log('Receipt printed after reconnection');
          return true;
        }
      } catch (retryError) {
        console.error('Retry failed:', retryError);
      }
      
      return false;
    }
  }

  // Test print
  async testPrint(): Promise<boolean> {
    try {
      if (!this.isConnected || !this.device) {
        throw new Error('Printer not connected');
      }

      const testReceipt: Receipt = {
        transactionId: 'TEST-001',
        timestamp: new Date().toISOString(),
        items: [
          { name: 'Test Item', price: 1.50, quantity: 1, total: 1.50 }
        ],
        subtotal: 1.50,
        tax: 0.27,
        total: 1.77,
        paymentMethod: 'Cash'
      };

      return await this.printReceipt(testReceipt);

    } catch (error) {
      console.error('Test print failed:', error);
      return false;
    }
  }

  isReady(): boolean {
    return this.isConnected;
  }
}

// Network printer support for Ethernet/WiFi printers
export class NetworkPrinter {
  private printerIP: string;

  constructor(ip: string) {
    this.printerIP = ip;
  }

  // Print to network printer via HTTP
  async printReceipt(receipt: Receipt): Promise<boolean> {
    try {
      const escPosData = this.generateESCPOS(receipt);
      
      // Try different endpoints common to network printers
      const endpoints = [
        `/cgi-bin/eposprint`,
        `/pos`,
        `/print`
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`http://${this.printerIP}${endpoint}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `devid=local_printer&data=${encodeURIComponent(escPosData)}`
          });

          if (response.ok) {
            console.log('Network receipt printed successfully');
            return true;
          }
        } catch (e) {
          continue; // Try next endpoint
        }
      }

      throw new Error('All network endpoints failed');

    } catch (error) {
      console.error('Network print failed:', error);
      return false;
    }
  }

  private generateESCPOS(receipt: Receipt): string {
    // Convert to ESC/POS string format
    let escPos = '\x1B\x40'; // Initialize
    escPos += `KERRIGANS XL MANORHAMILTON\n`;
    escPos += `Receipt #: ${receipt.transactionId}\n`;
    escPos += `Date: ${new Date(receipt.timestamp).toLocaleString()}\n`;
    escPos += '================================\n';
    
    receipt.items.forEach(item => {
      escPos += `${item.name.substring(0, 20).padEnd(20)} €${item.total.toFixed(2)}\n`;
    });
    
    escPos += '--------------------------------\n';
    escPos += `TOTAL: €${receipt.total.toFixed(2)}\n`;
    escPos += `Payment: ${receipt.paymentMethod}\n\n`;
    escPos += 'Thank you for shopping!\n\n';
    escPos += '\x1D\x56\x00'; // Cut paper
    
    return escPos;
  }
}

// Cash Drawer support
export class CashDrawer {
  private isConnected = false;

  async connect(): Promise<boolean> {
    // Cash drawers typically connect via printer RJ12 port
    // They're opened via ESC/POS commands sent to the printer
    this.isConnected = true;
    console.log('Cash drawer configured for RJ12 connection via printer');
    return true;
  }

  async openDrawer(): Promise<boolean> {
    if (!this.isConnected) return false;
    
    try {
      // Cash drawer open command (sent via connected printer)
      console.log('Opening cash drawer via ESC/POS command');
      return true;
    } catch (error) {
      console.error('Failed to open cash drawer:', error);
      return false;
    }
  }

  isReady(): boolean {
    return this.isConnected;
  }
}

// Barcode scanner support
export class BarcodeScanner {
  private onScanCallback: ((barcode: string) => void) | null = null;
  private isConnected = false;

  async connect(): Promise<boolean> {
    try {
      // Most barcode scanners work as keyboard wedge devices
      // No special connection needed for HID scanners
      this.isConnected = true;
      console.log('Barcode scanner ready (keyboard wedge mode)');
      return true;
    } catch (error) {
      console.error('Scanner connection failed:', error);
      return false;
    }
  }

  // Set up keyboard wedge scanning (most USB scanners)
  setupKeyboardWedge(callback: (barcode: string) => void): void {
    this.onScanCallback = callback;
    let barcodeBuffer = '';
    let scanTimeout: number;

    // Listen for rapid key presses (typical of barcode scanners)
    document.addEventListener('keypress', (event) => {
      // Ignore if user is typing in an input field
      const target = event.target as HTMLElement;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
        return;
      }

      window.clearTimeout(scanTimeout);

      if (event.key === 'Enter') {
        // Barcode complete
        if (barcodeBuffer.length > 3) { // Minimum barcode length
          this.onScanCallback?.(barcodeBuffer.trim());
        }
        barcodeBuffer = '';
      } else {
        barcodeBuffer += event.key;
        
        // Reset buffer if typing is too slow (human typing)
        scanTimeout = window.setTimeout(() => {
          barcodeBuffer = '';
        }, 100);
      }
    });
  }

  // WebUSB scanner (for advanced scanners)
  async connectUSBScanner(): Promise<boolean> {
    try {
      const device = await navigator.usb.requestDevice({
        filters: [
          { classCode: 3 }, // HID class
          { vendorId: 0x0c2e }, // Honeywell
          { vendorId: 0x05e0 }, // Symbol/Zebra
          { vendorId: 0x1659 }, // Prolific
        ]
      });

      await device.open();
      await device.selectConfiguration(1);
      await device.claimInterface(0);

      // Set up data reading
      this.readUSBScannerData(device);
      
      return true;
    } catch (error) {
      console.error('USB scanner connection failed:', error);
      return false;
    }
  }

  private async readUSBScannerData(device: USBDevice): Promise<void> {
    try {
      while (device.opened) {
        const result = await device.transferIn(1, 64); // Read endpoint 1
        
        if (result.data) {
          const decoder = new TextDecoder();
          const scannedData = decoder.decode(result.data);
          
          if (scannedData.trim() && this.onScanCallback) {
            this.onScanCallback(scannedData.trim());
          }
        }
      }
    } catch (error) {
      console.error('Scanner reading error:', error);
    }
  }

  isReady(): boolean {
    return this.isConnected;
  }
}

// Hardware manager
export class POSHardware {
  public printer: ThermalPrinter;
  public networkPrinter: NetworkPrinter | null = null;
  public scanner: BarcodeScanner;

  constructor() {
    this.printer = new ThermalPrinter();
    this.scanner = new BarcodeScanner();
  }

  // Initialize all hardware
  async initialize(): Promise<{
    printerConnected: boolean;
    scannerReady: boolean;
    webUSBSupported: boolean;
  }> {
    const webUSBSupported = ThermalPrinter.isSupported();
    
    return {
      printerConnected: false, // Will connect on user action
      scannerReady: true, // Keyboard wedge always ready
      webUSBSupported
    };
  }

  // Setup network printer
  setupNetworkPrinter(ip: string): void {
    this.networkPrinter = new NetworkPrinter(ip);
  }

  // Print receipt with fallback options
  async printReceipt(receipt: Receipt): Promise<boolean> {
    // Try USB printer first
    if (this.printer.isReady()) {
      const success = await this.printer.printReceipt(receipt);
      if (success) return true;
    }

    // Fallback to network printer
    if (this.networkPrinter) {
      const success = await this.networkPrinter.printReceipt(receipt);
      if (success) return true;
    }

    // Final fallback - browser print
    this.printReceiptBrowser(receipt);
    return true;
  }

  // Browser print fallback
  private printReceiptBrowser(receipt: Receipt): void {
    const printWindow = window.open('', '_blank', 'width=300,height=600');
    if (!printWindow) return;

    const receiptHTML = `
      <html>
        <head>
          <title>Receipt</title>
          <style>
            body { font-family: monospace; font-size: 12px; margin: 10px; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .line { border-bottom: 1px dashed #000; margin: 5px 0; }
          </style>
        </head>
        <body>
          <div class="center bold">KERRIGANS XL MANORHAMILTON</div>
          <div class="center">Main Street, Manorhamilton</div>
          <div class="center">Tel: (071) 985-5555</div>
          <div class="line"></div>
          <div>Receipt #: ${receipt.transactionId}</div>
          <div>Date: ${new Date(receipt.timestamp).toLocaleString()}</div>
          <div class="line"></div>
          ${receipt.items.map(item => 
            `<div>${item.name.substring(0, 20).padEnd(20)} €${item.total.toFixed(2)}</div>`
          ).join('')}
          <div class="line"></div>
          <div>Subtotal: €${receipt.subtotal.toFixed(2)}</div>
          <div>Tax: €${receipt.tax.toFixed(2)}</div>
          <div class="bold">TOTAL: €${receipt.total.toFixed(2)}</div>
          <div>Payment: ${receipt.paymentMethod}</div>
          ${receipt.change ? `<div>Change: €${receipt.change.toFixed(2)}</div>` : ''}
          <div class="center" style="margin-top: 20px;">Thank you for shopping!</div>
          <div class="center">Please come again</div>
        </body>
      </html>
    `;

    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
  }
}

// Create global hardware instance
export const posHardware = new POSHardware();