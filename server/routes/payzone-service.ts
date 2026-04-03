/**
 * Payzone Integrated Payments Service
 * Implements the Payzone REST API for retail EPOS terminal integration
 * UAT: https://retail-services-uat.payzone.ie
 * Production: https://retail-services.payzone.ie
 */

const PAYZONE_BASE_URL = process.env.PAYZONE_BASE_URL || 'https://retail-services-uat.payzone.ie';
const PAYZONE_USERNAME = process.env.PAYZONE_USERNAME || '';
const PAYZONE_PASSWORD = process.env.PAYZONE_PASSWORD || '';
const PAYZONE_TERMINAL_ID = process.env.PAYZONE_TERMINAL_ID || '';

export interface PayzoneAuthToken {
  token: string;
  expiresAt: Date;
}

export interface PayzoneSaleRequest {
  amount: number;
  reference: string;
  terminalId?: string;
  cashbackAmount?: number;
  gratuityAmount?: number;
}

export interface PayzoneSaleResponse {
  transactionId: string;
  status: PayzoneTransactionStatus;
  message?: string;
}

export interface PayzoneStatusResponse {
  transactionId: string;
  status: PayzoneTransactionStatus;
  authCode?: string;
  cardLast4?: string;
  cardScheme?: string;
  cardholderName?: string;
  amount?: number;
  cashbackAmount?: number;
  gratuityAmount?: number;
  responseCode?: string;
  responseMessage?: string;
  receiptData?: PayzoneReceiptData;
  moreInfoRequired?: boolean;
  moreInfoType?: string;
}

export interface PayzoneReceiptData {
  merchantReceipt?: string;
  customerReceipt?: string;
}

export interface PayzoneRefundRequest {
  originalTransactionId: string;
  amount: number;
  reference?: string;
}

export interface PayzoneRefundResponse {
  refundId: string;
  status: PayzoneTransactionStatus;
  authCode?: string;
  amount?: number;
  message?: string;
}

export interface PayzoneCancelRequest {
  transactionId: string;
}

export interface PayzoneCancelResponse {
  transactionId: string;
  status: PayzoneTransactionStatus;
  message?: string;
}

export interface PayzoneReconciliationResponse {
  reconciliationId: string;
  status: string;
  totalSalesCount: number;
  totalSalesAmount: number;
  totalRefundsCount: number;
  totalRefundsAmount: number;
  totalCashbackAmount: number;
  totalGratuityAmount: number;
  netAmount: number;
  transactions: PayzoneReconciliationTransaction[];
  message?: string;
}

export interface PayzoneReconciliationTransaction {
  transactionId: string;
  type: 'sale' | 'refund' | 'cashback';
  amount: number;
  authCode?: string;
  cardScheme?: string;
  cardLast4?: string;
  timestamp: string;
  status: string;
}

export type PayzoneTransactionStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'APPROVED'
  | 'DECLINED'
  | 'CANCELLED'
  | 'ERROR'
  | 'TIMEOUT'
  | 'REQUIRES_MORE_INFO';

// In-memory token cache
let cachedToken: PayzoneAuthToken | null = null;

function isConfigured(): boolean {
  return !!(PAYZONE_USERNAME && PAYZONE_PASSWORD && PAYZONE_TERMINAL_ID);
}

async function payzoneRequest(
  method: string,
  path: string,
  body?: any,
  token?: string
): Promise<any> {
  const url = `${PAYZONE_BASE_URL}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Payzone API error ${response.status}: ${errorText}`);
  }

  return response.json();
}

export async function authenticate(): Promise<PayzoneAuthToken> {
  if (cachedToken && cachedToken.expiresAt > new Date()) {
    return cachedToken;
  }

  const data = await payzoneRequest('POST', '/api/authenticate', {
    username: PAYZONE_USERNAME,
    password: PAYZONE_PASSWORD,
    terminalId: PAYZONE_TERMINAL_ID
  });

  cachedToken = {
    token: data.token,
    expiresAt: new Date(data.expiresAt || Date.now() + 3600 * 1000)
  };

  return cachedToken;
}

async function getToken(): Promise<string> {
  const auth = await authenticate();
  return auth.token;
}

