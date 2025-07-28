import { Request, Response } from "express";
import { storage } from "../storage";
import { z } from "zod";

// Get all supplier order integrations
export async function getSupplierOrderIntegrations(req: Request, res: Response) {
  try {
    const integrations = await storage.getSupplierOrderIntegrations();
    res.json(integrations);
  } catch (error) {
    console.error('Error fetching supplier order integrations:', error);
    res.status(500).json({ error: 'Failed to fetch supplier order integrations' });
  }
}

// Get supplier order integration by ID
export async function getSupplierOrderIntegration(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    const integration = await storage.getSupplierOrderIntegration(id);
    
    if (!integration) {
      return res.status(404).json({ error: 'Supplier order integration not found' });
    }
    
    res.json(integration);
  } catch (error) {
    console.error('Error fetching supplier order integration:', error);
    res.status(500).json({ error: 'Failed to fetch supplier order integration' });
  }
}

// Create supplier order integration (manual)
export async function createSupplierOrderIntegration(req: Request, res: Response) {
  try {
    const integrationData = {
      ...req.body,
      orderDate: new Date(req.body.orderDate),
      expectedDeliveryDate: req.body.expectedDeliveryDate ? new Date(req.body.expectedDeliveryDate) : null
    };
    
    const integration = await storage.createSupplierOrderIntegration(integrationData);
    
    // Create notification for management
    await storage.createNotification({
      userId: null, // Broadcast to all managers
      type: 'supplier_order_approval',
      title: 'New Supplier Order Pending Approval',
      message: `Order ${integration.externalOrderNumber} from supplier requires approval`,
      data: { orderId: integration.id },
      priority: 'high'
    });
    
    res.json(integration);
  } catch (error) {
    console.error('Error creating supplier order integration:', error);
    res.status(500).json({ error: 'Failed to create supplier order integration' });
  }
}

// Approve supplier order
export async function approveSupplierOrder(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    const userId = req.body.userId || 1; // Current user ID
    
    const integration = await storage.getSupplierOrderIntegration(id);
    if (!integration) {
      return res.status(404).json({ error: 'Supplier order integration not found' });
    }
    
    // Update integration status
    await storage.updateSupplierOrderIntegration(id, {
      status: 'approved',
      approvedBy: userId,
      approvedAt: new Date()
    });
    
    // Create purchase order from the integration
    const purchaseOrder = await storage.createPurchaseOrder({
      supplierId: integration.supplierId,
      poNumber: `PO-SI-${integration.id}-${Date.now()}`,
      status: 'sent',
      totalAmount: integration.totalAmount,
      orderDate: integration.orderDate,
      expectedDate: integration.expectedDeliveryDate || new Date(),
      createdBy: userId,
      notes: `Created from supplier order integration #${integration.id} - ${integration.externalOrderNumber}`
    });
    
    // Add purchase order items
    if (integration.orderItems && Array.isArray(integration.orderItems)) {
      for (const item of integration.orderItems) {
        // Try to find matching product
        const products = await storage.getProducts();
        const matchingProduct = products.find(p => 
          p.name?.toLowerCase().includes(item.name?.toLowerCase()) ||
          p.barcode === item.barcode
        );
        
        await storage.addPurchaseOrderItem({
          purchaseOrderId: purchaseOrder.id,
          productId: matchingProduct?.id,
          productName: item.name || item.description,
          quantity: parseInt(item.quantity || 1),
          unitCost: parseFloat(item.price || item.unitPrice || 0),
          totalCost: parseFloat(item.price || item.unitPrice || 0) * parseInt(item.quantity || 1)
        });
      }
    }
    
    // Create notification for confirmation
    await storage.createNotification({
      userId: integration.orderedBy,
      type: 'supplier_order_approved',
      title: 'Supplier Order Approved',
      message: `Your order ${integration.externalOrderNumber} has been approved and added to purchase orders`,
      data: { orderId: integration.id, purchaseOrderId: purchaseOrder.id },
      priority: 'normal'
    });
    
    res.json({ 
      message: 'Supplier order approved and purchase order created',
      integration: await storage.getSupplierOrderIntegration(id),
      purchaseOrder 
    });
  } catch (error) {
    console.error('Error approving supplier order:', error);
    res.status(500).json({ error: 'Failed to approve supplier order' });
  }
}

