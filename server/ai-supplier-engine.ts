// AI-powered supplier order management and inventory matching engine
// Built without external API dependencies using intelligent parsing and analysis

interface OrderParsingResult {
  confidence: number;
  orderData: {
    orderNumber: string;
    supplier: string;
    totalAmount: number;
    orderDate: string;
    expectedDeliveryDate?: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    sku?: string;
    barcode?: string;
  }>;
}

interface InventoryGap {
  productId: number;
  productName: string;
  currentStock: number;
  minStock: number;
  shortfall: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface ReorderSuggestion {
  productId: number;
  productName: string;
  suggestedQuantity: number;
  reasoning: string;
  confidence: number;
  supplierId?: number;
  salesVelocity: number;
  daysOfStock: number;
}

export class AISupplierEngine {
  // Parse email content to extract order information
  static parseEmailOrder(emailSubject: string, emailBody: string, emailFrom: string): OrderParsingResult {
    let confidence = 0;
    let orderData: any = {};
    let items: any[] = [];

    // Enhanced pattern matching for order extraction
    const orderPatterns = [
      /order\s*(?:number|#|id)[\s:]*([A-Z0-9-]+)/i,
      /po\s*(?:number|#|id)[\s:]*([A-Z0-9-]+)/i,
      /reference[\s:]*([A-Z0-9-]+)/i,
      /invoice\s*(?:number|#|id)[\s:]*([A-Z0-9-]+)/i
    ];

    // Extract order number
    for (const pattern of orderPatterns) {
      const match = emailSubject.match(pattern) || emailBody.match(pattern);
      if (match) {
        orderData.orderNumber = match[1];
        confidence += 20;
        break;
      }
    }

    // Extract supplier name from email domain or content
    const emailDomain = emailFrom.split('@')[1];
    const supplierPatterns = [
      /from[\s:]*([A-Za-z\s&]+)(?:\s+ltd|limited|inc|corp)?/i,
      /regards,?\s*([A-Za-z\s&]+)/i,
      /best\s+regards,?\s*([A-Za-z\s&]+)/i
    ];

    for (const pattern of supplierPatterns) {
      const match = emailBody.match(pattern);
      if (match) {
        orderData.supplier = match[1].trim();
        confidence += 15;
        break;
      }
    }

    if (!orderData.supplier) {
      // Use domain as fallback
      orderData.supplier = emailDomain.split('.')[0].toUpperCase();
      confidence += 10;
    }

    // Extract total amount
    const totalPatterns = [
      /total[\s:]*[€£$]?([\d,]+\.?\d*)/i,
      /amount[\s:]*[€£$]?([\d,]+\.?\d*)/i,
      /[€£$]([\d,]+\.?\d*)\s*total/i
    ];

    for (const pattern of totalPatterns) {
      const match = emailBody.match(pattern);
      if (match) {
        orderData.totalAmount = parseFloat(match[1].replace(/,/g, ''));
        confidence += 15;
        break;
      }
    }

    // Extract dates
    const datePatterns = [
      /delivery\s+date[\s:]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
      /expected[\s:]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
      /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/g
    ];

    const dateMatches = emailBody.match(datePatterns[2]);
    if (dateMatches && dateMatches.length > 0) {
      orderData.orderDate = dateMatches[0];
      if (dateMatches.length > 1) {
        orderData.expectedDeliveryDate = dateMatches[1];
      }
      confidence += 10;
    }

    // Extract line items using intelligent parsing
    items = this.extractLineItems(emailBody);
    if (items.length > 0) {
      confidence += Math.min(30, items.length * 5);
    }

    // Ensure minimum confidence and set defaults
    if (!orderData.orderNumber) {
      orderData.orderNumber = `AUTO-${Date.now()}`;
    }
    if (!orderData.totalAmount && items.length > 0) {
      orderData.totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);
      confidence += 5;
    }
    if (!orderData.orderDate) {
      orderData.orderDate = new Date().toISOString().split('T')[0];
    }

    return {
      confidence: Math.min(95, confidence),
      orderData,
      items
    };
  }

  // Extract line items from email content
  private static extractLineItems(emailBody: string): any[] {
    const items: any[] = [];
    const lines = emailBody.split('\n');

    // Patterns for different item formats
    const itemPatterns = [
      // Quantity | Item Name | Unit Price | Total
      /(\d+)\s*\|\s*([^|]+)\s*\|\s*[€£$]?([\d.]+)\s*\|\s*[€£$]?([\d.]+)/,
      // Quantity x Item Name @ Unit Price = Total
      /(\d+)\s*x\s*([^@]+)\s*@\s*[€£$]?([\d.]+)\s*=\s*[€£$]?([\d.]+)/,
      // Item Name - Quantity - Unit Price - Total
      /([A-Za-z][^-]+)\s*-\s*(\d+)\s*-\s*[€£$]?([\d.]+)\s*-\s*[€£$]?([\d.]+)/,
      // Simple: Quantity Item Name Price
      /(\d+)\s+([A-Za-z][A-Za-z\s]+)\s+[€£$]?([\d.]+)/
    ];

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.length < 5) continue;

      for (const pattern of itemPatterns) {
        const match = trimmedLine.match(pattern);
        if (match) {
          let quantity, name, unitPrice, totalPrice;

          if (pattern === itemPatterns[0] || pattern === itemPatterns[1]) {
            // Quantity first patterns
            quantity = parseInt(match[1]);
            name = match[2].trim();
            unitPrice = parseFloat(match[3]);
            totalPrice = parseFloat(match[4]);
          } else if (pattern === itemPatterns[2]) {
            // Name first pattern
            name = match[1].trim();
            quantity = parseInt(match[2]);
            unitPrice = parseFloat(match[3]);
            totalPrice = parseFloat(match[4]);
          } else {
            // Simple pattern
            quantity = parseInt(match[1]);
            name = match[2].trim();
            unitPrice = parseFloat(match[3]);
            totalPrice = quantity * unitPrice;
          }

          if (quantity > 0 && name.length > 2 && unitPrice > 0) {
            items.push({
              name: name.replace(/[^\w\s-]/g, '').trim(),
              quantity,
              unitPrice,
              totalPrice: totalPrice || (quantity * unitPrice),
              sku: this.extractSKU(name),
              barcode: this.extractBarcode(trimmedLine)
            });
          }
          break;
        }
      }
    }

    return items;
  }

