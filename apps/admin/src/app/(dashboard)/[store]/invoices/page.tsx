import { getTranslations } from "next-intl/server";
import { InvoicesView } from "@/features/invoices/invoices-view";

export async function generateMetadata() {
  const t = await getTranslations("invoices");
  return { title: t("title") };
}

export default function Page() {
  return <InvoicesView />;
}
