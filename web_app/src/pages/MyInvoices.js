import React, { useEffect, useState } from "react";
import {
  PageContainer,
  ProTable,
} from "@ant-design/pro-components";
import { Button, Tag, message } from "antd";
import { FilePdfOutlined } from "@ant-design/icons";
import api from "../components/axios";

const API = "/invoices/";

export default function MyInvoices() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const res = await api.get(API);
      setData(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch (err) {
      console.error(err);
      message.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const openPDF = (id) => {
    if (!id) {
      message.error("Invoice ID missing");
      return;
    }
    window.open(`/api/customer-invoices/${id}/`, "_blank");
  };

  const columns = [
    {
      title: "Invoice #",
      dataIndex: "invoice_number",
      sorter: (a, b) =>
        String(a.invoice_number).localeCompare(String(b.invoice_number)),
      render: (val) => <span className="font-medium">#{val}</span>,
    },
    {
      title: "Balance",
      dataIndex: "balance_due",
      sorter: (a, b) => a.balance_due - b.balance_due,
      render: (val) => (
        <span className="font-semibold">
          ${Number(val).toFixed(2)}
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
          <Tag color="orange">Unpaid</Tag>
        ),
    },
    {
      title: "Actions",
      valueType: "option",
      render: (_, record) => [
        <Button
          key="view"
          type="link"
          icon={<FilePdfOutlined />}
          onClick={() => openPDF(record.id)}
        >
          View PDF
        </Button>,
      ],
    },
  ];

  return (
    <PageContainer>
      <div className="max-w-5xl mx-auto">
        <ProTable
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          search={{
            placeholder: "Search invoices...",
            filterType: "light",
          }}
          pagination={{
            pageSize: 10,
          }}
          options={{
            density: true,
            reload: loadInvoices,
          }}
          cardProps={{
            className: "rounded-2xl shadow-md",
          }}
          locale={{
            emptyText: "No invoices found",
          }}
        />
      </div>
    </PageContainer>
  );
}
