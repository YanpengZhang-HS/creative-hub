"use client";

import React from 'react';
import { Typography, Card } from 'antd';

const { Title } = Typography;

const TextToVideoPage = () => {
  return (
    <div>
      <Title level={2} style={{ color: 'white', marginBottom: '24px' }}>
        Text to Video
      </Title>
      <Card 
        style={{
          background: '#1f1f1f',
          border: '1px solid #303030',
          borderRadius: '12px'
        }}
        styles={{
          body: {
            padding: '24px'
          }
        }}
      >
        {/* Add your text to video conversion UI here */}
      </Card>
    </div>
  );
};

export default TextToVideoPage; 