export async function initiateSale(request: PayzoneSaleRequest): Promise<PayzoneSaleResponse> {
  if (!isConfigured()) {
    return simulateSaleInitiation(request);
  }

  const token = await getToken();
  const amountInCents = Math.round(request.amount * 100);

  const data = await payzoneRequest('POST', '/api/sale', {
    amount: amountInCents,
    reference: request.reference,
    terminalId: request.terminalId || PAYZONE_TERMINAL_ID,
    cashbackAmount: request.cashbackAmount ? Math.round(request.cashbackAmount * 100) : undefined,
    gratuityAmount: request.gratuityAmount ? Math.round(request.gratuityAmount * 100) : undefined
  }, token);

  return {
    transactionId: data.transactionId,
    status: data.status || 'PENDING',
    message: data.message
  };
}

export async function getTransactionStatus(transactionId: string): Promise<PayzoneStatusResponse> {
  if (!isConfigured()) {
    return simulateStatusCheck(transactionId);
  }

  const token = await getToken();
  const data = await payzoneRequest('GET', `/api/status/${transactionId}`, undefined, token);

  return {
    transactionId: data.transactionId,
    status: data.status,
    authCode: data.authCode,
    cardLast4: data.cardLast4,
    cardScheme: data.cardScheme,
    cardholderName: data.cardholderName,
    amount: data.amount ? data.amount / 100 : undefined,
    cashbackAmount: data.cashbackAmount ? data.cashbackAmount / 100 : undefined,
    gratuityAmount: data.gratuityAmount ? data.gratuityAmount / 100 : undefined,
    responseCode: data.responseCode,
    responseMessage: data.responseMessage,
    receiptData: data.receiptData,
    moreInfoRequired: data.moreInfoRequired,
    moreInfoType: data.moreInfoType
  };
}

export async function cancelTransaction(request: PayzoneCancelRequest): Promise<PayzoneCancelResponse> {
  if (!isConfigured()) {
    return {
      transactionId: request.transactionId,
      status: 'CANCELLED',
      message: 'Transaction cancelled (demo mode)'
    };
  }

  const token = await getToken();
  const data = await payzoneRequest('POST', '/api/cancel', {
    transactionId: request.transactionId
  }, token);

  return {
    transactionId: data.transactionId,
    status: data.status || 'CANCELLED',
    message: data.message
  };
}

export async function processRefund(request: PayzoneRefundRequest): Promise<PayzoneRefundResponse> {
  if (!isConfigured()) {
    return simulateRefund(request);
  }

  const token = await getToken();
  const amountInCents = Math.round(request.amount * 100);

  const data = await payzoneRequest('POST', '/api/refund', {
    originalTransactionId: request.originalTransactionId,
    amount: amountInCents,
    reference: request.reference
  }, token);

  return {
    refundId: data.refundId,
    status: data.status || 'APPROVED',
    authCode: data.authCode,
    amount: data.amount ? data.amount / 100 : request.amount,
    message: data.message
  };
}

export async function processReconciliation(): Promise<PayzoneReconciliationResponse> {
  if (!isConfigured()) {
    return simulateReconciliation();
  }

  const token = await getToken();
  const data = await payzoneRequest('POST', '/api/reconciliation', {
    terminalId: PAYZONE_TERMINAL_ID
  }, token);

  return {
    reconciliationId: data.reconciliationId,
    status: data.status,
    totalSalesCount: data.totalSalesCount || 0,
    totalSalesAmount: (data.totalSalesAmount || 0) / 100,
    totalRefundsCount: data.totalRefundsCount || 0,
    totalRefundsAmount: (data.totalRefundsAmount || 0) / 100,
    totalCashbackAmount: (data.totalCashbackAmount || 0) / 100,
    totalGratuityAmount: (data.totalGratuityAmount || 0) / 100,
    netAmount: (data.netAmount || 0) / 100,
    transactions: (data.transactions || []).map((t: any) => ({
      ...t,
      amount: t.amount / 100
    })),
    message: data.message
  };
}

// ---------------------------------------------------------------
// Simulation layer — used when PAYZONE credentials are not set
// Provides realistic demo behaviour for development / UAT testing
// ---------------------------------------------------------------

