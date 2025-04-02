"use client";

import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { backendApi } from '@/network';
import { TaskStatus } from '@/network/api';
import type { Task } from '@/types/task';
import { useTaskManager } from '../shared/hooks/useTaskManager';
import {
  Placeholder,
  PromptInput,
  TaskList,
  ToolPageLayout,
  VideoUploader
} from '../shared/components';
import type { RcFile } from 'antd/es/upload/interface';

export default function SoundEffectPage() {
  const [prompt, setPrompt] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [cachedVideoTasks, setCachedVideoTasks] = useState<Task[]>([]);

  const {
    tasks,
    isClient,
    loading,
    setLoading,
    taskStatusRef,
    saveTasks,
    checkTaskStatus,
    handleDeleteTask,
    formatRemainingTime
  } = useTaskManager({
    taskType: 'sound_effect'
  });

  // Load cached video tasks for reuse
  useEffect(() => {
    if (!isClient) return;

    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
      try {
        const parsedTasks = JSON.parse(savedTasks);
        // Get completed video tasks from cache
        let videoTasks = parsedTasks.filter((task: Task) => {
          return (task.taskType === 'text_to_video' || task.taskType === 'image_to_video') && 
                task.status === TaskStatus.Completed;
        });
        
        setCachedVideoTasks(videoTasks);
      } catch (error) {
        console.error('Failed to parse tasks:', error);
      }
    }
  }, [isClient]);

  const handleVideoUpload = (file: RcFile) => {
    setVideoFile(file);
    return false;
  };

  const handleDeleteVideo = () => {
    setVideoFile(null);
  };

  const handleSelectCachedVideo = (videoUrl: string) => {
    // Convert the URL to a File object
    fetch(videoUrl, {
      cache: 'reload'
    })
      .then(res => res.blob())
      .then(blob => {
        const filename = videoUrl.split('/').pop() || 'video.mp4';
        const file = new File([blob], filename, { type: 'video/mp4' });
        setVideoFile(file);
      })
      .catch(error => {
        console.error('Error fetching video:', error);
        message.error('Failed to load the selected video');
      });
  };

  const handleGenerate = async () => {
    if (!videoFile) {
      message.error('Please upload a video file');
      return;
    }
    
    setLoading(true);

    try {
      // Use default prompt if not provided
      const promptToUse = prompt.trim() || "Generate Sound Effect";
      
      const response = await backendApi.invokeSoundEffect(promptToUse, videoFile);
      if (response.status === 200) {
        const taskId = response.data.task_id;
        if (taskId) {
          const newTask: Task = {
            id: taskId,
            taskType: 'sound_effect',
            prompt: promptToUse,
            createdAt: response.data.created_at as number * 1000,
            status: response.data.status
          };
          
          saveTasks([newTask, ...tasks]);
          checkTaskStatus(newTask);
          message.success('Task created successfully');
          setPrompt('');
        }
      }
    } catch (error: any) {
      message.error(error.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const isGenerateDisabled = !videoFile || loading;
  
  // Prepare the placeholder content
  const placeholderContent = (
    <Placeholder />
  );

  // Prepare the task list content
  const taskListContent = (
    <TaskList
      tasks={tasks}
      taskStatusRef={taskStatusRef}
      formatRemainingTime={formatRemainingTime}
      onDeleteTask={handleDeleteTask}
      emptyContent={placeholderContent}
      mediaType="video"
    />
  );

  // Prepare the left section content (form)
  const leftSectionContent = (
    <>
      <VideoUploader
        videoFile={videoFile}
        onUpload={handleVideoUpload}
        onDelete={handleDeleteVideo}
        disabled={loading}
        cachedVideoTasks={cachedVideoTasks}
        onSelectCachedVideo={handleSelectCachedVideo}
      />

      <PromptInput
        value={prompt}
        onChange={setPrompt}
        disabled={loading}
        required={false}
        label="Prompt"
      />
    </>
  );

  return (
    <ToolPageLayout
      leftSection={leftSectionContent}
      rightSection={taskListContent}
      isClient={isClient}
      loading={loading}
      onGenerate={handleGenerate}
      isGenerateDisabled={isGenerateDisabled}
      placeholderContent={placeholderContent}
    />
  );
}
