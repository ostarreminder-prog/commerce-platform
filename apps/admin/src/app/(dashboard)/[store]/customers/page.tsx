import { getTranslations } from "next-intl/server";
import { CustomersList } from "@/features/customers/customers";

export async function generateMetadata() {
  const t = await getTranslations("customers");
  return { title: t("title") };
}

export default function Page() {
  return <CustomersList />;
}
