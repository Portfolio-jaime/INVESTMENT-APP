// Enhanced Performance monitoring utilities v2.1
export const performanceMonitor = {
  // Track page load times
  trackPageLoad: (pageName: string) => {
    const startTime = performance.now();
    return {
      finish: () => {
        const duration = performance.now() - startTime;
        console.log(`Page ${pageName} loaded in ${duration.toFixed(2)}ms`);
        return duration;
      }
    };
  },

  // Track API call performance
  trackApiCall: async <T>(apiCall: Promise<T>, endpoint: string): Promise<T> => {
    const startTime = performance.now();
    try {
      const result = await apiCall;
      const duration = performance.now() - startTime;
      console.log(`API ${endpoint} completed in ${duration.toFixed(2)}ms`);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(`API ${endpoint} failed after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  },

  // Track user interactions
  trackInteraction: (action: string, element?: string) => {
    console.log(`User interaction: ${action}${element ? ` on ${element}` : ''}`);
    // In production, send to analytics service
  }
};
