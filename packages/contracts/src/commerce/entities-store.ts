import type { ISODate, LocalizedText, MediaRef, Email, Phone, Slug } from "../common";
import type { Permission } from "../permissions";
import type { Address } from "./entities-customer";

/* 4.1 Store */
export type Industry = "perfumes" | "fashion" | "electronics" | "beauty" | "food" | "gifts" | "home" | "other";
export type StoreStatus = "draft" | "live" | "paused" | "suspended";

export interface Store {
  id: string;
  name: LocalizedText;
  slug: Slug;
  logo: MediaRef | null;
  favicon: MediaRef | null;
  industry: Industry;
  contactPhone: Phone;
  contactEmail: Email;
  whatsappNumber: Phone | null;
  socialLinks: { instagram?: string; x?: string; tiktok?: string; snapchat?: string };
  defaultLanguage: "ar" | "en";
  languages: ("ar" | "en")[];
  currency: "SAR";
  timezone: string;
  commercialRegistration: string | null;
  vatNumber: string | null;
  legalName: string | null;
  nationalAddress: Address | null;
  status: StoreStatus;
  plan: string;
}

/* 4.2 Staff / Role */
export type StaffStatus = "invited" | "active" | "suspended";

export interface Staff {
  id: string;
  name: string;
  email: Email;
  phone: Phone | null;
  roleId: string;
  status: StaffStatus;
  mfaEnabled: boolean;
  lastLoginAt: ISODate | null;
  /** Profile fields — editable from `/settings/profile` (avatar + UI language). */
  avatar?: MediaRef | null;
  preferredLanguage?: "ar" | "en" | null;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isSystem: boolean;
}

/** Resolved current session — staff member + role + effective permission set (`commerce.me()`). */
export interface CurrentUser {
  staff: Staff;
  role: Role;
  permissions: Permission[];
}
