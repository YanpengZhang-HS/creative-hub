"use client";

import { useState, useEffect, useRef } from 'react';
import { message } from 'antd';
import { backendApi } from '@/network';
import { TaskStatus, MLPipelineEnum, InvokeImageToVideoAspectRatioEnum } from '@/network/api';
import type { Task } from '@/types/task';
import { useTaskManager } from '../shared/hooks/useTaskManager';
import {
  AspectRatioSelector,
  ImageUploader,
  ModelSelector,
  NegativePrompt,
  Placeholder,
  PromptInput,
  TaskList,
  ToolPageLayout
} from '../shared/components';
import styles from '../shared/tools.module.css';

export default function ImageToVideoPage() {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<InvokeImageToVideoAspectRatioEnum>(InvokeImageToVideoAspectRatioEnum._169);
  const [negativePrompt, setNegativePrompt] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [modelPipeline, setModelPipeline] = useState<MLPipelineEnum>(MLPipelineEnum.SkyreelsImageToVideoV1);
  const [textToImageTasks, setTextToImageTasks] = useState<Task[]>([]);
  const leftSectionRef = useRef<HTMLDivElement>(null);

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
    taskType: 'image_to_video'
  });

  // Load text-to-image tasks for the image selector
  useEffect(() => {
    if (!isClient) return;

    const savedImageTasks = localStorage.getItem('tasks');
    if (savedImageTasks) {
      try {
        const parsedImageTasks = JSON.parse(savedImageTasks);
        let filterTasks = parsedImageTasks.filter((task: Task) => {
          return task.taskType === 'text_to_image';
        });
        // Only keep completed tasks with an image URL
        const completedImageTasks = filterTasks.filter(
          (task: Task) => task.status === TaskStatus.Completed && task.imageUrl
        );
        setTextToImageTasks(completedImageTasks);
      } catch (error) {
        console.error('Failed to parse image tasks:', error);
      }
    }
    
    // Clear any previously selected image
    setImagePreview(null);
    setImageFile(null);
    localStorage.removeItem('selected_image_url');
  }, [isClient]);

  // Handle nested scroll effect for the left section
  useEffect(() => {
    const leftSection = leftSectionRef.current;
    if (!leftSection) return;

    const handleWheel = (e: WheelEvent) => {
      const { deltaY } = e;
      const { scrollTop, scrollHeight, clientHeight } = leftSection;
      
      // Check if at top or bottom
      const isAtTop = scrollTop <= 0;
      const isAtBottom = scrollHeight - scrollTop - clientHeight <= 1;
      
      // If at the top and scrolling up, or at the bottom and scrolling down, let the page scroll
      if ((isAtTop && deltaY < 0) || (isAtBottom && deltaY > 0)) {
        return;
      }
      
      // Otherwise prevent default and handle the scroll in the left section
      if (scrollHeight > clientHeight) {
        e.preventDefault();
        leftSection.scrollTop += deltaY;
      }
    };

    leftSection.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      leftSection.removeEventListener('wheel', handleWheel);
    };
  }, []);

  const handleImageUpload = (file: File) => {
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteImage = () => {
    setImageFile(null);
    setImagePreview(null);
    localStorage.removeItem('selected_image_url');
  };

  const handleSelectPreviousImage = (imageUrl: string) => {
    // Set loading state
    setImageLoading(true);
    
    // Create an Image object to preload
    const img = document.createElement('img');
    
    // Handle successful image load
    img.onload = () => {
      setImagePreview(imageUrl);
      setImageFile(null);
      localStorage.setItem('selected_image_url', imageUrl);
      setImageLoading(false);
    };
    
    // Handle image load failure
    img.onerror = () => {
      console.error('Failed to load image');
      message.error({
        content: 'Failed to load image',
        duration: 3,
        style: { marginTop: '20vh' }
      });
      setImagePreview(null);
      setImageLoading(false);
    };
    
    // Start loading the image
    img.src = imageUrl;
  };

  const handleGenerate = async () => {
    // Check if there's an image file or a selected image
    const selectedImageUrl = localStorage.getItem('selected_image_url');
    
    if (!imageFile && !imagePreview) {
      message.error({
        content: 'Please upload or select an image',
        duration: 3,
        style: { marginTop: '20vh' }
      });
      return;
    }
    
    setLoading(true);

    try {
      // Use default prompt if not provided
      const promptToUse = prompt.trim() || "Generate video";
      
      let response;
      
      // If we have a file, use it directly
      if (imageFile) {
        response = await backendApi.invokeImageToVideo(
          promptToUse, 
          imageFile, 
          negativePrompt, 
          aspectRatio, 
          modelPipeline
        );
      } 
      // If we have a selected image URL but no file
      else if (imagePreview && selectedImageUrl) {
        message.loading({
          content: 'Processing selected image...',
          key: 'imageProcessing'
        });
        
        try {
          // Download the image and convert to a File object
          const imgResponse = await fetch(selectedImageUrl, {
            cache: 'reload'
          });
          const blob = await imgResponse.blob();
          const file = new File([blob], 'image.png', { type: 'image/png' });
          
          // Call the API with the file
          response = await backendApi.invokeImageToVideo(
            promptToUse, 
            file, 
            negativePrompt, 
            aspectRatio, 
            modelPipeline
          );
          
          message.destroy('imageProcessing');
        } catch (error) {
          console.error('Error processing image:', error);
          message.destroy('imageProcessing');
          message.error({
            content: 'Failed to process the selected image. Please try uploading it manually.',
            duration: 5,
            style: { marginTop: '20vh' }
          });
          setLoading(false);
          return;
        }
      }
      
      if (response && response.status === 200) {
        const taskId = response.data.task_id;
        if (taskId) {
          const newTask: Task = {
            id: taskId,
            taskType: 'image_to_video',
            prompt: promptToUse,
            createdAt: response.data.created_at as number * 1000,
            status: response.data.status,
            aspectRatio: aspectRatio
          };
          
          saveTasks([newTask, ...tasks]);
          checkTaskStatus(newTask);
          setPrompt('');
          
          // Reset the image selection
          localStorage.removeItem('selected_image_url');
          setImageFile(null);
          setImagePreview(null);
        }
      } else {
        throw new Error('Failed to generate video');
      }
    } catch (error) {
      message.error({
        content: error instanceof Error ? error.message : 'Failed to generate video',
        duration: 5,
        style: { marginTop: '20vh' }
      });
    } finally {
      setLoading(false);
    }
  };

  const isGenerateDisabled = (!imageFile && !imagePreview) || loading;
  
  // Prepare the aspect ratio options
  const aspectRatioOptions = [
    { value: InvokeImageToVideoAspectRatioEnum._169, label: '16:9' },
    { value: InvokeImageToVideoAspectRatioEnum._916, label: '9:16' },
    { value: InvokeImageToVideoAspectRatioEnum._11, label: '1:1' }
  ];

  // Prepare the model options
  const modelOptions = [
    { value: MLPipelineEnum.SkyreelsImageToVideoV1 },
    { value: MLPipelineEnum.CosmosImageToVideoV1 },
    { value: MLPipelineEnum.WanImageToVideoV1 }
  ];

  // Prepare the placeholder content with aspectRatio
  const placeholderContent = (
    <Placeholder aspectRatio={
      aspectRatio === InvokeImageToVideoAspectRatioEnum._169 ? "16:9" :
      aspectRatio === InvokeImageToVideoAspectRatioEnum._916 ? "9:16" :
      aspectRatio === InvokeImageToVideoAspectRatioEnum._11 ? "1:1" : "16:9"
    } />
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
    <div ref={leftSectionRef}>
      <ModelSelector
        value={modelPipeline}
        onChange={(value: MLPipelineEnum) => setModelPipeline(value)}
        options={modelOptions}
        disabled={loading}
      />

      <div style={{ marginBottom: '16px' }}></div>

      <ImageUploader
        imageFile={imageFile}
        imagePreview={imagePreview}
        imageLoading={imageLoading}
        onImageUpload={handleImageUpload}
        onImageDelete={handleDeleteImage}
        disabled={loading}
        textToImageTasks={textToImageTasks}
        onSelectPreviousImage={handleSelectPreviousImage}
      />
      
      <PromptInput
        value={prompt}
        onChange={setPrompt}
        disabled={loading}
        required={false}
      />

      <div className={styles.settingsSection}>
        <div className={styles.sectionTitle}>
          <span className={styles.icon}>⚙️</span>
          <span>Settings</span>
        </div>
        <div className={styles.settingsContent}>
          <AspectRatioSelector
            aspectRatio={aspectRatio}
            onAspectRatioChange={(value: InvokeImageToVideoAspectRatioEnum) => setAspectRatio(value)}
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
    </div>
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
