import type { Meta, StoryObj } from "@storybook/react";
import { Money } from "../components/money";

const meta: Meta = { title: "Money" };
export default meta;

export const Default: StoryObj = {
  render: () => (
    <div className="space-y-2 p-6 text-lg">
      <p><Money amount={14950} /></p>
      <p><Money amount={1299900} /></p>
      <p><Money amount={0} /></p>
    </div>
  ),
};
