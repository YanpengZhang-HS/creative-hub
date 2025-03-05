"use client";

import { Button, Input, Progress, message, Switch, Upload } from 'antd';
import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './page.module.css';
import { backendApi } from '@/network';
import { TaskStatus } from '@/network/api';
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
const PlaceholderContent = () => (
  <div className={styles.taskList}>
    <div className={styles.placeholder}>
      <Image
        src="/create_guide.svg"
        alt="Start Creating"
        width={240}
        height={240}
        priority
      />
      <p>Create your first masterpiece!</p>
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

  // 处理客户端初始化
  useEffect(() => {
    setIsClient(true);
    const savedTasks = localStorage.getItem('i2v_tasks');
    if (savedTasks) {
      try {
        const parsedTasks = JSON.parse(savedTasks);
        setTasks(parsedTasks);
        // 恢复进行中任务的状态检查
        parsedTasks.forEach((task: Task) => {
          if (task.status === TaskStatus.Processing || task.status === TaskStatus.Pending) {
            checkTaskStatus(task);
          }
        });
      } catch (error) {
        console.error('Failed to parse tasks:', error);
      }
    }
  }, []);

  // 保存任务到 localStorage
  const saveTasks = useCallback((newTasks: Task[]) => {
    localStorage.setItem('i2v_tasks', JSON.stringify(newTasks));
    setTasks(newTasks);
  }, []);

  // 更新任务状态
  const updateTaskStatus = useCallback((taskId: string, updates: Partial<Task>) => {
    setTasks(prevTasks => {
      const newTasks = prevTasks.map(task => 
        task.id === taskId ? { ...task, ...updates } : task
      );
      localStorage.setItem('i2v_tasks', JSON.stringify(newTasks));
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
    if (!imageFile) {
      message.error({
        content: '请上传图片',
        duration: 3,
        style: { marginTop: '20vh' }
      });
      return;
    }
    
    setLoading(true);

    try {
      // 如果prompt为空，使用默认文本或空字符串
      const promptToUse = prompt.trim() || "生成视频";
      const response = await backendApi.invokeImageToVideo(promptToUse, imageFile, negativePrompt, aspectRatio);
      if (response.status === 200) {
        const taskId = response.data.task_id;
        if (taskId) {
          const newTask: Task = {
            id: taskId,
            prompt: promptToUse,
            createdAt: response.data.created_at as number * 1000,
            status: response.data.status
          };
          
          saveTasks([newTask, ...tasks]);
          checkTaskStatus(newTask);
          setPrompt('');
          // 保留图片，方便用户继续使用相同图片创建新视频
        }
      } else {
        message.error({
          content: 'Failed to generate video',
          duration: 5,
          style: { marginTop: '20vh' }
        });
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isPromptEmpty = !prompt.trim();
  const isImageEmpty = !imageFile;

  // 在渲染时检查是否是客户端
  if (!isClient) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.mainContent}>
          <div className={styles.leftSection}>
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
              <span>Prompt (可选)</span>
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
                <span>Negative Prompt (可选)</span>
              </div>
              <div className={styles.inputWrapper}>
                <TextArea
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  placeholder="输入您不希望在生成的视频中出现的元素"
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
            <PlaceholderContent />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.mainContent}>
        <div className={styles.leftSection}>
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
              {imagePreview ? (
                <>
                  <img src={imagePreview} alt="Uploaded" className={styles.uploadedImage} />
                  <div className={styles.uploadOverlay}>
                    <div className={styles.replaceButton}>Replace Image</div>
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
          
          <div className={styles.sectionTitle}>
            <span className={styles.icon}>✨</span>
            <span>Prompt (可选)</span>
          </div>
          <div className={styles.inputWrapper}>
            <TextArea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="输入文本描述您想要生成的内容。查看教程获取更好的效果。"
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
              <span>Negative Prompt (可选)</span>
            </div>
            <div className={styles.inputWrapper}>
              <TextArea
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                placeholder="输入您不希望在生成的视频中出现的元素"
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
                  <div className={styles.taskContent}>
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
                    <p className={styles.taskPrompt}>{task.prompt}</p>
                    <p className={styles.taskTime}>
                      {new Date(task.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <PlaceholderContent />
          )}
        </div>
      </div>
    </div>
  );
} 