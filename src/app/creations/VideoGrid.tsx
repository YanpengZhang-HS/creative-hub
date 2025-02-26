import React from 'react';
import { StarOutlined, DeleteOutlined } from '@ant-design/icons';
import styles from './page.module.css';

interface VideoGridProps {
  activeTab: string;
}

const VideoGrid: React.FC<VideoGridProps> = ({ activeTab }) => {
  const videos = [
    {
      id: 1,
      url: '/sample-video-1.mp4',
      timestamp: '2/25/2025, 06:45 PM',
      favorite: false,
    },
    {
      id: 2,
      url: '/sample-video-2.mp4',
      timestamp: '2/25/2025, 06:38 PM',
      favorite: true,
    },
    // Add more video items as needed
  ];

  const filteredVideos = activeTab === 'favorite' 
    ? videos.filter(video => video.favorite)
    : videos;

  return (
    <div className={styles.grid}>
      {filteredVideos.map((video) => (
        <div key={video.id} className={styles.videoCard}>
          <div className={styles.videoWrapper}>
            <video src={video.url} />
            <div className={styles.timestamp}>{video.timestamp}</div>
            <div className={styles.actions}>
              <StarOutlined className={video.favorite ? styles.favorited : ''} />
              <DeleteOutlined />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default VideoGrid; 