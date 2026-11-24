import type { Halalas, Money } from "../common";

export * from "./entities-store";
export * from "./entities-catalog";
export * from "./entities-customer";
export * from "./entities-order";
export * from "./entities-marketing";
export * from "./entities-inbox";
export * from "./entities-theme";
export * from "./entities-settings";
export * from "./entities-apps";
export * from "./entities-platform";
export * from "./entities-growth";

export const money = (amount: Halalas): Money => ({ amount, currency: "SAR" });
