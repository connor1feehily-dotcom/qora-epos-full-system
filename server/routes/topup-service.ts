/**
 * Mobile Top-Up Service
 * Uses Reloadly REST API (https://www.reloadly.com) for Irish mobile top-ups
 * Supports: Vodafone IE, Three IE, Eir, Tesco Mobile, 48, GoMo, Lycamobile IE
 *
 * To connect to Payzone's private top-up API instead, swap the API calls below.
 *
 * Env vars required (Reloadly):
 *   RELOADLY_CLIENT_ID
 *   RELOADLY_CLIENT_SECRET
 *   RELOADLY_SANDBOX=true|false (defaults to true in dev)
 */

const RELOADLY_CLIENT_ID = process.env.RELOADLY_CLIENT_ID || '';
const RELOADLY_CLIENT_SECRET = process.env.RELOADLY_CLIENT_SECRET || '';
const USE_SANDBOX = process.env.RELOADLY_SANDBOX !== 'false';

const RELOADLY_AUTH_URL = 'https://auth.reloadly.com/oauth/token';
const RELOADLY_API_URL = USE_SANDBOX
  ? 'https://topups-sandbox.reloadly.com'
  : 'https://topups.reloadly.com';

export const IRISH_OPERATORS = [
  { id: 341,  name: 'Vodafone IE',    logo: '🔴', minAmount: 5,  maxAmount: 100, fixedAmounts: [5, 10, 15, 20, 30, 50] },
  { id: 337,  name: 'Three IE',       logo: '🟣', minAmount: 5,  maxAmount: 100, fixedAmounts: [5, 10, 15, 20, 30, 50] },
  { id: 336,  name: 'Eir',            logo: '🔵', minAmount: 5,  maxAmount: 100, fixedAmounts: [5, 10, 15, 20, 30, 50] },
  { id: 2490, name: 'Tesco Mobile IE',logo: '🟦', minAmount: 5,  maxAmount: 60,  fixedAmounts: [5, 10, 15, 20, 30, 60] },
  { id: 2491, name: '48 (Three)',      logo: '🟤', minAmount: 5,  maxAmount: 50,  fixedAmounts: [5, 10, 15, 20, 30, 50] },
  { id: 2492, name: 'GoMo',           logo: '🟢', minAmount: 9,  maxAmount: 9,   fixedAmounts: [9] },
  { id: 2493, name: 'Lycamobile IE',  logo: '⚪', minAmount: 5,  maxAmount: 50,  fixedAmounts: [5, 10, 15, 20, 50] },
  { id: 2494, name: 'Postmobile IE',  logo: '🟡', minAmount: 5,  maxAmount: 50,  fixedAmounts: [5, 10, 20, 30, 50] },
];

export interface TopUpOperator {
  id: number;
  name: string;
  logo: string;
  minAmount: number;
  maxAmount: number;
  fixedAmounts: number[];
}

export interface TopUpRequest {
  operatorId: number;
  phoneNumber: string;
  amount: number;
  customIdentifier?: string;
}

export interface TopUpResponse {
  success: boolean;
  transactionId?: string;
  operatorTransactionId?: string;
  message?: string;
  phoneNumber?: string;
  amount?: number;
  operator?: string;
  errorCode?: string;
}

let reloadlyToken: { token: string; expiresAt: Date } | null = null;

function isConfigured(): boolean {
  return !!(RELOADLY_CLIENT_ID && RELOADLY_CLIENT_SECRET);
}

async function getReloadlyToken(): Promise<string> {
  if (reloadlyToken && reloadlyToken.expiresAt > new Date()) {
    return reloadlyToken.token;
  }

  const res = await fetch(RELOADLY_AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: RELOADLY_CLIENT_ID,
      client_secret: RELOADLY_CLIENT_SECRET,
      grant_type: 'client_credentials',
      audience: RELOADLY_API_URL
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Reloadly auth failed: ${err}`);
  }

  const data = await res.json();
  reloadlyToken = {
    token: data.access_token,
    expiresAt: new Date(Date.now() + (data.expires_in - 60) * 1000)
  };

  return reloadlyToken.token;
}

async function reloadlyRequest(method: string, path: string, body?: any): Promise<any> {
  const token = await getReloadlyToken();

  const res = await fetch(`${RELOADLY_API_URL}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/com.reloadly.topups-v1+json'
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error(`Reloadly API error ${res.status}: ${err}`);
  }

  return res.json();
}

