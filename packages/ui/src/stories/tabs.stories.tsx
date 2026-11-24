import type { Meta, StoryObj } from "@storybook/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/tabs";

const meta: Meta = { title: "Tabs" };
export default meta;

export const Default: StoryObj = {
  render: () => (
    <Tabs defaultValue="overview" className="w-96 p-6">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
        <TabsTrigger value="logs" disabled>Logs</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="p-2 text-sm">Overview content</TabsContent>
      <TabsContent value="analytics" className="p-2 text-sm">Analytics content</TabsContent>
    </Tabs>
  ),
};
