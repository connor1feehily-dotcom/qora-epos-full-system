import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { posHardware } from "@/utils/hardware-integration";
import {
  Smartphone,
  X,
  ChevronLeft,
  CheckCircle2,
  Loader2,
  RefreshCw,
  CreditCard,
  Banknote,
  Printer,
} from "lucide-react";

interface MobileTopUpInterfaceProps {
  tillId: string;
  onClose: () => void;
  /** Triggers the Payzone terminal. Resolves true if payment approved, false if declined/cancelled. */
  onPayWithCard: (amount: number, reference: string) => Promise<boolean>;
  /** Notifies parent that cashier should collect cash. Voucher will print after this. */
  onPayWithCash: (amount: number) => void;
}

interface Operator {
  id: number;
  name: string;
  logo: string;
  minAmount: number;
  maxAmount: number;
  fixedAmounts: number[];
}

interface VoucherResult {
  success: boolean;
  transactionId: string;
  voucherSerial: string;
  pin: string;
  formattedPin: string;
  amount: number;
  operator: string;
  operatorLogo: string;
  expiryDate: string;
  redemption: {
    dialCode: string;
    smsCode?: string;
    instructions: string[];
    expiryDays: number;
  };
  message?: string;
}

type Step = "operator" | "amount" | "payment" | "success";

