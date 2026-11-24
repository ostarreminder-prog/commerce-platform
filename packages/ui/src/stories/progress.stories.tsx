import type { Meta, StoryObj } from "@storybook/react";
import { Progress } from "../components/progress";

const meta: Meta = { title: "Progress" };
export default meta;

export const Default: StoryObj = {
  render: () => (
    <div className="w-80 space-y-4 p-6">
      <Progress value={15} />
      <Progress value={60} />
      <Progress value={100} />
    </div>
  ),
};
