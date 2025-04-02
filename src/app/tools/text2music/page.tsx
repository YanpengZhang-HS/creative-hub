"use client";

import { useState } from 'react';
import { message } from 'antd';
import { backendApi } from '@/network';
import { InvokeTextToMusicSecsEnum } from '@/network/api';
import type { Task } from '@/types/task';
import { useTaskManager } from '../shared/hooks/useTaskManager';
import {
  AudioLengthSelector,
  Placeholder,
  PromptInput,
  TaskList,
  ToolPageLayout
} from '../shared/components';
import styles from '../shared/tools.module.css';

// Audio length options
const AUDIO_LENGTH_OPTIONS = [
  { value: InvokeTextToMusicSecsEnum._5, label: '5 seconds' },
  { value: InvokeTextToMusicSecsEnum._10, label: '10 seconds' },
  { value: InvokeTextToMusicSecsEnum._15, label: '15 seconds' },
  { value: InvokeTextToMusicSecsEnum._20, label: '20 seconds' },
];

export default function TextToMusicPage() {
  const [prompt, setPrompt] = useState('');
  const [audioSeconds, setAudioSeconds] = useState<InvokeTextToMusicSecsEnum>(InvokeTextToMusicSecsEnum._5);

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
    taskType: 'text_to_music',
    totalTime: 60 // Music generation is quicker than video
  });

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);

    try {
      const response = await backendApi.invokeTextToMusic(
        prompt,
        audioSeconds
      );
      if (response.status === 200) {
        const taskId = response.data.task_id;
        if (taskId) {
          const newTask: Task = {
            id: taskId,
            prompt: prompt.trim(),
            createdAt: response.data.created_at as number * 1000,
            status: response.data.status,
            taskType: 'text_to_music'
          };
          
          saveTasks([newTask, ...tasks]);
          checkTaskStatus(newTask);
          setPrompt('');
        }
      }
    } catch (error) {
      message.error({
        content: error instanceof Error ? error.message : 'Failed to generate audio',
        duration: 5,
        style: { marginTop: '20vh' }
      });
    } finally {
      setLoading(false);
    }
  };

  const isGenerateDisabled = !prompt.trim() || loading;
  
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
      mediaType="audio"
    />
  );

  // Prepare the left section content (form)
  const leftSectionContent = (
    <>
      <PromptInput
        value={prompt}
        onChange={setPrompt}
        disabled={loading}
        placeholder="Describe the music you want to create..."
      />
      
      <div className={styles.settingsSection}>
        <div className={styles.sectionTitle}>
          <span className={styles.icon}>⚙️</span>
          <span>Settings</span>
        </div>
        <div className={styles.settingsContent}>
          <AudioLengthSelector
            value={audioSeconds}
            onChange={(value: InvokeTextToMusicSecsEnum) => setAudioSeconds(value)}
            options={AUDIO_LENGTH_OPTIONS}
            disabled={loading}
          />
        </div>
      </div>
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
