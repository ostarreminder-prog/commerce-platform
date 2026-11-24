import type { Meta, StoryObj } from "@storybook/react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/table";

const meta: Meta = { title: "Table" };
export default meta;

export const Default: StoryObj = {
  render: () => (
    <Table className="max-w-md">
      <TableHeader>
        <TableRow><TableHead>Product</TableHead><TableHead>Stock</TableHead><TableHead>Price</TableHead></TableRow>
      </TableHeader>
      <TableBody>
        <TableRow><TableCell>Coffee</TableCell><TableCell>42</TableCell><TableCell>SAR 45</TableCell></TableRow>
        <TableRow><TableCell>Dates</TableCell><TableCell>18</TableCell><TableCell>SAR 30</TableCell></TableRow>
      </TableBody>
    </Table>
  ),
};
