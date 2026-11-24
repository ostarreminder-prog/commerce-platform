import type { CopilotResponse, Scenario } from "./types";
import { registerAction } from "./executor";

/* Scheduled-task + alert scenarios — produce action cards that create
 * CopilotTask records via the copilotTasks.create tool (§4.23). The tasks
 * screen (/copilot/tasks) lists and manages them. */

/** «9 الصبح» / «21:30» / «9:15 pm» → {hour, minute}. */
const parseTime = (input: string): { hour: number; minute: number } => {
  const m = input.match(/(\d{1,2})(?::(\d{2}))?\s*(الصبح|صباحاً|صباحا|العصر|المساء|مساءً|مساء|بالليل|am|pm)?/i);
  let hour = m ? Math.min(23, Math.max(0, Number(m[1]))) : 9;
  const minute = m?.[2] ? Math.min(59, Number(m[2])) : 0;
  const period = m?.[3];
  if (period && /العصر|المساء|مساء|بالليل|pm/i.test(period) && hour < 12) hour += 12;
  return { hour, minute };
};

const hhmm = ({ hour, minute }: { hour: number; minute: number }) => `${hour}:${String(minute).padStart(2, "0")}`;

const dailySummary: Scenario = {
  id: "schedule-daily-summary",
  test: /(كل يوم|يوميا|يومي|كل اسبوع|بشكل دوري).*|جدول.*(ملخص|تقرير|مهم)/,
  run: async (input): Promise<CopilotResponse> => {
    const time = parseTime(input);
    const title = "ملخص المبيعات اليومي";
    const actionId = registerAction({
      calls: [
        {
          toolName: "copilotTasks.create",
          args: { input: { kind: "scheduled", title, prompt: input.trim(), schedule: time, enabled: true } },
        },
      ],
      summary: `جدولت «${title}» — بتوصلك النتيجة كل يوم ${hhmm(time)}.`,
      undoable: true,
      links: [{ label: "مهام المساعد", href: "/copilot/tasks" }],
    });
    return {
      kind: "action",
      actionId,
      title: `جدولة مهمة يومية — ${hhmm(time)}`,
      description: `بينفّذ الطلب تلقائياً كل يوم ${hhmm(time)} وتوصلك النتيجة هنا — تقدر توقفها أو تعدلها من شاشة مهام المساعد.`,
      affected: { count: 1, items: [`${title} · يومياً ${hhmm(time)}`] },
      dangerLevel: "normal",
    };
  },
};

const stockAlert: Scenario = {
  id: "low-stock-alert",
  test: /(نبهني|ذكرني|تنبيه|حذرني|راقب).*(مخزون|ستوك|كميه|عطر|منتج)|مخزون.*(تحت|اقل|دون|ينزل|يقل)/,
  run: async (input): Promise<CopilotResponse> => {
    const threshold = Number(input.match(/(?:تحت|أقل من|اقل من|دون|below|نزل.*ل)\s*(\d+)/i)?.[1] ?? 5);
    const title = "تنبيه انخفاض مخزون العطور";
    const actionId = registerAction({
      calls: [
        {
          toolName: "copilotTasks.create",
          args: { input: { kind: "alert", title, prompt: input.trim(), schedule: { hour: 9 }, threshold, enabled: true } },
        },
      ],
      summary: `فعّلت تنبيه «${title}» — بنبهك أول ما يوصل مخزون أي عطر لـ ${threshold} أو أقل.`,
      undoable: true,
      links: [{ label: "مهام المساعد", href: "/copilot/tasks" }],
    });
    return {
      kind: "action",
      actionId,
      title: `تنبيه مخزون — أقل من ${threshold}`,
      description: `بيراقب مخزون العطور وينبهك فور وصول أي متغير لـ ${threshold} أو أقل — يشتغل يومياً ${"09:00"}.`,
      affected: { count: 1, items: [`${title} · الحد ${threshold}`] },
      dangerLevel: "normal",
    };
  },
};

export const MERCHANT_TASK_SCENARIOS: Scenario[] = [dailySummary, stockAlert];
