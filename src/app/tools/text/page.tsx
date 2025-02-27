"use client";

import { Button, Input, Progress, message } from 'antd';
import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './page.module.css';
import { backendApi } from '@/network';
import { TaskStatus } from '@/network/api';
import { samplePrompts } from '@/configs/prompt.config';
import Image from 'next/image';
import { API_CONFIG } from '@/configs/api.config';
import type { Task } from '@/types/task';

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

export default function TextToVideoPage() {
  const [prompt, setPrompt] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(false);
  const taskStatusRef = useRef<{ [key: string]: TaskTimerStatus }>({});

  // 处理客户端初始化
  useEffect(() => {
    setIsClient(true);
    const savedTasks = localStorage.getItem('tasks');
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
    localStorage.setItem('tasks', JSON.stringify(newTasks));
    setTasks(newTasks);
  }, []);

  // 更新任务状态
  const updateTaskStatus = useCallback((taskId: string, updates: Partial<Task>) => {
    setTasks(prevTasks => {
      const newTasks = prevTasks.map(task => 
        task.id === taskId ? { ...task, ...updates } : task
      );
      localStorage.setItem('tasks', JSON.stringify(newTasks));
      return newTasks;
    });
  }, []);

  const checkTaskStatus = useCallback((task: Task) => {
    if (!task) return;
    const taskId = task.id;
    if (taskStatusRef.current[taskId]?.timer) {
      clearInterval(taskStatusRef.current[taskId].timer);
    }
    console.log('taskId', taskId, tasks);
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
    if (!prompt.trim()) return;
    
    setLoading(true);

    try {
      const response = await backendApi.invokeTextToVideo(prompt);
      if (response.status === 200) {
        const taskId = response.data.task_id;
        if (taskId) {
          const newTask: Task = {
            id: taskId,
            prompt: prompt.trim(),
            createdAt: response.data.created_at as number * 1000,
            status: response.data.status
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

  const isPromptEmpty = !prompt.trim();

  // 在渲染时检查是否是客户端
  if (!isClient) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.mainContent}>
          <div className={styles.leftSection}>
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
              <span className={styles.hintsLabel}>Examples:</span>
              <div className={styles.hintTags}>
                <div className={styles.hintTagsRow}>
                  {samplePrompts.slice(0, 2).map((hint, index) => (
                    <span 
                      key={index}
                      className={styles.hintTag}
                      onClick={() => handleHintClick(hint)}
                    >
                      {hint.split('.')[0]}
                    </span>
                  ))}
                </div>
                <span 
                  className={`${styles.hintTag} ${styles.moreTag}`}
                  onClick={handleRandomPrompt}
                >
                  More
                </span>
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
      {/* <div className={styles.header}>
        <Button 
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push('/')}
          className={styles.backButton}
        >
          Back to Home
        </Button>
      </div> */}

      <div className={styles.mainContent}>
        <div className={styles.leftSection}>
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
            <span className={styles.hintsLabel}>Examples:</span>
            <div className={styles.hintTags}>
              <div className={styles.hintTagsRow}>
                {samplePrompts.slice(0, 2).map((hint, index) => (
                  <span 
                    key={index}
                    className={styles.hintTag}
                    onClick={() => handleHintClick(hint)}
                  >
                    {hint.split('.')[0]}
                  </span>
                ))}
              </div>
              <span 
                className={`${styles.hintTag} ${styles.moreTag}`}
                onClick={handleRandomPrompt}
              >
                More
              </span>
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