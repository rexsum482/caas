import React, { useEffect, useState } from "react";
import {
  Card,
  Table,
  Tag,
  Typography,
  Input,
  Space,
  Button,
  message,
  List,
  Grid,
} from "antd";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const { Title, Text } = Typography;
const { Search } = Input;
const { useBreakpoint } = Grid;

const API = "/api/invoices/";

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const token = localStorage.getItem("authToken");
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API, {
        headers: { Authorization: `Token ${token}` },
      });
      setInvoices(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch (err) {
      console.error(err);
      message.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      String(inv.invoice_number).toLowerCase().includes(term) ||
      (inv.customer_name || "").toLowerCase().includes(term)
    );
  });

  return (
    <Card
      style={{
        maxWidth: 1200,
        margin: "auto",
        padding: isMobile ? 12 : 24,
      }}
    >
      <Space
        style={{ width: "100%", marginBottom: 16 }}
        direction={isMobile ? "vertical" : "horizontal"}
      >
        <Title level={3} style={{ marginBottom: 0 }}>
          Invoices
        </Title>

        <Search
          placeholder="Search invoice # or customer"
          allowClear
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 300 }}
        />
      </Space>

      {/* MOBILE VIEW */}
      {isMobile ? (
        <List
          loading={loading}
          dataSource={filteredInvoices}
          locale={{ emptyText: "No invoices found" }}
          renderItem={(inv) => (
            <Card
              key={inv.id}
              style={{ marginBottom: 12 }}
              hoverable
              onClick={() => navigate(`/invoices/${inv.id}`)}
            >
              <Space
                direction="vertical"
                size={4}
                style={{ width: "100%" }}
              >
                <Text strong>Invoice #{inv.invoice_number}</Text>

                <Text type="secondary">
                  {inv.customer_name || `Customer #${inv.customer}`}
                </Text>

                <Text>
                  {inv.customer_city && inv.customer_state
                    ? `${inv.customer_city}, ${inv.customer_state}`
                    : "—"}
                </Text>

                <Space style={{ justifyContent: "space-between", width: "100%" }}>
                  <Text strong>
                    ${Number(inv.amount).toFixed(2)}
                  </Text>

                  {inv.paid ? (
                    <Tag color="green">Paid</Tag>
                  ) : (
                    <Tag color="red">Unpaid</Tag>
                  )}
                </Space>

                <Button
                  type="link"
                  style={{ padding: 0 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/invoices/${inv.id}`);
                  }}
                >
                  View Invoice →
                </Button>
              </Space>
            </Card>
          )}
        />
      ) : (
        /* DESKTOP VIEW */
        <Table
          loading={loading}
          dataSource={filteredInvoices}
          rowKey="id"
          onRow={(record) => ({
            onClick: () => navigate(`/invoices/${record.id}`),
          })}
          pagination={{ pageSize: 15 }}
          columns={[
            {
              title: "Invoice #",
              dataIndex: "invoice_number",
              sorter: (a, b) =>
                String(a.invoice_number).localeCompare(
                  String(b.invoice_number)
                ),
            },
            {
              title: "Customer",
              render: (_, record) =>
                record.customer_name || `Customer #${record.customer}`,
            },
            {
              title: "Location",
              render: (_, record) =>
                record.customer_city && record.customer_state
                  ? `${record.customer_city}, ${record.customer_state}`
                  : "—",
            },
            {
              title: "Amount",
              dataIndex: "amount",
              render: (v) => `$${Number(v).toFixed(2)}`,
              sorter: (a, b) => a.amount - b.amount,
            },
            {
              title: "Status",
              dataIndex: "paid",
              render: (paid) =>
                paid ? (
                  <Tag color="green">Paid</Tag>
                ) : (
                  <Tag color="red">Unpaid</Tag>
                ),
            },
            {
              title: "",
              render: (_, record) => (
                <Button
                  type="link"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/invoices/${record.id}`);
                  }}
                >
                  View
                </Button>
              ),
            },
          ]}
        />
      )}
    </Card>
  );
}
