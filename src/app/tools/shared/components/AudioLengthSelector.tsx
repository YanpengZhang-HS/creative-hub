import React from 'react';
import { Select } from 'antd';
import styles from '../tools.module.css';

interface AudioLengthOption {
  value: string;
  label: string;
}

interface AudioLengthSelectorProps {
  value: string;
  onChange: (value: string) => void;
  options: AudioLengthOption[];
  disabled?: boolean;
}

const AudioLengthSelector: React.FC<AudioLengthSelectorProps> = ({
  value,
  onChange,
  options,
  disabled = false
}) => {
  return (
    <div className={styles.settingItem}>
      <span className={styles.settingLabel}>
        Music Length
      </span>
      <Select
        value={value}
        onChange={onChange}
        options={options}
        className={styles.audioSecondsSelect}
        disabled={disabled}
      />
    </div>
  );
};

export default AudioLengthSelector;
