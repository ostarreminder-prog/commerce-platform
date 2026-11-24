import type { Meta, StoryObj } from "@storybook/react";
import { DataState } from "../components/data-state";
import { Skeleton } from "../components/skeleton";

const meta: Meta = { title: "DataState" };
export default meta;

const loadingNode = <Skeleton className="h-24 w-64" />;

export const Loading: StoryObj = {
  render: () => <DataState<string[]> state={{ status: "pending", data: undefined }} loading={loadingNode}>{(d) => <p>{d.join(", ")}</p>}</DataState>,
};

export const Error: StoryObj = {
  render: () => <DataState<string[]> state={{ status: "error", data: undefined, refetch: () => {} }} loading={loadingNode}>{(d) => <p>{d.join(", ")}</p>}</DataState>,
};

export const Empty: StoryObj = {
  render: () => (
    <DataState<string[]>
      state={{ status: "success", data: [] }}
      loading={loadingNode}
      isEmpty={(d) => d.length === 0}
      empty={<p className="text-muted-foreground p-6 text-sm">Nothing here yet.</p>}
    >
      {(d) => <p>{d.join(", ")}</p>}
    </DataState>
  ),
};

export const Data: StoryObj = {
  render: () => (
    <DataState<string[]> state={{ status: "success", data: ["Coffee", "Dates"] }} loading={loadingNode}>
      {(d) => <ul className="list-inside list-disc p-4">{d.map((x) => <li key={x}>{x}</li>)}</ul>}
    </DataState>
  ),
};
