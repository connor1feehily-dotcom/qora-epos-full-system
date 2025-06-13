import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";

export function useAutoSeed() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<{ seeded: boolean } | null>(null);

  useEffect(() => {
    // Force 25 second loading time
    const loadingTimer = setTimeout(() => {
      setIsLoading(false);
      setData({ seeded: true });
    }, 25000);

    // Seed the database in background
    apiRequest('POST', '/api/seed', {}).catch(() => {
      // Ignore errors, database might already be seeded
    });

    return () => clearTimeout(loadingTimer);
  }, []);

  return { isLoading, data };
}