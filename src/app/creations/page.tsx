"use client";

import React, { useState, useEffect } from 'react';
import { Card, Typography, Row, Col, Checkbox } from 'antd';
import styles from './page.module.css';
import type { Task, TaskType } from '@/types/task';
import { TaskStatus } from '@/network/api';
import { getTaskTypeDisplayValue } from '@/types/task';

const { Title, Text } = Typography;

const TOTAL_TIME = 20 * 60; // 20 minutes in seconds

const formatRemainingTime = (progress: number | undefined) => {
  if (progress === undefined || progress === 0) return '';
  if (progress >= 99) return '< 1 min';

  const remainingSeconds = TOTAL_TIME * (1 - progress / 100);
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = Math.floor(remainingSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export default function CreationsPage() {
  const [tasks, setTasks] = useState<Array<Task>>([]);
  const [isClient, setIsClient] = useState(false);
  const [selectedTaskTypes, setSelectedTaskTypes] = useState<Array<TaskType>>([]);

  useEffect(() => {
    setIsClient(true);
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
      try {
        const parsedTasks = JSON.parse(savedTasks);
        setTasks(parsedTasks);
      } catch (error) {
        console.error('Failed to parse tasks:', error);
      }
    }
  }, []);

  if (!isClient) return null;

  return (
    <div style={{
      // marginLeft: "2rem",
      // marginRight: "2rem",
      padding: '20px',
      borderTop: '1px solid #303030',
      paddingTop: '40px',
      paddingBottom: '100px'
    }}>
      <Title level={3} style={{
        color: 'white',
        marginBottom: '24px'
      }}>
        My Creations
      </Title>
      <Checkbox.Group
        options={(['text_to_video',  'text_to_image', 'image_to_video',  'lip_sync', 'sound_effect'] as TaskType[]).map(taskType => ({
          label: getTaskTypeDisplayValue(taskType),
          value: taskType
        }))}
        value={selectedTaskTypes}
        onChange={(values) => setSelectedTaskTypes(values as Array<TaskType>)}
        style={{ marginBottom: '24px' }}
      />
      <Row gutter={[24, 24]}>
        {tasks.map((task) => {
          if (!task.taskType) {
            task.taskType = 'text_to_video';
          }
          return task
        }).filter(task =>
          selectedTaskTypes.length === 0 ||
          selectedTaskTypes.includes(task.taskType)
        )
          .map((task) => (
            <Col xs={24} sm={12} md={8} key={task.id}>
              <Card
                hoverable
                className={styles.hoverCard}
                styles={{
                  body: {
                    padding: '24px',
                    height: '100%'
                  }
                }}
              >
                <div style={{
                  position: 'relative',
                  width: '100%',
                  height: '100%'
                }}>
                  <div
                    style={{
                      position: 'relative',
                      paddingBottom: '56.25%', // 16:9 aspect ratio
                      height: 0,
                      overflow: 'hidden',
                      marginBottom: '16px'
                    }}
                  >
                    {task.status === TaskStatus.Completed && task.videoUrl && (
                      <video
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          border: 'none'
                        }}
                        src={task.videoUrl}
                        title={task.prompt}
                        controls
                        playsInline
                      />
                    )}
                  </div>
                  <div>
                    <Text
                      style={{
                        color: '#888',
                        fontSize: '14px',
                        height: '40px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        const target = e.currentTarget;
                        target.style.height = 'auto';
                        target.style.webkitLineClamp = 'unset';
                      }}
                      onMouseLeave={(e) => {
                        const target = e.currentTarget;
                        target.style.height = '40px';
                        target.style.webkitLineClamp = '2';
                      }}
                    >
                      {task.prompt}
                    </Text>
                  </div>
                  <Text
                    style={{
                      color: '#888',
                      fontSize: '14px'
                    }}
                  >
                    {new Date(task.createdAt).toLocaleString()}
                  </Text>
                </div>
              </Card>
            </Col>
          ))}
      </Row>
    </div>
  );
}
