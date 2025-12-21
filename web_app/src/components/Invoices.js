import React, { useEffect, useState } from "react";
import {
  Card,
  Table,
  Tag,
  Typography,
  Input,
  Space,
  Button,
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
    setLoading(true);
    const res = await axios.get(API, {
      headers: { Authorization: `Token ${token}` },
    });
    setInvoices(res.data);
    setLoading(false);
  };

  const filteredInvoices = invoices.filter((inv) => {
    const term = search.toLowerCase();
    return (
      inv.invoice_number.toLowerCase().includes(term) ||
      inv.customer?.toString().includes(term)
    );
  });

  return (
    <Card style={{ maxWidth: 1200, margin: "auto" }}>
      <Space
        style={{ width: "100%", marginBottom: 16 }}
        direction="vertical"
      >
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
              a.invoice_number.localeCompare(b.invoice_number),
          },
          {
            title: "Customer",
            render: (_, record) =>
              record.customer_name ||
              `Customer #${record.customer}`,
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
            render: (v) => `$${v}`,
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
    </Card>
  );
}
