"use client";

import React, { useState } from "react";
import "@ant-design/v5-patch-for-react-19";
import {
  FileOutlined,
  ToolOutlined,
  OpenAIOutlined,
  HomeOutlined
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Layout, Menu, theme } from "antd";
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { useRouter } from 'next/navigation';
import './globals.css';

const { Header, Content, Footer, Sider } = Layout;

type MenuItem = Required<MenuProps>["items"][number];

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[]
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
  } as MenuItem;
}

const items: MenuItem[] = [
  getItem("Home", "/", <HomeOutlined />),
  getItem("Tools", "tools", <ToolOutlined />, [
    getItem("Text to video", "/tools/text"),
    getItem("Image to video", "/tools/image"),
  ]),
  getItem("Library", "library", <OpenAIOutlined />, [
    getItem("AI template", "/library/ai"),
  ]),
  getItem("Resources", "resources", <FileOutlined />),
];

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const handleMenuClick = ({ key }: { key: string }) => {
    router.push(key);
  };

  return (
    <html lang="en">
      <body>
        <AntdRegistry>
          <Layout style={{ minHeight: "100vh", background: '#141414' }}>
            <Sider
              collapsible
              collapsed={collapsed}
              onCollapse={(value) => setCollapsed(value)}
              style={{
                background: '#1f1f1f',
                borderRight: '1px solid #303030'
              }}
            >
              <div className="logo" style={{ 
                height: '64px',
                margin: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <img
                  src="/logo.png"
                  alt="JioHotstar AI Logo"
                  style={{
                    maxHeight: '40px',
                    width: 'auto'
                  }}
                />
              </div>
              <Menu
                theme="dark"
                defaultSelectedKeys={["/"]}
                mode="inline"
                items={items}
                onClick={handleMenuClick}
                style={{
                  background: '#1f1f1f',
                }}
              />
            </Sider>
            <Layout>
              <Header style={{ 
                padding: '0 24px',
                background: '#1f1f1f',
                borderBottom: '1px solid #303030',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end'
              }} />
              <Content style={{ 
                minHeight: 280,
                background: '#1f1f1f',
              }}>
                {children}
              </Content>
              <Footer style={{ 
                textAlign: "center",
                background: '#1f1f1f',
                color: '#888',
                borderTop: '1px solid #303030'
              }}>
                JioHotstar AI ©{new Date().getFullYear()} Created by JioHotstar
              </Footer>
            </Layout>
          </Layout>
        </AntdRegistry>
      </body>
    </html>
  );
};

export default AppLayout;
