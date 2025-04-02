import React, { ReactNode } from 'react';
import { Button } from 'antd';
import styles from '../tools.module.css';

interface ToolPageLayoutProps {
  leftSection: ReactNode;
  rightSection: ReactNode;
  isClient: boolean;
  loading: boolean;
  onGenerate: () => void;
  isGenerateDisabled: boolean;
  placeholderContent: ReactNode;
}

const ToolPageLayout: React.FC<ToolPageLayoutProps> = ({
  leftSection,
  rightSection,
  isClient,
  loading,
  onGenerate,
  isGenerateDisabled,
  placeholderContent
}) => {
  // For server-side rendering or client initialization
  if (!isClient) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.mainContent}>
          <div className={styles.leftSection}>
            {leftSection}
            <div className={styles.buttonGroup}>
              <Button
                className={styles.generateButton}
                type="primary"
                disabled={true}
              >
                Create
              </Button>
            </div>
          </div>
          <div className={styles.rightSection}>
            {placeholderContent}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.mainContent}>
        <div className={styles.leftSection}>
          {leftSection}
          <div className={styles.buttonGroup}>
            <Button
              className={styles.generateButton}
              type="primary"
              onClick={onGenerate}
              loading={loading}
              disabled={isGenerateDisabled || loading}
            >
              Create
            </Button>
          </div>
        </div>
        <div className={styles.rightSection}>
          {rightSection}
        </div>
      </div>
    </div>
  );
};

export default ToolPageLayout;
