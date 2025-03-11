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
        key: '/tools/text2image',
        label: 'Text to Image',
      },
      {
        key: '/tools/image',
        label: 'Image to Video',
      },
      {
        key: '/tools/lipsync',
        label: 'Lip Sync',
      },
      {
        key: '/tools/soundeffect',
        label: 'Sound Effect',
      },
    ],
  },
  {
    key: '/creations',
    icon: <VideoCameraOutlined />,
    label: 'My Creations',
  },
];

export * from './route.config.base'; 