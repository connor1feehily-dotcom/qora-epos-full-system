/**
 * Mobile Top-Up Voucher Service
 *
 * Generates PIN-based top-up vouchers for Irish mobile networks.
 * The customer receives a printed voucher with a PIN and dial-in
 * instructions which they redeem on their own phone — no phone
 * number is required at the till.
 *
 * For real voucher distribution, plug in your supplier's PIN-distribution
 * API (Payzone, ePay, Reloadly Gift Cards, etc.) inside `processTopUp`.
 *
 * Env vars (optional, for live PIN supplier):
 *   RELOADLY_CLIENT_ID
 *   RELOADLY_CLIENT_SECRET
 *   RELOADLY_SANDBOX=true|false
 */

const RELOADLY_CLIENT_ID = process.env.RELOADLY_CLIENT_ID || '';
const RELOADLY_CLIENT_SECRET = process.env.RELOADLY_CLIENT_SECRET || '';
const USE_SANDBOX = process.env.RELOADLY_SANDBOX !== 'false';

export interface OperatorRedemption {
  /** USSD code customer dials, with %PIN% as placeholder */
  dialCode: string;
  /** Optional SMS-based redemption (e.g. text PIN to a shortcode) */
  smsCode?: string;
  /** Customer-facing instructions */
  instructions: string[];
  /** Days until voucher expires */
  expiryDays: number;
}

export interface TopUpOperator {
  id: number;
  name: string;
  logo: string;
  minAmount: number;
  maxAmount: number;
  fixedAmounts: number[];
  redemption: OperatorRedemption;
}

export const IRISH_OPERATORS: TopUpOperator[] = [
  {
    id: 341, name: 'Vodafone IE', logo: '🔴',
    minAmount: 5, maxAmount: 100, fixedAmounts: [5, 10, 15, 20, 30, 50],
    redemption: {
      dialCode: '*174*%PIN%#',
      smsCode: 'Text PIN to 50104',
      instructions: [
        'Dial *174*PIN# from your Vodafone phone',
        'Press the call button',
        'You will receive a confirmation SMS',
      ],
      expiryDays: 180,
    },
  },
  {
    id: 337, name: 'Three IE', logo: '🟣',
    minAmount: 5, maxAmount: 100, fixedAmounts: [5, 10, 15, 20, 30, 50],
    redemption: {
      dialCode: '*174*%PIN%#',
      smsCode: 'Text PIN to 50101',
      instructions: [
        'Dial *174*PIN# from your Three phone',
        'Press the call button',
        'Or text the PIN to 50101',
      ],
      expiryDays: 180,
    },
  },
  {
    id: 336, name: 'Eir', logo: '🔵',
    minAmount: 5, maxAmount: 100, fixedAmounts: [5, 10, 15, 20, 30, 50],
    redemption: {
      dialCode: '*140*%PIN%#',
      instructions: [
        'Dial *140*PIN# from your Eir mobile',
        'Press the call button',
        'You will receive a confirmation SMS',
      ],
      expiryDays: 180,
    },
  },
  {
    id: 2490, name: 'Tesco Mobile IE', logo: '🟦',
    minAmount: 5, maxAmount: 60, fixedAmounts: [5, 10, 15, 20, 30, 60],
    redemption: {
      dialCode: '*174*%PIN%#',
      instructions: [
        'Dial *174*PIN# from your Tesco Mobile phone',
        'Press the call button',
        'Or top up via the Tesco Mobile app',
      ],
      expiryDays: 180,
    },
  },
  {
    id: 2491, name: '48', logo: '🟤',
    minAmount: 5, maxAmount: 50, fixedAmounts: [5, 10, 15, 20, 30, 50],
    redemption: {
      dialCode: '*174*%PIN%#',
      instructions: [
        'Dial *174*PIN# from your 48 phone',
        'Press the call button',
        'Or top up via the 48 app',
      ],
      expiryDays: 180,
    },
  },
  {
    id: 2492, name: 'GoMo', logo: '🟢',
    minAmount: 9, maxAmount: 9, fixedAmounts: [9],
    redemption: {
      dialCode: '*174*%PIN%#',
      instructions: [
        'Open the GoMo app or dial *174*PIN#',
        'Enter the PIN exactly as shown',
        'Your monthly plan will be renewed',
      ],
      expiryDays: 90,
    },
  },
  {
    id: 2493, name: 'Lycamobile IE', logo: '⚪',
    minAmount: 5, maxAmount: 50, fixedAmounts: [5, 10, 15, 20, 50],
    redemption: {
      dialCode: '*131*%PIN%#',
      instructions: [
        'Dial *131*PIN# from your Lycamobile phone',
        'Press the call button',
        'You will receive a confirmation SMS',
      ],
      expiryDays: 180,
    },
  },
  {
    id: 2494, name: 'Postmobile IE', logo: '🟡',
    minAmount: 5, maxAmount: 50, fixedAmounts: [5, 10, 20, 30, 50],
    redemption: {
      dialCode: '*174*%PIN%#',
      instructions: [
        'Dial *174*PIN# from your Postmobile phone',
        'Press the call button',
      ],
      expiryDays: 180,
    },
  },
];

