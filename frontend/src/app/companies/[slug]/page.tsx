import { CompanyDetailScreen } from "@/components/companies/company-detail-screen";

export default async function CompanyDetailRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <CompanyDetailScreen slug={slug} />;
}