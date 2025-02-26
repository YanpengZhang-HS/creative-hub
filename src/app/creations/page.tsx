"use client";

import React, { useState } from 'react';
import { Tabs, Input } from 'antd';
import styles from './page.module.css';
import VideoGrid from './VideoGrid';

const { Search } = Input;

const CreationsPage = () => {
  const [activeTab, setActiveTab] = useState('all');

  const items = [
    {
      key: 'all',
      label: 'ALL',
    },
    {
      key: 'favorite',
      label: '⭐ Favorite',
    },
  ];

  return (
    <div className={styles.container}>
      {/* <div className={styles.header}>
        <Tabs 
          activeKey={activeTab} 
          items={items}
          onChange={setActiveTab}
        />
        <Search
          placeholder="Search"
          allowClear
          className={styles.search}
        />
      </div> */}
      <VideoGrid activeTab={activeTab} />
    </div>
  );
};

export default CreationsPage; 