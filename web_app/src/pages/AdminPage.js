import React, { useEffect, useState } from "react";
import { Card, Row, Col, Typography, Spin } from "antd";
import { Column, Line, Area } from "@ant-design/plots";
import { currency } from "../utils/format";

const { Title, Text } = Typography;

export default function AdminPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/", {
      headers: { Authorization: `Token ${localStorage.getItem("authToken")}` }
    })
      .then(res => res.json())
      .then(res => {
        res.revenue.revenue_last_12_months = res.revenue.revenue_last_12_months.map(i => ({
          month: i.month,
          total: Number(i.total),
        }));

        res.revenue.formatted_monthly_chart = res.revenue.formatted_monthly_chart.map(i => ({
          date: i.issue_date,
          total: Number(i.total),
          count: i.count,
        }));

        setData(res);
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{ textAlign: "center", paddingTop: 50 }}><Spin size="large" /></div>;

  const monthlyRevenueConfig = {
    data: data.revenue.revenue_last_12_months,
    xField: "month",
    yField: "total",
    smooth: true,
    autoFit: true,
    tooltip: { formatter: (d) => ({ name: "Revenue", value: currency(d.total) }) }
  };

  const invoiceChartConfig = {
    data: data.revenue.formatted_monthly_chart,
    xField: "date",
    yField: "total",
    columnWidthRatio: 0.6,
    autoFit: true,
    tooltip: { formatter: (d) => ({ name: "Revenue", value: currency(d.total) }) }
  };

  return (
    <div style={{ padding: "20px", maxWidth: 1400, margin: "0 auto" }}>
      <Title level={2} style={{ marginBottom: 25, fontWeight: 600 }}>
        📊 Dashboard Overview
      </Title>

      {/* Top Stat Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} md={12} lg={6}>
          <Card className="stat-card">
            <Text type="secondary">Total Revenue</Text>
            <Title level={3} style={{ margin: "6px 0" }}>{currency(data.revenue.total_revenue)}</Title>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={12} lg={6}>
          <Card className="stat-card">
            <Text type="secondary">Revenue This Month</Text>
            <Title level={3} style={{ margin: "6px 0" }}>{currency(data.revenue.revenue_this_month)}</Title>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={12} lg={6}>
          <Card className="stat-card">
            <Text type="secondary">Invoices This Week</Text>
            <Title level={3} style={{ margin: "6px 0" }}>{data.counts.weekly_invoices}</Title>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={12} lg={6}>
          <Card className="stat-card">
            <Text type="secondary">Appointments This Week</Text>
            <Title level={3} style={{ margin: "6px 0" }}>{data.counts.weekly_appointments}</Title>
          </Card>
        </Col>
      </Row>

      {/* Monthly Revenue Trend */}
      <Card title="📈 Revenue Over Last 12 Months" style={{ marginBottom: 20 }}>
        <Line {...monthlyRevenueConfig} height={270} />
      </Card>

      {/* Invoice Revenue */}
      <Card title="💰 Invoice Revenue This Month" style={{ marginBottom: 20 }}>
        <Column {...invoiceChartConfig} height={270} />
      </Card>
    </div>
  );
}
