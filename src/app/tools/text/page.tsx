"use client";

import { useState } from 'react';
import { Tooltip, Switch } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { backendApi } from '@/network';
import { MLPipelineEnum, InvokeTextToVideoAspectRatioEnum } from '@/network/api';
import type { Task } from '@/types/task';
import { useTaskManager } from '../shared/hooks/useTaskManager';
import {
  AspectRatioSelector,
  ModelSelector,
  NegativePrompt,
  Placeholder,
  PromptInput,
  TaskList,
  ToolPageLayout
} from '../shared/components';
import styles from '../shared/tools.module.css';

export default function TextToVideoPage() {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<InvokeTextToVideoAspectRatioEnum>(InvokeTextToVideoAspectRatioEnum._169);
  const [disablePromptUpsampler, setDisablePromptUpsampler] = useState(false);
  const [negativePrompt, setNegativePrompt] = useState('');
  const [modelPipeline, setModelPipeline] = useState<MLPipelineEnum>(MLPipelineEnum.SkyreelsTextToVideoV1);

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
    taskType: 'text_to_video'
  });

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);

    try {
      const response = await backendApi.invokeTextToVideo(
        prompt,
        negativePrompt || undefined,
        aspectRatio,
        disablePromptUpsampler,
        modelPipeline
      );
      if (response.status === 200) {
        const taskId = response.data.task_id;
        if (taskId) {
          const newTask: Task = {
            id: taskId,
            taskType: 'text_to_video',
            prompt: prompt.trim(),
            createdAt: response.data.created_at as number * 1000,
            status: response.data.status,
            aspectRatio: aspectRatio
          };
          
          saveTasks([newTask, ...tasks]);
          checkTaskStatus(newTask);
          setPrompt('');
        }
      }
    } catch (error) {
      console.error('Failed to generate video:', error);
    } finally {
      setLoading(false);
    }
  };

  const isGenerateDisabled = !prompt.trim() || loading;
  
  // Prepare the aspect ratio options
  const aspectRatioOptions = [
    { value: InvokeTextToVideoAspectRatioEnum._169, label: '16:9' },
    { value: InvokeTextToVideoAspectRatioEnum._916, label: '9:16' },
    { value: InvokeTextToVideoAspectRatioEnum._11, label: '1:1' }
  ];

  // Prepare the model options
  const modelOptions = [
    { value: MLPipelineEnum.SkyreelsTextToVideoV1 },
    { value: MLPipelineEnum.CosmosTextToVideoV1 },
    { value: MLPipelineEnum.WanTextToVideoV1 }
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
      emptyContent={placeholderContent}
      mediaType="video"
    />
  );

  // Prepare the left section content (form)
  const leftSectionContent = (
    <>
      <ModelSelector
        value={modelPipeline}
        onChange={(value: MLPipelineEnum) => setModelPipeline(value)}
        options={modelOptions}
        disabled={loading}
      />

      <div style={{ marginBottom: '8px' }}></div>

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
            onAspectRatioChange={(value: InvokeTextToVideoAspectRatioEnum) => setAspectRatio(value)}
            options={aspectRatioOptions}
            disabled={loading}
          />
          <div className={styles.settingItem}>
            <span className={styles.settingLabel}>
              Prompt Optimization
              <Tooltip title="Enable prompt upsampler with LLM">
                <InfoCircleOutlined style={{ marginLeft: '8px' }} />
              </Tooltip>
            </span>
            <Switch
              checked={!disablePromptUpsampler}
              onChange={(checked) => setDisablePromptUpsampler(!checked)}
              disabled={loading}
            />
          </div>
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
