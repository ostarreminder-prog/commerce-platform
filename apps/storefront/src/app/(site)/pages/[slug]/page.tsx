import { CmsView } from "@/features/cms/cms-view";

export default async function CmsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <CmsView slug={slug} />;
}
