"use client";

import { Button, Input, Progress } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { backendApi } from '@/network';
import { TaskStatus } from '@/network/api';
import { samplePrompts } from '@/configs/prompt.config';
import Image from 'next/image';

const { TextArea } = Input;
const TOTAL_TIME = 20 * 60; // 20 minutes in seconds

export default function TextToVideoPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const checkTaskStatus = (startTime: number, taskId: string) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000); // Convert to seconds
      const percentage = Math.min((elapsed / TOTAL_TIME) * 100, 99); // 最大显示99%
      setProgress(percentage);
      
      if (elapsed % 60 === 0) {
        backendApi.getTaskStatus(taskId).then((response) => {
          if (response.status === 200 && response.data.status === TaskStatus.Completed) {
            setVideoUrl(`http://34.227.168.212:8000/api/v1/tasks/${taskId}/files/output%2Foutput.mp4`);
            setLoading(false);
            setProgress(0);
          }
        });
      }
    }, 1000);
  };

  const formatRemainingTime = (progress: number) => {
    if (progress >= 99) return 'Less than 1 minute';
   
    return progress.toFixed(2) + '%';
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);

    try {
      const response = await backendApi.invokeTextToVideo(prompt);
      if (response.status === 200) {
        const data = response.data;
        const taskId = data.task_id;
    
        if (taskId) {
          if (data.created_at) {
            setProgress(0);
            checkTaskStatus(data.created_at * 1000, taskId);
          }
          const taskIds = localStorage.getItem('taskIds');
          if (taskIds) {
            try {
              const taskIdsArray = JSON.parse(taskIds);
              taskIdsArray.push(taskId);
              localStorage.setItem('taskIds', JSON.stringify(taskIdsArray));
            } catch (error) {
              console.error('Failed to parse taskIds:', error);
            }
          } else {
            localStorage.setItem('taskIds', JSON.stringify([taskId]));
          }
        }
      } else {
        setLoading(false);
        throw new Error('Failed to generate video');
      }
    } catch (error) {
      setLoading(false);
      console.error('Failed to generate video:', error);
    }
  };

  const handleRandomPrompt = () => {
    const randomIndex = Math.floor(Math.random() * samplePrompts.length);
    setPrompt(samplePrompts[randomIndex]);
  };

  const handleHintClick = (hint: string) => {
    setPrompt(hint);
  };

  const isPromptEmpty = !prompt.trim();

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <Button 
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push('/')}
          className={styles.backButton}
        >
          Back to Home
        </Button>
      </div>

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
          {loading ? (
            <div className={styles.progressContainer}>
              <Progress 
                type="circle" 
                percent={progress} 
                format={() => formatRemainingTime(progress)}
                strokeColor={{
                  '0%': '#1668dc',
                  '100%': '#1677ff',
                }}
              />
              <p className={styles.progressText}>Generating video...</p>
            </div>
          ) : videoUrl ? (
            <video
              controls
              autoPlay
              className={styles.video}
              src={videoUrl}
            >
              Your browser does not support video playback
            </video>
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
} 