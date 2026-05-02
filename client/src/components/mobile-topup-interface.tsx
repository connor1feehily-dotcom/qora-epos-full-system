import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Phone,
  RefreshCw,
  CreditCard,
  Banknote,
  Printer
} from "lucide-react";

interface MobileTopUpInterfaceProps {
  tillId: string;
  onClose: () => void;
  onPayWithCard: (amount: number, reference: string) => void;
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

type Step = "operator" | "details" | "payment" | "success";

export default function MobileTopUpInterface({
  tillId,
  onClose,
  onPayWithCard,
  onPayWithCash,
}: MobileTopUpInterfaceProps) {
  const [step, setStep] = useState<Step>("operator");
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | null>(null);
  const [topUpResult, setTopUpResult] = useState<any>(null);
  const { toast } = useToast();

  const { data: operators = [], isLoading: loadingOperators } = useQuery<Operator[]>({
    queryKey: ["/api/topup/operators"],
  });

  const topUpMutation = useMutation({
    mutationFn: async () => {
      const amount = selectedAmount ?? parseFloat(customAmount);
      const res = await apiRequest("POST", "/api/topup/process", {
        operatorId: selectedOperator!.id,
        phoneNumber,
        amount,
        customIdentifier: `QORA-${tillId}-${Date.now()}`,
      });
      return res.json();
    },
    onSuccess: (result) => {
      if (result.success) {
        setTopUpResult(result);
        setStep("success");
        // Auto-print the top-up receipt
        const amount = selectedAmount ?? parseFloat(customAmount);
        posHardware.printTopUpReceipt({
          transactionId: result.transactionId,
          operatorTransactionId: result.operatorTransactionId,
          operator: result.operator || selectedOperator?.name || "",
          phoneNumber: result.phoneNumber || `+353 ${phoneNumber}`,
          amount,
          paymentMethod: paymentMethod === "card" ? "Card" : "Cash",
          timestamp: new Date().toISOString(),
        });
      } else {
        toast({
          title: "Top-Up Failed",
          description: result.message || "Could not process the top-up",
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

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 12);
    if (digits.length <= 4) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  };

  const isPhoneValid = phoneNumber.replace(/\D/g, "").length >= 9;
  const isAmountValid = finalAmount !== null && !isNaN(finalAmount) && finalAmount > 0 &&
    selectedOperator &&
    finalAmount >= selectedOperator.minAmount &&
    finalAmount <= selectedOperator.maxAmount;

  const handlePaymentChoice = (method: "cash" | "card") => {
    if (!finalAmount) return;
    setPaymentMethod(method);

    if (method === "card") {
      const ref = `TOPUP-${tillId}-${Date.now()}`;
      topUpMutation.mutate();
      onPayWithCard(finalAmount, ref);
    } else {
      topUpMutation.mutate();
      onPayWithCash(finalAmount);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <CardHeader className="pb-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {step !== "operator" && step !== "success" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    if (step === "details") setStep("operator");
                    if (step === "payment") setStep("details");
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
              <CardTitle className="flex items-center gap-2 text-lg">
                <Smartphone className="h-5 w-5 text-green-600" />
                Mobile Top-Up
              </CardTitle>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Step indicators */}
          {step !== "success" && (
            <div className="flex items-center gap-1 mt-2">
              {(["operator", "details", "payment"] as Step[]).map((s, i) => (
                <div key={s} className="flex items-center gap-1">
                  <div
                    className={`h-2 w-2 rounded-full transition-colors ${
                      step === s
                        ? "bg-green-600"
                        : ["details", "payment"].indexOf(step) > ["details", "payment"].indexOf(s) ||
                          (step === "payment" && s !== "payment")
                        ? "bg-green-300"
                        : "bg-gray-200"
                    }`}
                  />
                  {i < 2 && <div className="h-px w-6 bg-gray-200" />}
                </div>
              ))}
              <span className="text-xs text-muted-foreground ml-2 capitalize">
                {step === "operator" ? "Select network" : step === "details" ? "Enter details" : "Payment"}
              </span>
            </div>
          )}
        </CardHeader>

        <CardContent className="overflow-y-auto flex-1">
          {/* STEP 1: Operator selection */}
          {step === "operator" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Select the mobile network to top up:</p>
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
                        setStep("details");
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

          {/* STEP 2: Phone number + amount */}
          {step === "details" && selectedOperator && (
            <div className="space-y-5">
              {/* Selected network */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <span className="text-2xl">{selectedOperator.logo}</span>
                <div>
                  <p className="font-semibold">{selectedOperator.name}</p>
                  <p className="text-xs text-muted-foreground">
                    €{selectedOperator.minAmount}–€{selectedOperator.maxAmount} top-up
                  </p>
                </div>
              </div>

              {/* Phone number */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </label>
                <div className="flex gap-2">
                  <div className="flex items-center px-3 py-2 border rounded-md bg-slate-50 dark:bg-slate-800 text-sm font-mono text-muted-foreground">
                    🇮🇪 +353
                  </div>
                  <Input
                    type="tel"
                    placeholder="083 123 4567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(formatPhone(e.target.value))}
                    className={`flex-1 font-mono text-lg ${
                      phoneNumber && !isPhoneValid ? "border-red-400" : ""
                    }`}
                    autoFocus
                  />
                </div>
                {phoneNumber && !isPhoneValid && (
                  <p className="text-xs text-red-500">Enter a valid Irish mobile number</p>
                )}
              </div>

              <Separator />

              {/* Amount selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Top-Up Amount</label>
                <div className="grid grid-cols-3 gap-2">
                  {selectedOperator.fixedAmounts.map((amt) => (
                    <button
                      key={amt}
                      onClick={() => {
                        setSelectedAmount(amt);
                        setCustomAmount("");
                      }}
                      className={`py-3 rounded-lg border-2 font-semibold text-base transition-all ${
                        selectedAmount === amt
                          ? "border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700"
                          : "border-transparent bg-slate-50 dark:bg-slate-800 hover:border-green-300"
                      }`}
                    >
                      €{amt}
                    </button>
                  ))}
                </div>

                {/* Custom amount */}
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
                disabled={!isPhoneValid || !isAmountValid}
                onClick={() => setStep("payment")}
              >
                Continue → Pay €{finalAmount?.toFixed(2) || "0.00"}
              </Button>
            </div>
          )}

          {/* STEP 3: Payment method */}
          {step === "payment" && selectedOperator && finalAmount && (
            <div className="space-y-5">
              {/* Summary */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Network</span>
                  <span className="font-semibold">{selectedOperator.logo} {selectedOperator.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="font-mono">+353 {phoneNumber}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Amount</span>
                  <span className="text-green-600">€{finalAmount.toFixed(2)}</span>
                </div>
              </div>

              <p className="text-sm text-center text-muted-foreground">How would the customer like to pay?</p>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  className="h-20 flex flex-col gap-2 bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => handlePaymentChoice("cash")}
                  disabled={topUpMutation.isPending}
                >
                  <Banknote className="h-6 w-6" />
                  <span className="font-semibold">Cash</span>
                </Button>
                <Button
                  className="h-20 flex flex-col gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => handlePaymentChoice("card")}
                  disabled={topUpMutation.isPending}
                >
                  <CreditCard className="h-6 w-6" />
                  <span className="font-semibold">Card</span>
                </Button>
              </div>

              {topUpMutation.isPending && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing top-up...
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Success */}
          {step === "success" && topUpResult && (
            <div className="space-y-5 text-center py-4">
              <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto" />
              <div>
                <h3 className="text-2xl font-bold text-green-600">Top-Up Successful!</h3>
                <p className="text-muted-foreground mt-1">Credit has been applied</p>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-left space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-bold text-green-600 text-base">€{finalAmount?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Network</span>
                  <span className="font-semibold">{selectedOperator?.logo} {topUpResult.operator || selectedOperator?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="font-mono">{topUpResult.phoneNumber || `+353 ${phoneNumber}`}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transaction ID</span>
                  <span className="font-mono text-xs">{topUpResult.transactionId}</span>
                </div>
                {topUpResult.operatorTransactionId && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Operator Ref</span>
                    <span className="font-mono text-xs">{topUpResult.operatorTransactionId}</span>
                  </div>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                Credit applied instantly. A receipt has been added to the transaction.
              </p>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  const amount = selectedAmount ?? parseFloat(customAmount);
                  posHardware.printTopUpReceipt({
                    transactionId: topUpResult.transactionId,
                    operatorTransactionId: topUpResult.operatorTransactionId,
                    operator: topUpResult.operator || selectedOperator?.name || "",
                    phoneNumber: topUpResult.phoneNumber || `+353 ${phoneNumber}`,
                    amount,
                    paymentMethod: paymentMethod === "card" ? "Card" : "Cash",
                    timestamp: new Date().toISOString(),
                  });
                }}
              >
                <Printer className="h-4 w-4 mr-2" />
                Reprint Receipt
              </Button>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setStep("operator");
                    setSelectedOperator(null);
                    setPhoneNumber("");
                    setSelectedAmount(null);
                    setCustomAmount("");
                    setTopUpResult(null);
                    setPaymentMethod(null);
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  New Top-Up
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
