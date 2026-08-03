"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api, ApiError } from "@/lib/client/api";
import { PurchaseModal } from "./PurchaseModal";
import { InsufficientCreditModal } from "./InsufficientCreditModal";

export interface Balance {
  creditBalance: number;
  ticketExpiresAt: string | null;
  hasActiveTicket: boolean;
  isPremium: boolean;
  expiry: {
    ticket: { level: string; expiresAt: string | null; daysLeft: number | null };
    subscription: { level: string; currentPeriodEnd: string | null; daysLeft: number | null };
  };
}

interface BillingContextValue {
  balance: Balance | null;
  loading: boolean;
  refresh: () => Promise<void>;
  openPurchase: (tab?: "ticket" | "credit" | "premium") => void;
  /**
   * Run a billable action. If it fails with 402 (insufficient credit) the
   * insufficient-credit modal opens automatically and the promise resolves to
   * `null`. Any other error is re-thrown.
   */
  runBillable: <T>(fn: () => Promise<T>) => Promise<T | null>;
}

const BillingContext = createContext<BillingContextValue | null>(null);

export function useBilling(): BillingContextValue {
  const ctx = useContext(BillingContext);
  if (!ctx) throw new Error("useBilling must be used within <BillingProvider>");
  return ctx;
}

export function BillingProvider({ children }: { children: React.ReactNode }) {
  const [balance, setBalance] = useState<Balance | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchaseTab, setPurchaseTab] = useState<null | "ticket" | "credit" | "premium">(null);
  const [insufficient, setInsufficient] = useState<null | { cost: number; balance: number }>(null);

  const refresh = useCallback(async () => {
    try {
      const b = await api<Balance>("/api/me/balance");
      setBalance(b);
    } catch {
      setBalance(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const openPurchase = useCallback((tab: "ticket" | "credit" | "premium" = "ticket") => {
    setInsufficient(null);
    setPurchaseTab(tab);
  }, []);

  const runBillable = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T | null> => {
      try {
        const result = await fn();
        await refresh();
        return result;
      } catch (err) {
        if (err instanceof ApiError && err.isInsufficientCredit) {
          setInsufficient({ cost: err.body?.cost ?? 0, balance: err.body?.balance ?? 0 });
          return null;
        }
        throw err;
      }
    },
    [refresh]
  );

  const value = useMemo<BillingContextValue>(
    () => ({ balance, loading, refresh, openPurchase, runBillable }),
    [balance, loading, refresh, openPurchase, runBillable]
  );

  return (
    <BillingContext.Provider value={value}>
      {children}
      {insufficient && (
        <InsufficientCreditModal
          cost={insufficient.cost}
          balance={insufficient.balance}
          onClose={() => setInsufficient(null)}
          onBuy={() => openPurchase("ticket")}
        />
      )}
      {purchaseTab && (
        <PurchaseModal
          initialTab={purchaseTab}
          onClose={() => setPurchaseTab(null)}
          onPurchased={refresh}
        />
      )}
    </BillingContext.Provider>
  );
}
