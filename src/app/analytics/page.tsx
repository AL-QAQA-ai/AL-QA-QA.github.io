"use client";

import { BarChart3 } from "lucide-react";
import { PagePlaceholder } from "@/components/layout/page-placeholder";

export default function AnalyticsPage() {
  return (
    <PagePlaceholder
      title="Analytics"
      icon={BarChart3}
      description="Usage and performance insights."
    />
  );
}
