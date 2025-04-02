import React from 'react';
import { Radio } from 'antd';
import styles from '../tools.module.css';

interface AudioTextToggleProps {
  value: 'audio' | 'text';
  onChange: (value: 'audio' | 'text') => void;
  disabled?: boolean;
}

const AudioTextToggle: React.FC<AudioTextToggleProps> = ({ value, onChange, disabled = false }) => {
  return (
    <>
      <div className={styles.sectionTitle} style={{ marginTop: '24px' }}>
        <span className={styles.icon}>🔊</span>
        <span>Audio Source</span>
      </div>
      
      <Radio.Group 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className={styles.radioGroup}
        disabled={disabled}
      >
        <Radio value="audio">Upload Audio File</Radio>
        <Radio value="text">Generate from Text</Radio>
      </Radio.Group>
    </>
  );
};

export default AudioTextToggle;