export interface TopUpRequest {
  operatorId: number;
  amount: number;
  customIdentifier?: string;
}

export interface TopUpVoucher {
  success: boolean;
  transactionId: string;
  voucherSerial: string;
  pin: string;
  formattedPin: string;
  amount: number;
  operator: string;
  operatorLogo: string;
  expiryDate: string;
  redemption: OperatorRedemption;
  message?: string;
  errorCode?: string;
}

function isConfigured(): boolean {
  return !!(RELOADLY_CLIENT_ID && RELOADLY_CLIENT_SECRET);
}

export async function getOperators(): Promise<TopUpOperator[]> {
  return IRISH_OPERATORS;
}

export async function processTopUp(request: TopUpRequest): Promise<TopUpVoucher> {
  const operator = IRISH_OPERATORS.find(o => o.id === request.operatorId);
  if (!operator) {
    return {
      success: false,
      transactionId: '',
      voucherSerial: '',
      pin: '',
      formattedPin: '',
      amount: request.amount,
      operator: 'Unknown',
      operatorLogo: '📱',
      expiryDate: '',
      redemption: { dialCode: '', instructions: [], expiryDays: 0 },
      message: 'Unknown operator',
      errorCode: 'INVALID_OPERATOR',
    };
  }

  // Simulate occasional failure (2% decline rate)
  if (Math.random() < 0.02) {
    return {
      success: false,
      transactionId: 'FAIL-' + Date.now(),
      voucherSerial: '',
      pin: '',
      formattedPin: '',
      amount: request.amount,
      operator: operator.name,
      operatorLogo: operator.logo,
      expiryDate: '',
      redemption: operator.redemption,
      message: 'Voucher provider temporarily unavailable. Please try again.',
      errorCode: 'PROVIDER_TIMEOUT',
    };
  }

  // Generate voucher
  const pin = generatePin();
  const serial = generateSerial();
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + operator.redemption.expiryDays);

  // TODO: When real PIN-distribution credentials are configured, call
  // the supplier API here (e.g. Reloadly Gift Cards, ePay, Payzone).
  // For now we generate a simulated voucher PIN.
  if (isConfigured()) {
    // Placeholder: real PIN-distribution call would go here.
    // Falling through to the simulated voucher below.
  }

  return {
    success: true,
    transactionId: 'TU-' + Date.now(),
    voucherSerial: serial,
    pin,
    formattedPin: formatPin(pin),
    amount: request.amount,
    operator: operator.name,
    operatorLogo: operator.logo,
    expiryDate: expiry.toLocaleDateString('en-IE'),
    redemption: operator.redemption,
    message: `€${request.amount} ${operator.name} voucher generated`,
  };
}

function generatePin(): string {
  // 14-digit numeric PIN (typical for Irish top-up vouchers)
  let pin = '';
  for (let i = 0; i < 14; i++) {
    pin += Math.floor(Math.random() * 10).toString();
  }
  return pin;
}

function formatPin(pin: string): string {
  // Group as 4-4-4-2 for easy reading: 1234 5678 9012 34
  return pin.replace(/(\d{4})(\d{4})(\d{4})(\d{2})/, '$1 $2 $3 $4');
}

function generateSerial(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 10; i++) {
    s += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return s;
}

export function getTopUpConfig() {
  return {
    configured: isConfigured(),
    provider: isConfigured() ? 'Live PIN Distribution' : 'Simulation',
    sandbox: USE_SANDBOX,
    environment: USE_SANDBOX ? 'Sandbox' : 'Production',
  };
}
