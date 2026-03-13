import React, { useEffect, useState } from "react";
import { Card, Typography, Button, message } from "antd";
import { WEBPAGE } from "../data/constants";
import { useSearchParams } from "react-router-dom";

const { Title, Paragraph, Text } = Typography;
const COOLDOWN_SECONDS = 30;

export default function VerifyEmail() {
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [searchParams] = useSearchParams();
  const username = searchParams.get("username");
  // Countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;

    const interval = setInterval(() => {
      setCooldown((c) => c - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldown]);

  const resendVerification = async () => {
    if (!username) {
      message.error("Missing username. Please sign in again.");
      return;
    }

    if (cooldown > 0) return;

    try {
      setLoading(true);

      const res = await fetch(
        `${WEBPAGE}/api/users/resend-verification/?username=${encodeURIComponent(
          username
        )}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Unable to resend verification email");
      }

      message.success("Verification email sent!");
      setCooldown(COOLDOWN_SECONDS);
    } catch (err) {
      message.error(err.message || "Failed to resend email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      style={{
        maxWidth: 480,
        margin: "80px auto",
        textAlign: "center",
      }}
    >
      <Title level={3}>Verify Your Email</Title>

      <Paragraph>
        We've sent a verification link to your email address.
        Please check your inbox and click the link to activate your account.
      </Paragraph>

      {username && (
        <Paragraph>
          <Text type="secondary">
            Account: <strong>{username}</strong>
          </Text>
        </Paragraph>
      )}

      <Button type="primary" href="/login" block>
        Go to Login
      </Button>

      <Paragraph style={{ marginTop: 24 }}>
        <Text type="secondary">Didn’t receive the email?</Text>
      </Paragraph>

      <Button
        type="link"
        onClick={resendVerification}
        disabled={cooldown > 0 || loading}
        loading={loading}
      >
        {cooldown > 0
          ? `Resend available in ${cooldown}s`
          : "Resend verification email"}
      </Button>
    </Card>
  );
}
