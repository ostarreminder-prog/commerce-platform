"use client";

import { Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Category, Collection, CollectionRuleField } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";

const RULE_FIELDS: CollectionRuleField[] = ["price", "tag", "category", "brand", "stock"];
const OPS = ["eq", "neq", "gt", "lt", "contains"] as const;
const NUMERIC_FIELDS: CollectionRuleField[] = ["price", "stock"];

export interface RuleDraft { field: CollectionRuleField; op: (typeof OPS)[number]; value: string }

const opOptions = (field: CollectionRuleField) => (NUMERIC_FIELDS.includes(field) ? OPS.filter((o) => o !== "contains") : OPS);

export function CollectionRulesCard({ match, setMatch, rules, setRules, categories }: {
  match: Collection["match"];
  setMatch: (m: Collection["match"]) => void;
  rules: RuleDraft[];
  setRules: (r: RuleDraft[]) => void;
  categories: Category[];
}) {
  const t = useTranslations("collections.detail");
  const { locale } = useAppLocale();
  const setRule = (i: number, patch: Partial<RuleDraft>) => setRules(rules.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{t("rules")}</CardTitle>
        <Select value={match} onValueChange={(v) => setMatch(v as Collection["match"])}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("matchAll")}</SelectItem>
            <SelectItem value="any">{t("matchAny")}</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="space-y-3">
        {rules.map((r, i) => (
          <div key={i} className="flex flex-wrap items-end gap-2 rounded-md border p-2.5">
            <div className="space-y-1">
              <Label className="text-xs">{t("ruleField")}</Label>
              <Select value={r.field} onValueChange={(v) => setRule(i, { field: v as CollectionRuleField, op: "eq", value: "" })}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>{RULE_FIELDS.map((fd) => <SelectItem key={fd} value={fd}>{t(`ruleFields.${fd}`)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t("ruleOp")}</Label>
              <Select value={r.op} onValueChange={(v) => setRule(i, { op: v as RuleDraft["op"] })}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>{opOptions(r.field).map((o) => <SelectItem key={o} value={o}>{t(`ops.${o}`)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="min-w-40 flex-1 space-y-1">
              <Label className="text-xs">{t("ruleValue")}</Label>
              {r.field === "category" ? (
                <Select value={r.value} onValueChange={(v) => setRule(i, { value: v })}>
                  <SelectTrigger><SelectValue placeholder={t("pickCategory")} /></SelectTrigger>
                  <SelectContent>{categories.map((cat) => <SelectItem key={cat.id} value={cat.id}>{cat.name[locale] ?? cat.name.ar}</SelectItem>)}</SelectContent>
                </Select>
              ) : (
                <Input value={r.value} dir={NUMERIC_FIELDS.includes(r.field) ? "ltr" : undefined} inputMode={NUMERIC_FIELDS.includes(r.field) ? "decimal" : undefined} placeholder={NUMERIC_FIELDS.includes(r.field) ? t("valueInHalalas") : t("valuePlaceholder")} onChange={(e) => setRule(i, { value: e.target.value })} />
              )}
            </div>
            <Button size="icon" variant="ghost" onClick={() => setRules(rules.filter((_, j) => j !== i))} aria-label={t("removeRule")} disabled={rules.length === 1}><X className="size-4" /></Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => setRules([...rules, { field: "tag", op: "eq", value: "" }])}><Plus aria-hidden />{t("addRule")}</Button>
      </CardContent>
    </Card>
  );
}
