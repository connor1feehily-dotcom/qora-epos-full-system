# Hardware Setup Guide for Kerrigan's XL POS System

## Epson Receipt Printer Connection

### Step 1: Physical Connection
1. Connect your Epson receipt printer to the till computer via USB cable
2. Ensure the printer is powered on and has paper loaded
3. Windows will automatically detect the printer (may require driver installation)

### Step 2: Browser Configuration
1. In Chrome/Edge: Go to chrome://flags or edge://flags
2. Enable "Experimental Web Platform Features"
3. Restart the browser
4. This enables the Web Serial API for direct printer communication

### Step 3: ESC/POS Driver Setup (Alternative)
If direct browser connection doesn't work:
1. Install the Epson receipt printer driver from Epson's website
2. Set the printer as your default printer in Windows
3. The POS will fall back to browser print dialogs

### Step 4: Test Connection
1. Open the POS system and go to Admin Options 2 → Hardware Setup
2. Click "Connect Printer"
3. Select your Epson printer from the device list
4. Test print a receipt to verify functionality

## Barcode Scanner Connection

### Step 1: Scanner Mode Configuration
1. Set your barcode scanner to HID (Keyboard emulation) mode
2. Most scanners have configuration barcodes in their manual
3. Scan the "USB HID" or "Keyboard Mode" configuration barcode
4. Scanner should now appear as a keyboard input device

### Step 2: USB Connection
1. Connect the scanner to a USB port on the till computer
2. Windows will recognize it as an HID input device
3. No additional drivers required for most scanners

### Step 3: Browser Permissions (Advanced Mode)
For advanced scanner features:
1. Enable "Experimental Web Platform Features" in browser flags
2. This allows the Web HID API for direct scanner communication
3. The POS can then access scanner features like beep control

### Step 4: Test Scanning
1. In the POS system, go to Admin Options 2 → Hardware Setup
2. Click "Connect Scanner"
3. Grant browser permissions if prompted
4. Scan a product barcode to test functionality

## Customer Display Setup

### Step 1: Dual Monitor Configuration
1. Connect your customer display monitor to the till computer
2. Set up as an extended display (not mirrored) in Windows Display Settings
3. Position the customer display as your secondary monitor

### Step 2: Browser Setup
1. In the POS system, go to Admin Options 2 → Customer Display
2. This opens a new window specifically for the customer-facing screen
3. Drag this window to your customer display monitor
4. Press F11 to make it full screen

### Step 3: Automatic Startup (Optional)
1. Create a Windows startup script to automatically open the customer display
2. Use browser command line parameters to open directly on the second monitor
3. Example: `chrome.exe --new-window --kiosk "http://localhost:5000/customer-display"`

## Network Printing (Alternative Setup)

### For Network-Connected Printers:
1. Ensure the printer has a static IP address
2. Install network printer drivers on the till computer
3. The POS will use standard browser printing to the network printer
4. Configure paper size to 80mm thermal for receipts

## Troubleshooting

### Printer Issues:
- Check USB cable connection
- Verify printer has paper and is online
- Ensure browser has experimental features enabled
- Try different USB ports

### Scanner Issues:
- Verify scanner is in HID/Keyboard mode
- Check USB connection
- Test scanner in a text editor (should type barcodes)
- Grant browser permissions for Web HID access

### Customer Display Issues:
- Check monitor cable and power
- Verify Windows display settings show extended display
- Ensure customer display window is on the correct monitor
- Use F11 to toggle full screen mode

## Hardware Compatibility

### Tested Epson Printers:
- TM-T20III
- TM-T82III
- TM-T88VI
- TM-m30III

### Compatible Barcode Scanners:
- Any USB HID-compatible scanner
- Most handheld and presentation scanners
- 1D and 2D barcode readers

### Customer Display Requirements:
- Any secondary monitor or TV with HDMI/VGA input
- Recommended: 15-22 inch display for optimal visibility
- Touch capability not required (display only)

## Advanced Features

### Receipt Customization:
- Logo printing: Add company logo to receipts
- Custom footer: Add promotional messages
- VAT breakdown: Detailed tax information

### Scanner Configuration:
- Beep control: Enable/disable scan confirmation sounds
- Scan validation: Verify barcode format before processing
- Multi-scan mode: Scan multiple items rapidly

### Customer Display Features:
- Real-time price updates
- Item images and descriptions
- Promotional messages during idle time
- Multi-language support

## Support

For hardware setup assistance:
1. Check manufacturer documentation
2. Contact your hardware supplier
3. Refer to Windows Device Manager for connection issues
4. Use browser developer tools to diagnose Web API issues