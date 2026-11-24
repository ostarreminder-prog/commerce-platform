import type { Meta, StoryObj } from "@storybook/react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/card";
import { Button } from "../components/button";

const meta: Meta = { title: "Card" };
export default meta;

export const Default: StoryObj = {
  render: () => (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>Monthly report</CardTitle>
        <CardDescription>Sales summary for the last 30 days.</CardDescription>
      </CardHeader>
      <CardContent><p className="text-sm">Revenue grew 12% vs. the previous period.</p></CardContent>
      <CardFooter><Button size="sm">View report</Button></CardFooter>
    </Card>
  ),
};

export const Compact: StoryObj = {
  render: () => <Card className="max-w-sm p-5"><p className="text-sm">Padding-only card content.</p></Card>,
};
