"use client";

import React, { useState, useEffect } from 'react';
import { Typography, Card, Input, Button, Row, Col, notification } from 'antd';
import './styles.css';  // You'll need to create this file

const { Title } = Typography;
const { TextArea } = Input;

const API_URL = 'http://34.227.168.212:8000';
const POLLING_INTERVAL = 2 * 60 * 1000; // 2 minutes in milliseconds

interface TaskStatus {
  taskId: string;
  status: 'pending' | 'completed';
  videoUrl?: string;
}

const TextToVideoPage = () => {
  const [text, setText] = useState('');
  const [timeLeft, setTimeLeft] = useState(20 * 60); // 20 minutes in seconds
  const [isActive, setIsActive] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [taskList, setTaskList] = useState<TaskStatus[]>([]);

  // Load existing tasks from localStorage on mount
  useEffect(() => {
    const savedTasks = localStorage.getItem('video_task_list');
    if (savedTasks) {
      setTaskList(JSON.parse(savedTasks));
    }
  }, []);

  // Save tasks to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('video_task_list', JSON.stringify(taskList));
  }, [taskList]);

  const checkVideoStatus = async () => {
    try {
      // Get pending tasks
      const pendingTasks = taskList.filter(task => task.status === 'pending');
      
      for (const task of pendingTasks) {
        const response = await fetch(`${API_URL}/api/v1/tasks/${task.taskId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          throw new Error('Failed to check video status');
        }

        const data = await response.json();
        
        if (data.status === 'completed') {
          // Update task status and add video URL
          setTaskList(prevList => 
            prevList.map(t => 
              t.taskId === task.taskId 
                ? { 
                    ...t, 
                    status: 'completed',
                    videoUrl: `${API_URL}/api/v1/tasks/${task.taskId}/filesoutput/output.video`
                  } 
                : t
            )
          );

          // Set the latest completed video as current
          setVideoUrl(`${API_URL}/api/v1/tasks/${task.taskId}/files/output/output.video`);
          setIsActive(false);
          
          notification.success({
            message: 'Success',
            description: 'Your video is ready!',
          });
        }
      }

      // If no more pending tasks, clear the polling
      if (pendingTasks.length === 0 && pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
    } catch (error) {
      console.error('Error checking video status:', error);
    }
  };

  // Update handleSubmit to add new task to the list
  const handleSubmit = async () => {
    if (text.trim()) {
      try {
        setIsLoading(true);
        setIsActive(true);
        setTimeLeft(20 * 60);

        // Create form data with the required parameters
        const formData = new URLSearchParams();
        formData.append('prompt', text.trim());
        formData.append('ml_pipeline', ''); // Optional parameter from docs

        const response = await fetch(`${API_URL}/api/v1/task/text_to_video`, {
          method: 'POST',  // POST method as shown in screenshot
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'  // Content type from docs
          },
          body: formData.toString()
        });

        // Log the response for debugging
        console.log('Response status:', response.status);
        const responseText = await response.text();
        console.log('Response text:', responseText);

        if (!response.ok) {
          throw new Error(`Failed to generate video: ${response.status} - ${responseText}`);
        }

        const data = JSON.parse(responseText);
        
        // Add new task to list
        const newTask: TaskStatus = {
          taskId: data.task_id,
          status: 'pending'
        };
        
        setTaskList(prevList => [...prevList, newTask]);
        setTaskId(data.task_id);

        // Start polling if not already started
        if (!pollingInterval) {
          checkVideoStatus();
          const interval = setInterval(checkVideoStatus, POLLING_INTERVAL);
          setPollingInterval(interval);
        }
      } catch (error) {
        console.error('Error generating video:', error);
        setIsActive(false);
        notification.error({
          message: 'Error',
          description: error instanceof Error ? error.message : 'Failed to generate video. Please try again.',
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Update handleReset to only clear current task
  const handleReset = () => {
    setIsActive(false);
    setTimeLeft(20 * 60);
    setText('');
    setVideoUrl(null);
    setTaskId(null);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // When timer reaches 0
      setIsActive(false);
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div>
      <Title level={2} style={{ color: 'white', marginBottom: '24px' }}>
        Text to Video
      </Title>
      <Card 
        style={{
          background: '#1f1f1f',
          border: '1px solid #303030',
          borderRadius: '12px'
        }}
        styles={{
          body: {
            padding: '24px'
          }
        }}
      >
        <Row gutter={24}>
          <Col span={8}>
            <Typography.Text 
              style={{ 
                color: 'white', 
                display: 'block', 
                marginBottom: '8px',
                fontSize: '16px'
              }}
            >
              Enter your Prompt Here
            </Typography.Text>
            <TextArea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Describe the content for the video to be generated"
              style={{
                background: '#2f2f2f',
                color: 'white',
                border: '1px solid #404040',
                marginBottom: '16px',
                minHeight: '200px',
                '&::placeholder': {
                  color: 'rgba(255, 255, 255, 0.5)'
                }
              }}
              className="light-placeholder"
            />
            <Button 
              type="primary"
              onClick={handleSubmit}
              loading={isLoading}
              style={{
                background: '#64f4d4',
                borderColor: '#64f4d4',
                color: '#1f1f1f',
                width: '100%'
              }}
            >
              {isLoading ? 'Generating...' : 'Generate Video'}
            </Button>
          </Col>
          <Col span={16}>
            <Card
              style={{
                background: '#2f2f2f',
                border: '1px solid #404040',
                textAlign: 'center',
                marginBottom: '24px'
              }}
            >
              <Title level={4} style={{ color: 'white', margin: 0 }}>
                Time Remaining
              </Title>
              <Title 
                level={1} 
                style={{ 
                  color: '#64f4d4',
                  margin: '16px 0',
                  fontFamily: 'monospace'
                }}
              >
                {formatTime(timeLeft)}
              </Title>
              <Typography.Text style={{ color: '#888' }}>
                {isActive ? 'Processing...' : 'Ready to generate'}
              </Typography.Text>
            </Card>

            <Card
              style={{
                background: '#2f2f2f',
                border: '1px solid #404040',
                textAlign: 'center'
              }}
            >
              <Title level={4} style={{ color: 'white', marginBottom: '16px' }}>
                Generated Video
              </Title>
              <div
                style={{
                  width: '100%',
                  aspectRatio: '16/9',
                  background: '#1f1f1f',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {videoUrl ? (
                  <video
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    controls
                    playsInline
                  >
                    <source src={videoUrl} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <Typography.Text style={{ color: '#888' }}>
                    Video will appear here after generation
                  </Typography.Text>
                )}
              </div>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default TextToVideoPage; 