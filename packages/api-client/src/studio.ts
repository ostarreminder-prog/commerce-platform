import type {
  Agent,
  AgentChannel,
  AgentStatus,
  KnowledgeSource,
  PhoneNumber,
  WhatsAppNumber,
} from "@repo/contracts";
import * as mocks from "@repo/mocks";
import { commerceDb, db, fail, findAgent, respond, uid } from "./studio-state";
import { simulate } from "./studio-sim";

/** Mock Agent Studio transport; same contract the real API will expose. */

const descendants = (id: string): string[] =>
  db.agents.filter((a) => a.parentId === id).flatMap((c) => [c.id, ...descendants(c.id)]);

function blankAgent(parentId: string | null, name: string): Agent {
  const parent = parentId ? findAgent(parentId) : null;
  return {
    id: uid("agt"),
    parentId,
    name,
    avatar: { icon: "bot", hue: Math.floor(Math.random() * 360) },
    role: parentId ? "specialist" : "orchestrator",
    description: "",
    channels: parent ? [...parent.channels] : ["whatsapp"],
    persona: parent
      ? structuredClone(parent.persona)
      : { tone: "friendly", dialect: "najdi", greeting: "هلا والله! كيف أقدر أخدمك؟", language: "auto" },
    instructions: "",
    inheritFromParent: parentId
      ? { persona: true, knowledge: true, tools: true, workingHours: true }
      : { persona: false, knowledge: false, tools: false, workingHours: false },
    tools: mocks.AGENT_TOOL_IDS.map((toolId) => ({ toolId, enabled: toolId === "transfer", requiresApproval: false })),
    knowledgeSourceIds: [],
    handoffRules: parentId ? [{ id: uid("hr"), targetType: "parent", condition: "السؤال خارج تخصص هذا الوكيل", priority: 1 }] : [],
    workingHours: parent ? structuredClone(parent.workingHours) : structuredClone(mocks.agentTree[0]?.workingHours ?? []),
    afterHoursBehavior: "message",
    status: "draft",
    version: 0,
    updatedAt: new Date().toISOString(),
    stats: { conversations: 0, resolutionRate: 0, handoffRate: 0, avgDurationSec: 0, cost: 0 },
  };
}
/* ------------------------------------------------------------ endpoints */

export interface NewKnowledge {
  type: "file" | "faq" | "url";
  title: string;
  detail: string;
}

