import React, { useState } from "react";
import { Form, Input, Button, Card, message } from "antd";
import { useNavigate } from "react-router-dom";
import { WEBPAGE } from "../data/constants";

const Login = ({ setIsAuthenticated }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!username || !password) {
      message.error("Please enter both username and password.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(WEBPAGE + "/auth/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Login failed.");
      }

      const token = data.token;
      if (!token) throw new Error("No token received.");

      localStorage.setItem("authToken", token);
      setIsAuthenticated?.(true);

      message.success("Login successful!");
      navigate("/");
    } catch (err) {
      message.error(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      onFinish={handleSubmit} // triggers on Enter key automatically
      style={{ width: 350, margin: "auto", marginTop: 50 }}
    >
      <Card title="Login">
        <Form.Item label="Username" name="username" rules={[{ required: true }]}>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            autoComplete="username"
          />
        </Form.Item>

        <Form.Item label="Password" name="password" rules={[{ required: true }]}>
          <Input.Password
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            autoComplete="current-password"
          />
        </Form.Item>

        <Button
          type="primary"
          htmlType="submit" // important: triggers Form onFinish on Enter
          loading={loading}
          block
        >
          Login
        </Button>

        <p style={{ marginTop: 12 }}>
          Don’t have an account? <a href="/signup">Sign Up</a>
        </p>
      </Card>
    </Form>
  );
};

export default Login;
