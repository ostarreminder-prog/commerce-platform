import type { Meta, StoryObj } from "@storybook/react";
import { Kbd } from "../components/kbd";

const meta: Meta = { title: "Kbd" };
export default meta;

export const Default: StoryObj = {
  render: () => (
    <p className="p-6 text-sm">
      Press <Kbd>⌘</Kbd> + <Kbd>J</Kbd> to open the assistant, or <Kbd>Esc</Kbd> to close.
    </p>
  ),
};
