import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Monitor, Store } from "lucide-react";

interface TillSelectorProps {
  onSelectTill: (tillId: string) => void;
  selectedTill?: string;
}

export function TillSelector({ onSelectTill, selectedTill }: TillSelectorProps) {
  if (selectedTill) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <Card className="p-3 bg-white shadow-lg border border-gray-200">
          <div className="flex items-center space-x-2">
            <Monitor className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{selectedTill === 'till1' ? 'Till 1' : 'Till 2'}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSelectTill('')}
              className="ml-2"
            >
              Switch
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Kerrigans XL</h1>
          <p className="text-lg text-gray-600 mb-1">Manorhamilton</p>
          <p className="text-sm text-gray-500">Select your till to continue</p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={() => onSelectTill('till1')}
            className="w-full h-16 text-lg bg-primary hover:bg-blue-700"
          >
            <Monitor className="w-6 h-6 mr-3" />
            Till 1
          </Button>
          
          <Button
            onClick={() => onSelectTill('till2')}
            className="w-full h-16 text-lg bg-secondary hover:bg-green-700"
          >
            <Monitor className="w-6 h-6 mr-3" />
            Till 2
          </Button>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <Button
              onClick={() => onSelectTill('backoffice')}
              variant="outline"
              className="w-full h-12 text-base"
            >
              <Store className="w-5 h-5 mr-2" />
              Back Office Management
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}