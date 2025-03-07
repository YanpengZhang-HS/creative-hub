import { InvokeTextToVideoAspectRatioEnum, InvokeImageToVideoAspectRatioEnum, TaskStatus } from "@/network/api";

export type TaskType = 'text_to_video' | 'image_to_video' | 'video_to_video' | 'text_to_image' | 'lip_sync';

export const getTaskTypeDisplayValue = (taskType: TaskType): string => {
  switch (taskType) {
    case 'text_to_video':
      return 'Text to Video';
    case 'image_to_video':
      return 'Image to Video';
    case 'video_to_video':
      return 'Video to Video';
    case 'lip_sync':
      return 'Lip Sync';
    case 'text_to_image':
      return 'Text to Image';
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
  imageUrl?: string;
  error?: string;
  aspectRatio?: InvokeTextToVideoAspectRatioEnum | InvokeImageToVideoAspectRatioEnum;
}