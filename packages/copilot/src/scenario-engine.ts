import type { ChatMessage, CopilotContext, CopilotResponse, Scenario } from "./types";
import { normalizeArabic } from "./engine-helpers";
import { blockedBySettings, requiresConfirm } from "./guards";
import { actionCalls, executeAction } from "./executor";
import { getTool } from "./tool-registry";
import { MERCHANT_READ_SCENARIOS } from "./scenarios-read";
import { MERCHANT_ACTION_SCENARIOS } from "./scenarios-actions";
import { MERCHANT_PLAN_SCENARIOS } from "./scenarios-plans";
import { MERCHANT_TASK_SCENARIOS } from "./scenarios-tasks";
import { PLATFORM_SCENARIOS } from "./scenarios-platform";

export { executeAction, executeStep, registerAction, runToolCall, undoLastAction } from "./executor";
export { PLATFORM_SCENARIOS } from "./scenarios-platform";

/** Ordered merchant intents — first match wins, so specific patterns precede generic ones. */
export const MERCHANT_SCENARIOS: Scenario[] = [
  ...MERCHANT_ACTION_SCENARIOS,
  ...MERCHANT_TASK_SCENARIOS,
  ...MERCHANT_PLAN_SCENARIOS,
  ...MERCHANT_READ_SCENARIOS,
];

/* ------------------------------------------------------------ guard rails
 * Intents the copilot refuses outright — answered with a clarify card
 * instead of executing (matches BLOCKED_TOOLS at the intent level). */

const BLOCKED_INTENTS: { test: RegExp; question: string; options: { id: string; label: string }[] }[] = [
  {
    test: /(ويب ?هوك|webhook|خطاف)/,
    question: "إنشاء Webhook يحتاج تأكيداً صريحاً من صفحة المطورين — ما أقدر أنشئه من هنا حمايةً لبياناتك.",
    options: [
      { id: "open-developers", label: "افتح إعدادات المطورين" },
      { id: "cancel", label: "إلغاء" },
    ],
  },
  {
    test: /(ايميل|إيميل|بريد الكتروني|بريد إلكتروني|email|ارسل بريد)/,
    question: "ما أرسل رسائل بريد حرة — القنوات المتاحة واتساب فقط عبر حملات التسويق المعتمدة.",
    options: [
      { id: "whatsapp-campaign", label: "حملة واتساب بدلها" },
      { id: "cancel", label: "إلغاء" },
    ],
  },
  {
    test: /(رابط خارجي|external link|موقع خارجي|افتح .*\.(com|net|sa)\b)/,
    question: "ما أقدر أفتح أو أنشئ روابط خارجية — التنقل يقتصر على شاشات اللوحة.",
    options: [{ id: "cancel", label: "حسناً" }],
  },
];

const clarify = (question: string, options: { id: string; label: string }[]): CopilotResponse => ({
  kind: "clarify", question, options,
});

const FALLBACK_OPTIONS = {
  merchant: [
    { id: "top5", label: "أفضل 5 منتجات مبيعاً" },
    { id: "sales-drop", label: "حلّل انخفاض المبيعات" },
    { id: "ramadan", label: "جهّز المتجر لرمضان" },
  ],
  platform: [
    { id: "new-stores", label: "كم متجر انضم هذا الشهر؟" },
    { id: "abnormal-usage", label: "استهلاك AI الشاذ" },
    { id: "monthly-report", label: "ملخص المنصة الشهري" },
  ],
} as const;

/* ------------------------------------------------- store settings gate
 * After a scenario emits an action card, consult the store's copilot
 * settings (settings → copilot): store-blocked tools turn the card into a
 * clarify refusal, and calls whose kind no longer requires confirmation
 * auto-execute instead of showing a card. */

const settingsGate = async (response: CopilotResponse, ctx: CopilotContext): Promise<CopilotResponse> => {
  if (response.kind !== "action") return response;
  const calls = actionCalls(response.actionId) ?? [];
  if (calls.some((c) => blockedBySettings(c.toolName, ctx))) {
    return clarify("هذا الإجراء ممنوع من إعدادات المتجر — عدّل الأدوات المسموحة من «إعدادات المساعد».", [
      { id: "open-copilot-settings", label: "إعدادات المساعد" },
      { id: "cancel", label: "إلغاء" },
    ]);
  }
  if (calls.length && !calls.some((c) => requiresConfirm(getTool(c.toolName), c.args, ctx))) {
    return executeAction(response.actionId, ctx);
  }
  return response;
};

/**
 * Mock "brain": normalize → blocked-intent gate → first matching scenario →
 * store-settings gate. Unknown input returns a clarify card with sensible
 * next options.
 */
export async function runCopilot(input: string, ctx: CopilotContext, history: ChatMessage[] = []): Promise<CopilotResponse> {
  const norm = normalizeArabic(input);
  if (!norm) return clarify("اكتب طلبك وأبشر بالباقي.", [...FALLBACK_OPTIONS[ctx.actor]]);
  for (const blocked of BLOCKED_INTENTS) {
    if (blocked.test.test(norm)) return clarify(blocked.question, blocked.options);
  }
  const scenarios = ctx.actor === "platform" ? PLATFORM_SCENARIOS : MERCHANT_SCENARIOS;
  for (const scenario of scenarios) {
    if (scenario.test.test(norm)) return settingsGate(await scenario.run(input, ctx, history), ctx);
  }
  return clarify("ما فهمت الطلب — جرّب أحد هذي أو وضّح لي أكثر:", [...FALLBACK_OPTIONS[ctx.actor]]);
}
