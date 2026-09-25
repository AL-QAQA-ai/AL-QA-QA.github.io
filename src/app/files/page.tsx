"use client";

import { FileText } from "lucide-react";
import { PagePlaceholder } from "@/components/layout/page-placeholder";

export default function FilesPage() {
  return (
    <PagePlaceholder
      title="Files"
      icon={FileText}
      description="Upload and manage your files."
    />
  );
}
