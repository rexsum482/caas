import React, { useEffect, useState } from "react";
import { Card, Row, Col, Typography, Spin, Alert } from "antd";
import { Column } from "@ant-design/plots";

const { Title, Text } = Typography;

export default function AdminPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [animatedTotals, setAnimatedTotals] = useState({
    total: 0,
    month: 0,
  });

  const formatCurrency = (value = 0) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value));

  const formatCurrencyCompact = (value = 0) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(Number(value));

  const animateValue = (start, end, duration, setter, key) => {
    let startTimestamp = null;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;

      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const value = progress * (end - start) + start;

      setter((prev) => ({ ...prev, [key]: value }));

      if (progress < 1) window.requestAnimationFrame(step);
    };

    window.requestAnimationFrame(step);
  };

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      try {
        const res = await fetch("/api/dashboard/", {
          headers: {
            Authorization: `Token ${localStorage.getItem("authToken")}`,
          },
        });

        if (!res.ok) throw new Error("Failed to load dashboard");

        const json = await res.json();

        json.revenue.revenue_last_12_months =
          json.revenue.revenue_last_12_months.map((i) => ({
            month: i.month,
            total: Number(i.total) || 0,
          }));

        json.revenue.total_revenue = Number(json.revenue.total_revenue) || 0;
        json.revenue.revenue_this_month =
          Number(json.revenue.revenue_this_month) || 0;

        json.charts.upcoming_appointments =
          json.charts.upcoming_appointments.map((i) => ({
            date: i.requested_date,
            count: Number(i.count) || 0,
          }));

        if (!mounted) return;

        setData(json);

        animateValue(
          0,
          json.revenue.total_revenue,
          1200,
          setAnimatedTotals,
          "total"
        );

        animateValue(
          0,
          json.revenue.revenue_this_month,
          1200,
          setAnimatedTotals,
          "month"
        );

        setLoading(false);
      } catch (err) {
        console.error(err);
        if (mounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading)
    return (
      <div style={{ textAlign: "center", paddingTop: 50 }}>
        <Spin size="large" />
      </div>
    );

  if (error)
    return (
      <Alert
        type="error"
        message="Dashboard Error"
        description={error}
        style={{ margin: 40 }}
      />
    );

  const monthlyRevenueConfig = {
    data: data.revenue.revenue_last_12_months,
    xField: "month",
    yField: "total",
    color: ({ total }) => (total > 50000 ? "#52c41a" : "#1677ff"),
    columnWidthRatio: 0.6,
    autoFit: true,
    height: 320,
    yAxis: {
      label: { formatter: (v) => formatCurrencyCompact(v) },
    },
    tooltip: {
      formatter: (d) => ({
        name: "Revenue",
        value: formatCurrency(d.total),
      }),
    },
    animation: {
      appear: { animation: "scale-in-y", duration: 800 },
    },
  };

  const upcomingAppointmentsConfig = {
    data: data.charts.upcoming_appointments,
    xField: "date",
    yField: "count",
    columnWidthRatio: 0.6,
    autoFit: true,
    height: 320,
    color: "#722ed1",
    tooltip: {
      formatter: (d) => ({
        name: "Appointments",
        value: d.count,
      }),
    },
    animation: {
      appear: { animation: "scale-in-y", duration: 800 },
    },
  };

  return (
    <div style={{ padding: "20px", maxWidth: 1400, margin: "0 auto" }}>
      <Title level={2} style={{ marginBottom: 25, fontWeight: 600 }}>
        📊 Dashboard Overview
      </Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} md={12} lg={6}>
          <Card>
            <Text type="secondary">Total Revenue</Text>
            <Title level={3}>{formatCurrency(animatedTotals.total)}</Title>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={12} lg={6}>
          <Card>
            <Text type="secondary">Revenue This Month</Text>
            <Title level={3}>{formatCurrency(animatedTotals.month)}</Title>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={12} lg={6}>
          <Card>
            <Text type="secondary">Invoices This Week</Text>
            <Title level={3}>{data.counts.weekly_invoices}</Title>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={12} lg={6}>
          <Card>
            <Text type="secondary">Appointments This Week</Text>
            <Title level={3}>{data.counts.weekly_appointments}</Title>
          </Card>
        </Col>
      </Row>

      <Card title="📊 Revenue Over Last 12 Months" style={{ marginBottom: 20 }}>
        <Column {...monthlyRevenueConfig} />
      </Card>

      <Card title="📅 Upcoming Appointments">
        <Column {...upcomingAppointmentsConfig} />
      </Card>
    </div>
  );
}
