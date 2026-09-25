"use client";

import { Settings } from "lucide-react";
import { PagePlaceholder } from "@/components/layout/page-placeholder";

export default function SettingsPage() {
  return (
    <PagePlaceholder
      title="Settings"
      icon={Settings}
      description="Configure AL-QAQA AI."
    />
  );
}
