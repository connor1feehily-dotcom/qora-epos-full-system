import type { Request, Response } from "express";
import { storage } from "../storage";
import { z } from "zod";

// OCR processing simulation - In production, this would use services like:
// - Google Vision API
// - AWS Textract
// - Azure Computer Vision
// - Tesseract.js for client-side processing

interface ScannedProduct {
  id?: number;
  name: string;
  barcode?: string;
  quantity: number;
  unitPrice: number;
  total: number;
  matched: boolean;
  confidence: number;
  originalText: string;
}

interface DeliveryDocket {
  id: string;
  supplierName: string;
  deliveryDate: string;
  invoiceNumber: string;
  products: ScannedProduct[];
  totalAmount: number;
  status: 'scanned' | 'processing' | 'matched' | 'imported';
}

const scanDocketSchema = z.object({
  imageData: z.string(),
  existingProducts: z.array(z.any()).optional()
});

const importDeliverySchema = z.object({
  id: z.string(),
  supplierName: z.string(),
  deliveryDate: z.string(),
  invoiceNumber: z.string(),
  products: z.array(z.object({
    id: z.number().optional(),
    name: z.string(),
    barcode: z.string().optional(),
    quantity: z.number(),
    unitPrice: z.number(),
    total: z.number(),
    matched: z.boolean(),
    confidence: z.number(),
    originalText: z.string()
  })),
  totalAmount: z.number(),
  status: z.enum(['scanned', 'processing', 'matched', 'imported'])
});

// Simulate OCR text extraction and product parsing
function simulateOCRProcessing(imageData: string, existingProducts: any[] = []): DeliveryDocket {
  // In a real implementation, this would:
  // 1. Send image to OCR service
  // 2. Extract text using AI/ML
  // 3. Parse product information
  // 4. Match against existing products
  
  // For demonstration, we'll simulate realistic OCR results
  const mockExtractedText = `
    KERRIGANS XL SUPPLIER INVOICE
    Invoice: INV-2025-001234
    Date: ${new Date().toISOString().split('T')[0]}
    
    PRODUCTS:
    Coca Cola 500ml x24     €18.99
    Tayto Crisps Cheese     €2.49
    Brennans Bread White    €1.89
    Milk Fresh 2L           €2.35
    Cadbury Dairy Milk      €3.29
    
    TOTAL: €29.01
  `;

  // Parse the extracted text into structured data
  const products = parseExtractedText(mockExtractedText, existingProducts);
  
  return {
    id: `docket-${Date.now()}`,
    supplierName: "Kerrigans XL Supplier",
    deliveryDate: new Date().toISOString().split('T')[0],
    invoiceNumber: "INV-2025-001234",
    products,
    totalAmount: products.reduce((sum, p) => sum + p.total, 0),
    status: 'matched'
  };
}

function parseExtractedText(text: string, existingProducts: any[]): ScannedProduct[] {
  // Simulate intelligent parsing of OCR text
  const mockProducts = [
    { name: "Coca Cola 500ml", quantity: 24, unitPrice: 0.79, barcode: "5449000000996" },
    { name: "Tayto Crisps Cheese & Onion", quantity: 1, unitPrice: 2.49, barcode: "5011306001041" },
    { name: "Brennans Bread White", quantity: 1, unitPrice: 1.89, barcode: "5011021003326" },
    { name: "Fresh Milk 2L", quantity: 1, unitPrice: 2.35, barcode: "5011021001018" },
    { name: "Cadbury Dairy Milk", quantity: 1, unitPrice: 3.29, barcode: "7622210001771" }
  ];

  return mockProducts.map(product => {
    // Try to match against existing products
    const existingMatch = existingProducts.find(p => 
      p.name.toLowerCase().includes(product.name.toLowerCase().split(' ')[0]) ||
      p.barcode === product.barcode
    );

    return {
      id: existingMatch?.id,
      name: product.name,
      barcode: product.barcode,
      quantity: product.quantity,
      unitPrice: product.unitPrice,
      total: product.quantity * product.unitPrice,
      matched: !!existingMatch,
      confidence: existingMatch ? 0.95 : 0.75,
      originalText: `${product.name} x${product.quantity} €${product.unitPrice}`
    };
  });
}

