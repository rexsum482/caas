import React, { useState, useEffect } from "react";
import { Layout, Menu, Button, Drawer, Badge, List, Modal } from "antd";
import {
  LogoutOutlined,
  MenuOutlined,
  LoginOutlined,
  UserAddOutlined,
  MailOutlined,
  BellOutlined
} from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import useUnreadMessages from "../hooks/useMessageCount";
import BANNER_LOGO from "../assets/rrr_banner.png";
import { useNotifications } from "../context/NotificationContext";

const { Header } = Layout;
const config = window.DJANGO_CONTEXT;

const TopNavBar = ({ isAuthenticated, isAdmin }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const unreadMessages = useUnreadMessages();
  const companyName = config.companyName;
  const accentColor = config.accentColor;
  const [open, setOpen] = useState(false);
  const {
    notifications,
    unread,
    markRead,
    markAllRead,
    fetchNotifications
  } = useNotifications();

  useEffect(() => {
    fetchNotifications();
  }, [location.pathname]);

  const extractId = (key, content) => {
    const match = content?.match(new RegExp(`${key}:(\\d+)`));
    return match ? match[1] : null;
  };

  const handleNotificationClick = async (n) => {
    if (!n.is_read) await markRead(n.id);

    const invoiceId = extractId("invoice", n.content);
    const appointmentId = extractId("appointment", n.content);

    if (isAdmin) {
      switch (n.type) {
        case "A":
        case "R": navigate("/appointments"); return;
        case "P":
        case "U": if (invoiceId) navigate(`/invoices/${invoiceId}`); return;
        case "M": Modal.info({ title: n.title, content: n.content }); return;
        default: return;
      }
    }

    switch (n.type) {
      case "I":
      case "P":
      case "U": if (invoiceId) navigate(`/invoices/${invoiceId}`); return;
      default: Modal.info({ title: n.title, content: n.content }); return;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
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
      { key: "home", match: /^\/(home)?$/ },
      { key: "customers", match: /^\/customers/ },
      { key: "invoices", match: /^\/invoices/ },
      { key: "appointments", match: /^\/appointments/ },
      { key: "messages", match: /^\/messages/ },   // ADDED
      { key: "contact", match: /^\/contact/ },
      { key: "schedule", match: /^\/schedule/ },
      { key: "about", match: /^\/about/ },
      { key: "login", match: /^\/login/ },
      { key: "signup", match: /^\/signup/ },
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
            position: "sticky",
            top: 0,
            zIndex: 1000,
          }}
        >
          <a href="/">
            <img src={BANNER_LOGO} alt="Reliable Roofing & Restoration" style={{ height: 40, marginTop: "20px" }} />
          </a>
          {/* Desktop Menu */}
          <div className="desktop-menu" style={{ flex: 1, display: "none" }}>
            <Menu
              theme="dark"
              mode="horizontal"
              selectedKeys={[getSelectedKey()]}
              style={{ background: "transparent", justifyContent: "center" }}
            >
              <Menu.Item key="home"><a href="/">Home</a></Menu.Item>

              {isAdmin ? (
                <>
                  <Menu.Item key="customers"><a href="/customers">Customers</a></Menu.Item>
                  <Menu.Item key="invoices"><a href="/invoices">Invoices</a></Menu.Item>
                  <Menu.Item key="appointments"><a href="/appointments">Appointments</a></Menu.Item>

                  {/* 🔥 Messages tab for ADMIN */}
                  <Menu.Item key="messages">
                    <a href="/messages" style={{ color: "white" }}>
                      <span style={{ color: "white" }}>
                        <Badge count={unreadMessages} offset={[10,-2]}>
                          <MailOutlined style={{ color: "white" }}/> <span style={{ color: "white"}}>Messages</span>
                        </Badge>
                      </span>
                    </a>
                  </Menu.Item>
                </>
              ) : (
                <>
                  <Menu.Item key="contact"><a href="/contact">Contact</a></Menu.Item>
                  <Menu.Item key="schedule"><a href="/schedule">Schedule</a></Menu.Item>
                  <Menu.Item key="about"><a href="/about">About</a></Menu.Item>
                </>
              )}
            </Menu>
          </div>

          {/* Right Side */}
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>

            {/* Notification Bell */}
            {isAuthenticated && <>
      <Badge count={unread} size="small" offset={[-2, 4]}>
        <BellOutlined
          style={{ fontSize: 22, cursor: "pointer", color: "white" }}
          onClick={() => {
            setOpen(true);
            fetchNotifications();
          }}
        />
      </Badge>

      <Drawer
        title="Notifications"
        placement="right"
        open={open}
        onClose={() => setOpen(false)}
        extra={<Button size="small" onClick={markAllRead}>Mark all read</Button>}
      >
        <List
          locale={{ emptyText: "No notifications" }}
          dataSource={notifications}
          renderItem={(item) => (
            <List.Item
              onClick={() => handleNotificationClick(item)}
              style={{ cursor: "pointer", opacity: item.is_read ? 0.6 : 1 }}
            >
              <List.Item.Meta
                title={item.title}
                description={
                  <>
                    <div>{item.content}</div>
                    <small style={{ color: "#888" }}>{item.time_since}</small>
                  </>
                }
              />
            </List.Item>
          )}
        />
      </Drawer>
      </>
            }

            {/* 🔥 Mail icon right side */}
            {isAdmin && (
              <Badge count={unreadMessages} size="small">
                <MailOutlined
                  style={{ fontSize: 22, color: "white", cursor: "pointer" }}
                  onClick={() => navigate("/messages")}
                />
              </Badge>
            )}

            {!isAuthenticated ? (
              <>
                <Button icon={<LoginOutlined />} onClick={() => navigate("/login")} className="desktop-menu">Login</Button>
                <Button type="primary" icon={<UserAddOutlined />} onClick={() => navigate("/signup")} className="desktop-menu">Sign Up</Button>
              </>
            ) : (
              <Button type="primary" icon={<LogoutOutlined />} onClick={handleLogout} className="desktop-menu">Logout</Button>
            )}

            <Button
              type="text"
              icon={<MenuOutlined style={{ fontSize: 22, color: "white" }} />}
              className="mobile-menu-button"
              onClick={() => setMobileOpen(true)}
            />
          </div>
        </Header>
      </Layout>

      {/* Mobile Drawer */}
      <Drawer title={companyName} placement="right" onClose={() => setMobileOpen(false)} open={mobileOpen}>
        <Menu mode="inline" selectedKeys={[getSelectedKey()]}>

          <Menu.Item key="home" onClick={() => navigateAndClose("/")}>Home</Menu.Item>

          {isAdmin ? (
            <>
              <Menu.Item key="customers" onClick={() => navigateAndClose("/customers")}>Customers</Menu.Item>
              <Menu.Item key="invoices" onClick={() => navigateAndClose("/invoices")}>Invoices</Menu.Item>
              <Menu.Item key="appointments" onClick={() => navigateAndClose("/appointments")}>Appointments</Menu.Item>

              {/* 🔥 Mobile menu inbox */}
              <Menu.Item key="messages" onClick={() => navigateAndClose("/messages")}>
                <Badge count={unreadMessages}><MailOutlined /> Messages</Badge>
              </Menu.Item>
            </>
          ) : (
            <>
              <Menu.Item key="contact" onClick={() => navigateAndClose("/contact")}>Contact</Menu.Item>
              <Menu.Item key="schedule" onClick={() => navigateAndClose("/schedule")}>Schedule</Menu.Item>
              <Menu.Item key="about" onClick={() => navigateAndClose("/about")}>About</Menu.Item>
            </>
          )}

          {!isAuthenticated ? (
            <>
              <Menu.Item key="login" icon={<LoginOutlined />} onClick={() => navigateAndClose("/login")}>Login</Menu.Item>
              <Menu.Item key="signup" icon={<UserAddOutlined />} onClick={() => navigateAndClose("/signup")}>Sign Up</Menu.Item>
            </>
          ) : (
            <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>Logout</Menu.Item>
          )}
        </Menu>
      </Drawer>

      {/* Responsive Rules */}
      <style>{`
        @media (min-width: 768px) {
          .desktop-menu { display: block !important; }
          .mobile-menu-button { display: none !important; }
        }
      `}</style>
    </>
  );
};

export default TopNavBar;
