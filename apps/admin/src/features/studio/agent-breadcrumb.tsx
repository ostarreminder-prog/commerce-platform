"use client";

import Link from "@/components/store-link";
import { ChevronLeft, MoreHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Agent } from "@repo/contracts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { AgentAvatar } from "./agent-meta";
import { compactPath } from "./tree";

/** Root → … → parent → current. Middle levels fold into a menu past 4 levels. */
export function AgentBreadcrumb({ path }: { path: Agent[] }) {
  const t = useTranslations("studio");
  const shown = compactPath(path, 2);
  const hidden = path.slice(1, path.length - 2);
  const sep = (
    <ChevronLeft
      className="text-muted-foreground/60 size-3.5 shrink-0 ltr:rotate-180"
      aria-hidden
    />
  );
  return (
    <nav aria-label={t("detail.breadcrumb")} className="min-w-0">
      <ol className="text-muted-foreground flex min-w-0 items-center gap-1.5 overflow-hidden text-sm">
        <li className="hidden shrink-0 sm:block">
          <Link href="/agents" className="hover:text-foreground">
            {t("title")}
          </Link>
        </li>
        {shown.map((a, i) => (
          <li
            key={a?.id ?? "more"}
            className={`flex min-w-0 items-center gap-1.5 ${i === shown.length - 1 ? "" : "shrink"} ${i === 0 ? "[&>svg:first-child]:hidden sm:[&>svg:first-child]:block" : ""}`}
          >
            {sep}
            {a === null ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="hover:bg-muted hover:text-foreground flex h-6 items-center gap-1 rounded px-1.5"
                  aria-label={t("detail.hiddenLevels", { count: hidden.length })}
                >
                  <MoreHorizontal className="size-4" aria-hidden />
                  <span className="num text-[11px]">{hidden.length}</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="max-h-80 overflow-y-auto">
                  {hidden.map((h, depth) => (
                    <DropdownMenuItem key={h.id} asChild>
                      <Link
                        href={`/agents/${h.id}`}
                        className="flex items-center gap-2"
                        style={{ paddingInlineStart: 8 + Math.min(depth, 6) * 10 }}
                      >
                        <AgentAvatar
                          agent={h}
                          size="sm"
                          className="size-5 rounded-md [&_svg]:size-3"
                        />
                        {h.name}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : i === shown.length - 1 ? (
              <span aria-current="page" className="text-foreground truncate font-medium">
                {a.name}
              </span>
            ) : (
              <Link
                href={`/agents/${a.id}`}
                className="hover:text-foreground max-w-20 truncate sm:max-w-40"
              >
                {a.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
