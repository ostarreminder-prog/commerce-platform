import type { Meta, StoryObj } from "@storybook/react";
import { Popover, PopoverContent, PopoverTrigger } from "../components/popover";
import { Button } from "../components/button";

const meta: Meta = { title: "Popover" };
export default meta;

export const Open: StoryObj = {
  render: () => (
    <div className="flex h-48 items-start justify-center p-6">
      <Popover defaultOpen>
        <PopoverTrigger asChild><Button variant="outline">Filters</Button></PopoverTrigger>
        <PopoverContent><p className="text-sm">Popover content — filters, quick pickers, menus.</p></PopoverContent>
      </Popover>
    </div>
  ),
};
