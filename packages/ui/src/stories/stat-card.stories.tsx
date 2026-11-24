import type { Meta, StoryObj } from "@storybook/react";
import { ShoppingCart, Wallet } from "lucide-react";
import { StatCard, StatCardSkeleton } from "../components/stat-card";

const meta: Meta = { title: "StatCard" };
export default meta;

export const Default: StoryObj = {
  render: () => (
    <div className="grid max-w-2xl grid-cols-2 gap-4 p-6">
      <StatCard label="Revenue" value="SAR 24,600" icon={Wallet} delta={0.12} hint="vs last month" />
      <StatCard label="Orders" value="312" icon={ShoppingCart} delta={-0.04} />
    </div>
  ),
};

export const Loading: StoryObj = {
  render: () => <div className="max-w-xs p-6"><StatCardSkeleton /></div>,
};
