import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ProConfigProvider } from "@ant-design/pro-components";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import { Layout, Spin } from "antd";
import enUS from "antd/locale/en_US";
import { WEBPAGE } from "./data/constants";
import TopNavBar from "./components/Menu";
import AdminPage from "./pages/AdminPage";
import ContactUs from "./pages/Contact";
import { Customers } from "./components/Customers";
import { Customer } from "./pages/Customer";
import { AddCustomer } from "./pages/AddCustomer";
import Invoice from "./pages/Invoice";
import Invoices from "./components/Invoices";
import PublicAppointmentScheduler from "./pages/Appointment";
import PublicRescheduleAppointment from "./pages/Reschedule";
import Appointments from "./pages/Appointments";
import About from "./pages/About";
import { ConfigProvider } from "antd";
import Messages from "./pages/Messages";
import Message from "./pages/Message";
import VerifyEmail from "./pages/VerifyEmail";
import MyInvoices from "./pages/MyInvoices"; 
import { NotificationProvider } from './context/NotificationContext';
import Profile from "./pages/Profile";
import { AppContext } from "./utils/appContext";
import LandingPage from "./pages/LandingPage";

const { Content } = Layout;

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: AppContext.primaryColor,
          colorError: AppContext.alertColor,
          colorWarning: AppContext.warningColor,
          colorSuccess: AppContext.successColor,
          colorHighlight: AppContext.accentColor,
        },
        components: {
          Card: {
            boxShadow: "0 4px 12px rgba(0,0,180,0.3)",
          },
        },
      }}
      locale={enUS}
    >
    <ProConfigProvider
      value={{
        intl: {
          locale: "en-US",
        },
      }}
    >
      <Router>
        <NotificationProvider>
          <AppContentRouter />
        </NotificationProvider>
      </Router>
    </ProConfigProvider>
    </ConfigProvider>
);
}

function AppContentRouter() {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setIsAuthenticated(false);
        return;
      }

      try {
        // 1️ VERIFY token (POST /verify/)
        const verifyResponse = await fetch(`${WEBPAGE}/api/users/verify/`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Token ${token}`,
           },
          body: JSON.stringify({ token }),
        });

        if (verifyResponse.status == 400) {
          localStorage.removeItem("authToken");
          localStorage.removeItem("user");
          setIsAuthenticated(false);
          return;
        }

        // 2️ GET user info (/me/)
        const meResponse = await fetch(`${WEBPAGE}/api/users/me/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
        });

        if (!meResponse.ok) {
          localStorage.removeItem("authToken");
          localStorage.removeItem("user");
          setIsAuthenticated(false);
          return;
        }

        const userData = await meResponse.json();
        localStorage.setItem("user", JSON.stringify(userData));

        setIsAuthenticated(true);

        const isOwner = userData.is_company_owner;
        const isSuper = userData.is_superuser;

        setIsAdmin(isOwner || isSuper);
      } catch (err) {
        console.error("Auth check error", err);
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Spin size="large" tip="Loading authentication..." />
      </div>
    );
  }

  return <AppContent isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated}
    isAdmin={isAdmin}
    setIsAdmin={setIsAdmin}
  />;
}

function AppContent({ isAuthenticated, setIsAuthenticated, isAdmin, setIsAdmin }) {

  const hostname = window.location.hostname;
  const parts = hostname.split(".");
  const subdomain = parts.length > 2 ? parts[0] : null;

  const isLandingPage = !subdomain || subdomain === "www";

  return (
    <>
      {/* ✅ ONLY SHOW NAVBAR INSIDE COMPANY APP */}
      {!isLandingPage && (
        <TopNavBar
          isAuthenticated={isAuthenticated}
          isAdmin={isAdmin}
        />
      )}

      <Layout style={{ minHeight: "100vh" }}>
        <Content style={{ padding: "20px" }}>
          <Routes>

            {/* 🔥 LANDING PAGE */}
            {isLandingPage && (
              <Route path="/" element={<LandingPage />} />
            )}

            {/* HOME */}
            <Route
              path="/"
              element={isAdmin ? <AdminPage /> : <Home />}
            />

            {/* AUTH */}
            <Route
              path="/login"
              element={
                isAuthenticated
                  ? isAdmin
                    ? <AdminPage />
                    : <Home />
                  : <Login setIsAuthenticated={setIsAuthenticated} />
              }
            />

            <Route path="/signup" element={isAuthenticated ? (isAdmin ? <AdminPage /> : <Home />) : <Signup />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/customers/add" element={<AddCustomer />} />
            <Route path="/customers/:id" element={<Customer />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/invoices/:id" element={<Invoice />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/schedule" element={<PublicAppointmentScheduler />} />
            <Route path="/reschedule/:token" element={<PublicRescheduleAppointment />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/about" element={<About />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/message/:id" element={<Message />} />
            <Route path="/verify-email" element={<VerifyEmail />} />

            <Route
              path="/myinvoices"
              element={
                isAuthenticated && !isAdmin
                  ? <MyInvoices />
                  : <Navigate to="/" />
              }
            />

            <Route
              path="/profile"
              element={
                isAuthenticated
                  ? <Profile />
                  : <Navigate to="/" />
              }
            />

          </Routes>
        </Content>
      </Layout>
    </>
  );
}

export default App;
