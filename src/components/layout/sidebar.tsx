"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MessageSquare,
  Plus,
  Search,
  Folder,
  FileText,
  CheckSquare,
  Image,
  Video,
  BarChart3,
  Settings,
  ChevronLeft,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "New Chat", href: "/", icon: Plus },
  { name: "Conversations", href: "/conversations/", icon: MessageSquare },
  { name: "Projects", href: "/projects/", icon: Folder },
  { name: "Files", href: "/files/", icon: FileText },
  { name: "Tasks", href: "/tasks/", icon: CheckSquare },
  { name: "Images", href: "/images/", icon: Image },
  { name: "Videos", href: "/videos/", icon: Video },
  { name: "Analytics", href: "/analytics/", icon: BarChart3 },
  { name: "Settings", href: "/settings/", icon: Settings },
];

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ open = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [recentConversations, setRecentConversations] = useState<
    { id: string; title: string }[]
  >([]);

  useEffect(() => {
    const stored = localStorage.getItem("recentConversations");
    if (stored) {
      setRecentConversations(JSON.parse(stored));
    }
  }, []);

  // Mobile: close drawer on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleNavigate = useCallback(() => {
    onClose?.();
  }, [onClose]);

  const filteredConversations = recentConversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const panel = (
    <aside
      className={cn(
        "flex flex-col h-full bg-zinc-950 border-r border-zinc-800 transition-all duration-300 w-64",
        collapsed && "md:w-16"
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        {!collapsed && (
          <Link href="/" onClick={handleNavigate} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">Q</span>
            </div>
            <span className="text-white font-semibold text-sm">AL-QAQA AI</span>
          </Link>
        )}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:block p-1 rounded hover:bg-zinc-800 text-zinc-400"
            title={collapsed ? "Expand menu" : "Collapse menu"}
          >
            <ChevronLeft
              className={cn(
                "w-4 h-4 transition-transform",
                collapsed && "rotate-180"
              )}
            />
          </button>
          <button
            onClick={onClose}
            className="md:hidden p-1 rounded hover:bg-zinc-800 text-zinc-400"
            title="Close menu"
          >
            <ChevronLeft className="w-4 h-4 rotate-180" />
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={handleNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900",
                collapsed && "justify-center"
              )}
              title={collapsed ? item.name : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {!collapsed && filteredConversations.length > 0 && (
        <div className="border-t border-zinc-800 p-2">
          <div className="px-3 py-1 text-xs text-zinc-500 uppercase tracking-wider">
            Recent
          </div>
          {filteredConversations.slice(0, 5).map((conv) => (
            <Link
              key={conv.id}
              href="/"
              onClick={handleNavigate}
              className="flex items-center gap-2 px-3 py-1.5 rounded text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 truncate"
            >
              <MessageSquare className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{conv.title}</span>
            </Link>
          ))}
        </div>
      )}

      <div className="border-t border-zinc-800 p-2">
        <Link
          href="/login"
          onClick={handleNavigate}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900",
            collapsed && "justify-center"
          )}
          title={collapsed ? "Account" : undefined}
        >
          <User className="w-5 h-5" />
          {!collapsed && <span>Account</span>}
        </Link>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop: static sidebar */}
      <div className="hidden md:flex h-full">{panel}</div>

      {/* Mobile: overlay drawer */}
      <div
        className={cn(
          "fixed inset-0 z-40 md:hidden transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        aria-hidden={!open}
      >
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />
        <div
          className={cn(
            "absolute inset-y-0 left-0 h-full shadow-2xl transition-transform duration-300 ease-out",
            open ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {panel}
        </div>
      </div>
    </>
  );
}
