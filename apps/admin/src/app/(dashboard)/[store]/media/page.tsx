import { getTranslations } from "next-intl/server";
import { MediaLibraryView } from "@/features/media/media-library";

export async function generateMetadata() {
  const t = await getTranslations("mediaLibrary");
  return { title: t("title") };
}

export default function Page() {
  return <MediaLibraryView />;
}