export async function getOperators(): Promise<TopUpOperator[]> {
  if (!isConfigured()) {
    return IRISH_OPERATORS;
  }

  try {
    const data = await reloadlyRequest('GET', '/operators/countries/IE?pageSize=50');
    const content = data.content || data;

    return (Array.isArray(content) ? content : []).map((op: any) => ({
      id: op.id,
      name: op.name,
      logo: getOperatorLogo(op.name),
      minAmount: op.minAmount || 5,
      maxAmount: op.maxAmount || 100,
      fixedAmounts: op.denominationType === 'FIXED'
        ? (op.fixedAmounts || []).sort((a: number, b: number) => a - b)
        : generateAmounts(op.minAmount, op.maxAmount)
    }));
  } catch (error) {
    console.warn('Failed to fetch Reloadly operators, using defaults:', error);
    return IRISH_OPERATORS;
  }
}

export async function processTopUp(request: TopUpRequest): Promise<TopUpResponse> {
  if (!isConfigured()) {
    return simulateTopUp(request);
  }

  try {
    const data = await reloadlyRequest('POST', '/topups', {
      recipientPhone: {
        countryCode: 'IE',
        number: normalisePhone(request.phoneNumber)
      },
      operatorId: request.operatorId,
      amount: request.amount,
      customIdentifier: request.customIdentifier || `QORA-${Date.now()}`
    });

    return {
      success: data.status === 'SUCCESSFUL' || data.errorCode === 'TRANSACTION_SUCCESSFUL',
      transactionId: String(data.transactionId || data.id),
      operatorTransactionId: data.operatorTransactionId,
      message: data.message || 'Top-up successful',
      phoneNumber: request.phoneNumber,
      amount: request.amount,
      operator: data.operatorName
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Top-up failed',
      errorCode: 'API_ERROR'
    };
  }
}

function normalisePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('353')) return digits;
  if (digits.startsWith('0')) return '353' + digits.slice(1);
  if (digits.length === 9) return '353' + digits;
  return digits;
}

function getOperatorLogo(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('vodafone')) return '🔴';
  if (n.includes('three') || n.includes('3')) return '🟣';
  if (n.includes('eir')) return '🔵';
  if (n.includes('tesco')) return '🟦';
  if (n.includes('48')) return '🟤';
  if (n.includes('gomo')) return '🟢';
  if (n.includes('lyca')) return '⚪';
  return '📱';
}

function generateAmounts(min: number, max: number): number[] {
  const amounts = [5, 10, 15, 20, 30, 50, 100].filter(a => a >= min && a <= max);
  return amounts.length > 0 ? amounts : [min];
}

// -----------------------------------------------------------------------
// Simulation layer — used when Reloadly credentials are not configured
// -----------------------------------------------------------------------
const simTopups = new Map<string, boolean>();

function simulateTopUp(request: TopUpRequest): TopUpResponse {
  const op = IRISH_OPERATORS.find(o => o.id === request.operatorId);
  const txnId = 'SIM-TU-' + Date.now();
  const phone = normalisePhone(request.phoneNumber);

  // Simulate occasional failure (5% decline rate)
  if (Math.random() < 0.05) {
    return {
      success: false,
      transactionId: txnId,
      message: 'Unable to process top-up. Please check the phone number and try again.',
      errorCode: 'DECLINED'
    };
  }

  simTopups.set(txnId, true);

  return {
    success: true,
    transactionId: txnId,
    operatorTransactionId: 'OP-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
    message: `€${request.amount} top-up successful`,
    phoneNumber: `+${phone}`,
    amount: request.amount,
    operator: op?.name || 'Unknown Operator'
  };
}

export function getTopUpConfig() {
  return {
    configured: isConfigured(),
    provider: isConfigured() ? 'Reloadly' : 'Simulation',
    sandbox: USE_SANDBOX,
    environment: USE_SANDBOX ? 'Sandbox' : 'Production'
  };
}
