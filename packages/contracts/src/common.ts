/** Amounts are integer halalas (1 SAR = 100 halalas). */
export type Halalas = number;
/** ISO-8601 UTC timestamp. */
export type ISODate = string;
/** E.164, e.g. +966512345678. */
export type Phone = string;
export type Email = string;
export type Slug = string;

export interface Money {
  amount: Halalas;
  currency: "SAR";
}

export interface LocalizedText {
  ar: string;
  en?: string;
}

export interface MediaRef {
  id: string;
  url: string;
  alt: LocalizedText;
  width: number;
  height: number;
}

export type ActorType = "staff" | "agent" | "app" | "system" | "customer";

export interface ActorRef {
  type: ActorType;
  id: string;
  name: string;
}

export type EntityType =
  | "order"
  | "customer"
  | "product"
  | "brand"
  | "category"
  | "collection"
  | "conversation"
  | "agent"
  | "shipment"
  | "invoice"
  | "return"
  | "coupon"
  | "abandonedCart"
  | "staff"
  | "role"
  | "app"
  | "installation"
  | "knowledge"
  | "approval"
  | "import"
  | "page"
  | "variant";

export interface EntityRef {
  type: EntityType;
  id: string;
  label?: string;
}

export interface Seo {
  title: string;
  description: string;
  imageId?: string | null;
}
