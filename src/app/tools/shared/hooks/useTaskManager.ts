import { useState, useEffect, useRef, useCallback } from 'react';
import { message, Modal } from 'antd';
import { backendApi } from '@/network';
import { TaskStatus } from '@/network/api';
import { API_CONFIG } from '@/configs/api.config';
import type { Task } from '@/types/task';

interface TaskTimerStatus {
  timer: NodeJS.Timeout;
  startTime: number;
  progress: number;
}

interface UseTaskManagerOptions {
  taskType: string;
  totalTime?: number; // in seconds
  onStatusCheck?: (taskId: string, status: TaskStatus) => void;
}

const DEFAULT_TOTAL_TIME = 20 * 60; // 20 minutes in seconds

export const useTaskManager = ({ 
  taskType, 
  totalTime = DEFAULT_TOTAL_TIME,
  onStatusCheck 
}: UseTaskManagerOptions) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(false);
  const taskStatusRef = useRef<{ [key: string]: TaskTimerStatus }>({});

  // Initialize on client
  useEffect(() => {
    setIsClient(true);
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
      try {
        const parsedTasks = JSON.parse(savedTasks);
        let filterTasks = parsedTasks.filter((task: Task) => {
          return task.taskType === taskType;
        });
      
        setTasks(filterTasks);
        // Resume checking for in-progress tasks
        filterTasks.forEach((task: Task) => {
          if (task.status === TaskStatus.Processing || task.status === TaskStatus.Pending) {
            checkTaskStatus(task);
          }
        });
      } catch (error) {
        console.error('Failed to parse tasks:', error);
      }
    }
  }, [taskType]);

  // Format remaining time for display
  const formatRemainingTime = useCallback((progress: number | undefined) => {
    if (progress === undefined || progress === 0) return '';
    if (progress >= 99) return '< 1 min';
    
    const remainingSeconds = totalTime * (1 - progress / 100);
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = Math.floor(remainingSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [totalTime]);

  // Save tasks to localStorage
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

  // Update task status
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

  // Poll for task status
  const checkTaskStatus = useCallback((task: Task) => {
    if (!task) return;
    const taskId = task.id;
    
    // Prevent multiple polling for the same task
    if (taskStatusRef.current[taskId]?.timer) {
      return;
    }

    // Initialize task status in ref
    taskStatusRef.current[taskId] = {
      startTime: task.createdAt / 1000,
      progress: 0,
      timer: setInterval(() => {
        // Call API to check status
        backendApi.getTaskStatus(taskId).then((response) => {
          if (response.status === 200) {
            // Use actual progress from API if available, otherwise calculate based on time
            if (response.data.progress !== null && response.data.progress !== undefined) {
              taskStatusRef.current[taskId].progress = response.data.progress;
            } else {
              // Fall back to time-based calculation if progress not provided
              const now = Date.now() / 1000;
              const elapsed = Math.floor(now - taskStatusRef.current[taskId].startTime);
              const percentage = Math.min((elapsed / totalTime) * 100, 99);
              taskStatusRef.current[taskId].progress = percentage;
            }
            
            // Update task status based on API response
            updateTaskStatus(taskId, { status: response.data.status });
            
            // Handle completed tasks
            if (response.data.status === TaskStatus.Completed) {
              let updates: Partial<Task> = { 
                status: TaskStatus.Completed 
              };
              
              // Get URL based on task type
              if (taskType === 'text_to_video' || taskType === 'image_to_video') {
                updates.videoUrl = API_CONFIG.getVideoUrl(taskId);
              } else if (taskType === 'text_to_image') {
                updates.imageUrl = API_CONFIG.getImageUrl(taskId);
              } else if (taskType === 'text_to_music') {
                updates.audioUrl = API_CONFIG.getAudioUrl(taskId);
              }
              
              updateTaskStatus(taskId, updates);
              
              if (taskStatusRef.current[taskId]?.timer) {
                clearInterval(taskStatusRef.current[taskId].timer);
                delete taskStatusRef.current[taskId];
              }
              
              if (onStatusCheck) {
                onStatusCheck(taskId, TaskStatus.Completed);
              }
            } 
            // Handle failed tasks
            else if (response.data.status === TaskStatus.Failed) {
              updateTaskStatus(taskId, { 
                status: TaskStatus.Failed,
                error: response.data.error || `Failed to generate ${taskType.replace('_to_', ' to ')}`
              });
              
              if (taskStatusRef.current[taskId]?.timer) {
                clearInterval(taskStatusRef.current[taskId].timer);
                delete taskStatusRef.current[taskId];
              }
              
              message.error({
                content: response.data.error || `Failed to generate ${taskType.replace('_to_', ' to ')}`,
                duration: 5,
                style: { marginTop: '20vh' }
              });
              
              if (onStatusCheck) {
                onStatusCheck(taskId, TaskStatus.Failed);
              }
            }
          }
        }).catch(error => {
          console.error(`Error checking status for task ${taskId}:`, error);
        });
      }, 5000) // Check every 5 seconds for all task types
    };
  }, [updateTaskStatus, taskType, totalTime, onStatusCheck]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(taskStatusRef.current).forEach(status => {
        if (status.timer) {
          clearInterval(status.timer);
        }
      });
      taskStatusRef.current = {};
    };
  }, []);

  // Cleanup timers for completed or failed tasks
  useEffect(() => {
    tasks.forEach(task => {
      if ((task.status === TaskStatus.Completed || task.status === TaskStatus.Failed) && 
          taskStatusRef.current[task.id]?.timer) {
        clearInterval(taskStatusRef.current[task.id].timer);
        delete taskStatusRef.current[task.id];
      }
    });
  }, [tasks]);

  // Delete a task
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

  return {
    tasks,
    isClient,
    loading,
    setLoading,
    taskStatusRef,
    saveTasks,
    updateTaskStatus,
    checkTaskStatus,
    handleDeleteTask,
    formatRemainingTime
  };
};
