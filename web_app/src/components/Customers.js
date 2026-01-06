import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Popconfirm,
  message,
  Card,
  Space,
  Typography,
  List,
  Grid,
} from "antd";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const API = "/api/customers/";

export function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem("authToken");
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API, {
        headers: { Authorization: `Token ${token}` },
      });
      setCustomers(res.data || []);
    } catch {
      message.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  const deleteCustomer = async (id) => {
    try {
      await axios.delete(`${API}${id}/`, {
        headers: { Authorization: `Token ${token}` },
      });
      message.success("Customer deleted");
      fetchCustomers();
    } catch {
      message.error("Delete failed");
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const columns = [
    {
      title: "Name",
      render: (_, r) => `${r.first_name} ${r.last_name}`,
    },
    {
      title: "Email",
      dataIndex: "email",
    },
    {
      title: "Phone",
      dataIndex: "phone_number",
    },
    {
      title: "Actions",
      render: (_, r) => (
        <Space>
          <Button onClick={() => navigate(`/customers/${r.id}`)}>View</Button>
          <Popconfirm
            title="Delete this customer?"
            onConfirm={() => deleteCustomer(r.id)}
          >
            <Button danger>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card style={{ maxWidth: 1200, margin: "auto" }}>
      <Space
        style={{ width: "100%", marginBottom: 16 }}
        direction={isMobile ? "vertical" : "horizontal"}
      >
        <Title level={3} style={{ margin: 0 }}>
          Customers
        </Title>

        <Button
          type="primary"
          onClick={() => navigate("/customers/add")}
        >
          Add Customer
        </Button>
      </Space>

      {/* MOBILE VIEW */}
      {isMobile ? (
        <List
          loading={loading}
          dataSource={customers}
          locale={{ emptyText: "No customers found" }}
          renderItem={(c) => (
            <Card
              key={c.id}
              style={{ marginBottom: 12 }}
              hoverable
              onClick={() => navigate(`/customers/${c.id}`)}
            >
              <Space
                direction="vertical"
                size={4}
                style={{ width: "100%" }}
              >
                <Text strong>
                  {c.first_name} {c.last_name}
                </Text>

                <Text type="secondary">{c.email}</Text>
                <Text>{c.phone_number || "—"}</Text>

                <Space style={{ marginTop: 8 }}>
                  <Button
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/customers/${c.id}`);
                    }}
                  >
                    View
                  </Button>

                  <Popconfirm
                    title="Delete this customer?"
                    onConfirm={() => deleteCustomer(c.id)}
                  >
                    <Button
                      size="small"
                      danger
                      onClick={(e) => e.stopPropagation()}
                    >
                      Delete
                    </Button>
                  </Popconfirm>
                </Space>
              </Space>
            </Card>
          )}
        />
      ) : (
        /* DESKTOP VIEW */
        <Table
          loading={loading}
          rowKey="id"
          columns={columns}
          dataSource={customers}
        />
      )}
    </Card>
  );
}
