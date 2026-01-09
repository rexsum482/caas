import React from 'react';
import { Layout, Typography } from 'antd';
import BANNER from '../assets/BannerLogo.png';

const { Header, Content } = Layout;
const { Title } = Typography;
const config = window.DJANGO_CONTEXT;


const Home = (isAuthenticated) => {
  const companyName = config.companyName
  const primaryColor = config.primaryColor
  const accentColor = config.accentColor

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ backgroundColor:`${accentColor}`, padding: '0 24px' }}>
        <center><img src={{ BANNER }} /></center>
      </Header>
      <Content style={{ padding: '24px' }}>

      </Content>
    </Layout>
  );
};

export default Home;