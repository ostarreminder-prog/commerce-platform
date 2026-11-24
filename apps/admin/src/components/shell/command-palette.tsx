"use client";

import * as React from "react";
import { useStoreRouter as useRouter } from "@/lib/store-route";
import { FileText, MessagesSquare, Package, Sparkles, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { useConversationList, useCustomerList, useOrderList, useProductList } from "@repo/api-client";
import { useCopilot } from "@/features/copilot/copilot-context";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@repo/ui/components/command";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { allNavItems } from "./nav";

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations();
  const router = useRouter();
  const copilot = useCopilot();
  const [query, setQuery] = React.useState("");
  const { locale } = useAppLocale();
  const { data: orders } = useOrderList();
  const { data: products } = useProductList();
  const { data: customers } = useCustomerList();
  const { data: conversations } = useConversationList();
  const customerName = (id: string) => customers?.find((c) => c.id === id)?.name ?? "";

  const go = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title={t("commandPalette.placeholder")}>
      <CommandInput placeholder={t("commandPalette.placeholder")} value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>
          <div className="space-y-2">
            <p>{t("commandPalette.empty")}</p>
            {query.trim() ? (
              <button
                type="button"
                className="text-primary hover:bg-accent mx-auto flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
                onClick={() => {
                  onOpenChange(false);
                  copilot.ask(query.trim());
                }}
              >
                <Sparkles className="size-4" aria-hidden />
                {t("commandPalette.askCopilot", { query: query.trim() })}
              </button>
            ) : null}
          </div>
        </CommandEmpty>
        <CommandGroup heading={t("commandPalette.pages")}>
          {allNavItems.map((item) => (
            <CommandItem key={item.key} value={`page ${t(`nav.${item.key}`)}`} onSelect={() => go(item.href)}>
              <item.icon aria-hidden />
              {t(`nav.${item.key}`)}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading={t("commandPalette.orders")}>
          {orders?.slice(0, 8).map((o) => (
            <CommandItem
              key={o.id}
              value={`order ${o.number} ${customerName(o.customerId)}`}
              onSelect={() => go(`/orders/${o.id}`)}
            >
              <FileText aria-hidden />
              <span className="num">#{o.number}</span>
              <span className="text-muted-foreground">{customerName(o.customerId)}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading={t("commandPalette.products")}>
          {products?.slice(0, 8).map((p) => (
            <CommandItem
              key={p.id}
              value={`product ${p.name.ar} ${p.name.en ?? ""} ${p.variants[0]?.sku ?? ""}`}
              onSelect={() => go(`/products/${p.id}`)}
            >
              <Package aria-hidden />
              {p.name[locale as "ar" | "en"] ?? p.name.ar}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading={t("commandPalette.customers")}>
          {customers?.slice(0, 6).map((c) => (
            <CommandItem
              key={c.id}
              value={`customer ${c.name ?? ""} ${c.phone}`}
              onSelect={() => go(`/customers/${c.id}`)}
            >
              <User aria-hidden />
              {c.name ?? c.phone}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading={t("commandPalette.conversations")}>
          {conversations?.slice(0, 6).map((c) => (
            <CommandItem
              key={c.id}
              value={`conversation ${c.contact.name ?? ""} ${c.contact.phone}`}
              onSelect={() => go(`/inbox/${c.id}`)}
            >
              <MessagesSquare aria-hidden />
              {c.contact.name ?? c.contact.phone}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
