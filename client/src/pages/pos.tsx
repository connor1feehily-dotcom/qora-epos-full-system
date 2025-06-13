import { RevolutionaryPOS } from "@/components/revolutionary-pos";

interface POSProps {
  tillId: string;
  onBackToMenu: () => void;
}

export default function POS({ tillId, onBackToMenu }: POSProps) {
  return <RevolutionaryPOS tillId={tillId} onBackToMenu={onBackToMenu} />;
}