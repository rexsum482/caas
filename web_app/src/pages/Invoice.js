import React, { useEffect, useState } from "react";
import {
  Card,
  Table,
  Button,
  Input,
  InputNumber,
  DatePicker,
  Space,
  Divider,
  Typography,
  message,
  Popconfirm,
  Tag,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  FilePdfOutlined,
  MailOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import { useParams } from "react-router-dom";
import axios from "axios";
import dayjs from "dayjs";
import {
  DndContext,
  closestCenter
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";

const { Title, Text } = Typography;
const API = "/api";

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

  const addPart = async () => {
    await axios.post(
      `${API}/parts/`,
      { invoice: id, description: "", quantity: 1, unit_price: 0 },
      { headers }
    );
    fetchInvoice();
  };

  const updatePart = async (partId, field, value) => {
    await axios.patch(
      `${API}/parts/${partId}/`,
      { [field]: value },
      { headers }
    );
    fetchInvoice();
  };

  const deletePart = async (partId) => {
    await axios.delete(`${API}/parts/${partId}/`, { headers });
    fetchInvoice();
  };

  /* ---------- LABOR ---------- */

  const addLabor = async () => {
    await axios.post(
      `${API}/labor/`,
      { invoice: id, description: "", hours: 1, hourly_rate: 0 },
      { headers }
    );
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

  const updateInvoice = async (field, value) => {
    await axios.patch(
      `${API}/invoices/${id}/`,
      { [field]: value },
      { headers }
    );
    fetchInvoice();
  };

  const openPDF = () => {
    window.open(`${API}/invoices/${id}/pdf/`, "_blank");
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
        <DndContext
        collisionDetection={closestCenter}
        onDragEnd={async ({ active, over }) => {
            if (!over || active.id === over.id) return;

            const items = [...invoice.parts];
            const oldIndex = items.findIndex(i => i.id === active.id);
            const newIndex = items.findIndex(i => i.id === over.id);

            const reordered = arrayMove(items, oldIndex, newIndex);

            await Promise.all(
            reordered.map((item, idx) =>
                axios.patch(`${API}/parts/${item.id}/`, { position: idx }, { headers })
            )
            );

            fetchInvoice();
        }}
        >
        <SortableContext
            items={invoice.parts.map(p => p.id)}
            strategy={verticalListSortingStrategy}
        >
        <Table
        dataSource={invoice.parts}
        rowKey="id"
        pagination={false}
        columns={[{
            title: "Part Number / Description",
            render: (_, p) => (
                <Input
                    value={p.description}
                    onChange={(e) =>
                        updatePart(p.id, "description", e.target.value)
                    }
                />
            ),
        },
        {
            title: "Qty",
            width: 80,
            render: (_, p) => (
                <InputNumber
                    min={1}
                    value={p.quantity}
                    onChange={(v) => updatePart(p.id, "quantity", v)}
                />
            ),
        },
        {
            title: "Unit Price",
            render: (_, p) => (
                <InputNumber
                    min={0}
                    value={p.unit_price}
                    onChange={(v) => updatePart(p.id, "unit_price", v)}
                />
            ),
        },
        { title: "Total", dataIndex: "total_price" },
        {
            title: "",
            width: 40,
            render: (_, p) => (
                <Popconfirm 
                    title="Delete part?" 
                    onConfirm={() => deletePart(p.id)}>
                        <DeleteOutlined style={{ color: "red" }} />
                </Popconfirm>
            ),
        },
        ]}
    />
        </SortableContext>
        </DndContext>
        {/* Inline new part row */}
        <Space style={{ marginTop: 8 }}>
        <Input
            placeholder="Part Number / Description"
            value={newPart.description}
            onChange={(e) =>
            setNewPart({ ...newPart, description: e.target.value })
            }
        />
        <InputNumber
            min={1}
            value={newPart.quantity}
            onChange={(v) => setNewPart({ ...newPart, quantity: v })}
        />
        <InputNumber
            min={0}
            value={newPart.unit_price}
            onChange={(v) => setNewPart({ ...newPart, unit_price: v })}
        />
        <Button
            icon={<PlusOutlined />}
            type="primary"
            onClick={async () => {
            if (!newPart.description) return message.warning("Description required");
            await axios.post(`${API}/parts/`, { invoice: id, ...newPart }, { headers });
            setNewPart({ description: "", quantity: 1, unit_price: 0 });
            fetchInvoice();
            }}
        >
            Add
        </Button>
        </Space>


        <Divider />

        {/* ---------- LABOR ---------- */}
        <Title level={4}>Labor</Title>
        <DndContext
        collisionDetection={closestCenter}
        onDragEnd={async ({ active, over }) => {
            if (!over || active.id === over.id) return;

            const items = [...invoice.parts];
            const oldIndex = items.findIndex(i => i.id === active.id);
            const newIndex = items.findIndex(i => i.id === over.id);

            const reordered = arrayMove(items, oldIndex, newIndex);

            await Promise.all(
            reordered.map((item, idx) =>
                axios.patch(`${API}/parts/${item.id}/`, { position: idx }, { headers })
            )
            );

            fetchInvoice();
        }}
        >
        <SortableContext
            items={invoice.parts.map(p => p.id)}
            strategy={verticalListSortingStrategy}
        >
        <Table
        dataSource={invoice.labor}
        rowKey="id"
        pagination={false}
        columns={[
            {
            title: "Description",
            render: (_, l) => (
                <Input
                value={l.description}
                onChange={(e) =>
                    updateLabor(l.id, "description", e.target.value)
                }
                />
            ),
            },
            {
            title: "Hours",
            render: (_, l) => (
                <InputNumber
                min={0}
                value={l.hours}
                onChange={(v) => updateLabor(l.id, "hours", v)}
                />
            ),
            },
            {
            title: "Rate",
            render: (_, l) => (
                <InputNumber
                min={0}
                value={l.hourly_rate}
                onChange={(v) => updateLabor(l.id, "hourly_rate", v)}
                />
            ),
            },
            { title: "Total", dataIndex: "total_price" },
            {
            title: "",
            width: 40,
            render: (_, l) => (
                <Popconfirm title="Delete labor?" onConfirm={() => deleteLabor(l.id)}>
                <DeleteOutlined style={{ color: "red" }} />
                </Popconfirm>
            ),
            },
        ]}
        />
        </SortableContext>
        </DndContext>
        <Space style={{ marginTop: 8 }}>
        <Input
            placeholder="Description"
            value={newLabor.description}
            onChange={(e) =>
            setNewLabor({ ...newLabor, description: e.target.value })
            }
        />
        <InputNumber
            min={0}
            value={newLabor.hours}
            onChange={(v) => setNewLabor({ ...newLabor, hours: v })}
        />
        <InputNumber
            min={0}
            value={newLabor.hourly_rate}
            onChange={(v) => setNewLabor({ ...newLabor, hourly_rate: v })}
        />
        <Button
            icon={<PlusOutlined />}
            type="primary"
            onClick={async () => {
            if (!newLabor.description) return message.warning("Description required");
            await axios.post(`${API}/labor/`, { invoice: id, ...newLabor }, { headers });
            setNewLabor({ description: "", hours: 1, hourly_rate: 0 });
            fetchInvoice();
            }}
        >
            Add
        </Button>
        </Space>
        <Title level={4}>Adjustments</Title>

        <Space>
        <Text>Tax %</Text>
        <InputNumber
            value={invoice.tax_rate}
            onChange={(v) => updateInvoice("tax_rate", v)}
        />

        <Text>Discount</Text>
        <InputNumber
            value={invoice.discount}
            onChange={(v) => updateInvoice("discount", v)}
        />
        </Space>
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