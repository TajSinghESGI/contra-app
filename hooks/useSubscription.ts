import { useState, useEffect, useCallback } from 'react';
import {
  getCustomerInfo,
  purchasePackage,
  restorePurchases,
  hasProEntitlement,
  addCustomerInfoListener,
  type CustomerInfo,
  type PurchasesPackage,
} from '@/services/revenuecat';

export type SubscriptionTier = 'free' | 'pro';

interface SubscriptionState {
  tier: SubscriptionTier;
  isPro: boolean;
  isLoading: boolean;
  error: string | null;
}

interface SubscriptionActions {
  subscribe: (pkg: PurchasesPackage) => Promise<boolean>;
  restore: () => Promise<boolean>;
  refresh: () => Promise<void>;
}

export type UseSubscriptionReturn = SubscriptionState & SubscriptionActions;

function tierFromInfo(info: CustomerInfo | null): SubscriptionTier {
  if (!info) return 'free';
  if (hasProEntitlement(info)) return 'pro';
  return 'free';
}

export function useSubscription(): UseSubscriptionReturn {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Listen for real-time updates (renewal, expiry, etc.)
  useEffect(() => {
    const remove = addCustomerInfoListener((info) => {
      setCustomerInfo(info);
    });
    return remove;
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const info = await getCustomerInfo();
      setCustomerInfo(info);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const subscribe = useCallback(async (pkg: PurchasesPackage): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const info = await purchasePackage(pkg);
      setCustomerInfo(info);
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Achat échoué.';
      // User cancelled — not an error worth surfacing
      if (!msg.toLowerCase().includes('cancel')) {
        setError(msg);
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const restore = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const info = await restorePurchases();
      setCustomerInfo(info);
      return info ? hasProEntitlement(info) : false;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Restauration échouée.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const tier = tierFromInfo(customerInfo);

  return {
    tier,
    isPro: tier === 'pro',
    isLoading,
    error,
    subscribe,
    restore,
    refresh,
  };
}
