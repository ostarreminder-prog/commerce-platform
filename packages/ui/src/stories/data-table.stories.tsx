import type { Meta, StoryObj } from "@storybook/react";
import { DataTable, type ColumnDef } from "../components/data-table";

const meta: Meta = { title: "DataTable" };
export default meta;

type Row = { id: string; name: string; total: string };
const columns: ColumnDef<Row, unknown>[] = [
  { accessorKey: "name", header: "Product" },
  { accessorKey: "total", header: "Sales" },
];
const data: Row[] = [
  { id: "1", name: "Saudi cardamom coffee", total: "12,400" },
  { id: "2", name: "Ajwa dates 1kg", total: "9,850" },
  { id: "3", name: "Taif honey 500g", total: "7,200" },
];

export const Default: StoryObj = {
  render: () => <DataTable columns={columns} data={data} />,
};

export const WithSelection: StoryObj = {
  render: () => <DataTable columns={columns} data={data} enableRowSelection />,
};

export const Loading: StoryObj = {
  render: () => <DataTable columns={columns} data={[]} pageSize={5} emptyMessage="No results" />,
};
