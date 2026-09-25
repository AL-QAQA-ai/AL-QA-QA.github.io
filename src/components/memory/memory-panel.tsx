"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Search, X, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface MemoryItem {
  id: string;
  key: string;
  value: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export function MemoryPanel() {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const fetchMemories = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ userId: "current" });
      if (search) params.set("q", search);
      const res = await fetch(`/api/memory?${params}`);
      if (res.ok) {
        setMemories(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);

  const handleAdd = async () => {
    if (!newKey.trim() || !newValue.trim()) return;
    await fetch("/api/memory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "current",
        key: newKey.trim(),
        value: newValue.trim(),
        category: "user",
      }),
    });
    setNewKey("");
    setNewValue("");
    setShowAdd(false);
    fetchMemories();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/memory/${id}?userId=current`, { method: "DELETE" });
    fetchMemories();
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-5 h-5 text-purple-400" />
          <h2 className="text-lg font-semibold text-zinc-100">Memory</h2>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search memories..."
              className="pl-9"
            />
          </div>
          <Button size="sm" onClick={() => setShowAdd(!showAdd)}>
            {showAdd ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {showAdd && (
        <div className="p-4 border-b border-zinc-800 space-y-2">
          <Input
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="Key (e.g. project_name)"
          />
          <Input
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder="Value"
          />
          <Button size="sm" onClick={handleAdd} className="w-full">
            Save Memory
          </Button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading && <p className="text-sm text-zinc-500">Loading...</p>}
        {!loading && memories.length === 0 && (
          <p className="text-sm text-zinc-500 text-center py-8">
            No memories yet. Add one or ask the AI to remember something.
          </p>
        )}
        {memories.map((m) => (
          <div
            key={m.id}
            className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 group"
          >
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-200 truncate">{m.key}</p>
                <p className="text-sm text-zinc-400 mt-1">{m.value}</p>
                <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-zinc-800 text-zinc-500 rounded">
                  {m.category}
                </span>
              </div>
              <button
                onClick={() => handleDelete(m.id)}
                className="p-1 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
