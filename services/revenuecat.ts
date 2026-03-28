/**
 * RevenueCat service — real SDK integration.
 *
 * Entitlement: "Contra Pro" (single tier, no Eloquence).
 * Packages: monthly · yearly · lifetime
 */

import { Platform } from 'react-native';
import Purchases, {
  LOG_LEVEL,
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
} from 'react-native-purchases';

// Re-export SDK types so consumers don't import from 'react-native-purchases' directly
export type { CustomerInfo, PurchasesOffering, PurchasesPackage };

const IOS_KEY     = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY     ?? '';
const ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '';

const ENTITLEMENT_ID = 'Contra Pro';

let isConfigured = false;

// ─── Initialize ────────────────────────────────────────────────────────────────

/**
 * Call once at app start (in app/_layout.tsx).
 * Pass the authenticated user's ID so purchases are linked to their account.
 */
export async function initializePurchases(userId?: string): Promise<void> {
  const apiKey = Platform.OS === 'ios' ? IOS_KEY : ANDROID_KEY;
  if (!apiKey) {
    console.warn('[RevenueCat] Missing API key — purchases disabled.');
    return;
  }

  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
  }

  Purchases.configure({ apiKey, appUserID: userId ?? undefined });
  isConfigured = true;
}

/**
 * Link an authenticated user after login/register.
 */
export async function loginUser(userId: string): Promise<CustomerInfo | null> {
  if (!isConfigured) return null;
  const { customerInfo } = await Purchases.logIn(userId);
  return customerInfo;
}

/**
 * Unlink user on logout (resets to anonymous).
 */
export async function logoutUser(): Promise<void> {
  if (!isConfigured) return;
  if (await Purchases.isAnonymous()) return;
  await Purchases.logOut();
}

// ─── Offerings ─────────────────────────────────────────────────────────────────

/** Fetch the current offering from RevenueCat dashboard. */
export async function getCurrentOffering(): Promise<PurchasesOffering | null> {
  if (!isConfigured) return null;
  const offerings = await Purchases.getOfferings();
  return offerings.current ?? null;
}

// ─── Purchases ─────────────────────────────────────────────────────────────────

/** Purchase a package. Throws on cancellation or error. */
export async function purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo | null> {
  if (!isConfigured) return null;
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo;
}

/** Restore previous purchases (required for App Store guidelines). */
export async function restorePurchases(): Promise<CustomerInfo | null> {
  if (!isConfigured) return null;
  return Purchases.restorePurchases();
}

// ─── Customer info ─────────────────────────────────────────────────────────────

/** Get the current subscriber's entitlements. */
export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  if (!isConfigured) return null;
  return Purchases.getCustomerInfo();
}

/** Listen for customer info changes (subscription renewal, expiry, etc.) */
export function addCustomerInfoListener(
  listener: (info: CustomerInfo) => void,
): () => void {
  if (!isConfigured) return () => {};
  const remove = Purchases.addCustomerInfoUpdateListener(listener);
  return remove;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Returns true if the customer has an active "Contra Pro" entitlement. */
export function hasProEntitlement(info: CustomerInfo): boolean {
  return ENTITLEMENT_ID in info.entitlements.active;
}
