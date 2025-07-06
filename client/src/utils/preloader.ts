// Preloader utility for optimizing component loading
export class ComponentPreloader {
  private static preloadedComponents = new Set<string>();
  
  static async preloadComponent(componentPath: string) {
    if (this.preloadedComponents.has(componentPath)) {
      return;
    }
    
    try {
      // Preload the component module
      await import(componentPath);
      this.preloadedComponents.add(componentPath);
    } catch (error) {
      // Silently fail for non-critical preloading
      console.warn(`Failed to preload component: ${componentPath}`);
    }
  }
  
  static preloadCriticalComponents() {
    // Preload components that are likely to be used soon
    const criticalComponents = [
      '@/components/modern-pos-interface',
      '@/components/back-office-dashboard',
      '@/components/staff-management',
      '@/components/inventory-management'
    ];
    
    criticalComponents.forEach(component => {
      this.preloadComponent(component);
    });
  }
  
  static preloadDataEndpoints() {
    // Preload critical API endpoints
    const endpoints = [
      '/api/products',
      '/api/users',
      '/api/transactions'
    ];
    
    endpoints.forEach(endpoint => {
      fetch(endpoint)
        .then(response => response.json())
        .catch(() => {}); // Ignore errors for background preloading
    });
  }
}