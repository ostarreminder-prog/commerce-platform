"use client";

import Link from "@/components/store-link";
import { useStoreRouter as useRouter } from "@/lib/store-route";
import { useTranslations } from "next-intl";
import type { SessionRecord } from "@repo/contracts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatDateTime, formatMoney } from "@repo/ui/lib/format";
import { AgentAvatar, channelIcons } from "../agent-meta";
import type { TreeIndex } from "../tree";
import { clock, OutcomeBadge, Rating } from "./shared";

function PathChips({ path, index }: { path: string[]; index: TreeIndex }) {
  const last = index.byId.get(path.at(-1) ?? "");
  return (
    <span className="flex items-center gap-1">
      <span className="flex [&>*:not(:first-child)]:-ms-1.5" aria-hidden>
        {path.map((id) => {
          const a = index.byId.get(id);
          return a ? (
            <AgentAvatar
              key={id}
              agent={a}
              size="sm"
              className="ring-background size-5 rounded-full ring-2 [&_svg]:size-2.5"
            />
          ) : null;
        })}
      </span>
      <span className="truncate text-xs">{last?.name}</span>
    </span>
  );
}

export function SessionRows({ rows, index }: { rows: SessionRecord[]; index: TreeIndex }) {
  const t = useTranslations("studio.history");
  const tc = useTranslations("studio.channel");
  const { locale } = useAppLocale();
  const router = useRouter();
  if (rows.length === 0)
    return <p className="text-muted-foreground p-10 text-center text-sm">{t("noResults")}</p>;
  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("cols.customer")}</TableHead>
              <TableHead>{t("cols.path")}</TableHead>
              <TableHead>{t("cols.outcome")}</TableHead>
              <TableHead>{t("cols.duration")}</TableHead>
              <TableHead>{t("cols.cost")}</TableHead>
              <TableHead>{t("cols.rating")}</TableHead>
              <TableHead>{t("cols.date")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((s) => {
              const Icon = channelIcons[s.channel];
              return (
                <TableRow
                  key={s.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/agents/history/${s.id}`)}
                >
                  <TableCell>
                    <Link
                      href={`/agents/history/${s.id}`}
                      className="flex items-center gap-2.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span
                        className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-full"
                        title={tc(s.channel)}
                      >
                        <Icon className="size-4" aria-label={tc(s.channel)} />
                      </span>
                      <span>
                        <span className="block font-medium">{s.customerName}</span>
                        <span className="num text-muted-foreground block text-xs" dir="ltr">
                          {s.customerPhone}
                        </span>
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-48">
                    <PathChips path={s.agentPath} index={index} />
                  </TableCell>
                  <TableCell>
                    <OutcomeBadge outcome={s.outcome} />
                  </TableCell>
                  <TableCell className="num">{clock(s.durationSec)}</TableCell>
                  <TableCell>{formatMoney(s.cost, locale)}</TableCell>
                  <TableCell>
                    <Rating value={s.rating} />
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap text-xs">
                    {formatDateTime(s.startedAt, locale)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <ul className="divide-y md:hidden">
        {rows.map((s) => {
          const Icon = channelIcons[s.channel];
          return (
            <li key={s.id}>
              <Link
                href={`/agents/history/${s.id}`}
                className="hover:bg-muted/50 block space-y-2 p-4"
              >
                <div className="flex items-center gap-2">
                  <Icon className="text-muted-foreground size-4" aria-label={tc(s.channel)} />
                  <span className="flex-1 font-medium">{s.customerName}</span>
                  <OutcomeBadge outcome={s.outcome} />
                </div>
                <PathChips path={s.agentPath} index={index} />
                <div className="text-muted-foreground flex items-center gap-3 text-xs">
                  <span className="num">{clock(s.durationSec)}</span>
                  <span>{formatMoney(s.cost, locale)}</span>
                  <Rating value={s.rating} />
                  <span className="ms-auto">{formatDateTime(s.startedAt, locale)}</span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
