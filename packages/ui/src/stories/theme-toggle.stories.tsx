import type { Meta, StoryObj } from "@storybook/react";
import { ThemeToggle } from "../components/theme-toggle";

const meta: Meta = { title: "ThemeToggle" };
export default meta;

export const Default: StoryObj = {
  render: () => <div className="p-6"><ThemeToggle /></div>,
};
