import { useEffect, useState, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import Purchases, {
  LOG_LEVEL,
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
} from 'react-native-purchases';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';

const API_KEY = 'appl_eaDfLBAAiQHdVMOsBfzRMgmxNHu';
const ENTITLEMENT_ID = 'taskmelt Pro';



async function initializePurchases(): Promise<void> {
  if (Platform.OS === 'web') {
    console.log('RevenueCat: Skipping initialization on web platform');
    return;
  }

  try {
    Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
    await Purchases.configure({ apiKey: API_KEY });
    console.log('RevenueCat: Initialized successfully');
  } catch (error) {
    console.log('RevenueCat: Initialization error:', error);
    throw error;
  }
}

async function fetchCustomerInfo(): Promise<CustomerInfo | null> {
  if (Platform.OS === 'web') {
    console.log('RevenueCat: Customer info not available on web');
    return null;
  }

  try {
    const customerInfo = await Purchases.getCustomerInfo();
    console.log('RevenueCat: Customer info fetched:', customerInfo.activeSubscriptions);
    return customerInfo;
  } catch (error) {
    console.log('RevenueCat: Error fetching customer info:', error);
    throw error;
  }
}

async function fetchOfferings(): Promise<PurchasesOffering | null> {
  if (Platform.OS === 'web') {
    console.log('RevenueCat: Offerings not available on web');
    return null;
  }

  try {
    const offerings = await Purchases.getOfferings();
    console.log('RevenueCat: Offerings fetched:', offerings.current?.identifier);
    return offerings.current ?? null;
  } catch (error) {
    console.log('RevenueCat: Error fetching offerings:', error);
    throw error;
  }
}

export const [RevenueCatProvider, useRevenueCat] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        await initializePurchases();
        setIsInitialized(true);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to initialize purchases';
        setInitError(message);
        console.log('RevenueCat: Init failed:', message);
      }
    };

    init();

    if (Platform.OS !== 'web') {
      try {
        Purchases.addCustomerInfoUpdateListener((info) => {
          console.log('RevenueCat: Customer info updated');
          queryClient.setQueryData(['customerInfo'], info);
        });
      } catch (error) {
        console.log('RevenueCat: Error setting up listener:', error);
      }
    }
  }, [queryClient]);

  const customerInfoQuery = useQuery({
    queryKey: ['customerInfo'],
    queryFn: fetchCustomerInfo,
    enabled: isInitialized && Platform.OS !== 'web',
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });

  const offeringsQuery = useQuery({
    queryKey: ['offerings'],
    queryFn: fetchOfferings,
    enabled: isInitialized && Platform.OS !== 'web',
    staleTime: 1000 * 60 * 30,
    retry: 2,
  });

  const purchaseMutation = useMutation({
    mutationFn: async (pkg: PurchasesPackage) => {
      if (Platform.OS === 'web') {
        throw new Error('Purchases not available on web');
      }
      console.log('RevenueCat: Purchasing package:', pkg.identifier);
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      return customerInfo;
    },
    onSuccess: (customerInfo) => {
      console.log('RevenueCat: Purchase successful');
      queryClient.setQueryData(['customerInfo'], customerInfo);
    },
    onError: (error) => {
      console.log('RevenueCat: Purchase error:', error);
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async () => {
      if (Platform.OS === 'web') {
        throw new Error('Restore not available on web');
      }
      console.log('RevenueCat: Restoring purchases');
      const customerInfo = await Purchases.restorePurchases();
      return customerInfo;
    },
    onSuccess: (customerInfo) => {
      console.log('RevenueCat: Restore successful');
      queryClient.setQueryData(['customerInfo'], customerInfo);
    },
    onError: (error) => {
      console.log('RevenueCat: Restore error:', error);
    },
  });

  const isProUser = useMemo(() => {
    if (Platform.OS === 'web') return false;
    const customerInfo = customerInfoQuery.data;
    if (!customerInfo) return false;
    
    const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
    const hasAccess = !!entitlement;
    console.log('RevenueCat: Pro user check:', hasAccess);
    return hasAccess;
  }, [customerInfoQuery.data]);

  const { mutateAsync: purchaseAsync } = purchaseMutation;
  const { mutateAsync: restoreAsync } = restoreMutation;

  const purchasePackage = useCallback(
    async (pkg: PurchasesPackage) => {
      return purchaseAsync(pkg);
    },
    [purchaseAsync]
  );

  const restorePurchases = useCallback(async () => {
    return restoreAsync();
  }, [restoreAsync]);

  const getPackageByIdentifier = useCallback(
    (identifier: string): PurchasesPackage | undefined => {
      return offeringsQuery.data?.availablePackages.find(
        (pkg) => pkg.identifier === identifier || pkg.packageType === identifier
      );
    },
    [offeringsQuery.data]
  );

  const monthlyPackage = useMemo(
    () => getPackageByIdentifier('$rc_monthly') || getPackageByIdentifier('monthly'),
    [getPackageByIdentifier]
  );

  const yearlyPackage = useMemo(
    () => getPackageByIdentifier('$rc_annual') || getPackageByIdentifier('yearly'),
    [getPackageByIdentifier]
  );

  const lifetimePackage = useMemo(
    () => getPackageByIdentifier('$rc_lifetime') || getPackageByIdentifier('lifetime'),
    [getPackageByIdentifier]
  );

  return {
    isProUser,
    customerInfo: customerInfoQuery.data ?? null,
    offerings: offeringsQuery.data ?? null,
    isLoading: customerInfoQuery.isLoading || offeringsQuery.isLoading,
    isInitialized,
    error: initError || (customerInfoQuery.error as Error)?.message || null,
    purchasePackage,
    restorePurchases,
    isPurchasing: purchaseMutation.isPending,
    isRestoring: restoreMutation.isPending,
    purchaseError: purchaseMutation.error as Error | null,
    restoreError: restoreMutation.error as Error | null,
    monthlyPackage,
    yearlyPackage,
    lifetimePackage,
    allPackages: offeringsQuery.data?.availablePackages ?? [],
    refetchCustomerInfo: customerInfoQuery.refetch,
  };
});

export function useProFeature() {
  const { isProUser, isLoading } = useRevenueCat();
  return { isProUser, isLoading };
}
