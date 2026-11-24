import type { Meta, StoryObj } from "@storybook/react";
import { Toaster, toast } from "../components/toaster";
import { Button } from "../components/button";

const meta: Meta = { title: "Toaster" };
export default meta;

export const Default: StoryObj = {
  render: () => (
    <div className="flex gap-3 p-6">
      <Toaster />
      <Button onClick={() => toast.success("Saved")}>Success toast</Button>
      <Button variant="outline" onClick={() => toast.error("Something failed")}>Error toast</Button>
      <Button variant="ghost" onClick={() => toast.info("Heads up")}>Info toast</Button>
    </div>
  ),
};
