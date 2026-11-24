import type { Meta, StoryObj } from "@storybook/react";
import { Separator } from "../components/separator";

const meta: Meta = { title: "Separator" };
export default meta;

export const Horizontal: StoryObj = {
  render: () => (
    <div className="w-64 space-y-3 p-6">
      <p className="text-sm">Above</p>
      <Separator />
      <p className="text-sm">Below</p>
    </div>
  ),
};

export const Vertical: StoryObj = {
  render: () => (
    <div className="flex h-8 items-center gap-3 p-6">
      <span className="text-sm">Start</span>
      <Separator orientation="vertical" />
      <span className="text-sm">End</span>
    </div>
  ),
};
