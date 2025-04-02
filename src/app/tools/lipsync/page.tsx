"use client";

import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { backendApi } from '@/network';
import { TaskStatus } from '@/network/api';
import type { Task } from '@/types/task';
import { useTaskManager } from '../shared/hooks/useTaskManager';
import {
  AudioTextToggle,
  AudioUploader,
  Placeholder,
  TaskList,
  TextToSpeechOptions,
  ToolPageLayout,
  VideoUploader
} from '../shared/components';
import type { RcFile } from 'antd/es/upload/interface';

// Constants for TTS options
const EMOTIONS = ["happy1", "happy2", "angry1", "angry2", "sad", "coquettish"];
const LANGUAGES = ["English", "Korean", "Japanese", "Chinese"];
const SPEEDS = ["slow1", "slow2", "fast1", "fast2"];
const SPEAKERS = ["Indian_man_3", "Indian_women_2"];

export default function LipSyncPage() {
  // State for file uploads
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  
  // Text-to-speech states
  const [inputType, setInputType] = useState<'audio' | 'text'>('audio');
  const [prompt, setPrompt] = useState('');
  const [emotion, setEmotion] = useState(EMOTIONS[0]);
  const [language, setLanguage] = useState(LANGUAGES[0]);
  const [speed, setSpeed] = useState(SPEEDS[0]);
  const [speaker, setSpeaker] = useState(SPEAKERS[0]);
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
    taskType: 'lip_sync'
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

  const handleAudioUpload = (file: RcFile) => {
    setAudioFile(file);
    return false;
  };

  const handleDeleteVideo = () => {
    setVideoFile(null);
  };

  const handleDeleteAudio = () => {
    setAudioFile(null);
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
    // Validate input
    if (!videoFile) {
      message.error('Please upload a video file');
      return;
    }

    if (inputType === 'audio' && !audioFile) {
      message.error('Please upload an audio file');
      return;
    }

    if (inputType === 'text' && !prompt) {
      message.error('Please enter text for speech generation');
      return;
    }
    
    setLoading(true);

    try {
      // Call the lip sync API
      const response = await backendApi.invokeLipSync(
        videoFile,
        'bytedance_lip_sync_v1',
        inputType === 'audio' && audioFile ? audioFile : undefined,
        inputType === 'text' ? prompt : undefined,
        inputType === 'text' ? emotion : undefined,
        inputType === 'text' ? language : undefined,
        inputType === 'text' ? speed : undefined,
        inputType === 'text' ? speaker : undefined
      );

      if (response.status === 200) {
        const taskId = response.data.task_id;
        if (taskId) {
          const newTask: Task = {
            id: taskId,
            taskType: 'lip_sync',
            prompt: inputType === 'audio' 
              ? `Lip sync: ${videoFile.name} with ${audioFile?.name}`
              : `Lip sync: ${videoFile.name} with "${prompt}"`,
            createdAt: response.data.created_at as number * 1000,
            status: response.data.status
          };
          
          saveTasks([newTask, ...tasks]);
          checkTaskStatus(newTask);
          message.success('Task created successfully');
        }
      }
    } catch (error: any) {
      message.error(error.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const handlePromptChange = useCallback((e: any) => {
    setPrompt(e.target.value);
  }, []);

  const handleInputTypeChange = (value: 'audio' | 'text') => {
    setInputType(value);
  };

  const isGenerateDisabled = !videoFile || (inputType === 'audio' ? !audioFile : !prompt) || loading;
  
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

      <AudioTextToggle 
        value={inputType}
        onChange={handleInputTypeChange}
        disabled={loading}
      />

      {inputType === 'audio' ? (
        <AudioUploader
          audioFile={audioFile}
          onUpload={handleAudioUpload}
          onDelete={handleDeleteAudio}
          disabled={loading}
        />
      ) : (
        <TextToSpeechOptions
          prompt={prompt}
          onPromptChange={setPrompt}
          emotion={emotion}
          onEmotionChange={setEmotion}
          language={language}
          onLanguageChange={setLanguage}
          speed={speed}
          onSpeedChange={setSpeed}
          speaker={speaker}
          onSpeakerChange={setSpeaker}
          emotions={EMOTIONS}
          languages={LANGUAGES}
          speeds={SPEEDS}
          speakers={SPEAKERS}
          disabled={loading}
        />
      )}
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
