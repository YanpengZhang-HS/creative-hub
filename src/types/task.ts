import { TaskStatus } from "@/network/api";

export interface Task {
  id: string;
  prompt: string;
  createdAt: number;
  status: TaskStatus;
  videoUrl?: string;
  error?: string;
  imageUrl?: string;
} 