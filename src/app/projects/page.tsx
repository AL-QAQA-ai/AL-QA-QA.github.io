"use client";

import { Folder } from "lucide-react";
import { PagePlaceholder } from "@/components/layout/page-placeholder";

export default function ProjectsPage() {
  return (
    <PagePlaceholder
      title="Projects"
      icon={Folder}
      description="Organize your work into projects."
    />
  );
}
