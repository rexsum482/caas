import React, { useEffect, useState } from "react";
import {
  Card,
  Typography,
  DatePicker,
  Button,
  Space,
  Badge,
  message,
  Spin,
  Divider,
} from "antd";
import axios from "axios";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const API = "/api/appointments/";
const START_HOUR = 9;
const END_HOUR = 19;
const HOUR_HEIGHT = 60;

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [pendingAppointments, setPendingAppointments] = useState([]);
  const [date, setDate] = useState(dayjs());
  const [loading, setLoading] = useState(false);

  // -----------------------------
  // Load all appointments
  // -----------------------------
  const loadAppointments = async () => {
    try {
      const res = await axios.get(`${API}?status=A`);
      setAppointments(res.data);
    } catch {
      message.error("Failed to load appointments");
    }
  };

  // -----------------------------
  // Load pending appointments
  // -----------------------------
  const loadPendingAppointments = async () => {
    try {
      const res = await axios.get(`${API}pending/`);
      setPendingAppointments(res.data);
    } catch {
      message.error("Failed to load pending appointments");
    }
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([
      loadAppointments(),
      loadPendingAppointments(),
    ]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  // -----------------------------
  // Accept / Decline
  // -----------------------------
  const updateStatus = async (id, action) => {
    try {
      await axios.post(`${API}${id}/${action}/`);
      message.success(`Appointment ${action}ed`);
      loadAll();
    } catch {
      message.error("Action failed");
    }
  };

  // -----------------------------
  // Filter day appointments
  // -----------------------------
  const dayAppointments = appointments.filter((a) =>
    dayjs(a.start).isSame(date, "day")
  );

  const hours = Array.from(
    { length: END_HOUR - START_HOUR },
    (_, i) => START_HOUR + i
  );

  return (
    <Spin spinning={loading}>
      <Space direction="vertical" size={24} style={{ width: "100%" }}>
        {/* ===========================
            PENDING APPOINTMENTS
           =========================== */}
        <Card>
          <Title level={4}>Pending Appointments</Title>

          {pendingAppointments.length === 0 ? (
            <Text type="secondary">No pending appointments</Text>
          ) : (
            <Space
              direction="vertical"
              size={12}
              style={{ width: "100%" }}
            >
              {pendingAppointments.map((appt) => (
                <Card
                  key={appt.id}
                  size="small"
                  style={{ background: "#fffbe6" }}
                >
                  <Space
                    style={{
                      width: "100%",
                      justifyContent: "space-between",
                    }}
                  >
                    <Space direction="vertical" size={0}>
                      <Text strong>
                        {appt.customer_full_name}
                      </Text>
                      <Text type="secondary">
                        {dayjs(appt.start).format(
                          "MMM D, h:mm A"
                        )}{" "}
                        –{" "}
                        {dayjs(appt.end).format("h:mm A")}
                      </Text>
                    </Space>

                    <Space>
                      <Button
                        type="primary"
                        onClick={() =>
                          updateStatus(appt.id, "accept")
                        }
                      >
                        Accept
                      </Button>
                      <Button
                        danger
                        onClick={() =>
                          updateStatus(appt.id, "decline")
                        }
                      >
                        Decline
                      </Button>
                    </Space>
                  </Space>
                </Card>
              ))}
            </Space>
          )}
        </Card>

        {/* ===========================
            CALENDAR
           =========================== */}
        <Card>
          <Space style={{ marginBottom: 16 }}>
            <Title level={3} style={{ margin: 0 }}>
              Appointment Schedule
            </Title>
            <DatePicker
              value={date}
              onChange={(d) => setDate(d)}
            />
          </Space>

          <Divider />

          <div style={{ display: "flex", borderTop: "1px solid #eee" }}>
            {/* TIME LABELS */}
            <div style={{ width: 70 }}>
              {hours.map((h) => (
                <div
                  key={h}
                  style={{
                    height: HOUR_HEIGHT,
                    paddingTop: 2,
                    textAlign: "right",
                    paddingRight: 8,
                    fontSize: 12,
                    color: "#999",
                  }}
                >
                  {dayjs().hour(h).minute(0).format("h A")}
                </div>
              ))}
            </div>

            {/* DAY COLUMN */}
            <div
              style={{
                position: "relative",
                flex: 1,
                borderLeft: "1px solid #eee",
              }}
            >
              {hours.map((h) => (
                <div
                  key={h}
                  style={{
                    height: HOUR_HEIGHT,
                    borderBottom: "1px solid #f0f0f0",
                  }}
                />
              ))}

              {dayAppointments.map((appt) => {
                const start = dayjs(appt.start);
                const end = dayjs(appt.end);

                const top =
                  ((start.hour() + start.minute() / 60) -
                    START_HOUR) *
                  HOUR_HEIGHT;

                const height =
                  end.diff(start, "minute") *
                  (HOUR_HEIGHT / 60);

                return (
                  <div
                    key={appt.id}
                    style={{
                      position: "absolute",
                      top,
                      left: 8,
                      right: 8,
                      height,
                      background:
                        appt.accepted === "A"
                          ? "#f6ffed"
                          : appt.accepted === "P"
                          ? "#fffbe6"
                          : "#fff1f0",
                      borderRadius: 6,
                      padding: 8,
                    }}
                  >
                    <Space direction="vertical" size={4}>
                      <Text strong>
                        {start.format("h:mm A")} –{" "}
                        {end.format("h:mm A")}
                      </Text>
                      <Text>
                        {appt.customer_full_name}
                      </Text>
                    </Space>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </Space>
    </Spin>
  );
}
