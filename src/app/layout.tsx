"use client";

import React, { useState } from "react";
import "@ant-design/v5-patch-for-react-19";
import {
  FileOutlined,
  ToolOutlined,
  OpenAIOutlined
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Breadcrumb, Layout, Menu, theme } from "antd";
import { AntdRegistry } from '@ant-design/nextjs-registry';

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
  getItem("Tools", "tools", <ToolOutlined />, [
    getItem("Text to video", "text"),
    getItem("Image to video", "image"),
  ]),
  getItem("Library", "library", <OpenAIOutlined />, [
    getItem("AI template", "ai"),
  ]),
  getItem("Resources", "resource", <FileOutlined />),
];

const App: React.FC = ({ children }: React.PropsWithChildren) => {
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  return (
    <html lang="en">
      <body>
        <AntdRegistry>
        <Layout style={{ minHeight: "100vh" }}>
          <Sider
            collapsible
            collapsed={collapsed}
            onCollapse={(value) => setCollapsed(value)}
          >
            <div className="demo-logo-vertical" />
            <Menu
              theme="dark"
              defaultSelectedKeys={["1"]}
              mode="inline"
              items={items}
            />
          </Sider>
          <Layout>
            <Header style={{ padding: 0, background: colorBgContainer }} />
            <Content style={{ margin: "0 16px" }}>
            <Breadcrumb style={{ margin: "16px 0" }} items={[{
              title: 'Tools'
            }, {
              title: 'Text to video'
            }]} />

              <div
                style={{
                  padding: 24,
                  minHeight: 360,
                  background: colorBgContainer,
                  borderRadius: borderRadiusLG,
                }}
              >
                       {children}
              </div>
       
            </Content>
            <Footer style={{ textAlign: "center" }}>
              Ant Design ©{new Date().getFullYear()} Created by Ant UED
            </Footer>
          </Layout>
        </Layout>
        </AntdRegistry>
      </body>
    </html>
  );
};

export default App;
