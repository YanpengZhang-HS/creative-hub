"use client";

import React, { useState } from "react";
import { Layout, Menu, ConfigProvider, theme } from "antd";
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { useRouter, usePathname } from 'next/navigation';
import { menuItems, NO_SIDEBAR_ROUTES, pathToKeys } from '@/configs/route.config';
import './globals.css';
import { AntdProvider } from './providers';

const { Header, Content, Footer, Sider } = Layout;

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname() || '/';

  const handleMenuClick = ({ key }: { key: string }) => {
    router.push(key);
  };

  const showSidebar = !NO_SIDEBAR_ROUTES.includes(pathname);
  const selectedKeys = [...(pathToKeys[pathname as keyof typeof pathToKeys] || [pathname])];

  return (
    <html lang="en">
      <body>
        <AntdProvider>
          <Layout style={{ minHeight: "100vh", background: '#141414' }}>
            {showSidebar ? (
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
                    alt="Logo"
                    style={{
                      maxHeight: '40px',
                      width: 'auto'
                    }}
                  />
                </div>
                <Menu
                  theme="dark"
                  selectedKeys={selectedKeys}
                  defaultOpenKeys={['tools']}
                  mode="inline"
                  items={menuItems}
                  onClick={handleMenuClick}
                  style={{
                    background: '#1f1f1f',
                  }}
                />
              </Sider>
            ) : null}
            <Layout>
              {showSidebar && (
                <Header style={{ 
                  padding: '0 24px',
                  background: '#1f1f1f',
                  borderBottom: '1px solid #303030',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end'
                }} />
              )}
              <Content style={{ 
                minHeight: 280,
                background: showSidebar ? '#1f1f1f' : '#141414',
              }}>
                {children}
              </Content>
              {showSidebar && (
                <Footer style={{ 
                  textAlign: "center",
                  background: '#1f1f1f',
                  color: '#888',
                  borderTop: '1px solid #303030'
                }}>
                  AI Studio ©{new Date().getFullYear()} Created by AI Studio Team
                </Footer>
              )}
            </Layout>
          </Layout>
        </AntdProvider>
      </body>
    </html>
  );
};

export default AppLayout;
