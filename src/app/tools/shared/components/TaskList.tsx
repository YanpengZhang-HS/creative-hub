import React from 'react';
import { Button, Progress } from 'antd';
import { DeleteOutlined, DownloadOutlined } from '@ant-design/icons';
import type { Task } from '@/types/task';
import { TaskStatus } from '@/network/api';
import styles from '../tools.module.css';

interface TaskListProps {
  tasks: Task[];
  taskStatusRef: any;
  formatRemainingTime: (progress: number | undefined) => string;
  onDeleteTask: (taskId: string) => void;
  onDownloadTask?: (task: Task) => void;
  emptyContent: React.ReactNode;
  mediaType: 'video' | 'image' | 'audio';
}

const TaskList: React.FC<TaskListProps> = ({
  tasks,
  taskStatusRef,
  formatRemainingTime,
  onDeleteTask,
  onDownloadTask,
  emptyContent,
  mediaType
}) => {
  if (tasks.length === 0) {
    return <>{emptyContent}</>;
  }

  return (
    <div className={styles.taskList}>
      {tasks.map(task => (
        <div key={task.id} className={styles.taskItem}>
          <div 
            className={styles.taskContent}
            data-aspect-ratio={task.aspectRatio || "16:9"}
          >
            {task.status === TaskStatus.Processing ? (
              <div className={styles.progressContainer}>
                <Progress 
                  type="circle" 
                  percent={taskStatusRef.current[task.id]?.progress || 0}
                  format={(percent) => `${Math.round(percent || 0)}%`}
                  strokeColor={{
                    '0%': '#1668dc',
                    '100%': '#1677ff',
                  }}
                />
                <p className={styles.progressText}>
                  Generating {mediaType}...
                </p>
              </div>
            ) : task.status === TaskStatus.Completed ? (
              <>
                {mediaType === 'video' && task.videoUrl && (
                  <video
                    controls
                    className={styles.video}
                    src={task.videoUrl}
                  >
                    Your browser does not support video playback
                  </video>
                )}
                {mediaType === 'image' && task.imageUrl && (
                  <div className={styles.imageContainer}>
                    <img
                      src={task.imageUrl}
                      alt={task.prompt}
                      style={{
                        width: 'auto',
                        height: '100%',
                        borderRadius: '8px'
                      }}
                    />
                    {onDownloadTask && (
                      <Button
                        type="primary"
                        icon={<DownloadOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDownloadTask(task);
                        }}
                        className={styles.downloadButton}
                      />
                    )}
                  </div>
                )}
                {mediaType === 'audio' && task.audioUrl && (
                  <audio
                    controls
                    className={styles.audio}
                    src={task.audioUrl}
                  >
                    Your browser does not support audio playback
                  </audio>
                )}
              </>
            ) : task.status === TaskStatus.Failed ? (
              <div className={styles.errorContainer}>
                <p className={styles.errorText}>
                  {task.error || `Failed to generate ${mediaType}`}
                </p>
              </div>
            ) : null}
          </div>
          <div className={styles.taskInfo}>
            <div className={styles.taskHeader}>
              <p className={styles.taskPrompt}>{task.prompt}</p>
              <Button
                type="text"
                icon={<DeleteOutlined />}
                onClick={() => onDeleteTask(task.id)}
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
  );
};

export default TaskList;
