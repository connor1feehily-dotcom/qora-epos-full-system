import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { tenantService } from "@/services/tenant-service";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

/**
 * Helper function to add tenant context to API URLs
 */
function addTenantParams(url: string): string {
  // Get current tenant slug from tenant service
  const shop = tenantService.getCurrentTenantSlug();
  
  console.log(`[addTenantParams] URL: ${url}, tenant service shop: ${shop}`);
  
  if (!shop || shop === 'demo') {
    // For demo tenant or no tenant, don't add parameters (will default to demo)
    return url;
  }
  
  // Add shop parameter to API URL
  const separator = url.includes('?') ? '&' : '?';
  const finalUrl = `${url}${separator}shop=${shop}`;
  
  console.log(`[addTenantParams] Original: ${url} → Final: ${finalUrl}`);
  return finalUrl;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Add tenant context to URL
  const tenantAwareUrl = addTenantParams(url);
  
  const res = await fetch(tenantAwareUrl, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Add tenant context to query URL
    const tenantAwareUrl = addTenantParams(queryKey[0] as string);
    
    const res = await fetch(tenantAwareUrl, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime in v5)
      retry: 1, // Single retry for faster failure
      retryDelay: 500, // Quick retry
      networkMode: 'online',
    },
    mutations: {
      retry: 1,
      retryDelay: 500,
    },
  },
});
