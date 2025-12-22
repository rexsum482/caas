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
} from "antd";
import {
  FilePdfOutlined,
  MailOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import { useParams } from "react-router-dom";
import axios from "axios";
import dayjs from "dayjs";
import PartsTable from "../components/invoice/PartsTable";
import LaborTable from "../components/invoice/LaborTable";
import AddPartRow from "../components/invoice/AddPartRow";
import AddLaborRow from "../components/invoice/AddLaborRow";
import InvoiceAdjustments from "../components/invoice/InvoiceAdjustments";

const { Title, Text } = Typography;
const API = "/api";
const COL_DESC_WIDTH = 460;
const COL_QTY_WIDTH = 80;
const COL_PRICE_WIDTH = 120;
const COL_ACTION_WIDTH = 80;

export default function Invoice() {

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
    setLoading(false);
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
          <Text strong>Status:</Text>
          {invoice.paid ? <Tag color="green">Paid</Tag> : <Tag color="red">Unpaid</Tag>}
          <Text strong>Total:</Text>
          <Text>${invoice.amount}</Text>
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
    </Card>
  );
}
function arrayMove(array, from, to) {
  const newArray = array.slice();
  const [movedItem] = newArray.splice(from, 1);
  newArray.splice(to, 0, movedItem);
  return newArray;
}