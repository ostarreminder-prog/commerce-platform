import type { Meta, StoryObj } from "@storybook/react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "../components/command";

const meta: Meta = { title: "Command" };
export default meta;

export const Default: StoryObj = {
  render: () => (
    <Command className="max-w-md rounded-lg border">
      <CommandInput placeholder="Search orders, products…" />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup heading="Orders">
          <CommandItem>Order #10290</CommandItem>
          <CommandItem>Order #10289</CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Products">
          <CommandItem>Saudi cardamom coffee</CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
};
