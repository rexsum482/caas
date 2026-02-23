import React, { useEffect, useState } from "react";
import { Card, Row, Col, Typography, Spin } from "antd";
import { Column, Line } from "@ant-design/plots";

const { Title, Text } = Typography;

export default function AdminPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
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

  // ✅ Abbreviated currency formatter (K / M / B)
  const formatCurrencyCompact = (value = 0) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(Number(value));

  // ✅ Count-up animation
  const animateValue = (start, end, duration, setter, key) => {
    let startTimestamp = null;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const value = progress * (end - start) + start;

      setter((prev) => ({
        ...prev,
        [key]: value,
      }));

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  };

  useEffect(() => {
    fetch("/api/dashboard/", {
      headers: {
        Authorization: `Token ${localStorage.getItem("authToken")}`,
      },
    })
      .then((res) => res.json())
      .then((res) => {
        res.revenue.revenue_last_12_months =
          res.revenue.revenue_last_12_months.map((i) => ({
            month: i.month,
            total: Number(i.total) || 0,
          }));

        res.revenue.formatted_monthly_chart =
          res.revenue.formatted_monthly_chart.map((i) => ({
            date: i.issue_date,
            total: Number(i.total) || 0,
            count: i.count,
          }));

        res.revenue.total_revenue = Number(res.revenue.total_revenue) || 0;
        res.revenue.revenue_this_month =
          Number(res.revenue.revenue_this_month) || 0;

        setData(res);

        // 🎯 Trigger animations
        animateValue(0, res.revenue.total_revenue, 1200, setAnimatedTotals, "total");
        animateValue(0, res.revenue.revenue_this_month, 1200, setAnimatedTotals, "month");

        setLoading(false);
      });
  }, []);

  if (loading)
    return (
      <div style={{ textAlign: "center", paddingTop: 50 }}>
        <Spin size="large" />
      </div>
    );

  // ✅ Line chart with gradient + compact axis
  const monthlyRevenueConfig = {
    data: data.revenue.revenue_last_12_months,
    xField: "month",
    yField: "total",
    smooth: true,
    autoFit: true,
    height: 320,

    // Gradient fill under line
    area: {
      style: {
        fill: "l(270) 0:#1677ff 1:rgba(22,119,255,0.05)",
      },
    },

    yAxis: {
      label: {
        formatter: (v) => formatCurrencyCompact(v),
      },
    },

    tooltip: {
      formatter: (d) => ({
        name: "Revenue",
        value: formatCurrency(d.total),
      }),
    },
  };

  // ✅ Column chart with compact axis
  const invoiceChartConfig = {
    data: data.revenue.formatted_monthly_chart,
    xField: "date",
    yField: "total",
    columnWidthRatio: 0.6,
    autoFit: true,
    height: 320,

    yAxis: {
      label: {
        formatter: (v) => formatCurrencyCompact(v),
      },
    },

    tooltip: {
      formatter: (d) => ({
        name: "Revenue",
        value: formatCurrency(d.total),
      }),
    },
  };

  return (
    <div style={{ padding: "20px", maxWidth: 1400, margin: "0 auto" }}>
      <Title level={2} style={{ marginBottom: 25, fontWeight: 600 }}>
        📊 Dashboard Overview
      </Title>

      {/* Animated Stat Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} md={12} lg={6}>
          <Card>
            <Text type="secondary">Total Revenue</Text>
            <Title level={3}>
              {formatCurrency(animatedTotals.total)}
            </Title>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={12} lg={6}>
          <Card>
            <Text type="secondary">Revenue This Month</Text>
            <Title level={3}>
              {formatCurrency(animatedTotals.month)}
            </Title>
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

      <Card title="📈 Revenue Over Last 12 Months" style={{ marginBottom: 20 }}>
        <Line {...monthlyRevenueConfig} />
      </Card>

      <Card title="💰 Invoice Revenue This Month">
        <Column {...invoiceChartConfig} />
      </Card>
    </div>
  );
}