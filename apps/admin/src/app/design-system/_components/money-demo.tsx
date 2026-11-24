import { getLocale, getTranslations } from "next-intl/server";
import { sampleAmounts } from "@repo/api-client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import { formatMoney, formatNumber } from "@repo/ui/lib/format";

export async function MoneyDemo() {
  const [t, locale] = await Promise.all([getTranslations("designSystem.money"), getLocale()]);
  return (
    <div className="bg-card overflow-hidden rounded-lg border sm:max-w-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("amount")}</TableHead>
            <TableHead>{t("formatted")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sampleAmounts.map((amount) => (
            <TableRow key={amount}>
              <TableCell className="num text-muted-foreground">{formatNumber(amount)}</TableCell>
              <TableCell className="num font-medium">{formatMoney(amount, locale)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
