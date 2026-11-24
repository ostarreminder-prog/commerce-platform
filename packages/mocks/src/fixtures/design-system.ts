/**
 * Sample data for the /design-system showcase only.
 * Real entity mocks (MSW + faker) live alongside in later phases.
 */
export type SampleOrderStatus = "paid" | "pending" | "refunded" | "failed";

export interface SampleOrder {
  id: string;
  number: string;
  customer: string;
  /** Integer halalas. */
  total: number;
  status: SampleOrderStatus;
  createdAt: string;
}

export const sampleOrders: SampleOrder[] = [
  {
    id: "ord_01",
    number: "#10241",
    customer: "نورة العتيبي",
    total: 125000,
    status: "paid",
    createdAt: "2026-11-20T09:15:00+03:00",
  },
  {
    id: "ord_02",
    number: "#10242",
    customer: "فهد القحطاني",
    total: 38950,
    status: "pending",
    createdAt: "2026-11-20T11:42:00+03:00",
  },
  {
    id: "ord_03",
    number: "#10243",
    customer: "سارة الشهري",
    total: 9900,
    status: "refunded",
    createdAt: "2026-11-19T16:05:00+03:00",
  },
  {
    id: "ord_04",
    number: "#10244",
    customer: "عبدالله الدوسري",
    total: 412575,
    status: "paid",
    createdAt: "2026-11-19T13:30:00+03:00",
  },
  {
    id: "ord_05",
    number: "#10245",
    customer: "ريم الزهراني",
    total: 15000,
    status: "failed",
    createdAt: "2026-11-18T20:11:00+03:00",
  },
  {
    id: "ord_06",
    number: "#10246",
    customer: "خالد المطيري",
    total: 76400,
    status: "paid",
    createdAt: "2026-11-18T08:47:00+03:00",
  },
  {
    id: "ord_07",
    number: "#10247",
    customer: "هيا السبيعي",
    total: 22850,
    status: "pending",
    createdAt: "2026-11-17T17:22:00+03:00",
  },
  {
    id: "ord_08",
    number: "#10248",
    customer: "محمد الغامدي",
    total: 189900,
    status: "paid",
    createdAt: "2026-11-17T10:03:00+03:00",
  },
  {
    id: "ord_09",
    number: "#10249",
    customer: "لمى الحربي",
    total: 5400,
    status: "paid",
    createdAt: "2026-11-16T14:58:00+03:00",
  },
  {
    id: "ord_10",
    number: "#10250",
    customer: "سلطان العنزي",
    total: 64000,
    status: "refunded",
    createdAt: "2026-11-16T09:36:00+03:00",
  },
  {
    id: "ord_11",
    number: "#10251",
    customer: "جود الشمري",
    total: 31275,
    status: "paid",
    createdAt: "2026-11-15T19:40:00+03:00",
  },
  {
    id: "ord_12",
    number: "#10252",
    customer: "تركي البقمي",
    total: 99999,
    status: "pending",
    createdAt: "2026-11-15T12:12:00+03:00",
  },
];

export interface SampleStat {
  key: "revenue" | "orders" | "conversion" | "aov";
  value: number;
  delta: number;
}

export const sampleStats: SampleStat[] = [
  { key: "revenue", value: 4825000, delta: 0.124 },
  { key: "orders", value: 312, delta: 0.058 },
  { key: "conversion", value: 0.031, delta: -0.012 },
  { key: "aov", value: 15465, delta: 0.021 },
];

export const sampleAmounts: number[] = [125000, 0, 50, 99999, 1234567890, -2500];