// Reject supplier order
export async function rejectSupplierOrder(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    const userId = req.body.userId || 1; // Current user ID
    const reason = req.body.reason || 'No reason provided';
    
    const integration = await storage.getSupplierOrderIntegration(id);
    if (!integration) {
      return res.status(404).json({ error: 'Supplier order integration not found' });
    }
    
    // Update integration status
    await storage.updateSupplierOrderIntegration(id, {
      status: 'rejected',
      rejectedBy: userId,
      rejectedAt: new Date(),
      rejectionReason: reason
    });
    
    // Create notification for rejection
    await storage.createNotification({
      userId: integration.orderedBy,
      type: 'supplier_order_rejected',
      title: 'Supplier Order Rejected',
      message: `Your order ${integration.externalOrderNumber} has been rejected: ${reason}`,
      data: { orderId: integration.id },
      priority: 'normal'
    });
    
    res.json({ 
      message: 'Supplier order rejected',
      integration: await storage.getSupplierOrderIntegration(id)
    });
  } catch (error) {
    console.error('Error rejecting supplier order:', error);
    res.status(500).json({ error: 'Failed to reject supplier order' });
  }
}

// Email order capture endpoints
export async function getEmailOrderCaptures(req: Request, res: Response) {
  try {
    const captures = await storage.getEmailOrderCaptures();
    res.json(captures);
  } catch (error) {
    console.error('Error fetching email order captures:', error);
    res.status(500).json({ error: 'Failed to fetch email order captures' });
  }
}

// Process incoming email (webhook endpoint)
export async function processIncomingEmail(req: Request, res: Response) {
  try {
    const emailData = req.body;
    
    // Create email capture record
    const capture = await storage.createEmailOrderCapture({
      emailSubject: emailData.subject,
      emailFrom: emailData.from,
      emailTo: emailData.to,
      emailBody: emailData.body,
      processingStatus: 'pending'
    });
    
    // AI processing would happen here
    // For now, we'll simulate basic parsing
    const extractedData = await processEmailForOrderData(emailData);
    
    if (extractedData.confidence > 70) {
      // Create supplier order integration if confidence is high
      const integration = await storage.createSupplierOrderIntegration({
        supplierId: extractedData.supplierId || 1,
        supplierOrderId: extractedData.orderNumber || `EMAIL-${capture.id}`,
        externalOrderNumber: extractedData.orderNumber || `EMAIL-${capture.id}`,
        orderSource: 'email',
        orderData: extractedData,
        orderItems: extractedData.items || [],
        totalAmount: extractedData.total || 0,
        currency: 'EUR',
        orderDate: extractedData.orderDate || new Date(),
        expectedDeliveryDate: extractedData.deliveryDate,
        orderedBy: 1 // Valerie's user ID
      });
      
      // Update email capture with processing results
      await storage.updateEmailOrderCapture(capture.id, {
        extractedOrderData: extractedData,
        parsedItems: extractedData.items || [],
        supplierOrderIntegrationId: integration.id,
        processingStatus: 'processed',
        confidence: extractedData.confidence,
        processedAt: new Date()
      });
    } else {
      // Low confidence - mark for manual review
      await storage.updateEmailOrderCapture(capture.id, {
        extractedOrderData: extractedData,
        parsedItems: extractedData.items || [],
        processingStatus: 'manual_review_required',
        confidence: extractedData.confidence,
        processedAt: new Date()
      });
    }
    
    res.json({ message: 'Email processed successfully', capture });
  } catch (error) {
    console.error('Error processing incoming email:', error);
    res.status(500).json({ error: 'Failed to process incoming email' });
  }
}

