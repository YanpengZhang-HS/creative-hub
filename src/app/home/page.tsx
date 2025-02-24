"use client";

import React from 'react';
import { Card, Typography, Row, Col, Button } from 'antd';
import { RightOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export const HomePage = () => {
  const services = [
    {
      title: "AI Images",
      description: "Powered by JioHotstar AI",
      link: "/tools/image"
    },
    {
      title: "AI Videos",
      description: "Powered by JioHotstar AI",
      link: "/tools/video"
    },
    {
      title: "Effects",
      description: "Powered by JioHotstar AI",
      link: "/tools/effects"
    }
  ];

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ 
        marginBottom: '60px',
        textAlign: 'center'
      }}>
        <Text style={{ 
          color: '#64f4d4',
          fontSize: '18px',
          letterSpacing: '1px'
        }}>
          JIOHOTSTAR AI, SPARK YOUR IMAGINATION
        </Text>
        <Title style={{ 
          fontSize: '48px', 
          marginTop: '20px',
          marginBottom: '40px',
          color: 'white',
          letterSpacing: '-1px'
        }}>
          Next-Generation AI Creative Studio
        </Title>
      </div>

      <Row gutter={[24, 24]}>
        {services.map((service, index) => (
          <Col key={index} xs={24} sm={24} md={8}>
            <Card
              hoverable
              style={{
                height: '100%',
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '12px',
              }}
              styles={{
                body: { 
                  padding: '24px',
                  height: '100%'
                }
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                height: '100%'
              }}>
                <div>
                  <Title level={3} style={{ 
                    color: '#64f4d4',
                    margin: 0,
                    marginBottom: '8px'
                  }}>
                    {service.title}
                  </Title>
                  <Text style={{ 
                    color: '#888',
                    fontSize: '14px'
                  }}>
                    {service.description}
                  </Text>
                </div>
                <Button 
                  type="text" 
                  icon={<RightOutlined />}
                  style={{ 
                    color: '#64f4d4',
                    fontSize: '20px'
                  }}
                />
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <div style={{ 
        marginTop: '60px',
        borderTop: '1px solid #303030',
        paddingTop: '40px'
      }}>
        <Title level={3} style={{ 
          color: 'white',
          marginBottom: '24px'
        }}>
          Created Shorts
        </Title>
        {/* Add trending shorts section here */}
      </div>
    </div>
  );
};

export default HomePage;
