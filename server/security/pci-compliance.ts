import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// PCI DSS Requirement 3: Protect stored cardholder data
export class CardDataProtection {
  private static readonly ENCRYPTION_ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32;
  
  // Generate encryption key from environment variable
  private static getEncryptionKey(): Buffer {
    const key = process.env.PCI_ENCRYPTION_KEY;
    if (!key) {
      throw new Error('PCI_ENCRYPTION_KEY environment variable not set');
    }
    return crypto.scryptSync(key, 'salt', CardDataProtection.KEY_LENGTH);
  }
  
  // Encrypt sensitive card data (PAN, CVV)
  static encryptCardData(data: string): string {
    const key = this.getEncryptionKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.ENCRYPTION_ALGORITHM, key);
    cipher.setAAD(iv);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }
  
  // Decrypt card data (only when absolutely necessary)
  static decryptCardData(encryptedData: string): string {
    const key = this.getEncryptionKey();
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipher(this.ENCRYPTION_ALGORITHM, key);
    decipher.setAAD(iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
  
  // Mask PAN for display (show only last 4 digits)
  static maskPAN(pan: string): string {
    if (pan.length < 8) return '****';
    return '*'.repeat(pan.length - 4) + pan.slice(-4);
  }
  
  // Validate PAN using Luhn algorithm
  static validatePAN(pan: string): boolean {
    const digits = pan.replace(/\D/g, '');
    let sum = 0;
    let isEven = false;
    
    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits[i]);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  }
}

// PCI DSS Requirement 4: Encrypt transmission of cardholder data
export const enforceHTTPS = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'production' && !req.secure) {
    return res.status(426).json({
      error: 'HTTPS Required',
      message: 'Payment data must be transmitted over HTTPS'
    });
  }
  next();
};

// PCI DSS Requirement 6: Develop secure systems and applications
export const validatePaymentData = (req: Request, res: Response, next: NextFunction) => {
  const { cardNumber, cvv, expiryMonth, expiryYear } = req.body;
  
  // Validate card number
  if (!cardNumber || !CardDataProtection.validatePAN(cardNumber)) {
    return res.status(400).json({
      error: 'Invalid card number'
    });
  }
  
  // Validate CVV
  if (!cvv || !/^\d{3,4}$/.test(cvv)) {
    return res.status(400).json({
      error: 'Invalid CVV'
    });
  }
  
  // Validate expiry date
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
  if (!expiryMonth || !expiryYear || 
      expiryMonth < 1 || expiryMonth > 12 ||
      expiryYear < currentYear || 
      (expiryYear === currentYear && expiryMonth < currentMonth)) {
    return res.status(400).json({
      error: 'Invalid expiry date'
    });
  }
  
  next();
};

// PCI DSS Requirement 8: Identify and authenticate access
export const requireStaffAuthentication = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session?.userId) {
    return res.status(401).json({
      error: 'Staff authentication required for payment processing'
    });
  }
  next();
};

// PCI DSS Requirement 10: Track and monitor access to network resources
export const auditPaymentActivity = (action: string, userId: number, details: any) => {
  const auditLog = {
    timestamp: new Date().toISOString(),
    action,
    userId,
    details: {
      ...details,
      // Never log sensitive card data
      cardNumber: details.cardNumber ? CardDataProtection.maskPAN(details.cardNumber) : undefined,
      cvv: undefined // Never log CVV
    },
    ipAddress: details.ipAddress,
    userAgent: details.userAgent
  };
  
  // Log to secure audit system
  console.log('[PCI-AUDIT]', JSON.stringify(auditLog));
  
  // In production, send to dedicated audit logging system
  // e.g., SIEM, CloudWatch, Splunk, etc.
};

// PCI DSS Requirement 11: Regularly test security systems
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Set security headers
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'");
  
  next();
};

// Data retention policy (PCI DSS Requirement 3.1)
export const enforceDataRetention = () => {
  // Delete expired transaction data
  // CVV should never be stored after authorization
  // PAN should be purged according to business requirements
  
  console.log('Enforcing PCI DSS data retention policies');
  
  // This would typically run as a scheduled job
  // to purge old sensitive data according to policy
};

// Rate limiting for payment endpoints
export const paymentRateLimit = (req: Request, res: Response, next: NextFunction) => {
  const key = `payment_rate_${req.ip}`;
  const limit = 10; // 10 payment attempts per minute
  const window = 60 * 1000; // 1 minute
  
  // In production, use Redis or similar for rate limiting
  // This is a simplified in-memory implementation
  if (!global.rateLimitStore) {
    global.rateLimitStore = new Map();
  }
  
  const now = Date.now();
  const userRequests = global.rateLimitStore.get(key) || [];
  
  // Remove old requests outside the window
  const validRequests = userRequests.filter((time: number) => now - time < window);
  
  if (validRequests.length >= limit) {
    return res.status(429).json({
      error: 'Too many payment attempts. Please try again later.'
    });
  }
  
  validRequests.push(now);
  global.rateLimitStore.set(key, validRequests);
  
  next();
};

// Tokenization service for card data
export class CardTokenization {
  private static tokens = new Map<string, string>();
  
  // Generate secure token for card data
  static generateToken(cardData: string): string {
    const token = crypto.randomBytes(16).toString('hex');
    this.tokens.set(token, CardDataProtection.encryptCardData(cardData));
    
    // Set token expiration (e.g., 15 minutes)
    setTimeout(() => {
      this.tokens.delete(token);
    }, 15 * 60 * 1000);
    
    return token;
  }
  
  // Retrieve card data using token
  static getCardData(token: string): string | null {
    const encryptedData = this.tokens.get(token);
    if (!encryptedData) return null;
    
    return CardDataProtection.decryptCardData(encryptedData);
  }
  
  // Invalidate token after use
  static invalidateToken(token: string): void {
    this.tokens.delete(token);
  }
}