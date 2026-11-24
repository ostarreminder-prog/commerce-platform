"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent } from "@repo/ui/components/card";
import { Checkbox } from "@repo/ui/components/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/components/form";
import { Input } from "@repo/ui/components/input";
import { RadioGroup, RadioGroupItem } from "@repo/ui/components/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { Switch } from "@repo/ui/components/switch";
import { Textarea } from "@repo/ui/components/textarea";
import { toast } from "@repo/ui/components/toaster";

const CATEGORIES = ["fashion", "electronics", "food", "beauty"] as const;
const SHIPPING = ["standard", "express", "pickup"] as const;

const schema = z.object({
  storeName: z.string().trim().min(2, "validation.tooShort").max(60, "validation.tooLong"),
  email: z.string().trim().min(1, "validation.required").email("validation.invalidEmail"),
  phone: z
    .string()
    .trim()
    .regex(/^05\d{8}$/, "validation.invalidPhone"),
  category: z.enum(CATEGORIES, { message: "validation.required" }),
  description: z.string().max(300, "validation.tooLong").optional(),
  shipping: z.enum(SHIPPING),
  notifications: z.boolean(),
  terms: z.boolean().refine((accepted) => accepted, "validation.required"),
});

type FormValues = z.input<typeof schema>;

export function FormDemo() {
  const t = useTranslations("designSystem.form");
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      storeName: "",
      email: "",
      phone: "",
      category: undefined,
      description: "",
      shipping: "standard",
      notifications: true,
      terms: false,
    },
  });

  const onSubmit = form.handleSubmit(async () => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    toast.success(t("submitted"));
  });

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={onSubmit} noValidate className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="storeName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>{t("storeName")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("storeNamePlaceholder")} {...field} />
                  </FormControl>
                  <FormDescription>{t("storeNameHint")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>{t("category")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger onBlur={field.onBlur}>
                        <SelectValue placeholder={t("categoryPlaceholder")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {t(`categories.${category}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>{t("email")}</FormLabel>
                  <FormControl>
                    <Input type="email" dir="ltr" autoComplete="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>{t("phone")}</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      dir="ltr"
                      inputMode="numeric"
                      autoComplete="tel"
                      placeholder="05XXXXXXXX"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>{t("description")}</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="shipping"
              render={({ field }) => (
                <FormItem>
                  <fieldset className="grid gap-3">
                    <legend className="mb-3 text-sm font-medium">{t("shippingMethod")}</legend>
                    <RadioGroup value={field.value} onValueChange={field.onChange}>
                      {SHIPPING.map((option) => (
                        <div key={option} className="flex items-center gap-2">
                          <RadioGroupItem value={option} id={`shipping-${option}`} />
                          <label htmlFor={`shipping-${option}`} className="text-sm">
                            {t(`shipping.${option}`)}
                          </label>
                        </div>
                      ))}
                    </RadioGroup>
                  </fieldset>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-5">
              <FormField
                control={form.control}
                name="notifications"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between gap-4 rounded-md border p-3">
                    <FormLabel>{t("notifications")}</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="terms"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(value) => field.onChange(value === true)}
                        />
                      </FormControl>
                      <FormLabel>{t("terms")}</FormLabel>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex gap-3 md:col-span-2">
              <Button type="submit" loading={form.formState.isSubmitting}>
                {t("submit")}
              </Button>
              <Button type="button" variant="outline" onClick={() => form.reset()}>
                {t("reset")}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
