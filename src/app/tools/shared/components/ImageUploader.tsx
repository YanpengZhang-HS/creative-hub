import React, { useRef, useState } from 'react';
import { Button, Spin } from 'antd';
import { 
  UploadOutlined, 
  PlusOutlined, 
  DeleteOutlined,
  LeftOutlined,
  RightOutlined
} from '@ant-design/icons';
import styles from '../tools.module.css';

interface ImageUploaderProps {
  imageFile: File | null;
  imagePreview: string | null;
  imageLoading: boolean;
  onImageUpload: (file: File) => void;
  onImageDelete: () => void;
  disabled?: boolean;
  textToImageTasks?: Array<{ id: string; imageUrl?: string | null; prompt: string }>;
  onSelectPreviousImage?: (imageUrl: string) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  imageFile,
  imagePreview,
  imageLoading,
  onImageUpload,
  onImageDelete,
  disabled = false,
  textToImageTasks = [],
  onSelectPreviousImage
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createdImagesListRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const triggerImageUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      // Check file type
      if (!file.type.startsWith('image/')) {
        console.error('Please upload an image file');
        return;
      }
      
      // Check file size (max 25MB)
      if (file.size > 25 * 1024 * 1024) {
        console.error('Image size should be less than 25MB');
        return;
      }
      
      onImageUpload(file);
    }
  };

  // Handle scrolling in the previous images list
  const checkScrollState = () => {
    if (createdImagesListRef.current) {
      const container = createdImagesListRef.current;
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
        container.scrollWidth - container.scrollLeft - container.clientWidth > 1
      );
    }
  };

  // Handle list scroll left
  const handleScrollLeft = () => {
    if (createdImagesListRef.current && canScrollLeft) {
      createdImagesListRef.current.scrollBy({
        left: -200,
        behavior: 'smooth'
      });
    }
  };

  // Handle list scroll right
  const handleScrollRight = () => {
    if (createdImagesListRef.current && canScrollRight) {
      createdImagesListRef.current.scrollBy({
        left: 200,
        behavior: 'smooth'
      });
    }
  };

  React.useEffect(() => {
    const container = createdImagesListRef.current;
    if (container) {
      checkScrollState();
      container.addEventListener('scroll', checkScrollState);
      window.addEventListener('resize', checkScrollState);
      
      return () => {
        container.removeEventListener('scroll', checkScrollState);
        window.removeEventListener('resize', checkScrollState);
      };
    }
  }, [textToImageTasks]);

  return (
    <>
      <div className={styles.sectionTitle}>
        <span className={styles.icon}>🖼️</span>
        <span>Image</span>
      </div>
      <div className={styles.imageUploadSection}>
        <div
          className={styles.uploadContainer}
          onClick={!imageLoading && !disabled ? triggerImageUpload : undefined}
        >
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept="image/*"
            onChange={handleImageUpload}
            disabled={disabled || imageLoading}
          />
          {imagePreview ? (
            <>
              <img src={imagePreview} alt="Uploaded" className={styles.uploadedImage} />
              <div className={styles.uploadOverlay}>
                <p className={styles.replaceButton}>
                  Replace
                  <UploadOutlined style={{ marginLeft: '8px' }} />
                </p>
              </div>
              <Button
                icon={<DeleteOutlined />}
                className={styles.deleteImageButton}
                onClick={(e) => {
                  e.stopPropagation();
                  onImageDelete();
                }}
                disabled={disabled}
              />
            </>
          ) : imageLoading ? (
            <div className={styles.uploadLoading}>
              <Spin size="large" />
              <div className={styles.uploadLoadingText}>Uploading...</div>
            </div>
          ) : (
            <>
              <div className={styles.uploadIcon}>
                <PlusOutlined style={{ fontSize: '20px' }} />
              </div>
              <div className={styles.uploadText}>Click to upload an image</div>
            </>
          )}
        </div>
      </div>

      {/* Previous images list (if available) */}
      {textToImageTasks.length > 0 && onSelectPreviousImage && (
        <div className={styles.createdImagesSection}>
          <div className={styles.createdImagesTitle}>From Creations</div>
          <div className={styles.createdImagesListContainer}>
            <Button 
              type="text" 
              icon={<LeftOutlined />} 
              className={`${styles.scrollArrow} ${styles.leftArrow}`}
              onClick={handleScrollLeft}
              disabled={!canScrollLeft}
            />
            <div 
              className={styles.createdImagesList} 
              ref={createdImagesListRef}
            >
              {textToImageTasks.map(task => (
                <div 
                  key={task.id} 
                  className={styles.createdImageItem}
                  onClick={() => task.imageUrl && onSelectPreviousImage(task.imageUrl)}
                >
                  {task.imageUrl && <img src={task.imageUrl} alt={task.prompt} />}
                </div>
              ))}
            </div>
            <Button 
              type="text" 
              icon={<RightOutlined />} 
              className={`${styles.scrollArrow} ${styles.rightArrow}`}
              onClick={handleScrollRight}
              disabled={!canScrollRight}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default ImageUploader;
