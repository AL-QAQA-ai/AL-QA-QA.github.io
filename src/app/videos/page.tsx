"use client";

import { Video } from "lucide-react";
import { PagePlaceholder } from "@/components/layout/page-placeholder";

export default function VideosPage() {
  return (
    <PagePlaceholder
      title="Videos"
      icon={Video}
      description="Your generated videos will appear here."
    />
  );
}
