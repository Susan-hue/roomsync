// RoomSync API client — talks to the real backend via axios.
// Set VITE_API_BASE_URL in .env to point at your backend (defaults to localhost:8000).

import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

export type Role = "student" | "lecturer" | "admin";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  student_id?: string | null;
  created_at?: string;
}

export interface Room {
  id: string;
  name: string;
  room_type: "study_room" | "lab";
  capacity: number;
  location: string;
  amenities: string[];
  hourly_rate: number;
  is_available?: boolean;
  description?: string;
}

export interface Booking {
  id: string;
  room: string;
  room_name?: string;
  user?: string;
  user_name?: string;
  user_role?: Role;
  date: string;
  start_time: string;
  end_time: string;
  status: "confirmed" | "pending" | "cancelled";
  purpose: string;
  total_cost?: number;
  room_detail?: { name: string; room_type: string; capacity: number; location: string };
  user_detail?: { full_name: string; email: string; role: Role };
  created_at?: string;
}

export interface Notification {
  id: string;
  type: "confirmed" | "reminder" | "cancelled";
  message: string;
  created_at: string;
  read: boolean;
  is_read?: boolean;
  booking?: string;
}

// ---------- token store ----------
let accessToken: string | null = null;
let refreshToken: string | null = null;
let currentUser: User | null = null;
const listeners = new Set<() => void>();

const STORAGE_KEY = "roomsync_auth";

function persist() {
  try {
    if (typeof window === "undefined") return;
    if (accessToken && refreshToken) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ access: accessToken, refresh: refreshToken, user: currentUser }));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {}
}

function restore() {
  try {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    accessToken = data.access ?? null;
    refreshToken = data.refresh ?? null;
    currentUser = data.user ?? null;
  } catch {}
}
restore();

export const authStore = {
  get access() { return accessToken; },
  get refresh() { return refreshToken; },
  get user() { return currentUser; },
  set(tokens: { access: string; refresh: string } | null, user: User | null) {
    accessToken = tokens?.access ?? null;
    refreshToken = tokens?.refresh ?? null;
    currentUser = user;
    persist();
    listeners.forEach((l) => l());
  },
  subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; },
};

// ---------- axios instance ----------
const client: AxiosInstance = axios.create({ baseURL: BASE_URL });

client.interceptors.request.use((cfg: InternalAxiosRequestConfig) => {
  if (accessToken && !cfg.headers.Authorization) {
    cfg.headers.Authorization = `Bearer ${accessToken}`;
  }
  return cfg;
});

let refreshing: Promise<string> | null = null;

client.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;
    if (status === 401 && refreshToken && !original._retry && !original.url?.includes("/auth/token/refresh")) {
      original._retry = true;
      try {
        refreshing = refreshing ?? client.post<{ access: string }>("/auth/token/refresh/", { refresh: refreshToken }).then((r) => r.data.access);
        const newAccess = await refreshing;
        refreshing = null;
        accessToken = newAccess;
        persist();
        original.headers!.Authorization = `Bearer ${newAccess}`;
        return client(original);
      } catch {
        refreshing = null;
        authStore.set(null, null);
        throw new ApiError(401, "Your session expired. Please sign in again.");
      }
    }

    if (!error.response) {
      throw new ApiError(0, "Unable to connect to server. Please check your connection.");
    }

    const data: any = error.response.data;
    const fieldErrors: Record<string, string> = {};
    let message = "";

    if (data && typeof data === "object" && !Array.isArray(data)) {
      for (const [k, v] of Object.entries(data)) {
        if (k === "detail" || k === "error" || k === "message") continue;
        const msg = Array.isArray(v) ? String(v[0]) : typeof v === "string" ? v : "";
        if (msg) fieldErrors[k] = msg;
      }
      message = data.error || data.detail || data.message || Object.values(fieldErrors)[0] || "";
    } else if (typeof data === "string" && data) {
      message = data;
    }

    if (!message) {
      if (status === 400) message = "Some of the information provided is invalid.";
      else if (status === 401) message = "You need to sign in to do that.";
      else if (status === 403) message = "You don't have permission to do that.";
      else if (status === 404) message = "We couldn't find what you were looking for.";
      else if (status && status >= 500) message = "Something went wrong on our end. Please try again.";
      else message = "Something went wrong. Please try again.";
    }

    throw new ApiError(status ?? 0, message, data, fieldErrors);
  },
);

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: any,
    public fieldErrors: Record<string, string> = {},
  ) { super(message); }
}

