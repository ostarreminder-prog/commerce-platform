import type { Meta, StoryObj } from "@storybook/react";
import { RadioGroup, RadioGroupItem } from "../components/radio-group";
import { Label } from "../components/label";

const meta: Meta = { title: "RadioGroup" };
export default meta;

export const Default: StoryObj = {
  render: () => (
    <RadioGroup defaultValue="standard" className="space-y-2 p-6">
      {["standard", "express", "pickup"].map((v) => (
        <Label key={v} className="flex cursor-pointer items-center gap-2">
          <RadioGroupItem value={v} />{v}
        </Label>
      ))}
    </RadioGroup>
  ),
};

export const Disabled: StoryObj = {
  render: () => (
    <RadioGroup defaultValue="a" className="space-y-2 p-6" disabled>
      <Label className="flex items-center gap-2"><RadioGroupItem value="a" />Option A</Label>
      <Label className="flex items-center gap-2"><RadioGroupItem value="b" />Option B</Label>
    </RadioGroup>
  ),
};
