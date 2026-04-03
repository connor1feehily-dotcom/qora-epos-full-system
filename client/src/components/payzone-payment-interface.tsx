import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  CreditCard,
  Wifi,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  X,
  RefreshCw,
  Smartphone,
  Shield
} from "lucide-react";

async function payzoneApi(method: string, path: string, body?: any): Promise<any> {
  const res = await apiRequest(method, path, body);
  return res.json();
}

interface PayzonePaymentInterfaceProps {
  amount: number;
  reference: string;
  tillId: string;
  onPaymentComplete: (result: PayzonePaymentResult) => void;
  onCancel: () => void;
}

export interface PayzonePaymentResult {
  success: boolean;
  transactionId: string;
  authCode?: string;
  cardLast4?: string;
  cardScheme?: string;
  amount: number;
  message?: string;
  receiptData?: {
    merchantReceipt?: string;
    customerReceipt?: string;
  };
}

type PaymentStage =
  | 'initiating'
  | 'waiting_for_card'
  | 'processing'
  | 'approved'
  | 'declined'
  | 'cancelled'
  | 'error';

const STAGE_LABELS: Record<PaymentStage, string> = {
  initiating: 'Connecting to terminal...',
  waiting_for_card: 'Please present your card',
  processing: 'Processing payment...',
  approved: 'Payment approved',
  declined: 'Payment declined',
  cancelled: 'Payment cancelled',
  error: 'Connection error'
};

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 90; // 3 minutes

