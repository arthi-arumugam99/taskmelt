import createContextHook from '@nkzw/create-context-hook';

// Simplified context - all users are Pro since this is a paid app
export const [RevenueCatProvider, useRevenueCat] = createContextHook(() => {
  return {
    isProUser: true,
    customerInfo: null,
    offerings: null,
    isLoading: false,
    isInitialized: true,
    error: null,
    purchasePackage: async () => {},
    restorePurchases: async () => {},
    isPurchasing: false,
    isRestoring: false,
    purchaseError: null,
    restoreError: null,
    monthlyPackage: undefined,
    yearlyPackage: undefined,
    lifetimePackage: undefined,
    allPackages: [],
    refetchCustomerInfo: async () => {},
  };
});

export function useProFeature() {
  return { isProUser: true, isLoading: false };
}