// Supplier webhooks endpoints
export async function getSupplierWebhooks(req: Request, res: Response) {
  try {
    const webhooks = await storage.getSupplierWebhooks();
    res.json(webhooks);
  } catch (error) {
    console.error('Error fetching supplier webhooks:', error);
    res.status(500).json({ error: 'Failed to fetch supplier webhooks' });
  }
}

export async function createSupplierWebhook(req: Request, res: Response) {
  try {
    const webhook = await storage.createSupplierWebhook(req.body);
    res.json(webhook);
  } catch (error) {
    console.error('Error creating supplier webhook:', error);
    res.status(500).json({ error: 'Failed to create supplier webhook' });
  }
}

// Handle incoming webhook from supplier
export async function handleSupplierWebhook(req: Request, res: Response) {
  try {
    const { supplierId } = req.params;
    const webhookData = req.body;
    
    // Verify webhook authenticity here (check secret key, signature, etc.)
    
    // Process webhook data based on event type
    if (webhookData.event === 'order_placed') {
      const integration = await storage.createSupplierOrderIntegration({
        supplierId: parseInt(supplierId),
        supplierOrderId: webhookData.order.id,
        externalOrderNumber: webhookData.order.number,
        orderSource: 'webhook',
        orderData: webhookData.order,
        orderItems: webhookData.order.items || [],
        totalAmount: webhookData.order.total,
        currency: webhookData.order.currency || 'EUR',
        orderDate: new Date(webhookData.order.created_at),
        expectedDeliveryDate: webhookData.order.delivery_date ? new Date(webhookData.order.delivery_date) : null,
        orderedBy: 1 // Valerie's user ID
      });
      
      res.json({ message: 'Webhook processed successfully', integration });
    } else {
      res.json({ message: 'Webhook received but not processed' });
    }
  } catch (error) {
    console.error('Error handling supplier webhook:', error);
    res.status(500).json({ error: 'Failed to handle supplier webhook' });
  }
}

// Simulate AI processing of email content
async function processEmailForOrderData(emailData: any) {
  // This would use AI/ML to extract order information from email content
  // For demonstration, we'll use simple pattern matching
  
  const body = emailData.body?.toLowerCase() || '';
  const subject = emailData.subject?.toLowerCase() || '';
  
  let confidence = 0;
  let extractedData: any = {
    items: [],
    total: 0,
    orderNumber: null,
    orderDate: new Date(),
    supplierId: null
  };
  
  // Check for order confirmation keywords
  if (subject.includes('order') || subject.includes('confirmation') || subject.includes('receipt')) {
    confidence += 30;
  }
  
  // Try to extract order number
  const orderNumberMatch = body.match(/order\s*#?\s*:?\s*([a-z0-9]+)/i) || 
                          subject.match(/order\s*#?\s*:?\s*([a-z0-9]+)/i);
  if (orderNumberMatch) {
    extractedData.orderNumber = orderNumberMatch[1];
    confidence += 20;
  }
  
  // Try to extract total amount
  const totalMatch = body.match(/total\s*:?\s*[€$£]?(\d+\.?\d*)/i);
  if (totalMatch) {
    extractedData.total = parseFloat(totalMatch[1]);
    confidence += 20;
  }
  
  // Try to extract items (basic pattern)
  const itemMatches = body.match(/(\d+)\s*x\s*([^€$£\n]+)\s*[€$£]?(\d+\.?\d*)/gi);
  if (itemMatches) {
    extractedData.items = itemMatches.map((match: string) => {
      const parts = match.match(/(\d+)\s*x\s*([^€$£\n]+)\s*[€$£]?(\d+\.?\d*)/i);
      return {
        quantity: parseInt(parts?.[1] || '1'),
        name: parts?.[2]?.trim(),
        price: parseFloat(parts?.[3] || '0')
      };
    });
    confidence += 30;
  }
  
  return {
    ...extractedData,
    confidence: Math.min(confidence, 100)
  };
}