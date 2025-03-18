"use client";

import { Button, Input, Progress, message, Switch, Upload, Spin, Select, Modal } from 'antd';
import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './page.module.css';
import { backendApi } from '@/network';
import { TaskStatus, MLPipelineEnum } from '@/network/api';
import { samplePrompts } from '@/configs/prompt.config';
import Image from 'next/image';
import { API_CONFIG } from '@/configs/api.config';
import type { Task } from '@/types/task';
import { InvokeImageToVideoAspectRatioEnum } from '@/network/api';
import { ReloadOutlined, UploadOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import type { RcFile, UploadFile } from 'antd/es/upload/interface';

const { TextArea } = Input;
const TOTAL_TIME = 20 * 60; // 20 minutes in seconds

interface TaskTimerStatus {
  timer: NodeJS.Timeout;
  startTime: number;
  progress: number;
}

const formatRemainingTime = (progress: number | undefined) => {
  // 如果进度未定义或为0，返回空字符串
  if (progress === undefined || progress === 0) return '';
  if (progress >= 99) return '< 1 min';
  
  const remainingSeconds = TOTAL_TIME * (1 - progress / 100);
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = Math.floor(remainingSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// 提取占位内容为组件以保持一致性
const PlaceholderContent = ({ aspectRatio }: { aspectRatio: InvokeImageToVideoAspectRatioEnum }) => (
  <div className={styles.taskList}>
    <div className={styles.taskItem}>
      <div className={styles.taskContent} data-aspect-ratio={
        aspectRatio === InvokeImageToVideoAspectRatioEnum._169 ? "16:9" :
        aspectRatio === InvokeImageToVideoAspectRatioEnum._916 ? "9:16" :
        aspectRatio === InvokeImageToVideoAspectRatioEnum._11 ? "1:1" : "16:9"
      }>
        <div className={styles.placeholder}>
          <Image
            src="/create_guide.svg"
            alt="Start Creating"
            width={180}
            height={180}
            priority
          />
          <p>Create your first masterpiece!</p>
        </div>
      </div>
      <div className={styles.taskInfo}>
        <p className={styles.taskPrompt}>Upload an image and create amazing videos!</p>
        <p className={styles.taskTime}>{new Date().toLocaleString()}</p>
      </div>
    </div>
  </div>
);

export default function ImageToVideoPage() {
  const [prompt, setPrompt] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(false);
  const taskStatusRef = useRef<{ [key: string]: TaskTimerStatus }>({});
  const [aspectRatio, setAspectRatio] = useState<InvokeImageToVideoAspectRatioEnum>(InvokeImageToVideoAspectRatioEnum._169);
  const [negativePrompt, setNegativePrompt] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [textToImageTasks, setTextToImageTasks] = useState<Task[]>([]);
  const [imageLoading, setImageLoading] = useState(false);
  const [modelPipeline, setModelPipeline] = useState<MLPipelineEnum>(MLPipelineEnum.CosmosImageToVideoV1);

  // 处理客户端初始化
  useEffect(() => {
    setIsClient(true);
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
      try {
        const parsedTasks = JSON.parse(savedTasks);
        let filterTasks = parsedTasks.filter((task) => {
          return  task.taskType === 'image_to_video';
        });
      
        setTasks(filterTasks);
        // 恢复进行中任务的状态检查
        filterTasks.forEach((task: Task) => {
          if (task.status === TaskStatus.Processing || task.status === TaskStatus.Pending) {
            checkTaskStatus(task);
          }
        });
      } catch (error) {
        console.error('Failed to parse tasks:', error);
      }
    }
    
    // 加载Text to Image任务
    const savedImageTasks = localStorage.getItem('tasks');
    if (savedImageTasks) {
      try {
        const parsedImageTasks = JSON.parse(savedImageTasks);
        let filterTasks = parsedImageTasks.filter((task) => {
          return  task.taskType === 'text_to_image';
        });
        // 只保留已完成且有图片URL的任务
        const completedImageTasks = filterTasks.filter(
          (task: Task) => task.status === TaskStatus.Completed && task.imageUrl
        );
        setTextToImageTasks(completedImageTasks);
      } catch (error) {
        console.error('Failed to parse image tasks:', error);
      }
    }
    
    // 确保第一次进入页面时图片选择区域为空白状态
    setImagePreview(null);
    setImageFile(null);
    // 清除选择的图片URL
    localStorage.removeItem('selected_image_url');
  }, []);

  // 保存任务到 localStorage
  const saveTasks = useCallback((newTasks: Task[]) => {
    const existingTasksStr = localStorage.getItem('tasks');
    let allTasks: Task[] = [];
    
    if (existingTasksStr) {
      try {
        const existingTasks = JSON.parse(existingTasksStr);
        // Filter out any tasks that would be duplicated by the new tasks
        allTasks = existingTasks.filter((task: Task) => 
          !newTasks.some(newTask => newTask.id === task.id)
        );
      } catch (error) {
        console.error('Failed to parse existing tasks:', error);
      }
    }
    
    // Combine existing tasks with new tasks
    const combinedTasks = [...newTasks, ...allTasks];
    localStorage.setItem('tasks', JSON.stringify(combinedTasks));
    setTasks(newTasks);
  }, []);

  // 更新任务状态
  const updateTaskStatus = useCallback((taskId: string, updates: Partial<Task>) => {
    setTasks(prevTasks => {
      const newTasks = prevTasks.map(task => 
        task.id === taskId ? { ...task, ...updates } : task
      );
      const existingTasksStr = localStorage.getItem('tasks');
      let allTasks: Task[] = [];
      
      if (existingTasksStr) {
        try {
          const existingTasks = JSON.parse(existingTasksStr);
          // Filter out any tasks that would be duplicated by the new tasks
          allTasks = existingTasks.filter((task: Task) => 
            !newTasks.some(newTask => newTask.id === task.id)
          );
        } catch (error) {
          console.error('Failed to parse existing tasks:', error);
        }
      }
      
      // Combine existing tasks with new tasks
      const combinedTasks = [...newTasks, ...allTasks];
      localStorage.setItem('tasks', JSON.stringify(combinedTasks));
      return newTasks;
    });
  }, []);

  const checkTaskStatus = useCallback((task: Task) => {
    if (!task) return;
    const taskId = task.id;
    if (taskStatusRef.current[taskId]?.timer) {
      clearInterval(taskStatusRef.current[taskId].timer);
    }
    // 找到对应任务的创建时间

    taskStatusRef.current[taskId] = {
      startTime: task.createdAt / 1000,
      progress: 0,
      timer: setInterval(() => {
        const now = Date.now() / 1000;
        const elapsed = Math.floor(now - taskStatusRef.current[taskId].startTime);
        const percentage = Math.min((elapsed / TOTAL_TIME) * 100, 99);
        
        taskStatusRef.current[taskId].progress = percentage;
        updateTaskStatus(taskId, { status: TaskStatus.Processing });

        if (elapsed % 60 === 0) {
          backendApi.getTaskStatus(taskId).then((response) => {
            if (response.status === 200) {
              if (response.data.status === TaskStatus.Completed) {
                const videoUrl = API_CONFIG.getVideoUrl(taskId);
                updateTaskStatus(taskId, { 
                  status: TaskStatus.Completed,
                  videoUrl 
                });
                clearInterval(taskStatusRef.current[taskId].timer);
                delete taskStatusRef.current[taskId];
              } else if (response.data.status === TaskStatus.Failed) {
                updateTaskStatus(taskId, { 
                  status: TaskStatus.Failed,
                  error: response.data.error || 'Failed to generate video'
                });
                clearInterval(taskStatusRef.current[taskId].timer);
                delete taskStatusRef.current[taskId];
                message.error({
                  content: response.data.error || 'Failed to generate video',
                  duration: 5,
                  style: { marginTop: '20vh' }
                });
              }
            }
          });
        }
      }, 1000)
    };
  }, [tasks, updateTaskStatus]);

  const handleGenerate = async () => {
    // 检查是否有图片文件或者选择的图片URL
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
      // 如果prompt为空，使用默认文本或空字符串
      const promptToUse = prompt.trim() || "Generate video";
      
      let response;
      
      // 如果有图片文件，直接使用
      if (imageFile) {
        response = await backendApi.invokeImageToVideo(promptToUse, imageFile, negativePrompt, aspectRatio, modelPipeline);
      } 
      // 如果没有图片文件但有预览图片（从Text to Image选择的图片）
      else if (imagePreview && selectedImageUrl) {
        // 显示正在处理的消息
        message.loading({
          content: 'Processing selected image...',
          key: 'imageProcessing'
        });
        
        try {
          // 尝试从URL下载图片并转换为File对象
          const imgResponse = await fetch(selectedImageUrl);
          const blob = await imgResponse.blob();
          const file = new File([blob], 'image.png', { type: 'image/png' });
          
          // 使用下载的文件调用API
          response = await backendApi.invokeImageToVideo(promptToUse, file, negativePrompt, aspectRatio, modelPipeline);
          
          // 关闭处理消息
          message.destroy('imageProcessing');
        } catch (error) {
          console.error('Error processing image:', error);
          
          // 关闭处理消息
          message.destroy('imageProcessing');
          
          // 显示错误消息
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
          // 清除选择的图片URL
          localStorage.removeItem('selected_image_url');
          
          // 重置图片选择区域为空白状态
          setImageFile(null);
          setImagePreview(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
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

  // 清理定时器
  useEffect(() => {
    return () => {
      Object.values(taskStatusRef.current).forEach(status => {
        clearInterval(status.timer);
      });
      taskStatusRef.current = {};
    };
  }, []);

  const handleRandomPrompt = () => {
    const randomIndex = Math.floor(Math.random() * samplePrompts.length);
    setPrompt(samplePrompts[randomIndex]);
  };

  const handleHintClick = (hint: string) => {
    setPrompt(hint);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      // 检查文件类型
      if (!file.type.startsWith('image/')) {
        message.error({
          content: 'Please upload an image file',
          duration: 3,
          style: { marginTop: '20vh' }
        });
        return;
      }
      
      // 检查文件大小（最大25MB）
      if (file.size > 25 * 1024 * 1024) {
        message.error({
          content: 'Image size should be less than 25MB',
          duration: 3,
          style: { marginTop: '20vh' }
        });
        return;
      }
      
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerImageUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // 添加删除图片功能
  const handleDeleteImage = (e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡，避免触发上传
    setImageFile(null);
    setImagePreview(null);
    // 清除localStorage中的图片URL
    localStorage.removeItem('selected_image_url');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 处理点击Text to Image图片
  const handleSelectTextToImageTask = (imageUrl: string) => {
    // 设置loading状态
    setImageLoading(true);
    
    // 创建一个Image对象来预加载图片
    const img = document.createElement('img');
    
    // 图片加载完成后的处理
    img.onload = () => {
      // 图片加载完成，设置预览
      setImagePreview(imageUrl);
      
      // 清除之前的文件选择，确保使用新选择的图片
      setImageFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // 存储URL到localStorage
      localStorage.setItem('selected_image_url', imageUrl);
      
      // 结束loading状态
      setImageLoading(false);
    };
    
    // 图片加载失败的处理
    img.onerror = () => {
      // 图片加载失败
      console.error('Failed to load image');
      message.error({
        content: 'Failed to load image',
        duration: 3,
        style: { marginTop: '20vh' }
      });
      
      // 清除预览，确保Create按钮保持禁用状态
      setImagePreview(null);
      
      // 结束loading状态
      setImageLoading(false);
    };
    
    // 开始加载图片
    img.src = imageUrl;
  };

  const isPromptEmpty = !prompt.trim();
  const isImageEmpty = !imageFile && !imagePreview;

  const handleDeleteTask = useCallback((taskId: string) => {
    Modal.confirm({
      title: 'Delete Task',
      content: 'Are you sure you want to delete this task? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => {
        // Remove from local state immediately
        setTasks(prevTasks => {
          const newTasks = prevTasks.filter(task => task.id !== taskId);
          
          // Update localStorage
          const existingTasksStr = localStorage.getItem('tasks');
          if (existingTasksStr) {
            try {
              const existingTasks = JSON.parse(existingTasksStr);
              const updatedTasks = existingTasks.filter((task: Task) => task.id !== taskId);
              localStorage.setItem('tasks', JSON.stringify(updatedTasks));
            } catch (error) {
              console.error('Failed to update tasks in localStorage:', error);
            }
          }
          
          return newTasks;
        });

        // Clear the timer if it exists
        if (taskStatusRef.current[taskId]?.timer) {
          clearInterval(taskStatusRef.current[taskId].timer);
          delete taskStatusRef.current[taskId];
        }

        message.success('Task deleted successfully');

        // Call backend API in the background
        backendApi.deleteTask(taskId).catch(error => {
          console.error('Error deleting task from backend:', error);
          message.error('Failed to delete task from server');
        });
      },
    });
  }, []);

  // 在渲染时检查是否是客户端
  if (!isClient) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.mainContent}>
          <div className={styles.leftSection}>
            <div className={styles.settingItem}>
              <div className={styles.sectionTitle} style={{ marginBottom: 0 }}>
                <span className={styles.icon}>🤖</span>
                <span>Model</span>
              </div>
              <Select
                className={styles.modelSelect}
                value={modelPipeline}
                onChange={(value) => setModelPipeline(value)}
                options={[
                  { value: MLPipelineEnum.CosmosImageToVideoV1, label: MLPipelineEnum.CosmosImageToVideoV1 },
                  { value: MLPipelineEnum.SkyreelsImageToVideoV1, label: MLPipelineEnum.SkyreelsImageToVideoV1 },
                ]}
                style={{ width: '70%' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}></div>

            <div className={styles.sectionTitle}>
              <span className={styles.icon}>🖼️</span>
              <span>Image</span>
            </div>
            <div className={styles.imageUploadSection}>
              <div className={styles.uploadContainer} onClick={triggerImageUpload}>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={loading}
                />
                <UploadOutlined className={styles.uploadIcon} />
                <div className={styles.uploadText}>Click to upload an image</div>
              </div>
            </div>
            
            <div className={styles.sectionTitle}>
              <span className={styles.icon}>✨</span>
              <span>Prompt (Optional)</span>
            </div>
            <div className={styles.inputWrapper}>
              <TextArea
                value=""
                placeholder="Enter text to describe what you want to generate. Check the tutorial for better results."
                className={styles.input}
                disabled
              />
            </div>
            
            <div className={styles.settingsSection}>
              <div className={styles.sectionTitle}>
                <span className={styles.icon}>⚙️</span>
                <span>Settings</span>
              </div>
              <div className={styles.settingsContent}>
                <div className={styles.settingItem}>
                  <span className={styles.settingLabel}>Aspect Ratio</span>
                  <div className={styles.aspectRatioButtons}>
                    <Button
                      type={aspectRatio === InvokeImageToVideoAspectRatioEnum._169 ? 'primary' : 'default'}
                      onClick={() => setAspectRatio(InvokeImageToVideoAspectRatioEnum._169)}
                      className={styles.aspectButton}
                    >
                      16:9
                    </Button>
                    <Button
                      type={aspectRatio === InvokeImageToVideoAspectRatioEnum._916 ? 'primary' : 'default'}
                      onClick={() => setAspectRatio(InvokeImageToVideoAspectRatioEnum._916)}
                      className={styles.aspectButton}
                    >
                      9:16
                    </Button>
                    <Button
                      type={aspectRatio === InvokeImageToVideoAspectRatioEnum._11 ? 'primary' : 'default'}
                      onClick={() => setAspectRatio(InvokeImageToVideoAspectRatioEnum._11)}
                      className={styles.aspectButton}
                    >
                      1:1
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.negativePromptSection}>
              <div className={styles.sectionTitle}>
                <span className={styles.icon}>⛔</span>
                <span>Negative Prompt (Optional)</span>
              </div>
              <div className={styles.inputWrapper}>
                <TextArea
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  placeholder="Enter elements you don't want to appear in the generated video"
                  className={styles.input}
                  disabled={loading}
                />
              </div>
            </div>

            <div className={styles.buttonGroup}>
              <Button
                className={styles.generateButton}
                type="primary"
                onClick={handleGenerate}
                loading={loading}
                disabled={isImageEmpty || loading}
              >
                Create
              </Button>
            </div>
          </div>
          <div className={styles.rightSection}>
            <PlaceholderContent aspectRatio={aspectRatio} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.mainContent}>
        <div className={styles.leftSection}>
          <div className={styles.settingItem}>
            <div className={styles.sectionTitle} style={{ marginBottom: 0 }}>
              <span className={styles.icon}>🤖</span>
              <span>Model</span>
            </div>
            <Select
              className={styles.modelSelect}
              value={modelPipeline}
              onChange={(value) => setModelPipeline(value)}
              options={[
                { value: MLPipelineEnum.CosmosImageToVideoV1, label: MLPipelineEnum.CosmosImageToVideoV1 },
                { value: MLPipelineEnum.SkyreelsImageToVideoV1, label: MLPipelineEnum.SkyreelsImageToVideoV1 },
              ]}
              style={{ width: '70%' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}></div>

          <div className={styles.sectionTitle}>
            <span className={styles.icon}>🖼️</span>
            <span>Image</span>
          </div>
          <div className={styles.imageUploadSection}>
            <div className={styles.uploadContainer} onClick={imageLoading ? undefined : triggerImageUpload}>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={handleImageUpload}
                disabled={loading || imageLoading}
              />
              {imagePreview ? (
                <>
                  <img src={imagePreview} alt="Uploaded" className={styles.uploadedImage} />
                  {imageLoading && (
                    <div className={styles.uploadLoading}>
                      <div>
                        <Spin size="small" />
                        <div className={styles.uploadLoadingText}>Loading image...</div>
                      </div>
                    </div>
                  )}
                  <div className={styles.uploadOverlay}>
                    <div className={styles.replaceButton}>{imageLoading ? "Loading..." : "Replace Image"}</div>
                  </div>
                  <Button
                    icon={<DeleteOutlined />}
                    className={styles.deleteImageButton}
                    onClick={handleDeleteImage}
                    type="primary"
                    danger
                  />
                </>
              ) : (
                <>
                  <UploadOutlined className={styles.uploadIcon} />
                  <div className={styles.uploadText}>Click to upload an image</div>
                </>
              )}
            </div>
          </div>
          
          {/* 添加Text to Image图片列表 */}
          {textToImageTasks.length > 0 && (
            <div className={styles.createdImagesSection}>
              <div className={styles.createdImagesTitle}>From Creations</div>
              <div className={styles.createdImagesList}>
                {textToImageTasks.map(task => (
                  <div 
                    key={task.id} 
                    className={styles.createdImageItem}
                    onClick={() => handleSelectTextToImageTask(task.imageUrl!)}
                  >
                    <img src={task.imageUrl!} alt={task.prompt} />
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className={styles.sectionTitle}>
            <span className={styles.icon}>✨</span>
            <span>Prompt (Optional)</span>
          </div>
          <div className={styles.inputWrapper}>
            <TextArea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter text to describe what you want to generate. Check the tutorial for better results."
              className={styles.input}
              disabled={loading}
            />
          </div>
          
          <div className={styles.settingsSection}>
            <div className={styles.sectionTitle}>
              <span className={styles.icon}>⚙️</span>
              <span>Settings</span>
            </div>
            <div className={styles.settingsContent}>
              <div className={styles.settingItem}>
                <span className={styles.settingLabel}>Aspect Ratio</span>
                <div className={styles.aspectRatioButtons}>
                  <Button
                    type={aspectRatio === InvokeImageToVideoAspectRatioEnum._169 ? 'primary' : 'default'}
                    onClick={() => setAspectRatio(InvokeImageToVideoAspectRatioEnum._169)}
                    className={styles.aspectButton}
                  >
                    16:9
                  </Button>
                  <Button
                    type={aspectRatio === InvokeImageToVideoAspectRatioEnum._916 ? 'primary' : 'default'}
                    onClick={() => setAspectRatio(InvokeImageToVideoAspectRatioEnum._916)}
                    className={styles.aspectButton}
                  >
                    9:16
                  </Button>
                  <Button
                    type={aspectRatio === InvokeImageToVideoAspectRatioEnum._11 ? 'primary' : 'default'}
                    onClick={() => setAspectRatio(InvokeImageToVideoAspectRatioEnum._11)}
                    className={styles.aspectButton}
                  >
                    1:1
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.negativePromptSection}>
            <div className={styles.sectionTitle}>
              <span className={styles.icon}>⛔</span>
              <span>Negative Prompt (Optional)</span>
            </div>
            <div className={styles.inputWrapper}>
              <TextArea
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                placeholder="Enter elements you don't want to appear in the generated video"
                className={styles.input}
                disabled={loading}
              />
            </div>
          </div>

          <div className={styles.buttonGroup}>
            <Button
              className={styles.generateButton}
              type="primary"
              onClick={handleGenerate}
              loading={loading}
              disabled={isImageEmpty || loading}
            >
              Create
            </Button>
          </div>
        </div>

        <div className={styles.rightSection}>
          {tasks.length > 0 ? (
            <div className={styles.taskList}>
              {tasks.map(task => (
                <div key={task.id} className={styles.taskItem}>
                  <div className={styles.taskContent} data-aspect-ratio={
                    task.aspectRatio === InvokeImageToVideoAspectRatioEnum._169 ? "16:9" :
                    task.aspectRatio === InvokeImageToVideoAspectRatioEnum._916 ? "9:16" :
                    task.aspectRatio === InvokeImageToVideoAspectRatioEnum._11 ? "1:1" : "16:9"
                  }>
                    {task.status === TaskStatus.Processing ? (
                      <div className={styles.progressContainer}>
                        <Progress 
                          type="circle" 
                          percent={taskStatusRef.current[task.id]?.progress || 0}
                          format={(percent) => formatRemainingTime(percent)}
                          strokeColor={{
                            '0%': '#1668dc',
                            '100%': '#1677ff',
                          }}
                        />
                        <p className={styles.progressText}>Generating video...</p>
                      </div>
                    ) : task.status === TaskStatus.Completed && task.videoUrl ? (
                      <video
                        controls
                        className={styles.video}
                        src={task.videoUrl}
                      >
                        Your browser does not support video playback
                      </video>
                    ) : task.status === TaskStatus.Failed ? (
                      <div className={styles.errorContainer}>
                        <p className={styles.errorText}>{task.error || 'Failed to generate video'}</p>
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
          ) : (
            <PlaceholderContent aspectRatio={aspectRatio} />
          )}
        </div>
      </div>
    </div>
  );
} 