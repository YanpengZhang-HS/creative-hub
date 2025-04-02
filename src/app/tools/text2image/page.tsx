"use client";

import { useState, useCallback } from 'react';
import { backendApi } from '@/network';
import { InvokeTextToVideoAspectRatioEnum } from '@/network/api';
import type { Task } from '@/types/task';
import { useTaskManager } from '../shared/hooks/useTaskManager';
import {
  AspectRatioSelector,
  NegativePrompt,
  Placeholder,
  PromptInput,
  TaskList,
  ToolPageLayout
} from '../shared/components';
import styles from '../shared/tools.module.css';

// Aspect ratio to dimensions mapping
const ASPECT_RATIO_DIMENSIONS = {
  [InvokeTextToVideoAspectRatioEnum._169]: { width: 1024, height: 576 },
  [InvokeTextToVideoAspectRatioEnum._11]: { width: 512, height: 512 },
  [InvokeTextToVideoAspectRatioEnum._916]: { width: 576, height: 1024 },
} as const;

export default function TextToImagePage() {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<InvokeTextToVideoAspectRatioEnum>(InvokeTextToVideoAspectRatioEnum._169);
  const [negativePrompt, setNegativePrompt] = useState('');
  const [width, setWidth] = useState<number>(1024);
  const [height, setHeight] = useState<number>(576);

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
    taskType: 'text_to_image',
    totalTime: 20 // Images generate faster than videos
  });

  // Handle changing aspect ratio and updating dimensions
  const handleAspectRatioChange = (newAspectRatio: InvokeTextToVideoAspectRatioEnum) => {
    const dimensions = ASPECT_RATIO_DIMENSIONS[newAspectRatio];
    setWidth(dimensions.width);
    setHeight(dimensions.height);
    setAspectRatio(newAspectRatio);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);

    try {
      const response = await backendApi.invokeTextToImage(
        prompt,
        negativePrompt || undefined,
        height,
        width
      );
      if (response.status === 200) {
        const taskId = response.data.task_id;
        if (taskId) {
          const newTask: Task = {
            id: taskId,
            prompt: prompt.trim(),
            createdAt: response.data.created_at as number * 1000,
            status: response.data.status,
            taskType: 'text_to_image',
          };
          
          saveTasks([newTask, ...tasks]);
          checkTaskStatus(newTask);
          setPrompt('');
        }
      }
    } catch (error) {
      console.error('Failed to generate image:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadImage = useCallback((task: Task) => {
    if (!task.imageUrl) return;
    
    const link = document.createElement('a');
    link.href = task.imageUrl;
    // Create a filename based on the prompt (limited to 30 chars) and add timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const sanitizedPrompt = task.prompt.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '_');
    link.download = `${sanitizedPrompt}_${timestamp}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const isGenerateDisabled = !prompt.trim() || loading;
  
  // Prepare the aspect ratio options
  const aspectRatioOptions = [
    { value: InvokeTextToVideoAspectRatioEnum._169, label: '16:9' },
    { value: InvokeTextToVideoAspectRatioEnum._916, label: '9:16' },
    { value: InvokeTextToVideoAspectRatioEnum._11, label: '1:1' }
  ];

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
      onDownloadTask={handleDownloadImage}
      emptyContent={placeholderContent}
      mediaType="image"
    />
  );

  // Prepare the left section content (form)
  const leftSectionContent = (
    <>
      <PromptInput
        value={prompt}
        onChange={setPrompt}
        disabled={loading}
      />

      <div className={styles.settingsSection}>
        <div className={styles.sectionTitle}>
          <span className={styles.icon}>⚙️</span>
          <span>Settings</span>
        </div>
        <div className={styles.settingsContent}>
          <AspectRatioSelector
            aspectRatio={aspectRatio}
            onAspectRatioChange={handleAspectRatioChange}
            options={aspectRatioOptions}
            disabled={loading}
          />
        </div>
      </div>

      <NegativePrompt
        value={negativePrompt}
        onChange={setNegativePrompt}
        disabled={loading}
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
