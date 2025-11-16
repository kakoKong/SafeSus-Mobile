// GeoJSON Types
export interface GeoJSONPoint {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
}

export interface GeoJSONPolygon {
  type: "Polygon";
  coordinates: [[number, number][]]; // Array of coordinate rings
}

// API Data Models
export interface City {
  id: number;
  name: string;
  slug: string;
  country: string;
  supported: boolean;
}

export type ZoneLevel = "recommended" | "neutral" | "caution" | "avoid";

export interface Zone {
  id: number;
  city_id: number;
  label: string;
  level: ZoneLevel;
  reason_short: string;
  reason_long: string | null;
  geom: GeoJSONPolygon;
  verified_by: string | null;
  created_at: string;
}

export type PinType = "scam" | "harassment" | "overcharge" | "other";
export type PinStatus = "approved" | "pending" | "rejected";
export type PinSource = "curated" | "user";

export interface Pin {
  id: number;
  city_id: number;
  type: PinType;
  title: string;
  summary: string;
  details: string | null;
  location: GeoJSONPoint;
  status: PinStatus;
  source: PinSource;
  created_at: string;
  distance?: number; // For nearby pins
}

export type TipCategory =
  | "transportation"
  | "shopping"
  | "dining"
  | "accommodation"
  | "general_safety"
  | "attractions"
  | "cultural"
  | "communication"
  | "money";

export type TipStatus = "pending" | "approved" | "rejected";

export interface Tip {
  id: number;
  user_id: string | null;
  city_id: number | null;
  category: TipCategory;
  title: string;
  summary: string;
  details: string | null;
  location: GeoJSONPoint | null;
  status: TipStatus;
  created_at: string;
  tip_category?: TipCategory; // For search results
  city_name?: string; // For search results
  city_slug?: string; // For search results
}

export interface CityDetail {
  id: number;
  name: string;
  slug: string;
  country: string;
  supported: boolean;
  zones: Zone[];
  pins: Pin[];
  tips: Tip[];
  reports: any[];
  incidents: any[];
  rules: any[];
}

// API Response Types
export interface CitiesResponse {
  cities: City[];
}

export interface CityDetailResponse {
  city: CityDetail;
}

export interface NearbyResponse {
  zones: Zone[];
  nearbyPins: Pin[];
}

export interface NearbyUnifiedResponse {
  pins: Pin[];
  tips: Tip[];
  center?: { lat: number; lng: number };
  radius?: number;
  count?: { pins?: number; tips?: number };
}

export interface RecentTipsResponse {
  tips: Tip[];
}

export interface SearchTipsResponse {
  results: Tip[];
}

export interface SubmitTipRequest {
  city_id: number;
  category: TipCategory;
  title: string;
  summary: string;
  details?: string;
  location?: GeoJSONPoint;
  occurred_at?: string;
}

export interface SubmitTipResponse {
  success: boolean;
  submission: {
    id: number;
    status: string;
    created_at: string;
  };
}

export interface SubmitPinRequest {
  type: PinType;
  title: string;
  summary: string;
  details?: string;
  location: GeoJSONPoint;
  guest_name?: string;
}

export interface SubmitPinResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    status: string;
  };
}

export interface Notification {
  id: number;
  user_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  link: string;
  created_at: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

export interface WaitlistCountResponse {
  count: number;
}

