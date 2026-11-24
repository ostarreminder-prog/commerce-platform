export const STEPS = ["store", "product", "payment", "done"] as const;
export type Step = (typeof STEPS)[number];
