import React from 'react';
import { Upload, Button } from 'antd';
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import type { RcFile } from 'antd/es/upload/interface';
import styles from '../tools.module.css';

interface AudioUploaderProps {
  audioFile: File | null;
  onUpload: (file: RcFile) => boolean;
  onDelete: () => void;
  disabled?: boolean;
}

const AudioUploader: React.FC<AudioUploaderProps> = ({
  audioFile,
  onUpload,
  onDelete,
  disabled = false
}) => {
  return (
    <div className={styles.uploadContainer}>
      <Upload.Dragger
        accept=".mp3"
        beforeUpload={onUpload}
        showUploadList={false}
        disabled={disabled}
      >
        {audioFile ? (
          <>
            <div className={styles.uploadedFile}>{audioFile.name}</div>
            <Button
              icon={<DeleteOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
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
  );
};

export default AudioUploader;
