"use client";

import React from 'react';
import { Card, Typography, Row, Col, Button } from 'antd';
import { RightOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { topCreations } from '@/configs/creation.config';
import styles from './Home.module.css';

const { Title, Text } = Typography;

export default function Home() {
  const router = useRouter();
  
  const services = [
    {
      title: "Text To Video",
      description: "Powered by JioHotstar AI",
      link: "/tools/text"
    },
    {
      title: "Text To Image",
      description: "Powered by JioHotstar AI",
      link: "/tools/text2image"
    },
    {
      title: "Image To Video",
      description: "Powered by JioHotstar AI",
      link: "/tools/image"
    },
    {
      title: "Lip Sync",
      description: "Powered by JioHotstar AI",
      link: "/tools/lipsync"
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
              onClick={() => router.push(service.link)}
              style={{
                height: '100%',
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '12px',
                cursor: 'pointer'
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
        paddingTop: '40px',
        paddingBottom: '100px'
      }}>
        <Title level={3} style={{ 
          color: 'white',
          marginBottom: '24px'
        }}>
          Top Creations
        </Title>
        <Row gutter={[24, 24]}>
          {topCreations.map((creation, index) => (
            <Col xs={24} sm={12} md={8} key={index}>
              <Card
                hoverable
                className={styles.hoverCard}
                styles={{
                  body: {
                    padding: '24px',
                    height: '100%'
                  }
                }}
              >
                <div style={{
                  position: 'relative',
                  width: '100%',
                  height: '100%'
                }}>
                  <div
                    style={{
                      position: 'relative',
                      paddingBottom: '56.25%', // 16:9 aspect ratio
                      height: 0,
                      overflow: 'hidden',
                      marginBottom: '16px'
                    }}
                  >
                    <video
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        border: 'none'
                      }}
                      src={creation.videoUrl}
                      title={creation.title}
                      controls
                      playsInline
                    />
                  </div>
                  <Title level={4} style={{
                    color: '#64f4d4',
                    margin: 0,
                    marginBottom: '8px'
                  }}>
                    {creation.title}
                  </Title>
                  <Text
                    style={{
                      color: '#888',
                      fontSize: '14px',
                      height: '40px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      const target = e.currentTarget;
                      target.style.height = 'auto';
                      target.style.webkitLineClamp = 'unset';
                    }}
                    onMouseLeave={(e) => {
                      const target = e.currentTarget;
                      target.style.height = '40px';
                      target.style.webkitLineClamp = '2';
                    }}
                  >
                    {creation.description}
                  </Text>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
}
