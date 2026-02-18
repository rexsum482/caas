import React from "react";
import { Layout, Typography, Card } from "antd";
import BANNER from "../assets/BannerLogo.png";
import { motion } from "framer-motion";

const { Title, Text } = Typography;
const { Header, Content } = Layout;
const config = window.DJANGO_CONTEXT;

const Home = ({ isAuthenticated }) => {
  const companyName = config.companyName;
  const primaryColor = config.primaryColor;
  const accentColor = config.accentColor;

  return (
    <Layout className="min-h-screen bg-white">
      {/* Header / Banner */}
      <Header
        className="
          flex
          justify-center
          items-center
          bg-transparent
          px-4
          py-6
          md:py-10
        "
      >
      <motion.img
        src={BANNER}
        alt={companyName}
        className="
          w-auto
          max-h-[260px]
          md:max-h-[320px]
        "
        initial={{ x: "-100vw", opacity: 0 }}
        animate={{
          x: [0, 20, -12, 6, 0],
          opacity: 1,
        }}
        transition={{
          x: {
            duration: 1.2,
            ease: "easeOut",
          },
          opacity: { duration: 0.4 },
          delay: 0.2
        }}
      />
      </Header>

      {/* Content */}
      <Content
        className="
          flex
          justify-center
          px-4
          pb-10
        "
      >
        <Card
          bordered={false}
          className="
            w-full
            max-w-md
            rounded-xl
            border border-blue-100
            bg-gradient-to-br from-blue-50 via-white to-white
            shadow-sm
          "
          title={
            <div className="text-center font-semibold text-blue-700">
              Working Hours
            </div>
          }
        >
          {/* Business Info */}
          <div className="text-center space-y-1">
            <Title level={4} className="!mb-0">
              Reliable Air & Appliance, LLC
            </Title>

            <Title level={5} className="!mt-1">
              HVAC & Appliance Service
            </Title>

            <a
              href="tel:9729924878"
              className="block text-blue-600 font-medium"
            >
              ☎️ (972) 992-4878
            </a>
          </div>

          {/* Hours */}
          <div className="mt-6 space-y-4 text-center">
            <div>
              <Text strong>Monday – Friday</Text>
              <br />
              <Text>8:00 AM – 6:00 PM</Text>
            </div>

            <div>
              <Text strong>Saturday</Text>
              <br />
              <Text>9:00 AM – 3:00 PM</Text>
            </div>

            <div className="pt-3 border-t border-dashed border-gray-200">
              <Text type="secondary" className="text-sm">
                Emergency service available after hours
              </Text>
            </div>
          </div>
        </Card>
      </Content>
    </Layout>
  );
};

export default Home;
