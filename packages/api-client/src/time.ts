import type { OrderChannel } from "@repo/contracts";
import { NOW } from "@repo/mocks";

export { NOW };

export const ORDER_CHANNELS: OrderChannel[] = ["storefront", "whatsapp", "voice", "manual", "app"];
export const PERIODS = ["all", "today", "7d", "30d", "90d"] as const;
export type Period = (typeof PERIODS)[number];

const DAY = 86_400_000;
/** Mock "today" is anchored to the dataset clock so filters stay meaningful. */
export function inPeriod(at: string, period: string) {
  if (period === "all") return true;
  const t = new Date(at).getTime();
  const startOfToday = NOW - (NOW % DAY) - 3 * 3_600_000;
  const from = period === "today" ? startOfToday : NOW - Number(period.replace("d", "")) * DAY;
  return t >= from;
}
