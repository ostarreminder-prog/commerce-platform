import type { Meta, StoryObj } from "@storybook/react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../components/dropdown-menu";
import { Button } from "../components/button";

const meta: Meta = { title: "DropdownMenu" };
export default meta;

export const Open: StoryObj = {
  render: () => (
    <div className="flex h-64 items-start justify-center p-6">
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger asChild><Button variant="outline">Actions</Button></DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Order #10290</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Mark as shipped</DropdownMenuItem>
          <DropdownMenuItem>Print invoice</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive">Cancel order</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ),
};