  // Extract SKU from product name
  private static extractSKU(productName: string): string | undefined {
    const skuPatterns = [
      /sku[\s:]*([A-Z0-9-]+)/i,
      /code[\s:]*([A-Z0-9-]+)/i,
      /\b([A-Z]{2,4}\d{3,6})\b/,
      /\b(\d{6,12})\b/
    ];

    for (const pattern of skuPatterns) {
      const match = productName.match(pattern);
      if (match) return match[1];
    }
    return undefined;
  }

  // Extract barcode from line
  private static extractBarcode(line: string): string | undefined {
    const barcodePatterns = [
      /barcode[\s:]*(\d{8,14})/i,
      /ean[\s:]*(\d{13})/i,
      /upc[\s:]*(\d{12})/i,
      /\b(\d{13})\b/, // EAN-13
      /\b(\d{12})\b/  // UPC-A
    ];

    for (const pattern of barcodePatterns) {
      const match = line.match(pattern);
      if (match) return match[1];
    }
    return undefined;
  }

  // Analyze inventory to identify gaps
  static analyzeInventoryGaps(products: any[]): InventoryGap[] {
    const gaps: InventoryGap[] = [];

    for (const product of products) {
      const currentStock = product.stock || 0;
      const minStock = product.minStock || 0;

      if (currentStock <= minStock) {
        const shortfall = minStock - currentStock;
        let priority: 'low' | 'medium' | 'high' | 'critical' = 'low';

        if (currentStock === 0) {
          priority = 'critical';
        } else if (shortfall >= minStock * 0.8) {
          priority = 'high';
        } else if (shortfall >= minStock * 0.5) {
          priority = 'medium';
        }

        gaps.push({
          productId: product.id,
          productName: product.name,
          currentStock,
          minStock,
          shortfall,
          priority
        });
      }
    }

    return gaps.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  // Generate AI-powered reorder suggestions
  static generateReorderSuggestions(
    products: any[],
    transactions: any[],
    suppliers: any[]
  ): ReorderSuggestion[] {
    const suggestions: ReorderSuggestion[] = [];
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

    for (const product of products) {
      // Calculate sales velocity from recent transactions
      const recentSales = transactions
        .filter(t => new Date(t.createdAt) >= thirtyDaysAgo)
        .reduce((total, transaction) => {
          const items = transaction.items || [];
          const productSales = items
            .filter((item: any) => item.productId === product.id)
            .reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
          return total + productSales;
        }, 0);

      const salesVelocity = recentSales / 30; // Daily average
      const currentStock = product.stock || 0;
      const minStock = product.minStock || 0;

      // Calculate days of stock remaining
      const daysOfStock = salesVelocity > 0 ? currentStock / salesVelocity : 999;

      // Generate suggestion if stock is running low
      if (daysOfStock <= 14 || currentStock <= minStock) {
        let suggestedQuantity = Math.max(
          minStock * 2, // At least double minimum stock
          Math.ceil(salesVelocity * 21) // 3 weeks of sales
        );

        // Adjust for seasonality (simple heuristic)
        const month = now.getMonth();
        const seasonalFactor = this.getSeasonalFactor(product.category, month);
        suggestedQuantity = Math.ceil(suggestedQuantity * seasonalFactor);

        let reasoning = `Low stock detected. `;
        if (salesVelocity > 0) {
          reasoning += `Daily sales: ${salesVelocity.toFixed(1)} units. `;
          reasoning += `${daysOfStock.toFixed(0)} days of stock remaining. `;
        }
        reasoning += `Suggested reorder: ${suggestedQuantity} units for 3-week supply.`;

        // Calculate confidence based on data availability
        let confidence = 60; // Base confidence
        if (recentSales > 0) confidence += 20;
        if (product.minStock > 0) confidence += 10;
        if (salesVelocity >= 1) confidence += 10;

        // Find preferred supplier (mock logic)
        const preferredSupplier = suppliers.find(s => 
          s.name.toLowerCase().includes(product.category.toLowerCase())
        );

        suggestions.push({
          productId: product.id,
          productName: product.name,
          suggestedQuantity,
          reasoning,
          confidence: Math.min(95, confidence),
          supplierId: preferredSupplier?.id,
          salesVelocity,
          daysOfStock: Math.round(daysOfStock)
        });
      }
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  // Simple seasonal factor calculation
  private static getSeasonalFactor(category: string, month: number): number {
    const categoryLower = category.toLowerCase();
    
    // Summer boost for beverages (May-August)
    if (categoryLower.includes('beverage') || categoryLower.includes('drink')) {
      if (month >= 4 && month <= 7) return 1.3;
    }

    // Winter boost for hot items (Nov-Feb)
    if (categoryLower.includes('soup') || categoryLower.includes('coffee')) {
      if (month >= 10 || month <= 1) return 1.2;
    }

    // Holiday boost (November-December)
    if (month >= 10 && month <= 11) {
      if (categoryLower.includes('snack') || categoryLower.includes('alcohol')) {
        return 1.4;
      }
    }

    return 1.0; // No seasonal adjustment
  }

  // Match parsed order items to existing inventory
  static matchOrderToInventory(orderItems: any[], products: any[]) {
    const matchedItems = [];
    const unmatchedItems = [];

    for (const orderItem of orderItems) {
      let bestMatch = null;
      let bestScore = 0;

      // Try to match by barcode first
      if (orderItem.barcode) {
        bestMatch = products.find(p => p.barcode === orderItem.barcode);
        if (bestMatch) {
          bestScore = 100;
        }
      }

      // Try to match by SKU
      if (!bestMatch && orderItem.sku) {
        bestMatch = products.find(p => 
          p.barcode?.includes(orderItem.sku) || 
          p.name.toLowerCase().includes(orderItem.sku.toLowerCase())
        );
        if (bestMatch) bestScore = 90;
      }

      // Try to match by name similarity
      if (!bestMatch) {
        for (const product of products) {
          const score = this.calculateNameSimilarity(
            orderItem.name.toLowerCase(),
            product.name.toLowerCase()
          );
          
          if (score > bestScore && score >= 60) {
            bestMatch = product;
            bestScore = score;
          }
        }
      }

      if (bestMatch && bestScore >= 60) {
        matchedItems.push({
          ...orderItem,
          matchedProduct: bestMatch,
          matchScore: bestScore,
          suggestedPrice: this.calculateSuggestedPrice(orderItem.unitPrice, bestMatch.price),
          marginPercentage: this.calculateMargin(orderItem.unitPrice, bestMatch.price)
        });
      } else {
        unmatchedItems.push(orderItem);
      }
    }

    return { matchedItems, unmatchedItems };
  }

  // Calculate string similarity using Levenshtein-inspired algorithm
  private static calculateNameSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 100;
    
    const words1 = str1.split(/\s+/);
    const words2 = str2.split(/\s+/);
    
    let matchingWords = 0;
    let totalWords = Math.max(words1.length, words2.length);
    
    for (const word1 of words1) {
      for (const word2 of words2) {
        if (word1.includes(word2) || word2.includes(word1)) {
          matchingWords++;
          break;
        }
      }
    }
    
    return Math.round((matchingWords / totalWords) * 100);
  }

  // Calculate suggested retail price
  private static calculateSuggestedPrice(costPrice: number, currentPrice: number): number {
    // Apply standard markup (e.g., 40% margin)
    const suggestedPrice = costPrice * 1.67; // ~40% margin
    
    // Don't suggest price lower than current unless significant cost savings
    if (suggestedPrice < currentPrice * 0.9) {
      return currentPrice;
    }
    
    return Math.round(suggestedPrice * 100) / 100;
  }

  // Calculate profit margin percentage
  private static calculateMargin(costPrice: number, salePrice: number): number {
    if (salePrice <= costPrice) return 0;
    return Math.round(((salePrice - costPrice) / salePrice) * 100 * 100) / 100;
  }

  // Process webhook data (placeholder for webhook handling)
  static processWebhookData(webhookData: any, eventType: string) {
    const processedData: any = {
      eventType,
      processedAt: new Date().toISOString(),
      confidence: 85
    };

    switch (eventType) {
      case 'order_placed':
        processedData.orderData = {
          orderNumber: webhookData.order_id || webhookData.id,
          status: 'pending_approval',
          totalAmount: webhookData.total || webhookData.amount,
          orderDate: webhookData.created_at || new Date().toISOString()
        };
        break;
        
      case 'order_shipped':
        processedData.shippingData = {
          trackingNumber: webhookData.tracking_number,
          carrier: webhookData.carrier,
          estimatedDelivery: webhookData.estimated_delivery
        };
        break;
        
      case 'order_delivered':
        processedData.deliveryData = {
          deliveredAt: webhookData.delivered_at || new Date().toISOString(),
          signature: webhookData.signature
        };
        break;
    }

    return processedData;
  }
}