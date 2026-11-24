import type { Meta, StoryObj } from "@storybook/react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "../components/sheet";
import { Button } from "../components/button";

const meta: Meta = { title: "Sheet" };
export default meta;

export const Open: StoryObj = {
  render: () => (
    <Sheet defaultOpen>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Store details</SheetTitle>
          <SheetDescription>Quick facts about this store.</SheetDescription>
        </SheetHeader>
        <div className="space-y-2 p-4 text-sm">
          <p>Plan: Growth</p>
          <p>Orders: 1,240</p>
          <Button size="sm">Suspend store</Button>
        </div>
      </SheetContent>
    </Sheet>
  ),
};
