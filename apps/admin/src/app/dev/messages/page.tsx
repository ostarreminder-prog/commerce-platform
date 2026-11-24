import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import msgAr from "@repo/ui/messages/ar.json";
import msgEn from "@repo/ui/messages/en.json";
import { PageHeader } from "@repo/ui/components/page-header";
import {
  BannersDemo,
  ConfirmDialogsDemo,
  EmptyStatesDemo,
  FieldErrorDemo,
  PageErrorsDemo,
  ToastsDemo,
  ValidationDemo,
} from "./_components/messages-demo";

export const metadata: Metadata = { title: "UI Messages · dev" };

type Dict = Record<string, unknown>;

function flatten(node: Dict, prefix = ""): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  for (const [k, v] of Object.entries(node)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object") out.push(...flatten(v as Dict, key));
    else out.push([key, String(v)]);
  }
  return out;
}

export default async function DevMessagesPage() {
  const td = await getTranslations("dev");
  if (process.env.NODE_ENV === "production") notFound();

  const ar = flatten(msgAr.msg as unknown as Dict);
  const enFlat = Object.fromEntries(flatten(msgEn.msg as unknown as Dict));
  const groups = new Map<string, Array<[string, string]>>();
  for (const [key, text] of ar) {
    const group = key.split(".")[0] ?? key;
    const list = groups.get(group) ?? [];
    list.push([key, text]);
    groups.set(group, list);
  }

  return (
    <div className="container space-y-10 py-8">
      <PageHeader title={td("title")} description={td("description")} />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Toasts</h2>
        <ToastsDemo />
      </section>
      <section className="space-y-4 border-t pt-8">
        <h2 className="text-lg font-semibold">ConfirmDialog</h2>
        <ConfirmDialogsDemo />
      </section>
      <section className="space-y-4 border-t pt-8">
        <h2 className="text-lg font-semibold">Banner</h2>
        <BannersDemo />
      </section>
      <section className="space-y-4 border-t pt-8">
        <h2 className="text-lg font-semibold">{td("emptyStates")}</h2>
        <EmptyStatesDemo />
      </section>
      <section className="space-y-4 border-t pt-8">
        <h2 className="text-lg font-semibold">{td("pageErrors")}</h2>
        <PageErrorsDemo />
      </section>
      <section className="space-y-4 border-t pt-8">
        <h2 className="text-lg font-semibold">{td("validation")}</h2>
        <ValidationDemo />
        <FieldErrorDemo />
      </section>

      <section className="space-y-4 border-t pt-8">
        <h2 className="text-lg font-semibold">{td("dictionary")} ({ar.length} {td("keysCount")})</h2>
        {[...groups.entries()].map(([group, rows]) => (
          <details key={group} className="rounded-lg border" open={["common", "empty", "errors"].includes(group)}>
            <summary className="cursor-pointer px-4 py-3 font-medium">
              <code>msg.{group}.*</code> <span className="text-muted-foreground text-sm">({rows.length})</span>
            </summary>
            <div className="overflow-x-auto border-t">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground border-b text-start">
                    <th className="px-4 py-2 text-start font-medium">{td("key")}</th>
                    <th className="px-4 py-2 text-start font-medium">{td("arabic")}</th>
                    <th className="px-4 py-2 text-start font-medium">English</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(([key, text]) => (
                    <tr key={key} className="border-b last:border-0">
                      <td className="px-4 py-2 align-top"><code className="text-xs">msg.{key}</code></td>
                      <td className="px-4 py-2 align-top" dir="rtl">{text}</td>
                      <td className="text-muted-foreground px-4 py-2 align-top" dir="ltr">{enFlat[key]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        ))}
      </section>
    </div>
  );
}
