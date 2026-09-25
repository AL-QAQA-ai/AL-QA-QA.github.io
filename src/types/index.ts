export interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  title: string;
  model: string | null;
  pinned: boolean;
  archived: boolean;
  category: string | null;
  createdAt: Date;
  updatedAt: Date;
  messages?: Message[];
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  toolCalls?: string | null;
  toolResults?: string | null;
  tokenCount?: number | null;
  createdAt: Date;
}

export interface Memory {
  id: string;
  key: string;
  value: string;
  category: string;
  project: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  tasks?: Task[];
  files?: FileItem[];
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FileItem {
  id: string;
  name: string;
  path: string;
  mimeType: string;
  size: number;
  createdAt: Date;
}

export interface UserSettings {
  theme: "dark" | "light" | "system";
  language: string;
  direction: "ltr" | "rtl";
  aiModel: string | null;
  fontSize: "small" | "medium" | "large";
  notifications: boolean;
  autoSave: boolean;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: Date;
}

export type Theme = "dark" | "light" | "system";
export type Direction = "ltr" | "rtl";