const simulatedTransactions = new Map<string, {
  startTime: number;
  amount: number;
  settled: boolean;
  declined: boolean;
}>();

function simulateSaleInitiation(request: PayzoneSaleRequest): PayzoneSaleResponse {
  const transactionId = 'SIM-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6).toUpperCase();
  simulatedTransactions.set(transactionId, {
    startTime: Date.now(),
    amount: request.amount,
    settled: false,
    declined: false
  });
  return {
    transactionId,
    status: 'PENDING',
    message: 'Payment request sent to terminal (simulation)'
  };
}

function simulateStatusCheck(transactionId: string): PayzoneStatusResponse {
  const txn = simulatedTransactions.get(transactionId);

  if (!txn) {
    return { transactionId, status: 'ERROR', responseMessage: 'Transaction not found' };
  }

  const elapsed = (Date.now() - txn.startTime) / 1000;

  // Simulate: processing starts after 2s, completes after 6s
  if (elapsed < 2) {
    return { transactionId, status: 'PENDING' };
  }

  if (elapsed < 6) {
    return { transactionId, status: 'IN_PROGRESS' };
  }

  if (!txn.settled) {
    txn.settled = true;
    // 90% approval rate
    txn.declined = Math.random() < 0.1;
    simulatedTransactions.set(transactionId, txn);
  }

  if (txn.declined) {
    return {
      transactionId,
      status: 'DECLINED',
      responseCode: '05',
      responseMessage: 'Do Not Honour',
      amount: txn.amount
    };
  }

  const schemes = ['VISA', 'MASTERCARD', 'AMEX'];
  const last4Digits = ['4242', '1234', '5678', '9012'];

  return {
    transactionId,
    status: 'APPROVED',
    authCode: 'AUTH' + Math.random().toString(36).substr(2, 6).toUpperCase(),
    cardLast4: last4Digits[Math.floor(Math.random() * last4Digits.length)],
    cardScheme: schemes[Math.floor(Math.random() * schemes.length)],
    amount: txn.amount,
    responseCode: '00',
    responseMessage: 'Approved',
    receiptData: {
      merchantReceipt: buildSimulatedReceipt(transactionId, txn.amount, false),
      customerReceipt: buildSimulatedReceipt(transactionId, txn.amount, true)
    }
  };
}

function simulateRefund(request: PayzoneRefundRequest): PayzoneRefundResponse {
  return {
    refundId: 'REF-' + Date.now(),
    status: 'APPROVED',
    authCode: 'REFAUTH' + Math.random().toString(36).substr(2, 4).toUpperCase(),
    amount: request.amount,
    message: 'Refund approved (simulation)'
  };
}

function simulateReconciliation(): PayzoneReconciliationResponse {
  return {
    reconciliationId: 'RECON-' + Date.now(),
    status: 'COMPLETE',
    totalSalesCount: 0,
    totalSalesAmount: 0,
    totalRefundsCount: 0,
    totalRefundsAmount: 0,
    totalCashbackAmount: 0,
    totalGratuityAmount: 0,
    netAmount: 0,
    transactions: [],
    message: 'Reconciliation complete (simulation)'
  };
}

function buildSimulatedReceipt(transactionId: string, amount: number, isCustomer: boolean): string {
  const lines = [
    '================================',
    '          QORA EPOS             ',
    isCustomer ? '       CUSTOMER COPY           ' : '       MERCHANT COPY           ',
    '================================',
    `Date: ${new Date().toLocaleDateString('en-GB')}`,
    `Time: ${new Date().toLocaleTimeString('en-GB')}`,
    `TXN: ${transactionId}`,
    '--------------------------------',
    `AMOUNT:          €${amount.toFixed(2)}`,
    '--------------------------------',
    '         APPROVED               ',
    '================================',
    'Thank you for your purchase',
    '================================'
  ];
  return lines.join('\n');
}

export function getPayzoneConfig() {
  return {
    configured: isConfigured(),
    baseUrl: PAYZONE_BASE_URL,
    terminalId: PAYZONE_TERMINAL_ID || 'NOT_SET',
    environment: PAYZONE_BASE_URL.includes('uat') ? 'UAT' : 'PRODUCTION'
  };
}
