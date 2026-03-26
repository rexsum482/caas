import React, { useState, useEffect } from "react";
import {
  Layout,
  Row,
  Col,
  Typography,
  Button,
  Input,
  Select,
  Slider,
  Card,
  Space
} from "antd";
import {
  SearchOutlined,
  ThunderboltOutlined,
  ShopOutlined
} from "@ant-design/icons";
import api from "../components/axios";

const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;
const { Option } = Select;

const LandingPage = () => {
  const [search, setSearch] = useState("");
  const [service, setService] = useState("");
  const [radius, setRadius] = useState(25);
  const [companies, setCompanies] = useState([]);
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
      });
    }
  }, []);

  const searchCompanies = async () => {
    const res = await api.get("/public-companies/", {
      params: { search, service, radius, lat, lng },
    });
    setCompanies(res.data.results || res.data);
  };

  return (
    <Layout style={{ background: "#f5f7fb" }}>
      <Content style={{ maxWidth: 1200, margin: "auto", padding: "2rem" }}>

        {/* ================= HERO ================= */}
        <Row gutter={[40, 40]} align="middle">
          <Col xs={24} md={12}>
            <Title>
              Run Your Service Business on Your Own Domain
            </Title>

            <Paragraph style={{ fontSize: 18 }}>
              Create your own branded website with invoicing, messaging,
              and scheduling — all in one platform.
            </Paragraph>

            <Space>
              <Button
                type="primary"
                size="large"
                icon={<ShopOutlined />}
                href="/register-company"
              >
                Register Your Company
              </Button>

              <Button size="large" href="/about">
                Learn More
              </Button>
            </Space>
          </Col>

          <Col xs={24} md={12}>
            {/* 🔎 SEARCH CARD */}
            <Card style={{ borderRadius: 12 }}>
              <Title level={4}>Find a Local Service</Title>

              <Space direction="vertical" style={{ width: "100%" }}>
                <Input
                  placeholder="Search (plumber, HVAC...)"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  prefix={<SearchOutlined />}
                />

                <Select
                  placeholder="Service"
                  allowClear
                  onChange={setService}
                >
                  <Option value="plumbing">Plumbing</Option>
                  <Option value="hvac">HVAC</Option>
                  <Option value="electrical">Electrical</Option>
                  <Option value="roofing">Roofing</Option>
                  <Option value="general">Handyman</Option>
                </Select>

                <div>
                  <Text>Radius: {radius} miles</Text>
                  <Slider
                    min={5}
                    max={100}
                    value={radius}
                    onChange={setRadius}
                  />
                </div>

                <Button
                  type="primary"
                  size="large"
                  onClick={searchCompanies}
                >
                  Search
                </Button>

                {/* RESULTS */}
                {companies.length > 0 && (
                  <div style={{ maxHeight: 250, overflowY: "auto" }}>
                    {companies.map((c) => (
                      <div
                        key={c.id}
                        style={{
                          padding: 10,
                          borderBottom: "1px solid #eee",
                          cursor: "pointer"
                        }}
                        onClick={() =>
                          (window.location.href = `https://${c.subdomain}.${window.location.hostname}`)
                        }
                      >
                        <strong>{c.name}</strong><br />
                        <Text type="secondary">
                          {c.city}, {c.state}
                          {c.distance && ` • ${c.distance.toFixed(1)} mi`}
                        </Text>
                      </div>
                    ))}
                  </div>
                )}
              </Space>
            </Card>
          </Col>
        </Row>

        {/* ================= SOCIAL PROOF ================= */}
        <Row style={{ marginTop: 80 }} gutter={[24, 24]}>
          <Col span={24}>
            <Title level={3} style={{ textAlign: "center" }}>
              Built for Real Service Businesses
            </Title>
          </Col>

          <Col xs={24} md={8}>
            <Card>
              <ThunderboltOutlined style={{ fontSize: 30 }} />
              <Title level={4}>All-in-One Platform</Title>
              <Paragraph>
                Invoicing, messaging, scheduling — no more juggling tools.
              </Paragraph>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card>
              <ShopOutlined style={{ fontSize: 30 }} />
              <Title level={4}>Your Own Domain</Title>
              <Paragraph>
                Your business gets its own branded subdomain instantly.
              </Paragraph>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card>
              <SearchOutlined style={{ fontSize: 30 }} />
              <Title level={4}>Get Found</Title>
              <Paragraph>
                Customers can discover your business by location & service.
              </Paragraph>
            </Card>
          </Col>
        </Row>

        {/* ================= FINAL CTA ================= */}
        <Row justify="center" style={{ marginTop: 80 }}>
          <Col>
            <Card style={{ textAlign: "center", padding: 40 }}>
              <Title>Start Growing Your Business Today</Title>

              <Paragraph>
                Set up your company in minutes and start accepting customers.
              </Paragraph>

              <Button
                type="primary"
                size="large"
                href="/register-company"
              >
                Register Your Company
              </Button>
            </Card>
          </Col>
        </Row>

      </Content>
    </Layout>
  );
};

export default LandingPage;
