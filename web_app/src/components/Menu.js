import React, { useState, useEffect } from "react";
import {
  Layout,
  Menu,
  Button,
  Drawer,
  Badge,
  List,
  Typography,
  Space
} from "antd";

import {
  LogoutOutlined,
  MenuOutlined,
  LoginOutlined,
  UserAddOutlined,
  MailOutlined,
  BellOutlined
} from "@ant-design/icons";

import { useLocation, useNavigate } from "react-router-dom";
import BANNER_LOGO from "../assets/BannerLogoWhite.png";
import { useNotifications } from "../context/NotificationContext";

const { Header } = Layout;
const { Text } = Typography;

const config = window.DJANGO_CONTEXT;

const TopNavBar = ({ isAuthenticated, isAdmin }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const companyName = config.companyName;
  const accentColor = config.accentColor;

  const [mobileOpen, setMobileOpen] = useState(false);
  const [open, setOpen] = useState(false);

  const {
    notifications,
    unread,
    messageUnread,
    markRead,
    markAllRead,
    fetchNotifications
  } = useNotifications();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
    window.location.reload();
  };

  const navigateAndClose = (path) => {
    navigate(path);
    setTimeout(() => setMobileOpen(false), 150);
  };

  const getSelectedKey = () => {
    const path = location.pathname;

    const map = [
      { key: "home", match: /^\/$/ },
      { key: "customers", match: /^\/customers/ },
      { key: "invoices", match: /^\/invoices/ },
      { key: "appointments", match: /^\/appointments/ },
      { key: "messages", match: /^\/messages/ },
      { key: "contact", match: /^\/contact/ },
      { key: "schedule", match: /^\/schedule/ },
      { key: "about", match: /^\/about/ },
      { key: "myinvoices", match: /^\/myinvoices/ },
      { key: "profile", match: /^\/profile/ }
    ];

    return (map.find(r => r.match.test(path)) || {}).key || "";
  };

  return (
    <>
      <Layout>
        <Header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: accentColor,
            padding: "20px",
          }}
        >
          <a href="/">
            <img src={BANNER_LOGO} alt="logo" style={{ height: 40 }} />
          </a>

          {/* Desktop Menu */}
          <div style={{ flex: 1 }}>
            <Menu
              theme="dark"
              mode="horizontal"
              selectedKeys={[getSelectedKey()]}
              style={{ background: "transparent", justifyContent: "center" }}
            >
              <Menu.Item key="home">
                <a href="/">Home</a>
              </Menu.Item>

              {isAdmin ? (
                <>
                  <Menu.Item key="customers"><a href="/customers">Customers</a></Menu.Item>
                  <Menu.Item key="invoices"><a href="/invoices">Invoices</a></Menu.Item>
                  <Menu.Item key="appointments"><a href="/appointments">Appointments</a></Menu.Item>

                  <Menu.Item
                    key="messages"
                    icon={
                      <Badge count={messageUnread} size="small">
                        <MailOutlined />
                      </Badge>
                    }
                  >
                    <a href="/messages">Messages</a>
                  </Menu.Item>
                </>
              ) : (
                <>
                  {isAuthenticated && (
                    <>
                      <Menu.Item key="profile">
                        <a href="/profile">Profile</a>
                      </Menu.Item>

                      <Menu.Item key="myinvoices">
                        <a href="/myinvoices">My Invoices</a>
                      </Menu.Item>
                    </>
                  )}

                  <Menu.Item key="contact"><a href="/contact">Contact</a></Menu.Item>
                  <Menu.Item key="schedule"><a href="/schedule">Schedule</a></Menu.Item>
                  <Menu.Item key="about"><a href="/about">About</a></Menu.Item>
                </>
              )}
            </Menu>
          </div>

          {/* Right Side */}
          <Space>
            {isAuthenticated && (
              <Badge count={unread}>
                <BellOutlined
                  style={{ fontSize: 22, color: "white", cursor: "pointer" }}
                  onClick={() => setOpen(true)}
                />
              </Badge>
            )}

            {isAdmin && (
              <Badge count={messageUnread}>
                <MailOutlined
                  style={{ fontSize: 22, color: "white", cursor: "pointer" }}
                  onClick={() => navigate("/messages")}
                />
              </Badge>
            )}

            {!isAuthenticated ? (
              <>
                <Button icon={<LoginOutlined />} onClick={() => navigate("/login")}>
                  Login
                </Button>

                <Button
                  type="primary"
                  icon={<UserAddOutlined />}
                  onClick={() => navigate("/signup")}
                >
                  Sign Up
                </Button>
              </>
            ) : (
              <Button
                type="primary"
                icon={<LogoutOutlined />}
                onClick={handleLogout}
              >
                Logout
              </Button>
            )}

            <Button
              type="text"
              icon={<MenuOutlined style={{ fontSize: 22, color: "white" }} />}
              onClick={() => setMobileOpen(true)}
            />
          </Space>
        </Header>
      </Layout>

      {/* Notifications Drawer */}
      <Drawer
        title="Notifications"
        placement="right"
        open={open}
        onClose={() => setOpen(false)}
      >
        <List
          dataSource={notifications}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta title={item.title} description={item.content} />
            </List.Item>
          )}
        />
      </Drawer>

      {/* Mobile Drawer */}
      <Drawer
        title={companyName}
        placement="right"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
      >
        <Menu mode="inline" selectedKeys={[getSelectedKey()]}>
          <Menu.Item key="home" onClick={() => navigateAndClose("/")}>Home</Menu.Item>

          {isAdmin ? (
            <>
              <Menu.Item key="customers" onClick={() => navigateAndClose("/customers")}>Customers</Menu.Item>
              <Menu.Item key="invoices" onClick={() => navigateAndClose("/invoices")}>Invoices</Menu.Item>
              <Menu.Item key="appointments" onClick={() => navigateAndClose("/appointments")}>Appointments</Menu.Item>
              <Menu.Item key="messages" onClick={() => navigateAndClose("/messages")}>Messages</Menu.Item>
            </>
          ) : (
            <>
              <Menu.Item key="schedule" onClick={() => navigateAndClose("/schedule")}>Schedule</Menu.Item>
              <Menu.Item key="about" onClick={() => navigateAndClose("/about")}>About</Menu.Item>
              <Menu.Item key="contact" onClick={() => navigateAndClose("/contact")}>Contact</Menu.Item>
            </>
          )}
        </Menu>
      </Drawer>
    </>
  );
};

export default TopNavBar;
