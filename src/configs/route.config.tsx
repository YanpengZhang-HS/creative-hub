import {
  FileOutlined,
  ToolOutlined,
  OpenAIOutlined,
  HomeOutlined
} from "@ant-design/icons";
import type { MenuProps } from "antd";

export type MenuItem = Required<MenuProps>['items'][number];

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

export const NO_SIDEBAR_ROUTES = [];

export const menuItems: MenuItem[] = [
  getItem("Home", "/", <HomeOutlined />),
  getItem("Tools", "tools", <ToolOutlined />, [
    getItem("Text to Video", "/tools/text"),
    getItem("Image to Video", "/tools/image"),
  ]),
  getItem("Library", "library", <OpenAIOutlined />, [
    getItem("AI Template", "/library/ai"),
  ]),
  getItem("Resources", "resources", <FileOutlined />),
]; 