export const studio = {
  summary: () => respond(mocks.studioSummary),
  list: () => respond(db.agents),
  get: (id: string) => respond(findAgent(id)),
  save: (agent: Agent) => {
    const index = db.agents.findIndex((a) => a.id === agent.id);
    const next = { ...agent, updatedAt: new Date().toISOString() };
    if (index >= 0) db.agents[index] = next;
    return respond(next);
  },
  create: (parentId: string | null, name: string) => {
    const agent = blankAgent(parentId, name);
    db.agents.push(agent);
    return respond(agent);
  },
  move: (id: string, parentId: string | null) => {
    if (parentId === id || (parentId && descendants(id).includes(parentId))) fail("cycle");
    const agent = findAgent(id);
    agent.parentId = parentId;
    agent.role = parentId ? "specialist" : "orchestrator";
    return respond(agent);
  },
  duplicateBranch: (id: string) => {
    const ids = [id, ...descendants(id)];
    const map = new Map(ids.map((x) => [x, uid("agt")]));
    const copies = ids.map((x) => {
      const src = findAgent(x);
      const copy: Agent = {
        ...structuredClone(src),
        id: map.get(x) as string,
        parentId: x === id ? src.parentId : (map.get(src.parentId as string) ?? null),
        name: x === id ? `${src.name} (نسخة)` : src.name,
        status: "draft",
        version: 0,
        stats: { conversations: 0, resolutionRate: 0, handoffRate: 0, avgDurationSec: 0, cost: 0 },
        handoffRules: src.handoffRules.map((r) => ({ ...r, id: uid("hr"), ...(r.targetId ? { targetId: map.get(r.targetId) ?? r.targetId } : {}) })),
      };
      return copy;
    });
    db.agents.push(...copies);
    return respond(copies[0] as Agent);
  },
  setStatus: (id: string, status: AgentStatus, branch: boolean) => {
    for (const x of branch ? [id, ...descendants(id)] : [id]) findAgent(x).status = status;
    return respond(true);
  },
  remove: (id: string, mode: "reparent" | "cascade") => {
    const agent = findAgent(id);
    const doomed = mode === "cascade" ? [id, ...descendants(id)] : [id];
    if (mode === "reparent") for (const c of db.agents.filter((a) => a.parentId === id)) c.parentId = agent.parentId;
    db.agents = db.agents.filter((a) => !doomed.includes(a.id));
    return respond(true);
  },
  publish: (id: string, note: string) => {
    const agent = findAgent(id);
    agent.version += 1;
    agent.status = "live";
    db.versions.unshift({
      id: `${id}_v${agent.version}`,
      agentId: id,
      version: agent.version,
      publishedAt: new Date().toISOString(),
      author: "خالد العتيبي",
      note,
      changes: [{ field: "instructions", before: "…", after: agent.instructions }],
    });
    return respond(agent);
  },
  versions: (id: string) => respond(db.versions.filter((v) => v.agentId === id).sort((a, b) => b.version - a.version)),
  restoreVersion: (id: string, version: number) => studio.publish(id, `رجوع إلى الإصدار ${version}`),
  knowledge: () => respond(commerceDb.knowledge),
  addKnowledge: (agentId: string, source: NewKnowledge) => {
    const created: KnowledgeSource = {
      id: uid("kn"),
      type: source.type,
      title: source.title,
      file: source.type === "file" ? { name: source.title, sizeBytes: 250_000 } : null,
      url: source.type === "url" ? source.detail : null,
      faq: [],
      status: "processing",
      chunksCount: 0,
      usedByAgentIds: [agentId],
      lastSyncedAt: new Date().toISOString(),
      autoSync: source.type === "url",
    };
    commerceDb.knowledge.push(created);
    findAgent(agentId).knowledgeSourceIds.push(created.id);
    return respond(created);
  },
  voices: () => respond(mocks.agentVoices),
  performance: (id: string, channel: AgentChannel | "all", days: number) => respond(mocks.agentPerformance(id, channel, days)),

  simulate: (text: string) => respond(simulate(text), 900),
  tests: () => respond(db.tests),
  runTest: (id: string) => {
    const test = db.tests.find((x) => x.id === id) ?? fail(`Test ${id} not found`);
    const turn = simulate(test.question);
    test.lastResult = turn.path.at(-1) === test.expectedAgentId ? "pass" : "fail";
    test.lastAnswer = turn.reply;
    return respond({ test, turn }, 700);
  },
  addTest: (test: Omit<(typeof db.tests)[number], "id" | "lastResult">) => {
    const created = { ...test, id: uid("tc"), lastResult: null };
    db.tests.push(created);
    return respond(created);
  },

  live: () => respond(db.live, 200),
  takeOver: (id: string) => {
    const s = db.live.find((x) => x.id === id) ?? fail(`Session ${id} not found`);
    s.takenOver = true;
    s.state = "speaking";
    return respond(s);
  },
  history: () => respond(db.history),
  session: (id: string) => respond(db.history.find((x) => x.id === id) ?? fail(`Session ${id} not found`)),

  phones: () => respond(db.phones),
  whatsappNumbers: () => respond(db.whatsapp),
  addPhone: (phone: Omit<PhoneNumber, "id" | "status" | "callsToday">) => {
    const created: PhoneNumber = { ...phone, id: uid("ph"), status: "pending", callsToday: 0 };
    db.phones.push(created);
    return respond(created);
  },
  addWhatsApp: (number: Pick<WhatsAppNumber, "number" | "displayName" | "agentId">) => {
    const created: WhatsAppNumber = { ...number, id: uid("wa"), status: "pending", quality: "high", dailyLimit: 250, templates: [] };
    db.whatsapp.push(created);
    return respond(created);
  },
  linkNumber: (kind: "phone" | "whatsapp", id: string, agentId: string | null) => {
    const list = kind === "phone" ? db.phones : db.whatsapp;
    const n = list.find((x) => x.id === id) ?? fail(`Number ${id} not found`);
    n.agentId = agentId;
    return respond(true);
  },
};

/** Agent Studio mock surface — the copilot creates/updates sub-agents through this. */
export type StudioApi = typeof studio;
