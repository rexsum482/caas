import React from "react";
import {
  Layout,
  Row,
  Col,
  Card,
  Image,
  Typography,
  Button,
} from "antd";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import ADD_CUSTOMER from "../assets/add_customer.jpg";
import INVOICE from "../assets/invoices.jpg";
import CONTACT from "../assets/contact.jpg";
import APPOINTMENTS from "../assets/appointments.jpg";
import CUSTOMERS from "../assets/customers.jpg";
import MESSAGES from "../assets/messages.jpg";
import SCHEDULE from "../assets/schedule.jpg";

const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;

const features = [
  {
    title: "Customer Management",
    desc: "Easily add, organize, and manage your customers in one place.",
    img: CUSTOMERS,
  },
  {
    title: "Invoicing",
    desc: "Create professional invoices, track payments, and manage balances.",
    img: INVOICE,
  },
  {
    title: "Messaging",
    desc: "Communicate with customers directly inside your dashboard.",
    img: MESSAGES,
  },
  {
    title: "Scheduling",
    desc: "Book, manage, and track appointments with ease.",
    img: SCHEDULE,
  },
  {
    title: "Appointments",
    desc: "View upcoming jobs and stay organized across your team.",
    img: APPOINTMENTS,
  },
  {
    title: "Customer Contact",
    desc: "Store contact details and service history for every client.",
    img: CONTACT,
  },
];

export default function About() {
  const navigate = useNavigate();

  return (
    <Layout className="bg-gray-50">
      <Content className="max-w-6xl mx-auto p-6">

        {/* HERO SECTION */}
        <div className="text-center mb-12">
          <Title level={1}>Run Your Business. We Handle the Software.</Title>

          <Paragraph className="text-lg max-w-2xl mx-auto">
            This platform is a complete business management system designed for
            service-based companies. Create your own company, get your own
            subdomain, and start managing customers, invoices, messaging, and
            scheduling — all in one place.
          </Paragraph>

          <Button
            type="primary"
            size="large"
            className="mt-4"
            onClick={() => navigate("/register-company")}
          >
            Get Started
          </Button>
        </div>

        {/* HOW IT WORKS */}
        <Card className="mb-12 rounded-2xl shadow-md">
          <Title level={3}>How It Works</Title>

          <Row gutter={[24, 24]}>
            <Col xs={24} md={8}>
              <div className="text-center">
                <Title level={4}>1. Register Your Company</Title>
                <Text>
                  Create your business profile in minutes. Add your branding,
                  contact info, and business hours.
                </Text>
              </div>
            </Col>

            <Col xs={24} md={8}>
              <div className="text-center">
                <Title level={4}>2. Get Your Own Subdomain</Title>
                <Text>
                  Your business gets its own dedicated space like:
                  <br />
                  <strong>yourcompany.yourapp.com</strong>
                </Text>
              </div>
            </Col>

            <Col xs={24} md={8}>
              <div className="text-center">
                <Title level={4}>3. Start Managing Everything</Title>
                <Text>
                  Access invoicing, messaging, scheduling, and customer tools
                  instantly.
                </Text>
              </div>
            </Col>
          </Row>
        </Card>

        {/* FEATURES GRID */}
        <Card className="mb-12 rounded-2xl shadow-md">
          <Title level={3} className="text-center mb-8">
            Everything You Need
          </Title>

          <Row gutter={[24, 24]}>
            {features.map((f, i) => (
              <Col xs={24} sm={12} md={8} key={i}>
                <motion.div
                  whileHover={{ scale: 1.04 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card
                    hoverable
                    className="rounded-xl overflow-hidden h-full"
                    cover={
                      <Image
                        src={f.img}
                        preview={false}
                        className="h-48 object-cover"
                      />
                    }
                  >
                    <Title level={5}>{f.title}</Title>
                    <Text type="secondary">{f.desc}</Text>
                  </Card>
                </motion.div>
              </Col>
            ))}
          </Row>
        </Card>

        {/* VALUE PROPOSITION */}
        <Card className="mb-12 rounded-2xl shadow-md">
          <Title level={3}>Why Use This Platform?</Title>

          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <ul className="space-y-3">
                <li>✅ No server setup required</li>
                <li>✅ No coding or configuration</li>
                <li>✅ Your own branded experience</li>
                <li>✅ Works on desktop and mobile</li>
              </ul>
            </Col>

            <Col xs={24} md={12}>
              <ul className="space-y-3">
                <li>✅ Centralized customer data</li>
                <li>✅ Built-in invoicing system</li>
                <li>✅ Messaging + notifications</li>
                <li>✅ Real-time scheduling tools</li>
              </ul>
            </Col>
          </Row>
        </Card>

        {/* CTA */}
        <Card className="text-center rounded-2xl shadow-md">
          <Title level={2}>Ready to Launch Your Business?</Title>

          <Paragraph className="max-w-xl mx-auto">
            Create your company, get your own subdomain, and start managing your
            business today. No setup. No hassle.
          </Paragraph>

          <Button
            type="primary"
            size="large"
            onClick={() => navigate("/register-company")}
          >
            Create Your Company
          </Button>
        </Card>
      </Content>
    </Layout>
  );
}
