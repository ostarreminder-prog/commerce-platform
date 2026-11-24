import type { Meta, StoryObj } from "@storybook/react";
import { ScrollArea } from "../components/scroll-area";

const meta: Meta = { title: "ScrollArea" };
export default meta;

export const Default: StoryObj = {
  render: () => (
    <ScrollArea className="h-40 w-64 rounded-md border p-4">
      {Array.from({ length: 20 }, (_, i) => <p key={i} className="py-1 text-sm">Row {i + 1}</p>)}
    </ScrollArea>
  ),
};
