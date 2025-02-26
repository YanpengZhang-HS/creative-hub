"use client";

import {
  HomeOutlined,
  ToolOutlined,
  VideoCameraOutlined
} from '@ant-design/icons';
import type { ReactNode } from 'react';

interface MenuItem {
  key: string;
  icon?: ReactNode;
  label: string;
  children?: MenuItem[];
}

export const menuItems: MenuItem[] = [
  {
    key: '/',
    icon: <HomeOutlined />,
    label: 'Home',
  },
  {
    key: 'tools',
    icon: <ToolOutlined />,
    label: 'Tools',
    children: [
      {
        key: '/tools/text',
        label: 'Text to Video',
      },
      {
        key: '/tools/image',
        label: 'Image to Video',
      },
    ],
  },
  {
    key: '/creations',
    icon: <VideoCameraOutlined />,
    label: 'Creations',
  },
];

export * from './route.config.base'; 