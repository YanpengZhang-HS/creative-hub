import { Button, Result } from 'antd';
import React from 'react';

const NoFoundPage: React.FC = () => (
  <Result
    status="404"
    title="404"
    subTitle={"Page not found"}
    extra={
      <Button type="primary">
        {"Return"}
      </Button>
    }
  />
);

export default NoFoundPage;
