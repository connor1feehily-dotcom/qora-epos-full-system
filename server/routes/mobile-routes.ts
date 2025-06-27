import { Request, Response } from 'express';
import { storage } from '../storage';
import { securityHeaders } from '../security/pci-compliance';
import { 
  insertNotificationSchema, 
  insertMobileDeviceSchema, 
  insertApprovalWorkflowSchema 
} from '@shared/schema';

// Real-time notification system
export const getNotifications = [
  securityHeaders,
  async (req: Request, res: Response) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const notifications = await storage.getNotifications(req.session.userId);
      res.json(notifications);
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  }
];

export const markNotificationRead = [
  securityHeaders,
  async (req: Request, res: Response) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { notificationId } = req.params;
      const success = await storage.markNotificationRead(parseInt(notificationId));
      
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: 'Notification not found' });
      }
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ error: 'Failed to update notification' });
    }
  }
];

// Mobile device registration
export const registerMobileDevice = [
  securityHeaders,
  async (req: Request, res: Response) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const deviceData = insertMobileDeviceSchema.parse({
        ...req.body,
        userId: req.session.userId
      });

      const device = await storage.registerMobileDevice(deviceData);
      res.json(device);
    } catch (error: any) {
      console.error('Error registering mobile device:', error);
      res.status(500).json({ error: 'Failed to register device' });
    }
  }
];

// Real-time sales alerts
export const getSalesAlerts = [
  securityHeaders,
  async (req: Request, res: Response) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { timeframe = '24h' } = req.query;
      const alerts = await storage.getSalesAlerts(req.session.userId, timeframe as string);
      res.json(alerts);
    } catch (error: any) {
      console.error('Error fetching sales alerts:', error);
      res.status(500).json({ error: 'Failed to fetch sales alerts' });
    }
  }
];

// Mobile inventory management
export const getMobileInventory = [
  securityHeaders,
  async (req: Request, res: Response) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { lowStock, search } = req.query;
      const inventory = await storage.getMobileInventory({
        lowStock: lowStock === 'true',
        search: search as string
      });
      
      res.json(inventory);
    } catch (error: any) {
      console.error('Error fetching mobile inventory:', error);
      res.status(500).json({ error: 'Failed to fetch inventory' });
    }
  }
];

export const adjustInventory = [
  securityHeaders,
  async (req: Request, res: Response) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { productId, adjustment, reason } = req.body;
      
      if (!productId || adjustment === undefined) {
        return res.status(400).json({ error: 'Product ID and adjustment amount required' });
      }

      const result = await storage.adjustInventory(productId, adjustment, {
        userId: req.session.userId,
        reason: reason || 'Mobile adjustment'
      });

      // Create notification for inventory adjustment
      if (Math.abs(adjustment) > 10) {
        await storage.createNotification({
          userId: req.session.userId,
          type: 'inventory_adjustment',
          title: 'Inventory Adjustment',
          message: `Stock adjusted by ${adjustment} for product ${result.product.name}`,
          data: { productId, adjustment, reason },
          priority: 'normal'
        });
      }

      res.json(result);
    } catch (error: any) {
      console.error('Error adjusting inventory:', error);
      res.status(500).json({ error: 'Failed to adjust inventory' });
    }
  }
];

// Approval workflows
export const getPendingApprovals = [
  securityHeaders,
  async (req: Request, res: Response) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user || !['manager', 'admin'].includes(user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const approvals = await storage.getPendingApprovals(user.role);
      res.json(approvals);
    } catch (error: any) {
      console.error('Error fetching pending approvals:', error);
      res.status(500).json({ error: 'Failed to fetch pending approvals' });
    }
  }
];

export const processApproval = [
  securityHeaders,
  async (req: Request, res: Response) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user || !['manager', 'admin'].includes(user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const { approvalId } = req.params;
      const { action, notes } = req.body; // 'approve' or 'reject'

      if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({ error: 'Invalid action' });
      }

      const result = await storage.processApproval(parseInt(approvalId), {
        action,
        approvedBy: req.session.userId,
        notes
      });

      // Create notification for approval decision
      await storage.createNotification({
        userId: result.requestedBy,
        type: 'approval_decision',
        title: `${result.type} ${action}d`,
        message: `Your ${result.type} request has been ${action}d`,
        data: { approvalId: result.id, action, notes },
        priority: 'high'
      });

      res.json(result);
    } catch (error: any) {
      console.error('Error processing approval:', error);
      res.status(500).json({ error: 'Failed to process approval' });
    }
  }
];

// Dashboard analytics for mobile
export const getMobileDashboard = [
  securityHeaders,
  async (req: Request, res: Response) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { timeframe = '24h' } = req.query;
      const dashboard = await storage.getMobileDashboard(timeframe as string);
      
      res.json(dashboard);
    } catch (error: any) {
      console.error('Error fetching mobile dashboard:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
  }
];

// Staff shift management
export const getStaffShifts = [
  securityHeaders,
  async (req: Request, res: Response) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user || !['manager', 'admin'].includes(user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const { date, status } = req.query;
      const shifts = await storage.getStaffShifts({
        date: date as string,
        status: status as string
      });

      res.json(shifts);
    } catch (error: any) {
      console.error('Error fetching staff shifts:', error);
      res.status(500).json({ error: 'Failed to fetch staff shifts' });
    }
  }
];

export const approveShift = [
  securityHeaders,
  async (req: Request, res: Response) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user || !['manager', 'admin'].includes(user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const { shiftId } = req.params;
      const { action, notes } = req.body;

      const result = await storage.approveShift(parseInt(shiftId), {
        action,
        approvedBy: req.session.userId,
        notes
      });

      // Create notification for shift approval
      await storage.createNotification({
        userId: result.userId,
        type: 'shift_approved',
        title: `Shift ${action}d`,
        message: `Your shift request has been ${action}d`,
        data: { shiftId: result.id, action, notes },
        priority: 'normal'
      });

      res.json(result);
    } catch (error: any) {
      console.error('Error approving shift:', error);
      res.status(500).json({ error: 'Failed to approve shift' });
    }
  }
];

// Push notification service
export const sendPushNotification = async (userId: number, notification: any) => {
  try {
    const devices = await storage.getUserMobileDevices(userId);
    
    for (const device of devices) {
      if (device.pushToken && device.isActive) {
        // In a real implementation, this would integrate with:
        // - FCM for Android
        // - APNs for iOS
        // - Web Push for web browsers
        
        console.log(`[PUSH] Sending to ${device.platform} device ${device.deviceName}:`, {
          title: notification.title,
          body: notification.message,
          data: notification.data
        });
        
        // Simulate push notification delivery
        await simulatePushDelivery(device.pushToken, notification);
      }
    }
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
};

async function simulatePushDelivery(pushToken: string, notification: any) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Log successful delivery
  console.log(`[PUSH-DELIVERED] Token: ${pushToken.substring(0, 10)}..., Title: ${notification.title}`);
}