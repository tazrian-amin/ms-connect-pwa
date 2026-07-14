import { notFound } from "next/navigation";
import { DeviceDetailsPage } from "@/components/device/device-details-page";
import { DEVICE_CATEGORIES, getCategoryById } from "@/lib/bluetooth/categories";

export function generateStaticParams() {
  return DEVICE_CATEGORIES.map((category) => ({ categoryId: category.id }));
}

export default async function DevicePage({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  const { categoryId } = await params;
  const category = getCategoryById(categoryId);

  if (!category) {
    notFound();
  }

  return <DeviceDetailsPage category={category} />;
}
