import React, { useEffect, useState, useRef } from "react";
import {
  Card,
  Button,
  DatePicker,
  Space,
  Divider,
  Typography,
  message,
  Tag,
  Input,
} from "antd";
import {
  FilePdfOutlined,
  MailOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import { useParams } from "react-router-dom";
import api from "../components/axios";
import axios from "axios";
import dayjs from "dayjs";
import PartsTable from "../components/tables/PartsTable";
import LaborTable from "../components/tables/LaborTable";
import AddPartRow from "../components/invoice/AddPartRow";
import AddLaborRow from "../components/invoice/AddLaborRow";
import InvoiceAdjustments from "../components/invoice/InvoiceAdjustments";
import { Modal, InputNumber, Select, List } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { Popconfirm } from "antd";
import { Grid, Row, Col } from "antd";

const { useBreakpoint } = Grid;

const { Title, Text } = Typography;
const API = "/api";
const config = window.DJANGO_CONTEXT;

export default function Invoice() {
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const [payments, setPayments] = useState([]);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const CSRFToken = config.csrf_token;
  const [payment, setPayment] = useState({
    amount: null,
    method: "cash",
    reference: "",
    note: "",
  });
  const { id } = useParams();
  const token = localStorage.getItem("authToken");
  const [newPart, setNewPart] = useState({
    description: "",
    quantity: 1,
    unit_price: 0,
  });
  const [newLabor, setNewLabor] = useState({
    description: "",
    hours: 1,
    hourly_rate: 0,
  });
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const headers = {
    Authorization: `Token ${token}`,
    'X-CSRFToken': CSRFToken,
  };
  const COL_DESC_WIDTH = isMobile ? 210 : 460;
  const COL_QTY_WIDTH = isMobile ? 50 : 80;
  const COL_PRICE_WIDTH = isMobile ? 80 : 120;
  const COL_ACTION_WIDTH = 50;
  const fetchInvoice = async () => {
    setLoading(true);

    const res = await axios.get(`${API}/invoices/${id}/`, { headers });
    setInvoice(res.data);
    setPayments(res.data.payments);

    setLoading(false);
  };
const deletePayment = async (paymentId) => {
  await axios.delete(`${API}/payments/${paymentId}/`, { headers });
  message.success("Payment deleted");
  fetchInvoice();
};

const togglePaid = async () => {
  setInvoice(prev => ({ ...prev, paid: !prev.paid }));
  await api.post(`/invoices/${id}/mark_paid/`);
  message.success(invoice.paid ? "Marked unpaid" : "Marked paid");
  fetchInvoice();
};

const submitPayment = async () => {
  if (!payment.amount) {
    return message.error("Payment amount required");
  }

  await axios.post(
    `${API}/payments/`,
    {
      invoice: id,
      payment_date: dayjs().format("YYYY-MM-DD"),
      ...payment,
    },
    { headers }
  );

  message.success("Payment added");
  setPaymentModalOpen(false);
  setPayment({
    amount: null,
    method: "cash",
    reference: "",
    note: "",
  });
  fetchInvoice();
};
  useEffect(() => {
    fetchInvoice();
  }, [id]);

  /* ---------- PARTS ---------- */

const addPart = async (part) => {
  await axios.post(
    `${API}/parts/`,
    {
      invoice: id,
      description: part.description,
      quantity: part.quantity,
      unit_price: part.unit_price,
    },
    { headers }
  );

  setNewPart({ description: "", quantity: 1, unit_price: 0 });
  fetchInvoice();
};

const debouncedPartSave = useDebounce((id, field, value) => {
  axios.patch(`${API}/parts/${id}/`, { [field]: value }, { headers });
});
const updatePart = (partId, field, value) => {
  setInvoice(prev => ({
    ...prev,
    parts: prev.parts.map(p =>
      p.id === partId ? { ...p, [field]: value } : p
    ),
  }));

  debouncedPartSave(partId, field, value);
};

  /* ---------- LABOR ---------- */

const addLabor = async (labor) => {
  await axios.post(
    `${API}/labor/`,
    {
      invoice: id,
      description: labor.description,
      hours: labor.hours,
      hourly_rate: labor.hourly_rate,
    },
    { headers }
  );

  setNewLabor({ description: "", hours: 1, hourly_rate: 0 });
  fetchInvoice();
};

  const updateLabor = async (laborId, field, value) => {
    await axios.patch(
      `${API}/labor/${laborId}/`,
      { [field]: value },
      { headers }
    );
    fetchInvoice();
  };

  /* ---------- INVOICE ACTIONS ---------- */
function useDebounce(fn, delay = 500) {
  const timeout = useRef();

  return (...args) => {
    clearTimeout(timeout.current);
    timeout.current = setTimeout(() => fn(...args), delay);
  };
}
const debouncedInvoiceSave = useDebounce(async (field, value) => {
  await axios.patch(
    `${API}/invoices/${id}/`,
    { [field]: value },
    { headers }
  );

  // fetch updated amount only
  const res = await axios.get(`${API}/invoices/${id}/`, { headers });

  setInvoice(prev => ({
    ...prev,
    amount: res.data.amount,
    tax_rate: res.data.tax_rate,
    discount: res.data.discount,
  }));
});

const updateInvoice = (field, value) => {
  setInvoice(prev => ({
    ...prev,
    [field]: value,
  }));

  debouncedInvoiceSave(field, value);
};


  const openPDF = () => {
    window.open(`${API}/customer-invoices/${id}/`, "_blank");
  };

  const sendEmail = async () => {
    const res = await axios.get(`${API}/invoices/${id}/send_email/?to=${invoice.customer_email}`, { headers } );
    message.success("Invoice sent to customer");
    console.log(res.data);
  };

  const copyPortalLink = () => {
    const link = `${window.location.origin}/portal/invoices/${id}`;
    navigator.clipboard.writeText(link);
    message.success("Customer portal link copied");
  };

  const partsTotal = invoice?.parts?.reduce(
    (sum, p) => sum + (Number(p.quantity) || 0) * (Number(p.unit_price) || 0),
    0
  ) || 0;

  const laborTotal = invoice?.labor?.reduce(
    (sum, l) => sum + (Number(l.hours) || 0) * (Number(l.hourly_rate) || 0),
    0
  ) || 0;

  const formatMoney = (value) =>
    value.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });

  if (!invoice) return null;

  return (
    <Card
      loading={loading}
      style={{
        maxWidth: 1200,
        margin: isMobile ? 0 : "auto",
        padding: isMobile ? 0 : 24,
      }}
    >
      <Space direction="vertical" style={{ width: "100%" }} size="large">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
                <Title level={3}>Invoice #{invoice.invoice_number}</Title>
                <Space wrap>
                  <Text strong>Total:</Text>
                  <Text>${invoice.amount}</Text>

                  <Text strong>Paid:</Text>
                  <Text>${invoice.total_payments.toFixed(2)}</Text>

                  <Text strong>Balance:</Text>
                  <Text type={invoice.balance_due === 0 ? "success" : "danger"}>
                    ${invoice.balance_due}
                  </Text>
                </Space>
            </Col>
          </Row>
        </Space>

        <Space>
          <Text>Issue: {invoice.issue_date}</Text>
          <Text>Due:</Text>
          <DatePicker
            value={invoice.due_date ? dayjs(invoice.due_date) : null}
            onChange={(d) =>
              updateInvoice("due_date", d ? d.format("YYYY-MM-DD") : null)
            }
          />
        </Space>
        <Divider />

        {/* ---------- PARTS ---------- */}
        <Title level={4}>Parts</Title>
        <PartsTable
          invoice={invoice}
          onUpdate={updatePart}
          fetchInvoice={fetchInvoice}
          headers={headers}
          API={API}
          axios={axios}
          arrayMove={(arr, from, to) => {
            const copy = [...arr];
            const item = copy.splice(from, 1)[0];
            copy.splice(to, 0, item);
            return copy;
          }}
        />
<Row justify="end" style={{ marginTop: 8 }}>
  <Col>
    <Text strong>Total Parts Cost:</Text>{" "}
    <Text>{formatMoney(partsTotal)}</Text>
  </Col>
</Row>
<AddPartRow
  value={newPart}
  onChange={setNewPart}
  onAdd={() => addPart(newPart)}
  COL_ACTION_WIDTH={COL_ACTION_WIDTH}
  COL_DESC_WIDTH={COL_DESC_WIDTH}
  COL_PRICE_WIDTH={COL_PRICE_WIDTH}
  COL_QTY_WIDTH={COL_QTY_WIDTH}
/>
        <Divider />
        {/* ---------- LABOR ---------- */}
        <Title level={4}>Labor</Title>
        <LaborTable
          invoice={invoice}
          onUpdate={updateLabor}
          fetchInvoice={fetchInvoice}
          headers={headers}
          API={API}
          axios={axios}
          arrayMove={(arr, from, to) => {
            const copy = [...arr];
            const item = copy.splice(from, 1)[0];
            copy.splice(to, 0, item);
            return copy;
          }}
        />
<Row justify="end" style={{ marginTop: 8 }}>
  <Col>
    <Text strong>Total Labor Cost:</Text>{" "}
    <Text>{formatMoney(laborTotal)}</Text>
  </Col>
</Row>
<AddLaborRow
  value={newLabor}
  onChange={setNewLabor}
  onAdd={() => addLabor(newLabor)}
  COL_ACTION_WIDTH={COL_ACTION_WIDTH}
  COL_DESC_WIDTH={COL_DESC_WIDTH}
  COL_PRICE_WIDTH={COL_PRICE_WIDTH}
  COL_QTY_WIDTH={COL_QTY_WIDTH}
/>
<Divider />

<Row justify="end">
  <Col>
    <Space direction="vertical" align="end">
      <Text>Parts Subtotal: {formatMoney(partsTotal)}</Text>
      <Text>Labor Subtotal: {formatMoney(laborTotal)}</Text>
      <Divider style={{ margin: "8px 0" }} />
      <Text strong>
        Subtotal: {formatMoney(partsTotal + laborTotal)}
      </Text>
    </Space>
  </Col>
</Row>
<Divider />
        <Title level={4}>Adjustments</Title>

<InvoiceAdjustments
  tax={invoice.tax_rate}
  discount={invoice.discount}
  onChange={updateInvoice}
/>
      <Divider />
<Title level={4}>Payments</Title>

<Space direction="vertical" size="middle" style={{ width: "100%" }}>
  {/* ---- PAYMENT STATUS ---- */}
  <Card size="small">
    <Space direction="vertical" size="small">
      <Space>
        <Text strong>Status:</Text>
        {invoice.paid ? (
          <Tag color="green">Paid</Tag>
        ) : (
          <Tag color="red">Unpaid</Tag>
        )}
      </Space>

      <Text strong>Total Invoice Amount: ${formatMoney(invoice.amount)}</Text>
    </Space>
  </Card>

  {/* ---- PAYMENT ACTIONS ---- */}
  <Card size="small">
    <Space
      direction={isMobile ? "vertical" : "horizontal"}
      style={{ width: "100%" }}
    >
      <Button
        type={invoice.paid ? "default" : "primary"}
        block={isMobile}
        onClick={togglePaid}
      >
        {invoice.paid ? "Mark Unpaid" : "Mark Paid"}
      </Button>

      <Button
        block={isMobile}
        type="dashed"
        onClick={() => setPaymentModalOpen(true)}
      >
        Add Payment
      </Button>
    </Space>
  </Card>

  {/* ---- PAYMENT LIST ---- */}
  <Card size="small">
    {payments.length === 0 ? (
      <Text type="secondary">No payments recorded</Text>
    ) : (
      <List
        itemLayout="vertical"
        dataSource={payments}
        renderItem={(p) => (
          <List.Item>
            <Space direction="vertical" style={{ width: "100%" }}>
              <Space wrap>
                <Text strong>${formatMoney(p.amount)}</Text>
                <Tag>{p.method}</Tag>
              </Space>

              {p.reference && (
                <Text type="secondary">Reference: {p.reference}</Text>
              )}

              <Space
                style={{
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                <Text type="secondary">
                  {dayjs(p.payment_date || p.date).format("MM/DD/YYYY")}
                </Text>

                <Popconfirm
                  title="Delete payment?"
                  description="This action cannot be undone."
                  okText="Delete"
                  okType="danger"
                  cancelText="Cancel"
                  onConfirm={() => deletePayment(p.id)}
                >
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                  />
                </Popconfirm>
              </Space>
            </Space>
          </List.Item>
        )}
      />
    )}
  </Card>
</Space>
        <Divider />
<Space
  direction={isMobile ? "vertical" : "horizontal"}
  style={{ width: isMobile ? "100%" : "auto" }}
>
  <Button block={isMobile} icon={<FilePdfOutlined />} onClick={openPDF}>
    View PDF
  </Button>

  <Button block={isMobile} icon={<MailOutlined />} onClick={sendEmail}>
    Email Invoice
  </Button>

  <Button block={isMobile} icon={<LinkOutlined />} onClick={copyPortalLink}>
    Customer Portal Link
  </Button>
</Space>
<Modal
  title="Add Payment"
  open={paymentModalOpen}
  onCancel={() => setPaymentModalOpen(false)}
  onOk={submitPayment}
  okText="Add Payment"
>
  <Space direction="vertical" style={{ width: "100%" }}>
    <InputNumber
      style={{ width: "100%" }}
      placeholder="Amount"
      min={0}
      value={payment.amount}
      onChange={(v) => setPayment({ ...payment, amount: v })}
    />

<Select
  style={{ width: "100%" }}
  value={payment.method}
  onChange={(v) => setPayment({ ...payment, method: v })}
>
      <Select.Option value="cash">Cash</Select.Option>
      <Select.Option value="card">Card</Select.Option>
      <Select.Option value="check">Check</Select.Option>
      <Select.Option value="online">Online</Select.Option>
    </Select>

    <Input
      placeholder="Reference (optional)"
      value={payment.reference}
      onChange={(e) =>
        setPayment({ ...payment, reference: e.target.value })
      }
    />

    <Input.TextArea
      placeholder="Notes (optional)"
      rows={3}
      value={payment.note}
      onChange={(e) =>
        setPayment({ ...payment, note: e.target.value })
      }
    />
  </Space>
</Modal>

    </Card>

  );
}
function arrayMove(array, from, to) {
  const newArray = array.slice();
  const [movedItem] = newArray.splice(from, 1);
  newArray.splice(to, 0, movedItem);
  return newArray;
}
