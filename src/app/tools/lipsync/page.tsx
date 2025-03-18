"use client";

import { Button, Progress, message, Upload, Typography, Radio, Select, Input, Modal } from 'antd';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import styles from './page.module.css';
import { backendApi } from '@/network';
import { TaskStatus } from '@/network/api';
import Image from 'next/image';
import { API_CONFIG } from '@/configs/api.config';
import type { Task } from '@/types/task';
import { UploadOutlined, DeleteOutlined, PauseOutlined, PlayCircleOutlined } from '@ant-design/icons';
import type { RcFile } from 'antd/es/upload/interface';

const { Title, Text } = Typography;
const { Option } = Select;

const EMOTIONS = ["happy1", "happy2", "angry1", "angry2", "sad", "coquettish"];
const LANGUAGES = ["English", "Korean", "Japanese", "Chinese"];
const SPEEDS = ["slow1", "slow2", "fast1", "fast2"];
const SPEAKERS = ["Indian_man_3", "Indian_women_2"];

const TOTAL_TIME = 20 * 60; // 20 minutes in seconds

export default function LipSyncPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(false);
  const taskStatusRef = useRef<{ [key: string]: TaskTimerStatus }>({});
  
  // File states
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

  // Add audio player state
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [playingSpeaker, setPlayingSpeaker] = useState<string | null>(null);

  const handlePlaySample = (speaker: string) => {
    // If clicking the same speaker that's currently playing, pause it
    if (playingSpeaker === speaker && currentAudio) {
      currentAudio.pause();
      setPlayingSpeaker(null);
      setCurrentAudio(null);
      return;
    }

    // Stop current audio if playing
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }

    // Create new audio element
    const audio = new Audio(`/sample/${speaker}.wav`);
    audio.onended = () => {
      setPlayingSpeaker(null);
      setCurrentAudio(null);
    };
    
    setCurrentAudio(audio);
    setPlayingSpeaker(speaker);
    audio.play();
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
    };
  }, [currentAudio]);

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
        <p>Create your first lip sync video!</p>
      </div>
    </div>
  );

  useEffect(() => {
    setIsClient(true);
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
      try {
        const parsedTasks = JSON.parse(savedTasks);
        let filterTasks = parsedTasks.filter((task) => {
          return task.taskType === 'lip_sync';
        });

        // Get completed video tasks from cache
        let videoTasks = parsedTasks.filter((task) => {
          return (task.taskType === 'text_to_video' || task.taskType === 'image_to_video') && 
                 task.status === TaskStatus.Completed;
        });
        
        setCachedVideoTasks(videoTasks);
      
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

  const handleAudioUpload = (file: RcFile) => {
    setAudioFile(file);
    return false;
  };

  const handleVideoUpload = (file: RcFile) => {
    setVideoFile(file);
    return false;
  };

  const handleDeleteAudio = () => {
    setAudioFile(null);
  };

  const handleDeleteVideo = () => {
    setVideoFile(null);
  };

  const handleSelectCachedVideo = (videoUrl: string) => {
    // Convert the URL to a File object
    fetch(videoUrl)
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

   // Add this memoized handler near your other state declarations
   const handlePromptChange = useCallback((e) => {
    setPrompt(e.target.value);
  }, []);

  const videoPreviewUrl = useMemo(() => 
    videoFile ? URL.createObjectURL(videoFile) : '', 
  [videoFile]); 

  const handleDeleteTask = useCallback((taskId: string) => {
    Modal.confirm({
      title: 'Delete Task',
      content: 'Are you sure you want to delete this task? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          // Call backend API to delete the task
          await backendApi.deleteTask(taskId);

          // Remove from local state
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
        } catch (error) {
          message.error('Failed to delete task');
          console.error('Error deleting task:', error);
        }
      },
    });
  }, []);

  if (!isClient) return null;

  const isInputEmpty = !videoFile || (inputType === 'audio' ? !audioFile : !prompt);

  return (
    <div className={styles.pageContainer}>
      <div className={styles.mainContent}>
        <div className={styles.leftSection}>
          <div className={styles.sectionTitle}>
            <span className={styles.icon}>🎥</span>
            <span>Video File</span>
          </div>
          <div className={styles.uploadContainer}>
            <Upload.Dragger
              accept=".mp4"
              beforeUpload={handleVideoUpload}
              showUploadList={false}
              disabled={loading}
            >
              {videoFile ? (
                <div className={styles.videoPreviewContainer}>
                <video 
                  className={styles.videoPreview}
                  src={videoPreviewUrl}
                  controls
                  key="video-preview" // Add a stable key
                />
                 <Button
                    icon={<DeleteOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteVideo();
                    }}
                    className={styles.topRightDeleteButton}
                    type="primary"
                    danger
                  />
              </div>
              ) : (
                <>
                  <UploadOutlined className={styles.uploadIcon} />
                  <div className={styles.uploadText}>Click to upload MP4 video</div>
                </>
              )}
            </Upload.Dragger>
          </div>

          {/* Cached videos section */}
          {cachedVideoTasks.length > 0 && (
            <div className={styles.cachedVideosSection}>
              <div className={styles.sectionTitle}>
                <span className={styles.icon}>📚</span>
                <span>Your Generated Videos</span>
              </div>
              <div className={styles.cachedVideosGrid}>
                {cachedVideoTasks.map(task => (
                  <div 
                    key={task.id} 
                    className={styles.cachedVideoItem}
                    onClick={() => task.videoUrl && handleSelectCachedVideo(task.videoUrl)}
                  >
                    {task.videoUrl && (
                      <video 
                        className={styles.cachedVideoThumbnail}
                        src={task.videoUrl}
                        muted
                        onMouseOver={e => (e.target as HTMLVideoElement).play()}
                        onMouseOut={e => {
                          const video = e.target as HTMLVideoElement;
                          video.pause();
                          video.currentTime = 0;
                        }}
                      />
                    )}
                    <div className={styles.cachedVideoInfo}>
                      <p className={styles.cachedVideoType}>{task.prompt || 'Image to Video'}</p>
                      <p className={styles.cachedVideoDate}>{new Date(task.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={styles.sectionTitle} style={{ marginTop: '24px' }}>
            <span className={styles.icon}>🔊</span>
            <span>Audio Source</span>
          </div>
          
          <Radio.Group 
            value={inputType} 
            onChange={(e) => setInputType(e.target.value)}
            className={styles.radioGroup}
          >
            <Radio value="audio">Upload Audio File</Radio>
            <Radio value="text">Generate from Text</Radio>
          </Radio.Group>

          {inputType === 'audio' ? (
            <div className={styles.uploadContainer}>
              <Upload.Dragger
                accept=".mp3"
                beforeUpload={handleAudioUpload}
                showUploadList={false}
                disabled={loading}
              >
                {audioFile ? (
                  <>
                    <div className={styles.uploadedFile}>{audioFile.name}</div>
                    <Button
                      icon={<DeleteOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAudio();
                      }}
                      className={styles.deleteImageButton}
                      type="primary"
                      danger
                    />
                  </>
                ) : (
                  <>
                    <UploadOutlined className={styles.uploadIcon} />
                    <div className={styles.uploadText}>Click to upload MP3 audio</div>
                  </>
                )}
              </Upload.Dragger>
            </div>
          ) : (
            <div className={styles.textInputSection}>
              <div className={styles.inputGroup}>
                <div className={styles.inputLabel}>Prompt</div>
                <Input.TextArea
                  value={prompt}
                  onChange={handlePromptChange}
                  placeholder="Enter text for speech generation"
                  rows={4}
                  className={styles.textInput}
                />
              </div>
              <div className={styles.optionsGrid}>
                <div className={styles.selectGroup}>
                  <div className={styles.inputLabel}>Emotion</div>
                  <Select
                    value={emotion}
                    onChange={setEmotion}
                    className={styles.select}
                  >
                    {EMOTIONS.map(e => (
                      <Option key={e} value={e}>{e}</Option>
                    ))}
                  </Select>
                </div>
                <div className={styles.selectGroup}>
                  <div className={styles.inputLabel}>Language</div>
                  <Select
                    value={language}
                    onChange={setLanguage}
                    className={styles.select}
                  >
                    {LANGUAGES.map(l => (
                      <Option key={l} value={l}>{l}</Option>
                    ))}
                  </Select>
                </div>
                <div className={styles.selectGroup}>
                  <div className={styles.inputLabel}>Speed</div>
                  <Select
                    value={speed}
                    onChange={setSpeed}
                    className={styles.select}
                  >
                    {SPEEDS.map(s => (
                      <Option key={s} value={s}>{s}</Option>
                    ))}
                  </Select>
                </div>
                <div className={styles.selectGroup}>
                  <div className={styles.inputLabel}>Speaker</div>
                  <div className={styles.speakerSelectContainer}>
                    <Select
                      value={speaker}
                      onChange={setSpeaker}
                      className={styles.select}
                    >
                      {SPEAKERS.map(s => (
                        <Option key={s} value={s}>{s}</Option>
                      ))}
                    </Select>
                    <Button
                      type="text"
                      icon={playingSpeaker === speaker ? <PauseOutlined /> : <PlayCircleOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlaySample(speaker);
                      }}
                      className={styles.playButton}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className={styles.buttonGroup}>
            <Button
              type="primary"
              onClick={handleGenerate}
              loading={loading}
              disabled={isInputEmpty || loading}
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
                        <p className={styles.progressText}>Processing lip sync...</p>
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
                        <p className={styles.errorText}>{task.error || 'Failed to process lip sync'}</p>
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