import React, { useState } from "react";
import { Form, Input, Button, Card, message } from "antd";
import { useNavigate } from "react-router-dom";
import { WEBPAGE } from "../data/constants";

const Signup = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!username || !email || !password) {
      message.error("All fields are required.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${WEBPAGE}/api/users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "User registration failed");
      }

      message.success("Signup successful! Please verify your email.");

      // Redirect to verification notice page
      navigate(`/verify-email?username=${encodeURIComponent(username)}`);
    } catch (err) {
      message.error(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form onFinish={handleSubmit}>
      <Card title="Sign Up" style={{ width: 350, margin: "auto", marginTop: 50 }}>
        <Form.Item label="Username" required>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Create a username"
          />
        </Form.Item>

        <Form.Item label="Email" required>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
          />
        </Form.Item>

        <Form.Item label="Password" required>
          <Input.Password
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a password"
          />
        </Form.Item>

        <Button type="primary" htmlType="submit" loading={loading} block>
          Sign Up
        </Button>

        <p style={{ marginTop: 12 }}>
          Already have an account? <a href="/login">Login</a>
        </p>
      </Card>
    </Form>
  );
};

export default Signup;
