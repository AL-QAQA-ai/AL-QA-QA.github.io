"use client";

import { CheckSquare } from "lucide-react";
import { PagePlaceholder } from "@/components/layout/page-placeholder";

export default function TasksPage() {
  return (
    <PagePlaceholder
      title="Tasks"
      icon={CheckSquare}
      description="Track your tasks and to-dos."
    />
  );
}
