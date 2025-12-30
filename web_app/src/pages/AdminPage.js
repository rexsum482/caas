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

  if (loading) return <Spin size="large" style={{ marginTop: 30 }} />;

  const monthlyRevenueConfig = {
    data: data.revenue.revenue_last_12_months,
    xField: "month",
    yField: "total",
    smooth: true,
    label: false,
    tooltip: { formatter: (d) => ({ name: "Revenue", value: currency(d.total) }) }
  };

  const invoiceChartConfig = {
    data: data.revenue.formatted_monthly_chart,
    xField: "date",
    yField: "total",
    columnWidthRatio: 0.6,
    tooltip: { formatter: (d) => ({ name: "Revenue", value: currency(d.total) }) }
  };

  const appointmentChartConfig = {
    data: data.charts.upcoming_appointments,
    xField: "date",
    yField: "count",
    point: { size: 4 },
    smooth: true,
    tooltip: { formatter: (d) => ({ name: "Appointments", value: d.count }) }
  };

  return (
    <div style={{ padding: 25 }}>
      <Title level={2}>📊 Dashboard Overview</Title>

      {/* Top Stats */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={6}><Card><Text>Total Revenue</Text><Title level={3}>{currency(data.revenue.total_revenue)}</Title></Card></Col>
        <Col span={6}><Card><Text>Revenue This Month</Text><Title level={3}>{currency(data.revenue.revenue_this_month)}</Title></Card></Col>
        <Col span={6}><Card><Text>Invoices This Week</Text><Title level={3}>{data.counts.weekly_invoices}</Title></Card></Col>
        <Col span={6}><Card><Text>Appointments This Week</Text><Title level={3}>{data.counts.weekly_appointments}</Title></Card></Col>
      </Row>

      {/* Revenue Trend 12 Months */}
      <Card title="📈 Revenue Over Last 12 Months" style={{ marginBottom: 20 }}>
        <Line {...monthlyRevenueConfig} height={260} />
      </Card>

      {/* Monthly Invoice Revenue */}
      <Card title="💰 Invoice Revenue This Month" style={{ marginBottom: 20 }}>
        <Column {...invoiceChartConfig} height={260} />
      </Card>

      {/* Appointments Trend */}
      <Card title="📅 Upcoming Appointments (Next 30 Days)">
        <Area {...appointmentChartConfig} height={260} />
      </Card>
    </div>
  );
}
