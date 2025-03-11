"use client";

import { Button, Input,  Progress, message, Upload, Typography } from 'antd';
import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './page.module.css';
import { backendApi } from '@/network';
import { TaskStatus } from '@/network/api';
import Image from 'next/image';
import { API_CONFIG } from '@/configs/api.config';
import type { Task } from '@/types/task';
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import type { RcFile } from 'antd/es/upload/interface';

const { Title, Text } = Typography;
const { TextArea } = Input;
const TOTAL_TIME = 20 * 60; // 20 minutes in seconds

interface TaskTimerStatus {
  timer: NodeJS.Timeout;
  startTime: number;
  progress: number;
}

const formatRemainingTime = (progress: number | undefined) => {
  if (progress === undefined || progress === 0) return '';
  if (progress >= 99) return '< 1 min';
  
  const remainingSeconds = TOTAL_TIME * (1 - progress / 100);
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = Math.floor(remainingSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

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
      <p>Create your first Sound Effect video!</p>
    </div>
  </div>
);

export default function SoundEffectPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(false);
  const taskStatusRef = useRef<{ [key: string]: TaskTimerStatus }>({});
  const [prompt, setPrompt] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);

  useEffect(() => {
    setIsClient(true);
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
      try {
        const parsedTasks = JSON.parse(savedTasks);
        let filterTasks = parsedTasks.filter((task) => {
          return  task.taskType === 'sound_effect';
        });
      
        setTasks(filterTasks);
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

  const saveTasks = useCallback((newTasks: Task[]) => {
    localStorage.setItem('tasks', JSON.stringify(newTasks));
    setTasks(newTasks);
  }, []);

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
    if (!videoFile) {
      message.error('Please upload both audio and video files');
      return;
    }
    
    setLoading(true);

    try {
      const response = await backendApi.invokeSoundEffect(prompt.trim() || "Generate Sound Effect", videoFile);
      if (response.status === 200) {
        const taskId = response.data.task_id;
        if (taskId) {
          const newTask: Task = {
            id: taskId,
            taskType: 'sound_effect',
            prompt: prompt.trim() || "Generate Sound Effect",
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


  const handleVideoUpload = (file: RcFile) => {
    setVideoFile(file);
    return false;
  };

  const handleDeleteVideo = () => {
    setVideoFile(null);
  };

  if (!isClient) return null;

  const isFilesEmpty = !videoFile;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.mainContent}>
        <div className={styles.leftSection}>
          <div className={styles.sectionTitle}>
            <span className={styles.icon}>🎥</span>
            <span>Video File(Up to 25M)</span>
          </div>
          <div className={styles.uploadContainer}>
            <Upload.Dragger
              accept=".mp4"
              beforeUpload={handleVideoUpload}
              showUploadList={false}
              disabled={loading}
            >
              {videoFile ? (
                <>
                  <div className={styles.uploadedFile}>{videoFile.name}</div>
                  <Button
                    icon={<DeleteOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteVideo();
                    }}
                    className={styles.deleteImageButton}
                    type="primary"
                    danger
                  />
                </>
              ) : (
                <>
                  <UploadOutlined className={styles.uploadIcon} />
                  <div className={styles.uploadText}>Click to upload MP4 video</div>
                </>
              )}
            </Upload.Dragger>
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
                onChange={(e) => setPrompt(e.target.value)}
                disabled={loading}
              />
            </div>

          <div className={styles.buttonGroup}>
            <Button
              type="primary"
              onClick={handleGenerate}
              loading={loading}
              disabled={isFilesEmpty || loading}
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
                        <p className={styles.progressText}>Processing Sound Effect...</p>
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
                        <p className={styles.errorText}>{task.error || 'Failed to process sound effect'}</p>
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