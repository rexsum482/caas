import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import { Layout, Spin } from "antd";

import { WEBPAGE } from "./data/constants";
import TopNavBar from "./components/Menu";
import AdminPage from "./pages/AdminPage";
import ContactUs from "./pages/Contact";
import { Customers } from "./components/Customers";
import { Customer } from "./pages/Customer";
import { AddCustomer } from "./pages/AddCustomer";
import Invoice from "./pages/Invoice";
import Invoices from "./components/Invoices";
import PublicAppointmentScheduler from "./pages/Appoinment";
import PublicRescheduleAppointment from "./pages/Reschedule";
import Appointments from "./pages/Appointments";
import { ConfigProvider } from "antd";

const { Content } = Layout;
const config = window.DJANGO_CONTEXT;

  const companyName = config.companyName
  const primaryColor = config.primaryColor
  const accentColor = config.accentColor
function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: primaryColor,
        },
      }}
    >
    <Router>
      <AppContentRouter />
    </Router>
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
        // 1️⃣ VERIFY token (POST /verify/)
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

        // 2️⃣ GET user info (/me/)
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
        if (userData.is_superuser) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
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

  return (
    <>
      <TopNavBar
        isAuthenticated={isAuthenticated}
        isAdmin={isAdmin}
      />

      <Layout style={{ minHeight: "100vh" }}>
        <Content style={{ padding: "20px" }}>
          <Routes>
            {/* HOME */}
            <Route
              path="/"
              element={isAdmin ? <AdminPage /> : <Home />}
            />

            {/* AUTH */}
            <Route
              path="/login"
              element={<Login setIsAuthenticated={setIsAuthenticated} />}
            />
            <Route path="/signup" element={<Signup />} />
            <Route path="/contact" element={<ContactUs />} />
            {/* CUSTOMERS */}
            <Route path="/customers/add" element={<AddCustomer />} />
            <Route path="/customers/:id" element={<Customer />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/invoices/:id" element={<Invoice />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/schedule" element={<PublicAppointmentScheduler />} />
            <Route path="/reschedule/:token" element={<PublicRescheduleAppointment />} />
            <Route path="/appointments" element={<Appointments />} />
            {/* 404 */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Content>
      </Layout>
    </>
  );
}

export default App;