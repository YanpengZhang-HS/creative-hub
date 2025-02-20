import React from 'react';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { RouteGuard } from '@/components/RouteGuard';

const RootLayout = ({ children }: React.PropsWithChildren) => {
  console.log('>>>>> ',children)
  return (
  <html lang="en">
    <body>
      <RouteGuard><AntdRegistry>{children}</AntdRegistry></RouteGuard> 
    </body>
  </html>
  )
};

export default RootLayout;