// ---------- normalizers ----------
function normalizeRoom(r: any): Room {
  return {
    ...r,
    hourly_rate: typeof r.hourly_rate === "string" ? parseFloat(r.hourly_rate) : r.hourly_rate,
    amenities: r.amenities ?? [],
  };
}

function normalizeBooking(b: any): Booking {
  return {
    ...b,
    room_name: b.room_detail?.name ?? b.room_name,
    user_name: b.user_detail?.full_name ?? b.user_name,
    user_role: b.user_detail?.role ?? b.user_role,
  };
}

function normalizeNotification(n: any): Notification {
  return { ...n, read: n.is_read ?? n.read ?? false };
}

// ---------- API ----------
export const api = {
  // auth
  async login(email: string, password: string) {
    const { data } = await client.post<{ access: string; refresh: string }>("/auth/login/", { email, password });
    return data;
  },
  async register(payload: { email: string; full_name: string; role: Role; student_id?: string; password: string }) {
    const { data } = await client.post<{ user?: User; access: string; refresh: string }>("/auth/register/", payload);
    if (data.user) currentUser = data.user;
    return { access: data.access, refresh: data.refresh };
  },
  async me() {
    const { data } = await client.get<User>("/auth/me/");
    return data;
  },
  async logout() {
    if (!refreshToken) return { message: "ok" };
    try {
      const { data } = await client.post<{ message: string }>("/auth/logout/", { refresh: refreshToken });
      return data;
    } catch { return { message: "ok" }; }
  },
  async updateProfile(payload: Partial<Pick<User, "full_name" | "email">>) {
    const { data } = await client.put<User>("/auth/profile/update/", payload);
    return data;
  },
  async deleteProfile() {
    await client.delete("/auth/profile/delete/");
  },

  // rooms
  async rooms() {
    const { data } = await client.get<any[]>("/rooms/");
    return data.map(normalizeRoom);
  },
  async room(id: string) {
    const { data } = await client.get<any>(`/rooms/${id}/`);
    return normalizeRoom(data);
  },
  async availability(id: string, date: string) {
    // Backend returns time slots; map to the {slot, available} shape the UI uses.
    const { data } = await client.get<any[]>(`/rooms/${id}/availability/`, { params: { date } });
    return data.map((s) => ({
      slot: `${(s.start_time || "").slice(0, 5)}-${(s.end_time || "").slice(0, 5)}`,
      available: !s.is_blocked,
    }));
  },
  async createRoom(payload: Omit<Room, "id">) {
    const { data } = await client.post<any>("/rooms/create/", payload);
    return normalizeRoom(data);
  },
  async updateRoom(id: string, payload: Partial<Room>) {
    const { data } = await client.put<any>(`/rooms/${id}/update/`, payload);
    return normalizeRoom(data);
  },
  async deleteRoom(id: string) {
    await client.delete(`/rooms/${id}/delete/`);
    return { ok: true };
  },

  // bookings
  async myBookings() {
    const { data } = await client.get<any[]>("/bookings/");
    return data.map(normalizeBooking);
  },
  async createBooking(payload: { room: string; date: string; start_time: string; end_time: string; purpose: string }) {
    const { data } = await client.post<any>("/bookings/create/", payload);
    return normalizeBooking(data);
  },
  async cancelBooking(id: string) {
    const { data } = await client.post<any>(`/bookings/${id}/cancel/`, {});
    return normalizeBooking(data.booking ?? data);
  },
  async allBookings(params: { status?: string; room?: string; date?: string } = {}) {
    const { data } = await client.get<any[]>("/bookings/admin/all/", { params });
    return data.map(normalizeBooking);
  },

  // notifications
  async notifications() {
    const { data } = await client.get<any[]>("/notifications/");
    return data.map(normalizeNotification);
  },
  async markRead(id: string) {
    const { data } = await client.put<any>(`/notifications/${id}/read/`, {});
    return normalizeNotification(data);
  },

  // analytics
  async analytics() {
    const { data } = await client.get<any>("/analytics/dashboard/");
    // Map backend keys to the shape the admin page already uses.
    return {
      ...data,
      bookings_week: data.bookings_this_week ?? data.bookings_week,
      bookings_month: data.bookings_this_month ?? data.bookings_month,
      utilization: (data.bookings_per_room ?? []).map((x: any) => ({ name: x.room__name, bookings: x.count })),
      peak_hours: (data.peak_hours ?? []).map((x: any) => ({ hour: (x.start_time || "").slice(0, 5), bookings: x.count })),
      recent_bookings: data.recent_bookings ?? [],
    };
  },
};
