import type { ActorRef, EntityRef, ISODate, MediaRef, Money, Phone } from "../common";

/* 4.15 Conversation / Message */
export type ConversationChannel = "whatsapp" | "webchat" | "voice" | "instagram" | "messenger" | "x" | "tiktok" | "email";

/** Social messaging channels the merchant connects on `/agents/channels`. */
export type SocialChannelKind = "instagram" | "messenger" | "x" | "tiktok" | "email";
export type ConversationStatus = "open_ai" | "waiting_human" | "open_human" | "resolved" | "closed";
export type MessageType =
  | "text"
  | "image"
  | "audio"
  | "document"
  | "product_card"
  | "payment_link"
  | "order_card"
  | "template"
  | "system"
  | "internal_note";

export interface Message {
  id: string;
  from: ActorRef;
  type: MessageType;
  content: string;
  attachments: MediaRef[];
  toolCalls: { tool: string; input: string; output: string }[];
  deliveryStatus: "sent" | "delivered" | "read" | "failed" | null;
  ref: EntityRef | null;
  at: ISODate;
}

export interface Conversation {
  id: string;
  channel: ConversationChannel;
  customerId: string | null;
  contact: { phone: Phone; name: string | null };
  status: ConversationStatus;
  currentAgentId: string | null;
  agentPath: string[];
  assigneeId: string | null;
  priority: "low" | "normal" | "high" | "urgent";
  tags: string[];
  sentiment: "positive" | "neutral" | "negative";
  aiSummary: string;
  relatedOrderIds: string[];
  waitingSince: ISODate | null;
  rating: number | null;
  messages: Message[];
  updatedAt: ISODate;
}

/* 4.16 AgentApproval */
export interface AgentApproval {
  id: string;
  agentId: string;
  conversationId: string;
  action: "cancel_order" | "refund" | "discount_above_limit";
  target: EntityRef;
  amount: Money | null;
  reason: string;
  status: "pending" | "approved" | "rejected" | "expired";
  decidedBy: string | null;
  decidedAt: ISODate | null;
  expiresAt: ISODate;
  createdAt: ISODate;
}

/* 4.18 KnowledgeSource */
export interface KnowledgeSource {
  id: string;
  type: "file" | "faq" | "url" | "policy" | "product_catalog" | "text";
  title: string;
  file: { name: string; sizeBytes: number } | null;
  url: string | null;
  faq: { q: string; a: string }[];
  status: "processing" | "ready" | "failed";
  chunksCount: number;
  usedByAgentIds: string[];
  lastSyncedAt: ISODate | null;
  autoSync: boolean;
}
