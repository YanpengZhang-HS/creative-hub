import React from 'react';
import { Select } from 'antd';
import styles from '../tools.module.css';

const { Option } = Select;

interface ModelOption {
  value: string;
  label?: string;
}

interface ModelSelectorProps {
  value: string;
  onChange: (value: string) => void;
  options: ModelOption[];
  disabled?: boolean;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
  value,
  onChange,
  options,
  disabled = false
}) => {
  return (
    <div className={styles.settingItem}>
      <div className={styles.sectionTitle} style={{ marginBottom: 0, display: 'flex', alignItems: 'center' }}>
        <span className={styles.icon}>🤖</span>
        <span>Model</span>
      </div>
      <Select
        className={styles.modelSelect}
        value={value}
        onChange={onChange}
        disabled={disabled}
        style={{ width: '70%' }}
      >
        {options.map(option => (
          <Option key={option.value} value={option.value}>
            {option.label || option.value}
          </Option>
        ))}
      </Select>
    </div>
  );
};

export default ModelSelector;
