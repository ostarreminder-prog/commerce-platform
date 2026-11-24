import type { ActorRef, Email, ISODate, Money, Phone } from "../common";

/* 4.6 Customer */
export type CustomerSource = "storefront" | "whatsapp" | "voice" | "manual" | "import" | "app";
export type CustomerSegment = "new" | "returning" | "vip" | "at_risk";

export interface Customer {
  id: string;
  name: string | null;
  phone: Phone;
  email: Email | null;
  gender: "male" | "female" | "unspecified";
  birthDate: string | null;
  addresses: Address[];
  tags: string[];
  notes: string;
  /** Staff notes appended over time (§5.13) — optional: legacy seeds only set `notes`. */
  staffNotes?: { id: string; text: string; actor: ActorRef; at: ISODate }[];
  marketingConsent: { whatsapp: boolean; sms: boolean; email: boolean; updatedAt: ISODate };
  source: CustomerSource;
  createdAt: ISODate;
  stats: {
    ordersCount: number;
    totalSpent: Money;
    avgOrder: Money;
    lastOrderAt: ISODate | null;
    firstOrderAt: ISODate | null;
    returnsCount: number;
  };
  segment: CustomerSegment;
}

/* 4.7 Address */
export const SAUDI_CITIES = [
  "الرياض", "جدة", "مكة المكرمة", "المدينة المنورة", "الدمام", "الخبر", "الظهران", "الأحساء", "الطائف", "تبوك",
  "بريدة", "عنيزة", "حائل", "أبها", "خميس مشيط", "جازان", "نجران", "الباحة", "ينبع", "الجبيل", "القطيف", "سكاكا", "عرعر",
] as const;
export type SaudiCity = (typeof SAUDI_CITIES)[number];

export interface Address {
  id: string;
  label: string | null;
  recipientName: string;
  phone: Phone;
  city: SaudiCity;
  district: string;
  street: string | null;
  buildingNumber: string | null;
  additionalNumber: string | null;
  postalCode: string | null;
  shortAddress: string | null;
  location: { lat: number; lng: number } | null;
  notes: string | null;
  isDefault: boolean;
}
