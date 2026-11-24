import type { Halalas, ISODate } from "./common";

export type AgentTone = "friendly" | "formal" | "concise";

/* ---------------------------------------------------------------- Agent Studio */

export type AgentChannel = "whatsapp" | "voice" | "webchat";
export type AgentRole = "orchestrator" | "specialist";
export type AgentStatus = "draft" | "live" | "paused";
export type AgentDialect = "najdi" | "hijazi" | "gulf" | "msa";
export type AgentIcon = "bot" | "sparkles" | "bag" | "user" | "users" | "building" | "landmark" | "headset" | "truck" | "undo" | "alert" | "wrench";
export type AgentToolId =
  | "productSearch"
  | "availability"
  | "orderStatus"
  | "paymentLink"
  | "shippingQuote"
  | "cancelOrder"
  | "refund"
  | "discount"
  | "createTicket"
  | "transfer";
export type InheritableSection = "persona" | "knowledge" | "tools" | "workingHours";
export type AfterHoursBehavior = "reply" | "message" | "voicemail" | "human";
export type HandoffTarget = "child" | "parent" | "human";

export interface AgentPersona {
  tone: AgentTone;
  dialect: AgentDialect;
  greeting: string;
  language: "ar" | "en" | "auto";
}

export interface AgentToolConfig {
  toolId: AgentToolId;
  enabled: boolean;
  requiresApproval: boolean;
  limit?: number;
}

export interface HandoffRule {
  id: string;
  targetType: HandoffTarget;
  targetId?: string;
  condition: string;
  priority: number;
}

export interface VoiceSettings {
  voiceId: string;
  speed: number;
  pitch: number;
  interruptible: boolean;
  silenceTimeoutSec: number;
  maxCallMinutes: number;
  recordCalls: boolean;
}

export interface WhatsAppSettings {
  phoneNumberId: string | null;
  templates: string[];
  replyDelaySec: number;
  sendTypingIndicator: boolean;
}

/** day: 0 = Sunday … 6 = Saturday; times are "HH:mm" store-local. */
export interface WorkingDay {
  day: number;
  enabled: boolean;
  from: string;
  to: string;
}

export interface AgentStats {
  conversations: number;
  resolutionRate: number;
  handoffRate: number;
  avgDurationSec: number;
  cost: Halalas;
}

export interface Agent {
  id: string;
  parentId: string | null;
  name: string;
  avatar: { icon: AgentIcon; hue: number };
  role: AgentRole;
  /** When the parent should hand off to this agent. */
  description: string;
  channels: AgentChannel[];
  persona: AgentPersona;
  instructions: string;
  inheritFromParent: Record<InheritableSection, boolean>;
  tools: AgentToolConfig[];
  knowledgeSourceIds: string[];
  handoffRules: HandoffRule[];
  voice?: VoiceSettings;
  whatsapp?: WhatsAppSettings;
  workingHours: WorkingDay[];
  afterHoursBehavior: AfterHoursBehavior;
  status: AgentStatus;
  version: number;
  updatedAt: ISODate;
  stats: AgentStats;
}

export interface AgentVersion {
  id: string;
  agentId: string;
  version: number;
  publishedAt: ISODate;
  author: string;
  note: string;
  changes: { field: string; before: string; after: string }[];
}

export interface AgentPerformancePoint {
  date: ISODate;
  conversations: number;
  resolutionRate: number;
  handoffRate: number;
  avgDurationSec: number;
  cost: Halalas;
}

export interface StudioSummary {
  conversationsToday: number;
  conversationsDelta: number;
  callsToday: number;
  callsDelta: number;
  resolutionRate: number;
  resolutionDelta: number;
  humanHandoffRate: number;
  handoffDelta: number;
  costToday: Halalas;
  costDelta: number;
}

export interface TraceStep {
  id: string;
  kind: "received" | "handoff" | "tool" | "reply";
  agentId: string;
  targetId?: string;
  toolId?: AgentToolId;
  reason?: string;
  result?: string;
  /** Milliseconds since the customer message. */
  atMs: number;
  cost: Halalas;
}

export interface SimulatedTurn {
  reply: string;
  path: string[];
  steps: TraceStep[];
}

export interface AgentTestCase {
  id: string;
  question: string;
  expected: string;
  expectedAgentId: string;
  channel: AgentChannel;
  lastResult: "pass" | "fail" | null;
  lastAnswer?: string;
}

export interface TranscriptLine {
  id: string;
  speaker: "customer" | "agent" | "staff";
  agentId?: string;
  text: string;
  atSec: number;
}

export type LiveState = "speaking" | "waiting" | "transferring";

export interface AgentSession {
  id: string;
  channel: AgentChannel;
  customerName: string;
  customerPhone: string;
  agentPath: string[];
  startedAt: ISODate;
  durationSec: number;
  transcript: TranscriptLine[];
}

export interface LiveSession extends AgentSession {
  state: LiveState;
  /** -1 (upset) … 1 (happy). */
  sentiment: number;
  stuck: boolean;
  takenOver: boolean;
  /** Scripted lines still to arrive while the session is watched. */
  upcoming: TranscriptLine[];
}

export interface SessionRecord extends AgentSession {
  outcome: "resolved" | "handedOff" | "dropped";
  cost: Halalas;
  rating: number | null;
  summary: string;
  actions: { toolId: AgentToolId; label: string; result: string }[];
  ticketId: string | null;
}

export interface PhoneNumber {
  id: string;
  number: string;
  provider: string;
  agentId: string | null;
  status: "active" | "pending" | "disconnected";
  callsToday: number;
}

export interface WhatsAppNumber {
  id: string;
  number: string;
  displayName: string;
  status: "connected" | "pending" | "disconnected";
  quality: "high" | "medium" | "low";
  agentId: string | null;
  dailyLimit: number;
  templates: string[];
}