export default function MobileTopUpInterface({
  tillId,
  onClose,
  onPayWithCard,
  onPayWithCash,
}: MobileTopUpInterfaceProps) {
  const [step, setStep] = useState<Step>("operator");
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | null>(null);
  const [voucher, setVoucher] = useState<VoucherResult | null>(null);
  const [waitingForCard, setWaitingForCard] = useState(false);
  const { toast } = useToast();

  const { data: operators = [], isLoading: loadingOperators } = useQuery<Operator[]>({
    queryKey: ["/api/topup/operators"],
  });

  const topUpMutation = useMutation({
    mutationFn: async () => {
      const amount = selectedAmount ?? parseFloat(customAmount);
      const res = await apiRequest("POST", "/api/topup/process", {
        operatorId: selectedOperator!.id,
        amount,
        customIdentifier: `QORA-${tillId}-${Date.now()}`,
      });
      return res.json();
    },
    onSuccess: (result: VoucherResult) => {
      if (result.success) {
        setVoucher(result);
        setStep("success");
        // Auto-print the voucher
        posHardware.printTopUpVoucher({
          ...result,
          paymentMethod: paymentMethod === "card" ? "Card" : "Cash",
          tillId,
          timestamp: new Date().toISOString(),
        });
      } else {
        toast({
          title: "Voucher Failed",
          description: result.message || "Could not generate voucher",
          variant: "destructive",
        });
      }
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const finalAmount = selectedAmount ?? (customAmount ? parseFloat(customAmount) : null);

  const isAmountValid =
    finalAmount !== null &&
    !isNaN(finalAmount) &&
    finalAmount > 0 &&
    selectedOperator &&
    finalAmount >= selectedOperator.minAmount &&
    finalAmount <= selectedOperator.maxAmount;

  const handlePaymentChoice = async (method: "cash" | "card") => {
    if (!finalAmount) return;
    setPaymentMethod(method);

    if (method === "card") {
      const ref = `TOPUP-${tillId}-${Date.now()}`;
      setWaitingForCard(true);
      try {
        const approved = await onPayWithCard(finalAmount, ref);
        setWaitingForCard(false);
        if (approved) {
          topUpMutation.mutate();
        } else {
          toast({
            title: "Card Payment Not Completed",
            description: "Voucher was not generated. The customer was not charged.",
            variant: "destructive",
            duration: 5000,
          });
        }
      } catch (e) {
        setWaitingForCard(false);
      }
    } else {
      // Cash: cashier collects cash physically; voucher generates immediately
      onPayWithCash(finalAmount);
      topUpMutation.mutate();
    }
  };

  const reset = () => {
    setStep("operator");
    setSelectedOperator(null);
    setSelectedAmount(null);
    setCustomAmount("");
    setVoucher(null);
    setPaymentMethod(null);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col">
        <CardHeader className="pb-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {step !== "operator" && step !== "success" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    if (step === "amount") setStep("operator");
                    if (step === "payment") setStep("amount");
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
              <CardTitle className="flex items-center gap-2 text-lg">
                <Smartphone className="h-5 w-5 text-green-600" />
                Mobile Top-Up Voucher
              </CardTitle>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {step !== "success" && (
            <div className="flex items-center gap-1 mt-2">
              {(["operator", "amount", "payment"] as Step[]).map((s, i) => {
                const stepIdx = ["operator", "amount", "payment"].indexOf(step);
                return (
                  <div key={s} className="flex items-center gap-1">
                    <div
                      className={`h-2 w-2 rounded-full transition-colors ${
                        step === s ? "bg-green-600" : i < stepIdx ? "bg-green-300" : "bg-gray-200"
                      }`}
                    />
                    {i < 2 && <div className="h-px w-6 bg-gray-200" />}
                  </div>
                );
              })}
              <span className="text-xs text-muted-foreground ml-2 capitalize">
                {step === "operator" ? "Network" : step === "amount" ? "Amount" : "Payment"}
              </span>
            </div>
          )}
        </CardHeader>

        <CardContent className="overflow-y-auto flex-1">
          {/* STEP 1: Operator selection */}
          {step === "operator" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Which network does the customer need?</p>
              {loadingOperators ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {operators.map((op) => (
                    <button
                      key={op.id}
                      onClick={() => {
                        setSelectedOperator(op);
                        setSelectedAmount(null);
                        setCustomAmount("");
                        setStep("amount");
                      }}
                      className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-transparent bg-slate-50 dark:bg-slate-800 hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all gap-2 text-center"
                    >
                      <span className="text-3xl">{op.logo}</span>
                      <span className="text-sm font-semibold leading-tight">{op.name}</span>
                      <span className="text-xs text-muted-foreground">
                        €{op.minAmount}–€{op.maxAmount}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Amount */}
          {step === "amount" && selectedOperator && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <span className="text-2xl">{selectedOperator.logo}</span>
                <div>
                  <p className="font-semibold">{selectedOperator.name}</p>
                  <p className="text-xs text-muted-foreground">
                    €{selectedOperator.minAmount}–€{selectedOperator.maxAmount} voucher
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium">How much top-up?</label>
                <div className="grid grid-cols-3 gap-2">
                  {selectedOperator.fixedAmounts.map((amt) => (
                    <button
                      key={amt}
                      onClick={() => {
                        setSelectedAmount(amt);
                        setCustomAmount("");
                      }}
                      className={`py-4 rounded-lg border-2 font-bold text-lg transition-all ${
                        selectedAmount === amt
                          ? "border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700"
                          : "border-transparent bg-slate-50 dark:bg-slate-800 hover:border-green-300"
                      }`}
                    >
                      €{amt}
                    </button>
                  ))}
                </div>

                {selectedOperator.minAmount !== selectedOperator.maxAmount && (
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Or enter custom amount</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">€</span>
                      <Input
                        type="number"
                        min={selectedOperator.minAmount}
                        max={selectedOperator.maxAmount}
                        step="1"
                        placeholder={`${selectedOperator.minAmount}–${selectedOperator.maxAmount}`}
                        value={customAmount}
                        onChange={(e) => {
                          setCustomAmount(e.target.value);
                          setSelectedAmount(null);
                        }}
                        className="pl-7"
                      />
                    </div>
                    {customAmount && !isAmountValid && (
                      <p className="text-xs text-red-500">
                        Amount must be between €{selectedOperator.minAmount} and €{selectedOperator.maxAmount}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <Button
                className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-base"
                disabled={!isAmountValid}
                onClick={() => setStep("payment")}
              >
                Continue → Pay €{finalAmount?.toFixed(2) || "0.00"}
              </Button>
            </div>
          )}

          {/* STEP 3: Payment */}
          {step === "payment" && selectedOperator && finalAmount && (
            <div className="space-y-5">
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Network</span>
                  <span className="font-semibold">{selectedOperator.logo} {selectedOperator.name}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Voucher Amount</span>
                  <span className="text-green-600">€{finalAmount.toFixed(2)}</span>
                </div>
              </div>

              <p className="text-sm text-center text-muted-foreground">How is the customer paying?</p>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  className="h-20 flex flex-col gap-2 bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => handlePaymentChoice("cash")}
                  disabled={topUpMutation.isPending || waitingForCard}
                >
                  <Banknote className="h-6 w-6" />
                  <span className="font-semibold">Cash</span>
                </Button>
                <Button
                  className="h-20 flex flex-col gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => handlePaymentChoice("card")}
                  disabled={topUpMutation.isPending || waitingForCard}
                >
                  <CreditCard className="h-6 w-6" />
                  <span className="font-semibold">Card</span>
                </Button>
              </div>

              {waitingForCard && (
                <div className="flex items-center justify-center gap-2 text-sm text-blue-600 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Waiting for card terminal...
                </div>
              )}
              {topUpMutation.isPending && !waitingForCard && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating voucher...
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Success — show voucher PIN */}
          {step === "success" && voucher && (
            <div className="space-y-4">
              <div className="text-center">
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
                <h3 className="text-xl font-bold text-green-600 mt-2">Voucher Printed</h3>
                <p className="text-xs text-muted-foreground">Hand the receipt to the customer</p>
              </div>

              {/* PIN block */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-2 border-green-300 rounded-xl p-4 text-center">
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Voucher PIN</div>
                <div className="text-2xl font-mono font-bold text-green-700 mt-1 tracking-wider break-all">
                  {voucher.formattedPin}
                </div>
                <div className="text-xs text-muted-foreground mt-2">Serial: {voucher.voucherSerial}</div>
              </div>

              {/* Summary */}
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Network</span>
                  <span className="font-semibold">{voucher.operatorLogo} {voucher.operator}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-bold text-green-600">€{voucher.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expires</span>
                  <span>{voucher.expiryDate}</span>
                </div>
              </div>

              {/* Customer instructions preview */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded-lg p-3 text-xs space-y-1">
                <p className="font-semibold text-blue-900 dark:text-blue-300">Customer instructions on receipt:</p>
                {voucher.redemption.instructions.map((line, i) => (
                  <p key={i} className="text-blue-800 dark:text-blue-200">• {line}</p>
                ))}
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  posHardware.printTopUpVoucher({
                    ...voucher,
                    paymentMethod: paymentMethod === "card" ? "Card" : "Cash",
                    tillId,
                    timestamp: new Date().toISOString(),
                  });
                }}
              >
                <Printer className="h-4 w-4 mr-2" />
                Reprint Voucher
              </Button>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={reset}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  New Voucher
                </Button>
                <Button className="flex-1" onClick={onClose}>
                  Done
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
