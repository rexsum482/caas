import React, { useState } from "react";
import { Layout, Menu, Button, Drawer } from "antd";
import { LogoutOutlined, MenuOutlined } from "@ant-design/icons";
import { useLocation } from "react-router-dom";

const { Header } = Layout;
const config = window.DJANGO_CONTEXT;

const TopNavBar = ({ isAuthenticated, isAdmin }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const companyName = config.companyName
  const primaryColor = config.primaryColor
  const accentColor = config.accentColor

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const getSelectedKey = () => {
  let active = "";
  if (location.pathname === "/" || location.pathname === "/home") {
    return "home";
  } else if (location.pathname.startsWith("/contact")) {
    return "contact";
  } else if (location.pathname.startsWith("/customers")) {
    return "customers";
  } else if (location.pathname.startsWith("/login")) {
    return "login";
  } else if (location.pathname.startsWith("/signup")) {
    return "signup";
  } else if (location.pathname.startsWith("/invoices")) {
    return "invoices";
  }
}

  return (
    <>
      <Layout>
        <Header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: `${accentColor}`,
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
              fontSize: "20px",
              fontWeight: "bold",
              letterSpacing: "1px",
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
              style={{
                flex: 1,
                justifyContent: "center",
                background: "transparent",
              }}
            >
              <Menu.Item key="home">
                <a href="/">Home</a>
              </Menu.Item>
                { isAdmin ? 
                <>
                <Menu.Item key="customers">
                    <a href="/customers">Customers</a>
                </Menu.Item>
                <Menu.Item key="invoices">
                    <a href="/invoices">Invoices</a>
                </Menu.Item>
                </>
                :
                <Menu.Item key="contact">
                    <a href="/contact">Contact</a>
                </Menu.Item>
                }
              <Menu.Item key="about">
                <a href="/about">About</a>
              </Menu.Item>
            </Menu>
          </div>

          {/* Right Side */}
          <div style={{ display: "flex", gap: 10 }}>
            {isAuthenticated && (
              <Button
                type="primary"
                icon={<LogoutOutlined />}
                onClick={handleLogout}
                className="desktop-menu"
              >
                Logout
              </Button>
            )}

            {/* Mobile Hamburger Button */}
            <Button
              type="text"
              icon={<MenuOutlined style={{ fontSize: 22, color: "white" }} />}
              className="mobile-menu-button"
              onClick={() => setMobileOpen(true)}
            />
          </div>
        </Header>
      </Layout>

      {/* Mobile Drawer Menu */}
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
          <Menu.Item key="home">
            <a href="/">Home</a>
          </Menu.Item>
          { isAdmin ?
          <Menu.Item key="customers">
            <a href="/customers">Customers</a>
          </Menu.Item>
          :
          <Menu.Item key="contact">
            <a href="/contact">Contact</a>
          </Menu.Item>
          }
          <Menu.Item key="about">
            <a href="/about">About</a>
          </Menu.Item>

          {isAuthenticated && (
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

      {/* Responsive styling */}
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
