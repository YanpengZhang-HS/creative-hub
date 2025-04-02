import React from 'react';
import { Input } from 'antd';
import styles from '../tools.module.css';

const { TextArea } = Input;

interface NegativePromptProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const NegativePrompt: React.FC<NegativePromptProps> = ({
  value,
  onChange,
  disabled = false
}) => {
  return (
    <div className={styles.negativePromptSection}>
      <div className={styles.sectionTitle}>
        <span className={styles.icon}>⛔</span>
        <span>Negative Prompt (Optional)</span>
      </div>
      <div className={styles.inputWrapper}>
        <TextArea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter elements you don't want to appear in the generated content"
          className={styles.input}
          disabled={disabled}
        />
      </div>
    </div>
  );
};

export default NegativePrompt;
