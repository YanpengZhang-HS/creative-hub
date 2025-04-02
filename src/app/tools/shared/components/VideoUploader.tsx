import React, { useMemo } from 'react';
import { Upload, Button } from 'antd';
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import type { RcFile } from 'antd/es/upload/interface';
import styles from '../tools.module.css';

interface VideoTask {
  id: string;
  videoUrl?: string | null;
  prompt?: string;
  createdAt: number;
}

interface VideoUploaderProps {
  videoFile: File | null;
  onUpload: (file: RcFile) => boolean;
  onDelete: () => void;
  disabled?: boolean;
  cachedVideoTasks?: VideoTask[];
  onSelectCachedVideo?: (videoUrl: string) => void;
}

const VideoUploader: React.FC<VideoUploaderProps> = ({
  videoFile,
  onUpload,
  onDelete,
  disabled = false,
  cachedVideoTasks = [],
  onSelectCachedVideo
}) => {
  // Create Object URL for video preview
  const videoPreviewUrl = useMemo(() => 
    videoFile ? URL.createObjectURL(videoFile) : '', 
  [videoFile]);

  // Cleanup object URL on unmount
  React.useEffect(() => {
    return () => {
      if (videoPreviewUrl) {
        URL.revokeObjectURL(videoPreviewUrl);
      }
    };
  }, [videoPreviewUrl]);

  return (
    <>
      <div className={styles.sectionTitle}>
        <span className={styles.icon}>🎥</span>
        <span>Video File</span>
      </div>
      <div className={styles.uploadContainer}>
        <Upload.Dragger
          accept=".mp4"
          beforeUpload={onUpload}
          showUploadList={false}
          disabled={disabled}
        >
          {videoFile ? (
            <div className={styles.videoPreviewContainer}>
              <video 
                className={styles.videoPreview}
                src={videoPreviewUrl}
                controls
              />
              <Button
                icon={<DeleteOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
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
      {cachedVideoTasks.length > 0 && onSelectCachedVideo && (
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
                onClick={() => task.videoUrl && onSelectCachedVideo(task.videoUrl)}
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
                  <p className={styles.cachedVideoType}>{task.prompt || 'Video'}</p>
                  <p className={styles.cachedVideoDate}>{new Date(task.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default VideoUploader;
