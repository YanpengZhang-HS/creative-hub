"use client";

import React, { useState, useEffect } from 'react';
import { Card, Typography, Row, Col, Checkbox, Divider } from 'antd';
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

// 定义媒体类型
enum MediaType {
  Image = 'Image',
  Video = 'Video',
  Audio = 'Audio'
}

// 任务类型与媒体类型的映射
const taskTypeToMediaType: Record<TaskType, MediaType> = {
  'text_to_image': MediaType.Image,
  'text_to_video': MediaType.Video,
  'image_to_video': MediaType.Video,
  'video_to_video': MediaType.Video,
  'lip_sync': MediaType.Video,
  'sound_effect': MediaType.Video,
  'text_to_music': MediaType.Audio
};

export default function CreationsPage() {
  const [tasks, setTasks] = useState<Array<Task>>([]);
  const [isClient, setIsClient] = useState(false);
  const [selectedMediaTypes, setSelectedMediaTypes] = useState<Array<MediaType>>(
    [MediaType.Image, MediaType.Video, MediaType.Audio]
  );

  useEffect(() => {
    setIsClient(true);
    // 加载任务数据
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
      try {
        const parsedTasks = JSON.parse(savedTasks);
        setTasks(parsedTasks);
      } catch (error) {
        console.error('Failed to parse tasks:', error);
      }
    }
    
    // 加载过滤器状态 - 使用 sessionStorage 而不是 localStorage
    const savedMediaTypes = sessionStorage.getItem('selectedMediaTypes');
    if (savedMediaTypes) {
      try {
        const parsedMediaTypes = JSON.parse(savedMediaTypes);
        setSelectedMediaTypes(parsedMediaTypes);
      } catch (error) {
        console.error('Failed to parse media types:', error);
      }
    }
  }, []);

  // 当选中的媒体类型变化时，保存到 sessionStorage
  useEffect(() => {
    if (isClient) {
      sessionStorage.setItem('selectedMediaTypes', JSON.stringify(selectedMediaTypes));
    }
  }, [selectedMediaTypes, isClient]);

  if (!isClient) return null;

  // 根据任务状态和媒体类型过滤任务
  const filteredTasks = tasks.map((task) => {
    if (!task.taskType) {
      task.taskType = 'text_to_video';
    }
    return task;
  }).filter(task => 
    task.status === TaskStatus.Completed && 
    selectedMediaTypes.includes(taskTypeToMediaType[task.taskType])
  );

  // 按媒体类型分组任务
  const imageFilteredTasks = filteredTasks.filter(task => taskTypeToMediaType[task.taskType] === MediaType.Image);
  const videoFilteredTasks = filteredTasks.filter(task => taskTypeToMediaType[task.taskType] === MediaType.Video);
  const audioFilteredTasks = filteredTasks.filter(task => taskTypeToMediaType[task.taskType] === MediaType.Audio);

  // 渲染任务卡片
  const renderTask = (task: Task) => (
    <Col xs={24} sm={12} md={8} key={task.id}>
      <Card
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
            {task.status === TaskStatus.Completed && task.imageUrl && !task.videoUrl && (
              <img
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  objectFit: 'cover'
                }}
                src={task.imageUrl}
                alt={task.prompt}
              />
            )}
            {task.status === TaskStatus.Completed && task.audioUrl && !task.videoUrl && !task.imageUrl && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#1a1a1a'
              }}>
                <audio
                  style={{
                    width: '90%'
                  }}
                  src={task.audioUrl}
                  title={task.prompt}
                  controls
                />
              </div>
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
                WebkitBoxOrient: 'vertical'
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
          <Text
            style={{
              color: '#888',
              fontSize: '14px',
              marginLeft: '10px'
            }}
          >
            {getTaskTypeDisplayValue(task.taskType)}
          </Text>
        </div>
      </Card>
    </Col>
  );

  return (
    <div style={{
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

      {/* 媒体类型选择 */}
      <Checkbox.Group
        options={[
          { label: 'Image', value: MediaType.Image },
          { label: 'Video', value: MediaType.Video },
          { label: 'Audio', value: MediaType.Audio }
        ]}
        value={selectedMediaTypes}
        onChange={(values) => setSelectedMediaTypes(values as Array<MediaType>)}
        style={{ marginBottom: '24px' }}
      />

      {/* Image 列表 */}
      {selectedMediaTypes.includes(MediaType.Image) && imageFilteredTasks.length > 0 && (
        <>
          <Divider orientation="left" style={{ color: 'white', borderColor: '#303030' }}>Image</Divider>
          <Row gutter={[24, 24]}>
            {imageFilteredTasks.map(renderTask)}
          </Row>
        </>
      )}

      {/* Video 列表 */}
      {selectedMediaTypes.includes(MediaType.Video) && videoFilteredTasks.length > 0 && (
        <>
          <Divider orientation="left" style={{ color: 'white', borderColor: '#303030' }}>Video</Divider>
          <Row gutter={[24, 24]}>
            {videoFilteredTasks.map(renderTask)}
          </Row>
        </>
      )}

      {/* Audio 列表 */}
      {selectedMediaTypes.includes(MediaType.Audio) && audioFilteredTasks.length > 0 && (
        <>
          <Divider orientation="left" style={{ color: 'white', borderColor: '#303030' }}>Audio</Divider>
          <Row gutter={[24, 24]}>
            {audioFilteredTasks.map(renderTask)}
          </Row>
        </>
      )}

      {/* 如果没有任何内容显示提示 */}
      {filteredTasks.length === 0 && (
        <div style={{ textAlign: 'center', color: '#888', margin: '50px 0' }}>
          No completed creations found
        </div>
      )}
    </div>
  );
}
