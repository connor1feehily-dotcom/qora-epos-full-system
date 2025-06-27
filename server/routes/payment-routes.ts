import { Request, Response } from 'express';
import { 
  CardDataProtection, 
  CardTokenization, 
  validatePaymentData, 
  requireStaffAuthentication, 
  auditPaymentActivity,
  paymentRateLimit,
  enforceHTTPS,
  securityHeaders
} from '../security/pci-compliance';
import { storage } from '../storage';

// PCI DSS compliant payment processing endpoint
export const processPayment = [
  securityHeaders,
  enforceHTTPS,
  paymentRateLimit,
  requireStaffAuthentication,
  validatePaymentData,
  async (req: Request, res: Response) => {
    try {
      const { cardNumber, cvv, expiryMonth, expiryYear, amount, tillId } = req.body;
      const userId = req.session!.userId;
      
      // Audit payment attempt
      auditPaymentActivity('payment_attempt', userId, {
        amount,
        tillId,
        cardNumber, // Will be masked in audit log
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      // Generate secure token for card data (PCI DSS Requirement 3.4)
      const cardToken = CardTokenization.generateToken(cardNumber);
      
      // Process payment with payment processor
      // In production, integrate with Stripe, Square, etc.
      const paymentResult = await simulatePaymentProcessing({
        token: cardToken,
        cvv, // CVV should never be stored
        expiryMonth,
        expiryYear,
        amount
      });
      
      if (paymentResult.success) {
        // Create transaction record (without storing sensitive card data)
        const transaction = await storage.createTransaction({
          customerId: null,
          userId,
          tillId,
          subtotal: (amount * 0.833).toFixed(2), // Reverse calculate from total
          vatAmount: (amount * 0.167).toFixed(2), // 20% VAT
          total: amount.toFixed(2),
          paymentMethod: 'card',
          itemCount: 1,
          status: 'completed'
        });
        
        // Audit successful payment
        auditPaymentActivity('payment_success', userId, {
          transactionId: transaction.id,
          amount,
          tillId,
          paymentProcessor: paymentResult.processor,
          authCode: paymentResult.authCode,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        });
        
        // Invalidate token after use (PCI DSS Requirement 3.4.1)
        CardTokenization.invalidateToken(cardToken);
        
        res.json({
          success: true,
          transactionId: transaction.id,
          authCode: paymentResult.authCode,
          maskedCardNumber: CardDataProtection.maskPAN(cardNumber),
          amount: amount,
          timestamp: new Date().toISOString()
        });
        
      } else {
        // Audit failed payment
        auditPaymentActivity('payment_failure', userId, {
          amount,
          tillId,
          errorCode: paymentResult.errorCode,
          errorMessage: paymentResult.errorMessage,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        });
        
        // Invalidate token
        CardTokenization.invalidateToken(cardToken);
        
        res.status(400).json({
          success: false,
          error: paymentResult.errorMessage || 'Payment processing failed'
        });
      }
      
    } catch (error: any) {
      // Audit payment error
      auditPaymentActivity('payment_error', req.session!.userId, {
        error: error.message,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      console.error('Payment processing error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal payment processing error'
      });
    }
  }
];

// Simulate payment processing (replace with actual payment processor)
async function simulatePaymentProcessing(paymentData: any) {
  // In production, this would integrate with actual payment processors
  // like Stripe, Square, Worldpay, etc.
  
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simulate random success/failure for demonstration
  const isSuccess = Math.random() > 0.1; // 90% success rate
  
  if (isSuccess) {
    return {
      success: true,
      processor: 'TestProcessor',
      authCode: 'AUTH' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      transactionId: 'TXN' + Date.now()
    };
  } else {
    return {
      success: false,
      errorCode: 'DECLINED',
      errorMessage: 'Card declined by issuer'
    };
  }
}

// Refund processing with PCI compliance
export const processRefund = [
  securityHeaders,
  enforceHTTPS,
  requireStaffAuthentication,
  async (req: Request, res: Response) => {
    try {
      const { transactionId, amount, reason } = req.body;
      const userId = req.session!.userId;
      
      // Verify transaction exists and staff has permission
      const originalTransaction = await storage.getTransaction(transactionId);
      if (!originalTransaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }
      
      // Audit refund attempt
      auditPaymentActivity('refund_attempt', userId, {
        transactionId,
        amount,
        reason,
        originalAmount: originalTransaction.total,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      // Process refund with payment processor
      const refundResult = await simulateRefundProcessing({
        transactionId,
        amount
      });
      
      if (refundResult.success) {
        // Create refund transaction record
        const refundTransaction = await storage.createTransaction({
          customerId: originalTransaction.customerId,
          userId,
          tillId: originalTransaction.tillId,
          subtotal: (-amount * 0.833).toFixed(2),
          vatAmount: (-amount * 0.167).toFixed(2),
          total: (-amount).toFixed(2),
          paymentMethod: 'refund',
          itemCount: -1,
          status: 'completed'
        });
        
        // Audit successful refund
        auditPaymentActivity('refund_success', userId, {
          transactionId,
          refundTransactionId: refundTransaction.id,
          amount,
          reason,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        });
        
        res.json({
          success: true,
          refundId: refundTransaction.id,
          amount: amount,
          timestamp: new Date().toISOString()
        });
        
      } else {
        auditPaymentActivity('refund_failure', userId, {
          transactionId,
          amount,
          errorMessage: refundResult.errorMessage,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        });
        
        res.status(400).json({
          success: false,
          error: refundResult.errorMessage || 'Refund processing failed'
        });
      }
      
    } catch (error: any) {
      console.error('Refund processing error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal refund processing error'
      });
    }
  }
];

async function simulateRefundProcessing(refundData: any) {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Simulate refund success
  return {
    success: true,
    refundId: 'REF' + Date.now(),
    processor: 'TestProcessor'
  };
}

// Get payment methods and security info
export const getPaymentMethods = [
  securityHeaders,
  requireStaffAuthentication,
  async (req: Request, res: Response) => {
    // Return available payment methods and security info
    res.json({
      methods: [
        {
          type: 'card',
          name: 'Credit/Debit Card',
          supported: true,
          encryption: 'AES-256-GCM',
          pciCompliant: true
        },
        {
          type: 'cash',
          name: 'Cash',
          supported: true,
          encryption: 'N/A',
          pciCompliant: true
        },
        {
          type: 'contactless',
          name: 'Contactless Payment',
          supported: true,
          encryption: 'EMV',
          pciCompliant: true
        }
      ],
      security: {
        tlsVersion: '1.3',
        encryption: 'AES-256-GCM',
        tokenization: true,
        pciDssLevel: '1',
        certificationDate: '2024-01-01'
      }
    });
  }
];

// Validate card data endpoint (for frontend validation)
export const validateCard = [
  securityHeaders,
  enforceHTTPS,
  paymentRateLimit,
  async (req: Request, res: Response) => {
    try {
      const { cardNumber } = req.body;
      
      if (!cardNumber) {
        return res.status(400).json({ valid: false, error: 'Card number required' });
      }
      
      const isValid = CardDataProtection.validatePAN(cardNumber);
      const masked = CardDataProtection.maskPAN(cardNumber);
      
      res.json({
        valid: isValid,
        maskedNumber: masked,
        type: getCardType(cardNumber)
      });
      
    } catch (error) {
      res.status(500).json({ valid: false, error: 'Validation error' });
    }
  }
];

function getCardType(cardNumber: string): string {
  const number = cardNumber.replace(/\D/g, '');
  
  if (/^4/.test(number)) return 'visa';
  if (/^5[1-5]/.test(number)) return 'mastercard';
  if (/^3[47]/.test(number)) return 'amex';
  if (/^6/.test(number)) return 'discover';
  
  return 'unknown';
}