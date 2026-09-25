"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Direction } from "@/types";

interface DirectionContextType {
  direction: Direction;
  setDirection: (dir: Direction) => void;
}

const DirectionContext = createContext<DirectionContextType | undefined>(undefined);

export function DirectionProvider({ children }: { children: React.ReactNode }) {
  const [direction, setDirectionState] = useState<Direction>("ltr");

  useEffect(() => {
    const stored = localStorage.getItem("direction") as Direction | null;
    if (stored) {
      setDirectionState(stored);
    }
  }, []);

  useEffect(() => {
    document.documentElement.dir = direction;
    localStorage.setItem("direction", direction);
  }, [direction]);

  const setDirection = (dir: Direction) => {
    setDirectionState(dir);
  };

  return (
    <DirectionContext.Provider value={{ direction, setDirection }}>
      {children}
    </DirectionContext.Provider>
  );
}

export function useDirection() {
  const context = useContext(DirectionContext);
  if (!context) {
    throw new Error("useDirection must be used within a DirectionProvider");
  }
  return context;
}
