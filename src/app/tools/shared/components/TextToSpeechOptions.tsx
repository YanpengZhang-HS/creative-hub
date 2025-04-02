import React, { useState } from 'react';
import { Select, Input, Button } from 'antd';
import { PlayCircleOutlined, PauseOutlined } from '@ant-design/icons';
import styles from '../tools.module.css';

const { Option } = Select;

interface TextToSpeechOptionsProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  emotion: string;
  onEmotionChange: (value: string) => void;
  language: string;
  onLanguageChange: (value: string) => void;
  speed: string;
  onSpeedChange: (value: string) => void;
  speaker: string;
  onSpeakerChange: (value: string) => void;
  emotions: string[];
  languages: string[];
  speeds: string[];
  speakers: string[];
  disabled?: boolean;
}

const TextToSpeechOptions: React.FC<TextToSpeechOptionsProps> = ({
  prompt,
  onPromptChange,
  emotion,
  onEmotionChange,
  language,
  onLanguageChange,
  speed,
  onSpeedChange,
  speaker,
  onSpeakerChange,
  emotions,
  languages,
  speeds,
  speakers,
  disabled = false
}) => {
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [playingSpeaker, setPlayingSpeaker] = useState<string | null>(null);

  // Play sample audio for selected speaker
  const handlePlaySample = (speakerName: string) => {
    // If clicking the same speaker that's currently playing, pause it
    if (playingSpeaker === speakerName && currentAudio) {
      currentAudio.pause();
      setPlayingSpeaker(null);
      setCurrentAudio(null);
      return;
    }

    // Stop current audio if playing
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }

    // Create new audio element
    const audio = new Audio(`/sample/${speakerName}.wav`);
    audio.onended = () => {
      setPlayingSpeaker(null);
      setCurrentAudio(null);
    };
    
    setCurrentAudio(audio);
    setPlayingSpeaker(speakerName);
    audio.play();
  };

  // Cleanup audio on unmount
  React.useEffect(() => {
    return () => {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
    };
  }, [currentAudio]);

  return (
    <div className={styles.textInputSection}>
      <div className={styles.inputGroup}>
        <div className={styles.inputLabel}>Prompt</div>
        <Input.TextArea
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder="Enter text for speech generation"
          rows={4}
          className={styles.textInput}
          disabled={disabled}
        />
      </div>
      <div className={styles.optionsGrid}>
        <div className={styles.selectGroup}>
          <div className={styles.inputLabel}>Emotion</div>
          <Select
            value={emotion}
            onChange={onEmotionChange}
            className={styles.select}
            disabled={disabled}
          >
            {emotions.map(e => (
              <Option key={e} value={e}>{e}</Option>
            ))}
          </Select>
        </div>
        <div className={styles.selectGroup}>
          <div className={styles.inputLabel}>Language</div>
          <Select
            value={language}
            onChange={onLanguageChange}
            className={styles.select}
            disabled={disabled}
          >
            {languages.map(l => (
              <Option key={l} value={l}>{l}</Option>
            ))}
          </Select>
        </div>
        <div className={styles.selectGroup}>
          <div className={styles.inputLabel}>Speed</div>
          <Select
            value={speed}
            onChange={onSpeedChange}
            className={styles.select}
            disabled={disabled}
          >
            {speeds.map(s => (
              <Option key={s} value={s}>{s}</Option>
            ))}
          </Select>
        </div>
        <div className={styles.selectGroup}>
          <div className={styles.inputLabel}>Speaker</div>
          <div className={styles.speakerSelectContainer}>
            <Select
              value={speaker}
              onChange={onSpeakerChange}
              className={styles.select}
              disabled={disabled}
            >
              {speakers.map(s => (
                <Option key={s} value={s}>{s}</Option>
              ))}
            </Select>
            <Button
              type="text"
              icon={playingSpeaker === speaker ? <PauseOutlined /> : <PlayCircleOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handlePlaySample(speaker);
              }}
              className={styles.playButton}
              disabled={disabled}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextToSpeechOptions;
