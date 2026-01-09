import React, { useEffect, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import {
  Card,
  Typography,
  Button,
  Input,
  Select,
  Space,
  message,
  Row,
  Col,
} from "antd";

const { Title, Text } = Typography;
const API = "/api";

export default function PublicAppointmentScheduler() {
  const [weekDays, setWeekDays] = useState([]);
  const [slots, setSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    customer_first_name: "",
    customer_last_name: "",
    customer_email: "",
    customer_phone_number: "",
    customer_street_address: "",
    customer_apt_suite: "",
    customer_city: "",
    customer_state: "TX",
    customer_zip_code: "",
    description: "",
  });

  useEffect(() => {
    const start = dayjs().startOf("week").add(1, "day");
    setWeekDays(Array.from({ length: 7 }, (_, i) => start.add(i, "day")));
  }, []);

  const loadSlots = async (date) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/appointments/available-slots/`, {
        params: { date },
      });
      setSlots(res.data);
    } catch {
      message.error("Failed to load slots");
    } finally {
      setLoading(false);
    }
  };
    const buildStartEnd = (date, time) => {
    const start = dayjs(`${date} ${time}`);
    const end = start.add(1, "hour");

    return {
        start: start.toISOString(),
        end: end.toISOString(),
    };
    };
    const submitAppointment = async () => {
    if (!selectedDate || !selectedTime) {
        return message.error("Please select a date and time");
    }

    const { start, end } = buildStartEnd(selectedDate, selectedTime);

    try {
        await axios.post(`${API}/appointments/`, {
        ...form,
        requested_date: selectedDate,
        requested_time: selectedTime,

        // 👇 explicitly send these
        start,
        end,
        });

        message.success("Appointment request submitted!");
        setSelectedTime(null);
    } catch (err) {
        message.error(err.response?.data?.detail || "Failed to book");
    }
    };


  return (
    <Card style={{ maxWidth: 720, margin: "auto" }}>
      <Title level={3}>Schedule an Appointment</Title>

      <Text>Select a day this week:</Text>
      <Space wrap style={{ marginTop: 8 }}>
        {weekDays.map((d) => (
          <Button
            key={d.format("YYYY-MM-DD")}
            type={selectedDate === d.format("YYYY-MM-DD") ? "primary" : "default"}
            onClick={() => {
              setSelectedDate(d.format("YYYY-MM-DD"));
              loadSlots(d.format("YYYY-MM-DD"));
            }}
          >
            {d.format("ddd MM/DD")}
          </Button>
        ))}
      </Space>

      {slots.length > 0 && (
        <>
          <div style={{ marginTop: 24 }}>
            <Text>Select a time:</Text>
          </div>
          <Space wrap style={{ marginTop: 8 }}>
            {slots.map((s) => (
              <Button
                key={s.time}
                type={selectedTime === s.time ? "primary" : "default"}
                onClick={() => setSelectedTime(s.time)}
              >
                {s.label}
              </Button>
            ))}
          </Space>
        </>
      )}

      <Title level={4} style={{ marginTop: 32 }}>
        Your Information
      </Title>

      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        {/* Name */}
        <Row gutter={16}>
          <Col span={12}>
            <Input
              placeholder="First Name"
              value={form.customer_first_name}
              onChange={(e) =>
                setForm({ ...form, customer_first_name: e.target.value })
              }
            />
          </Col>
          <Col span={12}>
            <Input
              placeholder="Last Name"
              value={form.customer_last_name}
              onChange={(e) =>
                setForm({ ...form, customer_last_name: e.target.value })
              }
            />
          </Col>
        </Row>

        {/* Contact */}
        <Row gutter={16}>
          <Col span={12}>
            <Input
              placeholder="Email"
              value={form.customer_email}
              onChange={(e) =>
                setForm({ ...form, customer_email: e.target.value })
              }
            />
          </Col>
          <Col span={12}>
            <Input
              placeholder="Phone"
              value={form.customer_phone_number}
              onChange={(e) =>
                setForm({ ...form, customer_phone_number: e.target.value })
              }
            />
          </Col>
        </Row>

        {/* Address */}
        <Input
          placeholder="Street Address"
          value={form.customer_street_address}
          onChange={(e) =>
            setForm({ ...form, customer_street_address: e.target.value })
          }
        />

        <Input
          placeholder="Apt / Suite (optional)"
          value={form.customer_apt_suite}
          onChange={(e) =>
            setForm({ ...form, customer_apt_suite: e.target.value })
          }
        />

        {/* City / State / Zip */}
        <Row gutter={16}>
          <Col span={10}>
            <Input
              placeholder="City"
              value={form.customer_city}
              onChange={(e) =>
                setForm({ ...form, customer_city: e.target.value })
              }
            />
          </Col>
          <Col span={7}>
            <Select
              value={form.customer_state}
              style={{ width: "100%" }}
              onChange={(value) =>
                setForm({ ...form, customer_state: value })
              }
            >
              {[
                "AK","AL","AR","AZ","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN",
                "IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV",
                "NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN",
                "TX","UT","VT","VA","WA","WV","WI","WY",
              ].map((s) => (
                <Select.Option key={s} value={s}>
                  {s}
                </Select.Option>
              ))}
            </Select>
          </Col>
          <Col span={7}>
            <Input
              placeholder="Zip Code"
              value={form.customer_zip_code}
              onChange={(e) =>
                setForm({ ...form, customer_zip_code: e.target.value })
              }
            />
          </Col>
        </Row>

        {/* Description */}
        <Input.TextArea
          rows={4}
          placeholder="What do you need done?"
          value={form.description}
          onChange={(e) =>
            setForm({ ...form, description: e.target.value })
          }
        />
      </Space>

      <Button
        type="primary"
        size="large"
        block
        style={{ marginTop: 24 }}
        onClick={submitAppointment}
        loading={loading}
      >
        Submit Appointment Request
      </Button>
    </Card>
  );
}
