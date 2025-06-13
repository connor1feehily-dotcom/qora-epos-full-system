import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useAutoSeed() {
  return useQuery({
    queryKey: ['/api/seed'],
    queryFn: async () => {
      try {
        await apiRequest('POST', '/api/seed', {});
        return { seeded: true };
      } catch (error) {
        // If seeding fails, it might already be seeded
        return { seeded: false };
      }
    },
    retry: false,
    staleTime: Infinity,
  });
}