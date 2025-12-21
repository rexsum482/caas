import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import { Layout, Spin } from "antd";

import WEBPAGE from "./data/constants";
import TopNavBar from "./components/Menu";
import AdminPage from "./pages/AdminPage";
import ContactUs from "./pages/Contact";
import { Customers } from "./components/Customers";
import { Customer } from "./pages/Customer";
import { AddCustomer } from "./pages/AddCustomer";
import Invoice from "./pages/Invoice";
import Invoices from "./components/Invoices";

const { Content } = Layout;

function App() {
  return (
    <Router>
      <AppContentRouter />
    </Router>
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
  const location = useLocation();

  let active = "";
  if (location.pathname === "/" || location.pathname === "/home") {
    active = "home";
  } else if (location.pathname.startsWith("/contact")) {
    active = "contact";
  } else if (location.pathname.startsWith("/customers")) {
    active = "customers";
  } else if (location.pathname.startsWith("/login")) {
    active = "login";
  } else if (location.pathname.startsWith("/signup")) {
    active = "signup";
  } else if (location.pathname.startsWith("/invoices")) {
    active = "invoices";
  }

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

            {/* 404 */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Content>
      </Layout>
    </>
  );
}

export default App;
