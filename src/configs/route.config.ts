import {
  HomeOutlined,
  ToolOutlined,
  FileOutlined,
  VideoCameraOutlined
} from '@ant-design/icons';

export const menuItems = [
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
  {
    key: 'resources',
    icon: <FileOutlined />,
    label: 'Resources',
  },
];

export const NO_SIDEBAR_ROUTES = ['/login', '/register'];

const routes = {
  "/": true,
  "/tools/text": true,
  "/tools/image": true,
  "/creations": true,
};

export default routes; 