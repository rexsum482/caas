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
import PartsTable from "../components/invoice/PartsTable";
import LaborTable from "../components/invoice/LaborTable";
import AddPartRow from "../components/invoice/AddPartRow";
import AddLaborRow from "../components/invoice/AddLaborRow";
import InvoiceAdjustments from "../components/invoice/InvoiceAdjustments";
import { Modal, InputNumber, Select, List } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { Popconfirm } from "antd";


const { Title, Text } = Typography;
const API = "/api";
const COL_DESC_WIDTH = 460;
const COL_QTY_WIDTH = 80;
const COL_PRICE_WIDTH = 120;
const COL_ACTION_WIDTH = 80;

export default function Invoice() {
  const [payments, setPayments] = useState([]);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
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
  };

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
      payment_date: dayjs().format("YYYY-MM-DD"), // 👈 added
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

  const deletePart = async (partId) => {
    await axios.delete(`${API}/parts/${partId}/`, { headers });
    fetchInvoice();
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

  const deleteLabor = async (laborId) => {
    await axios.delete(`${API}/labor/${laborId}/`, { headers });
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
    await axios.post(`${API}/invoices/${id}/send-email/`, {}, { headers });
    message.success("Invoice sent to customer");
  };

  const copyPortalLink = () => {
    const link = `${window.location.origin}/portal/invoices/${id}`;
    navigator.clipboard.writeText(link);
    message.success("Customer portal link copied");
  };

  if (!invoice) return null;

  return (
    <Card loading={loading} style={{ maxWidth: 1200, margin: "auto" }}>
      <Space direction="vertical" style={{ width: "100%" }} size="large">
        <Title level={3}>Invoice {invoice.invoice_number}</Title>

        <Space>
          <Text strong>Total:</Text> <Text>${invoice.amount}</Text>
          <Text strong>Paid:</Text> <Text>${invoice.total_payments.toFixed(2)}</Text>
          <Text strong>Balance:</Text> 
          <Text type={invoice.balance_due === 0 ? "success" : "danger"}>
            ${invoice.balance_due}
          </Text>
        </Space>

        <Space>
          <Text>Issue:</Text> {invoice.issue_date}
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
  parts={invoice.parts}
  onUpdate={updatePart}
  onDelete={deletePart}
  API={API}
  arrayMove={arrayMove}
  axios={axios}
  fetchInvoice={fetchInvoice}
  headers={headers}
  invoice={invoice}
  COL_ACTION_WIDTH={COL_ACTION_WIDTH}
  COL_DESC_WIDTH={COL_DESC_WIDTH}
  COL_PRICE_WIDTH={COL_PRICE_WIDTH}
  COL_QTY_WIDTH={COL_QTY_WIDTH}
/>
        {/* Inline new part row */}
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
  labor={invoice.labor}
  onUpdate={updateLabor}
  onDelete={deleteLabor}
  API={API}
  arrayMove={arrayMove}
  axios={axios}
  fetchInvoice={fetchInvoice}
  headers={headers}
  invoice={invoice}
  COL_ACTION_WIDTH={COL_ACTION_WIDTH}
  COL_DESC_WIDTH={COL_DESC_WIDTH}
  COL_PRICE_WIDTH={COL_PRICE_WIDTH}
  COL_QTY_WIDTH={COL_QTY_WIDTH}
/>

<AddLaborRow
  value={newLabor}
  onChange={setNewLabor}
  onAdd={() => addLabor(newLabor)}
  COL_ACTION_WIDTH={COL_ACTION_WIDTH}
  COL_DESC_WIDTH={COL_DESC_WIDTH}
  COL_PRICE_WIDTH={COL_PRICE_WIDTH}
  COL_QTY_WIDTH={COL_QTY_WIDTH}
/>
        <Title level={4}>Adjustments</Title>

<InvoiceAdjustments
  tax={invoice.tax_rate}
  discount={invoice.discount}
  onChange={updateInvoice}
/>
<Divider />
<Title level={4}>Payments</Title>

{payments.length === 0 ? (
  <Text type="secondary">No payments recorded</Text>
) : (
<List
  bordered
  dataSource={payments}
  renderItem={(p) => (
    <List.Item>
      <Space
        style={{
          width: "100%",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* Left side */}
        <div>
          <Text strong>${p.amount}</Text>
          <Text type="secondary"> • {p.method}</Text>
          {p.reference && (
            <Text type="secondary"> • {p.reference}</Text>
          )}
        </div>

        {/* Right side */}
        <Space>
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

        {/* Inline new labor row */}
        <Divider />

        {/* ---------- ACTIONS ---------- */}
        <Space>
          <Button icon={<FilePdfOutlined />} onClick={openPDF}>
            View PDF
          </Button>
          <Button icon={<MailOutlined />} onClick={sendEmail}>
            Email Invoice
          </Button>
          <Button icon={<LinkOutlined />} onClick={copyPortalLink}>
            Customer Portal Link
          </Button>
        </Space>
      </Space>
      <Divider />
      <Title level={4}>Payments</Title>
<Space align="center">
  <Text strong>Status:</Text>
  {invoice.paid ? <Tag color="green">Paid</Tag> : <Tag color="red">Unpaid</Tag>}

  <Button
    type={invoice.paid ? "default" : "primary"}
    onClick={togglePaid}
  >
    {invoice.paid ? "Mark Unpaid" : "Mark Paid"}
  </Button>

  <Button onClick={() => setPaymentModalOpen(true)}>
    Add Payment
  </Button>

  <Text strong>Total:</Text>
  <Text>${invoice.amount}</Text>
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
