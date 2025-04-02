import React from 'react';
import Image from 'next/image';
import styles from '../tools.module.css';

interface PlaceholderProps {
  aspectRatio?: string;
}

const Placeholder: React.FC<PlaceholderProps> = ({ aspectRatio }) => {
  return (
    <div className={styles.taskList}>
      <div className={styles.taskItem}>
        {aspectRatio && (
          <div className={styles.taskContent} data-aspect-ratio={aspectRatio}>
            <div className={styles.placeholder}>
              <Image
                src="/create_guide.svg"
                alt="Start Creating"
                width={180}
                height={180}
                priority
              />
              <p>Create your first masterpiece!</p>
            </div>
          </div>
        )}
        {!aspectRatio && (
          <div className={styles.placeholder}>
            <Image
              src="/create_guide.svg"
              alt="Start Creating"
              width={240}
              height={240}
              priority
            />
            <p>Create your first masterpiece!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Placeholder;
