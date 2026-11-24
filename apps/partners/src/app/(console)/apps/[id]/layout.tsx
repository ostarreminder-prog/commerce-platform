import { AppDetailShell } from "@/features/app-detail/app-detail-shell";

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AppDetailShell id={id}>{children}</AppDetailShell>;
}
