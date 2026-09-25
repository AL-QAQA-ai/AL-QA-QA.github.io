"use client";

import Link from "next/link";
import { Sidebar } from "@/components/layout/sidebar";
import type { LucideIcon } from "lucide-react";

interface PagePlaceholderProps {
  title: string;
  icon: LucideIcon;
  description: string;
}

export function PagePlaceholder({
  title,
  icon: Icon,
  description,
}: PagePlaceholderProps) {
  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100">
      <Sidebar />
      <main className="flex-1 flex items-center justify-center px-4 min-w-0">
        <div className="w-full max-w-md text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Icon className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-2">{title}</h1>
          <p className="text-sm text-zinc-400 mb-6">{description}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-medium text-white transition-colors"
          >
            ← Back to Chat
          </Link>
        </div>
      </main>
    </div>
  );
}
