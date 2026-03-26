import React, { useEffect, useState } from "react";
import api from "../components/axios";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

import {
  Card,
  Typography,
  Button,
  Input,
  Select,
  Space,
  message,
  Modal,
  Row,
  Col,
  Spin,
} from "antd";
import { getUserProfile } from "../utils/getUserProfile";

const { Title, Text } = Typography;

export default function PublicAppointmentScheduler() {

  const navigate = useNavigate();

  const [weekDays, setWeekDays] = useState([]);
  const [slots, setSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

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

  const loadWeek = async () => {
    try {
      const res = await api.get("/appointments/week-slots/");
      setWeekDays(res.data);
    } catch {
      message.error("Failed to load availability");
    }
  };

  useEffect(() => {
    loadWeek();
  }, []);


  const loadSlots = async (date) => {

    setLoadingSlots(true);

    try {

      const res = await api.get("/appointments/available-slots/", {
        params: { date },
      });

      setSlots(res.data);

    } catch {

      message.error("Failed to load time slots");

    } finally {

      setLoadingSlots(false);

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

    setLoading(true);

    try {

      const fresh = await api.get("/appointments/available-slots/", {
        params: { date: selectedDate },
      });

      const stillAvailable = fresh.data.some(
        (s) => s.time === selectedTime
      );

      if (!stillAvailable) {
        message.warning("That time was just booked. Please choose another.");
        setSlots(fresh.data);
        setSelectedTime(null);
        return;
      }

      await api.post("/appointments/", {
        ...form,
        requested_date: selectedDate,
        requested_time: selectedTime,
        start,
        end,
      });

      message.success("Appointment request submitted!");

      navigate("/");

    } catch (err) {

      if (err.response?.status === 409) {

        const rescheduleUrl = err.response.data.reschedule_url;

        Modal.confirm({
          title: "Appointment Already Exists",
          content:
            "You already have an appointment request. Would you like to reschedule it?",
          okText: "Reschedule",
          cancelText: "Cancel",
          onOk() {
            navigate(rescheduleUrl);
          },
        });

      } else {

        message.error(
          err.response?.data?.detail || "Booking failed"
        );

      }

    } finally {

      setLoading(false);

    }
  };

  useEffect(() => {

    const user = getUserProfile();

    if (!user) return;

    setForm((prev) => ({
      ...prev,
      customer_first_name: user.first_name || "",
      customer_last_name: user.last_name || "",
      customer_email: user.email || "",
      customer_phone_number: user.phone_number || "",
      customer_street_address: user.street_address || "",
      customer_city: user.city || "",
      customer_state: user.state || "TX",
      customer_zip_code: user.zip_code || "",
    }));

  }, []);

  return (
    <Card style={{ maxWidth: 720, margin: "auto" }}>

      <Title level={3}>Schedule an Appointment</Title>

      <Text>Select a day:</Text>

      <Space wrap style={{ marginTop: 8 }}>

        {weekDays.map((d) => {

          const date = dayjs(d.date).format("YYYY-MM-DD");

          return (
            <Button
              key={date}
              disabled={!d.available}
              type={selectedDate === date ? "primary" : "default"}
              onClick={() => {
                setSelectedDate(date);
                setSelectedTime(null);
                loadSlots(date);
              }}
            >
              {dayjs(d.date).format("ddd MM/DD")}
            </Button>
          );
        })}

      </Space>


      {selectedDate && (
        <>
          <div style={{ marginTop: 24 }}>
            <Text>Select a time:</Text>
          </div>

          <div style={{ marginTop: 10 }}>
            {loadingSlots ? (
              <Spin />
            ) : (
              <Space wrap>

                {slots.map((s) => {

                  const now = dayjs();
                  const slotTime = dayjs(`${selectedDate} ${s.time}`);
                  const past = slotTime.isBefore(now);

                  return (
                    <Button
                      key={s.time}
                      disabled={past}
                      type={
                        selectedTime === s.time
                          ? "primary"
                          : "default"
                      }
                      onClick={() => setSelectedTime(s.time)}
                    >
                      {s.label}
                    </Button>
                  );
                })}

              </Space>
            )}
          </div>
        </>
      )}


      <Title level={4} style={{ marginTop: 32 }}>
        Your Information
      </Title>

      <Space direction="vertical" size="middle" style={{ width: "100%" }}>

        <Row gutter={16}>

          <Col span={12}>
            <Input
              placeholder="First Name"
              value={form.customer_first_name}
              onChange={(e) =>
                setForm({
                  ...form,
                  customer_first_name: e.target.value,
                })
              }
            />
          </Col>

          <Col span={12}>
            <Input
              placeholder="Last Name"
              value={form.customer_last_name}
              onChange={(e) =>
                setForm({
                  ...form,
                  customer_last_name: e.target.value,
                })
              }
            />
          </Col>

        </Row>


        <Row gutter={16}>

          <Col span={12}>
            <Input
              placeholder="Email"
              value={form.customer_email}
              onChange={(e) =>
                setForm({
                  ...form,
                  customer_email: e.target.value,
                })
              }
            />
          </Col>

          <Col span={12}>
            <Input
              placeholder="Phone"
              value={form.customer_phone_number}
              onChange={(e) =>
                setForm({
                  ...form,
                  customer_phone_number: e.target.value,
                })
              }
            />
          </Col>

        </Row>


        <Input
          placeholder="Street Address"
          value={form.customer_street_address}
          onChange={(e) =>
            setForm({
              ...form,
              customer_street_address: e.target.value,
            })
          }
        />

        <Input
          placeholder="Apt / Suite"
          value={form.customer_apt_suite}
          onChange={(e) =>
            setForm({
              ...form,
              customer_apt_suite: e.target.value,
            })
          }
        />


        <Row gutter={16}>

          <Col span={10}>
            <Input
              placeholder="City"
              value={form.customer_city}
              onChange={(e) =>
                setForm({
                  ...form,
                  customer_city: e.target.value,
                })
              }
            />
          </Col>

          <Col span={7}>
            <Select
              value={form.customer_state}
              style={{ width: "100%" }}
              onChange={(value) =>
                setForm({
                  ...form,
                  customer_state: value,
                })
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
              placeholder="Zip"
              value={form.customer_zip_code}
              onChange={(e) =>
                setForm({
                  ...form,
                  customer_zip_code: e.target.value,
                })
              }
            />
          </Col>

        </Row>


        <Input.TextArea
          rows={4}
          placeholder="What do you need done?"
          value={form.description}
          onChange={(e) =>
            setForm({
              ...form,
              description: e.target.value,
            })
          }
        />

      </Space>


      <Button
        type="primary"
        size="large"
        block
        style={{ marginTop: 24 }}
        loading={loading}
        onClick={submitAppointment}
      >
        Submit Appointment Request
      </Button>

    </Card>
  );
}
