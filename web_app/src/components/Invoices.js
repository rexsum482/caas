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
} from "antd";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const { Title } = Typography;
const { Search } = Input;

const API = "/api/invoices/";

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const token = localStorage.getItem("authToken");
  const navigate = useNavigate();

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
    <Card style={{ maxWidth: 1200, margin: "auto" }}>
      <Space style={{ width: "100%", marginBottom: 16 }} direction="vertical">
        <Title level={3}>Invoices</Title>

        <Search
          placeholder="Search invoice # or customer"
          allowClear
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 300 }}
        />
      </Space>

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
              paid ? <Tag color="green">Paid</Tag> : <Tag color="red">Unpaid</Tag>,
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
    </Card>
  );
}
