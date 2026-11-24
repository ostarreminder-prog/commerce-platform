import type { Meta, StoryObj } from "@storybook/react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "../components/form";
import { Input } from "../components/input";
import { Button } from "../components/button";

const meta: Meta = { title: "Form" };
export default meta;

function Demo() {
  const form = useForm<{ name: string }>({ defaultValues: { name: "" } });
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(() => {})} className="max-w-sm space-y-4 p-6">
        <FormField
          control={form.control}
          name="name"
          rules={{ required: "Store name is required" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Store name</FormLabel>
              <FormControl><Input placeholder="Nakhla Store" {...field} /></FormControl>
              <FormDescription>Shown on your storefront and invoices.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Save</Button>
      </form>
    </Form>
  );
}

export const Default: StoryObj = { render: () => <Demo /> };
