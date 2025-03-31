"use client";

import { Button, Input, Progress, message, Switch, Tooltip, Select, Modal } from 'antd';
import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './page.module.css';
import { backendApi } from '@/network';
import { TaskStatus, MLPipelineEnum } from '@/network/api';
import { samplePrompts } from '@/configs/prompt.config';
import Image from 'next/image';
import { API_CONFIG } from '@/configs/api.config';
import type { Task } from '@/types/task';
import { InvokeTextToVideoAspectRatioEnum } from '@/network/api';
import { ReloadOutlined, InfoCircleOutlined, DeleteOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Option } = Select;
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

export default function TextToVideoPage() {
  const [prompt, setPrompt] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(false);
  const taskStatusRef = useRef<{ [key: string]: TaskTimerStatus }>({});
  const [aspectRatio, setAspectRatio] = useState<InvokeTextToVideoAspectRatioEnum>(InvokeTextToVideoAspectRatioEnum._169);
  const [disablePromptUpsampler, setDisablePromptUpsampler] = useState(false);
  const [negativePrompt, setNegativePrompt] = useState('');
  const [modelPipeline, setModelPipeline] = useState<MLPipelineEnum>(MLPipelineEnum.SkyreelsTextToVideoV1);

  // 处理客户端初始化
  useEffect(() => {
    setIsClient(true);
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
      try {
        const parsedTasks = JSON.parse(savedTasks);
        let filterTasks = parsedTasks.filter((task) => {
          return  task.taskType === 'text_to_video';
        });
      
        setTasks(filterTasks);
        filterTasks.forEach((task: Task) => {
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
    
    // Prevent multiple polling for the same task
    if (taskStatusRef.current[taskId]?.timer) {
      return;
    }

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
                if (taskStatusRef.current[taskId]?.timer) {
                  clearInterval(taskStatusRef.current[taskId].timer);
                  delete taskStatusRef.current[taskId];
                }
              } else if (response.data.status === TaskStatus.Failed) {
                updateTaskStatus(taskId, { 
                  status: TaskStatus.Failed,
                  error: response.data.error || 'Failed to generate video'
                });
                if (taskStatusRef.current[taskId]?.timer) {
                  clearInterval(taskStatusRef.current[taskId].timer);
                  delete taskStatusRef.current[taskId];
                }
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
  }, [updateTaskStatus]);

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

  // Add cleanup effect for timers
  useEffect(() => {
    return () => {
      // Cleanup all timers on unmount
      Object.values(taskStatusRef.current).forEach(status => {
        if (status.timer) {
          clearInterval(status.timer);
        }
      });
      taskStatusRef.current = {};
    };
  }, []);

  // Add effect to cleanup timers for completed or failed tasks
  useEffect(() => {
    tasks.forEach(task => {
      if ((task.status === TaskStatus.Completed || task.status === TaskStatus.Failed) && 
          taskStatusRef.current[task.id]?.timer) {
        clearInterval(taskStatusRef.current[task.id].timer);
        delete taskStatusRef.current[task.id];
      }
    });
  }, [tasks]);

  const handleRandomPrompt = () => {
    const randomIndex = Math.floor(Math.random() * samplePrompts.length);
    setPrompt(samplePrompts[randomIndex]);
  };

  const handleHintClick = (hint: string) => {
    setPrompt(hint);
  };

  const isPromptEmpty = !prompt.trim();

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
              <div className={styles.sectionTitle} style={{ marginBottom: 0, display: 'flex', alignItems: 'center' }}>
                <span className={styles.icon}>🤖</span>
                <span>Model</span>
              </div>
              <Select
                value={modelPipeline}
                onChange={(value: MLPipelineEnum) => setModelPipeline(value)}
                className={styles.modelSelect}
                disabled={loading}
                style={{ width: '70%' }}
              >
                <Option value={MLPipelineEnum.SkyreelsTextToVideoV1}>{MLPipelineEnum.SkyreelsTextToVideoV1}</Option>
                <Option value={MLPipelineEnum.CosmosTextToVideoV1}>{MLPipelineEnum.CosmosTextToVideoV1}</Option>
              </Select>
            </div>

            <div style={{ marginBottom: '8px' }}></div>

            <div className={styles.sectionTitle}>
              <span className={styles.icon}>✨</span>
              <span>Prompt</span>
            </div>
            <div className={styles.inputWrapper}>
              <TextArea
                value=""
                placeholder="Enter text to describe what you want to generate. Check the tutorial for better results."
                className={styles.input}
                disabled
              />
            </div>
            <div className={styles.hints}>
              <div className={styles.hintTags}>
                {samplePrompts.slice(0, 2).map((hint, index) => (
                  <span 
                    key={index}
                    className={styles.hintTag}
                    onClick={() => handleHintClick(hint)}
                  >
                    {hint.split('.')[0].split(' ').slice(0, 3).join(' ')}
                  </span>
                ))}
                <Button
                  type="text"
                  icon={<ReloadOutlined />}
                  onClick={handleRandomPrompt}
                  className={styles.refreshButton}
                />
              </div>
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
                      type={aspectRatio === InvokeTextToVideoAspectRatioEnum._169 ? 'primary' : 'default'}
                      onClick={() => setAspectRatio(InvokeTextToVideoAspectRatioEnum._169)}
                      className={styles.aspectButton}
                    >
                      16:9
                    </Button>
                    <Button
                      type={aspectRatio === InvokeTextToVideoAspectRatioEnum._916 ? 'primary' : 'default'}
                      onClick={() => setAspectRatio(InvokeTextToVideoAspectRatioEnum._916)}
                      className={styles.aspectButton}
                    >
                      9:16
                    </Button>
                    <Button
                      type={aspectRatio === InvokeTextToVideoAspectRatioEnum._11 ? 'primary' : 'default'}
                      onClick={() => setAspectRatio(InvokeTextToVideoAspectRatioEnum._11)}
                      className={styles.aspectButton}
                    >
                      1:1
                    </Button>
                  </div>
                </div>
                <div className={styles.settingItem}>
                  <span className={styles.settingLabel}>
                    Prompt Optimization
                    <Tooltip title="Enable prompt upsampler with LLM">
                      <InfoCircleOutlined />
                    </Tooltip>
                  </span>
                  <Switch
                    checked={!disablePromptUpsampler}
                    onChange={(checked) => setDisablePromptUpsampler(!checked)}
                  />
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
                  placeholder="Enter elements you don't want to see in the video"
                  className={styles.input}
                  disabled={loading}
                />
              </div>
            </div>

            <div className={styles.buttonGroup}>
              <Button
                type="primary"
                onClick={handleGenerate}
                loading={loading}
                disabled={isPromptEmpty || loading}
                className={styles.generateButton}
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
          <div className={styles.settingItem}>
            <div className={styles.sectionTitle} style={{ marginBottom: 0, display: 'flex', alignItems: 'center' }}>
              <span className={styles.icon}>🤖</span>
              <span>Model</span>
            </div>
            <Select
              value={modelPipeline}
              onChange={(value: MLPipelineEnum) => setModelPipeline(value)}
              className={styles.modelSelect}
              disabled={loading}
              style={{ width: '70%' }}
            >
              <Option value={MLPipelineEnum.SkyreelsTextToVideoV1}>{MLPipelineEnum.SkyreelsTextToVideoV1}</Option>
              <Option value={MLPipelineEnum.CosmosTextToVideoV1}>{MLPipelineEnum.CosmosTextToVideoV1}</Option>
            </Select>
          </div>

          <div style={{ marginBottom: '8px' }}></div>

          <div className={styles.sectionTitle}>
            <span className={styles.icon}>✨</span>
            <span>Prompt</span>
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
          <div className={styles.hints}>
            <div className={styles.hintTags}>
              {samplePrompts.slice(0, 2).map((hint, index) => (
                <span 
                  key={index}
                  className={styles.hintTag}
                  onClick={() => handleHintClick(hint)}
                >
                  {hint.split('.')[0].split(' ').slice(0, 3).join(' ')}
                </span>
              ))}
              <Button
                type="text"
                icon={<ReloadOutlined />}
                onClick={handleRandomPrompt}
                className={styles.refreshButton}
              />
            </div>
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
                    type={aspectRatio === InvokeTextToVideoAspectRatioEnum._169 ? 'primary' : 'default'}
                    onClick={() => setAspectRatio(InvokeTextToVideoAspectRatioEnum._169)}
                    className={styles.aspectButton}
                  >
                    16:9
                  </Button>
                  <Button
                    type={aspectRatio === InvokeTextToVideoAspectRatioEnum._916 ? 'primary' : 'default'}
                    onClick={() => setAspectRatio(InvokeTextToVideoAspectRatioEnum._916)}
                    className={styles.aspectButton}
                  >
                    9:16
                  </Button>
                  <Button
                    type={aspectRatio === InvokeTextToVideoAspectRatioEnum._11 ? 'primary' : 'default'}
                    onClick={() => setAspectRatio(InvokeTextToVideoAspectRatioEnum._11)}
                    className={styles.aspectButton}
                  >
                    1:1
                  </Button>
                </div>
              </div>
              <div className={styles.settingItem}>
                <span className={styles.settingLabel}>
                  Prompt Optimization
                  <Tooltip title="Enable prompt upsampler with LLM">
                    <InfoCircleOutlined />
                  </Tooltip>
                </span>
                <Switch
                  checked={!disablePromptUpsampler}
                  onChange={(checked) => setDisablePromptUpsampler(!checked)}
                />
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
                placeholder="Enter elements you don't want to see in the video"
                className={styles.input}
                disabled={loading}
              />
            </div>
          </div>

          <div className={styles.buttonGroup}>
            <Button
              type="primary"
              onClick={handleGenerate}
              loading={loading}
              disabled={isPromptEmpty || loading}
              className={styles.generateButton}
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
                  <div 
                    className={styles.taskContent}
                    data-aspect-ratio={
                      task.aspectRatio === InvokeTextToVideoAspectRatioEnum._11 ? "1:1" :
                      task.aspectRatio === InvokeTextToVideoAspectRatioEnum._916 ? "9:16" :
                      "16:9"
                    }
                  >
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
            <PlaceholderContent />
          )}
        </div>
      </div>
    </div>
  );
} 