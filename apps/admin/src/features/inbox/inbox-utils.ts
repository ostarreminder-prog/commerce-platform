import type { ElementType } from "react";
import { Facebook, Inbox as InboxIcon, Instagram, Mail, Mic, Music2, Phone, Twitter } from "lucide-react";
import type { Conversation, ConversationChannel, ConversationStatus } from "@repo/contracts";

export const CHANNELS: ConversationChannel[] = ["whatsapp", "webchat", "voice", "instagram", "messenger", "x", "tiktok", "email"];
export const STATUSES: ConversationStatus[] = ["open_ai", "waiting_human", "open_human", "resolved", "closed"];
export const PRIORITIES: Conversation["priority"][] = ["low", "normal", "high", "urgent"];
export const CHANNEL_ICON: Record<ConversationChannel, ElementType> = {
  whatsapp: Phone, webchat: InboxIcon, voice: Mic, instagram: Instagram, messenger: Facebook, x: Twitter, tiktok: Music2, email: Mail,
};

export const fmtTime = (v: string, locale: string) =>
  new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-nu-latn" : "en-US", { hour: "2-digit", minute: "2-digit" }).format(new Date(v));

export function displayName(c: Conversation) {
  return c.contact.name ?? c.contact.phone;
}
