import React from 'react';
import { Input, Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import styles from '../tools.module.css';
import { samplePrompts } from '@/configs/prompt.config';

const { TextArea } = Input;

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  showHints?: boolean;
  required?: boolean;
  label?: string;
  placeholder?: string;
}

const PromptInput: React.FC<PromptInputProps> = ({
  value,
  onChange,
  disabled = false,
  showHints = true,
  required = true,
  label = "Prompt",
  placeholder = "Enter text to describe what you want to generate. Check the tutorial for better results."
}) => {
  const handleRandomPrompt = () => {
    const randomIndex = Math.floor(Math.random() * samplePrompts.length);
    onChange(samplePrompts[randomIndex]);
  };

  const handleHintClick = (hint: string) => {
    onChange(hint);
  };

  return (
    <>
      <div className={styles.sectionTitle}>
        <span className={styles.icon}>✨</span>
        <span>{label}{required ? "" : " (Optional)"}</span>
      </div>
      <div className={styles.inputWrapper}>
        <TextArea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={styles.input}
          disabled={disabled}
        />
      </div>
      {showHints && (
        <div className={styles.hints}>
          <div className={styles.hintTags}>
            {samplePrompts.slice(0, 2).map((hint, index) => (
              <span 
                key={index}
                className={styles.hintTag}
                onClick={() => handleHintClick(hint)}
              >
                {hint.split('.')[0].split(' ').slice(0, 3).join(' ')}
              </span>
            ))}
            <Button
              type="text"
              icon={<ReloadOutlined />}
              onClick={handleRandomPrompt}
              className={styles.refreshButton}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default PromptInput;