export async function scanDocket(req: Request, res: Response) {
  try {
    const { imageData, existingProducts } = scanDocketSchema.parse(req.body);
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const processedDocket = simulateOCRProcessing(imageData, existingProducts);
    
    res.json(processedDocket);
  } catch (error) {
    console.error('Docket scanning error:', error);
    res.status(400).json({ 
      error: 'Failed to process docket',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export async function importDelivery(req: Request, res: Response) {
  try {
    const deliveryData = importDeliverySchema.parse(req.body);
    
    // Process each product in the delivery
    const importResults = [];
    
    for (const product of deliveryData.products) {
      try {
        let productRecord;
        
        if (product.matched && product.id) {
          // Update existing product stock
          const existingProduct = await storage.getProduct(product.id);
          if (existingProduct) {
            const newStock = existingProduct.stock + product.quantity;
            productRecord = await storage.updateProduct(product.id, {
              stock: newStock,
              costPrice: product.unitPrice.toString()
            });
            
            // Create audit log for stock update
            await storage.createAuditLog({
              userId: 1, // Should be current user
              tableName: 'products',
              recordId: product.id.toString(),
              action: 'UPDATE',
              changes: JSON.stringify({
                stock: { from: existingProduct.stock, to: newStock },
                reason: `Delivery import: ${deliveryData.invoiceNumber}`
              })
            });
          }
        } else {
          // Create new product
          productRecord = await storage.createProduct({
            name: product.name,
            barcode: product.barcode || '',
            price: (product.unitPrice * 1.2).toString(), // Add 20% markup
            costPrice: product.unitPrice.toString(),
            stock: product.quantity,
            category: 'General',
            description: `Imported from delivery: ${deliveryData.invoiceNumber}`,
            isActive: true
          });
          
          // Create audit log for new product
          await storage.createAuditLog({
            userId: 1, // Should be current user
            tableName: 'products',
            recordId: productRecord.id.toString(),
            action: 'CREATE',
            changes: JSON.stringify({
              reason: `New product from delivery: ${deliveryData.invoiceNumber}`,
              supplier: deliveryData.supplierName
            })
          });
        }
        
        importResults.push({
          product: product.name,
          action: product.matched ? 'updated' : 'created',
          success: true,
          id: productRecord?.id
        });
        
      } catch (productError) {
        console.error(`Error processing product ${product.name}:`, productError);
        importResults.push({
          product: product.name,
          action: 'failed',
          success: false,
          error: productError instanceof Error ? productError.message : 'Unknown error'
        });
      }
    }
    
    // Create purchase order record for tracking
    try {
      const purchaseOrder = await storage.createPurchaseOrder({
        supplierId: 1, // Default supplier - should be matched or created
        orderDate: new Date(deliveryData.deliveryDate),
        expectedDate: new Date(deliveryData.deliveryDate),
        status: 'delivered',
        notes: `Imported from scanned docket: ${deliveryData.invoiceNumber}`,
        totalAmount: deliveryData.totalAmount.toString()
      });
      
      // Add items to purchase order
      for (const product of deliveryData.products) {
        if (importResults.find(r => r.product === product.name)?.success) {
          await storage.addPurchaseOrderItem({
            purchaseOrderId: purchaseOrder.id,
            productId: importResults.find(r => r.product === product.name)?.id || 0,
            quantity: product.quantity,
            unitCost: product.unitPrice.toString(),
            receivedQuantity: product.quantity
          });
        }
      }
    } catch (orderError) {
      console.error('Error creating purchase order:', orderError);
      // Don't fail the entire import for this
    }
    
    res.json({
      success: true,
      message: `Successfully imported ${importResults.filter(r => r.success).length} of ${importResults.length} products`,
      results: importResults,
      deliveryId: deliveryData.id
    });
    
  } catch (error) {
    console.error('Delivery import error:', error);
    res.status(400).json({
      error: 'Failed to import delivery',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Get delivery history for tracking
export async function getDeliveryHistory(req: Request, res: Response) {
  try {
    // Get recent purchase orders that were imported from scanned dockets
    const deliveries = await storage.getPurchaseOrders();
    
    const recentDeliveries = deliveries
      .filter(po => po.notes?.includes('scanned docket'))
      .slice(0, 20)
      .map(po => ({
        id: po.id,
        supplierName: 'Supplier', // Would get from supplier table
        deliveryDate: po.orderDate,
        invoiceNumber: po.notes?.match(/docket: (.+)/)?.[1] || 'Unknown',
        totalAmount: parseFloat(po.totalAmount),
        status: po.status,
        itemCount: 0 // Would count items
      }));
    
    res.json(recentDeliveries);
  } catch (error) {
    console.error('Error fetching delivery history:', error);
    res.status(500).json({ error: 'Failed to fetch delivery history' });
  }
}

// Smart product suggestions for manual entry
export async function getProductSuggestions(req: Request, res: Response) {
  try {
    const { query } = req.query as { query: string };
    
    if (!query || query.length < 2) {
      return res.json([]);
    }
    
    const products = await storage.getProducts();
    const suggestions = products
      .filter(p => 
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.barcode?.includes(query)
      )
      .slice(0, 10)
      .map(p => ({
        id: p.id,
        name: p.name,
        barcode: p.barcode,
        currentPrice: parseFloat(p.price),
        currentStock: p.stock,
        category: p.category
      }));
    
    res.json(suggestions);
  } catch (error) {
    console.error('Error getting product suggestions:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
}