import type { Meta, StoryObj } from "@storybook/react";
import * as React from "react";
import { Badge } from "../components/badge";
import { Button } from "../components/button";
import { Checkbox } from "../components/checkbox";
import { Input } from "../components/input";
import { Label } from "../components/label";
import { OrderChannelIcon } from "../components/order-channel-icon";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/select";
import { Skeleton } from "../components/skeleton";
import { StatusBadge } from "../components/status-badge";
import { Switch } from "../components/switch";
import { Textarea } from "../components/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/tooltip";

const meta: Meta = { title: "Primitives" };
export default meta;

export const Buttons: StoryObj = {
  render: () => (
    <div className="space-y-4 p-6">
      <div className="flex flex-wrap gap-3">
        <Button>Default</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button size="sm">Small</Button>
        <Button size="lg">Large</Button>
        <Button disabled>Disabled</Button>
      </div>
    </div>
  ),
};

export const Badges: StoryObj = {
  render: () => (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap gap-2">
        <Badge>default</Badge>
        <Badge variant="secondary">secondary</Badge>
        <Badge variant="success">success</Badge>
        <Badge variant="warning">warning</Badge>
        <Badge variant="destructive">destructive</Badge>
        <Badge variant="info">info</Badge>
        <Badge variant="outline">outline</Badge>
      </div>
      <div className="flex flex-wrap gap-2">
        <StatusBadge entity="order" value="delivered" />
        <StatusBadge entity="order" value="pending" />
        <StatusBadge entity="order" value="cancelled" />
        <StatusBadge entity="conversation" value="waiting_human" />
        <StatusBadge entity="agent" value="live" />
      </div>
      <div className="flex flex-wrap gap-2">
        <StatusBadge entity="order" value="in_progress" />
        <StatusBadge entity="order" value="completed" />
        <StatusBadge entity="payment" value="paid" />
        <StatusBadge entity="payment" value="failed" />
        <StatusBadge entity="product" value="active" />
        <StatusBadge entity="product" value="draft" />
      </div>
      <div className="flex gap-4">
        <TooltipProvider>
          <OrderChannelIcon channel="storefront" />
          <OrderChannelIcon channel="whatsapp" />
          <OrderChannelIcon channel="voice" />
          <OrderChannelIcon channel="manual" />
          <OrderChannelIcon channel="app" />
        </TooltipProvider>
      </div>
    </div>
  ),
};

export const FormControls: StoryObj = {
  render: () => (
    <div className="max-w-sm space-y-5 p-6">
      <div className="space-y-1.5">
        <Label htmlFor="s1">Input</Label>
        <Input id="s1" placeholder="Placeholder" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="s2">Disabled input</Label>
        <Input id="s2" disabled placeholder="Disabled" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="s3">Invalid input</Label>
        <Input id="s3" aria-invalid="true" defaultValue="bad value" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="s4">Textarea</Label>
        <Textarea id="s4" placeholder="Write…" />
      </div>
      <div className="space-y-1.5">
        <Label>Select</Label>
        <Select defaultValue="b">
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="a">Option A</SelectItem>
            <SelectItem value="b">Option B</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <Switch id="sw" defaultChecked />
        <Label htmlFor="sw">Switch on</Label>
        <Switch id="sw2" disabled />
        <Label htmlFor="sw2">Disabled</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="cb" defaultChecked />
        <Label htmlFor="cb">Checkbox</Label>
      </div>
    </div>
  ),
};

export const Loading: StoryObj = {
  render: () => (
    <div className="max-w-md space-y-3 p-6">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-24 w-full" />
    </div>
  ),
};

export const Tooltips: StoryObj = {
  render: () => (
    <div className="p-10">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild><Button variant="outline">Hover me</Button></TooltipTrigger>
          <TooltipContent>Tooltip text</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  ),
};
