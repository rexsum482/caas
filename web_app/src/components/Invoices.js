import React, { useEffect, useState } from "react";
import {
  PageContainer,
  ProTable,
} from "@ant-design/pro-components";
import { Button, Tag, Popconfirm, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API = "/api/invoices/";

export default function Invoices() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

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

      setData(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch (err) {
      console.error(err);
      message.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}${id}/`, {
        headers: { Authorization: `Token ${token}` },
      });

      message.success("Invoice deleted");
      setData((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      console.error(err);
      message.error("Failed to delete invoice");
    }
  };

  const columns = [
    {
      title: "Invoice #",
      dataIndex: "invoice_number",
      sorter: (a, b) =>
        String(a.invoice_number).localeCompare(String(b.invoice_number)),
      render: (val, record) => (
        <span className="font-medium">
          #{val}
        </span>
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
      sorter: (a, b) => a.amount - b.amount,
      render: (v) => (
        <span className="font-semibold">
          ${Number(v).toFixed(2)}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "paid",
      filters: [
        { text: "Paid", value: true },
        { text: "Unpaid", value: false },
      ],
      onFilter: (value, record) => record.paid === value,
      render: (paid) =>
        paid ? (
          <Tag color="green">Paid</Tag>
        ) : (
          <Tag color="red">Unpaid</Tag>
        ),
    },
    {
      title: "Actions",
      valueType: "option",
      render: (_, record) => [
        <Button
          type="link"
          key="view"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/invoices/${record.id}`);
          }}
        >
          View
        </Button>,

        <Popconfirm
          key="delete"
          title="Delete this invoice?"
          description="This action cannot be undone."
          onConfirm={() => handleDelete(record.id)}
        >
          <Button
            danger
            type="link"
            onClick={(e) => e.stopPropagation()}
          >
            Delete
          </Button>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <PageContainer>
      <div className="max-w-6xl mx-auto">
        <ProTable
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          search={{
            placeholder: "Search invoice # or customer",
            filterType: "light",
          }}
          pagination={{
            pageSize: 10,
          }}
          rowClassName="cursor-pointer"
          onRow={(record) => ({
            onClick: () => navigate(`/invoices/${record.id}`),
          })}
          options={{
            density: true,
            fullScreen: true,
            reload: fetchInvoices,
          }}
          cardProps={{
            className: "shadow-md rounded-2xl",
          }}
        />
      </div>
    </PageContainer>
  );
}
