import React, { useState, useEffect, useMemo } from "react";
import {
  Layout,
  Menu,
  Button,
  Drawer,
  Badge,
  List,
  Modal,
  Typography,
  Space
} from "antd";

import {
  LogoutOutlined,
  MenuOutlined,
  LoginOutlined,
  UserAddOutlined,
  MailOutlined,
  BellOutlined,
  ShoppingCartOutlined,
  DeleteOutlined,
  PlusOutlined,
  MinusOutlined
} from "@ant-design/icons";

import { useLocation, useNavigate } from "react-router-dom";
import useUnreadMessages from "../hooks/useMessageCount";
import BANNER_LOGO from "../assets/BannerLogoWhite.png";
import { useNotifications } from "../context/NotificationContext";
import { useCart } from "../context/CartConext";

const { Header } = Layout;
const { Text } = Typography;

const config = window.DJANGO_CONTEXT;

const TopNavBar = ({ isAuthenticated, isAdmin }) => {

  const navigate = useNavigate();
  const location = useLocation();

  const unreadMessages = useUnreadMessages();

  const companyName = config.companyName;
  const accentColor = config.accentColor;

  const [mobileOpen, setMobileOpen] = useState(false);

  const [open, setOpen] = useState(false);

  const [cartOpen, setCartOpen] = useState(false);

  const {
    notifications,
    unread,
    markRead,
    markAllRead,
    fetchNotifications
  } = useNotifications();

  const {
    cart,
    removeFromCart,
    addToCart,
    loadCart
  } = useCart();

  useEffect(() => {
    fetchNotifications();
    loadCart();
  }, []);

  const cartCount = useMemo(() => {
    if (!Array.isArray(cart)) return 0;
    return cart.reduce((sum, i) => sum + i.quantity, 0);
  }, [cart]);

  const subtotal = useMemo(() => {
    if (!Array.isArray(cart)) return 0;

    return cart.reduce((sum, i) => {
      return sum + i.quantity * (i.product?.price || 0);
    }, 0);
  }, [cart]);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    navigate("/login");
    window.location.reload();
  };

  const navigateAndClose = (path) => {
    navigate(path);
    setTimeout(() => setMobileOpen(false), 150);
  };

  const extractId = (key, content) => {
    const match = content?.match(new RegExp(`${key}:(\\d+)`));
    return match ? match[1] : null;
  };

  const handleNotificationClick = async (n) => {

    if (!n.is_read) await markRead(n.id);

    const invoiceId = extractId("invoice", n.content);

    if (isAdmin) {
      if (invoiceId) navigate(`/invoices/${invoiceId}`);
      return;
    }

    if (invoiceId) navigate(`/invoices/${invoiceId}`);
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
      { key: "products", match: /^\/products/ },
      { key: "myproducts", match: /^\/myproducts/ },
      { key: "myinvoices", match: /^\/myinvoices/ }
    ];

    return (map.find(r => r.match.test(path)) || {}).key || "";
  };

  const increaseQty = (item) => {
    addToCart(item.product, 1);
  };

  const decreaseQty = (item) => {

    if (item.quantity <= 1) {
      removeFromCart(item.id);
      return;
    }

    addToCart(item.product, -1);
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
            zIndex: 1000
          }}
        >

          <a href="/">
            <img
              src={BANNER_LOGO}
              alt="logo"
              style={{ height: 40 }}
            />
          </a>

          {/* Desktop menu */}

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
                  <Menu.Item key="customers"><a href="/customers">Customers</a></Menu.Item>
                  <Menu.Item key="invoices"><a href="/invoices">Invoices</a></Menu.Item>
                  <Menu.Item key="appointments"><a href="/appointments">Appointments</a></Menu.Item>
                  <Menu.Item key="myproducts"><a href="/myproducts">My Products</a></Menu.Item>

		  <Menu.Item
		    key="messages"
		    icon={
		      <Badge count={unreadMessages} size="small">
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
                    <Menu.Item key="myinvoices">
                      <a href="/myinvoices">My Invoices</a>
                    </Menu.Item>
                  )}

                  <Menu.Item key="contact"><a href="/contact">Contact</a></Menu.Item>
                  <Menu.Item key="schedule"><a href="/schedule">Schedule</a></Menu.Item>
                  <Menu.Item key="products"><a href="/products">Products</a></Menu.Item>
                  <Menu.Item key="about"><a href="/about">About</a></Menu.Item>
                </>
              )}

            </Menu>

          </div>

          {/* Right side */}

          <Space size="large">

            {isAuthenticated && (

              <Badge count={unread}>
                <BellOutlined
                  style={{ fontSize: 22, color: "white", cursor: "pointer" }}
                  onClick={() => {
                    setOpen(true);
                    fetchNotifications();
                  }}
                />
              </Badge>

            )}

            {/* CART */}

            <Badge count={cartCount} size="small">

              <ShoppingCartOutlined
                style={{
                  fontSize: 24,
                  color: "white",
                  cursor: "pointer",
                  transition: "transform .2s"
                }}
                onClick={() => setCartOpen(true)}
              />

            </Badge>

            {isAdmin && (

              <Badge count={unreadMessages}>

                <MailOutlined
                  style={{ fontSize: 22, color: "white", cursor: "pointer" }}
                  onClick={() => navigate("/messages")}
                />

              </Badge>

            )}

            {!isAuthenticated ? (

              <>
                <Button
                  icon={<LoginOutlined />}
                  onClick={() => navigate("/login")}
                >
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
              className="mobile-menu-button"
              onClick={() => setMobileOpen(true)}
            />

          </Space>

        </Header>

      </Layout>

      {/* NOTIFICATIONS */}

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
              style={{ cursor: "pointer" }}
            >
              <List.Item.Meta
                title={item.title}
                description={item.content}
              />
            </List.Item>
          )}
        />

      </Drawer>

      {/* CART DRAWER */}

      <Drawer
        title={`Cart (${cartCount})`}
        placement="right"
        open={cartOpen}
        onClose={() => setCartOpen(false)}
      >

        <List
          locale={{ emptyText: "Your cart is empty" }}
          dataSource={cart}
          renderItem={(item) => (

            <List.Item
              actions={[
                <Button
                  icon={<MinusOutlined />}
                  onClick={() => decreaseQty(item)}
                />,
                <Text>{item.quantity}</Text>,
                <Button
                  icon={<PlusOutlined />}
                  onClick={() => increaseQty(item)}
                />,
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => removeFromCart(item.id)}
                />
              ]}
            >

              <List.Item.Meta
                title={item.product?.name}
                description={`$${item.product?.price}`}
              />

            </List.Item>

          )}
        />

        <div style={{ marginTop: 20 }}>

          <Text strong>Subtotal:</Text>
          <Text style={{ float: "right" }}>
            ${subtotal.toFixed(2)}
          </Text>

        </div>

        <Button
          type="primary"
          block
          style={{ marginTop: 20 }}
          disabled={!cart.length}
          onClick={() => navigate("/checkout")}
        >
          Checkout
        </Button>

      </Drawer>

      {/* Mobile menu */}

