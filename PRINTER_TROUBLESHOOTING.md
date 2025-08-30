# 🖨️ RECEIPT PRINTER TROUBLESHOOTING

## The Issue You're Having

**"Printer says connected but doesn't print automatically or manually"**

This is a common issue with USB thermal printer integration. Here's how to fix it:

## ✅ **QUICK FIXES TO TRY**

### 1. Browser Requirements
- **Use Chrome or Edge** only (Firefox/Safari don't support WebUSB)
- **Enable USB permissions**: Click the lock icon → Site permissions → USB → Allow

### 2. USB Connection Check
```
1. Unplug printer USB cable
2. Close browser tab
3. Plug USB back in
4. Refresh Quantum POS
5. Click "Hardware Setup"
6. Click "Connect Printer"
7. Select your printer from the popup
```

### 3. Printer Compatibility
**Supported printers:**
- Epson TM-T88, TM-T82, TM-T20
- Star TSP650, TSP100
- Custom VKP80, VKP80II
- RONGTA RP58, RP80
- Any ESC/POS thermal printer

**Check your printer model** - if it's not ESC/POS compatible, it won't work via USB.

### 4. Alternative Connection Methods

#### For Network Printers (WiFi/Ethernet):
1. Find your printer's IP address
2. In Hardware Setup, enter IP address
3. Test network printing

#### For Serial/Parallel Printers:
- These require USB-to-Serial adapters
- Not ideal for modern POS systems
- Consider upgrading to USB thermal printer

## 🔧 **ADVANCED TROUBLESHOOTING**

### Check Browser Console
1. **Press F12** to open developer tools
2. **Go to Console tab**
3. **Try printing** a transaction
4. **Look for error messages** like:
   - "TransferOut failed"
   - "Device not found"
   - "Interface claim failed"

### Common Error Solutions

#### "Device not found"
- Printer isn't powered on
- USB cable is loose
- Windows doesn't recognize the device

#### "Interface claim failed"  
- Another program is using the printer (like GERA)
- Driver conflict
- Try different USB port

#### "TransferOut failed"
- Wrong printer command format
- Printer buffer full
- Hardware malfunction

## 🏪 **WORKING WITH GERA SYSTEM**

### Safe Setup
1. **Keep GERA on COM1** (serial port)
2. **Connect Quantum POS printer to USB**
3. **Both systems work independently**
4. **No driver conflicts**

### Sharing One Printer
If you only have one printer:
1. **Connect via network** (WiFi/Ethernet) 
2. **Both GERA and Quantum POS** can use it
3. **Set different print queues** if needed

## 🚨 **IMMEDIATE DEBUG STEPS**

### Step 1: Check Hardware Setup Page
1. Go to main menu → "Hardware Setup"
2. Look for "Printer Status: Connected" 
3. If not connected, click "Connect Printer"
4. Select your thermal printer from popup

### Step 2: Test Print Function
1. In Hardware Setup, click "Test Print"
2. Should print a test receipt immediately
3. If this works, the issue is with automatic printing

### Step 3: Check Transaction Flow
1. Add items to cart
2. Process payment (cash or card)
3. **Watch browser console** (F12) during transaction
4. Look for print-related error messages

## 📋 **WHAT TO CHECK NEXT**

1. **Printer Power**: LED lights on, ready status
2. **Paper**: Loaded correctly, not jammed
3. **USB Cable**: Try different cable/port
4. **Browser**: Only Chrome/Edge work
5. **Permissions**: Allow USB device access

## 💡 **EXPECTED BEHAVIOR**

**When working correctly:**
1. **Transaction completes** → Payment processed
2. **Receipt prints automatically** → Drawer opens (if connected)
3. **"Payment Successful"** message appears
4. **Cart clears** automatically

**If only manual printing works:**
- Automatic trigger might be failing
- Check the transaction completion code
- Hardware integration timing issue

Let me know what specific error messages you see in the browser console, and I can provide more targeted fixes!