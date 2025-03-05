import { TaskStatus } from "@/network/api";

export type TaskType = 'text_to_video' | 'image_to_video' | 'video_to_video';

export const getTaskTypeDisplayValue = (taskType: TaskType): string => {
  switch (taskType) {
    case 'text_to_video':
      return 'Text to Video';
    case 'image_to_video':
      return 'Iamge to Video';
    case 'video_to_video':
      return 'Video to Video';
    default:
      return '';
  }
};

export interface Task {
  id: string;
  taskType: TaskType;
  prompt: string;
  createdAt: number;
  status: TaskStatus;
  videoUrl?: string;
  error?: string;
} 