<Drawer
  title={companyName}
  placement="right"
  open={mobileOpen}
  onClose={() => setMobileOpen(false)}
>
  {isAdmin ? (
    <Menu mode="inline" selectedKeys={[getSelectedKey()]}>
      <Menu.Item key="home" onClick={() => navigateAndClose("/")}>
        Home
      </Menu.Item>

      <Menu.Item key="customers" onClick={() => navigateAndClose("/customers")}>
        Customers
      </Menu.Item>

      <Menu.Item key="invoices" onClick={() => navigateAndClose("/invoices")}>
        Invoices
      </Menu.Item>

      <Menu.Item key="appointments" onClick={() => navigateAndClose("/appointments")}>
        Appointments
      </Menu.Item>

      <Menu.Item key="myproducts" onClick={() => navigateAndClose("/myproducts")}>
        My Products
      </Menu.Item>

      <Menu.Item key="messages" onClick={() => navigateAndClose("/messages")}>
        Messages
      </Menu.Item>
    </Menu>
  ) : isAuthenticated ? (
    <Menu mode="inline" selectedKeys={[getSelectedKey()]}>
      <Menu.Item key="home" onClick={() => navigateAndClose("/")}>
        Home
      </Menu.Item>

      <Menu.Item key="myinvoices" onClick={() => navigateAndClose("/myinvoices")}>
        My Invoices
      </Menu.Item>

      <Menu.Item key="schedule" onClick={() => navigateAndClose("/schedule")}>
        Schedule
      </Menu.Item>

      <Menu.Item key="products" onClick={() => navigateAndClose("/products")}>
        Products
      </Menu.Item>

      <Menu.Item key="about" onClick={() => navigateAndClose("/about")}>
        About
      </Menu.Item>

      <Menu.Item key="contact" onClick={() => navigateAndClose("/contact")}>
        Contact
      </Menu.Item>
    </Menu>
  ) : (
    <Menu mode="inline" selectedKeys={[getSelectedKey()]}>
      <Menu.Item key="home" onClick={() => navigateAndClose("/")}>
        Home
      </Menu.Item>

      <Menu.Item key="schedule" onClick={() => navigateAndClose("/schedule")}>
        Schedule
      </Menu.Item>

      <Menu.Item key="products" onClick={() => navigateAndClose("/products")}>
        Products
      </Menu.Item>

      <Menu.Item key="about" onClick={() => navigateAndClose("/about")}>
        About
      </Menu.Item>

      <Menu.Item key="contact" onClick={() => navigateAndClose("/contact")}>
        Contact
      </Menu.Item>
    </Menu>
  )}
</Drawer>

      <style>{`
        @media (min-width:768px){
          .desktop-menu{display:block !important;}
          .mobile-menu-button{display:none !important;}
        }
      `}</style>

    </>
  );
};

export default TopNavBar;
