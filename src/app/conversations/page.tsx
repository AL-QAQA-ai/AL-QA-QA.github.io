"use client";

import { MessageSquare } from "lucide-react";
import { PagePlaceholder } from "@/components/layout/page-placeholder";

export default function ConversationsPage() {
  return (
    <PagePlaceholder
      title="Conversations"
      icon={MessageSquare}
      description="Your chat history will appear here."
    />
  );
}
