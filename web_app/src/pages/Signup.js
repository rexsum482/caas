import React, { useState } from "react";
import { Form, Input, Button, Card, message } from "antd";

const Signup = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async () => {
    if (!username || !email || !password) {
      message.error("All fields are required.");
      return;
    }

    setLoading(true);
    try {
      const signupResponse = await fetch("http://127.0.0.1:8000/api/users/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      if (signupResponse.status !== 201) {
        const errorData = signupResponse.json().catch(() => ({}));
        throw new Error(errorData.detail || "User registration failed!");
      }

      message.success("User registered! Logging in...");

      const loginResponse = await fetch("http://127.0.0.1:8000/api/auth/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const loginData = loginResponse.json();

      if (!loginResponse.ok || !loginData.token) {
        throw new Error(loginData.detail || "Login failed after signup!");
      }

      localStorage.setItem("token", loginData.token);
      message.success("Signup successful!");
    } catch (err) {
      message.error(err.message || "An error occurred.");
    } finally {
      setLoading(false);
      document.href = "/";
      document.location.reload();
    }
  };

  return (
    <Form>
    <Card title="Sign Up" style={{ width: 350, margin: "auto", marginTop: 50 }}>

      <div style={{ marginBottom: 16 }}>
        <label>Username</label>
        <Input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Create a username"
        />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label>Email</label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
        />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label>Password</label>
        <Input.Password
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter a password"
        />
      </div>

      <Button type="primary" onClick={handleSubmit} loading={loading} block>
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
