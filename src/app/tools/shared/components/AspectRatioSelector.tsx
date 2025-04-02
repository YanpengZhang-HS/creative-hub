import React from 'react';
import { Button } from 'antd';
import styles from '../tools.module.css';

interface AspectRatioSelectorProps {
  aspectRatio: string;
  onAspectRatioChange: (ratio: string) => void;
  disabled?: boolean;
  options: Array<{
    value: string;
    label: string;
  }>;
}

const AspectRatioSelector: React.FC<AspectRatioSelectorProps> = ({
  aspectRatio,
  onAspectRatioChange,
  disabled = false,
  options
}) => {
  return (
    <div className={styles.settingItem}>
      <span className={styles.settingLabel}>Aspect Ratio</span>
      <div className={styles.aspectRatioButtons}>
        {options.map((option) => (
          <Button
            key={option.value}
            type={aspectRatio === option.value ? 'primary' : 'default'}
            onClick={() => onAspectRatioChange(option.value)}
            className={styles.aspectButton}
            disabled={disabled}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default AspectRatioSelector;
