import React, { useState } from "react";
import { Layout, Menu, Button, Drawer } from "antd";
import {
  LogoutOutlined,
  MenuOutlined,
  LoginOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import NotificationBell from "./Notification";
const { Header } = Layout;
const config = window.DJANGO_CONTEXT;

const TopNavBar = ({ isAuthenticated, isAdmin }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const companyName = config.companyName;
  const accentColor = config.accentColor;

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    navigate("/login");
    window.location.reload();
  };
const navigateAndClose = (path) => {
  navigate(path);

  // allow navigation to start before drawer closes
  setTimeout(() => {
    setMobileOpen(false);
  }, 150);
};
const getSelectedKey = () => {
  const path = location.pathname;
  
  const routeMap = [
    { key: "home", match: /^\/(home)?$/ },
    { key: "customers", match: /^\/customers/ },
    { key: "invoices", match: /^\/invoices/ },
    { key: "appointments", match: /^\/appointments/ },
    { key: "contact", match: /^\/contact/ },
    { key: "schedule", match: /^\/schedule/ },
    { key: "login", match: /^\/login/ },
    { key: "signup", match: /^\/signup/ },
    { key: "about", match: /^\/about/ },
  ];

  const match = routeMap.find(r => r.match.test(path));
  return match ? match.key : "";
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
            padding: "0 20px",
            position: "sticky",
            top: 0,
            zIndex: 1000,
          }}
        >
          {/* Logo */}
          <div
            style={{
              color: "white",
              fontSize: 20,
              fontWeight: "bold",
            }}
          >
            {companyName}
          </div>

          {/* Desktop Menu */}
          <div className="desktop-menu" style={{ flex: 1, display: "none" }}>
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
                  <Menu.Item key="customers">
                    <a href="/customers">Customers</a>
                  </Menu.Item>
                  <Menu.Item key="invoices">
                    <a href="/invoices">Invoices</a>
                  </Menu.Item>
                  <Menu.Item key="appointments">
                    <a href="/appointments">Appointments</a>
                  </Menu.Item>
                </>
              ) : (
                <>
                  <Menu.Item key="contact">
                    <a href="/contact">Contact</a>
                  </Menu.Item>
                  <Menu.Item key="schedule">
                    <a href="/schedule">Schedule</a>
                  </Menu.Item>
                  <Menu.Item key="about">
                    <a href="/about">About</a>
                  </Menu.Item>
                </>
              )}
            </Menu>
          </div>

          {/* Right-side buttons */}
          <div style={{ display: "flex", gap: 10 }}>
            {isAuthenticated && <NotificationBell isAuthenticated={isAuthenticated} />}
            {!isAuthenticated ? (
              <>
                <Button
                  type="default"
                  icon={<LoginOutlined />}
                  onClick={() => navigate("/login")}
                  className="desktop-menu"
                >
                  Login
                </Button>
                <Button
                  type="primary"
                  icon={<UserAddOutlined />}
                  onClick={() => navigate("/signup")}
                  className="desktop-menu"
                >
                  Sign Up
                </Button>
              </>
            ) : (
              <Button
                type="primary"
                icon={<LogoutOutlined />}
                onClick={handleLogout}
                className="desktop-menu"
              >
                Logout
              </Button>
            )}

            {/* Mobile menu button */}
            <Button
              type="text"
              icon={<MenuOutlined style={{ fontSize: 22, color: "white" }} />}
              className="mobile-menu-button"
              onClick={() => setMobileOpen(true)}
            />
          </div>
        </Header>
      </Layout>

<Drawer
  title={companyName}
  placement="right"
  onClose={() => setMobileOpen(false)}
  open={mobileOpen}
>
  <Menu
    mode="inline"
    selectedKeys={[getSelectedKey()]}
    onClick={() => setMobileOpen(false)}
  >
    <Menu.Item key="home" onClick={() => navigate("/")}>
      Home
    </Menu.Item>

    {isAdmin ? (
      <>
        <Menu.Item
          key="customers"
          onClick={() => navigateAndClose("/customers")}
        >
          Customers
        </Menu.Item>

        <Menu.Item
          key="invoices"
          onClick={() => navigateAndClose("/invoices")}
        >
          Invoices
        </Menu.Item>

        <Menu.Item
          key="appointments"
          onClick={() => navigateAndClose("/appointments")}
        >
          Appointments
        </Menu.Item>
      </>
    ) : (
      <>
        <Menu.Item
          key="contact"
          onClick={() => navigateAndClose("/contact")}
        >
          Contact
        </Menu.Item>

        <Menu.Item
          key="schedule"
          onClick={() => navigateAndClose("/schedule")}
        >
          Schedule
        </Menu.Item>

        <Menu.Item
          key="about"
          onClick={() => navigateAndClose("/about")}
        >
          About
        </Menu.Item>
      </>
    )}

    {!isAuthenticated ? (
      <>
        <Menu.Item
          key="login"
          icon={<LoginOutlined />}
          onClick={() => navigateAndClose("/login")}
        >
          Login
        </Menu.Item>

        <Menu.Item
          key="signup"
          icon={<UserAddOutlined />}
          onClick={() => navigateAndClose("/signup")}
        >
          Sign Up
        </Menu.Item>
      </>
    ) : (
      <Menu.Item
        key="logout"
        icon={<LogoutOutlined />}
        onClick={handleLogout}
      >
        Logout
      </Menu.Item>
    )}
  </Menu>
</Drawer>

      {/* Responsive rules */}
      <style>{`
        @media (min-width: 768px) {
          .desktop-menu {
            display: block !important;
          }
          .mobile-menu-button {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
};

export default TopNavBar;