export default function PayzonePaymentInterface({
  amount,
  reference,
  tillId,
  onPaymentComplete,
  onCancel
}: PayzonePaymentInterfaceProps) {
  const [stage, setStage] = useState<PaymentStage>('initiating');
  const [payzoneTransactionId, setPayzoneTransactionId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [pollAttempts, setPollAttempts] = useState(0);
  const [isCancelling, setIsCancelling] = useState(false);
  const [dotCount, setDotCount] = useState(1);

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stageRef = useRef<PaymentStage>('initiating');
  const { toast } = useToast();

  stageRef.current = stage;

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Animate dots on "waiting" messages
  useEffect(() => {
    const dotTimer = setInterval(() => {
      setDotCount(prev => (prev % 3) + 1);
    }, 500);
    return () => clearInterval(dotTimer);
  }, []);

  // Elapsed time counter
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => stopTimer();
  }, [stopTimer]);

  const handleResult = useCallback((statusData: any) => {
    stopPolling();
    stopTimer();

    const isApproved = statusData.status === 'APPROVED';
    const isDeclined = statusData.status === 'DECLINED';
    const isCancelledStatus = statusData.status === 'CANCELLED';

    if (isApproved) {
      setStage('approved');
      setTimeout(() => {
        onPaymentComplete({
          success: true,
          transactionId: statusData.transactionId,
          authCode: statusData.authCode,
          cardLast4: statusData.cardLast4,
          cardScheme: statusData.cardScheme,
          amount,
          message: statusData.responseMessage,
          receiptData: statusData.receiptData
        });
      }, 1500);
    } else if (isDeclined) {
      setStage('declined');
      setErrorMessage(statusData.responseMessage || 'Payment was declined by the card issuer');
      onPaymentComplete({
        success: false,
        transactionId: statusData.transactionId,
        amount,
        message: statusData.responseMessage || 'Declined'
      });
    } else if (isCancelledStatus) {
      setStage('cancelled');
    } else {
      setStage('error');
      setErrorMessage(statusData.responseMessage || 'Unknown error occurred');
    }
  }, [amount, onPaymentComplete, stopPolling, stopTimer]);

  const pollStatus = useCallback(async (txnId: string, attempt: number) => {
    if (attempt >= MAX_POLL_ATTEMPTS) {
      stopPolling();
      setStage('error');
      setErrorMessage('Payment timed out. Please try again.');
      return;
    }

    try {
      const status = await payzoneApi('GET', `/api/payzone/status/${txnId}`);

      const currentStage = stageRef.current;
      if (currentStage === 'cancelled' || currentStage === 'approved' || currentStage === 'declined' || currentStage === 'error') {
        return;
      }

      setPollAttempts(attempt + 1);

      if (status.status === 'PENDING') {
        setStage('waiting_for_card');
      } else if (status.status === 'IN_PROGRESS') {
        setStage('processing');
      } else if (['APPROVED', 'DECLINED', 'CANCELLED', 'ERROR', 'TIMEOUT'].includes(status.status)) {
        handleResult(status);
      }
    } catch (error: any) {
      console.error('Payzone status poll error:', error);
      // Don't immediately fail - network hiccup might recover
    }
  }, [handleResult, stopPolling]);

  // Initiate payment on mount
  useEffect(() => {
    let attempt = 0;

    const initiate = async () => {
      try {
        const result = await payzoneApi('POST', '/api/payzone/sale', {
          amount,
          reference,
          terminalId: tillId
        });

        if (result.transactionId) {
          setPayzoneTransactionId(result.transactionId);
          setStage('waiting_for_card');

          // Start polling
          pollIntervalRef.current = setInterval(async () => {
            attempt++;
            await pollStatus(result.transactionId, attempt);
          }, POLL_INTERVAL_MS);
        } else {
          setStage('error');
          setErrorMessage('Failed to initiate payment with terminal');
        }
      } catch (error: any) {
        console.error('Payzone initiation error:', error);
        setStage('error');
        setErrorMessage(error.message || 'Could not connect to payment terminal');
      }
    };

    initiate();

    return () => {
      stopPolling();
      stopTimer();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCancel = async () => {
    if (isCancelling) return;
    setIsCancelling(true);
    stopPolling();

    try {
      if (payzoneTransactionId) {
        await payzoneApi('POST', '/api/payzone/cancel', {
          transactionId: payzoneTransactionId
        });
      }
    } catch (error) {
      console.warn('Cancel request failed:', error);
    } finally {
      setStage('cancelled');
      setIsCancelling(false);
      stopTimer();
      onCancel();
    }
  };

  const terminalDots = '.'.repeat(dotCount);
  const isTerminal = stage === 'waiting_for_card' || stage === 'processing' || stage === 'initiating';
  const isComplete = stage === 'approved' || stage === 'declined' || stage === 'cancelled' || stage === 'error';

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-5 w-5 text-blue-600" />
              Payzone Terminal Payment
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <Shield className="h-3 w-3 mr-1" />
                PCI DSS
              </Badge>
              {!isComplete && (
                <Badge
                  variant="secondary"
                  className="text-xs bg-green-100 text-green-700"
                >
                  <Wifi className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Amount */}
          <div className="text-center py-4 bg-slate-50 dark:bg-slate-800 rounded-xl border">
            <p className="text-sm text-muted-foreground mb-1">Amount to collect</p>
            <p className="text-4xl font-bold text-slate-900 dark:text-white">
              €{amount.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Ref: {reference}</p>
          </div>

          <Separator />

          {/* Status area */}
          <div className="space-y-4">
            {/* Stage indicator */}
            <div className="flex items-center justify-center gap-3 py-2">
              {stage === 'initiating' && (
                <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
              )}
              {stage === 'waiting_for_card' && (
                <div className="relative">
                  <Smartphone className="h-12 w-12 text-blue-500" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full animate-ping" />
                </div>
              )}
              {stage === 'processing' && (
                <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
              )}
              {stage === 'approved' && (
                <CheckCircle2 className="h-12 w-12 text-green-500" />
              )}
              {stage === 'declined' && (
                <XCircle className="h-12 w-12 text-red-500" />
              )}
              {stage === 'cancelled' && (
                <X className="h-12 w-12 text-slate-400" />
              )}
              {stage === 'error' && (
                <AlertTriangle className="h-12 w-12 text-amber-500" />
              )}
            </div>

            {/* Message */}
            <div className="text-center space-y-1">
              <p className={`text-lg font-semibold ${
                stage === 'approved' ? 'text-green-600' :
                stage === 'declined' ? 'text-red-600' :
                stage === 'error' ? 'text-amber-600' :
                stage === 'cancelled' ? 'text-slate-500' :
                'text-slate-800 dark:text-slate-200'
              }`}>
                {STAGE_LABELS[stage]}{isTerminal ? terminalDots : ''}
              </p>

              {stage === 'waiting_for_card' && (
                <p className="text-sm text-muted-foreground">
                  Tap, insert or swipe your card on the payment terminal
                </p>
              )}

              {stage === 'processing' && (
                <p className="text-sm text-muted-foreground">
                  Please do not remove your card from the terminal
                </p>
              )}

              {(stage === 'declined' || stage === 'error') && errorMessage && (
                <p className="text-sm text-red-500 dark:text-red-400 mt-1">
                  {errorMessage}
                </p>
              )}

              {stage === 'approved' && (
                <p className="text-sm text-green-600">
                  Transaction complete — please take your card
                </p>
              )}
            </div>

            {/* Progress bar for waiting/processing */}
            {isTerminal && (
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                  style={{
                    width: `${Math.min((elapsedSeconds / 120) * 100, 95)}%`,
                    animation: 'pulse 2s ease-in-out infinite'
                  }}
                />
              </div>
            )}

            {/* Timer */}
            {isTerminal && (
              <p className="text-xs text-center text-muted-foreground">
                Waiting {elapsedSeconds}s • Ref: {payzoneTransactionId || reference}
              </p>
            )}
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex gap-3">
            {isTerminal && (
              <Button
                variant="outline"
                className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                onClick={handleCancel}
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Cancel Payment
                  </>
                )}
              </Button>
            )}

            {(stage === 'declined' || stage === 'error') && (
              <>
                <Button variant="outline" className="flex-1" onClick={onCancel}>
                  <X className="h-4 w-4 mr-2" />
                  Close
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    setStage('initiating');
                    setErrorMessage(null);
                    setElapsedSeconds(0);
                    setPollAttempts(0);
                    setPayzoneTransactionId(null);
                    stopPolling();

                    let attempt = 0;
                    const retry = async () => {
                      try {
                        const result = await payzoneApi('POST', '/api/payzone/sale', {
                          amount,
                          reference: reference + '-R',
                          terminalId: tillId
                        });
                        if (result.transactionId) {
                          setPayzoneTransactionId(result.transactionId);
                          setStage('waiting_for_card');
                          pollIntervalRef.current = setInterval(async () => {
                            attempt++;
                            await pollStatus(result.transactionId, attempt);
                          }, POLL_INTERVAL_MS);
                        } else {
                          setStage('error');
                          setErrorMessage('Failed to initiate payment');
                        }
                      } catch (err: any) {
                        setStage('error');
                        setErrorMessage(err.message || 'Could not connect to terminal');
                      }
                    };
                    retry();
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Payment
                </Button>
              </>
            )}

            {stage === 'cancelled' && (
              <Button variant="outline" className="flex-1" onClick={onCancel}>
                <X className="h-4 w-4 mr-2" />
                Close
              </Button>
            )}
          </div>

          {/* Footer note */}
          <p className="text-xs text-center text-muted-foreground">
            Powered by Payzone Integrated Payments • Encrypted & PCI DSS Compliant
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
