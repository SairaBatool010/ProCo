import { useEffect, useState } from "react";

const TENANT_KEY = "proco:tenant_id";
const PROPERTY_KEY = "proco:property_id";

export function getActiveTenantId(): string | null {
  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem(TENANT_KEY);
    if (stored) return stored;
  }
  return process.env.NEXT_PUBLIC_DEMO_TENANT_ID ?? null;
}

export function getActivePropertyId(): string | null {
  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem(PROPERTY_KEY);
    if (stored) return stored;
  }
  return process.env.NEXT_PUBLIC_DEMO_PROPERTY_ID ?? null;
}

export function setActiveTenantContext(tenantId: string, propertyId?: string | null) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TENANT_KEY, tenantId);
  if (propertyId) {
    window.localStorage.setItem(PROPERTY_KEY, propertyId);
  } else {
    window.localStorage.removeItem(PROPERTY_KEY);
  }
}

export function useActiveTenant() {
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [propertyId, setPropertyId] = useState<string | null>(null);

  useEffect(() => {
    setTenantId(getActiveTenantId());
    setPropertyId(getActivePropertyId());
  }, []);

  const updateTenantContext = (nextTenantId: string, nextPropertyId?: string | null) => {
    setActiveTenantContext(nextTenantId, nextPropertyId ?? null);
    setTenantId(nextTenantId);
    setPropertyId(nextPropertyId ?? null);
  };

  return {
    tenantId,
    propertyId,
    setActiveTenantContext: updateTenantContext,
  };
}
