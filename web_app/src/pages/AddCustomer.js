import React from "react";
import { Form, Input, Button, Card, Select, Row, Col, message } from "antd";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const { Option } = Select;
const API = "/api/customers/";

const STATES = [
  { code: "AK", name: "Alaska" }, { code: "AL", name: "Alabama" }, { code: "AR", name: "Arkansas" },
  { code: "AZ", name: "Arizona" }, { code: "CA", name: "California" }, { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" }, { code: "DE", name: "Delaware" }, { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" }, { code: "HI", name: "Hawaii" }, { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" }, { code: "IN", name: "Indiana" }, { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" }, { code: "KY", name: "Kentucky" }, { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" }, { code: "MD", name: "Maryland" }, { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" }, { code: "MN", name: "Minnesota" }, { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" }, { code: "MT", name: "Montana" }, { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" }, { code: "NH", name: "New Hampshire" }, { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" }, { code: "NY", name: "New York" }, { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" }, { code: "OH", name: "Ohio" }, { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" }, { code: "PA", name: "Pennsylvania" }, { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" }, { code: "SD", name: "South Dakota" }, { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" }, { code: "UT", name: "Utah" }, { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" }, { code: "WA", name: "Washington" }, { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" }, { code: "WY", name: "Wyoming" },
];

export function AddCustomer() {
  const navigate = useNavigate();
  const token = localStorage.getItem("authToken");

  const onFinish = async (values) => {
    try {
      await axios.post(API, values, {
        headers: { Authorization: `Token ${token}` },
      });
      message.success("Customer added successfully");
      navigate("/customers");
    } catch (err) {
      message.error("Failed to add customer");
    }
  };

  return (
    <Card
      title="Add Customer"
      bordered={false}
      style={{ maxWidth: 900, margin: "0 auto" }}
    >
      <Form
        layout="vertical"
        onFinish={onFinish}
        requiredMark="optional"
        size="large"
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="first_name"
              label="First Name"
              rules={[{ required: true, max: 24 }]}
            >
              <Input maxLength={24} showCount />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="last_name"
              label="Last Name"
              rules={[{ required: true, max: 32 }]}
            >
              <Input maxLength={32} showCount />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="email"
              label="Email"
              rules={[{ required: true, type: "email" }]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="phone_number"
              label="Phone"
              rules={[{ max: 15 }]}
            >
              <Input maxLength={15} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="street_address"
          label="Street Address"
          rules={[{ required: true, max: 128 }]}
        >
          <Input maxLength={128} showCount />
        </Form.Item>

        <Form.Item
          name="apt_suite"
          label="Apt / Suite"
          rules={[{ max: 128 }]}
        >
          <Input maxLength={128} showCount />
        </Form.Item>

        <Row gutter={16}>
          <Col span={10}>
            <Form.Item
              name="city"
              label="City"
              rules={[{ required: true, max: 128 }]}
            >
              <Input maxLength={128} showCount />
            </Form.Item>
          </Col>
          <Col span={7}>
            <Form.Item name="state" label="State">
              <Select
                placeholder="Select state"
                allowClear
                showSearch
                optionFilterProp="children"
              >
                {STATES.map((s) => (
                  <Option key={s.code} value={s.code}>
                    {s.code} — {s.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={7}>
            <Form.Item
              name="zip_code"
              label="ZIP Code"
              rules={[{ max: 10 }]}
            >
              <Input maxLength={10} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item style={{ marginTop: 24 }}>
          <Button type="primary" htmlType="submit" block>
            Create Customer
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
