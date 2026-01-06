import React, { useEffect, useState } from "react";
import { Card, List, Typography, Spin, message, Button } from "antd";
import api from "../components/axios";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;
const API = "/invoices/";

export default function MyInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const res = await api.get(API);
      setInvoices(res.data);
    } catch {
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
  return (
    <Spin spinning={loading}>
      <Title level={3}>My Invoices</Title>

      <div style={{ display: "flex", gap: 24 }}>
        {/* INVOICE LIST */}
        <Card style={{ width: 320 }}>
          <List
            dataSource={invoices}
            locale={{ emptyText: "No invoices found" }}
            renderItem={(inv) => (
              <List.Item
                style={{ cursor: "pointer" }}
                onClick={() => setSelectedInvoice(inv)}
              >
                <List.Item.Meta
                  title={`Invoice #${inv.invoice_number}`}
                  description={
                    <>
                      <Text>
                        Balance: ${inv.balance_due}
                      </Text>
                      <br />
                      <Text type={inv.paid ? "success" : "warning"}>
                        {inv.paid ? "Paid" : "Unpaid"}
                      </Text>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          openPDF(inv.id);
                        }}
                        style={{ margin: "10px" }}
                      >
                        View
                      </Button>
                    </>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      </div>
    </Spin>
  );
}
