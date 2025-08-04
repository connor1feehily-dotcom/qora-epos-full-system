import { Router } from "express";
import { db } from "../db";
import { stockTakeSessions, stockTakeItems, products } from "../../shared/schema";
import { eq, and, desc } from "drizzle-orm";

const router = Router();

// Get all stock take sessions
router.get("/sessions", async (req, res) => {
  try {
    const sessions = await db
      .select()
      .from(stockTakeSessions)
      .orderBy(desc(stockTakeSessions.startedAt));
    
    res.json(sessions);
  } catch (error) {
    console.error("Error fetching stock take sessions:", error);
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
});

// Create new stock take session
router.post("/sessions", async (req, res) => {
  try {
    const { sessionName, startedBy, notes } = req.body;
    
    const [session] = await db
      .insert(stockTakeSessions)
      .values({
        sessionName,
        startedBy,
        notes,
        status: "active"
      })
      .returning();
    
    res.json(session);
  } catch (error) {
    console.error("Error creating stock take session:", error);
    res.status(500).json({ error: "Failed to create session" });
  }
});

// Get items for a specific session
router.get("/items/:sessionId", async (req, res) => {
  try {
    const sessionId = parseInt(req.params.sessionId);
    
    const items = await db
      .select()
      .from(stockTakeItems)
      .where(eq(stockTakeItems.sessionId, sessionId))
      .orderBy(desc(stockTakeItems.scannedAt));
    
    res.json(items);
  } catch (error) {
    console.error("Error fetching stock take items:", error);
    res.status(500).json({ error: "Failed to fetch items" });
  }
});

// Add new scanned item
router.post("/items", async (req, res) => {
  try {
    const {
      sessionId,
      barcode,
      productName,
      category,
      quantity,
      unitPrice,
      totalValue,
      scannedBy,
      deviceInfo
    } = req.body;
    
    // Check if barcode already exists in this session
    const existingItem = await db
      .select()
      .from(stockTakeItems)
      .where(
        and(
          eq(stockTakeItems.sessionId, sessionId),
          eq(stockTakeItems.barcode, barcode)
        )
      );
    
    if (existingItem.length > 0) {
      // Update existing item quantity
      const [updatedItem] = await db
        .update(stockTakeItems)
        .set({
          quantity: existingItem[0].quantity + quantity,
          totalValue: ((existingItem[0].quantity + quantity) * Number(unitPrice)).toString()
        })
        .where(eq(stockTakeItems.id, existingItem[0].id))
        .returning();
      
      res.json(updatedItem);
    } else {
      // Insert new item
      const [item] = await db
        .insert(stockTakeItems)
        .values({
          sessionId,
          barcode,
          productName,
          category: category || "General",
          quantity,
          unitPrice: unitPrice.toString(),
          totalValue: totalValue.toString(),
          scannedBy,
          deviceInfo,
          isProcessed: false
        })
        .returning();
      
      // Update session totals
      await db
        .update(stockTakeSessions)
        .set({
          totalItemsScanned: await getTotalItemsForSession(sessionId),
          totalValue: await getTotalValueForSession(sessionId)
        })
        .where(eq(stockTakeSessions.id, sessionId));
      
      res.json(item);
    }
  } catch (error) {
    console.error("Error adding stock take item:", error);
    res.status(500).json({ error: "Failed to add item" });
  }
});

// Update scanned item
router.put("/items/:itemId", async (req, res) => {
  try {
    const itemId = parseInt(req.params.itemId);
    const { productName, category, quantity, unitPrice } = req.body;
    
    const totalValue = (quantity * Number(unitPrice)).toString();
    
    const [item] = await db
      .update(stockTakeItems)
      .set({
        productName,
        category,
        quantity,
        unitPrice: unitPrice.toString(),
        totalValue
      })
      .where(eq(stockTakeItems.id, itemId))
      .returning();
    
    res.json(item);
  } catch (error) {
    console.error("Error updating stock take item:", error);
    res.status(500).json({ error: "Failed to update item" });
  }
});

// Delete scanned item
router.delete("/items/:itemId", async (req, res) => {
  try {
    const itemId = parseInt(req.params.itemId);
    
    await db
      .delete(stockTakeItems)
      .where(eq(stockTakeItems.id, itemId));
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting stock take item:", error);
    res.status(500).json({ error: "Failed to delete item" });
  }
});

// Finalize stock take - convert items to actual products
router.post("/finalize", async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    // Get all unprocessed items for this session
    const items = await db
      .select()
      .from(stockTakeItems)
      .where(
        and(
          eq(stockTakeItems.sessionId, sessionId),
          eq(stockTakeItems.isProcessed, false)
        )
      );
    
    // Convert each item to a product
    for (const item of items) {
      // Check if product with this barcode already exists
      const existingProduct = await db
        .select()
        .from(products)
        .where(eq(products.barcode, item.barcode));
      
      if (existingProduct.length === 0) {
        // Create new product
        await db
          .insert(products)
          .values({
            name: item.productName || `Product ${item.barcode}`,
            barcode: item.barcode,
            price: item.unitPrice || "0.00",
            cost: "0.00", // Will be updated later with purchase orders
            category: item.category || "General",
            stock: item.quantity || 0,
            minStock: Math.max(1, Math.floor((item.quantity || 0) * 0.1)), // 10% of initial stock as min
            isActive: true,
            vatRate: "0.00" // Default VAT rate
          });
      } else {
        // Update existing product stock
        await db
          .update(products)
          .set({
            stock: existingProduct[0].stock + (item.quantity || 0),
            price: item.unitPrice || existingProduct[0].price
          })
          .where(eq(products.id, existingProduct[0].id));
      }
      
      // Mark item as processed
      await db
        .update(stockTakeItems)
        .set({ isProcessed: true })
        .where(eq(stockTakeItems.id, item.id));
    }
    
    // Mark session as completed
    await db
      .update(stockTakeSessions)
      .set({
        status: "completed",
        completedAt: new Date()
      })
      .where(eq(stockTakeSessions.id, sessionId));
    
    res.json({ 
      success: true, 
      message: `Successfully added ${items.length} products to inventory` 
    });
  } catch (error) {
    console.error("Error finalizing stock take:", error);
    res.status(500).json({ error: "Failed to finalize stock take" });
  }
});

// Helper functions
async function getTotalItemsForSession(sessionId: number): Promise<number> {
  const result = await db
    .select()
    .from(stockTakeItems)
    .where(eq(stockTakeItems.sessionId, sessionId));
  
  const total = result.reduce((sum, item) => sum + (item.quantity || 0), 0);
  return total;
}

async function getTotalValueForSession(sessionId: number): Promise<string> {
  const result = await db
    .select()
    .from(stockTakeItems)
    .where(eq(stockTakeItems.sessionId, sessionId));
  
  const total = result.reduce((sum, item) => sum + Number(item.totalValue || 0), 0);
  return total.toFixed(2);
}

export default router;