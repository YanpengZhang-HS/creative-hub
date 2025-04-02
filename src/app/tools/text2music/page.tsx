"use client";

import { useState } from 'react';
import { message, Progress, Button } from 'antd';
import { backendApi } from '@/network';
import { InvokeTextToMusicSecsEnum, TaskStatus } from '@/network/api';
import type { Task } from '@/types/task';
import { useTaskManager } from '../shared/hooks/useTaskManager';
import {
  AudioLengthSelector,
  Placeholder,
  PromptInput,
  ToolPageLayout
} from '../shared/components';
import styles from '../shared/tools.module.css';
import { DeleteOutlined } from '@ant-design/icons';

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

  // Custom task list for audio content
  const renderTaskList = () => {
    if (tasks.length === 0) {
      return <Placeholder />;
    }

    return (
      <div className={styles.taskList}>
        {tasks.map(task => (
          <div key={task.id} className={styles.taskItem}>
            <div className={styles.taskContent}>
              {task.status === TaskStatus.Processing ? (
                <div className={styles.progressContainer}>
                  <Progress 
                    percent={taskStatusRef.current[task.id]?.progress || 0}
                    strokeColor={{
                      '0%': '#1668dc',
                      '100%': '#1677ff',
                    }}
                    format={(percent) => (
                      <span className={styles.progressText}>
                        Generating Music... {formatRemainingTime(percent)}
                      </span>
                    )}
                  />
                </div>
              ) : task.status === TaskStatus.Completed && task.audioUrl ? (
                <audio
                  controls
                  className={styles.audio}
                  src={task.audioUrl}
                >
                  Your browser does not support audio playback
                </audio>
              ) : task.status === TaskStatus.Failed ? (
                <div className={styles.errorContainer}>
                  <p className={styles.errorText}>{task.error || 'Failed to generate audio'}</p>
                </div>
              ) : null}
            </div>
            <div className={styles.taskInfo}>
              <div className={styles.taskHeader}>
                <p className={styles.taskPrompt}>{task.prompt}</p>
                <Button
                  type="text"
                  icon={<DeleteOutlined />}
                  onClick={() => handleDeleteTask(task.id)}
                  className={styles.deleteButton}
                  danger
                />
              </div>
              <p className={styles.taskTime}>
                {new Date(task.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  // Prepare the placeholder content
  const placeholderContent = (
    <Placeholder />
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
      rightSection={renderTaskList()}
      isClient={isClient}
      loading={loading}
      onGenerate={handleGenerate}
      isGenerateDisabled={isGenerateDisabled}
      placeholderContent={placeholderContent}
    />
  );
}
