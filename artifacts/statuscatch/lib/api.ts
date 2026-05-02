import * as SecureStore from "expo-secure-store";

const API_BASE = process.env.EXPO_PUBLIC_API_URL || "https://statuscatch.up.railway.app";
const TOKEN_KEY = "statuscatch_api_token";

export async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NetworkError";
  }
}

type OnUnauthorized = () => void;
let _onUnauthorized: OnUnauthorized | null = null;

export function setOnUnauthorized(cb: OnUnauthorized | null) {
  _onUnauthorized = cb;
}

interface ApiFetchOptions extends RequestInit {
  skipUnauthorizedHandler?: boolean;
}

async function apiFetch<T>(path: string, options?: ApiFetchOptions): Promise<T> {
  const token = await getToken();

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    });
  } catch (err) {
    throw new NetworkError(err instanceof Error ? err.message : "Network request failed");
  }

  if (res.status === 401) {
    if (!options?.skipUnauthorizedHandler) {
      _onUnauthorized?.();
    }
    throw new ApiError("Unauthorized", 401);
  }

  if (!res.ok) {
    throw new ApiError(`Request failed: ${res.statusText}`, res.status);
  }

  return res.json() as Promise<T>;
}

export interface DashboardSummary {
  totalVendors: number;
  operationalCount: number;
  degradedCount: number;
  outageCount: number;
  maintenanceCount: number;
  unknownCount: number;
  activeIncidentsCount: number;
  activeMaintenanceCount: number;
  criticalIncidentsCount: number;
}

export interface ApiVendorCatalog {
  name: string;
  logoUrl: string | null;
  category: string;
  websiteUrl: string | null;
  statusPageUrl: string | null;
}

export interface ApiVendor {
  id: string;
  currentStatus: string;
  isActive: boolean;
  customName: string | null;
  feedUrl: string | null;
  lastPolledAt: string | null;
  vendorCatalog: ApiVendorCatalog | null;
  _count?: { incidents: number };
}

export interface ApiIncidentUpdate {
  id: string;
  body: string;
  status: string;
  publishedAt: string;
}

export interface ApiIncident {
  id: string;
  title: string;
  status: string;
  impact: string;
  startedAt: string;
  resolvedAt: string | null;
  externalUrl: string | null;
  vendorSubscription?: {
    vendorCatalog?: { name: string; logoUrl: string | null } | null;
    name?: string | null;
  } | null;
  vendorCatalog?: { name: string; logoUrl: string | null } | null;
  vendor?: { name?: string | null; vendorCatalog?: { name: string } | null } | null;
  vendorName?: string | null;
  updates: ApiIncidentUpdate[];
  _count?: { updates: number };
}

export interface DashboardResponse {
  summary: DashboardSummary;
  vendors: ApiVendor[];
  activeIncidents: ApiIncident[];
}

export interface VendorsResponse {
  vendors: ApiVendor[];
}

export interface IncidentsResponse {
  incidents: ApiIncident[];
  total: number;
  page: number;
  totalPages: number;
}

export interface IncidentDetailResponse {
  incident: ApiIncident;
}

export async function fetchDashboard(): Promise<DashboardResponse> {
  return apiFetch("/api/mobile/dashboard");
}

export async function fetchVendors(): Promise<VendorsResponse> {
  return apiFetch("/api/mobile/vendors");
}

export interface FetchIncidentsParams {
  page?: number;
  limit?: number;
  active?: boolean;
  type?: "INCIDENT" | "MAINTENANCE";
  vendorId?: string;
  status?: string;
  search?: string;
}

export async function fetchIncidents(params?: FetchIncidentsParams): Promise<IncidentsResponse> {
  const sp = new URLSearchParams();
  if (params?.page) sp.set("page", String(params.page));
  if (params?.limit) sp.set("limit", String(params.limit));
  if (params?.active) sp.set("active", "true");
  if (params?.type) sp.set("type", params.type);
  if (params?.vendorId) sp.set("vendorId", params.vendorId);
  if (params?.status) sp.set("status", params.status);
  if (params?.search) sp.set("search", params.search);
  const qs = sp.toString();
  return apiFetch(`/api/mobile/incidents${qs ? `?${qs}` : ""}`);
}

export async function fetchIncidentDetail(id: string): Promise<IncidentDetailResponse> {
  return apiFetch(`/api/mobile/incidents/${id}`);
}

export type TokenValidationResult = "valid" | "unauthorized" | "unreachable";

export async function registerPushToken(payload: {
  token: string;
  platform: string;
  deviceName: string | null;
}): Promise<void> {
  await apiFetch("/api/mobile/push-token", {
    method: "POST",
    body: JSON.stringify(payload),
    skipUnauthorizedHandler: true,
  });
}

export async function unregisterPushToken(token: string): Promise<void> {
  await apiFetch("/api/mobile/push-token", {
    method: "DELETE",
    body: JSON.stringify({ token }),
    skipUnauthorizedHandler: true,
  });
}

export async function validateToken(): Promise<TokenValidationResult> {
  try {
    await fetchDashboard();
    return "valid";
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return "unauthorized";
    return "unreachable";
  }
}

export function getVendorName(vendor: ApiVendor): string {
  return vendor.vendorCatalog?.name ?? vendor.customName ?? "Unknown Vendor";
}

export function getVendorInitial(vendor: ApiVendor): string {
  const name = getVendorName(vendor);
  return name.charAt(0).toUpperCase();
}

const CATEGORY_COLORS: Record<string, string> = {
  COMMUNICATION: "#F22F46",
  CLOUD: "#FF9900",
  PAYMENTS: "#635BFF",
  SECURITY: "#007DC1",
  OBSERVABILITY: "#632CA6",
  PRODUCTIVITY: "#00A1E0",
  DEVELOPER_TOOLS: "#0052CC",
  OTHER: "#5B8DD9",
};

export function getVendorColor(vendor: ApiVendor): string {
  const cat = vendor.vendorCatalog?.category ?? "OTHER";
  return CATEGORY_COLORS[cat] ?? "#5B8DD9";
}

export function getIncidentVendorName(incident: ApiIncident): string {
  const anyInc = incident as any;
  return (
    anyInc.vendorSubscription?.customName ||
    anyInc.vendorSubscription?.vendorCatalog?.name ||
    anyInc.vendorSubscription?.name ||
    anyInc.vendorCatalog?.name ||
    anyInc.vendor?.vendorCatalog?.name ||
    anyInc.vendor?.name ||
    anyInc.vendorName ||
    "Unknown"
  );
}
