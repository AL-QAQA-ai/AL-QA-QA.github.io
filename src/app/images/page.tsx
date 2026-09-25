"use client";

import { Image } from "lucide-react";
import { PagePlaceholder } from "@/components/layout/page-placeholder";

export default function ImagesPage() {
  return (
    <PagePlaceholder
      title="Images"
      icon={Image}
      description="Your generated images will appear here."
    />
  );
}
