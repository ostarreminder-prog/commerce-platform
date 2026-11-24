import { ReportDetail } from "@/features/reports/report-detail";

export default async function Page({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  return <ReportDetail type={type} />;
}
