import React, { useEffect, useState } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Select,
  Row,
  Col,
  Divider,
  Table,
  Tag,
  message,
  Modal,
  DatePicker,
  InputNumber,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const { Option } = Select;
const API = "/api/customers/";

const STATES = [
  ["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"], ["AR", "Arkansas"],
  ["CA", "California"], ["CO", "Colorado"], ["CT", "Connecticut"], ["DE", "Delaware"],
  ["FL", "Florida"], ["GA", "Georgia"], ["HI", "Hawaii"], ["ID", "Idaho"],
  ["IL", "Illinois"], ["IN", "Indiana"], ["IA", "Iowa"], ["KS", "Kansas"],
  ["KY", "Kentucky"], ["LA", "Louisiana"], ["ME", "Maine"], ["MD", "Maryland"],
  ["MA", "Massachusetts"], ["MI", "Michigan"], ["MN", "Minnesota"], ["MS", "Mississippi"],
  ["MO", "Missouri"], ["MT", "Montana"], ["NE", "Nebraska"], ["NV", "Nevada"],
  ["NH", "New Hampshire"], ["NJ", "New Jersey"], ["NM", "New Mexico"], ["NY", "New York"],
  ["NC", "North Carolina"], ["ND", "North Dakota"], ["OH", "Ohio"], ["OK", "Oklahoma"],
  ["OR", "Oregon"], ["PA", "Pennsylvania"], ["RI", "Rhode Island"], ["SC", "South Carolina"],
  ["SD", "South Dakota"], ["TN", "Tennessee"], ["TX", "Texas"], ["UT", "Utah"],
  ["VT", "Vermont"], ["VA", "Virginia"], ["WA", "Washington"], ["WV", "West Virginia"],
  ["WI", "Wisconsin"], ["WY", "Wyoming"],
];

export function Customer() {
  const { id } = useParams();
  const [form] = Form.useForm();
  const token = localStorage.getItem("authToken");
  const [invoices, setInvoices] = useState([]);
  const [invoiceModal, setInvoiceModal] = useState(false);
  const [invoiceForm] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get(`${API}${id}/`, {
        headers: { Authorization: `Token ${token}` },
      })
      .then((res) => form.setFieldsValue(res.data));

    axios
      .get(`/api/invoices/?customer=${id}`, {
        headers: { Authorization: `Token ${token}` },
      })
      .then((res) => setInvoices(res.data));
  }, [id]);

  const onFinish = async (values) => {
    await axios.put(`${API}${id}/`, values, {
      headers: { Authorization: `Token ${token}` },
    });
    message.success("Customer updated");
  };

  const createInvoice = async () => {
    await axios.post(
        "/api/invoices/",
        { customer: id },
        { headers: { Authorization: `Token ${token}` } }
    );

    message.success("Invoice created");

    const res = await axios.get(`/api/invoices/?customer=${id}`, {
        headers: { Authorization: `Token ${token}` },
    });
    setInvoices(res.data);
  };
  return (
    <Card title="Customer Profile" style={{ maxWidth: 1100, margin: "auto" }}>
      <Form
        layout="vertical"
        form={form}
        onFinish={onFinish}
        size="large"
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="first_name" label="First Name" rules={[{ required: true }]}>
              <Input maxLength={24} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="last_name" label="Last Name" rules={[{ required: true }]}>
              <Input maxLength={32} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="email" label="Email" rules={[{ type: "email", required: true }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="phone_number" label="Phone">
              <Input maxLength={15} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="street_address" label="Street Address">
          <Input maxLength={128} />
        </Form.Item>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="city" label="City">
              <Input maxLength={128} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="state" label="State">
              <Select allowClear showSearch>
                {STATES.map(([abbr, name]) => (
                  <Option key={abbr} value={abbr}>{abbr} — {name}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="zip_code" label="ZIP">
              <Input maxLength={10} />
            </Form.Item>
          </Col>
        </Row>

        <Button type="primary" htmlType="submit">Save Changes</Button>
      </Form>

      <Divider />

    <Row justify="space-between" align="middle">
      <h3>Invoices</h3>
      <Button
        icon={<PlusOutlined />}
        type="primary"
        onClick={createInvoice}
      >
      New Invoice
      </Button>
    </Row>

    <Table
    dataSource={invoices}
    rowKey="id"
    style={{ marginTop: 16, cursor: "pointer" }}
    onRow={(record) => ({
        onClick: () => {
        navigate(`/invoices/${record.id}`);
        },
    })}
    columns={[
        { title: "Invoice #", dataIndex: "invoice_number" },
        { title: "Issued", dataIndex: "issue_date" },
        { title: "Due", dataIndex: "due_date", render: v => v || "—" },
        { title: "Amount", dataIndex: "amount" },
        {
        title: "Status",
        dataIndex: "paid",
        render: paid =>
            paid ? <Tag color="green">Paid</Tag> : <Tag color="red">Unpaid</Tag>,
        },
    ]}
    />

    </Card>
  );
}
