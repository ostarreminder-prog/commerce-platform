"use client";

import * as React from "react";
import {
  Copy,
  Eye,
  FileText,
  MoreHorizontal,
  Package,
  Pencil,
  Search,
  Settings,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { sampleOrders } from "@repo/api-client";
import { Button } from "@repo/ui/components/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@repo/ui/components/command";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { Kbd } from "@repo/ui/components/kbd";
import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui/components/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@repo/ui/components/sheet";
import { toast } from "@repo/ui/components/toaster";
import { Tooltip, TooltipContent, TooltipTrigger } from "@repo/ui/components/tooltip";
import { useHotkey } from "@repo/ui/hooks/use-hotkey";

const SHEET_SIDES = [
  { side: "start", label: "openSheetStart" },
  { side: "end", label: "openSheetEnd" },
  { side: "bottom", label: "openSheetBottom" },
] as const;

export function OverlaysDemo() {
  const t = useTranslations("designSystem.overlays");
  const [commandOpen, setCommandOpen] = React.useState(false);
  useHotkey("k", () => setCommandOpen((open) => !open));

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">{t("openDialog")}</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("dialogTitle")}</DialogTitle>
            <DialogDescription>{t("dialogDescription")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{t("cancel")}</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button variant="destructive">{t("confirm")}</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {SHEET_SIDES.map(({ side, label }) => (
        <Sheet key={side}>
          <SheetTrigger asChild>
            <Button variant="outline">{t(label)}</Button>
          </SheetTrigger>
          <SheetContent side={side}>
            <SheetHeader>
              <SheetTitle>{t("sheetTitle")}</SheetTitle>
              <SheetDescription>{t("sheetDescription")}</SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      ))}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" aria-label={t("actions")}>
            <MoreHorizontal aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuLabel>{t("actions")}</DropdownMenuLabel>
          <DropdownMenuItem>
            <Eye aria-hidden />
            {t("view")}
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Pencil aria-hidden />
            {t("edit")}
            <DropdownMenuShortcut>E</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Copy aria-hidden />
            {t("duplicate")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem destructive>
            <Trash2 aria-hidden />
            {t("delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">{t("popover")}</Button>
        </PopoverTrigger>
        <PopoverContent className="text-muted-foreground text-sm">
          {t("popoverBody")}
        </PopoverContent>
      </Popover>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost">{t("tooltip")}</Button>
        </TooltipTrigger>
        <TooltipContent>{t("tooltipBody")}</TooltipContent>
      </Tooltip>

      <Button
        variant="secondary"
        onClick={() => toast.success(t("toastTitle"), { description: t("toastDescription") })}
      >
        {t("toast")}
      </Button>

      <Button variant="outline" onClick={() => setCommandOpen(true)} className="gap-3">
        <Search aria-hidden />
        {t("command")}
        <Kbd>Ctrl K</Kbd>
      </Button>
      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen} title={t("commandTitle")}>
        <CommandInput placeholder={t("commandPlaceholder")} />
        <CommandList>
          <CommandEmpty>{t("commandEmpty")}</CommandEmpty>
          <CommandGroup heading={t("commandPages")}>
            <CommandItem onSelect={() => setCommandOpen(false)}>
              <ShoppingCart aria-hidden />
              {t("commandOrders")}
            </CommandItem>
            <CommandItem onSelect={() => setCommandOpen(false)}>
              <Package aria-hidden />
              {t("commandProducts")}
            </CommandItem>
            <CommandItem onSelect={() => setCommandOpen(false)}>
              <Settings aria-hidden />
              {t("commandSettings")}
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading={t("commandOrders")}>
            {sampleOrders.slice(0, 4).map((order) => (
              <CommandItem
                key={order.id}
                value={`${order.number} ${order.customer}`}
                onSelect={() => setCommandOpen(false)}
              >
                <FileText aria-hidden />
                <span className="num">{order.number}</span>
                <span className="text-muted-foreground">{order.customer}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}
