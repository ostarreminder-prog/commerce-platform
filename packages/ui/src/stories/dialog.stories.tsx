import type { Meta, StoryObj } from "@storybook/react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/dialog";
import { Button } from "../components/button";

const meta: Meta = { title: "Dialog" };
export default meta;

export const Open: StoryObj = {
  render: () => (
    <Dialog defaultOpen>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Archive product?</DialogTitle>
          <DialogDescription>The product disappears from the storefront but stays in reports.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button>Archive</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};
