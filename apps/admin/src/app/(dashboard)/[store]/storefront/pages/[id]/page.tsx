import { getTranslations } from "next-intl/server";
import { PageEditor } from "@/features/storefront/pages/page-editor";

export async function generateMetadata() {
  const t = await getTranslations("storefront.pages.editor");
  return { title: t("editTitle") };
}

export default function Page() {
  return <PageEditor />;
}
